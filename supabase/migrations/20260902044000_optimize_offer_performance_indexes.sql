-- Migration to add high-performance indexes on site_offers and site_offer_tasks for instant country filtering, task lookups and sorting
CREATE INDEX IF NOT EXISTS idx_site_offers_countries_gin ON public.site_offers USING gin (countries);
CREATE INDEX IF NOT EXISTS idx_site_offers_status_payout ON public.site_offers (status, payout_usd DESC);
CREATE INDEX IF NOT EXISTS idx_site_offers_completion ON public.site_offers (completion_count DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_site_offers_game_id ON public.site_offers (game_id);
CREATE INDEX IF NOT EXISTS idx_site_offer_tasks_offer_id ON public.site_offer_tasks (site_offer_id, sort_order);
