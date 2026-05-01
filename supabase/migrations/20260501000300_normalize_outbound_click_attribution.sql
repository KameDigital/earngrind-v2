alter table public.offer_clicks
  add column if not exists offer_title text,
  add column if not exists game_title text,
  add column if not exists platform_id uuid references public.platforms(id) on delete set null,
  add column if not exists platform_name text,
  add column if not exists provider_name text,
  add column if not exists payout_usd numeric,
  add column if not exists total_payout_usd numeric,
  add column if not exists click_location text,
  add column if not exists source_context text,
  add column if not exists destination_url text,
  add column if not exists affiliate_mode text,
  add column if not exists client_hints jsonb;

alter table public.site_offer_clicks
  add column if not exists offer_title text,
  add column if not exists game_title text,
  add column if not exists platform_id uuid references public.platforms(id) on delete set null,
  add column if not exists platform_name text,
  add column if not exists provider_name text,
  add column if not exists payout_usd numeric,
  add column if not exists total_payout_usd numeric,
  add column if not exists click_location text,
  add column if not exists source_context text,
  add column if not exists destination_url text,
  add column if not exists affiliate_mode text,
  add column if not exists client_hints jsonb;

alter table public.platform_clicks
  add column if not exists total_payout_usd numeric,
  add column if not exists client_hints jsonb;

create index if not exists idx_offer_clicks_clicked_at
  on public.offer_clicks(clicked_at desc);

create index if not exists idx_offer_clicks_source_context_clicked_at
  on public.offer_clicks(source_context, clicked_at desc);

create index if not exists idx_offer_clicks_platform_clicked_at
  on public.offer_clicks(platform_id, clicked_at desc);

create index if not exists idx_site_offer_clicks_clicked_at
  on public.site_offer_clicks(clicked_at desc);

create index if not exists idx_site_offer_clicks_source_context_clicked_at
  on public.site_offer_clicks(source_context, clicked_at desc);

create index if not exists idx_site_offer_clicks_platform_clicked_at
  on public.site_offer_clicks(platform_id, clicked_at desc);

create index if not exists idx_platform_clicks_clicked_at
  on public.platform_clicks(clicked_at desc);

create index if not exists idx_platform_clicks_source_context_clicked_at
  on public.platform_clicks(source_context, clicked_at desc);
