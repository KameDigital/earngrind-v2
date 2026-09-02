-- Harden search_games RPC with explicit search path lockdown
-- Prevents search_path hijacking on SECURITY DEFINER function per Supabase security guidelines.

CREATE OR REPLACE FUNCTION public.search_games(search_term text, max_results int DEFAULT 8)
RETURNS TABLE (
    id uuid,
    name text,
    slug text,
    thumbnail_url text,
    devices text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT
        g.id,
        g.name,
        g.slug,
        g.thumbnail_url,
        g.devices
    FROM public.games g
    WHERE
        g.name ILIKE '%' || search_term || '%'
        OR similarity(g.name, search_term) > 0.2
    ORDER BY
        similarity(g.name, search_term) DESC,
        g.name ASC
    LIMIT max_results;
$$;

REVOKE ALL ON FUNCTION public.search_games(text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_games(text, int) TO anon, authenticated, service_role;
