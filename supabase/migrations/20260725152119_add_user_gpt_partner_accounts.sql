-- A connection records that an authenticated EarnGrind user opened a GPT
-- partner's signup link. It intentionally does not claim that the external
-- site accepted or activated the account: affiliate redirects cannot prove it.
create table public.user_gpt_partner_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform_id uuid not null references public.platforms(id) on delete cascade,
  connected_at timestamptz not null default now(),
  last_signup_click_at timestamptz not null default now(),
  unique (user_id, platform_id)
);

create index user_gpt_partner_accounts_user_connected_idx
  on public.user_gpt_partner_accounts (user_id, connected_at desc);

alter table public.user_gpt_partner_accounts enable row level security;
revoke all on table public.user_gpt_partner_accounts from anon;
grant select, insert, update on table public.user_gpt_partner_accounts to authenticated;

create policy "user_gpt_partner_accounts: self only"
  on public.user_gpt_partner_accounts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
