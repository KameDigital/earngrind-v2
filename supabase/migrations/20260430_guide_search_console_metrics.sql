create table if not exists public.guide_search_console_metrics (
    id uuid primary key default gen_random_uuid(),
    guide_id uuid references public.guides(id) on delete set null,
    page_url text not null,
    query text not null,
    clicks integer not null default 0,
    impressions integer not null default 0,
    ctr numeric not null default 0,
    position numeric not null default 0,
    date_start date,
    date_end date,
    created_at timestamptz not null default now()
);

create index if not exists guide_search_console_metrics_guide_id_idx on public.guide_search_console_metrics (guide_id);
create index if not exists guide_search_console_metrics_query_idx on public.guide_search_console_metrics (query);
create index if not exists guide_search_console_metrics_page_url_idx on public.guide_search_console_metrics (page_url);
create index if not exists guide_search_console_metrics_date_idx on public.guide_search_console_metrics (date_start, date_end);
create index if not exists guide_search_console_metrics_impressions_idx on public.guide_search_console_metrics (impressions desc);

alter table public.guide_search_console_metrics enable row level security;

drop policy if exists "guide_search_console_metrics_admin_all" on public.guide_search_console_metrics;
create policy "guide_search_console_metrics_admin_all"
    on public.guide_search_console_metrics
    for all
    using (
        exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and profiles.role in ('admin', 'editor')
        )
    )
    with check (
        exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and profiles.role in ('admin', 'editor')
        )
    );
