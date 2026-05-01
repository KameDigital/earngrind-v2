alter type public.content_status add value if not exists 'needs_review';

alter table public.guides
  add column if not exists platform_name text;
