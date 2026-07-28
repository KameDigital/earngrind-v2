-- Extend the existing auth-linked profile used by admin authorization. Keeping one
-- profile row avoids a second, divergent identity source for the same auth user.
alter table public.profiles
  add column if not exists country_code text,
  add column if not exists preferred_device text not null default 'all';

alter table public.profiles
  drop constraint if exists profiles_country_code_supported_check,
  add constraint profiles_country_code_supported_check
    check (country_code is null or country_code in ('US', 'GB', 'CA', 'AU', 'DE', 'FR', 'NL', 'SE', 'NO', 'DK', 'FI', 'ES', 'IT', 'BR', 'MX', 'IN')),
  drop constraint if exists profiles_preferred_device_check,
  add constraint profiles_preferred_device_check
    check (preferred_device in ('all', 'android', 'ios', 'desktop')),
  drop constraint if exists profiles_username_normalized_check,
  add constraint profiles_username_normalized_check
    check (username is null or username = lower(username) and username ~ '^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$');

-- Existing Auth users may predate the original auth trigger. Backfill only missing
-- rows, leaving existing display names, roles, and profile data untouched.
insert into public.profiles (id)
select users.id
from auth.users as users
where not exists (select 1 from public.profiles where profiles.id = users.id)
on conflict (id) do nothing;

-- The existing trigger creates profiles for new Auth users. Make the new fields
-- explicitly writable by their owner while preserving the role-column safeguard.
revoke update on public.profiles from authenticated;
grant update (username, display_name, avatar_url, country_code, preferred_device) on public.profiles to authenticated;

drop policy if exists "profiles: self insert" on public.profiles;
create policy "profiles: self insert"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id and role = 'user');
