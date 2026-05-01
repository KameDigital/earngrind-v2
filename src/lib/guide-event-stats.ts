export type GuideEventRow = {
    guide_id: string | null;
    guide_slug: string;
    event_type: string;
    target_url: string | null;
    metadata?: Record<string, unknown> | null;
    created_at: string;
};

export type GuideEventSummary = {
    views: number;
    ctaClicks: number;
    offerClicks: number;
    platformClicks: number;
    internalLinkClicks: number;
    clickCount: number;
    ctaCtr: number;
    actionCtr: number;
    topLinks: Array<{ targetUrl: string; clicks: number }>;
    ctaVariantPerformance: GuideCtaPerformanceRow[];
    ctaPlacementPerformance: GuideCtaPerformanceRow[];
    ctaOfferPerformance: GuideCtaPerformanceRow[];
};

export type GuideCtaPerformanceRow = {
    id: string;
    label: string;
    views: number;
    ctaClicks: number;
    offerClicks: number;
    ctaCtr: number;
    offerClickThroughRate: number;
};

export function emptyGuideEventSummary(): GuideEventSummary {
    return {
        views: 0,
        ctaClicks: 0,
        offerClicks: 0,
        platformClicks: 0,
        internalLinkClicks: 0,
        clickCount: 0,
        ctaCtr: 0,
        actionCtr: 0,
        topLinks: [],
        ctaVariantPerformance: [],
        ctaPlacementPerformance: [],
        ctaOfferPerformance: [],
    };
}

function metadataString(event: GuideEventRow, key: string) {
    const value = event.metadata?.[key];
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isCtaOriginatedClick(event: GuideEventRow) {
    const variant = metadataString(event, "cta_variant");
    const variantId = metadataString(event, "cta_variant_id");
    return event.event_type === "cta_click" || Boolean(variantId || variant);
}

function isOutboundClick(event: GuideEventRow) {
    return event.event_type === "offer_click" || event.event_type === "platform_click";
}

function incrementPerformance(
    map: Map<string, GuideCtaPerformanceRow>,
    id: string | null,
    label: string | null,
    views: number,
    event: GuideEventRow,
) {
    if (!id) return;
    const row = map.get(id) ?? {
        id,
        label: label ?? id,
        views,
        ctaClicks: 0,
        offerClicks: 0,
        ctaCtr: 0,
        offerClickThroughRate: 0,
    };
    row.ctaClicks += 1;
    if (isOutboundClick(event)) row.offerClicks += 1;
    map.set(id, row);
}

function finalizePerformance(map: Map<string, GuideCtaPerformanceRow>) {
    return Array.from(map.values())
        .map((row) => ({
            ...row,
            ctaCtr: row.views > 0 ? row.ctaClicks / row.views : 0,
            offerClickThroughRate: row.ctaClicks > 0 ? row.offerClicks / row.ctaClicks : 0,
        }))
        .sort((a, b) => b.ctaClicks - a.ctaClicks || b.ctaCtr - a.ctaCtr);
}

export function summarizeGuideEvents(events: GuideEventRow[]) {
    const summary = emptyGuideEventSummary();
    const linkCounts = new Map<string, number>();
    const variantRows = new Map<string, GuideCtaPerformanceRow>();
    const placementRows = new Map<string, GuideCtaPerformanceRow>();
    const offerRows = new Map<string, GuideCtaPerformanceRow>();

    for (const event of events) {
        if (event.event_type === "view") summary.views += 1;
        if (event.event_type === "cta_click") summary.ctaClicks += 1;
        if (event.event_type === "offer_click") summary.offerClicks += 1;
        if (event.event_type === "platform_click") summary.platformClicks += 1;
        if (event.event_type === "internal_link_click") summary.internalLinkClicks += 1;

        if (event.target_url && event.event_type !== "view") {
            linkCounts.set(event.target_url, (linkCounts.get(event.target_url) ?? 0) + 1);
        }
    }

    for (const event of events) {
        if (!isCtaOriginatedClick(event)) continue;

        const variantId = metadataString(event, "cta_variant_id") ?? metadataString(event, "cta_variant");
        const variantLabel = metadataString(event, "cta_variant_label") ?? variantId;
        const placement = metadataString(event, "placement") ?? metadataString(event, "cta_placement");
        const offerId = metadataString(event, "offer_id");

        incrementPerformance(variantRows, variantId, variantLabel, summary.views, event);
        incrementPerformance(placementRows, placement, placement, summary.views, event);
        incrementPerformance(offerRows, offerId, offerId, summary.views, event);
    }

    summary.clickCount = summary.ctaClicks + summary.offerClicks + summary.platformClicks;
    summary.ctaCtr = summary.views > 0 ? summary.ctaClicks / summary.views : 0;
    summary.actionCtr = summary.views > 0 ? summary.clickCount / summary.views : 0;
    summary.topLinks = Array.from(linkCounts.entries())
        .map(([targetUrl, clicks]) => ({ targetUrl, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 8);
    summary.ctaVariantPerformance = finalizePerformance(variantRows);
    summary.ctaPlacementPerformance = finalizePerformance(placementRows);
    summary.ctaOfferPerformance = finalizePerformance(offerRows);

    return summary;
}

export function summarizeEventsByGuide(events: GuideEventRow[]) {
    const grouped = new Map<string, GuideEventRow[]>();

    for (const event of events) {
        const key = event.guide_id ?? event.guide_slug;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)?.push(event);
    }

    return new Map(Array.from(grouped.entries()).map(([key, rows]) => [key, summarizeGuideEvents(rows)]));
}

export function formatPercent(value: number) {
    return `${(value * 100).toFixed(value > 0 && value < 0.01 ? 2 : 1)}%`;
}
