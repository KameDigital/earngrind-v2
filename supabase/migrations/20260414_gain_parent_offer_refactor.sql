alter table public.site_offers
    add column if not exists image_url text,
    add column if not exists total_payout_usd numeric(12, 2);

create index if not exists idx_site_offers_site_external_id
    on public.site_offers(site_id, external_id);

create index if not exists idx_site_offer_tasks_site_offer_sort
    on public.site_offer_tasks(site_offer_id, sort_order);
