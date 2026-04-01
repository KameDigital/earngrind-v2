// ---------------------------------------------------------------------------
// Mock provider adapter
//
// Returns a realistic set of RawOffers against the two seeded games
// (coin-master, bingo-blitz) for both platforms.
//
// Designed as a drop-in replacement for a real scraper — swap this
// import in index.ts to point at a real provider when ready.
//
// The mockOffers array can be updated freely to simulate payout changes,
// new offers, expired offers, etc.
// ---------------------------------------------------------------------------
import { RawOffer } from "../types";

const MOCK_OFFERS: RawOffer[] = [
    // ── Swagbucks offers ──────────────────────────────────────────────────
    {
        external_id: "sb-cm-v50",
        title: "Coin Master: Reach Village 50",
        payout_raw: "$22.00",
        currency: "USD",
        device_raw: "Android, iOS",
        category_raw: "Mobile Games",
        url: "https://www.swagbucks.com/offers/coin-master-village-50",
        expires_raw: null,
        game_slug: "coin-master",
    },
    {
        external_id: "sb-bb-l100",
        title: "Bingo Blitz: Reach Level 100",
        payout_raw: "$18.75",
        currency: "USD",
        device_raw: "Android, iOS, PC",
        category_raw: "Mobile Games",
        url: "https://www.swagbucks.com/offers/bingo-blitz-level-100",
        expires_raw: null,
        game_slug: "bingo-blitz",
    },
    {
        external_id: "sb-signup-2024",
        title: "Swagbucks New Member Bonus",
        payout_raw: "$5.00",
        currency: "USD",
        device_raw: "Web",
        category_raw: "Sign Up",
        url: "https://www.swagbucks.com/refer/earngrind",
        expires_raw: null,
        game_slug: null,
    },

    // ── Freecash offers ───────────────────────────────────────────────────
    {
        external_id: "fc-cm-v50",
        title: "Coin Master: Reach Village 50",
        payout_raw: "$14.50",
        currency: "USD",
        device_raw: "Android",
        category_raw: "Games",
        url: "https://freecash.com/offer/coin-master-v50",
        expires_raw: null,
        game_slug: "coin-master",
    },
    {
        external_id: "fc-bb-credits200",
        title: "Bingo Blitz: Collect 200 Credits",
        payout_raw: "$8.00",
        currency: "USD",
        device_raw: "iOS, Android",
        category_raw: "Games",
        url: "https://freecash.com/offer/bingo-blitz-200-credits",
        expires_raw: null,
        game_slug: "bingo-blitz",
    },

    // ── EarnLab offers ────────────────────────────────────────────────────
    {
        external_id: "el-cm-v40",
        title: "Coin Master: Reach Village 40",
        payout_raw: "$16.00",
        currency: "USD",
        device_raw: "Android, iOS",
        category_raw: "Mobile Games",
        url: "https://earnlab.com/offers/coin-master-village-40",
        expires_raw: null,
        game_slug: "coin-master",
    },
    {
        external_id: "el-rm-level50",
        title: "Royal Match: Complete Level 50",
        payout_raw: "$9.00",
        currency: "USD",
        device_raw: "Android, iOS",
        category_raw: "Mobile Games",
        url: "https://earnlab.com/offers/royal-match-level-50",
        expires_raw: null,
        game_slug: "royal-match",
    },
    {
        external_id: "el-coc-th10",
        title: "Clash of Clans: Reach Town Hall 10",
        payout_raw: "$12.00",
        currency: "USD",
        device_raw: "Android, iOS",
        category_raw: "Mobile Games",
        url: "https://earnlab.com/offers/clash-of-clans-th10",
        expires_raw: null,
        game_slug: "clash-of-clans",
    },
];

const MOCK_OFFERS_BY_PLATFORM: Record<string, RawOffer[]> = {
    swagbucks: MOCK_OFFERS.filter(o => o.external_id.startsWith("sb-")),
    freecash:  MOCK_OFFERS.filter(o => o.external_id.startsWith("fc-")),
    earnlab:   MOCK_OFFERS.filter(o => o.external_id.startsWith("el-")),
};

/**
 * Fetch raw offers for a given platform from the mock data source.
 * Returns a copy so callers can mutate without affecting the source.
 */
export async function fetchMockOffers(platformSlug: string): Promise<RawOffer[]> {
    const offers = MOCK_OFFERS_BY_PLATFORM[platformSlug];
    if (!offers) {
        console.warn(`[mock] No mock offers for platform: ${platformSlug}`);
        return [];
    }
    console.log(`[mock] Returning ${offers.length} mock offers for ${platformSlug}`);
    return [...offers];
}
