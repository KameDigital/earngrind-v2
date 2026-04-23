import axios from "axios";
import { SourceAdapter } from "../models/source";
import { SourceOffer } from "../types/offer";
import { withRetry } from "../core/db";
import { logger } from "../core/logger";

const DEFAULT_GAIN_API_URL = "https://gain.gg/api/v2/offers";
const DEFAULT_GAIN_SITE_URL = "https://gain.gg/earn";
const DEFAULT_GAIN_API_LIMIT = 300;
const MAX_AUTO_PAGES = 5;
const GAIN_COIN_TO_USD = 0.001;

const MOCK_GAIN_OFFERS: SourceOffer[] = [
    {
        external_id: "gain-monopoly-go-board-42",
        title: "Monopoly GO - Reach Board 42",
        payout_raw: "18.00",
        currency: "USD",
        device_raw: "iOS & Android",
        category_raw: "Mobile Games",
        url: "https://gain.gg/earn/monopoly-go-board-42",
        expires_raw: null,
        game_slug: "monopoly-go",
        countries_raw: ["US"],
        game_title: "Monopoly GO",
        provider_name: "gain.gg",
        image_url: null,
        total_payout_raw: "18.00",
        task_list: [
            {
                title: "Reach Board 42",
                reward_amount_usd: 18,
                reward_display: "$18.00",
                task_type: "milestone",
                time_limit_text: null,
                notes: null,
                sort_order: 1,
            },
        ],
    },
    {
        external_id: "gain-coin-master-village-40",
        title: "Coin Master - Complete Village 40",
        payout_raw: "22.50",
        currency: "USD",
        device_raw: "Android",
        category_raw: "Mobile Games",
        url: "https://gain.gg/earn/coin-master-village-40",
        expires_raw: null,
        game_slug: "coin-master",
        countries_raw: ["US"],
        game_title: "Coin Master",
        provider_name: "gain.gg",
        image_url: null,
        total_payout_raw: "22.50",
        task_list: [
            {
                title: "Complete Village 40",
                reward_amount_usd: 22.5,
                reward_display: "$22.50",
                task_type: "milestone",
                time_limit_text: null,
                notes: null,
                sort_order: 1,
            },
        ],
    },
    {
        external_id: "gain-bingo-blitz-level-70",
        title: "Bingo Blitz - Level 70",
        payout_raw: "14.00",
        currency: "USD",
        device_raw: "iOS",
        category_raw: "Mobile Games",
        url: "https://gain.gg/earn/bingo-blitz-level-70",
        expires_raw: null,
        game_slug: "bingo-blitz",
        countries_raw: ["US"],
        game_title: "Bingo Blitz",
        provider_name: "gain.gg",
        image_url: null,
        total_payout_raw: "14.00",
        task_list: [
            {
                title: "Reach Level 70",
                reward_amount_usd: 14,
                reward_display: "$14.00",
                task_type: "milestone",
                time_limit_text: null,
                notes: null,
                sort_order: 1,
            },
        ],
    },
];

export async function fetchOffers(): Promise<SourceOffer[]> {
    const useMock = (process.env.GAIN_USE_MOCK ?? "true").toLowerCase() === "true";
    if (useMock) {
        logger.info("Gain source using mock offers", { count: MOCK_GAIN_OFFERS.length });
        return [...MOCK_GAIN_OFFERS];
    }

    const apiUrl = process.env.GAIN_API_URL ?? DEFAULT_GAIN_API_URL;
    const limit = parsePositiveInt(process.env.GAIN_API_LIMIT, DEFAULT_GAIN_API_LIMIT);
    const parsed = await fetchGainOffersFromApi(apiUrl, limit);

    if (parsed.length === 0) {
        throw new Error(`Gain source returned 0 parsed offers for ${apiUrl}.`);
    }

    return parsed;
}

export const gainSource: SourceAdapter = {
    key: "gain-gg",
    name: "Gain.gg",
    type: "api",
    baseUrl: DEFAULT_GAIN_API_URL,
    fetchOffers,
};

async function fetchGainOffersFromApi(apiUrl: string, limit: number): Promise<SourceOffer[]> {
    const offers: SourceOffer[] = [];
    const seenIds = new Set<string>();

    for (let page = 1; page <= MAX_AUTO_PAGES; page += 1) {
        const payload = await fetchGainApiPage(apiUrl, limit, page);
        const parsed = parseGainApiPayload(payload);
        const fresh = parsed.filter((offer) => {
            if (seenIds.has(offer.external_id)) return false;
            seenIds.add(offer.external_id);
            return true;
        });

        offers.push(...fresh);
        logger.info("Gain source parsed offers", {
            page,
            pageCount: parsed.length,
            freshCount: fresh.length,
            totalParsed: offers.length,
        });

        if (parsed.length < limit || fresh.length === 0) {
            break;
        }
    }

    return offers;
}

async function fetchGainApiPage(apiUrl: string, limit: number, page: number): Promise<unknown> {
    logger.info("Gain source fetch started", { apiUrl, page, limit });

    const response = await withRetry(
        () =>
            axios.get(apiUrl, {
                timeout: 20000,
                headers: buildHeaders(),
                params: buildParams(limit, page),
                responseType: "json",
            }),
        "gain-fetch-api",
    );

    const payload = response.data;
    const topLevelKeys = isRecord(payload) ? Object.keys(payload) : [];
    const rootNode = isRecord(payload) && "data" in payload ? payload.data : payload;
    const sampleItem = firstSampleItem(rootNode);

    logger.info("Gain source fetch succeeded", {
        apiUrl,
        page,
        limit,
        status: response.status,
        topLevelKeys,
        payloadKind: Array.isArray(rootNode) ? "array" : typeof rootNode,
        sampleItemShape: sampleItem && isRecord(sampleItem) ? Object.keys(sampleItem) : null,
    });

    return payload;
}

export function parseGainApiPayload(payload: unknown): SourceOffer[] {
    const rootNode = isRecord(payload) && "data" in payload ? payload.data : payload;
    const items = flattenOfferNodes(rootNode);
    const offers: SourceOffer[] = [];

    for (const item of items) {
        if (!isRecord(item)) continue;

        const offerId = asString(item.id);
        const offerName = asString(item.name);
        const provider = asString(item.provider) || "gain.gg";
        const offerLink = asString(item.offerLink);
        const supportLink = asString(item.supportLink);
        const squareImage = asString(item.squareImage) || asString(item.image) || asString(item.icon);
        const deviceRaw = normalizePlatforms(item.platforms);
        const categoryRaw = inferCategory(offerName, asString(item.description));
        const taskList = Array.isArray(item.taskList) ? item.taskList : [];
        const cleanTitle = extractParentTitle(offerName);
        const countries = normalizeCountries(item);

        if (!offerId || !offerName) continue;

        if (taskList.length === 0) {
            const fallbackCoins = toNumber(item.coins) ?? toNumber(item.payout) ?? 0;
            if (fallbackCoins <= 0) continue;

            offers.push({
                external_id: offerId,
                title: cleanTitle,
                payout_raw: coinsToUsdString(fallbackCoins),
                currency: "USD",
                device_raw: deviceRaw,
                category_raw: categoryRaw,
                url: normalizeUrl(offerLink || supportLink || DEFAULT_GAIN_SITE_URL),
                expires_raw: null,
                game_slug: null,
                countries_raw: countries,
                game_title: cleanTitle,
                provider_name: provider,
                image_url: squareImage || null,
                total_payout_raw: coinsToUsdString(fallbackCoins),
                task_list: [],
            });
            continue;
        }

        const parsedTasks = taskList
            .map((task, index) => parseTask(task, index))
            .filter((task): task is NonNullable<typeof task> => Boolean(task));

        if (parsedTasks.length === 0) {
            continue;
        }

        const bestPayoutUsd = Math.max(...parsedTasks.map((task) => task.reward_amount_usd));
        const totalPayoutUsd = parsedTasks.reduce((sum, task) => sum + task.reward_amount_usd, 0);

        offers.push({
            external_id: offerId,
            title: cleanTitle,
            payout_raw: bestPayoutUsd.toFixed(2),
            currency: "USD",
            device_raw: deviceRaw,
            category_raw: categoryRaw,
            url: normalizeUrl(offerLink || supportLink || DEFAULT_GAIN_SITE_URL),
            expires_raw: null,
            game_slug: null,
            countries_raw: countries,
            game_title: cleanTitle,
            provider_name: provider,
            image_url: squareImage || null,
            total_payout_raw: totalPayoutUsd.toFixed(2),
            task_list: parsedTasks,
        });
    }

    return offers;
}

function parseTask(task: unknown, index: number) {
    if (!isRecord(task)) return null;

    const taskName = asString(task.name);
    const taskPayout = toNumber(task.payout) ?? toNumber(task.coins) ?? 0;
    if (!taskName || taskPayout <= 0) return null;

    const rewardAmountUsd = Number(coinsToUsdString(taskPayout));

    return {
        title: taskName,
        reward_amount_usd: rewardAmountUsd,
        reward_display: `$${rewardAmountUsd.toFixed(2)}`,
        task_type: inferTaskType(taskName),
        time_limit_text: asString(task.timeLimitText) || asString(task.time_limit_text) || null,
        notes: asString(task.description) || null,
        sort_order: index + 1,
    } as const;
}

function flattenOfferNodes(node: unknown): unknown[] {
    if (Array.isArray(node)) return node;
    if (!isRecord(node)) return [];

    const arrays: unknown[] = [];

    for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
            arrays.push(...value);
            continue;
        }

        if (isRecord(value)) {
            arrays.push(...flattenOfferNodes(value));
        }
    }

    return arrays;
}

function firstSampleItem(node: unknown): unknown {
    if (Array.isArray(node)) return node[0] ?? null;
    if (!isRecord(node)) return null;

    for (const value of Object.values(node)) {
        if (Array.isArray(value) && value.length > 0) return value[0];
        if (isRecord(value)) {
            const nested = firstSampleItem(value);
            if (nested) return nested;
        }
    }

    return null;
}

function buildHeaders(): Record<string, string> {
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://gain.gg",
        "Referer": "https://gain.gg/",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    };
}

function buildParams(limit: number, page: number): Record<string, string | number> {
    return page > 1 ? { limit, page } : { limit };
}

function normalizePlatforms(platforms: unknown): string {
    if (!Array.isArray(platforms) || platforms.length === 0) return "web";
    return platforms.map((platform) => asString(platform)).filter(Boolean).join(" & ");
}

function normalizeCountries(item: Record<string, any>): string[] | null {
    const rawCandidates = [
        item.countries,
        item.countryCodes,
        item.availableCountries,
        item.available_countries,
    ];

    for (const candidate of rawCandidates) {
        if (Array.isArray(candidate)) {
            const countries = candidate
                .map((value) => asString(value).toUpperCase())
                .filter((value) => /^[A-Z]{2}$/.test(value));

            if (countries.length > 0) {
                return Array.from(new Set(countries));
            }
        }
    }

    return null;
}

function inferCategory(name: string, description: string): string {
    const haystack = `${name} ${description}`.toLowerCase();
    if (/survey|research|bitlabs|prime surveys/.test(haystack)) return "survey";
    if (/game|level|village|purchase|install|play/.test(haystack)) return "mobile_game";
    return "other";
}

function extractParentTitle(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) return trimmed;

    const splitPatterns = [" - ", " – ", " — ", ": ", " | "];
    for (const separator of splitPatterns) {
        const [head, tail] = trimmed.split(separator, 2);
        if (tail && looksLikeMilestoneText(tail)) {
            return head.trim();
        }
    }

    const inlineMatch = trimmed.match(/^(.*?)(?:\s+(reach|complete|install|unlock|finish|purchase|deposit|play|achieve|get|sign up)\b.*)$/i);
    if (inlineMatch?.[1]?.trim()) {
        return inlineMatch[1].trim();
    }

    return trimmed;
}

function looksLikeMilestoneText(value: string): boolean {
    return /\b(reach|complete|install|unlock|finish|purchase|deposit|play|achieve|get|sign up|level|board|village|chapter|stage|milestone)\b/i.test(value);
}

function inferTaskType(title: string): "install" | "milestone" | "purchase" | "signup" | "other" {
    if (/\binstall\b/i.test(title)) return "install";
    if (/\b(sign up|signup|register)\b/i.test(title)) return "signup";
    if (/\b(purchase|buy|spend|deposit)\b/i.test(title)) return "purchase";
    if (/\b(reach|complete|finish|unlock|level|board|village|chapter|stage|milestone)\b/i.test(title)) return "milestone";
    return "other";
}

function coinsToUsdString(coins: number): string {
    return (coins * GAIN_COIN_TO_USD).toFixed(2);
}

function normalizeUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;
    return DEFAULT_GAIN_SITE_URL;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function asString(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, any> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
