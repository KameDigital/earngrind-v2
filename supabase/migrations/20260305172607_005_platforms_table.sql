
CREATE TABLE public.platforms (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  slug               TEXT UNIQUE NOT NULL,
  platform_kind      platform_kind NOT NULL,
  logo_url           TEXT,
  description        TEXT,
  countries          TEXT[]       DEFAULT '{}',
  payout_methods     TEXT[]       DEFAULT '{}',
  minimum_payout     NUMERIC(10,2),
  affiliate_template TEXT,
  trust_score        NUMERIC(3,1) CHECK (trust_score BETWEEN 0 AND 5),
  is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
  license            TEXT[]       DEFAULT '{}',
  bonus_headline     TEXT,
  wagering_req       TEXT,
  review_id          UUID,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_platforms_updated_at
  BEFORE UPDATE ON public.platforms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_platforms_kind   ON public.platforms(platform_kind);
CREATE INDEX idx_platforms_active ON public.platforms(is_active) WHERE is_active = TRUE;
;
