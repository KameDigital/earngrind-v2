-- The public offers route uses the anonymous Supabase client and the
-- security-invoker search_public_offers RPC. Its view directly reads these
-- five public-catalog relations. Existing RLS policies already limit the
-- visible rows; this restores only missing Data API read grants after a clean
-- local replay. No write privileges are added.
grant select on table public.offers, public.games, public.platforms,
  public.site_offers, public.providers to anon, authenticated;
