create table if not exists public.offer_partner_postback_configs (
  id uuid primary key default gen_random_uuid(),
  offer_partner_id uuid not null references public.offer_partners(id) on delete cascade,
  provider_slug text not null unique,
  status text not null default 'active',
  secret_type text not null default 'none',
  secret_env_var text,
  signature_algorithm text not null default 'none',
  signature_location text not null default 'query',
  signature_param text,
  allowed_ip_ranges cidr[] not null default '{}',
  click_id_param text not null default 'click_id',
  transaction_id_param text not null default 'external_transaction_id',
  payout_param text not null default 'amount',
  currency_param text,
  status_param text not null default 'status',
  status_map jsonb not null default '{
    "pending": "pending",
    "approved": "approved",
    "rejected": "rejected",
    "reversed": "reversed",
    "chargeback": "reversed"
  }'::jsonb,
  redacted_fields text[] not null default '{}',
  timestamp_param text,
  nonce_param text,
  max_clock_skew_seconds integer not null default 0,
  replay_ttl_seconds integer not null default 86400,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offer_partner_postback_configs_provider_slug_check
    check (provider_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint offer_partner_postback_configs_status_check
    check (status in ('active', 'paused', 'archived')),
  constraint offer_partner_postback_configs_secret_type_check
    check (secret_type in ('none', 'static_token', 'hmac')),
  constraint offer_partner_postback_configs_signature_algorithm_check
    check (signature_algorithm in ('none', 'hmac-sha1', 'hmac-sha256', 'hmac-sha512')),
  constraint offer_partner_postback_configs_signature_location_check
    check (signature_location in ('header', 'query', 'body')),
  constraint offer_partner_postback_configs_secret_env_var_check
    check (
      secret_env_var is null
      or secret_env_var ~ '^[A-Z][A-Z0-9_]*$'
    ),
  constraint offer_partner_postback_configs_skew_check
    check (max_clock_skew_seconds >= 0),
  constraint offer_partner_postback_configs_replay_ttl_check
    check (replay_ttl_seconds >= 0),
  constraint offer_partner_postback_configs_secret_required_check
    check (
      secret_type = 'none'
      or (secret_env_var is not null and length(secret_env_var) > 0)
    ),
  constraint offer_partner_postback_configs_signature_required_check
    check (
      (signature_algorithm = 'none' and secret_type <> 'static_token')
      or (signature_param is not null and length(signature_param) > 0)
    )
);

create table if not exists public.postback_receipts (
  id uuid primary key default gen_random_uuid(),
  provider_config_id uuid references public.offer_partner_postback_configs(id) on delete set null,
  method text not null,
  source_ip inet,
  signature_valid boolean not null default false,
  replay_key text,
  request_hash text not null,
  redacted_payload jsonb not null default '{}'::jsonb,
  failure_code text,
  linked_conversion_event_id uuid references public.conversion_events(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint postback_receipts_method_check
    check (method in ('GET', 'POST')),
  constraint postback_receipts_request_hash_check
    check (length(request_hash) > 0),
  constraint postback_receipts_failure_code_check
    check (
      failure_code is null
      or failure_code ~ '^[a-z0-9_:-]+$'
    )
);

alter table public.conversion_events
  add column if not exists provider_config_id uuid references public.offer_partner_postback_configs(id) on delete set null,
  add column if not exists postback_receipt_id uuid references public.postback_receipts(id) on delete set null,
  add column if not exists provider_status text,
  add column if not exists review_status text not null default 'clean',
  add column if not exists review_reasons text[] not null default '{}',
  add column if not exists source_ip inet;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversion_events_review_status_check'
      and conrelid = 'public.conversion_events'::regclass
  ) then
    alter table public.conversion_events
      add constraint conversion_events_review_status_check
      check (review_status in ('clean', 'flagged', 'ignored', 'reviewed'));
  end if;
end $$;

create index if not exists offer_partner_postback_configs_partner_idx
  on public.offer_partner_postback_configs(offer_partner_id);

create index if not exists offer_partner_postback_configs_status_idx
  on public.offer_partner_postback_configs(status);

create index if not exists postback_receipts_provider_created_at_idx
  on public.postback_receipts(provider_config_id, created_at desc);

create index if not exists postback_receipts_request_hash_idx
  on public.postback_receipts(request_hash);

create unique index if not exists postback_receipts_provider_replay_key_unique
  on public.postback_receipts(provider_config_id, replay_key)
  where replay_key is not null;

create index if not exists conversion_events_provider_config_created_at_idx
  on public.conversion_events(provider_config_id, created_at desc);

create index if not exists conversion_events_review_status_created_at_idx
  on public.conversion_events(review_status, created_at desc);

drop trigger if exists trg_offer_partner_postback_configs_updated_at on public.offer_partner_postback_configs;
create trigger trg_offer_partner_postback_configs_updated_at
  before update on public.offer_partner_postback_configs
  for each row execute function update_updated_at_column();

alter table public.offer_partner_postback_configs enable row level security;
alter table public.postback_receipts enable row level security;

grant select on public.offer_partner_postback_configs to authenticated;
grant select on public.postback_receipts to authenticated;

drop policy if exists "offer_partner_postback_configs: admin editor read" on public.offer_partner_postback_configs;
create policy "offer_partner_postback_configs: admin editor read"
  on public.offer_partner_postback_configs
  for select
  to authenticated
  using (public.get_my_role() in ('admin', 'editor'));

drop policy if exists "postback_receipts: admin editor read" on public.postback_receipts;
create policy "postback_receipts: admin editor read"
  on public.postback_receipts
  for select
  to authenticated
  using (public.get_my_role() in ('admin', 'editor'));
