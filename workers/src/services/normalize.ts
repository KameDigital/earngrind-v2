import { GAME_TITLE_MAP } from "../constants";
import { NormalizedOffer, RawOffer } from "../types";

const FALLBACK_COUNTRY = "US";

export function normalizeGainOffer(
    raw: RawOffer,
    platformId: string,
    gameId: string | null,
): NormalizedOffer {
    if (!raw.external_id?.trim()) throw new Error("Missing external_id");
    if (!raw.title?.trim()) throw new Error("Missing title");
    if (!raw.url?.trim()) throw new Error("Missing url");

    const payoutUsd = toUsd(raw.payout_raw, raw.currency);
    if (!Number.isFinite(payoutUsd) || payoutUsd <= 0) {
        throw new Error(`Invalid payout: ${raw.payout_raw}`);
    }

    return {
        platform_id: platformId,
        game_id: gameId,
        external_id: raw.external_id.trim(),
        title: raw.title.trim(),
        payout_usd: payoutUsd,
        payout_type: mapPayoutType(raw.currency, raw.category_raw),
        devices: parseDevices(raw.device_raw),
        countries: normalizeCountries(raw.countries_raw),
        category: mapCategory(raw.category_raw),
        custom_param: raw.url.trim(),
        offer_expires_at: raw.expires_raw ?? null,
    };
}

export function inferGameSlug(title: string): string | null {
    for (const [pattern, slug] of GAME_TITLE_MAP) {
        if (pattern.test(title)) return slug;
    }
    return null;
}

export function titleToAliases(title: string): string[] {
    const base = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!base) return [];
    const dashed = base.replace(/\s+/g, "-");
    const compact = base.replace(/\s+/g, "");
    return Array.from(new Set([base, dashed, compact]));
}

export function toSlug(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function toUsd(raw: string, currency: string): number {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const amount = Number.parseFloat(cleaned);
    if (!Number.isFinite(amount)) return Number.NaN;

    const normalizedCurrency = currency.toUpperCase();
    if (normalizedCurrency === "GBP") return round(amount * 1.27);
    if (normalizedCurrency === "EUR") return round(amount * 1.09);
    if (normalizedCurrency === "CAD") return round(amount * 0.74);
    if (normalizedCurrency === "SB" || normalizedCurrency === "FC") return round(amount * 0.01);
    return round(amount);
}

function parseDevices(raw: string): Array<"ios" | "android" | "pc" | "web"> {
    const value = raw.toLowerCase();
    const devices: Array<"ios" | "android" | "pc" | "web"> = [];

    if (/ios|iphone|ipad|apple/.test(value)) devices.push("ios");
    if (/android|google play|play store/.test(value)) devices.push("android");
    if (/pc|desktop|windows|mac/.test(value)) devices.push("pc");
    if (devices.length === 0) devices.push("web");

    return devices;
}

function normalizeCountries(countries?: string[] | null): string[] {
    if (!countries || countries.length === 0) return [FALLBACK_COUNTRY];
    return Array.from(new Set(countries.map((country) => country.toUpperCase()))).slice(0, 10);
}

function mapCategory(raw: string): string {
    if (/survey|research|opinion/i.test(raw)) return "survey";
    if (/signup|sign up|register|join/i.test(raw)) return "sign_up";
    if (/shop|buy|purchase/i.test(raw)) return "shopping";
    if (/watch|video|stream/i.test(raw)) return "video";
    if (/install|download/i.test(raw)) return "app_install";
    if (/game|play|level|village/i.test(raw)) return "mobile_game";
    return "other";
}

function mapPayoutType(currency: string, categoryRaw: string): NormalizedOffer["payout_type"] {
    if (/gift|voucher/i.test(categoryRaw)) return "gift_card";
    if (/crypto|btc|eth|sol/i.test(categoryRaw)) return "crypto";
    if (["SB", "FC"].includes(currency.toUpperCase())) return "points";
    return "online_cashback";
}

function round(value: number): number {
    return Number(value.toFixed(2));
}
