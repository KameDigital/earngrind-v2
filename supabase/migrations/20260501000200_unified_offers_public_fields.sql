create or replace view public.unified_offers_view as
  select
    o.id,
    'ingested'::text as source,
    o.title,
    o.payout_usd,
    o.payout_type::text as payout_type,
    o.devices,
    o.countries,
    o.category,
    o.status::text as status,
    o.is_featured,
    o.is_ath,
    o.is_new,
    o.is_hot,
    o.is_boosted,
    o.heat_score,
    o.custom_param,
    o.offer_expires_at,
    o.updated_at,
    ('/go/' || o.id) as offer_url,
    null::text as goal_text,
    g.id as game_id,
    g.name as game_name,
    g.slug as game_slug,
    g.thumbnail_url as game_thumbnail,
    g.devices as game_devices,
    p.id as platform_id,
    p.name as platform_name,
    p.slug as platform_slug,
    p.logo_url as platform_logo,
    p.platform_kind,
    p.affiliate_template,
    null::uuid as provider_id,
    null::text as provider_name,
    to_tsvector(
      'english',
      coalesce(g.name, '') || ' ' ||
      coalesce(o.title, '') || ' ' ||
      coalesce(p.name, '')
    ) as fts,
    o.payout_usd as total_payout_usd,
    null::text as image_url
  from public.offers o
  join public.games g on g.id = o.game_id
  join public.platforms p on p.id = o.platform_id
  where o.status = 'active'

union all

  select
    so.id,
    'manual'::text as source,
    so.title,
    so.payout_usd,
    null::text as payout_type,
    so.devices,
    so.countries,
    null::text as category,
    so.status::text as status,
    false as is_featured,
    false as is_ath,
    false as is_new,
    false as is_hot,
    false as is_boosted,
    0 as heat_score,
    null::text as custom_param,
    null::timestamptz as offer_expires_at,
    so.updated_at,
    so.offer_url,
    so.goal_text,
    g.id as game_id,
    g.name as game_name,
    g.slug as game_slug,
    g.thumbnail_url as game_thumbnail,
    g.devices as game_devices,
    p.id as platform_id,
    p.name as platform_name,
    p.slug as platform_slug,
    p.logo_url as platform_logo,
    p.platform_kind,
    null::text as affiliate_template,
    pr.id as provider_id,
    pr.name as provider_name,
    to_tsvector(
      'english',
      coalesce(g.name, '') || ' ' ||
      coalesce(so.title, '') || ' ' ||
      coalesce(so.goal_text, '') || ' ' ||
      coalesce(p.name, '') || ' ' ||
      coalesce(pr.name, '')
    ) as fts,
    coalesce(so.total_payout_usd, so.payout_usd) as total_payout_usd,
    so.image_url
  from public.site_offers so
  join public.games g on g.id = so.game_id
  join public.platforms p on p.id = so.site_id
  join public.providers pr on pr.id = so.provider_id
  where so.status = 'active';

grant select on public.unified_offers_view to anon, authenticated;
