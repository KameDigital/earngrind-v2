-- A user can confirm their external partner signup only after EarnGrind has
-- recorded an authenticated affiliate-signup click. This is a user statement,
-- not provider-side proof of an activated external account.
alter table public.user_gpt_partner_accounts
  add column if not exists signup_confirmed_at timestamptz;
