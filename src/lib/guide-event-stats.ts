export type GuideEventRow = {
    guide_id: string | null;
    guide_slug: string;
    event_type: string;
    target_url: string | null;
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
    };
}

export function summarizeGuideEvents(events: GuideEventRow[]) {
    const summary = emptyGuideEventSummary();
    const linkCounts = new Map<string, number>();

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

    summary.clickCount = summary.ctaClicks + summary.offerClicks + summary.platformClicks;
    summary.ctaCtr = summary.views > 0 ? summary.ctaClicks / summary.views : 0;
    summary.actionCtr = summary.views > 0 ? summary.clickCount / summary.views : 0;
    summary.topLinks = Array.from(linkCounts.entries())
        .map(([targetUrl, clicks]) => ({ targetUrl, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 8);

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
