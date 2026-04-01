import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
    _req: NextRequest,
    { params }: { params: { slug: string } }
) {
    const supabase = createClient();
    const { slug } = params;

    const { data: review, error } = await supabase
        .from("reviews")
        .select(`
            id, slug, title, excerpt, body_md, verdict,
            rating_overall, rating_payout, rating_ux, rating_support, rating_trust,
            pros, cons, published_at, updated_at,
            seo_title, seo_description,
            platforms:platform_id (
                id, name, slug, logo_url, platform_kind, affiliate_template, countries
            )
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

    if (error || !review) {
        return NextResponse.json({ error: "not_found", message: `Review not found: ${slug}` }, { status: 404 });
    }

    return NextResponse.json({ review }, {
        headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=600" },
    });
}
