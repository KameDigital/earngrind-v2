alter table public.guides
  add column if not exists keyword_cluster_id text,
  add column if not exists keyword_intent text,
  add column if not exists angle_type text,
  add column if not exists content_uniqueness_score numeric(5,2),
  add column if not exists needs_variation boolean not null default false;

create index if not exists idx_guides_keyword_cluster_id on public.guides(keyword_cluster_id);
create index if not exists idx_guides_keyword_intent on public.guides(keyword_intent);
create index if not exists idx_guides_angle_type on public.guides(angle_type);
