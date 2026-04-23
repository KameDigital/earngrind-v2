
-- ---------------------------------------------------------------------------
-- ingestion_runs: one row per provider run, written by the Edge Function.
-- Kept minimal — no raw offer payloads stored.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingestion_runs (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_slug   text        NOT NULL,
    started_at      timestamptz NOT NULL DEFAULT now(),
    completed_at    timestamptz,
    status          text        NOT NULL DEFAULT 'running'
                                CHECK (status IN ('running','success','partial','failed')),
    -- normalizer-side counts (sent from worker)
    fetched         int         NOT NULL DEFAULT 0,
    accepted        int         NOT NULL DEFAULT 0,
    rejected        int         NOT NULL DEFAULT 0,
    unmatched_game  int         NOT NULL DEFAULT 0,
    -- Edge Function DB-side counts
    inserted        int         NOT NULL DEFAULT 0,
    updated         int         NOT NULL DEFAULT 0,
    expired         int         NOT NULL DEFAULT 0,
    errors          int         NOT NULL DEFAULT 0,
    -- free-text slot for error message or a brief note
    message         text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- fast lookups by recency and platform
CREATE INDEX IF NOT EXISTS ingestion_runs_platform_idx
    ON ingestion_runs (platform_slug, started_at DESC);

CREATE INDEX IF NOT EXISTS ingestion_runs_started_at_idx
    ON ingestion_runs (started_at DESC);

-- RLS: table is server-side only (accessed via service-role key).
-- No policies needed — anon + authenticated roles never touch this table.
ALTER TABLE ingestion_runs ENABLE ROW LEVEL SECURITY;
;
