import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function checkAdmin(supabase: ReturnType<typeof createClient>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) return null;
    return user;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createClient();
    const user = await checkAdmin(supabase);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const {
        title, slug, game_id, excerpt, body_md, difficulty, estimated_time,
        max_payout_usd, tips, key_takeaways, checklist_items, video_url,
        layout_style, show_related_offers, show_related_guides,
        seo_title, seo_description, status, platform_filter,
    } = body;

    // Set published_at on first publish
    let publishedAt: string | undefined;
    if (status === "published") {
        const { data: existing } = await supabase.from("guides").select("published_at, status").eq("id", params.id).single();
        if (existing && existing.status !== "published" && !existing.published_at) {
            publishedAt = new Date().toISOString();
        }
    }

    const { data, error } = await supabase.from("guides").update({
        ...(title && { title }),
        ...(slug && { slug: slug.trim().toLowerCase().replace(/\s+/g, "-") }),
        ...(game_id && { game_id }),
        excerpt: excerpt ?? null,
        body_md: body_md ?? null,
        difficulty: difficulty || null,
        estimated_time: estimated_time || null,
        max_payout_usd: max_payout_usd ? parseFloat(max_payout_usd) : null,
        tips: Array.isArray(tips) ? tips : (tips ? tips.split("\n").map((t: string) => t.trim()).filter(Boolean) : []),
        key_takeaways: key_takeaways ?? null,
        checklist_items: Array.isArray(checklist_items)
            ? checklist_items
            : (checklist_items ? checklist_items.split("\n").map((l: string) => l.trim()).filter(Boolean) : []),
        video_url: video_url || null,
        layout_style: layout_style || "classic",
        show_related_offers: show_related_offers !== false,
        show_related_guides: show_related_guides !== false,
        seo_title: seo_title || null,
        seo_description: seo_description || null,
        status: status || "draft",
        platform_filter: platform_filter || "android",
        ...(publishedAt && { published_at: publishedAt }),
        updated_at: new Date().toISOString(),
    }).eq("id", params.id).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createClient();
    const user = await checkAdmin(supabase);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error } = await supabase.from("guides").delete().eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
