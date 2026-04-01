// ---------------------------------------------------------------------------
// OGAds provider adapter
//
// OGAds is one of the largest mobile offerwall and content-locking networks.
// Their API returns structured JSON offer data with payout in USD.
//
// API reference: https://ogads.com/api/documentation
// (Publisher dashboard → API → Feed)
//
// ── Authentication ───────────────────────────────────────────────────────────
// Requires a publisher account. Set in workers/.env:
//   OGADS_API_KEY=<your api_key>
//   OGADS_AFF_ID=<your affiliate_id>
//
// ── Fixture mode ─────────────────────────────────────────────────────────────
// When credentials are absent or OGADS_USE_FIXTURE=true, reads from
// src/providers/fixtures/ogads.json — safe for CI and local dev.
//
// ── Payout format ─────────────────────────────────────────────────────────────
// OGAds returns `payout` as a float in USD (e.g. 18.50 = $18.50).
// No cents conversion needed.
//
// ── Device fields ─────────────────────────────────────────────────────────────
// OGAds returns `os` as a string: "ios", "android", "both", "web"
// ---------------------------------------------------------------------------

import fs from "fs";
import path from "path";
import { RawOffer } from "../types";

// Env vars are read inside fetchOGAdsOffers (at call time) so dotenv is
// guaranteed to have run before they are accessed.

// ── OGAds API response shape ──────────────────────────────────────────────────

interface OGAdsOffer {
    /** Stable offer ID from OGAds */
    id: string | number;
    name: string;
    description?: string | null;
    /** Payout as a float in USD */
    payout: number;
    /** Click-tracking URL */
    link: string;
    /** "ios" | "android" | "both" | "web" */
    os: string;
    /** ISO 3166-1 alpha-2 country codes */
    countries: string[];
    /** Category label from OGAds e.g. "games", "surveys", "sign_ups" */
    category: string;
    /** ISO-8601 expiration date or null */
    expiration_date?: string | null;
    /** Estimated payout per click in USD */
    epc?: number;
}

interface OGAdsResponse {
    status?: string | number;
    offers?: OGAdsOffer[];
    data?: OGAdsOffer[];
}

// ── OS string → device_raw ────────────────────────────────────────────────────

function osToDeviceRaw(os: string): string {
    switch (os.toLowerCase()) {
        case "ios": return "iOS";
        case "android": return "Android";
        case "both": return "Android, iOS";
        case "web": return "Web";
        default: return "Web";
    }
}

// ── Adapter ───────────────────────────────────────────────────────────────────

async function fetchLiveOffers(apiKey: string, affId: string): Promise<OGAdsOffer[]> {
    // OGAds feed endpoint — see https://ogads.com/api/documentation
    const url = new URL("https://ogads.com/api/v1/offers");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("aff_id", affId);
    url.searchParams.set("s1", "earngrind"); // sub-ID for attribution

    const res = await fetch(url.toString(), {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
        throw new Error(`OGAds API responded ${res.status}: ${await res.text()}`);
    }

    const json = await res.json() as OGAdsOffer[] | OGAdsResponse;

    // OGAds returns either a plain array or { status, offers: [...] } / { data: [...] }
    if (Array.isArray(json)) return json;
    const wrapped = json as OGAdsResponse;
    if (wrapped.status !== undefined && wrapped.status !== 1 && wrapped.status !== "success") {
        throw new Error(`OGAds API returned status=${wrapped.status}`);
    }
    return wrapped.offers ?? wrapped.data ?? [];
}

function loadFixture(): OGAdsOffer[] {
    const fixturePath = path.resolve(__dirname, "fixtures", "ogads.json");
    const raw = fs.readFileSync(fixturePath, "utf-8");
    return JSON.parse(raw) as OGAdsOffer[];
}

function ogadsOfferToRaw(offer: OGAdsOffer): RawOffer {
    return {
        external_id: String(offer.id),
        title: offer.name.trim(),
        // OGAds sends payout as a USD float — format to string with 2dp
        payout_raw: `$${offer.payout.toFixed(2)}`,
        currency: "USD",
        device_raw: osToDeviceRaw(offer.os),
        category_raw: offer.category ?? offer.name, // category field + title fallback
        url: offer.link,
        expires_raw: offer.expiration_date ?? null,
        game_slug: null, // normalizer GAME_TITLE_MAP handles this
        countries_raw: offer.countries.length > 0 ? offer.countries : null,
    };
}

/**
 * Fetch offers from OGAds.
 * - Uses live API when OGADS_API_KEY + OGADS_AFF_ID are set.
 * - Falls back to fixture file when credentials are absent or OGADS_USE_FIXTURE=true.
 */
export async function fetchOGAdsOffers(): Promise<RawOffer[]> {
    // Read env at call time — safe after dotenv/config has run in index.ts.
    const apiKey     = process.env.OGADS_API_KEY;
    const affId      = process.env.OGADS_AFF_ID;
    const useFixture = process.env.OGADS_USE_FIXTURE === "true" || !apiKey || !affId;

    if (useFixture) {
        console.log("[ogads] 📄 Using fixture (set OGADS_API_KEY + OGADS_AFF_ID for live data)");
        const offers = loadFixture();
        console.log(`[ogads] Loaded ${offers.length} offers from fixture`);
        return offers.map(ogadsOfferToRaw);
    }

    console.log("[ogads] 🌐 Fetching live offers from OGAds API…");
    const offers = await fetchLiveOffers(apiKey!, affId!);
    console.log(`[ogads] Received ${offers.length} offers from API`);
    return offers.map(ogadsOfferToRaw);
}
