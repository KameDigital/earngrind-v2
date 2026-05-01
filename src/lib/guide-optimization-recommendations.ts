import type { GuideEventSummary } from "@/lib/guide-event-stats";
import type { GuideQualityResult } from "@/lib/guide-quality";

export type GuideOptimizationRecommendationType =
    | "low_ctr"
    | "needs_internal_links"
    | "needs_cta"
    | "needs_variation"
    | "high_views_no_clicks"
    | "thin_content"
    | "missing_faq"
    | "improve_seo_metadata"
    | "high_impressions_low_ctr"
    | "striking_distance"
    | "query_mismatch"
    | "update_opportunity"
    | "republish_candidate";

export type GuideOptimizationRecommendation = {
    type: GuideOptimizationRecommendationType;
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    suggestedAction: string;
};

export type GuideOptimizationInput = {
    status?: string | null;
    contentStatus?: string | null;
    updatedAt?: string | null;
    publishedAt?: string | null;
    needsVariation?: boolean | null;
    keywordClusterId?: string | null;
    seoTitleScore?: number | null;
    seoDescriptionScore?: number | null;
    searchConsole?: {
        impressions: number;
        clicks: number;
        ctr: number;
        avgPosition: number;
        topQueries: Array<{ query: string; impressions: number; clicks: number; ctr: number; position: number }>;
        mismatchQueries: string[];
        hasHighImpressionsLowCtr: boolean;
        hasStrikingDistance: boolean;
    } | null;
    quality: GuideQualityResult;
    stats: GuideEventSummary;
};

function isOlderThan(dateValue: string | null | undefined, days: number) {
    if (!dateValue) return false;
    const timestamp = new Date(dateValue).getTime();
    if (!Number.isFinite(timestamp)) return false;
    return Date.now() - timestamp > days * 24 * 60 * 60 * 1000;
}

function hasRequiredError(quality: GuideQualityResult, pattern: RegExp) {
    return quality.requiredErrors.some((error) => pattern.test(error));
}

function hasOptionalWarning(quality: GuideQualityResult, pattern: RegExp) {
    return quality.optionalWarnings.some((warning) => pattern.test(warning));
}

export function getGuideOptimizationRecommendations(input: GuideOptimizationInput) {
    const recommendations: GuideOptimizationRecommendation[] = [];
    const published = input.status === "published";
    const draftLike = input.status === "draft" || input.status === "needs_review" || input.contentStatus === "draft";

    if (input.stats.views >= 100 && input.stats.ctaCtr < 0.02) {
        recommendations.push({
            type: "low_ctr",
            priority: "high",
            title: "Low CTA click-through rate",
            description: "This guide has meaningful traffic, but fewer than 2% of visitors are clicking the main CTA.",
            suggestedAction: "Strengthen the intro CTA, add a clearer offer block, and move the next-step action higher on the page.",
        });
    }

    if (input.stats.views >= 50 && input.stats.offerClicks + input.stats.platformClicks === 0) {
        recommendations.push({
            type: "high_views_no_clicks",
            priority: "high",
            title: "Views but no outbound offer clicks",
            description: "Users are reading this guide, but they are not moving into tracked offer or platform routes.",
            suggestedAction: "Add or improve an offer comparison CTA and make the safest next click obvious.",
        });
    }

    if (input.quality.internalLinkCount < 2) {
        recommendations.push({
            type: "needs_internal_links",
            priority: "medium",
            title: "Needs more internal links",
            description: "The guide has fewer than two internal links, which weakens crawl paths and user navigation.",
            suggestedAction: "Use the internal link manager to add related guides, offers, game pages, or platform reviews.",
        });
    }

    if (hasOptionalWarning(input.quality, /CTA/i)) {
        recommendations.push({
            type: "needs_cta",
            priority: "high",
            title: "No CTA section detected",
            description: "The content does not clearly tell users what to click after reading.",
            suggestedAction: "Add a concise Start This Offer or Compare More Offers section before the final verdict.",
        });
    }

    if (input.needsVariation) {
        recommendations.push({
            type: "needs_variation",
            priority: "medium",
            title: "Needs content variation",
            description: "This guide is flagged as too similar or not distinct enough from nearby content.",
            suggestedAction: "Regenerate or rewrite the intro, section order, examples, and task-specific details.",
        });
    }

    if (input.quality.wordCount < 600) {
        recommendations.push({
            type: "thin_content",
            priority: "medium",
            title: "Thin content",
            description: "The guide is under 600 words and may not fully satisfy search intent.",
            suggestedAction: "Add task details, payout context, risks, FAQ answers, and a stronger completion strategy.",
        });
    }

    if (hasRequiredError(input.quality, /FAQ/i)) {
        recommendations.push({
            type: "missing_faq",
            priority: "medium",
            title: "FAQ section missing",
            description: "The guide is missing FAQ coverage, which weakens long-tail usefulness and schema opportunities.",
            suggestedAction: "Add direct answers for worth-it, completion time, free-to-play, tracking, and hardest-task questions.",
        });
    }

    if ((input.stats.views >= 50 || input.stats.ctaCtr < 0.02) && ((input.seoTitleScore ?? 100) < 70 || (input.seoDescriptionScore ?? 100) < 70)) {
        recommendations.push({
            type: "improve_seo_metadata",
            priority: "medium",
            title: "Improve SEO title/meta",
            description: "The guide has traffic or CTR pressure and weak search metadata signals.",
            suggestedAction: "Use the SEO testing panel to preview stronger titles and descriptions before updating metadata.",
        });
    }

    if (input.searchConsole?.hasHighImpressionsLowCtr) {
        recommendations.push({
            type: "high_impressions_low_ctr",
            priority: "high",
            title: "High impressions, low Google CTR",
            description: "Search Console data shows this guide is getting impressions, but searchers are not clicking often enough.",
            suggestedAction: "Improve the SEO title/meta with the strongest query phrase and a clearer benefit.",
        });
    }

    if (input.searchConsole?.hasStrikingDistance) {
        recommendations.push({
            type: "striking_distance",
            priority: "medium",
            title: "Striking-distance rankings",
            description: "One or more queries rank between positions 4 and 15, where targeted improvements can move the page into higher click zones.",
            suggestedAction: "Add the ranking query phrase into the intro, an H2, or a focused supporting section.",
        });
    }

    if (input.searchConsole && input.searchConsole.mismatchQueries.length > 0) {
        recommendations.push({
            type: "query_mismatch",
            priority: "medium",
            title: "Query intent mismatch",
            description: "This guide is earning impressions from queries that do not clearly match the current keyword target.",
            suggestedAction: "Add a supporting section for the query phrase or create a separate guide if the intent is different.",
        });
    }

    if (published && isOlderThan(input.publishedAt ?? input.updatedAt, 45)) {
        recommendations.push({
            type: "update_opportunity",
            priority: "low",
            title: "Update opportunity",
            description: "This published guide is more than 45 days old and may need payout, terms, or route freshness checks.",
            suggestedAction: "Review live offers, refresh screenshots or payout references, and add a current update note.",
        });
    }

    if (draftLike && input.quality.score >= 90) {
        recommendations.push({
            type: "republish_candidate",
            priority: "medium",
            title: "Strong draft candidate",
            description: "This draft has a high SEO quality score and may be close to ready for publishing.",
            suggestedAction: "Run the publish checklist, verify facts, then move it into the content queue or publish flow.",
        });
    }

    return recommendations.sort((a, b) => {
        const priorityRank = { high: 0, medium: 1, low: 2 };
        return priorityRank[a.priority] - priorityRank[b.priority];
    });
}
