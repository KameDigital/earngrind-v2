// ---------------------------------------------------------------------------
// Adgate Media provider adapter
//
// Adgate Media is an offerwall network whose offers appear on many GPT platforms.
// API Docs: https://adgatemedia.com/publishers/api/
//
// ── Authentication ──────────────────────────────────────────────────────────
// Requires an Adgate publisher account. Set in .env:
//   ADGATE_APP_ID=<your app_id>
//   ADGATE_SECRET_KEY=<your secret_key>
//
// ── Fixture mode ────────────────────────────────────────────────────────────
// When ADGATE_USE_FIXTURE=true (or credentials are absent), the adapter
// reads from src/providers/fixtures/adgate-media.json instead of hitting
// the live API. This keeps local dev fast and CI-safe.
//
// ── Adding this to the pipeline ─────────────────────────────────────────────
// Change PROVIDER=adgate-media in your .env, then run:
//   npm run ingest
//
// The orchestrator maps "adgate-media" → this adapter automatically.
// ---------------------------------------------------------------------------

import fs from "fs";
import path from "path";
import { RawOffer } from "../types";

// ── Env config ───────────────────────────────────────────────────────────────

const APP_ID = process.env.ADGATE_APP_ID;
const SECRET_KEY = process.env.ADGATE_SECRET_KEY;
const USE_FIXTURE = process.env.ADGATE_USE_FIXTURE === "true" || (!APP_ID || !SECRET_KEY);

// ── Adgate API response shape (v3 Offers API) ────────────────────────────────

interface AdgateOffer {
    offer_id: string | number;
    offer_name: string;
    offer_description?: string;
    /** Payout in cents USD */
    payout: string | number;
    currency_label: string;
    /** Platform-provided device string e.g. "Android", "iOS", "Android, iOS", "Web" */
    device: string;
    /** Category label e.g. "Mobile Games", "Sign Up" */
    categories: string;
    /** Click-tracking URL — used as custom_param for /go redirect */
    offer_url: string;
    /** ISO-8601 or null */
    expiration_date: string | null;
}

// ── Game slug inference from offer name ──────────────────────────────────────
// Simple keyword → slug mapping. Extend as new gameoffers appear.

const GAME_SLUG_MAP: Array<[RegExp, string]> = [
    [/coin master/i, "coin-master"],
    [/bingo blitz/i, "bingo-blitz"],
    [/clash of clans/i, "clash-of-clans"],
    [/clash royale/i, "clash-royale"],
    [/rise of kingdoms/i, "rise-of-kingdoms"],
    [/township/i, "township"],
    [/solitaire/i, "solitaire-grand-harvest"],
];

function inferGameSlug(offerName: string): string | null {
    for (const [pattern, slug] of GAME_SLUG_MAP) {
        if (pattern.test(offerName)) return slug;
    }
    return null;
}

// ── Adapter ──────────────────────────────────────────────────────────────────

async function fetchLiveOffers(): Promise<AdgateOffer[]> {
    // Adgate Offers API v3 endpoint
    const url = new URL("https://wall.adgatemedia.com/api/v3/offers");
    url.searchParams.set("app_id", APP_ID!);
    url.searchParams.set("secret_key", SECRET_KEY!);
    url.searchParams.set("s1", "earngrind"); // sub-ID for tracking

    const res = await fetch(url.toString(), {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(15_000), // 15s timeout
    });

    if (!res.ok) {
        throw new Error(`Adgate API responded ${res.status}: ${await res.text()}`);
    }

    const json = await res.json() as AdgateOffer[] | { offers: AdgateOffer[] };
    // Adgate wraps offers in { offers: [...] } or returns array directly
    return Array.isArray(json) ? json : ((json as { offers: AdgateOffer[] }).offers ?? []);

}

function loadFixture(): AdgateOffer[] {
    const fixturePath = path.resolve(__dirname, "fixtures", "adgate-media.json");
    const raw = fs.readFileSync(fixturePath, "utf-8");
    return JSON.parse(raw) as AdgateOffer[];
}

function adgateOfferToRaw(offer: AdgateOffer): RawOffer {
    // Adgate payout is in cents (integer) → convert to "$X.XX" string
    const payoutCents = Number(offer.payout);
    const payoutUsd = (payoutCents / 100).toFixed(2);

    return {
        external_id: String(offer.offer_id),
        title: offer.offer_name.trim(),
        payout_raw: `$${payoutUsd}`,
        currency: "USD", // Adgate always pays USD
        device_raw: offer.device ?? "Web",
        category_raw: offer.categories ?? "other",
        url: offer.offer_url,
        expires_raw: offer.expiration_date ?? null,
        game_slug: inferGameSlug(offer.offer_name),
    };
}

/**
 * Fetch offers from Adgate Media.
 * - Uses live API when ADGATE_APP_ID + ADGATE_SECRET_KEY are set.
 * - Falls back to fixture file when either is missing or ADGATE_USE_FIXTURE=true.
 */
export async function fetchAdgateOffers(): Promise<RawOffer[]> {
    if (USE_FIXTURE) {
        console.log("[adgate] 📄 Using fixture (set ADGATE_APP_ID + ADGATE_SECRET_KEY for live data)");
        const rawOffers = loadFixture();
        console.log(`[adgate] Loaded ${rawOffers.length} offers from fixture`);
        return rawOffers.map(adgateOfferToRaw);
    }

    console.log("[adgate] 🌐 Fetching live offers from Adgate Media API…");
    const rawOffers = await fetchLiveOffers();
    console.log(`[adgate] Received ${rawOffers.length} offers from API`);
    return rawOffers.map(adgateOfferToRaw);
}
