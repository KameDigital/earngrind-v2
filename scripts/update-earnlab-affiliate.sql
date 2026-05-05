update public.platforms
set
  affiliate_template = 'https://earnlab.com/r/mac',
  updated_at = now()
where slug = 'earnlab'
returning id, name, slug, affiliate_template;
