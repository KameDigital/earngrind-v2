export type SearchConsoleOpportunityRow = {
    id?: string;
    guide_id: string | null;
    page_url: string;
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    guide?: {
        id: string;
        title: string;
        slug: string;
        keyword_target: string | null;
        max_payout_usd?: number | null;
    } | null;
};

export type QueryOpportunityType =
    | "new_guide"
    | "add_section"
    | "ctr_improvement"
    | "supporting_cluster";

export type SearchConsoleQueryOpportunity = {
    id: string;
    type: QueryOpportunityType;
    query: string;
    pageUrl: string;
    guideId: string | null;
    guideTitle: string | null;
    guideSlug: string | null;
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
    suggestedAction: string;
    priorityScore: number;
    priorityLabel: "Highest Priority" | "Strong" | "Medium" | "Low";
    relatedQueries?: string[];
};

function normalize(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
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

function queryIntent(value: string) {
    const lower = normalize(value);
    if (/\blevel\b|\breach\b|\bwithin\b/.test(lower)) return "level";
    if (/\bpurchase\b|\bbuy\b|\bpack\b|\bspend\b/.test(lower)) return "purchase";
    if (/\bworth\b|\broi\b|\bpayout\b|\bbest\b/.test(lower)) return "roi";
    if (/\bvs\b|\bversus\b|\bcompare\b/.test(lower)) return "comparison";
    if (/\btutorial\b|\bshard\b|\bupgrade\b|\btask\b/.test(lower)) return "task";
    return "main";
}

function scoreOpportunity(row: SearchConsoleOpportunityRow, hasNoMatch: boolean) {
    let score = 0;
    score += Math.min(35, Math.floor(row.impressions / 20));
    if (row.position >= 4 && row.position <= 15) score += 25;
    else if (row.position > 15 && row.position <= 30) score += 15;
    if (row.ctr < 0.02) score += 20;
    if (hasNoMatch) score += 15;
    if ((row.guide?.max_payout_usd ?? 0) >= 100) score += 5;
    return Math.min(100, score);
}

function priorityLabel(score: number): SearchConsoleQueryOpportunity["priorityLabel"] {
    if (score >= 85) return "Highest Priority";
    if (score >= 70) return "Strong";
    if (score >= 45) return "Medium";
    return "Low";
}

function hasCloseKeywordMatch(query: string, existingKeywords: string[]) {
    return existingKeywords.some((keyword) => tokenSimilarity(query, keyword) >= 0.75);
}

function belongsToSameGuideIntent(row: SearchConsoleOpportunityRow) {
    const keyword = row.guide?.keyword_target ?? "";
    if (!keyword) return true;
    return tokenSimilarity(row.query, keyword) >= 0.25;
}

export function mineSearchConsoleQueryOpportunities(
    rows: SearchConsoleOpportunityRow[],
    existingKeywords: string[],
) {
    const opportunities: SearchConsoleQueryOpportunity[] = [];
    const groupedByIntent = new Map<string, SearchConsoleOpportunityRow[]>();

    for (const row of rows) {
        const closeKeywordMatch = hasCloseKeywordMatch(row.query, existingKeywords);
        const base = {
            query: row.query,
            pageUrl: row.page_url,
            guideId: row.guide_id,
            guideTitle: row.guide?.title ?? null,
            guideSlug: row.guide?.slug ?? null,
            impressions: row.impressions,
            clicks: row.clicks,
            ctr: row.ctr,
            position: row.position,
        };

        if (row.impressions >= 50 && row.position >= 8 && row.position <= 30 && !closeKeywordMatch) {
            const score = scoreOpportunity(row, true);
            opportunities.push({
                id: `new-${normalize(row.query)}-${row.id ?? row.page_url}`,
                type: "new_guide",
                ...base,
                suggestedAction: "Create a focused draft guide targeting this query because it has impressions but no close guide keyword match.",
                priorityScore: score,
                priorityLabel: priorityLabel(score),
            });
        }

        if (row.guide_id && row.impressions >= 30 && belongsToSameGuideIntent(row) && queryIntent(row.query) !== queryIntent(row.guide?.keyword_target ?? "")) {
            const score = scoreOpportunity(row, false);
            opportunities.push({
                id: `section-${normalize(row.query)}-${row.guide_id}`,
                type: "add_section",
                ...base,
                suggestedAction: "Add an H2 section that addresses this query without creating a thin separate article.",
                priorityScore: score,
                priorityLabel: priorityLabel(score),
            });
        }

        if (row.impressions >= 100 && row.ctr < 0.02 && row.position <= 10) {
            const score = scoreOpportunity(row, false);
            opportunities.push({
                id: `ctr-${normalize(row.query)}-${row.id ?? row.page_url}`,
                type: "ctr_improvement",
                ...base,
                suggestedAction: "Improve the SEO title/meta to better match this query and increase SERP click-through.",
                priorityScore: score,
                priorityLabel: priorityLabel(score),
            });
        }

        const intentKey = queryIntent(row.query);
        if (!groupedByIntent.has(intentKey)) groupedByIntent.set(intentKey, []);
        groupedByIntent.get(intentKey)?.push(row);
    }

    for (const [intent, intentRows] of Array.from(groupedByIntent.entries())) {
        const qualified = intentRows.filter((row) => row.impressions >= 20);
        const totalImpressions = qualified.reduce((sum, row) => sum + row.impressions, 0);
        if (qualified.length >= 3 && totalImpressions >= 100) {
            const top = qualified.sort((a, b) => b.impressions - a.impressions)[0];
            const score = Math.min(100, 55 + Math.floor(totalImpressions / 20));
            opportunities.push({
                id: `cluster-${intent}-${normalize(top.query)}`,
                type: "supporting_cluster",
                query: `${intent} query cluster`,
                pageUrl: top.page_url,
                guideId: top.guide_id,
                guideTitle: top.guide?.title ?? null,
                guideSlug: top.guide?.slug ?? null,
                impressions: totalImpressions,
                clicks: qualified.reduce((sum, row) => sum + row.clicks, 0),
                ctr: totalImpressions > 0 ? qualified.reduce((sum, row) => sum + row.clicks, 0) / totalImpressions : 0,
                position: qualified.reduce((sum, row) => sum + row.position, 0) / qualified.length,
                suggestedAction: `Create a supporting ${intent} guide cluster or strengthen the existing hub with these related queries.`,
                priorityScore: score,
                priorityLabel: priorityLabel(score),
                relatedQueries: qualified.slice(0, 6).map((row) => row.query),
            });
        }
    }

    return opportunities.sort((a, b) => b.priorityScore - a.priorityScore);
}

export function suggestedHeadingFromQuery(query: string) {
    return normalize(query)
        .split(" ")
        .map((word) => word ? `${word[0].toUpperCase()}${word.slice(1)}` : "")
        .join(" ");
}
