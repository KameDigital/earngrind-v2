-- Keep the existing public chat identity contract minimal while preferring the explicit account username.
create or replace function public.list_community_chat_messages(p_before timestamptz default null, p_before_id uuid default null, p_limit integer default 50)
returns table (id uuid, body text, created_at timestamptz, sender_name text, sender_avatar_url text, can_delete boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  select
    m.id,
    m.body,
    m.created_at,
    coalesce(nullif(trim(p.username), ''), 'EarnGrind member'),
    nullif(trim(p.avatar_url), ''),
    (m.user_id = auth.uid() or public.community_chat_is_staff(auth.uid()))
  from public.community_chat_messages m
  join public.profiles p on p.id = m.user_id
  where m.deleted_at is null
    and (p_before is null or (m.created_at, m.id) < (p_before, coalesce(p_before_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)))
  order by m.created_at desc, m.id desc
  limit greatest(1, least(coalesce(p_limit, 50), 101));
$$;