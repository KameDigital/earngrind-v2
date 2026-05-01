export type SearchConsoleGuide = {
    id: string;
    slug: string;
};

export type ParsedSearchConsoleRow = {
    pageUrl: string;
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    guideId: string | null;
};

const COLUMN_ALIASES: Record<string, string> = {
    page: "page",
    url: "page",
    page_url: "page",
    landing_page: "page",
    query: "query",
    search_query: "query",
    clicks: "clicks",
    impressions: "impressions",
    ctr: "ctr",
    position: "position",
    avg_position: "position",
    average_position: "position",
};

function normalizeHeader(value: string) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function parseCsvLine(line: string) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index++) {
        const char = line[index];
        const next = line[index + 1];
        if (char === '"' && next === '"') {
            current += '"';
            index += 1;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    values.push(current.trim());
    return values.map((value) => value.replace(/^"|"$/g, ""));
}

function parseNumber(value: string) {
    const cleaned = value.replace(/[%,$,\s]/g, "").trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
}

function parseCtr(value: string) {
    const raw = value.trim();
    const parsed = parseNumber(raw);
    if (raw.includes("%")) return parsed / 100;
    return parsed > 1 ? parsed / 100 : parsed;
}

export function extractGuideSlugFromUrl(pageUrl: string) {
    try {
        const parsed = new URL(pageUrl, "https://earngrind.com");
        const match = parsed.pathname.match(/^\/guides\/([^/?#]+)/i);
        return match?.[1] ? decodeURIComponent(match[1]) : null;
    } catch {
        const match = pageUrl.match(/\/guides\/([^/?#]+)/i);
        return match?.[1] ? decodeURIComponent(match[1]) : null;
    }
}

export function matchGuideIdFromPageUrl(pageUrl: string, guides: SearchConsoleGuide[]) {
    const slug = extractGuideSlugFromUrl(pageUrl);
    if (!slug) return null;
    return guides.find((guide) => guide.slug === slug)?.id ?? null;
}

export function parseSearchConsoleCsv(csv: string, guides: SearchConsoleGuide[]) {
    const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    const headers = parseCsvLine(lines[0]).map((header) => COLUMN_ALIASES[normalizeHeader(header)] ?? normalizeHeader(header));
    const indexOf = (name: string) => headers.findIndex((header) => header === name);
    const pageIndex = indexOf("page");
    const queryIndex = indexOf("query");
    const clicksIndex = indexOf("clicks");
    const impressionsIndex = indexOf("impressions");
    const ctrIndex = indexOf("ctr");
    const positionIndex = indexOf("position");

    if (pageIndex < 0 || queryIndex < 0 || clicksIndex < 0 || impressionsIndex < 0 || ctrIndex < 0 || positionIndex < 0) {
        throw new Error("CSV must include Page, Query, Clicks, Impressions, CTR, and Position columns.");
    }

    return lines.slice(1).map((line): ParsedSearchConsoleRow | null => {
        const values = parseCsvLine(line);
        const pageUrl = values[pageIndex]?.trim() ?? "";
        const query = values[queryIndex]?.trim() ?? "";
        if (!pageUrl || !query) return null;
        return {
            pageUrl,
            query,
            clicks: Math.max(0, Math.round(parseNumber(values[clicksIndex] ?? "0"))),
            impressions: Math.max(0, Math.round(parseNumber(values[impressionsIndex] ?? "0"))),
            ctr: Math.max(0, parseCtr(values[ctrIndex] ?? "0")),
            position: Math.max(0, parseNumber(values[positionIndex] ?? "0")),
            guideId: matchGuideIdFromPageUrl(pageUrl, guides),
        };
    }).filter((row): row is ParsedSearchConsoleRow => Boolean(row));
}

export type GuideSearchConsoleMetric = {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
};

export function summarizeSearchConsoleMetrics(metrics: GuideSearchConsoleMetric[], keywordTarget?: string | null) {
    const clicks = metrics.reduce((sum, metric) => sum + metric.clicks, 0);
    const impressions = metrics.reduce((sum, metric) => sum + metric.impressions, 0);
    const weightedPositionTotal = metrics.reduce((sum, metric) => sum + metric.position * Math.max(1, metric.impressions), 0);
    const weightedImpressions = metrics.reduce((sum, metric) => sum + Math.max(1, metric.impressions), 0);
    const topQueries = [...metrics].sort((a, b) => b.impressions - a.impressions).slice(0, 8);
    const keyword = keywordTarget?.trim().toLowerCase();
    const mismatchQueries = keyword
        ? topQueries.filter((metric) => metric.impressions > 0 && !metric.query.toLowerCase().includes(keyword)).map((metric) => metric.query)
        : [];

    return {
        clicks,
        impressions,
        ctr: impressions > 0 ? clicks / impressions : 0,
        avgPosition: weightedImpressions > 0 ? weightedPositionTotal / weightedImpressions : 0,
        topQueries,
        mismatchQueries,
        hasHighImpressionsLowCtr: impressions >= 100 && impressions > 0 && clicks / impressions < 0.02,
        hasStrikingDistance: topQueries.some((metric) => metric.position >= 4 && metric.position <= 15),
    };
}
