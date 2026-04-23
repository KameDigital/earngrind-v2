
CREATE TABLE public.user_bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('offer','guide','review','casino','blog_post')),
  entity_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, entity_type, entity_id)
);
CREATE INDEX idx_bookmarks_user ON public.user_bookmarks(user_id);

CREATE TABLE public.user_completions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id        UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  status          completion_status NOT NULL DEFAULT 'started',
  payout_received NUMERIC(10,2),
  notes           TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, offer_id)
);
CREATE TRIGGER trg_completions_updated_at
  BEFORE UPDATE ON public.user_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_completions_user ON public.user_completions(user_id);

CREATE TABLE public.offer_alerts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id    UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  alert_type alert_type NOT NULL,
  is_active  BOOLEAN    NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id, alert_type)
);
CREATE INDEX idx_alerts_user ON public.offer_alerts(user_id);
CREATE INDEX idx_alerts_game ON public.offer_alerts(game_id);

CREATE TABLE public.user_saved_comparisons (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  offer_ids  UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
;
