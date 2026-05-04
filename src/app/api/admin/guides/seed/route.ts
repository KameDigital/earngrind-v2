import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Focus = "fastest completion" | "highest payout" | "beginner friendly" | "no-spend" | "platform comparison";
type Template = "milestone guide" | "speed guide" | "comparison guide" | "beginner guide";
type KeywordIntent = "informational" | "commercial_investigation" | "comparison" | "review" | "how_to" | "worth_it" | "task_specific" | "payout_specific";

type OfferTask = {
    id: string;
    sort_order: number;
    title: string;
    reward_amount: number;
    reward_display: string | null;
    task_type: string;
    time_limit_text: string | null;
};

type SeedOffer = {
    id: string;
    provider_name: string;
    platform_name: string;
    payout_usd: number;
    total_payout_usd: number;
    milestone_count: number;
    goal_text: string | null;
    tasks: OfferTask[];
};

function normalizeFocus(value: string | null): Focus {
    const valid: Focus[] = ["fastest completion", "highest payout", "beginner friendly", "no-spend", "platform comparison"];
    return valid.includes(value as Focus) ? (value as Focus) : "highest payout";
}

function normalizeTemplate(value: string | null): Template {
    const valid: Template[] = ["milestone guide", "speed guide", "comparison guide", "beginner guide"];
    return valid.includes(value as Template) ? (value as Template) : "milestone guide";
}

function normalizeKeywordIntent(value: string | null): KeywordIntent {
    const valid: KeywordIntent[] = ["informational", "commercial_investigation", "comparison", "review", "how_to", "worth_it", "task_specific", "payout_specific"];
    return valid.includes(value as KeywordIntent) ? (value as KeywordIntent) : "commercial_investigation";
}

function slugify(str: string) {
    return str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
}

function inferDifficulty(maxPayoutUsd: number, tasks: OfferTask[]) {
    if (tasks.length >= 8 || maxPayoutUsd >= 100) return "hard";
    if (tasks.length >= 4 || maxPayoutUsd >= 25) return "medium";
    return "easy";
}

function inferEstimatedTime(maxPayoutUsd: number, tasks: OfferTask[], focus: Focus) {
    if (focus === "fastest completion") return tasks.length >= 5 ? "3-7 days" : "1-3 days";
    if (focus === "no-spend") return tasks.length >= 6 ? "7-14 days" : "3-7 days";
    if (maxPayoutUsd >= 100 || tasks.length >= 8) return "14-30 days";
    if (maxPayoutUsd >= 25 || tasks.length >= 4) return "7-14 days";
    return "1-7 days";
}

function buildChecklist(tasks: OfferTask[]) {
    return tasks.slice(0, 8).map((task) => task.title);
}

function buildKeyTakeaways(gameName: string, offer: SeedOffer | null, focus: Focus) {
    const takeaways: string[] = [];
    if (offer) {
        takeaways.push(`Start with ${offer.provider_name} on ${offer.platform_name} if you want the strongest current payout path.`);
        if (offer.tasks[0]) takeaways.push(`Prioritize the earliest milestone first: ${offer.tasks[0].title}.`);
        if (offer.tasks.length > 1) takeaways.push("Track milestone order carefully so you do not miss later credit events.");
    }
    if (focus === "no-spend") takeaways.push("Avoid optional spend gates and prioritize milestones that can be cleared with free progression.");
    if (focus === "beginner friendly") takeaways.push("Use a fresh account and complete tutorial or onboarding steps immediately.");
    if (focus === "platform comparison") takeaways.push("Compare milestone counts and total payout before choosing a provider.");
    if (takeaways.length === 0) takeaways.push(`Focus on the main progression loop in ${gameName} and verify each milestone as you complete it.`);
    return takeaways.slice(0, 5);
}

function buildTitle(gameName: string, focus: Focus, template: Template) {
    if (template === "comparison guide") return `${gameName} Platform Comparison Guide`;
    if (focus === "fastest completion") return `${gameName} Fastest Completion Guide`;
    if (focus === "beginner friendly") return `${gameName} Beginner Guide`;
    if (focus === "no-spend") return `${gameName} No-Spend Guide`;
    return `How to Complete ${gameName} Offers`;
}

function buildExcerpt(gameName: string, maxPayoutUsd: number, providerCount: number, focus: Focus) {
    const focusPhrase: Record<Focus, string> = {
        "fastest completion": "fastest route",
        "highest payout": "highest payout path",
        "beginner friendly": "beginner-friendly route",
        "no-spend": "no-spend route",
        "platform comparison": "best provider comparison",
    };
    return `Use this ${focusPhrase[focus]} for ${gameName} offers. Current tracked payouts reach up to $${maxPayoutUsd.toFixed(2)} across ${providerCount} providers.`;
}

function buildSeoTitle(gameName: string, maxPayoutUsd: number, focus: Focus) {
    const year = new Date().getFullYear();
    return `${gameName} Offer Guide: Payouts, Tasks, and Tips (${year})`;
}

function buildSeoDescription(gameName: string, maxPayoutUsd: number, estimatedTime: string, focus: Focus) {
    if (maxPayoutUsd > 0) {
        return `Compare ${gameName} offer requirements, payout milestones, provider routes, and completion tips before starting. Current tracked payouts reach up to $${maxPayoutUsd.toFixed(2)}, but live terms can change.`;
    }
    return `Compare ${gameName} offer requirements, payout milestones, provider routes, and completion tips before starting. Verify live terms because payouts and tasks can change.`;
}

function buildSections(
    game: { name: string; description: string | null },
    topOffer: SeedOffer | null,
    offers: SeedOffer[],
    focus: Focus,
    template: Template,
    sourceBody: string | null,
    keywordIntent: KeywordIntent,
) {
    const offer = topOffer;
    const milestoneLines = offer?.tasks?.length
        ? offer.tasks.slice(0, 6).map((task, idx) => `${idx + 1}. ${task.title}`).join("\n")
        : "1. Complete the early onboarding requirements.\n2. Focus on the first tracked milestone.\n3. Verify credit before moving to optional stretch goals.";

    const comparisonNotes = offers.slice(0, 3).map((item) =>
        `- ${item.provider_name} on ${item.platform_name}: $${item.total_payout_usd.toFixed(2)} total across ${item.milestone_count} milestones`
    ).join("\n");

    const focusAdvice: Record<Focus, string> = {
        "fastest completion": "Prioritize short milestone ladders and avoid optional grind-heavy branches.",
        "highest payout": "Follow the full milestone ladder only if the later tasks remain realistic for your play pattern.",
        "beginner friendly": "Start with the simplest milestones and verify tutorial completion, device eligibility, and crediting windows first.",
        "no-spend": "Skip any spend-gated branches unless a task explicitly confirms free alternatives are allowed.",
        "platform comparison": "Compare payout totals, milestone counts, and any spend requirements before choosing a provider.",
    };

    const intentAdvice: Record<KeywordIntent, string[]> = {
        how_to: ["Requirements Before Starting", "Step-by-Step Route", "Mistakes to Avoid", "FAQ"],
        worth_it: ["Quick Verdict", "Time Estimate", "Payout Risk", "Who Should Skip", "Alternatives"],
        comparison: ["Provider Comparison Table", "Pros and Cons", "Best Option", "FAQ"],
        review: ["Trust Signals", "Payout Proof Notes", "Support Quality", "Complaints", "Verdict"],
        task_specific: ["Exact Milestone Route", "Deadlines", "Difficulty", "Screenshot Reminders"],
        payout_specific: ["Payout Tiers", "Cashout Considerations", "Tracking Risk", "Verification Date"],
        commercial_investigation: ["Best Provider", "Bonus Availability", "Risks", "Alternatives"],
        informational: ["Overview", "How It Works", "Common Questions", "Next Steps"],
    };

    const cautionBlock = [
        "## Offer Safety Notes",
        "Offers, payouts, deadlines, and tasks can change by provider, device, region, and account history. Verify the live offer terms before starting. Do not spend more than the remaining payout is worth, and keep screenshots of important milestones.",
    ].join("\n");

    const verdictBlock = [
        "## Quick Verdict",
        `${game.name} is worth considering only if the current provider terms fit your device, region, available time, and tolerance for tracking risk. Use the payout total as a comparison point, not a promise. The best route is usually the one with clear early milestones, reasonable deadlines, and a provider you can verify before installing.`,
        "",
        "This draft should be reviewed against the latest live offer page before publishing. Add provider-specific proof notes, screenshots, or milestone details only when the source data is available.",
    ].join("\n");

    const intentBlock = [
        `## ${keywordIntent.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())} Search Intent`,
        `Structure this guide around: ${intentAdvice[keywordIntent].join(", ")}. Keep claims factual and avoid promising earnings. Where details are unknown, leave placeholders for editor research instead of inventing requirements.`,
    ].join("\n");

    const templateHeading = template === "comparison guide"
        ? "## Platform Notes"
        : template === "speed guide"
            ? "## Fastest Route"
            : template === "beginner guide"
                ? "## Beginner Walkthrough"
                : "## Step-by-Step Section";

    const sourceTone = sourceBody?.includes("## Expert Tips")
        ? "Keep the editorial structure tight and conversion-focused."
        : "Keep the copy direct and milestone-driven.";

    return {
        intro: [
            "## Intro",
            `${game.description?.trim() || `${game.name} is one of the tracked offer games in the database.`} This guide focuses on ${focus}. ${sourceTone}`,
        ].join("\n"),
        overview: [
            "## Overview",
            `${game.name} currently has ${offers.length} tracked provider rows. ${offer ? `The strongest payout path right now is ${offer.provider_name} on ${offer.platform_name} with up to $${offer.total_payout_usd.toFixed(2)}.` : "Use the provider notes below to compare current payout paths."}`,
        ].join("\n"),
        step_by_step: [
            templateHeading,
            focusAdvice[focus],
            milestoneLines,
        ].join("\n"),
        platform_notes: [
            "## Platform Notes",
            comparisonNotes || "- No active provider comparison data found.",
        ].join("\n"),
        verdict: verdictBlock,
        intent: intentBlock,
        safety: cautionBlock,
        alternatives: [
            "## Alternatives",
            `If ${game.name} does not fit your device, region, or available time, compare other game offers before starting. Look for lower milestone counts, clearer deadlines, and payout routes that do not require spending more than the remaining reward is worth.`,
        ].join("\n"),
        expert_tips: [
            "## Expert Tips",
            "- Track every milestone manually and take screenshots of completion points.",
            "- Read the provider terms before starting a new install or account registration.",
            "- Stop and verify crediting after each major milestone if the payout ladder is long.",
        ].join("\n"),
        faq: [
            "## FAQ",
            "### How much can I earn?",
            offer ? `Current tracked payout reaches up to $${offer.total_payout_usd.toFixed(2)} depending on provider and milestone completion.` : "Payout varies by provider and may change over time.",
            "",
            "### Which provider should I choose?",
            offer ? `Start by comparing ${offer.provider_name} against the other listed providers using total payout and milestone count.` : "Choose the provider with the best mix of payout and realistic milestones.",
            "",
            "### Is this better for beginners or high payout?",
            `This draft is optimized for ${focus}.`,
        ].join("\n"),
    };
}

function buildBody(sections: Record<string, string>) {
    return [
        sections.intro,
        "",
        sections.verdict,
        "",
        sections.overview,
        "",
        sections.intent,
        "",
        sections.step_by_step,
        "",
        sections.platform_notes,
        "",
        sections.expert_tips,
        "",
        sections.safety,
        "",
        sections.alternatives,
        "",
        sections.faq,
    ].join("\n");
}

async function requireAdmin() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { supabase, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) {
        return { supabase, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }

    return { supabase, error: null };
}

export async function GET(req: NextRequest) {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { supabase } = auth;
    const gameId = req.nextUrl.searchParams.get("game_id");
    const focus = normalizeFocus(req.nextUrl.searchParams.get("focus"));
    const template = normalizeTemplate(req.nextUrl.searchParams.get("template"));
    const keywordIntent = normalizeKeywordIntent(req.nextUrl.searchParams.get("keyword_intent"));
    const sourceGuideId = req.nextUrl.searchParams.get("source_guide_id");

    if (!gameId) return NextResponse.json({ error: "game_id is required." }, { status: 400 });

    const { data: game, error: gameError } = await supabase
        .from("games")
        .select("id, name, slug, description, category")
        .eq("id", gameId)
        .maybeSingle();

    if (gameError) return NextResponse.json({ error: gameError.message }, { status: 500 });
    if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 });

    const { data: sourceGuide } = sourceGuideId
        ? await supabase.from("guides").select("id, body_md").eq("id", sourceGuideId).maybeSingle()
        : { data: null };

    const { data: payoutSummary } = await supabase
        .from("payout_max_by_game")
        .select("max_payout_usd")
        .eq("game_id", gameId)
        .maybeSingle();

    const { data: offerRows, error: offerError } = await supabase
        .from("site_offers")
        .select(`
            id,
            payout_usd,
            total_payout_usd,
            goal_text,
            status,
            site:platforms(name, slug),
            provider:providers(name, slug),
            tasks:site_offer_tasks(
                id, sort_order, title, reward_amount, reward_display, task_type, time_limit_text
            )
        `)
        .eq("game_id", gameId)
        .eq("status", "active");

    if (offerError) return NextResponse.json({ error: offerError.message }, { status: 500 });

    const offers: SeedOffer[] = (offerRows ?? [])
        .map((row) => {
            const site = Array.isArray(row.site) ? row.site[0] ?? null : row.site;
            const provider = Array.isArray(row.provider) ? row.provider[0] ?? null : row.provider;
            const tasks = Array.isArray(row.tasks) ? [...row.tasks].sort((a, b) => a.sort_order - b.sort_order) : [];
            return {
                id: row.id,
                provider_name: provider?.name ?? "Unknown Provider",
                platform_name: site?.name ?? "Unknown Platform",
                payout_usd: Number(row.payout_usd ?? 0),
                total_payout_usd: Number(row.total_payout_usd ?? row.payout_usd ?? 0),
                milestone_count: tasks.length,
                goal_text: typeof row.goal_text === "string" ? row.goal_text : null,
                tasks,
            };
        })
        .sort((a, b) => b.total_payout_usd - a.total_payout_usd || b.payout_usd - a.payout_usd);

    const topOffer = offers[0] ?? null;
    const maxPayoutUsd = Number(payoutSummary?.max_payout_usd ?? topOffer?.total_payout_usd ?? topOffer?.payout_usd ?? 0);
    const checklistItems = buildChecklist(topOffer?.tasks ?? []);
    const keyTakeaways = buildKeyTakeaways(game.name, topOffer, focus);
    const estimatedTime = inferEstimatedTime(maxPayoutUsd, topOffer?.tasks ?? [], focus);
    const difficulty = inferDifficulty(maxPayoutUsd, topOffer?.tasks ?? []);
    const title = buildTitle(game.name, focus, template);
    const excerpt = buildExcerpt(game.name, maxPayoutUsd, offers.length, focus);
    const seoTitle = buildSeoTitle(game.name, maxPayoutUsd, focus);
    const seoDescription = buildSeoDescription(game.name, maxPayoutUsd, estimatedTime, focus);
    const sections = buildSections(game, topOffer, offers, focus, template, sourceGuide?.body_md ?? null, keywordIntent);
    const bodyMd = buildBody(sections);

    const { data: relatedGuides } = await supabase
        .from("guides")
        .select("title, slug")
        .eq("status", "published")
        .eq("game_id", gameId)
        .limit(5);

    const internalLinks = [
        { label: `${game.name} offer page`, href: `/games/${game.slug}`, reason: "Primary game offer landing page." },
        { label: "Best GPT sites", href: "/best-gpt-sites", reason: "High-value comparison page." },
        { label: "Highest paying GPT games", href: "/highest-paying-gpt-games", reason: "Supporting comparison page for internal SEO." },
        ...(relatedGuides ?? []).map((guideRow) => ({
            label: guideRow.title,
            href: `/guides/${guideRow.slug}`,
            reason: "Related published guide for the same game.",
        })),
    ];

    return NextResponse.json({
        game,
        autofill: {
            title,
            slug: slugify(title),
            excerpt,
            max_payout_usd: maxPayoutUsd,
            estimated_time: estimatedTime,
            difficulty,
            checklist_items: checklistItems,
            key_takeaways: keyTakeaways,
            seo_title: seoTitle,
            seo_description: seoDescription,
        },
        draft: {
            body_md: bodyMd,
            tips: keyTakeaways,
            checklist_items: checklistItems,
            key_takeaways: keyTakeaways,
        },
        sections,
        internal_links: internalLinks,
        top_offers: offers.slice(0, 5),
    }, {
        headers: { "Cache-Control": "no-store, max-age=0" },
    });
}
