-- Extend the existing auth-linked profile used by admin authorization. Keeping one
-- profile row avoids a second, divergent identity source for the same auth user.
alter table public.profiles
  add column if not exists country_code text,
  add column if not exists preferred_device text not null default 'all';

-- Usernames were historically optional and case-sensitive. Keep the first
-- normalized value deterministically, clear invalid/duplicate legacy values,
-- then make all future values normalized. This avoids a failed migration on
-- pre-existing data while retaining the existing unique constraint.
with ranked_usernames as (
  select
    id,
    username,
    row_number() over (partition by lower(username) order by created_at, id) as position
  from public.profiles
  where username is not null
)
update public.profiles as profiles
set username = null
from ranked_usernames
where profiles.id = ranked_usernames.id
  and (
    ranked_usernames.position > 1
    or ranked_usernames.username !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{1,28}[a-zA-Z0-9]$'
  );

update public.profiles
set username = lower(username)
where username is not null
  and username <> lower(username);

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

-- Preserve the existing trigger strategy, but pin lookup to trusted schemas.
-- It inserts only the auth user's own id and does not grant client elevation.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- The existing trigger creates profiles for new Auth users. Make the new fields
-- explicitly writable by their owner while preserving the role-column safeguard.
revoke update on public.profiles from authenticated;
grant update (username, display_name, avatar_url, country_code, preferred_device) on public.profiles to authenticated;

-- New profile rows are created only by the Auth trigger above. No client insert
-- policy is needed, so authenticated users cannot create arbitrary profile ids.
drop policy if exists "profiles: self insert" on public.profiles;
