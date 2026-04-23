import axios from "axios";
import { SourceAdapter } from "../models/source";
import { SourceOffer } from "../types/offer";
import { withRetry } from "../core/db";
import { logger } from "../core/logger";

const DEFAULT_MYCHIPS_API_URL = "https://api.mychips.io/v1.6/campaigns";
const DEFAULT_GAIN_SITE_URL = "https://gain.gg/earn";
const DEFAULT_LIMIT = 10;
const DEFAULT_LANGUAGE = "en";

const MOCK_OFFERS: SourceOffer[] = [
    {
        external_id: "mychips-monopoly-go",
        title: "Monopoly GO",
        payout_raw: "24.00",
        currency: "USD",
        device_raw: "Android & iOS",
        category_raw: "mobile_game",
        url: DEFAULT_GAIN_SITE_URL,
        expires_raw: null,
        game_slug: "monopoly-go",
        countries_raw: ["US"],
        game_title: "Monopoly GO",
        provider_name: "MyChips",
        image_url: null,
        total_payout_raw: "42.00",
        best_payout_usd: 24,
        task_list: [
            {
                title: "Install and open the app",
                reward_amount_usd: 2,
                reward_display: "$2.00",
                task_type: "install",
                time_limit_text: null,
                notes: null,
                sort_order: 1,
            },
            {
                title: "Reach Board 25",
                reward_amount_usd: 24,
                reward_display: "$24.00",
                task_type: "milestone",
                time_limit_text: null,
                notes: null,
                sort_order: 2,
            },
            {
                title: "Reach Board 42",
                reward_amount_usd: 16,
                reward_display: "$16.00",
                task_type: "milestone",
                time_limit_text: null,
                notes: null,
                sort_order: 3,
            },
        ],
    },
];

export const gainMyChipsSource: SourceAdapter = {
    key: "gain-mychips",
    name: "Gain.gg MyChips",
    type: "api",
    baseUrl: DEFAULT_MYCHIPS_API_URL,
    storage: "site_offers",
    mockEnvVar: "GAIN_USE_MOCK",
    fetchOffers,
};

export async function fetchOffers(): Promise<SourceOffer[]> {
    const useMock = (process.env.GAIN_USE_MOCK ?? "false").toLowerCase() === "true";
    if (useMock) {
        logger.info("Gain MyChips source using mock offers", { count: MOCK_OFFERS.length });
        return [...MOCK_OFFERS];
    }

    const contentId = requiredEnv("GAIN_MYCHIPS_CONTENT_ID");
    const userId = requiredEnv("GAIN_MYCHIPS_USER_ID");
    const clickId = requiredEnv("GAIN_MYCHIPS_CLICK_ID");
    const apiUrl = process.env.GAIN_MYCHIPS_API_URL ?? DEFAULT_MYCHIPS_API_URL;
    const language = process.env.GAIN_MYCHIPS_LANGUAGE ?? DEFAULT_LANGUAGE;
    const limit = parsePositiveInt(process.env.GAIN_MYCHIPS_LIMIT, DEFAULT_LIMIT);

    const offers: SourceOffer[] = [];
    const seen = new Set<string>();
    let loggedCampaignDebugCount = 0;
    let loggedEventDebugCount = 0;

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
                    },
                    responseType: "json",
                }),
            "gain-mychips-fetch",
        );

        const payload = response.data;
        const campaigns = extractCampaignNodes(payload);
        const sample = campaigns[0];

        logger.info("Gain MyChips page fetched", {
            requestUrl: response.request?.res?.responseUrl ?? apiUrl,
            status: response.status,
            topLevelKeys: isRecord(payload) ? Object.keys(payload) : [],
            sampleResponseKeys: isRecord(sample) ? Object.keys(sample) : null,
            offset,
            limit,
            pageCount: campaigns.length,
        });

        if (isRecord(sample)) {
            logger.info("Gain MyChips sample campaign", {
                id: firstString(sample.id),
                title: firstString(sample.title, sample.subtitle),
                chips: toNumber(sample.chips),
                eventsLength: countEvents(sample),
            });
        }

        for (const campaign of campaigns) {
            if (!isRecord(campaign)) continue;
            if (loggedCampaignDebugCount < 3) {
                logger.info("Gain MyChips campaign payout debug", {
                    id: firstString(campaign.id),
                    title: firstString(campaign.title, campaign.subtitle),
                    bid: safeJsonValue(campaign.bid),
                    chips: safeJsonValue(campaign.chips),
                    remainingChips: safeJsonValue(campaign.remainingChips),
                    totalChipsEarned: safeJsonValue(campaign.totalChipsEarned),
                    convertedBid: safeJsonValue(campaign.convertedBid),
                    totalConvertedValue: safeJsonValue(campaign.totalConvertedValue),
                    remainingConvertedValue: safeJsonValue(campaign.remainingConvertedValue),
                    currencyExchangeRatio: safeJsonValue(campaign.currencyExchangeRatio),
                    totalConvertedPromoValue: safeJsonValue(campaign.totalConvertedPromoValue),
                });
                loggedCampaignDebugCount += 1;
            }

            const eventGroups = [campaign.events, campaign.bonusEvents, campaign.recurringEvents];
            for (const group of eventGroups) {
                if (!Array.isArray(group)) continue;
                for (const event of group) {
                    if (!isRecord(event)) continue;
                    if (loggedEventDebugCount >= 5) break;
                    logger.info("Gain MyChips event payout debug", {
                        campaignId: firstString(campaign.id),
                        eventKeys: Object.keys(event),
                        payoutCandidates: {
                            bid: safeJsonValue(event.bid),
                            convertedBid: safeJsonValue(event.convertedBid),
                            totalConvertedBid: safeJsonValue(event.totalConvertedBid),
                            convertedBidPromo: safeJsonValue(event.convertedBidPromo),
                            totalConvertedBidPromo: safeJsonValue(event.totalConvertedBidPromo),
                            totalConvertedValue: safeJsonValue(event.totalConvertedValue),
                            remainingConvertedValue: safeJsonValue(event.remainingConvertedValue),
                            totalConvertedPromoValue: safeJsonValue(event.totalConvertedPromoValue),
                            convertedValue: safeJsonValue(event.convertedValue),
                            value: safeJsonValue(event.value),
                            reward: safeJsonValue(event.reward),
                            amount: safeJsonValue(event.amount),
                            chips: safeJsonValue(event.chips),
                            remainingChips: safeJsonValue(event.remainingChips),
                            totalChipsEarned: safeJsonValue(event.totalChipsEarned),
                            currencyExchangeRatio: safeJsonValue(event.currencyExchangeRatio),
                        },
                    });
                    loggedEventDebugCount += 1;
                }
                if (loggedEventDebugCount >= 5) break;
            }
            if (loggedCampaignDebugCount >= 3 && loggedEventDebugCount >= 5) break;
        }

        if (campaigns.length === 0) {
            break;
        }

        let freshCount = 0;

        for (const campaign of campaigns) {
            const parsed = parseCampaign(campaign);
            if (!parsed || seen.has(parsed.external_id)) continue;
            seen.add(parsed.external_id);
            offers.push(parsed);
            freshCount += 1;
        }

        logger.info("Gain MyChips page parsed", {
            offset,
            limit,
            pageCount: campaigns.length,
            freshCount,
            totalParsed: offers.length,
        });

        if (campaigns.length < limit) {
            break;
        }
    }

    return offers;
}

function parseCampaign(node: unknown): SourceOffer | null {
    if (!isRecord(node)) return null;

    const campaignId = firstString(node.id);
    const rawTitle = firstString(node.title, node.subtitle);
    if (!campaignId || !rawTitle) {
        return null;
    }

    const taskList = extractTaskList(node);
    const fallbackPayoutInfo = extractCampaignFallbackPayout(node);
    const fallbackPayout = fallbackPayoutInfo.usd;
    const totalPayout = taskList.length > 0
        ? taskList.reduce((sum, task) => sum + task.reward_amount_usd, 0)
        : fallbackPayout;
    const bestPayout = taskList.length > 0
        ? Math.max(...taskList.map((task) => task.reward_amount_usd))
        : fallbackPayout;

    const cleanTitle = extractParentTitle(rawTitle);
    const imageUrl = firstString(
        node.thumbnail,
        node.cover,
        node.image,
        node.image_url,
        node.imageUrl,
        node.icon,
    ) || null;

    logger.info("Gain MyChips campaign payout resolved", {
        campaignId,
        rawGemValue: fallbackPayoutInfo.rawValue,
        convertedUsd: fallbackPayoutInfo.usd,
        sourceFieldUsed: fallbackPayoutInfo.sourceField,
        bestPayoutUsd: bestPayout,
        totalPayoutUsd: totalPayout,
    });

    return {
        external_id: `mychips-${campaignId}`,
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
    const groups = [
        payload.events,
        payload.bonusEvents,
        payload.recurringEvents,
        payload.tasks,
        payload.goals,
    ];

    const tasks: NonNullable<SourceOffer["task_list"]> = [];

    for (const group of groups) {
        if (!Array.isArray(group)) continue;
        const baseIndex = tasks.length;
        const parsedGroup = group
            .map((task, index) => parseTask(task, baseIndex + index))
            .filter((task): task is NonNullable<typeof task> => Boolean(task));

        if (parsedGroup.length > 0) {
            tasks.push(...parsedGroup);
        }
    }

    return tasks;
}

function parseTask(task: unknown, index: number) {
    if (!isRecord(task)) return null;

    const title = resolveTaskTitle(task);
    const payoutInfo = extractEventPayout(task);
    const payout = payoutInfo.usd;
    if (!title) return null;
    if (!Number.isFinite(payout) || payout <= 0) {
        logger.info("Gain MyChips task payout missing", {
            title,
            sortOrder: index + 1,
            payoutCandidates: {
                bid: safeJsonValue(task.bid),
                convertedBid: safeJsonValue(task.convertedBid),
                totalConvertedBid: safeJsonValue(task.totalConvertedBid),
                convertedBidPromo: safeJsonValue(task.convertedBidPromo),
                totalConvertedBidPromo: safeJsonValue(task.totalConvertedBidPromo),
                totalConvertedValue: safeJsonValue(task.totalConvertedValue),
                remainingConvertedValue: safeJsonValue(task.remainingConvertedValue),
                totalConvertedPromoValue: safeJsonValue(task.totalConvertedPromoValue),
                convertedValue: safeJsonValue(task.convertedValue),
                value: safeJsonValue(task.value),
                reward: safeJsonValue(task.reward),
                amount: safeJsonValue(task.amount),
                chips: safeJsonValue(task.chips),
                remainingChips: safeJsonValue(task.remainingChips),
                totalChipsEarned: safeJsonValue(task.totalChipsEarned),
                currencyExchangeRatio: safeJsonValue(task.currencyExchangeRatio),
            },
        });
    } else {
        logger.info("Gain MyChips task payout resolved", {
            title,
            sortOrder: index + 1,
            rawGemValue: payoutInfo.rawValue,
            convertedUsd: payoutInfo.usd,
            sourceFieldUsed: payoutInfo.sourceField,
        });
    }

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
    const preferred = firstString(
        task.userFlow,
        task.userFlowDetails,
        task.title,
        task.eventName,
        task.subtitle,
        task.description,
        task.requirement,
    );
    if (preferred) return sanitizeTaskTitle(preferred);

    const fallback = firstString(task.name);
    if (!fallback) return null;
    return sanitizeTaskTitle(humanizeTaskKey(fallback));
}

function sanitizeTaskTitle(value: string): string {
    return value
        .replace(/\s+/g, " ")
        .replace(/\s+([!?,.:;])/g, "$1")
        .trim();
}

function humanizeTaskKey(value: string): string {
    const normalized = value
        .replace(/[_-]+/g, " ")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim();

    if (!normalized) return value;

    return normalized
        .split(" ")
        .map((part) => {
            const lower = part.toLowerCase();
            if (/^\d+$/.test(lower)) return lower;
            if (lower.length <= 3 && /^(iap|sng|id|ios|api)$/i.test(part)) return part.toUpperCase();
            return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(" ");
}

function extractCampaignNodes(payload: unknown): unknown[] {
    if (Array.isArray(payload)) {
        return payload.filter(looksLikeCampaign);
    }
    if (!isRecord(payload)) return [];

    const directArrays = [
        payload.campaigns,
        payload.data,
        payload.results,
        payload.items,
        payload.offers,
    ];

    for (const candidate of directArrays) {
        if (Array.isArray(candidate)) {
            return candidate.filter(looksLikeCampaign);
        }
    }

    for (const value of Object.values(payload)) {
        if (Array.isArray(value)) return value.filter(looksLikeCampaign);
        if (isRecord(value)) {
            const nested = extractCampaignNodes(value);
            if (nested.length > 0) return nested;
        }
    }

    return [];
}

interface MyChipsPayoutInfo {
    usd: number;
    rawValue: number | null;
    sourceField: string | null;
}

function extractEventPayout(payload: Record<string, any>): MyChipsPayoutInfo {
    const usdFields: Array<[string, unknown]> = [
        ["bid", payload.bid],
        ["totalBid", payload.totalBid],
        ["value.bid", extractNestedField(payload.value, "bid")],
        ["reward.bid", extractNestedField(payload.reward, "bid")],
        ["amount.bid", extractNestedField(payload.amount, "bid")],
    ];

    for (const [field, value] of usdFields) {
        const numeric = parseMyChipsNumber(value);
        if (numeric !== null && numeric > 0) {
            const info = {
                usd: round(numeric),
                rawValue: numeric,
                sourceField: field,
            };
            logger.info("MyChips payout final", {
                rawValue: info.rawValue,
                sourceField: info.sourceField,
                treatedAs: "usd",
                finalUsd: info.usd,
            });
            return info;
        }
    }

    const gemFields: Array<[string, unknown]> = [
        ["chips", payload.chips],
        ["remainingChips", payload.remainingChips],
        ["totalChipsEarned", payload.totalChipsEarned],
        ["convertedBid", payload.convertedBid],
        ["totalConvertedBid", payload.totalConvertedBid],
        ["convertedBidPromo", payload.convertedBidPromo],
        ["totalConvertedBidPromo", payload.totalConvertedBidPromo],
        ["value.chips", extractNestedField(payload.value, "chips")],
        ["reward.chips", extractNestedField(payload.reward, "chips")],
        ["amount.chips", extractNestedField(payload.amount, "chips")],
    ];

    for (const [field, value] of gemFields) {
        const numeric = parseMyChipsNumber(value);
        if (numeric !== null && numeric > 0) {
            const info = {
                usd: round(numeric / 1000),
                rawValue: numeric,
                sourceField: field,
            };
            logger.info("MyChips payout final", {
                rawValue: info.rawValue,
                sourceField: info.sourceField,
                treatedAs: "gems",
                finalUsd: info.usd,
            });
            return info;
        }
    }

    return {
        usd: 0,
        rawValue: null,
        sourceField: null,
    };
}

function extractCampaignFallbackPayout(payload: Record<string, any>): MyChipsPayoutInfo {
    const usdFields: Array<[string, unknown]> = [
        ["bid", payload.bid],
        ["totalConvertedValue", payload.totalConvertedValue],
        ["remainingConvertedValue", payload.remainingConvertedValue],
        ["totalConvertedPromoValue", payload.totalConvertedPromoValue],
    ];

    for (const [field, value] of usdFields) {
        const numeric = parseMyChipsNumber(value);
        if (numeric !== null && numeric > 0) {
            const treatedAs = field === "bid" ? "usd" : "gems";
            const info = {
                usd: round(field === "bid" ? numeric : numeric / 1000),
                rawValue: numeric,
                sourceField: field,
            };
            logger.info("MyChips payout final", {
                rawValue: info.rawValue,
                sourceField: info.sourceField,
                treatedAs,
                finalUsd: info.usd,
            });
            return info;
        }
    }

    const gemFields: Array<[string, unknown]> = [
        ["chips", payload.chips],
        ["remainingChips", payload.remainingChips],
        ["totalChipsEarned", payload.totalChipsEarned],
    ];

    for (const [field, value] of gemFields) {
        const numeric = parseMyChipsNumber(value);
        if (numeric !== null && numeric > 0) {
            const info = {
                usd: round(numeric / 1000),
                rawValue: numeric,
                sourceField: field,
            };
            logger.info("MyChips payout final", {
                rawValue: info.rawValue,
                sourceField: info.sourceField,
                treatedAs: "gems",
                finalUsd: info.usd,
            });
            return info;
        }
    }

    return {
        usd: 0,
        rawValue: null,
        sourceField: null,
    };
}

function extractNestedField(value: unknown, key: string): unknown {
    if (!isRecord(value)) return null;
    return value[key] ?? null;
}

function parseMyChipsNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "string") return toNumber(value);

    const trimmed = value.trim();
    if (!trimmed) return null;

    const suffixMatch = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)\s*([kmb])$/i);
    if (suffixMatch) {
        const base = Number.parseFloat(suffixMatch[1]);
        if (!Number.isFinite(base)) return null;
        const suffix = suffixMatch[2].toLowerCase();
        const multiplier = suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : 1_000_000_000;
        return base * multiplier;
    }

    return toNumber(trimmed);
}

function normalizeDevices(payload: Record<string, any>): string {
    const raw = firstString(payload.device, payload.devices, payload.platform, payload.platforms, payload.os);
    if (!raw) return "web";
    return raw.replace(/,/g, " & ");
}

function normalizeCountries(payload: Record<string, any>): string[] | null {
    const candidates = [payload.countries, payload.country_codes, payload.countryCodes, payload.geo];

    for (const candidate of candidates) {
        if (!Array.isArray(candidate)) continue;
        const countries = candidate
            .map((value) => firstString(value).toUpperCase())
            .filter((value) => /^[A-Z]{2}$/.test(value));
        if (countries.length > 0) {
            return Array.from(new Set(countries));
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

function extractParentTitle(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;

    const separators = [" - ", ": ", " | "];
    for (const separator of separators) {
        const [head, tail] = trimmed.split(separator, 2);
        if (tail && /\b(reach|complete|install|unlock|finish|level|stage|goal)\b/i.test(tail)) {
            return head.trim();
        }
    }

    return trimmed;
}

function inferCategory(title: string): string {
    return /\b(game|level|board|village|puzzle|casino)\b/i.test(title) ? "mobile_game" : "other";
}

function inferTaskType(title: string): "install" | "milestone" | "purchase" | "signup" | "other" {
    if (/\binstall\b/i.test(title)) return "install";
    if (/\b(sign ?up|register)\b/i.test(title)) return "signup";
    if (/\b(spend|purchase|buy|deposit)\b/i.test(title)) return "purchase";
    if (/\b(reach|complete|finish|unlock|level|goal|stage|board|village)\b/i.test(title)) return "milestone";
    return "other";
}

function extractSortOrder(payload: Record<string, any>, index: number): number {
    const parsed = toNumber(payload.sort_order) ?? toNumber(payload.order) ?? toNumber(payload.position);
    return parsed !== null && parsed > 0 ? Math.trunc(parsed) : index + 1;
}

function normalizeUrl(url: string): string {
    return /^https?:\/\//i.test(url) ? url : DEFAULT_GAIN_SITE_URL;
}

function requiredEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`Missing required env var ${name}`);
    return value;
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

function looksLikeCampaign(node: unknown): boolean {
    if (!isRecord(node)) return false;
    const id = firstString(node.id);
    const name = firstString(node.title, node.subtitle);
    return Boolean(id && name);
}

function countEvents(payload: Record<string, any>): number {
    const groups = [payload.events, payload.bonusEvents, payload.recurringEvents];
    return groups.reduce((sum, group) => sum + (Array.isArray(group) ? group.length : 0), 0);
}

function safeJsonValue(value: unknown): unknown {
    if (isRecord(value)) {
        return Object.fromEntries(
            Object.entries(value).slice(0, 8).map(([key, child]) => [key, safeJsonValue(child)]),
        );
    }
    if (Array.isArray(value)) {
        return value.slice(0, 5).map((child) => safeJsonValue(child));
    }
    return value ?? null;
}

function isRecord(value: unknown): value is Record<string, any> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
