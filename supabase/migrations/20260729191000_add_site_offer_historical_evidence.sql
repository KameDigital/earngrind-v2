-- HAR-derived offers are historical completion evidence, not a live provider
-- availability or payout feed. Keep that distinction in the persisted record.
alter table public.site_offers
  add column if not exists is_historical boolean not null default false;

comment on column public.site_offers.is_historical is
  'True when the offer was reconstructed from historical completion evidence and has not been live-verified.';
