-- Migration to add completed_desc sorting support to search_public_offers
create or replace function public.search_public_offers(
  p_q text default '',
  p_game_slug text default '',
  p_platform_id text default '',
  p_platform_kind text default '',
  p_device text default '',
  p_country text default '',
  p_payout_type text default '',
  p_source text default '',
  p_is_new boolean default false,
  p_is_hot boolean default false,
  p_is_ath boolean default false,
  p_is_boosted boolean default false,
  p_min_payout numeric default 0.05,
  p_sort text default 'payout_desc',
  p_page integer default 1,
  p_per_page integer default 20
)
returns table (
  id uuid,
  source text,
  title text,
  payout_usd numeric,
  payout_type text,
  devices text[],
  countries text[],
  category text,
  status text,
  is_featured boolean,
  is_ath boolean,
  is_new boolean,
  is_hot boolean,
  is_boosted boolean,
  heat_score numeric,
  custom_param text,
  offer_expires_at timestamptz,
  updated_at timestamptz,
  offer_url text,
  goal_text text,
  game_id uuid,
  game_name text,
  game_slug text,
  game_thumbnail text,
  game_devices text[],
  platform_id uuid,
  platform_name text,
  platform_slug text,
  platform_logo text,
  platform_kind text,
  affiliate_template text,
  provider_id uuid,
  provider_name text,
  fts tsvector,
  total_payout_usd numeric,
  image_url text,
  completion_count integer,
  total_count bigint
)
language sql
stable
set search_path = public
as $$
  with normalized as (
    select
      coalesce(nullif(trim(p_q), ''), '') as q,
      greatest(coalesce(p_min_payout, 0.05), 0) as min_payout,
      greatest(coalesce(p_page, 1), 1) as page,
      least(greatest(coalesce(p_per_page, 20), 1), 100) as per_page,
      coalesce(nullif(trim(p_sort), ''), 'payout_desc') as sort
  ),
  filtered as (
    select u.*
    from public.unified_offers_view u
    cross join normalized n
    where u.payout_usd >= n.min_payout
      and u.total_payout_usd >= n.min_payout
      and (coalesce(p_source, '') = '' or u.source = p_source)
      and (coalesce(p_game_slug, '') = '' or u.game_slug = p_game_slug)
      and (coalesce(p_platform_id, '') = '' or u.platform_id::text = p_platform_id)
      and (coalesce(p_platform_kind, '') = '' or u.platform_kind::text = p_platform_kind)
      and (coalesce(p_device, '') = '' or p_device = any(coalesce(u.devices::text[], array[]::text[])))
      and (coalesce(p_country, '') = '' or upper(p_country) = any(coalesce(u.countries::text[], array[]::text[])))
      and (coalesce(p_payout_type, '') = '' or u.payout_type = p_payout_type)
      and (not p_is_new or u.is_new)
      and (not p_is_hot or u.is_hot)
      and (not p_is_ath or u.is_ath)
      and (not p_is_boosted or u.is_boosted)
      and (
        n.q = ''
        or not exists (
          select 1
          from regexp_split_to_table(lower(n.q), '\s+') as term
          where term <> ''
            and lower(concat_ws(' ', u.title, u.game_name, u.platform_name, u.provider_name, u.category, u.goal_text)) not like '%' || term || '%'
        )
      )
  ),
  ranked as (
    select
      filtered.*,
      row_number() over (
        partition by lower(concat_ws('|',
          coalesce(filtered.game_slug, filtered.title, ''),
          coalesce(filtered.platform_id::text, filtered.platform_slug, ''),
          coalesce(filtered.provider_id::text, filtered.provider_name, '')
        ))
        order by filtered.payout_usd desc, filtered.updated_at desc, filtered.id
      ) as dedupe_rank
    from filtered
  ),
  visible as (
    select
      ranked.*,
      count(*) over () as total_count
    from ranked
    where ranked.dedupe_rank = 1
  )
  select
    visible.id::uuid,
    visible.source::text,
    visible.title::text,
    visible.payout_usd::numeric,
    visible.payout_type::text,
    visible.devices::text[],
    visible.countries::text[],
    visible.category::text,
    visible.status::text,
    visible.is_featured::boolean,
    visible.is_ath::boolean,
    visible.is_new::boolean,
    visible.is_hot::boolean,
    visible.is_boosted::boolean,
    visible.heat_score::numeric,
    visible.custom_param::text,
    visible.offer_expires_at::timestamptz,
    visible.updated_at::timestamptz,
    visible.offer_url::text,
    visible.goal_text::text,
    visible.game_id::uuid,
    visible.game_name::text,
    visible.game_slug::text,
    visible.game_thumbnail::text,
    visible.game_devices::text[],
    visible.platform_id::uuid,
    visible.platform_name::text,
    visible.platform_slug::text,
    visible.platform_logo::text,
    visible.platform_kind::text,
    visible.affiliate_template::text,
    visible.provider_id::uuid,
    visible.provider_name::text,
    visible.fts,
    visible.total_payout_usd::numeric,
    visible.image_url::text,
    visible.completion_count::integer,
    visible.total_count::bigint
  from visible
  cross join normalized n
  order by
    case when n.sort = 'completed_desc' then visible.completion_count end desc nulls last,
    case when n.sort = 'payout_asc' then visible.payout_usd end asc nulls last,
    case when n.sort = 'heat_desc' then visible.heat_score end desc nulls last,
    case when n.sort = 'newest' then visible.updated_at end desc nulls last,
    case when n.sort = 'payout_desc' or n.sort not in ('completed_desc', 'payout_asc', 'heat_desc', 'newest') then visible.payout_usd end desc nulls last,
    visible.updated_at desc,
    visible.id
  limit (select per_page from normalized)
  offset (select (page - 1) * per_page from normalized);
$$;

revoke all on function public.search_public_offers(
  text, text, text, text, text, text, text, text, boolean, boolean, boolean, boolean, numeric, text, integer, integer
) from public;
grant execute on function public.search_public_offers(
  text, text, text, text, text, text, text, text, boolean, boolean, boolean, boolean, numeric, text, integer, integer
) to anon, authenticated;
