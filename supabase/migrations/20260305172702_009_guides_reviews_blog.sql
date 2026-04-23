
CREATE TABLE public.guides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  platform_id     UUID REFERENCES public.platforms(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  body_md         TEXT,
  platform_filter device_type NOT NULL DEFAULT 'android',
  difficulty      TEXT CHECK (difficulty IN ('easy','medium','hard')),
  estimated_time  TEXT,
  max_payout_usd  NUMERIC(10,2),
  tips            TEXT[]      DEFAULT '{}',
  video_url       TEXT,
  status          content_status NOT NULL DEFAULT 'draft',
  author_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  seo_title       TEXT,
  seo_description TEXT,
  published_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_guides_updated_at
  BEFORE UPDATE ON public.guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_guides_game_id ON public.guides(game_id);
CREATE INDEX idx_guides_status  ON public.guides(status) WHERE status = 'published';

CREATE TABLE public.reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id     UUID UNIQUE REFERENCES public.platforms(id) ON DELETE SET NULL,
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  excerpt         TEXT,
  body_md         TEXT NOT NULL,
  verdict         TEXT,
  rating_overall  NUMERIC(3,1) CHECK (rating_overall BETWEEN 0 AND 5),
  rating_payout   NUMERIC(3,1) CHECK (rating_payout  BETWEEN 0 AND 5),
  rating_ux       NUMERIC(3,1) CHECK (rating_ux      BETWEEN 0 AND 5),
  rating_support  NUMERIC(3,1) CHECK (rating_support BETWEEN 0 AND 5),
  rating_trust    NUMERIC(3,1) CHECK (rating_trust   BETWEEN 0 AND 5),
  pros            TEXT[]        DEFAULT '{}',
  cons            TEXT[]        DEFAULT '{}',
  status          content_status NOT NULL DEFAULT 'draft',
  author_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  seo_title       TEXT,
  seo_description TEXT
);
CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_reviews_platform_id ON public.reviews(platform_id);
CREATE INDEX idx_reviews_status       ON public.reviews(status) WHERE status = 'published';

CREATE TABLE public.blog_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  excerpt         TEXT,
  body_md         TEXT NOT NULL,
  category        TEXT,
  tags            TEXT[]     DEFAULT '{}',
  featured_image  TEXT,
  status          content_status NOT NULL DEFAULT 'draft',
  author_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  seo_title       TEXT,
  seo_description TEXT,
  fts             TSVECTOR
);
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION blog_posts_fts_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.fts := to_tsvector('english',
    coalesce(NEW.title,'') || ' ' ||
    coalesce(NEW.excerpt,'') || ' ' ||
    coalesce(array_to_string(NEW.tags,' '),'')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_blog_posts_fts
  BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION blog_posts_fts_update();

CREATE INDEX idx_blog_posts_status ON public.blog_posts(status) WHERE status = 'published';
CREATE INDEX idx_blog_posts_fts    ON public.blog_posts USING GIN(fts);
CREATE INDEX idx_blog_posts_tags   ON public.blog_posts USING GIN(tags);
;
