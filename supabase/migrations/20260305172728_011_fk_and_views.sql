
-- Back-fill FK: platforms.review_id -> reviews.id
ALTER TABLE public.platforms
  ADD CONSTRAINT fk_platforms_review
  FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE SET NULL;

-- active_offers_view: denormalized for API (avoids joins in handler)
CREATE OR REPLACE VIEW public.active_offers_view AS
SELECT
  o.id,
  o.title,
  o.payout_usd,
  o.payout_type,
  o.devices,
  o.countries,
  o.category,
  o.status,
  o.is_featured,
  o.is_ath,
  o.is_new,
  o.is_hot,
  o.is_boosted,
  o.heat_score,
  o.custom_param,
  o.offer_expires_at,
  o.updated_at,
  g.id            AS game_id,
  g.name          AS game_name,
  g.slug          AS game_slug,
  g.thumbnail_url AS game_thumbnail,
  g.devices       AS game_devices,
  p.id            AS platform_id,
  p.name          AS platform_name,
  p.slug          AS platform_slug,
  p.logo_url      AS platform_logo,
  p.platform_kind,
  p.affiliate_template
FROM public.offers o
JOIN public.games     g ON g.id = o.game_id
JOIN public.platforms p ON p.id = o.platform_id
WHERE o.status = 'active';

-- payout_max_by_game: for game pages hero stats
CREATE MATERIALIZED VIEW public.payout_max_by_game AS
SELECT
  game_id,
  COUNT(*)        AS offer_count,
  MAX(payout_usd) AS max_payout_usd,
  AVG(payout_usd) AS avg_payout_usd,
  MIN(payout_usd) AS min_payout_usd
FROM public.offers
WHERE status = 'active'
GROUP BY game_id
WITH DATA;

CREATE UNIQUE INDEX idx_payout_max_by_game ON public.payout_max_by_game(game_id);

CREATE OR REPLACE FUNCTION refresh_payout_summary() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.payout_max_by_game;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
;
