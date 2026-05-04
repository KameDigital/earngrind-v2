import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { renderMarkdown } from "@/app/guides/[slug]/markdownRenderer";
import { analyzeGuideQuality } from "@/lib/guide-quality";
import { analyzeGuideBodyHealth } from "@/lib/guide-body-health";

async function checkAdmin(supabase: ReturnType<typeof createClient>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) return null;
    return user;
}

function normalizeSlug(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createClient();
    const user = await checkAdmin(supabase);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const hasField = (field: string) => Object.prototype.hasOwnProperty.call(body, field);
    const {
        title, slug, game_id, excerpt, body_md, difficulty, estimated_time,
        max_payout_usd, tips, key_takeaways, checklist_items, video_url,
        layout_style, show_related_offers, show_related_guides,
        seo_title, seo_description, status, platform_filter,
        primary_offer_id, disable_auto_offer_matching,
        keyword_target, keyword_cluster_id, keyword_intent, guide_type, needs_variation,
        payout_verified_at, tasks_verified_at, provider_terms_verified_at, last_offer_check_at,
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
        .neq("id", params.id)
        .maybeSingle();
    if (slugError) return NextResponse.json({ error: slugError.message }, { status: 500 });
    if (existingSlug) {
        return NextResponse.json({ error: "Guide slug already exists." }, { status: 409 });
    }

    const renderedBody = body_md ? renderMarkdown(body_md) : "";

    // Set published_at on first publish
    let publishedAt: string | undefined;
    if (status === "published") {
        const { data: existing } = await supabase
            .from("guides")
            .select("published_at, status, keyword_target, payout_verified_at, tasks_verified_at, provider_terms_verified_at, last_offer_check_at")
            .eq("id", params.id)
            .single();
        const quality = analyzeGuideQuality({
            bodyHtml: renderedBody,
            seoTitle: seo_title,
            seoDescription: seo_description,
            keywordTarget: keyword_target ?? existing?.keyword_target,
            payoutVerifiedAt: payout_verified_at ?? existing?.payout_verified_at,
            tasksVerifiedAt: tasks_verified_at ?? existing?.tasks_verified_at,
            providerTermsVerifiedAt: provider_terms_verified_at ?? existing?.provider_terms_verified_at,
            lastOfferCheckAt: last_offer_check_at ?? existing?.last_offer_check_at,
        });
        if (quality.requiredErrors.length > 0) {
            return NextResponse.json({ error: "Publish blocked by checklist.", quality }, { status: 422 });
        }
        if (existing && existing.status !== "published" && !existing.published_at) {
            publishedAt = new Date().toISOString();
        }
    }

    const { data, error } = await supabase.from("guides").update({
        ...(title && { title }),
        ...(slug && { slug: normalizedSlug }),
        ...(game_id && { game_id: gameId }),
        excerpt: excerpt ?? null,
        body_md: renderedBody || null,
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
        primary_offer_id: primary_offer_id || null,
        disable_auto_offer_matching: disable_auto_offer_matching === true,
        ...(hasField("keyword_target") && { keyword_target: keyword_target || null }),
        ...(hasField("keyword_cluster_id") && { keyword_cluster_id: keyword_cluster_id || null }),
        ...(hasField("keyword_intent") && { keyword_intent: keyword_intent || null }),
        ...(hasField("guide_type") && { guide_type: guide_type || "game_offer" }),
        ...(hasField("needs_variation") && { needs_variation: Boolean(needs_variation) }),
        ...(hasField("payout_verified_at") && { payout_verified_at: payout_verified_at || null }),
        ...(hasField("tasks_verified_at") && { tasks_verified_at: tasks_verified_at || null }),
        ...(hasField("provider_terms_verified_at") && { provider_terms_verified_at: provider_terms_verified_at || null }),
        ...(hasField("last_offer_check_at") && { last_offer_check_at: last_offer_check_at || null }),
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
