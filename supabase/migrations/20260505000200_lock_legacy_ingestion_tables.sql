-- Legacy ingestion tables are worker/service-role only.
-- They should not be readable or mutable through the public Supabase Data API.

revoke all on table public.raw_offers from anon;
revoke all on table public.raw_offers from authenticated;
alter table public.raw_offers enable row level security;

revoke all on table public.sources from anon;
revoke all on table public.sources from authenticated;
alter table public.sources enable row level security;

revoke all on table public.import_runs from anon;
revoke all on table public.import_runs from authenticated;
alter table public.import_runs enable row level security;
