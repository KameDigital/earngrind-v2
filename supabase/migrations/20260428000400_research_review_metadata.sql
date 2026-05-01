alter table public.guides
  add column if not exists review_type text,
  add column if not exists research_summary text,
  add column if not exists research_confidence_score integer,
  add column if not exists source_urls jsonb not null default '[]'::jsonb,
  add column if not exists claims_needing_verification jsonb not null default '[]'::jsonb,
  add column if not exists pros jsonb not null default '[]'::jsonb,
  add column if not exists cons jsonb not null default '[]'::jsonb,
  add column if not exists review_rating numeric;
