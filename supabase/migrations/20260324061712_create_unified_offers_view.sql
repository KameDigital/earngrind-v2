
-- unified_offers_view: unions ingested offers (active_offers_view) with manual site_offers
-- Matches the full column shape of active_offers_view + adds source/goal_text/provider columns
CREATE OR REPLACE VIEW unified_offers_view AS

  -- ── Ingested offers (from existing active_offers_view) ─────────────────────
  SELECT
    o.id,
    'ingested'::text                                        AS source,
    o.title,
    o.payout_usd,
    o.payout_type::text                                     AS payout_type,
    o.devices,
    o.countries,
    o.category,
    o.status::text                                          AS status,
    o.is_featured,
    o.is_ath,
    o.is_new,
    o.is_hot,
    o.is_boosted,
    o.heat_score,
    o.custom_param,
    o.offer_expires_at,
    o.updated_at,
    -- offer delivery
    ('/go/' || o.id)                                        AS offer_url,
    NULL::text                                              AS goal_text,
    -- game
    g.id                                                    AS game_id,
    g.name                                                  AS game_name,
    g.slug                                                  AS game_slug,
    g.thumbnail_url                                         AS game_thumbnail,
    g.devices                                               AS game_devices,
    -- platform (offerwall/gpt site that hosts it)
    p.id                                                    AS platform_id,
    p.name                                                  AS platform_name,
    p.slug                                                  AS platform_slug,
    p.logo_url                                              AS platform_logo,
    p.platform_kind,
    p.affiliate_template,
    -- provider (N/A for ingested)
    NULL::uuid                                              AS provider_id,
    NULL::text                                              AS provider_name,
    -- fts: reuse the column from offers if present, else build
    to_tsvector('english',
      coalesce(g.name, '') || ' ' ||
      coalesce(o.title, '') || ' ' ||
      coalesce(p.name, '')
    )                                                       AS fts
  FROM offers o
  JOIN games     g ON g.id = o.game_id
  JOIN platforms p ON p.id = o.platform_id
  WHERE o.status = 'active'

UNION ALL

  -- ── Manual site offers ─────────────────────────────────────────────────────
  SELECT
    so.id,
    'manual'::text                                          AS source,
    so.title,
    so.payout_usd,
    NULL::text                                              AS payout_type,
    so.devices,
    so.countries,
    NULL::text                                              AS category,
    so.status::text                                         AS status,
    false                                                   AS is_featured,
    false                                                   AS is_ath,
    false                                                   AS is_new,
    false                                                   AS is_hot,
    false                                                   AS is_boosted,
    0                                                       AS heat_score,
    NULL::text                                              AS custom_param,
    NULL::timestamptz                                       AS offer_expires_at,
    so.updated_at,
    -- offer delivery: direct link
    so.offer_url                                            AS offer_url,
    so.goal_text,
    -- game
    g.id                                                    AS game_id,
    g.name                                                  AS game_name,
    g.slug                                                  AS game_slug,
    g.thumbnail_url                                         AS game_thumbnail,
    g.devices                                               AS game_devices,
    -- platform = GPT site (e.g. Gain.gg)
    p.id                                                    AS platform_id,
    p.name                                                  AS platform_name,
    p.slug                                                  AS platform_slug,
    p.logo_url                                              AS platform_logo,
    p.platform_kind,
    NULL::text                                              AS affiliate_template,
    -- provider = offerwall (e.g. Torox)
    pr.id                                                   AS provider_id,
    pr.name                                                 AS provider_name,
    -- fts for search
    to_tsvector('english',
      coalesce(g.name, '') || ' ' ||
      coalesce(so.title, '') || ' ' ||
      coalesce(so.goal_text, '') || ' ' ||
      coalesce(p.name, '') || ' ' ||
      coalesce(pr.name, '')
    )                                                       AS fts
  FROM site_offers so
  JOIN games     g  ON g.id  = so.game_id
  JOIN platforms p  ON p.id  = so.site_id
  JOIN providers pr ON pr.id = so.provider_id
  WHERE so.status = 'active';

-- Grant anon/service_role read access (RLS is on base tables, view inherits)
GRANT SELECT ON unified_offers_view TO anon, authenticated;
;
