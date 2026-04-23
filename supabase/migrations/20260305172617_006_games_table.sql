
CREATE TABLE public.games (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  aliases       TEXT[]        DEFAULT '{}',
  devices       device_type[] DEFAULT '{}',
  category      TEXT,
  thumbnail_url TEXT,
  description   TEXT,
  fts           TSVECTOR,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION games_fts_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.fts := to_tsvector('english',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(array_to_string(NEW.aliases, ' '), '') || ' ' ||
    coalesce(NEW.category, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_games_fts
  BEFORE INSERT OR UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION games_fts_update();

CREATE INDEX idx_games_name_trgm ON public.games USING GIN(name gin_trgm_ops);
CREATE INDEX idx_games_aliases   ON public.games USING GIN(aliases);
CREATE INDEX idx_games_fts       ON public.games USING GIN(fts);
;
