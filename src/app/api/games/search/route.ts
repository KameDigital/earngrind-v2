import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const supabase = createClient();
    const { searchParams } = req.nextUrl;

    const q = searchParams.get("q");
    const limit = Math.min(20, parseInt(searchParams.get("limit") || "8"));

    if (!q || q.length < 2) {
        return NextResponse.json({ data: [] }, {
            headers: { "Cache-Control": "public, max-age=30" }
        });
    }

    // Use pg_trgm similarity or array match on aliases
    const { data, error } = await supabase.rpc(
        "search_games", // Need a tiny RPC for this specific fuzzy match if direct query is complex, 
        // but we can also use direct postgREST filters for simple cases.
        // For pure Supabase JS without custom RPC, we can use an or() chain
        // but to use the similarity() order we need RPC.
        { search_term: q, max_results: limit }
    );

    // If RPC isn't defined, fallback to a standard ILIKE query:
    if (error && error.code === '42883') { // undefined function
        const { data: fallbackData, error: fallbackError } = await supabase
            .from("games")
            .select("id, name, slug, thumbnail_url, devices")
            .ilike("name", `%${q}%`)
            .limit(limit);

        if (fallbackError) {
            console.error("[GET /api/games/search fallback]", fallbackError);
            return NextResponse.json({ error: "internal", message: fallbackError.message }, { status: 500 });
        }

        // We'd ideally join with payout_max_by_game here too, but ilike fallback is basic.
        return NextResponse.json({ data: fallbackData ?? [] }, {
            headers: { "Cache-Control": "public, max-age=30" }
        });
    }

    if (error) {
        console.error("[GET /api/games/search]", error);
        return NextResponse.json({ error: "internal", message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] }, {
        headers: { "Cache-Control": "public, max-age=30" }
    });
}
