import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
    _req: NextRequest,
    { params }: { params: { slug: string } }
) {
    const supabase = createClient();
    const { slug } = params;

    const { data: guide, error } = await supabase
        .from("guides")
        .select(`
            id, title, slug, body_md, difficulty, estimated_time,
            max_payout_usd, tips, platform_filter, video_url,
            seo_title, seo_description, published_at, updated_at,
            games:game_id ( id, name, slug, thumbnail_url, description )
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

    if (error || !guide) {
        return NextResponse.json({ error: "not_found", message: `Guide not found: ${slug}` }, { status: 404 });
    }

    return NextResponse.json({ guide }, {
        headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=600" },
    });
}
