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
    | "republish_candidate"
    | "cta_clicks_no_offer_clicks"
    | "no_relevant_offer_match"
    | "lower_payout_offer_winning"
    | "weak_cta_variant"
    | "placement_underperforming"
    | "fallback_cta_high";

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
    autoMatchedOfferCount?: number | null;
    lowerPayoutOfferGettingMoreClicks?: boolean | null;
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

    if (input.stats.ctaClicks >= 3 && input.stats.offerClicks + input.stats.platformClicks === 0) {
        recommendations.push({
            type: "cta_clicks_no_offer_clicks",
            priority: "high",
            title: "CTA clicks but no offer clicks",
            description: "Users are interacting with CTAs, but those clicks are not turning into tracked offer or platform starts.",
            suggestedAction: "Check CTA targets, dynamic offer matching, and whether the best payout route is surfaced before the user leaves.",
        });
    }

    if (input.autoMatchedOfferCount === 0) {
        recommendations.push({
            type: "no_relevant_offer_match",
            priority: "medium",
            title: "No relevant matched offer",
            description: "The guide offer matcher did not find a relevant active offer, so public CTAs will fall back to the offers page.",
            suggestedAction: "Select a manual primary offer, add offer data for this game, or disable auto matching intentionally.",
        });
    }

    if (input.lowerPayoutOfferGettingMoreClicks) {
        recommendations.push({
            type: "lower_payout_offer_winning",
            priority: "medium",
            title: "Lower payout offer is getting more clicks",
            description: "CTA click data suggests users are choosing a lower-payout route more often than the highest-payout match.",
            suggestedAction: "Review platform trust, button copy, and payout freshness before deciding whether to promote the higher payout route.",
        });
    }

    const weakVariant = input.stats.ctaVariantPerformance.find((variant) => variant.views >= 100 && variant.ctaCtr < 0.02);
    if (weakVariant) {
        recommendations.push({
            type: "weak_cta_variant",
            priority: "medium",
            title: "Weak CTA variant",
            description: `${weakVariant.label} has 100+ views and a CTA CTR below 2%.`,
            suggestedAction: "Test a stronger CTA, tighten the benefit language, or pair the variant with a clearer payout note.",
        });
    }

    const topPlacement = input.stats.ctaPlacementPerformance.find((placement) => placement.id === "top");
    const bottomPlacement = input.stats.ctaPlacementPerformance.find((placement) => placement.id === "bottom");
    if (topPlacement && bottomPlacement && topPlacement.views >= 100 && bottomPlacement.ctaCtr >= topPlacement.ctaCtr * 1.5 && bottomPlacement.ctaClicks >= topPlacement.ctaClicks + 2) {
        recommendations.push({
            type: "placement_underperforming",
            priority: "medium",
            title: "Top CTA underperforming",
            description: "The bottom CTA is outperforming the top CTA by a meaningful margin.",
            suggestedAction: "Move CTA placement, simplify the top offer block, or test a stronger top CTA variant.",
        });
    }

    const fallbackPlacement = input.stats.ctaPlacementPerformance.find((placement) => placement.id === "fallback");
    const variantClickTotal = input.stats.ctaPlacementPerformance.reduce((sum, placement) => sum + placement.ctaClicks, 0);
    if (fallbackPlacement && fallbackPlacement.ctaClicks >= 5 && fallbackPlacement.ctaClicks / Math.max(variantClickTotal, 1) >= 0.3) {
        recommendations.push({
            type: "fallback_cta_high",
            priority: "medium",
            title: "Fallback CTA used often",
            description: "A large share of CTA clicks are coming from fallback blocks, which means offer matching may not be finding enough relevant routes.",
            suggestedAction: "Improve offer matching, add missing offer data, or set a manual primary offer for this guide.",
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
