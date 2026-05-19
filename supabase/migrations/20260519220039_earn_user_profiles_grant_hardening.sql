revoke all on table public.earn_user_profiles from anon;
revoke all on table public.earn_user_profiles from authenticated;

grant select, update on table public.earn_user_profiles to authenticated;
