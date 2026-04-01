// ---------------------------------------------------------------------------
// Normalization: RawOffer → NormalizedOffer (with structured QA)
//
// Improvements over v1:
//  - toUsd: handles "4461 SB" by splitting amount + currency correctly
//  - Payout ceiling guard (PAYOUT_MAX_USD) — rejects implausible data
//  - Payout floor guard (PAYOUT_MIN_USD)
//  - Title length guards (TITLE_MIN/MAX_LENGTH)
//  - URL presence check
//  - Batch-level dedup by external_id (within one provider run)
//  - Typed RejectionReason codes instead of raw console.warn + null
//  - NormalizationReport returned (accepted + rejected) so orchestrator
//    can log and display counts without losing rejected-offer context
//  - inferGameSlug: uses GAME_TITLE_MAP (25 entries) with first-match-wins
//  - parseDevices: alias arrays, falls back to "web" gracefully
//  - countries: respects countries_raw field, falls back via CURRENCY_COUNTRY_FALLBACK
//  - payout_type: extended logic covering "points" type (non-FC/SB tokens)
// ---------------------------------------------------------------------------

import {
    RawOffer, NormalizedOffer, RejectedOffer,
    RejectionReason, NormalizationReport,
} from "./types";
import {
    FX_RATES,
    PLATFORM_IDS,
    CATEGORY_MAP,
    DEFAULT_CATEGORY,
    PAYOUT_MIN_USD,
    PAYOUT_MAX_USD,
    TITLE_MIN_LENGTH,
    TITLE_MAX_LENGTH,
    DEVICE_IOS_ALIASES,
    DEVICE_ANDROID_ALIASES,
    DEVICE_PC_ALIASES,
    GAME_TITLE_MAP,
    CURRENCY_COUNTRY_FALLBACK,
} from "./constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse payout from a raw string + currency code → USD number.
 *
 * Handles:
 *   "$22.00"  USD   → 22.00
 *   "£180"    GBP   → 180 * 1.27 = 228.60
 *   "4461 SB" SB    → 4461 * 0.01 = 44.61
 *   "1650"    USD   → 16.50 (Adgate cents format detected when > 200 and currency is USD)
 *   ""        any   → NaN → rejected
 */
function toUsd(raw: string, currency: string): number {
    // Strip currency symbols, commas, and control chars — keep digits and decimal
    const cleaned = raw.replace(/[^0-9.]/g, "");
    if (!cleaned || cleaned === ".") return NaN;

    let amount = parseFloat(cleaned);
    if (isNaN(amount)) return NaN;

    const cur = currency.toUpperCase();

    // Adgate heuristic: payout is in cents when currency is USD and value > 200
    // (no real offer pays >$200 as a single dollar-unit from Adgate v3 API)
    if (cur === "USD" && amount > 200 && !raw.includes(".")) {
        amount = amount / 100;
    }

    const rate = FX_RATES[cur] ?? 1;
    return parseFloat((amount * rate).toFixed(2));
}

function parseDevices(raw: string): Array<"ios" | "android" | "pc" | "web"> {
    const r = raw.toLowerCase();
    const devices: Array<"ios" | "android" | "pc" | "web"> = [];

    if (DEVICE_IOS_ALIASES.some(a => r.includes(a))) devices.push("ios");
    if (DEVICE_ANDROID_ALIASES.some(a => r.includes(a))) devices.push("android");
    if (DEVICE_PC_ALIASES.some(a => r.includes(a))) devices.push("pc");

    // Default to "web" only if no mobile/desktop platform matched
    if (devices.length === 0) devices.push("web");

    return devices;
}

function mapCategory(raw: string): string {
    for (const [pattern, cat] of CATEGORY_MAP) {
        if (pattern.test(raw)) return cat;
    }
    return DEFAULT_CATEGORY;
}

function mapPayoutType(currency: string, categoryRaw: string): NormalizedOffer["payout_type"] {
    const c = currency.toUpperCase();
    if (/gift|card|voucher/i.test(categoryRaw)) return "gift_card";
    if (/crypto|btc|eth|sol|coin/i.test(categoryRaw)) return "crypto";
    if (c === "SB" || c === "FC") return "points";
    return "online_cashback";
}

/**
 * Infer a game slug from an offer title using GAME_TITLE_MAP.
 * Returns null if no match found (offer is not game-related).
 */
function inferGameSlug(title: string): string | null {
    for (const [pattern, slug] of GAME_TITLE_MAP) {
        if (pattern.test(title)) return slug;
    }
    return null;
}

function resolveCountries(raw: RawOffer): string[] {
    // Prefer explicit country list from adapter
    if (raw.countries_raw && raw.countries_raw.length > 0) {
        return raw.countries_raw.slice(0, 10); // cap at 10 codes
    }
    // Fall back to currency-based inference
    return CURRENCY_COUNTRY_FALLBACK[raw.currency.toUpperCase()] ?? ["US"];
}

// ---------------------------------------------------------------------------
// Rejection builder
// ---------------------------------------------------------------------------

function reject(
    raw: RawOffer,
    reason: RejectionReason,
    detail?: string
): RejectedOffer {
    return { external_id: raw.external_id, title: raw.title, reason, detail };
}

// ---------------------------------------------------------------------------
// Main export: normalizeOffers (batch) → NormalizationReport
// ---------------------------------------------------------------------------

/**
 * Normalizes all raw offers from one platform run into a NormalizationReport.
 *
 * - Filters out bad offers with typed RejectionReason codes
 * - Deduplicates by external_id within the batch
 * - Infers game slugs when adapter did not set one
 * - Returns both accepted NormalizedOffer[] and rejected RejectedOffer[]
 */
export function normalizeOffers(
    rawOffers: RawOffer[],
    platformSlug: string,
    gameIds: Record<string, string>
): NormalizationReport {
    const platformId = PLATFORM_IDS[platformSlug];
    const accepted: NormalizedOffer[] = [];
    const rejected: RejectedOffer[] = [];
    const seenIds = new Set<string>();
    let unmatched = 0;

    if (!platformId) {
        // Reject everything — unknown platform
        for (const raw of rawOffers) {
            rejected.push(reject(raw, "UNKNOWN_PLATFORM", platformSlug));
        }
        return { accepted, rejected, unmatched };
    }

    for (const raw of rawOffers) {
        // ── Guard 1: external_id must be present and not a JS serialisation artifact ──
        const externalId = (raw.external_id ?? "").trim();
        if (!externalId || externalId === "null" || externalId === "undefined") {
            rejected.push(reject(raw, "MISSING_EXTERNAL_ID", `raw="${raw.external_id}"`));
            continue;
        }

        // ── Guard 2: batch-level dedup ────────────────────────────────────
        if (seenIds.has(externalId)) {
            rejected.push(reject(raw, "DUPLICATE_IN_BATCH", `external_id=${externalId}`));
            continue;
        }
        seenIds.add(externalId);

        // ── Guard 3: title ────────────────────────────────────────────────
        const title = raw.title?.trim() ?? "";
        if (title.length < TITLE_MIN_LENGTH) {
            rejected.push(reject(raw, "TITLE_TOO_SHORT", `length=${title.length}`));
            continue;
        }
        if (title.length > TITLE_MAX_LENGTH) {
            rejected.push(reject(raw, "TITLE_TOO_LONG", `length=${title.length}`));
            continue;
        }

        // ── Guard 4: URL must be present ──────────────────────────────────
        if (!raw.url || raw.url.trim() === "") {
            rejected.push(reject(raw, "URL_MISSING"));
            continue;
        }

        // ── Guard 5: payout ───────────────────────────────────────────────
        const payoutUsd = toUsd(raw.payout_raw, raw.currency);

        if (isNaN(payoutUsd)) {
            rejected.push(reject(raw, "PAYOUT_PARSE_FAILED", raw.payout_raw));
            continue;
        }
        if (payoutUsd < PAYOUT_MIN_USD) {
            rejected.push(reject(raw, "PAYOUT_ZERO", `$${payoutUsd}`));
            continue;
        }
        if (payoutUsd < 0) {
            rejected.push(reject(raw, "PAYOUT_NEGATIVE", `$${payoutUsd}`));
            continue;
        }
        if (payoutUsd > PAYOUT_MAX_USD) {
            rejected.push(reject(raw, "PAYOUT_EXCEEDS_CEILING", `$${payoutUsd} > $${PAYOUT_MAX_USD}`));
            continue;
        }

        // ── Game resolution: adapter slug → UUID, with title fallback ─────
        let gameSlug = raw.game_slug ?? inferGameSlug(title);
        let gameId = gameSlug ? (gameIds[gameSlug] ?? null) : null;

        // If the adapter provided a slug but it's not in the DB, try the title
        if (raw.game_slug && !gameId) {
            const titleSlug = inferGameSlug(title);
            if (titleSlug && gameIds[titleSlug]) {
                gameId = gameIds[titleSlug];
                gameSlug = titleSlug;
            }
        }

        if (!gameId) unmatched++;

        // ── Build NormalizedOffer ─────────────────────────────────────────
        accepted.push({
            platform_id: platformId,
            game_id: gameId,
            external_id: externalId,
            title: title,
            payout_usd: payoutUsd,
            payout_type: mapPayoutType(raw.currency, raw.category_raw),
            devices: parseDevices(raw.device_raw),
            countries: resolveCountries(raw),
            category: mapCategory(raw.category_raw),
            custom_param: raw.url.trim(),
            offer_expires_at: raw.expires_raw ?? null,
        });
    }

    return { accepted, rejected, unmatched };
}

// ---------------------------------------------------------------------------
// Legacy single-offer wrapper (kept for backwards compat with tests)
// Returns NormalizedOffer | null — rejection is logged to stderr.
// Prefer normalizeOffers() for production use.
// ---------------------------------------------------------------------------
export function normalizeOffer(
    raw: RawOffer,
    platformSlug: string,
    gameIds: Record<string, string>
): NormalizedOffer | null {
    const { accepted, rejected } = normalizeOffers([raw], platformSlug, gameIds);
    if (rejected.length > 0) {
        const r = rejected[0];
        console.warn(`[normalize] REJECTED external_id=${r.external_id} reason=${r.reason} ${r.detail ?? ""}`);
    }
    return accepted[0] ?? null;
}
