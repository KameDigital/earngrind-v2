create table if not exists public.site_offer_clicks (
    id uuid primary key default gen_random_uuid(),
    site_offer_id uuid not null references public.site_offers(id) on delete cascade,
    ip_hash text,
    referrer text,
    country text,
    user_agent text,
    user_id uuid,
    clicked_at timestamptz not null default now()
);

create index if not exists idx_site_offer_clicks_site_offer_clicked_at
    on public.site_offer_clicks(site_offer_id, clicked_at desc);
