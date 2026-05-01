import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { insertApprovedInternalLinks, type GuideLinkSuggestion } from "@/lib/guide-internal-linker";

type FixType =
    | "add_internal_links"
    | "add_cta_section"
    | "add_faq_section"
    | "expand_thin_content"
    | "regenerate_variation"
    | "move_to_queue";

const FIX_TYPES = new Set<FixType>([
    "add_internal_links",
    "add_cta_section",
    "add_faq_section",
    "expand_thin_content",
    "regenerate_variation",
    "move_to_queue",
]);

const ANGLES = ["speedrun", "beginner", "hardcore", "roi-focused", "warning-focused"];

async function checkAdmin(supabase: ReturnType<typeof createClient>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) return null;
    return user;
}

function sectionExists(html: string, titlePattern: RegExp) {
    return titlePattern.test(html.replace(/\s+/g, " "));
}

function insertBeforeFinalVerdict(html: string, section: string) {
    const finalVerdictMatch = html.match(/<h2\b[^>]*>\s*Final Verdict\s*<\/h2>/i);
    if (finalVerdictMatch?.index !== undefined) {
        return `${html.slice(0, finalVerdictMatch.index)}${section}${html.slice(finalVerdictMatch.index)}`;
    }
    return `${html}${section}`;
}

function addCtaSection(html: string) {
    if (sectionExists(html, /<h2\b[^>]*>\s*Start This Offer\s*<\/h2>/i)) {
        return { html, changed: false };
    }
    const section = [
        "<h2>Start This Offer</h2>",
        "<p>Compare the highest-paying versions of this offer on EarnGrind before starting. Payouts and requirements can change, so check the live offer details first.</p>",
    ].join("");
    return { html: insertBeforeFinalVerdict(html, section), changed: true };
}

function addFaqSection(html: string) {
    if (sectionExists(html, /<h2\b[^>]*>\s*FAQ\s*<\/h2>|<h[23]\b[^>]*>\s*FAQ\b/i)) {
        return { html, changed: false };
    }
    const section = [
        "<h2>FAQ</h2>",
        "<h3>Is this offer worth it?</h3>",
        "<p>It can be worth considering if the live payout is strong, the requirements are realistic, and you can follow the milestone path without overspending.</p>",
        "<h3>How long does it take?</h3>",
        "<p>Completion time depends on the current offer terms, your device, and how consistently you can work through the required milestones.</p>",
        "<h3>Can it be completed for free?</h3>",
        "<p>Some offers may be possible without spending, but always compare the reward against the time and any optional purchases before starting.</p>",
        "<h3>What should I check before starting?</h3>",
        "<p>Verify the live payout, deadline, tracking rules, device requirements, and platform terms before clicking into the offer.</p>",
    ].join("");
    return { html: insertBeforeFinalVerdict(html, section), changed: true };
}

function expandThinContent(html: string) {
    if (sectionExists(html, /<h2\b[^>]*>\s*Editor Expansion Needed\s*<\/h2>/i)) {
        return { html, changed: false };
    }
    const section = [
        "<h2>Editor Expansion Needed</h2>",
        "<p><strong>Editor note:</strong> Expand this draft with verified details before publishing. Do not invent facts.</p>",
        "<ul>",
        "<li>Confirm the current payout range and deadline from live offer data.</li>",
        "<li>Add the most important milestones or tasks users should understand before starting.</li>",
        "<li>Explain the biggest risk, slowdown, or tracking issue users should watch for.</li>",
        "<li>Add one practical strategy section based on verified requirements.</li>",
        "<li>Confirm whether the offer is better suited for beginners, active daily players, or advanced users.</li>",
        "</ul>",
    ].join("");
    return { html: insertBeforeFinalVerdict(html, section), changed: true };
}

function parseSuggestions(value: unknown): GuideLinkSuggestion[] {
    const rawSuggestions = Array.isArray(value) ? value : [];
    const suggestions: Array<GuideLinkSuggestion | null> = rawSuggestions
        .map((item) => {
            if (!item || typeof item !== "object") return null;
            const source = item as Record<string, unknown>;
            const label = typeof source.label === "string" ? source.label : typeof source.title === "string" ? source.title : "";
            const href = typeof source.href === "string" ? source.href : typeof source.url === "string" ? source.url : "";
            if (!label || !href) return null;
            return {
                label,
                href,
                ...(typeof source.type === "string" ? { type: source.type } : {}),
            };
        });
    return suggestions.filter((item): item is GuideLinkSuggestion => item !== null);
}

function addInternalLinks(html: string, suggestionsValue: unknown) {
    if (sectionExists(html, /<h2\b[^>]*>\s*Related Guides &(?:amp;|and) Offers\s*<\/h2>/i)) {
        return { html, changed: false };
    }
    const suggestions = parseSuggestions(suggestionsValue);
    const links = suggestions.length > 0 ? suggestions : [
        { label: "Compare highest-paying GPT offers", href: "/offers", type: "offers" },
        { label: "Browse game offer guides", href: "/guides", type: "guides" },
        { label: "Compare trusted GPT sites", href: "/best-gpt-sites", type: "platforms" },
    ];
    const nextHtml = insertApprovedInternalLinks(html, links);
    return { html: nextHtml, changed: nextHtml !== html };
}

async function buildUniqueSlug(supabase: ReturnType<typeof createClient>, baseSlug: string) {
    let candidate = `${baseSlug}-variation-draft`;
    let suffix = 2;
    for (;;) {
        const { data, error } = await supabase.from("guides").select("id").eq("slug", candidate).maybeSingle();
        if (error) throw error;
        if (!data) return candidate;
        candidate = `${baseSlug}-variation-draft-${suffix}`;
        suffix += 1;
    }
}

function nextAngle(current: string | null | undefined) {
    return ANGLES.find((angle) => angle !== current) ?? "roi-focused";
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createClient();
    const user = await checkAdmin(supabase);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => null);
    const fixType = body?.fixType as FixType | undefined;
    if (!fixType || !FIX_TYPES.has(fixType)) {
        return NextResponse.json({ error: "Invalid fix type." }, { status: 400 });
    }

    const { data: guide, error: guideError } = await supabase
        .from("guides")
        .select("*")
        .eq("id", params.id)
        .maybeSingle();

    if (guideError) return NextResponse.json({ error: guideError.message }, { status: 500 });
    if (!guide) return NextResponse.json({ error: "Guide not found." }, { status: 404 });

    if (fixType === "regenerate_variation") {
        let slug: string;
        try {
            slug = await buildUniqueSlug(supabase, guide.slug);
        } catch (error) {
            return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create unique slug." }, { status: 500 });
        }

        const { data, error } = await supabase.from("guides").insert({
            title: `${guide.title} Variation Draft`,
            slug,
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
            content_status: "draft",
            platform_filter: guide.platform_filter ?? "android",
            keyword_target: guide.keyword_target,
            guide_type: guide.guide_type,
            batch_name: guide.batch_name,
            platform_name: guide.platform_name,
            keyword_cluster_id: guide.keyword_cluster_id,
            keyword_intent: guide.keyword_intent,
            angle_type: nextAngle(guide.angle_type),
            needs_variation: false,
            internal_link_suggestions: guide.internal_link_suggestions,
            editor_notes: `Variation draft created from "${guide.title}" on ${new Date().toISOString().slice(0, 10)}. Rewrite intro, examples, and section order before publishing.`,
            published_at: null,
            updated_at: new Date().toISOString(),
            author_id: user.id,
        }).select("id").single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, draftId: data.id }, { status: 201 });
    }

    if (fixType === "move_to_queue") {
        const note = `Moved to content queue from optimization recommendations on ${new Date().toISOString().slice(0, 10)}.`;
        const existingNotes = typeof guide.editor_notes === "string" && guide.editor_notes.trim() ? `${guide.editor_notes}\n\n` : "";
        const { error } = await supabase.from("guides").update({
            content_status: "needs_edit",
            editor_notes: `${existingNotes}${note}`,
            updated_at: new Date().toISOString(),
        }).eq("id", params.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, changed: true });
    }

    const currentHtml = guide.body_md ?? "";
    const result = fixType === "add_internal_links"
        ? addInternalLinks(currentHtml, guide.internal_link_suggestions)
        : fixType === "add_cta_section"
            ? addCtaSection(currentHtml)
            : fixType === "add_faq_section"
                ? addFaqSection(currentHtml)
                : expandThinContent(currentHtml);

    if (!result.changed) {
        return NextResponse.json({ ok: true, changed: false, message: "No changes needed." });
    }

    const { error } = await supabase.from("guides").update({
        body_md: result.html,
        updated_at: new Date().toISOString(),
    }).eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, changed: true });
}
