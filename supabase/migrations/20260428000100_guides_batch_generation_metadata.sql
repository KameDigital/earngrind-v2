alter table public.guides
  add column if not exists keyword_target text,
  add column if not exists task_list_raw text,
  add column if not exists parsed_tasks jsonb not null default '[]'::jsonb,
  add column if not exists internal_link_suggestions jsonb not null default '[]'::jsonb,
  add column if not exists batch_name text,
  add column if not exists guide_type text;
