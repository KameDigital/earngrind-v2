import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { renderMarkdown } from "@/app/guides/[slug]/markdownRenderer";
import { analyzeGuideBodyHealth } from "@/lib/guide-body-health";
import { analyzeGuideQuality } from "@/lib/guide-quality";

function normalizeSlug(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, "-");
}

type ChildGuidePage = {
    title?: unknown;
    slug?: unknown;
    keyword_target?: unknown;
    excerpt?: unknown;
};

function textOrNull(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildChildGuideBody(input: {
    parentTitle: string;
    parentSlug: string;
    childTitle: string;
    siblingLinks: Array<{ title: string; slug: string }>;
}) {
    return renderMarkdown([
        "## Editorial Draft",
        `${input.childTitle} is part of the ${input.parentTitle} guide set. Expand this page with a unique angle, verified sources, and page-specific steps before publishing.`,
        "",
        "## Related Pages",
        `- [Main guide](/guides/${input.parentSlug})`,
        ...input.siblingLinks
            .filter((page) => page.slug !== input.parentSlug)
            .map((page) => `- [${page.title}](/guides/${page.slug})`),
    ].join("\n"));
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
        keyword_target, keyword_cluster_id, keyword_intent, guide_type, needs_variation,
        payout_verified_at, tasks_verified_at, provider_terms_verified_at, last_offer_check_at,
    } = body;
    const childPages = Array.isArray(body.child_pages)
        ? (body.child_pages as ChildGuidePage[])
            .map((page) => ({
                title: textOrNull(page.title),
                slug: textOrNull(page.slug),
                keyword_target: textOrNull(page.keyword_target),
                excerpt: textOrNull(page.excerpt),
            }))
            .filter((page) => page.title || page.slug)
        : [];

    if (!title || !slug || !game_id) {
        return NextResponse.json({ error: "title, slug, and game_id are required." }, { status: 400 });
    }
    const incompleteChildPage = childPages.find((page) => !page.title || !page.slug);
    if (incompleteChildPage) {
        return NextResponse.json({ error: "Each child guide page needs both title and slug." }, { status: 400 });
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

    const childGuidePages = childPages.map((page) => ({
        title: String(page.title),
        slug: normalizeSlug(String(page.slug)),
        keyword_target: page.keyword_target,
        excerpt: page.excerpt,
    }));
    const requestedSlugs = [normalizedSlug, ...childGuidePages.map((page) => page.slug)];
    const duplicateRequestedSlug = requestedSlugs.find((requestedSlug, index) => requestedSlugs.indexOf(requestedSlug) !== index);
    if (duplicateRequestedSlug) {
        return NextResponse.json({ error: `Duplicate guide slug in request: ${duplicateRequestedSlug}` }, { status: 409 });
    }

    const { data: existingSlugs, error: slugError } = await supabase
        .from("guides")
        .select("slug")
        .in("slug", requestedSlugs);
    if (slugError) return NextResponse.json({ error: slugError.message }, { status: 500 });
    if (existingSlugs && existingSlugs.length > 0) {
        return NextResponse.json({ error: `Guide slug already exists: ${existingSlugs.map((row) => row.slug).join(", ")}` }, { status: 409 });
    }

    const renderedBody = body_md ? renderMarkdown(body_md) : "";
    const nextStatus = status || "draft";
    if (nextStatus === "published") {
        const quality = analyzeGuideQuality({
            bodyHtml: renderedBody,
            seoTitle: seo_title,
            seoDescription: seo_description,
            keywordTarget: keyword_target,
            payoutVerifiedAt: payout_verified_at,
            tasksVerifiedAt: tasks_verified_at,
            providerTermsVerifiedAt: provider_terms_verified_at,
            lastOfferCheckAt: last_offer_check_at,
        });
        if (quality.requiredErrors.length > 0) {
            return NextResponse.json({ error: "Publish blocked by checklist.", quality }, { status: 422 });
        }
    }

    const sharedClusterId = keyword_cluster_id || normalizedSlug;
    const siblingLinks = [
        { title: String(title), slug: normalizedSlug },
        ...childGuidePages.map((page) => ({ title: page.title, slug: page.slug })),
    ];
    const baseGuideRow = {
        title,
        slug: normalizedSlug,
        game_id: gameId,
        excerpt: excerpt || null,
        body_md: renderedBody || null,
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
        status: nextStatus,
        platform_filter: platform_filter || "android",
        primary_offer_id: primary_offer_id || null,
        disable_auto_offer_matching: disable_auto_offer_matching === true,
        keyword_target: keyword_target || null,
        keyword_cluster_id: sharedClusterId,
        keyword_intent: keyword_intent || null,
        guide_type: guide_type || "game_offer",
        needs_variation: Boolean(needs_variation),
        payout_verified_at: payout_verified_at || null,
        tasks_verified_at: tasks_verified_at || null,
        provider_terms_verified_at: provider_terms_verified_at || null,
        last_offer_check_at: last_offer_check_at || null,
        published_at: nextStatus === "published" ? new Date().toISOString() : null,
        author_id: user.id,
    };
    const childGuideRows = childGuidePages.map((page) => ({
        ...baseGuideRow,
        title: page.title,
        slug: page.slug,
        excerpt: page.excerpt || `Draft page in the ${title} guide set.`,
        body_md: buildChildGuideBody({
            parentTitle: String(title),
            parentSlug: normalizedSlug,
            childTitle: page.title,
            siblingLinks,
        }),
        seo_title: page.title,
        seo_description: page.excerpt || seo_description || null,
        status: "draft",
        keyword_target: page.keyword_target || page.title,
        published_at: null,
    }));

    const { data, error } = await supabase.from("guides").insert([
        baseGuideRow,
        ...childGuideRows,
    ]).select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(childGuideRows.length > 0 ? { guide: data?.[0] ?? null, guides: data ?? [] } : data?.[0], { status: 201 });
}
