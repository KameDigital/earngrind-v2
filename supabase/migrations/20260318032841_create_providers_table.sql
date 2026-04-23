
-- ── providers table ───────────────────────────────────────────────────────────
-- Represents offerwall/provider layer (Torox, RevU, OGAds, etc.)
-- Separate from platforms (GPT sites like EarnLab, Swagbucks).
-- This is the foundation for site-specific offer comparison.
CREATE TABLE providers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        NOT NULL UNIQUE,
  name        text        NOT NULL,
  logo_url    text,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Public read access (same pattern as platforms)
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "providers: public read active"
  ON providers FOR SELECT
  USING (is_active = true);

CREATE POLICY "providers: admin all"
  ON providers FOR ALL
  USING (get_my_role() = 'admin'::user_role);

-- ── Seed known providers ──────────────────────────────────────────────────────
INSERT INTO providers (slug, name) VALUES
  ('torox',        'Torox'),
  ('revu',         'RevU'),
  ('ogads',        'OGAds'),
  ('adgate-media', 'Adgate Media'),
  ('offertoro',    'OfferToro');
;
