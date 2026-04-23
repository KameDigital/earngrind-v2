import axios from "axios";
import { SourceAdapter } from "../models/source";
import { SourceOffer } from "../types/offer";
import { withRetry } from "../core/db";
import { logger } from "../core/logger";

const DEFAULT_MYCHIPS_API_URL = "https://api.mychips.io/v1.6/campaigns";
const DEFAULT_CAMPAIGNS_USERS_API_URL = "https://api.mychips.io/v1.6/campaigns/users";
const DEFAULT_LIMIT = 10;
const DEFAULT_LANGUAGE = "en";

const MOCK_OFFERS: SourceOffer[] = [
    {
        external_id: "cashinstyle-mychips-monopoly-go",
        title: "Monopoly GO",
        payout_raw: "24.00",
        currency: "USD",
        device_raw: "Android & iOS",
        category_raw: "mobile_game",
        url: "https://cashinstyle.com/walls/mychips",
        expires_raw: null,
        game_slug: "monopoly-go",
        countries_raw: ["US"],
        game_title: "Monopoly GO",
        provider_name: "MyChips",
        image_url: null,
        total_payout_raw: "42.00",
        best_payout_usd: 24,
        task_list: [],
    },
];

export const cashInStyleMyChipsSource: SourceAdapter = {
    key: "cashinstyle-mychips",
    name: "CashInStyle MyChips",
    type: "api",
    baseUrl: DEFAULT_CAMPAIGNS_USERS_API_URL,
    storage: "site_offers",
    mockEnvVar: "CASHINSTYLE_USE_MOCK",
    fetchOffers,
};

export async function fetchOffers(): Promise<SourceOffer[]> {
    const useMock = (process.env.CASHINSTYLE_USE_MOCK ?? "false").toLowerCase() === "true";
    if (useMock) {
        logger.info("CashInStyle MyChips source using mock offers", { count: MOCK_OFFERS.length });
        return [...MOCK_OFFERS];
    }

    const contentId = process.env.CASHINSTYLE_MYCHIPS_CONTENT_ID?.trim();
    const userId = process.env.CASHINSTYLE_MYCHIPS_USER_ID?.trim();
    const clickId = process.env.CASHINSTYLE_MYCHIPS_CLICK_ID?.trim();
    if (!contentId || !userId || !clickId) {
        throw new Error("CashInStyle MyChips requires CASHINSTYLE_MYCHIPS_CONTENT_ID, CASHINSTYLE_MYCHIPS_USER_ID, and CASHINSTYLE_MYCHIPS_CLICK_ID.");
    }

    const apiUrl = process.env.CASHINSTYLE_MYCHIPS_API_URL ?? DEFAULT_MYCHIPS_API_URL;
    const language = process.env.CASHINSTYLE_MYCHIPS_LANGUAGE ?? DEFAULT_LANGUAGE;
    const limit = parsePositiveInt(process.env.CASHINSTYLE_MYCHIPS_LIMIT, DEFAULT_LIMIT);
    const country = process.env.CASHINSTYLE_MYCHIPS_COUNTRY?.trim() || undefined;
    const age = process.env.CASHINSTYLE_MYCHIPS_AGE?.trim() || undefined;
    const gender = process.env.CASHINSTYLE_MYCHIPS_GENDER?.trim() || undefined;
    const debugKey = process.env.CASHINSTYLE_MYCHIPS_DEBUG_KEY?.trim() || undefined;

    const offers: SourceOffer[] = [];
    const seen = new Set<string>();

    for (let offset = 0; ; offset += limit) {
        const response = await withRetry(
            () =>
                axios.get(apiUrl, {
                    timeout: 20000,
                    headers: buildHeaders(),
                    params: {
                        content_id: contentId,
                        user_id: userId,
                        click_id: clickId,
                        language,
                        offset,
                        limit,
                        ...(country ? { country } : {}),
                        ...(age ? { age } : {}),
                        ...(gender ? { gender } : {}),
                        ...(debugKey ? { debug_key: debugKey } : {}),
                    },
                    responseType: "json",
                }),
            "cashinstyle-mychips-fetch",
        );

        const payload = response.data;
        const campaigns = extractCampaignNodes(payload);
        const sample = campaigns[0];

        logger.info("CashInStyle MyChips page fetched", {
            requestUrl: response.request?.res?.responseUrl ?? apiUrl,
            status: response.status,
            topLevelKeys: isRecord(payload) ? Object.keys(payload) : [],
            sampleResponseKeys: isRecord(sample) ? Object.keys(sample) : null,
            offset,
            limit,
            pageCount: campaigns.length,
        });

        if (campaigns.length === 0) break;

        let freshCount = 0;
        for (const campaign of campaigns) {
            const parsed = parseCampaign(campaign);
            if (!parsed || seen.has(parsed.external_id)) continue;
            seen.add(parsed.external_id);
            offers.push(parsed);
            freshCount += 1;
        }

        logger.info("CashInStyle MyChips page parsed", {
            offset,
            limit,
            pageCount: campaigns.length,
            freshCount,
            totalParsed: offers.length,
        });

        if (campaigns.length < limit) break;
    }

    return offers;
}

function parseCampaign(node: unknown): SourceOffer | null {
    if (!isRecord(node)) return null;

    const campaignId = firstString(node.id);
    const rawTitle = firstString(node.title, node.subtitle);
    if (!campaignId || !rawTitle) return null;

    const taskList = extractTaskList(node);
    const fallbackPayoutInfo = extractCampaignFallbackPayout(node);
    const fallbackPayout = fallbackPayoutInfo.usd;
    const totalPayout = taskList.length > 0 ? taskList.reduce((sum, task) => sum + task.reward_amount_usd, 0) : fallbackPayout;
    const bestPayout = taskList.length > 0 ? Math.max(...taskList.map((task) => task.reward_amount_usd)) : fallbackPayout;

    const cleanTitle = extractParentTitle(rawTitle);
    const imageUrl = firstString(node.thumbnail, node.cover, node.image, node.image_url, node.imageUrl, node.icon) || null;

    return {
        external_id: `cashinstyle-mychips-${campaignId}`,
        title: cleanTitle,
        payout_raw: bestPayout.toFixed(2),
        currency: "USD",
        device_raw: normalizeDevices(node),
        category_raw: firstString(node.category, node.vertical, node.vertical_name, node.verticalName) || inferCategory(rawTitle),
        url: normalizeUrl(firstString(node.trackingUrl, node.tracking_url, node.offer_url, node.offerUrl, node.click_url, node.clickUrl)),
        expires_raw: firstString(node.expires_at, node.expiry, node.expiration_date) || null,
        game_slug: null,
        countries_raw: normalizeCountries(node),
        game_title: cleanTitle,
        provider_name: "MyChips",
        image_url: imageUrl,
        total_payout_raw: totalPayout.toFixed(2),
        best_payout_usd: bestPayout,
        task_list: taskList,
    };
}

function extractTaskList(payload: Record<string, any>): NonNullable<SourceOffer["task_list"]> {
    const groups = [payload.events, payload.bonusEvents, payload.recurringEvents, payload.tasks, payload.goals];
    const tasks: NonNullable<SourceOffer["task_list"]> = [];

    for (const group of groups) {
        if (!Array.isArray(group)) continue;
        const baseIndex = tasks.length;
        const parsedGroup = group.map((task, index) => parseTask(task, baseIndex + index)).filter((task): task is NonNullable<typeof task> => Boolean(task));
        if (parsedGroup.length > 0) tasks.push(...parsedGroup);
    }

    return tasks;
}

function parseTask(task: unknown, index: number) {
    if (!isRecord(task)) return null;

    const title = resolveTaskTitle(task);
    const payout = extractEventPayout(task).usd;
    if (!title) return null;

    return {
        title,
        reward_amount_usd: round(payout),
        reward_display: `$${round(payout).toFixed(2)}`,
        task_type: inferTaskType(title),
        time_limit_text: firstString(task.time_limit, task.timeLimit, task.deadline, task.expiry) || null,
        notes: firstString(task.description, task.note, task.instructions) || null,
        sort_order: extractSortOrder(task, index),
    } as const;
}

function resolveTaskTitle(task: Record<string, any>): string | null {
    const preferred = firstString(task.userFlow, task.userFlowDetails, task.title, task.eventName, task.subtitle, task.description, task.requirement);
    if (preferred) return sanitizeTaskTitle(preferred);
    const fallback = firstString(task.name);
    if (!fallback) return null;
    return sanitizeTaskTitle(humanizeTaskKey(fallback));
}

function extractCampaignNodes(payload: unknown): unknown[] {
    if (Array.isArray(payload)) return payload.filter(looksLikeCampaign);
    if (!isRecord(payload)) return [];
    for (const candidate of [payload.campaigns, payload.data, payload.results, payload.items, payload.offers]) {
        if (Array.isArray(candidate)) return candidate.filter(looksLikeCampaign);
    }
    return [];
}

function looksLikeCampaign(node: unknown): boolean {
    return isRecord(node) && Boolean(firstString(node.id)) && Boolean(firstString(node.title, node.subtitle));
}

function extractCampaignFallbackPayout(payload: Record<string, any>): { usd: number; rawValue: number | null; sourceField: string | null } {
    const candidates: Array<[string, unknown]> = [
        ["remainingConvertedValue", payload.remainingConvertedValue],
        ["totalConvertedValue", payload.totalConvertedValue],
        ["totalConvertedPromoValue", payload.totalConvertedPromoValue],
        ["convertedBid", payload.convertedBid],
        ["bid", payload.bid],
        ["chips", payload.chips],
    ];
    for (const [field, value] of candidates) {
        const numeric = toNumber(value);
        if (numeric !== null && numeric > 0) {
            return { usd: convertToUsd(numeric, payload.currencyExchangeRatio), rawValue: numeric, sourceField: field };
        }
    }
    return { usd: 0, rawValue: null, sourceField: null };
}

function extractEventPayout(payload: Record<string, any>): { usd: number; rawValue: number | null; sourceField: string | null } {
    const candidates: Array<[string, unknown]> = [
        ["convertedBid", payload.convertedBid],
        ["totalConvertedBid", payload.totalConvertedBid],
        ["convertedBidPromo", payload.convertedBidPromo],
        ["totalConvertedBidPromo", payload.totalConvertedBidPromo],
        ["totalConvertedValue", payload.totalConvertedValue],
        ["remainingConvertedValue", payload.remainingConvertedValue],
        ["totalConvertedPromoValue", payload.totalConvertedPromoValue],
        ["convertedValue", payload.convertedValue],
        ["value", payload.value],
        ["reward", payload.reward],
        ["amount", payload.amount],
        ["bid", payload.bid],
        ["chips", payload.chips],
        ["remainingChips", payload.remainingChips],
        ["totalChipsEarned", payload.totalChipsEarned],
    ];
    for (const [field, value] of candidates) {
        const numeric = toNumber(value);
        if (numeric !== null && numeric > 0) {
            return { usd: convertToUsd(numeric, payload.currencyExchangeRatio), rawValue: numeric, sourceField: field };
        }
    }
    return { usd: 0, rawValue: null, sourceField: null };
}

function convertToUsd(rawValue: number, currencyExchangeRatio: unknown): number {
    const ratio = toNumber(currencyExchangeRatio);
    if (ratio && ratio > 0) return round(rawValue / ratio);
    return round(rawValue / 1000);
}

function extractSortOrder(task: Record<string, any>, index: number): number {
    const explicitOrder = toNumber(task.orderId ?? task.order_id ?? task.order);
    if (explicitOrder !== null && explicitOrder > 0) return Math.trunc(explicitOrder);
    return index + 1;
}

function sanitizeTaskTitle(value: string): string {
    return value.replace(/\s+/g, " ").replace(/\s+([!?,.:;])/g, "$1").trim();
}

function humanizeTaskKey(value: string): string {
    const normalized = value.replace(/[_-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/\s+/g, " ").trim();
    if (!normalized) return value;
    return normalized.split(" ").map((part) => {
        const lower = part.toLowerCase();
        if (/^\d+$/.test(lower)) return lower;
        if (lower.length <= 3 && /^(iap|sng|id|ios|api)$/i.test(part)) return part.toUpperCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    }).join(" ");
}

function inferTaskType(title: string): "install" | "milestone" | "purchase" | "signup" | "other" {
    const normalized = title.toLowerCase();
    if (/\binstall|open app|first open|download\b/.test(normalized)) return "install";
    if (/\bpurchase|buy|deposit|subscription\b/.test(normalized)) return "purchase";
    if (/\bsign ?up|register|create account\b/.test(normalized)) return "signup";
    if (/\breach|complete|unlock|win|level|play|finish\b/.test(normalized)) return "milestone";
    return "other";
}

function normalizeDevices(payload: Record<string, any>): string {
    const values = [payload.platform, payload.platforms, payload.devices, payload.type].flatMap((value) => Array.isArray(value) ? value : [value]).map((value) => firstString(value).toLowerCase()).filter(Boolean);
    if (values.length === 0) return "web";
    return Array.from(new Set(values)).join(",");
}

function normalizeCountries(payload: Record<string, any>): string[] | null {
    const candidates = [payload.countries, payload.country_codes, payload.countryCodes];
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            const countries = candidate.map((value) => firstString(value).toUpperCase()).filter((value) => /^[A-Z]{2}$/.test(value));
            if (countries.length > 0) return Array.from(new Set(countries));
        }
        if (typeof candidate === "string" && candidate.trim()) {
            const countries = candidate.split(/[\s,|]+/).map((value) => value.trim().toUpperCase()).filter((value) => /^[A-Z]{2}$/.test(value));
            if (countries.length > 0) return Array.from(new Set(countries));
        }
    }
    return null;
}

function buildHeaders(): Record<string, string> {
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://cdn.mychips.io",
        "Referer": "https://cdn.mychips.io/",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    };
}

function normalizeUrl(url: string): string {
    return /^https?:\/\//i.test(url) ? url : "https://cashinstyle.com/walls/mychips";
}

function extractParentTitle(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    const [head, tail] = trimmed.split(" - ", 2);
    if (tail && /\b(reach|complete|level|install|purchase)\b/i.test(tail)) return head.trim();
    return trimmed;
}

function inferCategory(title: string): string {
    return /\b(game|level|board|village|puzzle|casino)\b/i.test(title) ? "mobile_game" : "other";
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function firstString(...values: unknown[]): string {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) return value.trim();
        if (typeof value === "number" && Number.isFinite(value)) return String(value);
    }
    return "";
}

function round(value: number): number {
    return Math.round(value * 100) / 100;
}

function isRecord(value: unknown): value is Record<string, any> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
