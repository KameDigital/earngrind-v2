alter table public.guides
  add column if not exists primary_offer_id uuid,
  add column if not exists disable_auto_offer_matching boolean not null default false;

create index if not exists idx_guides_primary_offer_id
  on public.guides(primary_offer_id)
  where primary_offer_id is not null;
