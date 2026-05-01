create table if not exists public.research_entries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('platform', 'game', 'offer', 'general')),
  target_name text not null,
  source_type text not null check (source_type in ('url', 'reddit', 'trustpilot', 'note', 'screenshot')),
  source_url text,
  image_url text,
  raw_text text not null default '',
  extracted_data jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists research_entries_target_name_idx on public.research_entries (target_name);
create index if not exists research_entries_type_idx on public.research_entries (type);
create index if not exists research_entries_source_type_idx on public.research_entries (source_type);
create index if not exists research_entries_tags_idx on public.research_entries using gin (tags);

alter table public.research_entries enable row level security;

drop policy if exists "research_entries: admin all" on public.research_entries;
create policy "research_entries: admin all"
  on public.research_entries for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

drop policy if exists "research_entries: editor read" on public.research_entries;
create policy "research_entries: editor read"
  on public.research_entries for select
  using (public.get_my_role() in ('admin', 'editor'));

drop policy if exists "research_entries: editor insert" on public.research_entries;
create policy "research_entries: editor insert"
  on public.research_entries for insert
  with check (public.get_my_role() in ('admin', 'editor'));

drop policy if exists "research_entries: editor update" on public.research_entries;
create policy "research_entries: editor update"
  on public.research_entries for update
  using (public.get_my_role() in ('admin', 'editor'))
  with check (public.get_my_role() in ('admin', 'editor'));

drop trigger if exists trg_research_entries_updated_at on public.research_entries;
create trigger trg_research_entries_updated_at
  before update on public.research_entries
  for each row execute function update_updated_at_column();
