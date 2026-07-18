CREATE TABLE public.homepage_featured_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL,
  offer_source text NOT NULL CHECK (offer_source IN ('ingested', 'manual')),
  is_active boolean NOT NULL DEFAULT true,
  display_priority integer NOT NULL DEFAULT 100,
  badge text,
  placement text NOT NULL DEFAULT 'weekly_top_games' CHECK (placement IN ('weekly_top_games', 'hero', 'seasonal', 'sponsored')),
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (offer_id, offer_source)
);
CREATE TABLE public.homepage_featured_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  display_limit integer NOT NULL DEFAULT 8 CHECK (display_limit BETWEEN 1 AND 24),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.homepage_featured_settings (id, display_limit) VALUES (true, 8);
CREATE INDEX homepage_featured_offers_public_order_idx ON public.homepage_featured_offers (placement, is_active, display_priority, created_at);
ALTER TABLE public.homepage_featured_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_featured_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homepage featured offers public active read" ON public.homepage_featured_offers FOR SELECT USING (is_active AND (starts_at IS NULL OR starts_at <= now()) AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "homepage featured offers admin editor manage" ON public.homepage_featured_offers FOR ALL USING (get_my_role() = ANY (ARRAY['admin'::user_role, 'editor'::user_role])) WITH CHECK (get_my_role() = ANY (ARRAY['admin'::user_role, 'editor'::user_role]));
CREATE POLICY "homepage featured settings public read" ON public.homepage_featured_settings FOR SELECT USING (true);
CREATE POLICY "homepage featured settings admin editor manage" ON public.homepage_featured_settings FOR ALL USING (get_my_role() = ANY (ARRAY['admin'::user_role, 'editor'::user_role])) WITH CHECK (get_my_role() = ANY (ARRAY['admin'::user_role, 'editor'::user_role]));
GRANT SELECT ON public.homepage_featured_offers, public.homepage_featured_settings TO anon, authenticated;
