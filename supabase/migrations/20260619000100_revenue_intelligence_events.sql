create table if not exists public.revenue_events (
    id uuid primary key default gen_random_uuid(),
    event_name text not null check (
        event_name in (
            'page_view',
            'cta_impression',
            'cta_click',
            'outbound_click',
            'conversion_postback'
        )
    ),
    route_path text not null,
    route_group text not null check (
        route_group in (
            'homepage',
            'best_gpt_sites',
            'seo_best_offers',
            'game',
            'offer',
            'guide',
            'platform_go',
            'offer_go',
            'earn_go',
            'postback',
            'admin',
            'unknown'
        )
    ),
    entity_type text check (
        entity_type is null or entity_type in (
            'guide',
            'game',
            'offer',
            'platform',
            'provider'
        )
    ),
    entity_id text,
    entity_slug text,
    guide_id uuid,
    guide_slug text,
    game_id uuid,
    game_slug text,
    offer_id text,
    platform_id uuid,
    platform_slug text,
    provider_id uuid,
    provider_name text,
    cta_location text,
    source_context text,
    target_url text,
    referrer_path text,
    session_key text,
    visitor_key text,
    user_id uuid,
    user_agent_family text,
    outbound_click_table text check (
        outbound_click_table is null or outbound_click_table in (
            'offer_clicks',
            'site_offer_clicks',
            'platform_clicks'
        )
    ),
    outbound_click_id uuid,
    conversion_event_id uuid,
    metadata jsonb not null default '{}'::jsonb,
    occurred_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index if not exists revenue_events_event_time_idx
    on public.revenue_events (event_name, occurred_at desc);

create index if not exists revenue_events_route_group_time_idx
    on public.revenue_events (route_group, occurred_at desc);

create index if not exists revenue_events_cta_location_time_idx
    on public.revenue_events (cta_location, occurred_at desc)
    where cta_location is not null;

create index if not exists revenue_events_platform_time_idx
    on public.revenue_events (platform_id, occurred_at desc)
    where platform_id is not null;

create index if not exists revenue_events_provider_time_idx
    on public.revenue_events (provider_name, occurred_at desc)
    where provider_name is not null;

create index if not exists revenue_events_session_time_idx
    on public.revenue_events (session_key, occurred_at desc)
    where session_key is not null;

alter table public.revenue_events enable row level security;

drop policy if exists "revenue_events_public_insert" on public.revenue_events;
create policy "revenue_events_public_insert"
    on public.revenue_events
    for insert
    with check (
        event_name in (
            'page_view',
            'cta_impression',
            'cta_click',
            'outbound_click',
            'conversion_postback'
        )
    );

drop policy if exists "revenue_events_admin_read" on public.revenue_events;
create policy "revenue_events_admin_read"
    on public.revenue_events
    for select
    using (
        exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and profiles.role in ('admin', 'editor')
        )
    );
