-- 1. Create Tables
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    body_md TEXT NOT NULL,
    rating NUMERIC,
    pros JSONB DEFAULT '[]'::jsonb,
    cons JSONB DEFAULT '[]'::jsonb,
    affiliate_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    body_md TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Conservative MVP approach: Only allow SELECT on 'published' rows for public/authenticated users.
-- Admins will manage content directly via the Supabase Dashboard (no client-side write access).
CREATE POLICY "Public can read published reviews" 
ON public.reviews 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Public can read published blog posts" 
ON public.blog_posts 
FOR SELECT 
USING (status = 'published');

-- 4. Create updated_at trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- GPT offer ingestion foundation
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('html', 'api')),
    base_url TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    last_run_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.import_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    total_found INTEGER NOT NULL DEFAULT 0,
    total_new INTEGER NOT NULL DEFAULT 0,
    total_updated INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.raw_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
    raw_title TEXT NOT NULL,
    raw_payload_json JSONB NOT NULL,
    raw_payout NUMERIC(12, 2),
    raw_currency TEXT,
    raw_image_url TEXT,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sources_active ON public.sources(active);
CREATE INDEX IF NOT EXISTS idx_import_runs_source_started_at ON public.import_runs(source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_offers_source_fetched_at ON public.raw_offers(source_id, fetched_at DESC);
