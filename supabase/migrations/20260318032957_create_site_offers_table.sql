
-- ── site_offers ───────────────────────────────────────────────────────────────
-- Stores site-specific offer payouts for the 3-level hierarchy:
--   GPT site (platforms) → offerwall (providers) → game → payout
--
-- Parallel to the existing `offers` table — does NOT replace it.
-- The unique constraint on (site_id, provider_id, external_id) ensures
-- one row per offer per site, enabling safe upsert ingestion.

CREATE TABLE site_offers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The 3-level hierarchy
  site_id     uuid        NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  provider_id uuid        NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  game_id     uuid        NOT NULL REFERENCES games(id)     ON DELETE CASCADE,

  -- Provider's identifier for this offer (used for dedup)
  external_id text        NOT NULL,

  title       text        NOT NULL,
  payout_usd  numeric     NOT NULL CHECK (payout_usd >= 0),

  -- Optional: site-specific goal text ("Reach Town Hall 10")
  goal_text   text,

  devices     device_type[]  NOT NULL DEFAULT '{}',
  countries   text[]         NOT NULL DEFAULT '{}',

  status      offer_status   NOT NULL DEFAULT 'active',

  -- Deep link to the offer on that specific site
  offer_url   text,

  ingested_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  -- One row per offer per site (provider scopes the external_id namespace)
  UNIQUE (site_id, provider_id, external_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Primary query pattern: find all active offers for a game, ranked by payout
CREATE INDEX idx_site_offers_game_status_payout
  ON site_offers (game_id, status, payout_usd DESC);

-- Secondary: all active offers for a specific site
CREATE INDEX idx_site_offers_site_status
  ON site_offers (site_id, status);

-- Secondary: all offers from a specific provider (cross-site analysis)
CREATE INDEX idx_site_offers_provider_status
  ON site_offers (provider_id, status);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE site_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_offers: public read active"
  ON site_offers FOR SELECT
  USING (status = 'active');

CREATE POLICY "site_offers: admin all"
  ON site_offers FOR ALL
  USING (get_my_role() = 'admin'::user_role);

CREATE POLICY "site_offers: editor insert"
  ON site_offers FOR INSERT
  WITH CHECK (get_my_role() = ANY (ARRAY['admin'::user_role, 'editor'::user_role]));

CREATE POLICY "site_offers: editor update"
  ON site_offers FOR UPDATE
  USING (get_my_role() = ANY (ARRAY['admin'::user_role, 'editor'::user_role]));
;
