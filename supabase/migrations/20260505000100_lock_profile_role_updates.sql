-- Prevent authenticated users from promoting themselves by updating profiles.role.
-- Role changes should go through trusted service-role/admin tooling only.

drop policy if exists "profiles: self update" on public.profiles;

create policy "profiles: self update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = public.get_my_role()
  );

revoke update on public.profiles from anon;
revoke update on public.profiles from authenticated;
grant update (username, display_name, avatar_url) on public.profiles to authenticated;
