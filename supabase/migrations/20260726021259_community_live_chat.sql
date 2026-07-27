-- Public community chat. Writes and moderation are only available through RPCs.
create table public.community_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  client_message_id uuid not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  unique (user_id, client_message_id)
);
create index community_chat_messages_active_created_idx on public.community_chat_messages (created_at desc, id desc) where deleted_at is null;
create table public.community_chat_moderation (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  suspended_until timestamptz, suspended_at timestamptz not null default now(),
  suspended_by uuid not null references public.profiles(id), reason text check (char_length(reason) <= 240)
);
create table public.community_chat_rate_limits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  window_started_at timestamptz not null default now(), message_count integer not null default 0 check (message_count >= 0), last_sent_at timestamptz
);
alter table public.community_chat_messages enable row level security;
alter table public.community_chat_moderation enable row level security;
alter table public.community_chat_rate_limits enable row level security;
revoke all on table public.community_chat_messages, public.community_chat_moderation, public.community_chat_rate_limits from anon, authenticated;
grant select on public.community_chat_messages to anon, authenticated;
create policy "public can read active community chat messages" on public.community_chat_messages for select to anon, authenticated using (deleted_at is null);
create or replace function public.community_chat_is_staff(p_user_id uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$ select exists (select 1 from public.profiles where id = p_user_id and role in ('admin', 'editor')); $$;
drop function if exists public.list_community_chat_messages(timestamptz, uuid, integer);
create function public.list_community_chat_messages(p_before timestamptz default null, p_before_id uuid default null, p_limit integer default 50) returns table (id uuid, body text, created_at timestamptz, sender_name text, sender_avatar_url text, can_delete boolean) language sql stable security definer set search_path = public, pg_temp as $$
  select m.id, m.body, m.created_at, coalesce(nullif(trim(p.display_name), ''), nullif(trim(p.username), ''), 'EarnGrind member'), p.avatar_url, (m.user_id = auth.uid() or public.community_chat_is_staff(auth.uid()))
  from public.community_chat_messages m join public.profiles p on p.id = m.user_id
  where m.deleted_at is null and (p_before is null or (m.created_at, m.id) < (p_before, coalesce(p_before_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)))
  order by m.created_at desc, m.id desc limit greatest(1, least(coalesce(p_limit, 50), 101));
$$;
create or replace function public.send_community_chat_message(p_body text, p_client_message_id uuid) returns public.community_chat_messages language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user_id uuid := auth.uid(); v_body text := trim(coalesce(p_body, '')); v_now timestamptz := now(); v_limit public.community_chat_rate_limits%rowtype; v_message public.community_chat_messages%rowtype;
begin
 if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
 if char_length(v_body) not between 1 and 500 then raise exception 'Message must be between 1 and 500 characters' using errcode = '22023'; end if;
 if exists (select 1 from public.community_chat_moderation where user_id = v_user_id and (suspended_until is null or suspended_until > v_now)) then raise exception 'Chat posting is suspended' using errcode = '42501'; end if;
 insert into public.community_chat_rate_limits as r (user_id, window_started_at, message_count, last_sent_at) values (v_user_id, v_now, 1, v_now) on conflict (user_id) do update set window_started_at = case when r.window_started_at <= v_now - interval '1 minute' then v_now else r.window_started_at end, message_count = case when r.window_started_at <= v_now - interval '1 minute' then 1 else r.message_count + 1 end, last_sent_at = v_now returning * into v_limit;
 if v_limit.message_count > 5 then update public.community_chat_rate_limits set message_count = message_count - 1 where user_id = v_user_id; raise exception 'Too many messages; please wait a minute' using errcode = '42901'; end if;
 insert into public.community_chat_messages (user_id, body, client_message_id) values (v_user_id, v_body, p_client_message_id) on conflict (user_id, client_message_id) do update set body = public.community_chat_messages.body returning * into v_message; return v_message;
end; $$;
create or replace function public.delete_community_chat_message(p_message_id uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$ declare v_user_id uuid := auth.uid(); begin if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if; update public.community_chat_messages set deleted_at = now(), deleted_by = v_user_id where id = p_message_id and deleted_at is null and (user_id = v_user_id or public.community_chat_is_staff(v_user_id)); if not found then raise exception 'Message not found or not permitted' using errcode = '42501'; end if; end; $$;
create or replace function public.community_chat_broadcast_change() returns trigger language plpgsql security definer set search_path = public, pg_temp as
$$ begin perform realtime.send(jsonb_build_object('message_id', coalesce(new.id, old.id), 'operation', tg_op), 'chat_changed', 'community-chat', false); return coalesce(new, old); end; $$;
create trigger community_chat_broadcast_change after insert or update or delete on public.community_chat_messages for each row execute function public.community_chat_broadcast_change();
revoke all on function public.community_chat_is_staff(uuid) from public;
revoke all on function public.list_community_chat_messages(timestamptz, uuid, integer) from public;
revoke all on function public.send_community_chat_message(text, uuid) from public;
revoke all on function public.delete_community_chat_message(uuid) from public;
revoke all on function public.community_chat_broadcast_change() from public;
grant execute on function public.list_community_chat_messages(timestamptz, uuid, integer) to anon, authenticated;
grant execute on function public.send_community_chat_message(text, uuid) to authenticated;
grant execute on function public.delete_community_chat_message(uuid) to authenticated;