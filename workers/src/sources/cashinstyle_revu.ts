import axios from "axios";
import * as cheerio from "cheerio";
import { SourceAdapter } from "../models/source";
import { SourceOffer } from "../types/offer";
import { withRetry } from "../core/db";
import { logger } from "../core/logger";

const DEFAULT_REVU_API_URL = "https://api-wall.revenueuniverse.com/offers.php";
const DEFAULT_REVU_PROFILE_URL = "https://api-wall.revenueuniverse.com/profile.php";
const DEFAULT_REVU_TYPE = "desktop";
const DEFAULT_REVU_OS = "web";
const DEFAULT_CASHINSTYLE_REVU_WALL_ID = "981";

const MOCK_OFFERS: SourceOffer[] = [
    {
        external_id: "cashinstyle-revu-raid-shadow-legends",
        title: "Raid: Shadow Legends",
        payout_raw: "85.00",
        currency: "USD",
        device_raw: "desktop",
        category_raw: "mobile_game",
        url: "https://cashinstyle.com/walls/revu",
        expires_raw: null,
        game_slug: "raid-shadow-legends",
        countries_raw: ["US"],
        game_title: "Raid: Shadow Legends",
        provider_name: "Revenue Universe",
        image_url: null,
        total_payout_raw: "85.00",
        best_payout_usd: 85,
        task_list: [],
    },
];

export const cashInStyleRevuSource: SourceAdapter = {
    key: "cashinstyle-revu",
    name: "CashInStyle RevU",
    type: "api",
    baseUrl: DEFAULT_REVU_API_URL,
    storage: "site_offers",
    mockEnvVar: "CASHINSTYLE_USE_MOCK",
    fetchOffers,
};

export async function fetchOffers(): Promise<SourceOffer[]> {
    const useMock = (process.env.CASHINSTYLE_USE_MOCK ?? "false").toLowerCase() === "true";
    if (useMock) {
        logger.info("CashInStyle RevU source using mock offers", { count: MOCK_OFFERS.length });
        return [...MOCK_OFFERS];
    }

    const apiKey = process.env.CASHINSTYLE_REVU_API_KEY?.trim() || DEFAULT_CASHINSTYLE_REVU_WALL_ID;
    const uid = process.env.CASHINSTYLE_REVU_UID?.trim();
    if (!uid) {
        throw new Error("CashInStyle RevU requires CASHINSTYLE_REVU_UID.");
    }

    const profileUrl = process.env.CASHINSTYLE_REVU_PROFILE_URL ?? DEFAULT_REVU_PROFILE_URL;
    const type = process.env.CASHINSTYLE_REVU_TYPE ?? DEFAULT_REVU_TYPE;
    const os = process.env.CASHINSTYLE_REVU_OS ?? DEFAULT_REVU_OS;

    const profileResponse = await withRetry(
        () =>
            axios.get(profileUrl, {
                timeout: 20000,
                headers: buildHeaders(),
                params: {
                    api_key: apiKey,
                    uid,
                    type,
                    os,
                    version: process.env.CASHINSTYLE_REVU_VERSION ?? "",
                },
                responseType: "json",
            }),
        "cashinstyle-revu-profile",
    );

    const offersUrl = firstString(
        (profileResponse.data as Record<string, unknown>)?.offers_url,
        (profileResponse.data as Record<string, unknown>)?.offersUrl,
    );
    if (!offersUrl) {
        throw new Error("CashInStyle RevU profile did not return offers_url.");
    }

    logger.info("CashInStyle RevU profile resolved", {
        requestUrl: profileResponse.request?.res?.responseUrl ?? profileUrl,
        status: profileResponse.status,
        offersUrl,
    });

    const response = await withRetry(
        () =>
            axios.get(process.env.CASHINSTYLE_REVU_API_URL ?? offersUrl ?? DEFAULT_REVU_API_URL, {
                timeout: 20000,
                headers: buildHeaders(),
                responseType: "text",
            }),
        "cashinstyle-revu-fetch",
    );

    const payload = parseResponseBody(response.data);
    const nodes = extractOfferNodes(payload);
    const offers = nodes.map(parseOffer).filter((offer): offer is SourceOffer => Boolean(offer));
    const sample = nodes[0];

    logger.info("CashInStyle RevU fetched", {
        requestUrl: response.request?.res?.responseUrl ?? offersUrl,
        status: response.status,
        topLevelKeys: isRecord(payload) ? Object.keys(payload) : [],
        sampleResponseKeys: isRecord(sample) ? Object.keys(sample) : null,
        parsedCount: offers.length,
    });

    return offers;
}

function parseOffer(node: unknown): SourceOffer | null {
    if (!isRecord(node)) return null;

    const rawExternalId = firstString(node.cid, node.id, node.offerid, node.offer_id, node.campaign_id);
    const rawTitle = firstString(node.title, node.name, node.offer_name);
    const bestPayout = extractPayout(node);
    const totalPayout = extractTotalPayout(node);
    if (!rawExternalId || !rawTitle || bestPayout <= 0) {
        return null;
    }

    const cleanTitle = extractParentTitle(rawTitle);

    return {
        external_id: `cashinstyle-revu-${rawExternalId}`,
        title: cleanTitle,
        payout_raw: bestPayout.toFixed(2),
        currency: "USD",
        device_raw: firstString(node.device, node.os, node.platform, node.platforms, node.type) || "desktop",
        category_raw: firstString(node.category, node.vertical, node.offer_type) || inferCategory(rawTitle),
        url: normalizeUrl(firstString(node.url, node.click_url, node.offer_url, node.link)),
        expires_raw: firstString(node.expires_at, node.expiry, node.expiration_date) || null,
        game_slug: null,
        countries_raw: normalizeCountries(node),
        game_title: cleanTitle,
        provider_name: "Revenue Universe",
        image_url: firstString(node.image, node.icon, node.thumbnail, node.creative) || null,
        total_payout_raw: totalPayout.toFixed(2),
        best_payout_usd: bestPayout,
        task_list: [],
    };
}

function parseResponseBody(body: unknown): unknown {
    if (typeof body !== "string") {
        return body;
    }

    const trimmed = body.trim();
    if (!trimmed) return [];

    try {
        return JSON.parse(trimmed);
    } catch {
        return parseXmlOffers(trimmed);
    }
}

function parseXmlOffers(xml: string): unknown {
    const $ = cheerio.load(xml, { xmlMode: true });
    return $("offer").map((_, offer) => {
        const $offer = $(offer);
        return {
            id: textAt($offer, "id"),
            title: textAt($offer, "name") || textAt($offer, "title"),
            payout: textAt($offer, "payout") || textAt($offer, "amount"),
            image: textAt($offer, "image") || textAt($offer, "icon"),
            url: textAt($offer, "url") || textAt($offer, "link"),
            category: textAt($offer, "category"),
            device: textAt($offer, "os") || textAt($offer, "device"),
            countries: textAt($offer, "countries"),
        };
    }).get();
}

function extractOfferNodes(payload: unknown): unknown[] {
    if (Array.isArray(payload)) return payload;
    if (!isRecord(payload)) return [];

    const candidates = [payload.offers, payload.data, payload.response, payload.results];
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate;
    }

    for (const value of Object.values(payload)) {
        if (Array.isArray(value)) return value;
    }

    return [];
}

function extractPayout(payload: Record<string, any>): number {
    const candidates = [payload.payout, payload.amount, payload.reward, payload.usd, currencyToUsd(payload.currency)];
    for (const candidate of candidates) {
        const parsed = toNumber(candidate);
        if (parsed !== null && parsed > 0) return round(parsed);
    }
    return 0;
}

function extractTotalPayout(payload: Record<string, any>): number {
    const candidates = [
        payload.total_payout,
        payload.total_amount,
        payload.total_reward,
        payload.currency_with_tiers ? currencyToUsd(payload.currency_with_tiers) : null,
        payload.currency ? currencyToUsd(payload.currency) : null,
    ];

    for (const candidate of candidates) {
        const parsed = toNumber(candidate);
        if (parsed !== null && parsed > 0) return round(parsed);
    }

    return extractPayout(payload);
}

function currencyToUsd(value: unknown): number | null {
    const numeric = toNumber(value);
    if (numeric === null || numeric <= 0) return null;
    return round(numeric / 1000);
}

function normalizeCountries(payload: Record<string, any>): string[] | null {
    const candidates = [payload.countries, payload.country_codes, payload.countryCodes];
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            const countries = candidate.map((value) => firstString(value).toUpperCase()).filter((value) => /^[A-Z]{2}$/.test(value));
            if (countries.length > 0) return Array.from(new Set(countries));
        }
        if (typeof candidate === "string" && candidate.trim()) {
            const countries = candidate
                .split(/[\s,|]+/)
                .map((value) => value.trim().toUpperCase())
                .filter((value) => /^[A-Z]{2}$/.test(value));
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
        "Origin": "https://wall.revenueuniverse.com",
        "Referer": "https://wall.revenueuniverse.com/",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    };
}

function textAt(root: cheerio.Cheerio<any>, tagName: string): string {
    return root.find(tagName).first().text().trim();
}

function normalizeUrl(url: string): string {
    return /^https?:\/\//i.test(url) ? url : "https://cashinstyle.com/walls/revu";
}

function extractParentTitle(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    const [head, tail] = trimmed.split(" - ", 2);
    if (tail && /\b(reach|complete|level|install|purchase)\b/i.test(tail)) {
        return head.trim();
    }
    return trimmed;
}

function inferCategory(title: string): string {
    return /\b(game|level|board|village|puzzle|casino)\b/i.test(title) ? "mobile_game" : "other";
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
