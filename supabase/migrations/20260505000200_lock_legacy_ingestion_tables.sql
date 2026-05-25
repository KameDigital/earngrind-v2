-- Legacy ingestion tables are worker/service-role only.
-- They should not be readable or mutable through the public Supabase Data API.

create table if not exists public.sources (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    type text not null check (type in ('html', 'api')),
    base_url text not null,
    active boolean not null default true,
    last_run_at timestamptz
);

create table if not exists public.import_runs (
    id uuid primary key default gen_random_uuid(),
    source_id uuid not null references public.sources(id) on delete cascade,
    status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
    started_at timestamptz not null default now(),
    finished_at timestamptz,
    total_found integer not null default 0,
    total_new integer not null default 0,
    total_updated integer not null default 0
);

create table if not exists public.raw_offers (
    id uuid primary key default gen_random_uuid(),
    source_id uuid not null references public.sources(id) on delete cascade,
    raw_title text not null,
    raw_payload_json jsonb not null,
    raw_payout numeric(12, 2),
    raw_currency text,
    raw_image_url text,
    fetched_at timestamptz not null default now()
);

create index if not exists idx_sources_active on public.sources(active);
create index if not exists idx_import_runs_source_started_at on public.import_runs(source_id, started_at desc);
create index if not exists idx_raw_offers_source_fetched_at on public.raw_offers(source_id, fetched_at desc);

revoke all on table public.raw_offers from anon;
revoke all on table public.raw_offers from authenticated;
alter table public.raw_offers enable row level security;

revoke all on table public.sources from anon;
revoke all on table public.sources from authenticated;
alter table public.sources enable row level security;

revoke all on table public.import_runs from anon;
revoke all on table public.import_runs from authenticated;
alter table public.import_runs enable row level security;
