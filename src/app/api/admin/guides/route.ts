import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { renderMarkdown } from "@/app/guides/[slug]/markdownRenderer";
import { analyzeGuideBodyHealth } from "@/lib/guide-body-health";

function normalizeSlug(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export async function POST(req: NextRequest) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role))
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const {
        title, slug, game_id, excerpt, body_md, difficulty, estimated_time,
        max_payout_usd, tips, key_takeaways, checklist_items, video_url,
        layout_style, show_related_offers, show_related_guides,
        seo_title, seo_description, status, platform_filter,
        primary_offer_id, disable_auto_offer_matching,
    } = body;

    if (!title || !slug || !game_id) {
        return NextResponse.json({ error: "title, slug, and game_id are required." }, { status: 400 });
    }

    const bodyHealth = analyzeGuideBodyHealth(body_md);
    if (bodyHealth.hasMixedMarkdownHtml) {
        return NextResponse.json({
            error: "Guide body mixes Markdown headings with raw HTML. Convert the HTML to Markdown or use the rich text editor before saving.",
            bodyHealth,
        }, { status: 422 });
    }

    const normalizedSlug = normalizeSlug(String(slug));
    const gameId = String(game_id);

    const { data: gameExists, error: gameError } = await supabase
        .from("games")
        .select("id")
        .eq("id", gameId)
        .maybeSingle();

    if (gameError) return NextResponse.json({ error: gameError.message }, { status: 500 });
    if (!gameExists) {
        return NextResponse.json({ error: "Invalid game_id. No matching game row found." }, { status: 422 });
    }

    const { data: existingSlug, error: slugError } = await supabase
        .from("guides")
        .select("id")
        .eq("slug", normalizedSlug)
        .maybeSingle();
    if (slugError) return NextResponse.json({ error: slugError.message }, { status: 500 });
    if (existingSlug) {
        return NextResponse.json({ error: "Guide slug already exists." }, { status: 409 });
    }

    const { data, error } = await supabase.from("guides").insert({
        title,
        slug: normalizedSlug,
        game_id: gameId,
        excerpt: excerpt || null,
        body_md: body_md ? renderMarkdown(body_md) : null,
        difficulty: difficulty || null,
        estimated_time: estimated_time || null,
        max_payout_usd: max_payout_usd ? parseFloat(max_payout_usd) : null,
        tips: Array.isArray(tips) ? tips : (tips ? tips.split("\n").map((t: string) => t.trim()).filter(Boolean) : []),
        key_takeaways: key_takeaways || null,
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
        primary_offer_id: primary_offer_id || null,
        disable_auto_offer_matching: disable_auto_offer_matching === true,
        author_id: user.id,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}
