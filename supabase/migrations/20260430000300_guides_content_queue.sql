alter table public.guides
  add column if not exists publish_priority integer,
  add column if not exists planned_publish_date date,
  add column if not exists content_status text check (content_status is null or content_status in ('draft', 'needs_edit', 'ready_to_publish', 'scheduled', 'published')),
  add column if not exists assigned_to text,
  add column if not exists editor_notes text;

update public.guides
set content_status = coalesce(content_status, status::text, 'draft')
where content_status is null;
