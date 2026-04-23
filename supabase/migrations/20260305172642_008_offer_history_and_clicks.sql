
CREATE TABLE public.offer_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id    UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  payout_usd  NUMERIC(10,2) NOT NULL,
  recorded_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  source      TEXT          NOT NULL DEFAULT 'scraper'
);
CREATE INDEX idx_offer_history_offer_id ON public.offer_history(offer_id);
CREATE INDEX idx_offer_history_recorded ON public.offer_history(offer_id, recorded_at DESC);

CREATE TABLE public.offer_clicks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id   UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash    TEXT,
  referrer   TEXT,
  user_agent TEXT,
  country    TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_offer_clicks_offer_id ON public.offer_clicks(offer_id);
CREATE INDEX idx_offer_clicks_recent   ON public.offer_clicks(offer_id, clicked_at DESC);
;
