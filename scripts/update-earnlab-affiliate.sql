update public.platforms
set
  affiliate_template = 'https://gain.gg/r/macko',
  updated_at = now()
where slug = 'earnlab'
returning id, name, slug, affiliate_template;
