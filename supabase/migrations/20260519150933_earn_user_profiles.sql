create table if not exists public.earn_user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  country text,
  timezone text,
  reward_currency text not null default 'USD',
  reward_status text not null default 'active',
  review_status text not null default 'clean',
  review_reasons text[] not null default '{}',
  accepted_rewards_terms_at timestamptz,
  last_reward_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint earn_user_profiles_reward_currency_check
    check (reward_currency ~ '^[A-Z]{3}$'),
  constraint earn_user_profiles_reward_status_check
    check (reward_status in ('active', 'limited', 'suspended', 'banned')),
  constraint earn_user_profiles_review_status_check
    check (review_status in ('clean', 'flagged', 'under_review', 'cleared'))
);

create index if not exists earn_user_profiles_reward_status_idx
  on public.earn_user_profiles(reward_status);

create index if not exists earn_user_profiles_review_status_idx
  on public.earn_user_profiles(review_status);

create index if not exists earn_user_profiles_last_activity_idx
  on public.earn_user_profiles(last_reward_activity_at desc);

drop trigger if exists trg_earn_user_profiles_updated_at on public.earn_user_profiles;
create trigger trg_earn_user_profiles_updated_at
  before update on public.earn_user_profiles
  for each row execute function update_updated_at_column();

create or replace function public.prevent_earn_user_profile_protected_self_update()
returns trigger
language plpgsql
as $$
begin
  if current_role = 'service_role'
    or (select auth.role()) = 'service_role'
    or public.get_my_role() in ('admin', 'editor')
  then
    return new;
  end if;

  if new.user_id is distinct from old.user_id
    or new.reward_currency is distinct from old.reward_currency
    or new.reward_status is distinct from old.reward_status
    or new.review_status is distinct from old.review_status
    or new.review_reasons is distinct from old.review_reasons
    or new.accepted_rewards_terms_at is distinct from old.accepted_rewards_terms_at
    or new.last_reward_activity_at is distinct from old.last_reward_activity_at
    or new.created_at is distinct from old.created_at
    or new.updated_at is distinct from old.updated_at
  then
    raise exception 'protected earn user profile fields cannot be self-updated';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_earn_user_profiles_protected_self_update on public.earn_user_profiles;
create trigger trg_earn_user_profiles_protected_self_update
  before update on public.earn_user_profiles
  for each row execute function public.prevent_earn_user_profile_protected_self_update();

alter table public.earn_user_profiles enable row level security;

grant select on public.earn_user_profiles to authenticated;
grant update on public.earn_user_profiles to authenticated;

drop policy if exists "earn_user_profiles: self read" on public.earn_user_profiles;
create policy "earn_user_profiles: self read"
  on public.earn_user_profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "earn_user_profiles: admin editor read" on public.earn_user_profiles;
create policy "earn_user_profiles: admin editor read"
  on public.earn_user_profiles
  for select
  to authenticated
  using (public.get_my_role() in ('admin', 'editor'));

drop policy if exists "earn_user_profiles: self safe update" on public.earn_user_profiles;
create policy "earn_user_profiles: self safe update"
  on public.earn_user_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "earn_user_profiles: admin editor update" on public.earn_user_profiles;
create policy "earn_user_profiles: admin editor update"
  on public.earn_user_profiles
  for update
  to authenticated
  using (public.get_my_role() in ('admin', 'editor'))
  with check (public.get_my_role() in ('admin', 'editor'));
