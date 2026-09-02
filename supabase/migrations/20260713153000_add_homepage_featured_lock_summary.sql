alter table public.homepage_featured_offers
  add column if not exists lock_summary text;

alter table public.homepage_featured_settings
  drop constraint if exists homepage_featured_settings_display_limit_check;

alter table public.homepage_featured_settings
  add constraint homepage_featured_settings_display_limit_check
  check (display_limit between 1 and 48);

comment on column public.homepage_featured_offers.lock_summary is
  'Short user-facing payout-hold disclosure shown only on the curated homepage collection.';
