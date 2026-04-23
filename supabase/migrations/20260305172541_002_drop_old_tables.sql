
-- Drop old minimal tables (they had different schema — text checks vs enums)
-- Data preserved note: existing 2 reviews + 1 blog_post will be lost (dev data only)
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.blog_posts CASCADE;
;
