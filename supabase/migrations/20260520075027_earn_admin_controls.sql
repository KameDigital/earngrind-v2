create table if not exists public.earn_admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  target_type text not null,
  target_id uuid,
  action text not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now(),
  constraint earn_admin_audit_events_target_type_check
    check (target_type in ('earn_user_profile', 'conversion_event')),
  constraint earn_admin_audit_events_action_check
    check (action ~ '^[a-z0-9_:-]+$')
);

create index if not exists idx_earn_admin_audit_events_created_at
  on public.earn_admin_audit_events (created_at desc);

create index if not exists idx_earn_admin_audit_events_admin_user
  on public.earn_admin_audit_events (admin_user_id, created_at desc);

create index if not exists idx_earn_admin_audit_events_target_user
  on public.earn_admin_audit_events (target_user_id, created_at desc);

create index if not exists idx_earn_admin_audit_events_target
  on public.earn_admin_audit_events (target_type, target_id, created_at desc);

alter table public.earn_admin_audit_events enable row level security;

revoke all on public.earn_admin_audit_events from anon;
revoke all on public.earn_admin_audit_events from authenticated;
grant select on public.earn_admin_audit_events to authenticated;

drop policy if exists "Admin users can read earn admin audit events" on public.earn_admin_audit_events;
create policy "Admin users can read earn admin audit events"
  on public.earn_admin_audit_events
  for select
  to authenticated
  using (public.get_my_role() in ('admin', 'editor'));
