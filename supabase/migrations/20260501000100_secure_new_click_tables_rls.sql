alter table public.site_offer_clicks enable row level security;
alter table public.platform_clicks enable row level security;

drop policy if exists "site_offer_clicks: anon insert" on public.site_offer_clicks;
create policy "site_offer_clicks: anon insert"
  on public.site_offer_clicks
  for insert
  with check (true);

drop policy if exists "site_offer_clicks: admin read" on public.site_offer_clicks;
create policy "site_offer_clicks: admin read"
  on public.site_offer_clicks
  for select
  using (public.get_my_role() = 'admin');

drop policy if exists "platform_clicks: anon insert" on public.platform_clicks;
create policy "platform_clicks: anon insert"
  on public.platform_clicks
  for insert
  with check (true);

drop policy if exists "platform_clicks: admin read" on public.platform_clicks;
create policy "platform_clicks: admin read"
  on public.platform_clicks
  for select
  using (public.get_my_role() = 'admin');
