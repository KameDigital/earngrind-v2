import axios from "axios";
import { SourceAdapter } from "../models/source";
import { SourceOffer } from "../types/offer";
import { withRetry } from "../core/db";
import { logger } from "../core/logger";

const DEFAULT_AYET_API_URL = "https://www.ayetstudios.com/rest/v1/offers";
const DEFAULT_AYET_ADSLOT_URL = "https://www.ayetstudios.com/rest/v1/crud/adslots";

const MOCK_OFFERS: SourceOffer[] = [
    {
        external_id: "cashinstyle-ayet-freecash",
        title: "Freecash",
        payout_raw: "9.31",
        total_payout_raw: "9.31",
        best_payout_usd: 9.31,
        currency: "USD",
        device_raw: "desktop,android,ios",
        category_raw: "incent",
        url: "https://cashinstyle.com/walls/ayet",
        expires_raw: null,
        game_slug: null,
        game_title: "Freecash",
        provider_name: "Ayet Studios",
        image_url: null,
        countries_raw: ["US"],
        task_list: [],
    },
];

export const cashInStyleAyetSource: SourceAdapter = {
    key: "cashinstyle-ayet",
    name: "CashInStyle Ayet",
    type: "api",
    baseUrl: DEFAULT_AYET_API_URL,
    storage: "site_offers",
    mockEnvVar: "CASHINSTYLE_USE_MOCK",
    fetchOffers,
};

export async function fetchOffers(): Promise<SourceOffer[]> {
    const useMock = (process.env.CASHINSTYLE_USE_MOCK ?? "false").toLowerCase() === "true";
    if (useMock) {
        logger.info("CashInStyle Ayet source using mock offers", { count: MOCK_OFFERS.length });
        return [...MOCK_OFFERS];
    }

    const adslotId = process.env.CASHINSTYLE_AYET_ADSLOT_ID?.trim();
    const externalIdentifier = process.env.CASHINSTYLE_AYET_EXTERNAL_IDENTIFIER?.trim();
    const encDeviceUuid = process.env.CASHINSTYLE_AYET_ENC_DEVICE_UUID?.trim();
    if (!adslotId || !externalIdentifier || !encDeviceUuid) {
        throw new Error("CashInStyle Ayet requires CASHINSTYLE_AYET_ADSLOT_ID, CASHINSTYLE_AYET_EXTERNAL_IDENTIFIER, and CASHINSTYLE_AYET_ENC_DEVICE_UUID.");
    }

    let placementId = process.env.CASHINSTYLE_AYET_PLACEMENT_ID?.trim();
    if (!placementId) {
        const adslotResponse = await withRetry(
            () =>
                axios.get(`${process.env.CASHINSTYLE_AYET_ADSLOT_URL ?? DEFAULT_AYET_ADSLOT_URL}/${encodeURIComponent(adslotId)}`, {
                    timeout: 20000,
                    headers: buildHeaders(),
                    responseType: "json",
                }),
            "cashinstyle-ayet-adslot",
        );
        placementId = firstString((adslotResponse.data as Record<string, unknown>)?.publisher_placement_id);
        logger.info("CashInStyle Ayet adslot resolved", {
            requestUrl: adslotResponse.request?.res?.responseUrl ?? `${DEFAULT_AYET_ADSLOT_URL}/${adslotId}`,
            status: adslotResponse.status,
            placementId,
        });
    }

    if (!placementId) {
        throw new Error("CashInStyle Ayet could not resolve placementId.");
    }

    const apiUrl = `${process.env.CASHINSTYLE_AYET_API_URL ?? DEFAULT_AYET_API_URL}/${encodeURIComponent(adslotId)}`;
    const response = await withRetry(
        () =>
            axios.get(apiUrl, {
                timeout: 30000,
                headers: buildHeaders(),
                params: {
                    include_mobile_offers: "true",
                    placementId,
                    externalIdentifier,
                    encDeviceUuid,
                },
                responseType: "json",
            }),
        "cashinstyle-ayet-fetch",
    );

    const nodes = Array.isArray(response.data) ? response.data : [];
    const offers = nodes.map(parseOffer).filter((offer): offer is SourceOffer => Boolean(offer));

    logger.info("CashInStyle Ayet fetched", {
        requestUrl: response.request?.res?.responseUrl ?? apiUrl,
        status: response.status,
        parsedCount: offers.length,
        sampleResponseKeys: nodes[0] && typeof nodes[0] === "object" ? Object.keys(nodes[0]) : null,
    });

    return offers;
}

function parseOffer(node: unknown): SourceOffer | null {
    if (!isRecord(node)) return null;

    const id = firstString(node.id);
    const title = firstString(node.name, node.title);
    if (!id || !title) return null;

    const taskList = extractTaskList(node);
    const totalPayout = taskList.length > 0 ? round(taskList.reduce((sum, task) => sum + task.reward_amount_usd, 0)) : toUsd(node.payout ?? node.payout_base ?? node.currency_amount);
    const bestPayout = taskList.length > 0 ? Math.max(...taskList.map((task) => task.reward_amount_usd)) : toUsd(node.payout ?? node.payout_base ?? node.currency_amount);
    if (!Number.isFinite(bestPayout) || bestPayout <= 0) return null;

    return {
        external_id: `cashinstyle-ayet-${id}`,
        title,
        payout_raw: bestPayout.toFixed(2),
        total_payout_raw: totalPayout.toFixed(2),
        best_payout_usd: bestPayout,
        currency: "USD",
        device_raw: normalizeDeviceRaw(node),
        category_raw: firstString(node.category, node.conversion_type) || firstString(node.tags?.categories?.[0]) || "other",
        url: normalizeUrl(firstString(node.tracking_link, node.landing_page, node.support_url)),
        expires_raw: firstString(node.end_date, node.max_conversion_time) || null,
        game_slug: null,
        game_title: title,
        provider_name: "Ayet Studios",
        image_url: firstString(node.icon_large, node.icon) || null,
        countries_raw: normalizeCountries(node),
        task_list: taskList,
    };
}

function extractTaskList(payload: Record<string, any>): NonNullable<SourceOffer["task_list"]> {
    const instructions = Array.isArray(payload.cpe_instructions) ? payload.cpe_instructions : [];
    return instructions.map((task, index) => parseTask(task, payload, index)).filter((task): task is NonNullable<typeof task> => Boolean(task));
}

function parseTask(task: unknown, payload: Record<string, any>, index: number) {
    if (!isRecord(task)) return null;
    const title = firstString(task.name, task.event_name);
    if (!title) return null;
    const reward = toUsd(task.payout ?? task.payout_base);
    if (!Number.isFinite(reward) || reward < 0) return null;
    return {
        title,
        reward_amount_usd: reward,
        reward_display: `$${reward.toFixed(2)}`,
        task_type: inferTaskType(firstString(task.event_name, task.name)),
        time_limit_text: firstString(task.max_conversion_time) || firstString(payload.max_conversion_time) || null,
        notes: firstString(payload.conversion_instructions_short, payload.conversion_instructions, payload.rules_requirements) || null,
        sort_order: index + 1,
    } as const;
}

function buildHeaders(): Record<string, string> {
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://offerwall.ayet.io",
        "Referer": "https://offerwall.ayet.io/",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    };
}

function normalizeDeviceRaw(payload: Record<string, any>): string {
    const values = [payload.platform, payload.platforms, payload.devices].flatMap((value) => Array.isArray(value) ? value : [value]).map((value) => firstString(value).toLowerCase()).filter(Boolean);
    if (values.length === 0) return "web";
    return Array.from(new Set(values)).join(",");
}

function normalizeCountries(payload: Record<string, any>): string[] | null {
    const candidates = [payload.countries, payload.country_codes, payload.countryCodes, payload.allowed_countries, payload.geo_targeting];
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

function inferTaskType(value: string): "install" | "milestone" | "purchase" | "signup" | "other" {
    const normalized = value.toLowerCase();
    if (/install/.test(normalized)) return "install";
    if (/purchase|deposit|subscription/.test(normalized)) return "purchase";
    if (/signup|register|account/.test(normalized)) return "signup";
    if (/complete|play|reach|level|start/.test(normalized)) return "milestone";
    return "other";
}

function normalizeUrl(url: string): string {
    return /^https?:\/\//i.test(url) ? url : "https://cashinstyle.com/walls/ayet";
}

function toUsd(value: unknown): number {
    const numeric = toNumber(value);
    if (numeric === null || numeric < 0) return 0;
    return round(numeric / 1000);
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
