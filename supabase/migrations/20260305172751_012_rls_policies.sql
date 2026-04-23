
-- ---- Enable RLS ----
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platforms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_history         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_clicks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guides                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_completions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_alerts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_comparisons ENABLE ROW LEVEL SECURITY;

-- ---- Role helper ----
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---- profiles ----
CREATE POLICY "profiles: self read"
  ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles: self update"
  ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles: admin all"
  ON public.profiles FOR ALL USING (public.get_my_role() = 'admin');

-- ---- platforms ----
CREATE POLICY "platforms: public read active"
  ON public.platforms FOR SELECT USING (is_active = TRUE);
CREATE POLICY "platforms: admin all"
  ON public.platforms FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "platforms: editor insert"
  ON public.platforms FOR INSERT WITH CHECK (public.get_my_role() IN ('admin','editor'));
CREATE POLICY "platforms: editor update"
  ON public.platforms FOR UPDATE USING (public.get_my_role() IN ('admin','editor'));

-- ---- games ----
CREATE POLICY "games: public read"
  ON public.games FOR SELECT USING (TRUE);
CREATE POLICY "games: admin all"
  ON public.games FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "games: editor insert"
  ON public.games FOR INSERT WITH CHECK (public.get_my_role() IN ('admin','editor'));
CREATE POLICY "games: editor update"
  ON public.games FOR UPDATE USING (public.get_my_role() IN ('admin','editor'));

-- ---- offers ----
CREATE POLICY "offers: public read active"
  ON public.offers FOR SELECT USING (status = 'active');
CREATE POLICY "offers: admin all"
  ON public.offers FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "offers: editor insert"
  ON public.offers FOR INSERT WITH CHECK (public.get_my_role() IN ('admin','editor'));
CREATE POLICY "offers: editor update"
  ON public.offers FOR UPDATE USING (public.get_my_role() IN ('admin','editor'));

-- ---- offer_history ----
CREATE POLICY "offer_history: public read"
  ON public.offer_history FOR SELECT USING (TRUE);

-- ---- offer_clicks ----
CREATE POLICY "offer_clicks: anon insert"
  ON public.offer_clicks FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "offer_clicks: admin read"
  ON public.offer_clicks FOR SELECT USING (public.get_my_role() = 'admin');

-- ---- guides ----
CREATE POLICY "guides: public read published"
  ON public.guides FOR SELECT USING (status = 'published');
CREATE POLICY "guides: admin all"
  ON public.guides FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "guides: editor insert"
  ON public.guides FOR INSERT WITH CHECK (public.get_my_role() IN ('admin','editor'));
CREATE POLICY "guides: editor update own"
  ON public.guides FOR UPDATE USING (
    public.get_my_role() = 'admin' OR
    (public.get_my_role() = 'editor' AND author_id = auth.uid())
  );

-- ---- reviews ----
CREATE POLICY "reviews: public read published"
  ON public.reviews FOR SELECT USING (status = 'published');
CREATE POLICY "reviews: admin all"
  ON public.reviews FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "reviews: editor insert"
  ON public.reviews FOR INSERT WITH CHECK (public.get_my_role() IN ('admin','editor'));
CREATE POLICY "reviews: editor update own"
  ON public.reviews FOR UPDATE USING (
    public.get_my_role() = 'admin' OR
    (public.get_my_role() = 'editor' AND author_id = auth.uid())
  );

-- ---- blog_posts ----
CREATE POLICY "blog_posts: public read published"
  ON public.blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "blog_posts: admin all"
  ON public.blog_posts FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "blog_posts: editor insert"
  ON public.blog_posts FOR INSERT WITH CHECK (public.get_my_role() IN ('admin','editor'));
CREATE POLICY "blog_posts: editor update own"
  ON public.blog_posts FOR UPDATE USING (
    public.get_my_role() = 'admin' OR
    (public.get_my_role() = 'editor' AND author_id = auth.uid())
  );

-- ---- user personalization (self-only) ----
CREATE POLICY "bookmarks: self all"
  ON public.user_bookmarks FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "completions: self all"
  ON public.user_completions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "alerts: self all"
  ON public.offer_alerts FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "comparisons: self all"
  ON public.user_saved_comparisons FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
;
