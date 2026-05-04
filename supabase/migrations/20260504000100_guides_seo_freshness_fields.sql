alter table public.guides
  add column if not exists payout_verified_at timestamptz,
  add column if not exists tasks_verified_at timestamptz,
  add column if not exists provider_terms_verified_at timestamptz,
  add column if not exists last_offer_check_at timestamptz;
