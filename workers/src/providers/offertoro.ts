// ---------------------------------------------------------------------------
// OfferToro provider adapter
//
// OfferToro is a major offerwall network used by high-traffic GPT sites.
// Their JSON API returns structured offer data with native country arrays —
// no payout-parsing ambiguity, no Playwright required.
//
// API reference: https://documentation.offertoro.com/
//
// ── Authentication ──────────────────────────────────────────────────────────
// Requires a publisher account. Set in workers/.env:
//   OFFERTORO_APP_KEY=<your appkey>
//   OFFERTORO_PUB_ID=<your pub_id>
//
// ── Fixture mode ────────────────────────────────────────────────────────────
// When credentials are absent or OFFERTORO_USE_FIXTURE=true, reads from
// src/providers/fixtures/offertoro.json — safe for CI and local dev.
//
// ── Device integer codes ─────────────────────────────────────────────────────
//   1 = Web/Desktop
//   2 = Android only
//   3 = iOS + Android (both)
//   4 = iOS only
//
// ── Payout format ────────────────────────────────────────────────────────────
// OfferToro returns `payout` as a float in USD (e.g. 17.50 = $17.50).
// No cents conversion needed — feed directly into normalizer as USD string.
// ---------------------------------------------------------------------------

import fs from "fs";
import path from "path";
import { RawOffer } from "../types";

// ── Env config ────────────────────────────────────────────────────────────────

const APP_KEY = process.env.OFFERTORO_APP_KEY;
const PUB_ID = process.env.OFFERTORO_PUB_ID;
const USE_FIXTURE = process.env.OFFERTORO_USE_FIXTURE === "true" || (!APP_KEY || !PUB_ID);

// ── OfferToro API response shape ─────────────────────────────────────────────

interface OfferToroOffer {
    /** Provider's stable offer ID */
    oid: string | number;
    title: string;
    description?: string;
    /** Payout as a float in USD */
    payout: number;
    /** Click-tracking URL for the /go redirect */
    anchor: string;
    picture?: string | null;
    /** ISO 3166-1 alpha-2 country codes */
    countries: string[];
    /**
     * Integer device code:
     *   1 = Web, 2 = Android, 3 = iOS+Android, 4 = iOS
     */
    device: number;
    epc?: number;
    preview_url?: string | null;
    /** ISO-8601 date or null */
    expire_date: string | null;
}

interface OfferToroResponse {
    status?: string;
    offers?: OfferToroOffer[];
}

// ── OfferToro device code → device_raw string ─────────────────────────────────

function deviceCodeToString(code: number): string {
    switch (code) {
        case 1: return "Web";
        case 2: return "Android";
        case 3: return "Android, iOS";
        case 4: return "iOS";
        default: return "Web";
    }
}

// ── Game slug inference ───────────────────────────────────────────────────────
// The normalizer does this too, but the adapter can hint via game_slug
// for any offers where the title pattern is unambiguous.
// We leave this as null here — the normalizer's GAME_TITLE_MAP handles it.

// ── Adapter ──────────────────────────────────────────────────────────────────

async function fetchLiveOffers(): Promise<OfferToroOffer[]> {
    // OfferToro served API endpoint — returns JSON for the publisher's wall
    // Full docs: https://documentation.offertoro.com/
    const url = new URL(`https://www.offertoro.com/api/served/json/${APP_KEY}/0/${PUB_ID}`);
    url.searchParams.set("s1", "earngrind"); // sub-ID for tracking

    const res = await fetch(url.toString(), {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
        throw new Error(`OfferToro API responded ${res.status}: ${await res.text()}`);
    }

    const json = await res.json() as OfferToroOffer[] | OfferToroResponse;

    // OfferToro returns either a plain array or { status, offers: [...] }
    if (Array.isArray(json)) return json;
    const wrapped = json as OfferToroResponse;
    if (wrapped.status && wrapped.status !== "success") {
        throw new Error(`OfferToro API returned status=${wrapped.status}`);
    }
    return wrapped.offers ?? [];
}

function loadFixture(): OfferToroOffer[] {
    const fixturePath = path.resolve(__dirname, "fixtures", "offertoro.json");
    const raw = fs.readFileSync(fixturePath, "utf-8");
    return JSON.parse(raw) as OfferToroOffer[];
}

function offerToroOfferToRaw(offer: OfferToroOffer): RawOffer {
    return {
        external_id: String(offer.oid),
        title: offer.title.trim(),
        // OfferToro sends payout as a USD float — format to string with 2dp
        payout_raw: `$${offer.payout.toFixed(2)}`,
        currency: "USD",
        device_raw: deviceCodeToString(offer.device),
        category_raw: offer.title, // use title for category inference (description not always present)
        url: offer.anchor,
        expires_raw: offer.expire_date ?? null,
        game_slug: null,        // normalizer GAME_TITLE_MAP will handle this
        countries_raw: offer.countries.length > 0 ? offer.countries : null,
    };
}

/**
 * Fetch offers from OfferToro.
 * - Uses live API when OFFERTORO_APP_KEY + OFFERTORO_PUB_ID are set.
 * - Falls back to fixture file when credentials are absent or OFFERTORO_USE_FIXTURE=true.
 */
export async function fetchOfferToroOffers(): Promise<RawOffer[]> {
    if (USE_FIXTURE) {
        console.log("[offertoro] 📄 Using fixture (set OFFERTORO_APP_KEY + OFFERTORO_PUB_ID for live data)");
        const offers = loadFixture();
        console.log(`[offertoro] Loaded ${offers.length} offers from fixture`);
        return offers.map(offerToroOfferToRaw);
    }

    console.log("[offertoro] 🌐 Fetching live offers from OfferToro API…");
    const offers = await fetchLiveOffers();
    console.log(`[offertoro] Received ${offers.length} offers from API`);
    return offers.map(offerToroOfferToRaw);
}
