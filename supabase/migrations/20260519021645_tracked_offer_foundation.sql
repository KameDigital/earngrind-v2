create table if not exists public.offer_partners (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offer_partners_status_check
    check (status in ('active', 'paused', 'archived')),
  constraint offer_partners_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.earn_offers (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.offer_partners(id) on delete restrict,
  title text not null,
  slug text not null unique,
  description text,
  offer_url_template text not null,
  countries text[] not null default '{}',
  devices text[] not null default '{}',
  vertical text,
  payout_cents integer not null default 0,
  user_reward_cents integer not null default 0,
  currency text not null default 'USD',
  incentive_allowed boolean not null default false,
  reward_allowed boolean not null default false,
  pending_days integer not null default 0,
  requirements text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint earn_offers_payout_cents_check
    check (payout_cents >= 0),
  constraint earn_offers_user_reward_cents_check
    check (user_reward_cents >= 0),
  constraint earn_offers_pending_days_check
    check (pending_days >= 0),
  constraint earn_offers_currency_check
    check (currency ~ '^[A-Z]{3}$'),
  constraint earn_offers_status_check
    check (status in ('draft', 'active', 'paused', 'archived')),
  constraint earn_offers_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

alter table public.offer_clicks
  add column if not exists click_id text,
  add column if not exists earn_offer_id uuid references public.earn_offers(id) on delete set null,
  add column if not exists offer_partner_id uuid references public.offer_partners(id) on delete set null,
  add column if not exists gross_payout_cents integer,
  add column if not exists user_reward_cents integer,
  add column if not exists currency text,
  add column if not exists incentive_allowed boolean,
  add column if not exists reward_allowed boolean;

alter table public.offer_clicks
  alter column offer_id drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'offer_clicks_offer_reference_check'
      and conrelid = 'public.offer_clicks'::regclass
  ) then
    alter table public.offer_clicks
      add constraint offer_clicks_offer_reference_check
      check (offer_id is not null or earn_offer_id is not null);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'offer_clicks_click_id_key'
      and conrelid = 'public.offer_clicks'::regclass
  ) then
    alter table public.offer_clicks
      add constraint offer_clicks_click_id_key unique (click_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'offer_clicks_gross_payout_cents_check'
      and conrelid = 'public.offer_clicks'::regclass
  ) then
    alter table public.offer_clicks
      add constraint offer_clicks_gross_payout_cents_check
      check (gross_payout_cents is null or gross_payout_cents >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'offer_clicks_user_reward_cents_check'
      and conrelid = 'public.offer_clicks'::regclass
  ) then
    alter table public.offer_clicks
      add constraint offer_clicks_user_reward_cents_check
      check (user_reward_cents is null or user_reward_cents >= 0);
  end if;
end $$;

create table if not exists public.conversion_events (
  id uuid primary key default gen_random_uuid(),
  offer_click_id uuid references public.offer_clicks(id) on delete set null,
  click_id text not null,
  offer_partner_id uuid not null references public.offer_partners(id) on delete restrict,
  earn_offer_id uuid references public.earn_offers(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  external_transaction_id text not null,
  status text not null,
  gross_revenue_cents integer not null default 0,
  user_reward_cents integer not null default 0,
  currency text not null default 'USD',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversion_events_status_check
    check (status in ('pending', 'approved', 'rejected', 'reversed')),
  constraint conversion_events_gross_revenue_cents_check
    check (gross_revenue_cents >= 0),
  constraint conversion_events_user_reward_cents_check
    check (user_reward_cents >= 0),
  constraint conversion_events_currency_check
    check (currency ~ '^[A-Z]{3}$'),
  constraint conversion_events_partner_external_transaction_unique
    unique (offer_partner_id, external_transaction_id)
);

create table if not exists public.user_reward_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversion_event_id uuid not null references public.conversion_events(id) on delete cascade,
  offer_click_id uuid references public.offer_clicks(id) on delete set null,
  earn_offer_id uuid references public.earn_offers(id) on delete set null,
  offer_partner_id uuid references public.offer_partners(id) on delete set null,
  status text not null,
  amount_cents integer not null default 0,
  currency text not null default 'USD',
  available_at timestamptz,
  paid_at timestamptz,
  reversed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_reward_ledger_status_check
    check (status in ('pending', 'approved', 'rejected', 'reversed', 'paid')),
  constraint user_reward_ledger_amount_cents_check
    check (amount_cents >= 0),
  constraint user_reward_ledger_currency_check
    check (currency ~ '^[A-Z]{3}$'),
  constraint user_reward_ledger_conversion_event_unique
    unique (conversion_event_id)
);

create index if not exists offer_partners_status_idx
  on public.offer_partners(status);

create index if not exists earn_offers_partner_status_idx
  on public.earn_offers(partner_id, status);

create index if not exists earn_offers_status_reward_idx
  on public.earn_offers(status, user_reward_cents desc);

create index if not exists offer_clicks_click_id_idx
  on public.offer_clicks(click_id);

create index if not exists offer_clicks_earn_offer_clicked_at_idx
  on public.offer_clicks(earn_offer_id, clicked_at desc);

create index if not exists offer_clicks_partner_clicked_at_idx
  on public.offer_clicks(offer_partner_id, clicked_at desc);

create index if not exists offer_clicks_user_clicked_at_idx
  on public.offer_clicks(user_id, clicked_at desc);

create index if not exists conversion_events_click_id_idx
  on public.conversion_events(click_id);

create index if not exists conversion_events_status_created_at_idx
  on public.conversion_events(status, created_at desc);

create index if not exists conversion_events_user_created_at_idx
  on public.conversion_events(user_id, created_at desc);

create index if not exists user_reward_ledger_user_status_idx
  on public.user_reward_ledger(user_id, status);

create index if not exists user_reward_ledger_user_created_at_idx
  on public.user_reward_ledger(user_id, created_at desc);

drop trigger if exists trg_offer_partners_updated_at on public.offer_partners;
create trigger trg_offer_partners_updated_at
  before update on public.offer_partners
  for each row execute function update_updated_at_column();

drop trigger if exists trg_earn_offers_updated_at on public.earn_offers;
create trigger trg_earn_offers_updated_at
  before update on public.earn_offers
  for each row execute function update_updated_at_column();

drop trigger if exists trg_conversion_events_updated_at on public.conversion_events;
create trigger trg_conversion_events_updated_at
  before update on public.conversion_events
  for each row execute function update_updated_at_column();

drop trigger if exists trg_user_reward_ledger_updated_at on public.user_reward_ledger;
create trigger trg_user_reward_ledger_updated_at
  before update on public.user_reward_ledger
  for each row execute function update_updated_at_column();

alter table public.offer_partners enable row level security;
alter table public.earn_offers enable row level security;
alter table public.conversion_events enable row level security;
alter table public.user_reward_ledger enable row level security;

grant select on public.offer_partners to anon, authenticated;
grant select on public.earn_offers to anon, authenticated;
grant select on public.conversion_events to authenticated;
grant select on public.user_reward_ledger to authenticated;
grant insert on public.offer_clicks to anon, authenticated;

drop policy if exists "offer_partners: public read active" on public.offer_partners;
create policy "offer_partners: public read active"
  on public.offer_partners
  for select
  to anon, authenticated
  using (status = 'active');

drop policy if exists "offer_partners: admin editor read" on public.offer_partners;
create policy "offer_partners: admin editor read"
  on public.offer_partners
  for select
  to authenticated
  using (public.get_my_role() in ('admin', 'editor'));

drop policy if exists "earn_offers: public read active" on public.earn_offers;
create policy "earn_offers: public read active"
  on public.earn_offers
  for select
  to anon, authenticated
  using (status = 'active');

drop policy if exists "earn_offers: admin editor read" on public.earn_offers;
create policy "earn_offers: admin editor read"
  on public.earn_offers
  for select
  to authenticated
  using (public.get_my_role() in ('admin', 'editor'));

drop policy if exists "conversion_events: admin editor read" on public.conversion_events;
create policy "conversion_events: admin editor read"
  on public.conversion_events
  for select
  to authenticated
  using (public.get_my_role() in ('admin', 'editor'));

drop policy if exists "user_reward_ledger: self read" on public.user_reward_ledger;
create policy "user_reward_ledger: self read"
  on public.user_reward_ledger
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_reward_ledger: admin editor read" on public.user_reward_ledger;
create policy "user_reward_ledger: admin editor read"
  on public.user_reward_ledger
  for select
  to authenticated
  using (public.get_my_role() in ('admin', 'editor'));

drop policy if exists "offer_clicks: editor read" on public.offer_clicks;
create policy "offer_clicks: editor read"
  on public.offer_clicks
  for select
  to authenticated
  using (public.get_my_role() = 'editor');
