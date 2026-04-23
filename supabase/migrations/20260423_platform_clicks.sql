create table if not exists public.platform_clicks (
    id uuid primary key default gen_random_uuid(),
    platform_id uuid not null references public.platforms(id) on delete cascade,
    platform_name text,
    offer_title text,
    game_title text,
    provider_name text,
    payout_usd numeric,
    click_location text,
    source_context text,
    destination_url text,
    affiliate_mode text,
    ip_hash text,
    referrer text,
    country text,
    user_agent text,
    user_id uuid,
    clicked_at timestamptz not null default now()
);

create index if not exists idx_platform_clicks_platform_clicked_at
    on public.platform_clicks(platform_id, clicked_at desc);
