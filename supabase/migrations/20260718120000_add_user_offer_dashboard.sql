-- Private account dashboard state. Offer identity is intentionally the existing
-- public source + UUID pair: ingested rows resolve through offers and manual
-- rows resolve through site_offers. The snapshot keeps a removed offer useful
-- without ever redirecting a saved record to a different title.
create table public.user_offer_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  offer_source text not null check (offer_source in ('ingested', 'manual')),
  offer_id uuid not null,
  title text not null,
  image_url text,
  payout_usd numeric check (payout_usd is null or payout_usd >= 0),
  platform_name text,
  country_code text,
  devices text[] not null default '{}',
  offer_path text not null check (
    offer_path ~ '^/offers/[A-Za-z0-9][A-Za-z0-9-]*$'
    or offer_path ~ '^/go/([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[1-5][0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}|earn/[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[1-5][0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}|platform/[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[1-5][0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12})$'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, offer_source, offer_id)
);

create table public.user_offer_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  offer_source text not null check (offer_source in ('ingested', 'manual')),
  offer_id uuid not null,
  title text not null,
  image_url text,
  payout_usd numeric check (payout_usd is null or payout_usd >= 0),
  platform_name text,
  country_code text,
  devices text[] not null default '{}',
  offer_path text not null check (
    offer_path ~ '^/offers/[A-Za-z0-9][A-Za-z0-9-]*$'
    or offer_path ~ '^/go/([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[1-5][0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}|earn/[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[1-5][0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}|platform/[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[1-5][0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12})$'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  unique (user_id, offer_source, offer_id)
);

create table public.user_offer_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  offer_source text not null check (offer_source in ('ingested', 'manual')),
  offer_id uuid not null,
  title text not null,
  image_url text,
  payout_usd numeric check (payout_usd is null or payout_usd >= 0),
  platform_name text,
  country_code text,
  devices text[] not null default '{}',
  offer_path text not null check (
    offer_path ~ '^/offers/[A-Za-z0-9][A-Za-z0-9-]*$'
    or offer_path ~ '^/go/([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[1-5][0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}|earn/[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[1-5][0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}|platform/[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[1-5][0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12})$'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tracking_started_at timestamptz not null default now(),
  unique (user_id, offer_source, offer_id)
);

create index user_offer_favorites_user_created_idx on public.user_offer_favorites (user_id, created_at desc);
create index user_offer_views_user_last_viewed_idx on public.user_offer_views (user_id, last_viewed_at desc);
create index user_offer_tracking_user_started_idx on public.user_offer_tracking (user_id, tracking_started_at desc);

alter table public.user_offer_favorites enable row level security;
alter table public.user_offer_views enable row level security;
alter table public.user_offer_tracking enable row level security;

revoke all on table public.user_offer_favorites, public.user_offer_views, public.user_offer_tracking from anon, authenticated;
grant select, insert, update, delete on public.user_offer_favorites to authenticated;
grant select, insert, update, delete on public.user_offer_views to authenticated;
grant select, insert, update, delete on public.user_offer_tracking to authenticated;

create policy "user_offer_favorites: self only" on public.user_offer_favorites for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_offer_views: self only" on public.user_offer_views for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_offer_tracking: self only" on public.user_offer_tracking for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.trim_my_offer_view_history()
returns void
language sql
security invoker
set search_path = public, pg_temp
as $$
  delete from public.user_offer_views
  where user_id = (select auth.uid())
    and id in (
      select id
      from public.user_offer_views
      where user_id = (select auth.uid())
      order by last_viewed_at desc, id desc
      offset 50
    );
$$;

revoke all on function public.trim_my_offer_view_history() from public, anon, authenticated;
grant execute on function public.trim_my_offer_view_history() to authenticated;
