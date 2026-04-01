import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const supabase = createClient();
    const { searchParams } = req.nextUrl;
    const gameSlug = searchParams.get("game_slug") ?? "";

    let query = supabase
        .from("guides")
        .select(`
            id, title, slug, difficulty, estimated_time, max_payout_usd,
            platform_filter, published_at, updated_at,
            games:game_id ( id, name, slug, thumbnail_url )
        `)
        .eq("status", "published")
        .order("published_at", { ascending: false });

    if (gameSlug) {
        // filter via join
        query = query.eq("games.slug", gameSlug);
    }

    const { data, error } = await query;

    if (error) {
        console.error("[GET /api/guides]", error);
        return NextResponse.json({ error: "internal", message: error.message }, { status: 500 });
    }

    // Filter nulls when gameSlug is used (PostgREST returns rows with null join when filtering)
    const filtered = gameSlug
        ? (data ?? []).filter((g: { games: unknown }) => g.games !== null)
        : (data ?? []);

    return NextResponse.json({ data: filtered }, {
        headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=600" },
    });
}
