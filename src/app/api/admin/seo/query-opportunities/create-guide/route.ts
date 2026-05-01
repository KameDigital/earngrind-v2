import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { suggestedHeadingFromQuery } from "@/lib/search-console-opportunities";

async function checkAdmin(supabase: ReturnType<typeof createClient>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || !["admin", "editor"].includes(profile.role)) return null;
    return user;
}

function slugify(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "search-console-guide";
}

async function uniqueSlug(supabase: ReturnType<typeof createClient>, base: string) {
    let candidate = slugify(base);
    let suffix = 2;
    for (;;) {
        const { data, error } = await supabase.from("guides").select("id").eq("slug", candidate).maybeSingle();
        if (error) throw error;
        if (!data) return candidate;
        candidate = `${slugify(base)}-${suffix}`;
        suffix += 1;
    }
}

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const user = await checkAdmin(supabase);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => null);
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const pageUrl = typeof body?.pageUrl === "string" ? body.pageUrl.trim() : "";
    const guideId = typeof body?.guideId === "string" ? body.guideId : null;
    const opportunityType = typeof body?.opportunityType === "string" ? body.opportunityType : "new_guide";
    const impressions = Number(body?.impressions ?? 0);
    const clicks = Number(body?.clicks ?? 0);
    const position = Number(body?.position ?? 0);

    if (!query) return NextResponse.json({ error: "Query is required." }, { status: 400 });

    const [{ data: sourceGuide }, { data: fallbackGame }] = await Promise.all([
        guideId ? supabase.from("guides").select("game_id, max_payout_usd").eq("id", guideId).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("games").select("id").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const gameId = sourceGuide?.game_id ?? fallbackGame?.id;
    if (!gameId) return NextResponse.json({ error: "No game record available for draft creation." }, { status: 422 });

    let slug: string;
    try {
        slug = await uniqueSlug(supabase, query);
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create slug." }, { status: 500 });
    }

    const title = `${suggestedHeadingFromQuery(query)} Guide`;
    const bodyHtml = [
        `<h2>${suggestedHeadingFromQuery(query)}</h2>`,
        `<p><strong>Editor note:</strong> This draft was created from a Google Search Console query opportunity. Expand it with verified offer data, current payouts, task requirements, and internal links before publishing.</p>`,
        "<h2>What To Verify</h2>",
        "<ul>",
        "<li>Current payout and platform availability.</li>",
        "<li>Whether this query needs a standalone guide or should become a section in an existing guide.</li>",
        "<li>Related guides, offers, and game pages to link internally.</li>",
        "</ul>",
        "<h2>Search Console Context</h2>",
        `<p>Source query: <strong>${query.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong>. Imported metrics: ${impressions} impressions, ${clicks} clicks, average position ${position || "n/a"}.</p>`,
    ].join("");

    const { data, error } = await supabase.from("guides").insert({
        title,
        slug,
        game_id: gameId,
        excerpt: `Draft guide created from Search Console query opportunity: ${query}.`,
        body_md: bodyHtml,
        difficulty: null,
        estimated_time: null,
        max_payout_usd: sourceGuide?.max_payout_usd ?? null,
        tips: [],
        key_takeaways: `Search Console opportunity: ${query}`,
        checklist_items: [],
        layout_style: "classic",
        show_related_offers: true,
        show_related_guides: true,
        seo_title: `${title} | EarnGrind`,
        seo_description: `Draft guide targeting "${query}" from Search Console data. Verify live offer details, payout value, and user intent before publishing.`,
        status: "draft",
        content_status: "needs_edit",
        platform_filter: "android",
        keyword_target: query,
        guide_type: "game_offer",
        batch_name: "Search Console Opportunities",
        editor_notes: `Created from Search Console opportunity (${opportunityType}). Page: ${pageUrl || "n/a"}. Query: ${query}. Impressions: ${impressions}. Clicks: ${clicks}. Position: ${position || "n/a"}.`,
        author_id: user.id,
        updated_at: new Date().toISOString(),
    }).select("id").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id }, { status: 201 });
}
