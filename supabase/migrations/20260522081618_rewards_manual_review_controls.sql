alter table public.user_reward_ledger
  add column if not exists review_status text not null default 'clean',
  add column if not exists review_reasons text[] not null default '{}';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_reward_ledger_review_status_check'
      and conrelid = 'public.user_reward_ledger'::regclass
  ) then
    alter table public.user_reward_ledger
      add constraint user_reward_ledger_review_status_check
      check (review_status in ('clean', 'flagged', 'ignored', 'reviewed'));
  end if;
end $$;

create index if not exists user_reward_ledger_review_status_created_at_idx
  on public.user_reward_ledger(review_status, created_at desc);

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
    check (target_type in ('earn_user_profile', 'conversion_event', 'user_reward_ledger'));
end $$;
