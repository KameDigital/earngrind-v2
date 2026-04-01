import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("reviews")
        .select(`
            id, slug, title, excerpt, rating_overall,
            rating_payout, rating_ux, rating_trust,
            published_at, updated_at,
            platforms:platform_id ( id, name, slug, logo_url, platform_kind )
        `)
        .eq("status", "published")
        .order("published_at", { ascending: false });

    if (error) {
        console.error("[GET /api/reviews]", error);
        return NextResponse.json({ error: "internal", message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] }, {
        headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=600" },
    });
}
