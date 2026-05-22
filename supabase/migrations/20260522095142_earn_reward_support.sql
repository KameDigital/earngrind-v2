create table if not exists public.earn_reward_support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  offer_click_id uuid references public.offer_clicks(id) on delete set null,
  click_id text,
  conversion_event_id uuid references public.conversion_events(id) on delete set null,
  provider_slug text,
  offer_title text,
  issue_type text not null,
  message text not null,
  proof_url text,
  status text not null default 'open',
  admin_status text not null default 'unreviewed',
  admin_notes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint earn_reward_support_tickets_issue_type_check
    check (issue_type in ('missing_reward', 'wrong_amount', 'rejected_offer', 'reversed_reward', 'other')),
  constraint earn_reward_support_tickets_status_check
    check (status in ('open', 'waiting_on_user', 'under_review', 'resolved', 'rejected', 'closed')),
  constraint earn_reward_support_tickets_admin_status_check
    check (admin_status in ('unreviewed', 'reviewed', 'escalated')),
  constraint earn_reward_support_tickets_message_check
    check (length(btrim(message)) between 10 and 3000),
  constraint earn_reward_support_tickets_proof_url_check
    check (proof_url is null or proof_url ~* '^https?://')
);

create index if not exists earn_reward_support_tickets_user_created_at_idx
  on public.earn_reward_support_tickets(user_id, created_at desc);

create index if not exists earn_reward_support_tickets_status_created_at_idx
  on public.earn_reward_support_tickets(status, created_at desc);

create index if not exists earn_reward_support_tickets_admin_status_created_at_idx
  on public.earn_reward_support_tickets(admin_status, created_at desc);

create index if not exists earn_reward_support_tickets_click_id_idx
  on public.earn_reward_support_tickets(click_id)
  where click_id is not null;

create index if not exists earn_reward_support_tickets_conversion_event_id_idx
  on public.earn_reward_support_tickets(conversion_event_id)
  where conversion_event_id is not null;

drop trigger if exists trg_earn_reward_support_tickets_updated_at on public.earn_reward_support_tickets;
create trigger trg_earn_reward_support_tickets_updated_at
  before update on public.earn_reward_support_tickets
  for each row execute function update_updated_at_column();

alter table public.earn_reward_support_tickets enable row level security;

revoke all on public.earn_reward_support_tickets from anon;
revoke all on public.earn_reward_support_tickets from authenticated;
grant select, insert, update on public.earn_reward_support_tickets to authenticated;

drop policy if exists "earn_reward_support_tickets: self insert" on public.earn_reward_support_tickets;
create policy "earn_reward_support_tickets: self insert"
  on public.earn_reward_support_tickets
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'open'
    and admin_status = 'unreviewed'
    and admin_notes = '{}'::text[]
    and (
      offer_click_id is null
      or exists (
        select 1
        from public.offer_clicks oc
        where oc.id = offer_click_id
          and oc.user_id = (select auth.uid())
      )
    )
    and (
      conversion_event_id is null
      or exists (
        select 1
        from public.user_reward_ledger ledger
        where ledger.conversion_event_id = conversion_event_id
          and ledger.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "earn_reward_support_tickets: self read" on public.earn_reward_support_tickets;
create policy "earn_reward_support_tickets: self read"
  on public.earn_reward_support_tickets
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "earn_reward_support_tickets: admin editor read" on public.earn_reward_support_tickets;
create policy "earn_reward_support_tickets: admin editor read"
  on public.earn_reward_support_tickets
  for select
  to authenticated
  using (public.get_my_role() in ('admin', 'editor'));

drop policy if exists "earn_reward_support_tickets: admin editor update" on public.earn_reward_support_tickets;
create policy "earn_reward_support_tickets: admin editor update"
  on public.earn_reward_support_tickets
  for update
  to authenticated
  using (public.get_my_role() in ('admin', 'editor'))
  with check (public.get_my_role() in ('admin', 'editor'));

drop policy if exists "offer_clicks: self read" on public.offer_clicks;
create policy "offer_clicks: self read"
  on public.offer_clicks
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'earn_admin_audit_events_target_type_check'
      and conrelid = 'public.earn_admin_audit_events'::regclass
  ) then
    alter table public.earn_admin_audit_events
      drop constraint earn_admin_audit_events_target_type_check;
  end if;

  alter table public.earn_admin_audit_events
    add constraint earn_admin_audit_events_target_type_check
    check (target_type in (
      'earn_user_profile',
      'conversion_event',
      'user_reward_ledger',
      'earn_reward_support_ticket'
    ));
end $$;
