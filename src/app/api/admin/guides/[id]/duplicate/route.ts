import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function checkAdmin(supabase: ReturnType<typeof createClient>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) return null;
    return user;
}

async function buildUniqueSlug(supabase: ReturnType<typeof createClient>, baseSlug: string) {
    let candidate = `${baseSlug}-copy`;
    let suffix = 2;
    for (;;) {
        const { data, error } = await supabase.from("guides").select("id").eq("slug", candidate).maybeSingle();
        if (error) throw error;
        if (!data) return candidate;
        candidate = `${baseSlug}-copy-${suffix}`;
        suffix += 1;
    }
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createClient();
    const user = await checkAdmin(supabase);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: guide, error: guideError } = await supabase
        .from("guides")
        .select("*")
        .eq("id", params.id)
        .maybeSingle();

    if (guideError) return NextResponse.json({ error: guideError.message }, { status: 500 });
    if (!guide) return NextResponse.json({ error: "Guide not found." }, { status: 404 });

    let nextSlug: string;
    try {
        nextSlug = await buildUniqueSlug(supabase, guide.slug);
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to build unique slug." }, { status: 500 });
    }

    const { data, error } = await supabase
        .from("guides")
        .insert({
            title: `${guide.title} (Copy)`,
            slug: nextSlug,
            game_id: guide.game_id,
            excerpt: guide.excerpt,
            body_md: guide.body_md,
            difficulty: guide.difficulty,
            estimated_time: guide.estimated_time,
            max_payout_usd: guide.max_payout_usd,
            tips: guide.tips,
            key_takeaways: guide.key_takeaways,
            checklist_items: guide.checklist_items,
            video_url: guide.video_url,
            layout_style: guide.layout_style,
            show_related_offers: guide.show_related_offers,
            show_related_guides: guide.show_related_guides,
            seo_title: guide.seo_title,
            seo_description: guide.seo_description,
            status: "draft",
            platform_filter: guide.platform_filter ?? "android",
            published_at: null,
            updated_at: new Date().toISOString(),
            author_id: user.id,
        })
        .select("id")
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id }, { status: 201 });
}
