create table if not exists public.guide_events (
    id uuid primary key default gen_random_uuid(),
    guide_id uuid references public.guides(id) on delete set null,
    guide_slug text not null,
    event_type text not null check (
        event_type in (
            'view',
            'cta_click',
            'offer_click',
            'platform_click',
            'internal_link_click'
        )
    ),
    target_url text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists guide_events_guide_id_idx on public.guide_events (guide_id);
create index if not exists guide_events_guide_slug_idx on public.guide_events (guide_slug);
create index if not exists guide_events_event_type_idx on public.guide_events (event_type);
create index if not exists guide_events_created_at_idx on public.guide_events (created_at desc);

alter table public.guide_events enable row level security;

drop policy if exists "guide_events_public_insert" on public.guide_events;
create policy "guide_events_public_insert"
    on public.guide_events
    for insert
    with check (
        event_type in (
            'view',
            'cta_click',
            'offer_click',
            'platform_click',
            'internal_link_click'
        )
    );

drop policy if exists "guide_events_admin_read" on public.guide_events;
create policy "guide_events_admin_read"
    on public.guide_events
    for select
    using (
        exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and profiles.role in ('admin', 'editor')
        )
    );
