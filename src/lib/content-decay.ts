export type ContentDecayLevel = "none" | "mild" | "moderate" | "severe";

export type ContentDecayMetricInput = {
    guide_id: string | null;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    date_start?: string | null;
    date_end?: string | null;
    created_at?: string | null;
};

export type ContentDecayGuideInput = {
    id: string;
    title: string;
    slug: string;
    keyword_target: string | null;
    guide_type?: string | null;
    batch_name?: string | null;
    keyword_cluster_id?: string | null;
    updated_at?: string | null;
    published_at?: string | null;
};

export type ContentDecayPeriodSummary = {
    periodKey: string;
    dateStart: string | null;
    dateEnd: string | null;
    clicks: number;
    impressions: number;
    ctr: number;
    averagePosition: number;
};

export type ContentDecayResult = {
    guideId: string;
    title: string;
    slug: string;
    keywordTarget: string | null;
    guideType: string | null;
    batchName: string | null;
    keywordClusterId: string | null;
    previous: ContentDecayPeriodSummary | null;
    current: ContentDecayPeriodSummary | null;
    clicksChange: number | null;
    impressionsChange: number | null;
    ctrChange: number | null;
    positionChange: number | null;
    decayScore: number;
    decayLevel: ContentDecayLevel;
    reasons: string[];
    suggestedAction: string;
    daysSincePublished: number | null;
    daysSinceUpdated: number | null;
    isOverdueForUpdate: boolean;
    hasPositionLoss: boolean;
};

export type ContentDecaySummary = {
    totalMonitoredGuides: number;
    severeDecayCount: number;
    moderateDecayCount: number;
    overdueUpdateCount: number;
    positionLossCount: number;
};

function periodKey(metric: ContentDecayMetricInput) {
    const start = metric.date_start ?? "unknown-start";
    const end = metric.date_end ?? metric.created_at?.slice(0, 10) ?? "unknown-end";
    return `${start}:${end}`;
}

function periodSortValue(period: ContentDecayPeriodSummary) {
    return new Date(period.dateEnd ?? period.dateStart ?? "1970-01-01").getTime();
}

function daysSince(value?: string | null, now = new Date()) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return Math.floor((now.getTime() - parsed.getTime()) / 86_400_000);
}

function percentChange(current: number, previous: number) {
    if (previous <= 0) return current < previous ? -1 : null;
    return (current - previous) / previous;
}

function aggregatePeriods(metrics: ContentDecayMetricInput[]) {
    const grouped = new Map<string, ContentDecayMetricInput[]>();
    for (const metric of metrics) {
        const key = periodKey(metric);
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)?.push(metric);
    }

    return Array.from(grouped.entries()).map(([key, rows]) => {
        const clicks = rows.reduce((sum, row) => sum + Number(row.clicks ?? 0), 0);
        const impressions = rows.reduce((sum, row) => sum + Number(row.impressions ?? 0), 0);
        const weightedPositionTotal = rows.reduce((sum, row) => sum + Number(row.position ?? 0) * Math.max(1, Number(row.impressions ?? 0)), 0);
        const weightedImpressions = rows.reduce((sum, row) => sum + Math.max(1, Number(row.impressions ?? 0)), 0);
        const sortedRows = [...rows].sort((a, b) => {
            const aDate = new Date(a.date_end ?? a.date_start ?? a.created_at ?? "1970-01-01").getTime();
            const bDate = new Date(b.date_end ?? b.date_start ?? b.created_at ?? "1970-01-01").getTime();
            return bDate - aDate;
        });

        return {
            periodKey: key,
            dateStart: sortedRows[0]?.date_start ?? null,
            dateEnd: sortedRows[0]?.date_end ?? sortedRows[0]?.created_at?.slice(0, 10) ?? null,
            clicks,
            impressions,
            ctr: impressions > 0 ? clicks / impressions : 0,
            averagePosition: weightedImpressions > 0 ? weightedPositionTotal / weightedImpressions : 0,
        };
    }).sort((a, b) => periodSortValue(b) - periodSortValue(a));
}

function levelFromScore(score: number): ContentDecayLevel {
    if (score >= 75) return "severe";
    if (score >= 50) return "moderate";
    if (score >= 25) return "mild";
    return "none";
}

function suggestedActionForLevel(level: ContentDecayLevel, reasons: string[]) {
    if (level === "severe") return "Create a refresh task, prioritize the guide, review SERP intent, update metadata, and refresh outdated sections.";
    if (level === "moderate") return "Create a refresh task or schedule an editor review for the declining query group.";
    if (level === "mild") return "Monitor the next Search Console import and refresh metadata or headings if decline continues.";
    if (reasons.length > 0) return "No decay task needed yet; keep the guide in monitoring.";
    return "No content decay detected.";
}

export function analyzeContentDecay({
    guides,
    metrics,
    now = new Date(),
}: {
    guides: ContentDecayGuideInput[];
    metrics: ContentDecayMetricInput[];
    now?: Date;
}) {
    const metricsByGuide = new Map<string, ContentDecayMetricInput[]>();
    for (const metric of metrics) {
        if (!metric.guide_id) continue;
        if (!metricsByGuide.has(metric.guide_id)) metricsByGuide.set(metric.guide_id, []);
        metricsByGuide.get(metric.guide_id)?.push(metric);
    }

    return guides.map((guide): ContentDecayResult => {
        const periods = aggregatePeriods(metricsByGuide.get(guide.id) ?? []);
        const current = periods[0] ?? null;
        const previous = periods[1] ?? null;
        const clicksChange = current && previous ? percentChange(current.clicks, previous.clicks) : null;
        const impressionsChange = current && previous ? percentChange(current.impressions, previous.impressions) : null;
        const ctrChange = current && previous ? current.ctr - previous.ctr : null;
        const positionChange = current && previous ? current.averagePosition - previous.averagePosition : null;
        const daysSincePublished = daysSince(guide.published_at, now);
        const daysSinceUpdated = daysSince(guide.updated_at, now);
        const guideOlderThan60 = daysSincePublished !== null && daysSincePublished >= 60;
        const noUpdate45Days = daysSinceUpdated === null || daysSinceUpdated >= 45;
        const hasPositionLoss = positionChange !== null && positionChange >= 1;
        const isOverdueForUpdate = guideOlderThan60 && noUpdate45Days;

        const reasons: string[] = [];
        let decayScore = 0;

        if (impressionsChange !== null && impressionsChange <= -0.2) {
            decayScore += impressionsChange <= -0.5 ? 25 : 15;
            reasons.push(`Impressions are down ${Math.abs(impressionsChange * 100).toFixed(1)}% from the previous period.`);
        }
        if (clicksChange !== null && clicksChange <= -0.2) {
            decayScore += clicksChange <= -0.5 ? 25 : 15;
            reasons.push(`Clicks are down ${Math.abs(clicksChange * 100).toFixed(1)}% from the previous period.`);
        }
        if (ctrChange !== null && ctrChange <= -0.005) {
            decayScore += ctrChange <= -0.02 ? 20 : 10;
            reasons.push(`CTR is down ${Math.abs(ctrChange * 100).toFixed(2)} percentage points from the previous period.`);
        }
        if (hasPositionLoss) {
            decayScore += positionChange >= 3 ? 25 : 15;
            reasons.push(`Average position worsened by ${positionChange.toFixed(1)} places.`);
        }
        if (guideOlderThan60) {
            decayScore += 10;
            reasons.push("Guide is older than 60 days.");
        }
        if (noUpdate45Days) {
            decayScore += 10;
            reasons.push("Guide has not been updated in 45+ days.");
        }

        decayScore = Math.min(100, decayScore);
        const decayLevel = levelFromScore(decayScore);

        return {
            guideId: guide.id,
            title: guide.title,
            slug: guide.slug,
            keywordTarget: guide.keyword_target,
            guideType: guide.guide_type ?? null,
            batchName: guide.batch_name ?? null,
            keywordClusterId: guide.keyword_cluster_id ?? null,
            previous,
            current,
            clicksChange,
            impressionsChange,
            ctrChange,
            positionChange,
            decayScore,
            decayLevel,
            reasons,
            suggestedAction: suggestedActionForLevel(decayLevel, reasons),
            daysSincePublished,
            daysSinceUpdated,
            isOverdueForUpdate,
            hasPositionLoss,
        };
    }).sort((a, b) => b.decayScore - a.decayScore || (b.current?.impressions ?? 0) - (a.current?.impressions ?? 0));
}

export function summarizeContentDecay(rows: ContentDecayResult[]): ContentDecaySummary {
    return {
        totalMonitoredGuides: rows.length,
        severeDecayCount: rows.filter((row) => row.decayLevel === "severe").length,
        moderateDecayCount: rows.filter((row) => row.decayLevel === "moderate").length,
        overdueUpdateCount: rows.filter((row) => row.isOverdueForUpdate).length,
        positionLossCount: rows.filter((row) => row.hasPositionLoss).length,
    };
}

export function buildContentDecayTaskNotes(row: ContentDecayResult) {
    return [
        "Content Decay Refresh Task",
        "",
        `Guide: ${row.title}`,
        `Keyword target: ${row.keywordTarget ?? "n/a"}`,
        `Decay level: ${row.decayLevel}`,
        `Decay score: ${row.decayScore}`,
        "",
        "Previous period:",
        row.previous ? `${row.previous.dateStart ?? "n/a"} to ${row.previous.dateEnd ?? "n/a"}: ${row.previous.clicks} clicks, ${row.previous.impressions} impressions, ${(row.previous.ctr * 100).toFixed(2)}% CTR, avg position ${row.previous.averagePosition.toFixed(1)}` : "No previous period available.",
        "",
        "Current period:",
        row.current ? `${row.current.dateStart ?? "n/a"} to ${row.current.dateEnd ?? "n/a"}: ${row.current.clicks} clicks, ${row.current.impressions} impressions, ${(row.current.ctr * 100).toFixed(2)}% CTR, avg position ${row.current.averagePosition.toFixed(1)}` : "No current period available.",
        "",
        "Decay reasons:",
        ...(row.reasons.length > 0 ? row.reasons.map((reason) => `- ${reason}`) : ["- No metric decline detected; monitor only."]),
        "",
        "Suggested action:",
        row.suggestedAction,
        "",
        "Editor note:",
        "Do not add new factual claims until current payout, task, provider, and offer availability details are verified.",
    ].join("\n");
}
