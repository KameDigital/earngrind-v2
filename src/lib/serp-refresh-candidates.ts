import { suggestedHeadingFromQuery } from "@/lib/search-console-opportunities";

export type SerpRefreshPriority = "high" | "medium" | "low";

export type SerpRefreshMetricInput = {
    id?: string | null;
    guide_id: string | null;
    page_url?: string | null;
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
};

export type SerpRefreshGuideInput = {
    id: string;
    title: string;
    slug: string;
    keyword_target: string | null;
    body_md: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
    updated_at?: string | null;
    published_at?: string | null;
};

export type SerpRefreshEngagementInput = {
    guideId: string;
    views?: number;
    offerClicks?: number;
    platformClicks?: number;
};

export type SerpRefreshTopQuery = {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
};

export type SerpRefreshPlan = {
    currentIssue: string;
    queriesToTarget: string[];
    suggestedTitleMetaChange: string;
    suggestedH2ToAdd: string;
    suggestedInternalLinks: string[];
    ctaImprovementSuggestion: string;
    recommendation: "update_current_page" | "create_supporting_guide";
};

export type SerpRefreshCandidate = {
    guideId: string;
    title: string;
    slug: string;
    currentKeyword: string | null;
    topQueries: SerpRefreshTopQuery[];
    reason: string;
    reasons: string[];
    priority: SerpRefreshPriority;
    priorityScore: number;
    suggestedUpdates: string[];
    refreshPlan: SerpRefreshPlan;
    impressions: number;
    clicks: number;
    ctr: number;
    averagePosition: number;
    pageUrl: string | null;
    isQuickWin: boolean;
    hasHighImpressionsLowCtr: boolean;
    isStrikingDistance: boolean;
};

export type SerpRefreshSummary = {
    totalRefreshCandidates: number;
    highPriorityCount: number;
    quickWinsCount: number;
    highImpressionsLowCtrCount: number;
    strikingDistanceCount: number;
};

function normalize(value: string) {
    return value.toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(value: string) {
    return new Set(normalize(value).split(" ").filter((token) => token.length > 2));
}

function tokenSimilarity(a: string, b: string) {
    const aTokens = tokens(a);
    const bTokens = tokens(b);
    if (aTokens.size === 0 || bTokens.size === 0) return 0;
    const overlap = Array.from(aTokens).filter((token) => bTokens.has(token)).length;
    return overlap / Math.max(aTokens.size, bTokens.size);
}

function daysSince(value?: string | null, now = new Date()) {
    if (!value) return Number.POSITIVE_INFINITY;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return Number.POSITIVE_INFINITY;
    return Math.floor((now.getTime() - parsed.getTime()) / 86_400_000);
}

function extractHeadings(html: string | null | undefined) {
    const matches = Array.from(String(html ?? "").matchAll(/<h[1-3]\b[^>]*>(.*?)<\/h[1-3]>/gi));
    return matches.map((match) => normalize(match[1] ?? "")).filter(Boolean);
}

function queryCoveredByHeadings(query: string, headings: string[]) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return true;
    return headings.some((heading) => heading.includes(normalizedQuery) || tokenSimilarity(query, heading) >= 0.55);
}

function weightedPosition(metrics: SerpRefreshMetricInput[]) {
    const weight = metrics.reduce((sum, metric) => sum + Math.max(1, metric.impressions), 0);
    if (weight === 0) return 0;
    return metrics.reduce((sum, metric) => sum + metric.position * Math.max(1, metric.impressions), 0) / weight;
}

function priorityFromScore(score: number): SerpRefreshPriority {
    if (score >= 80) return "high";
    if (score >= 55) return "medium";
    return "low";
}

function buildRefreshPlan({
    guide,
    topQueries,
    reasons,
    suggestedUpdates,
    uncoveredQuery,
    mismatchQuery,
}: {
    guide: SerpRefreshGuideInput;
    topQueries: SerpRefreshTopQuery[];
    reasons: string[];
    suggestedUpdates: string[];
    uncoveredQuery: string | null;
    mismatchQuery: string | null;
}): SerpRefreshPlan {
    const primaryQuery = topQueries[0]?.query ?? guide.keyword_target ?? guide.title;
    const queryList = topQueries.slice(0, 5).map((query) => query.query);
    const needsSupportingGuide = Boolean(mismatchQuery && guide.keyword_target && tokenSimilarity(mismatchQuery, guide.keyword_target) < 0.18);

    return {
        currentIssue: reasons.length > 0
            ? reasons.join(" ")
            : "Review imported Search Console data before editing this page.",
        queriesToTarget: queryList,
        suggestedTitleMetaChange: `Review the SEO title and meta description against "${primaryQuery}". Use verified page content only; add current payout, platform, or requirement details only after research confirms them.`,
        suggestedH2ToAdd: uncoveredQuery
            ? suggestedHeadingFromQuery(uncoveredQuery)
            : `Placeholder H2 for "${primaryQuery}" after intent and facts are verified.`,
        suggestedInternalLinks: [
            "Add links to relevant existing EarnGrind guide, game, or offer pages after confirming topical fit.",
            "Placeholder: choose 2-3 internal links during editor review.",
        ],
        ctaImprovementSuggestion: "Review the existing CTA placement and offer table. Use placeholders until current offer availability, payout, and tracking details are verified.",
        recommendation: needsSupportingGuide ? "create_supporting_guide" : "update_current_page",
    };
}

export function buildSerpRefreshTaskNotes(candidate: SerpRefreshCandidate) {
    const plan = candidate.refreshPlan;
    return [
        "SERP Refresh Task",
        "",
        `Guide: ${candidate.title}`,
        `Current keyword: ${candidate.currentKeyword ?? "n/a"}`,
        `Top query: ${candidate.topQueries[0]?.query ?? "n/a"}`,
        `Metrics: ${candidate.impressions} impressions, ${candidate.clicks} clicks, ${(candidate.ctr * 100).toFixed(2)}% CTR, avg position ${candidate.averagePosition.toFixed(1)}`,
        `Priority: ${candidate.priority}`,
        "",
        "Current issue:",
        plan.currentIssue,
        "",
        "Queries to target:",
        ...plan.queriesToTarget.map((query) => `- ${query}`),
        "",
        "Suggested title/meta change:",
        plan.suggestedTitleMetaChange,
        "",
        "Suggested H2 to add:",
        plan.suggestedH2ToAdd,
        "",
        "Suggested internal links:",
        ...plan.suggestedInternalLinks.map((link) => `- ${link}`),
        "",
        "CTA improvement suggestion:",
        plan.ctaImprovementSuggestion,
        "",
        "Recommendation:",
        plan.recommendation === "create_supporting_guide" ? "Create a supporting guide after research confirms the separate intent." : "Update the current page.",
        "",
        "Suggested updates:",
        ...candidate.suggestedUpdates.map((update) => `- ${update}`),
    ].join("\n");
}

export function findSerpRefreshCandidates({
    guides,
    metrics,
    engagement = [],
    now = new Date(),
}: {
    guides: SerpRefreshGuideInput[];
    metrics: SerpRefreshMetricInput[];
    engagement?: SerpRefreshEngagementInput[];
    now?: Date;
}) {
    const metricsByGuide = new Map<string, SerpRefreshMetricInput[]>();
    const engagementByGuide = new Map(engagement.map((item) => [item.guideId, item]));

    for (const metric of metrics) {
        if (!metric.guide_id) continue;
        if (!metricsByGuide.has(metric.guide_id)) metricsByGuide.set(metric.guide_id, []);
        metricsByGuide.get(metric.guide_id)?.push(metric);
    }

    const candidates: SerpRefreshCandidate[] = [];

    for (const guide of guides) {
        const guideMetrics = metricsByGuide.get(guide.id) ?? [];
        if (guideMetrics.length === 0) continue;

        const age = daysSince(guide.updated_at ?? guide.published_at, now);
        if (age < 30) continue;

        const sortedQueries = [...guideMetrics].sort((a, b) => b.impressions - a.impressions);
        const topQueries = sortedQueries.slice(0, 8).map((metric) => ({
            query: metric.query,
            clicks: Number(metric.clicks ?? 0),
            impressions: Number(metric.impressions ?? 0),
            ctr: Number(metric.ctr ?? 0),
            position: Number(metric.position ?? 0),
        }));

        const impressions = guideMetrics.reduce((sum, metric) => sum + Number(metric.impressions ?? 0), 0);
        const clicks = guideMetrics.reduce((sum, metric) => sum + Number(metric.clicks ?? 0), 0);
        const ctr = impressions > 0 ? clicks / impressions : 0;
        const averagePosition = weightedPosition(guideMetrics);
        const hasHighImpressionsLowCtr = impressions >= 100 && ctr < 0.02;
        const isStrikingDistance = topQueries.some((query) => query.position >= 4 && query.position <= 15);
        const keywordText = [guide.keyword_target, guide.title].filter(Boolean).join(" ");
        const mismatchQuery = topQueries.find((query) => keywordText && tokenSimilarity(query.query, keywordText) < 0.2)?.query ?? null;
        const headings = extractHeadings(guide.body_md);
        const uncoveredQuery = topQueries.find((query) => query.impressions >= 100 && !queryCoveredByHeadings(query.query, headings))?.query ?? null;
        const guideEngagement = engagementByGuide.get(guide.id);
        const downstreamClicks = Number(guideEngagement?.offerClicks ?? 0) + Number(guideEngagement?.platformClicks ?? 0);
        const hasClicksNoOfferClicks = clicks > 0 && downstreamClicks === 0;

        const reasons = [
            ...(hasHighImpressionsLowCtr ? ["High impressions with CTR below 2%."] : []),
            ...(isStrikingDistance ? ["Average ranking opportunity exists between positions 4 and 15."] : []),
            ...(mismatchQuery ? [`Top query intent may not match the current keyword: "${mismatchQuery}".`] : []),
            ...(hasClicksNoOfferClicks ? ["Search clicks exist, but guide event data shows no offer/platform clicks in the recent window."] : []),
            ...(uncoveredQuery ? [`High-impression query is not clearly covered in headings: "${uncoveredQuery}".`] : []),
        ];

        if (reasons.length === 0) continue;

        let priorityScore = 0;
        priorityScore += Math.min(35, Math.floor(impressions / 40));
        if (hasHighImpressionsLowCtr) priorityScore += 25;
        if (isStrikingDistance) priorityScore += 20;
        if (uncoveredQuery) priorityScore += 15;
        if (hasClicksNoOfferClicks) priorityScore += 10;
        if (mismatchQuery) priorityScore += 10;
        priorityScore = Math.min(100, priorityScore);

        const suggestedUpdates = [
            ...(hasHighImpressionsLowCtr ? ["Improve SEO title and meta description around the highest-impression query after validating current page facts."] : []),
            ...(uncoveredQuery ? [`Add or expand an H2 section for "${uncoveredQuery}" using verified research.`] : []),
            ...(mismatchQuery ? [`Decide whether "${mismatchQuery}" belongs on this page or needs a supporting guide.`] : []),
            ...(hasClicksNoOfferClicks ? ["Review CTA placement and offer links because imported search clicks are not producing offer/platform clicks."] : []),
            ...(isStrikingDistance ? ["Refresh the section that targets striking-distance queries and add relevant internal links."] : []),
        ];

        const refreshPlan = buildRefreshPlan({
            guide,
            topQueries,
            reasons,
            suggestedUpdates,
            uncoveredQuery,
            mismatchQuery,
        });

        candidates.push({
            guideId: guide.id,
            title: guide.title,
            slug: guide.slug,
            currentKeyword: guide.keyword_target,
            topQueries,
            reason: reasons[0],
            reasons,
            priority: priorityFromScore(priorityScore),
            priorityScore,
            suggestedUpdates,
            refreshPlan,
            impressions,
            clicks,
            ctr,
            averagePosition,
            pageUrl: sortedQueries[0]?.page_url ?? null,
            isQuickWin: hasHighImpressionsLowCtr || (isStrikingDistance && Boolean(uncoveredQuery)),
            hasHighImpressionsLowCtr,
            isStrikingDistance,
        });
    }

    return candidates.sort((a, b) => b.priorityScore - a.priorityScore || b.impressions - a.impressions);
}

export function summarizeSerpRefreshCandidates(candidates: SerpRefreshCandidate[]): SerpRefreshSummary {
    return {
        totalRefreshCandidates: candidates.length,
        highPriorityCount: candidates.filter((candidate) => candidate.priority === "high").length,
        quickWinsCount: candidates.filter((candidate) => candidate.isQuickWin).length,
        highImpressionsLowCtrCount: candidates.filter((candidate) => candidate.hasHighImpressionsLowCtr).length,
        strikingDistanceCount: candidates.filter((candidate) => candidate.isStrikingDistance).length,
    };
}
