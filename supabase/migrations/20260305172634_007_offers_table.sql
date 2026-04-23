
CREATE TABLE public.offers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id          UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  platform_id      UUID NOT NULL REFERENCES public.platforms(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  payout_usd       NUMERIC(10,2) NOT NULL CHECK (payout_usd >= 0),
  payout_type      payout_type   NOT NULL DEFAULT 'online_cashback',
  devices          device_type[] DEFAULT '{}',
  countries        TEXT[]        DEFAULT '{}',
  category         TEXT,
  status           offer_status  NOT NULL DEFAULT 'active',
  is_featured      BOOLEAN       NOT NULL DEFAULT FALSE,
  is_ath           BOOLEAN       NOT NULL DEFAULT FALSE,
  is_new           BOOLEAN       NOT NULL DEFAULT FALSE,
  is_hot           BOOLEAN       NOT NULL DEFAULT FALSE,
  is_boosted       BOOLEAN       NOT NULL DEFAULT FALSE,
  heat_score       INT           NOT NULL DEFAULT 0,
  custom_param     TEXT,
  offer_expires_at TIMESTAMPTZ,
  external_id      TEXT,
  ingested_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  fts              TSVECTOR,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION offers_fts_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.fts := to_tsvector('english',
    coalesce(NEW.title, '') || ' ' || coalesce(NEW.category, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_offers_fts
  BEFORE INSERT OR UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION offers_fts_update();

CREATE INDEX idx_offers_game_id       ON public.offers(game_id);
CREATE INDEX idx_offers_platform_id   ON public.offers(platform_id);
CREATE INDEX idx_offers_status        ON public.offers(status);
CREATE INDEX idx_offers_payout_desc   ON public.offers(payout_usd DESC) WHERE status = 'active';
CREATE INDEX idx_offers_heat          ON public.offers(heat_score DESC) WHERE status = 'active';
CREATE INDEX idx_offers_is_new        ON public.offers(is_new) WHERE is_new = TRUE;
CREATE INDEX idx_offers_is_ath        ON public.offers(is_ath) WHERE is_ath = TRUE;
CREATE INDEX idx_offers_countries     ON public.offers USING GIN(countries);
CREATE INDEX idx_offers_devices       ON public.offers USING GIN(devices);
CREATE INDEX idx_offers_fts           ON public.offers USING GIN(fts);
CREATE INDEX idx_offers_active_payout ON public.offers(status, payout_usd DESC, game_id);
CREATE UNIQUE INDEX idx_offers_platform_external ON public.offers(platform_id, external_id)
  WHERE external_id IS NOT NULL;
;
