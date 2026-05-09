create table if not exists public.admin_integration_tokens (
    id uuid primary key default gen_random_uuid(),
    provider text not null unique,
    access_token text,
    refresh_token text,
    expires_at timestamptz,
    scopes text,
    site_url text,
    connected_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists admin_integration_tokens_provider_idx on public.admin_integration_tokens (provider);

alter table public.admin_integration_tokens enable row level security;

drop policy if exists "admin_integration_tokens_admin_all" on public.admin_integration_tokens;
create policy "admin_integration_tokens_admin_all"
    on public.admin_integration_tokens
    for all
    using (public.get_my_role() = 'admin')
    with check (public.get_my_role() = 'admin');
