
-- search_games RPC: uses pg_trgm similarity for fuzzy game name search
CREATE OR REPLACE FUNCTION search_games(search_term text, max_results int DEFAULT 8)
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
AS $$
    SELECT
        g.id,
        g.name,
        g.slug,
        g.thumbnail_url,
        g.devices
    FROM games g
    WHERE
        g.name ILIKE '%' || search_term || '%'
        OR similarity(g.name, search_term) > 0.2
    ORDER BY
        similarity(g.name, search_term) DESC,
        g.name ASC
    LIMIT max_results;
$$;
;
