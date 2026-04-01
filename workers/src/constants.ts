// ---------------------------------------------------------------------------
// Platform IDs and game slug → ID mappings (from DB seed)
// ---------------------------------------------------------------------------

export const PLATFORM_IDS: Record<string, string> = {
    freecash: "bfc26c8b-39f3-4260-8f7e-a145562fb69a",
    swagbucks: "1f58ec3a-1bf2-4211-bc29-9df9a3fc7ddf",
    "adgate-media": "7d095fe0-c651-4386-9286-3ed7d680d98a",
    offertoro: "4f72395d-4800-4121-b4bb-42429bad6839",
    ogads: "69b3ab15-b6be-457c-a87f-9acceff99425",
    earnlab: "9c670cc6-0fb8-4501-af17-9c97b2a2b82f",
};


// ---------------------------------------------------------------------------
// FX rates → USD
// ---------------------------------------------------------------------------

/** All rates expressed as: 1 unit of currency = N USD */
export const FX_RATES: Record<string, number> = {
    USD: 1,
    GBP: 1.27,
    EUR: 1.09,
    CAD: 0.74,
    AUD: 0.65,
    SB: 0.01,   // 100 SB = $1 (Swagbucks)
    FC: 0.01,   // 1000 FC coins = $10 → 0.01 per coin (Freecash)
};

// ---------------------------------------------------------------------------
// Payout guards
// ---------------------------------------------------------------------------

/** Minimum valid payout in USD — anything at or below is rejected */
export const PAYOUT_MIN_USD = 0.01;

/** Maximum plausible single-offer payout in USD — above is rejected as bad data */
export const PAYOUT_MAX_USD = 500;

// ---------------------------------------------------------------------------
// Title guards
// ---------------------------------------------------------------------------

export const TITLE_MIN_LENGTH = 5;
export const TITLE_MAX_LENGTH = 200;

// ---------------------------------------------------------------------------
// Category normalisation map
// ---------------------------------------------------------------------------

export const CATEGORY_MAP: Array<[RegExp, string]> = [
    [/\bgame|play|complete.*level|reach.*level|reach.*village/i, "mobile_game"],
    [/\bsurvey|research|opinion|panel/i, "survey"],
    [/\bsign.?up|register|create.*account|join/i, "sign_up"],
    [/\bshop|purchas|order|buy/i, "shopping"],
    [/\bwatch|video|stream/i, "video"],
    [/\binstall|download/i, "app_install"],
];

export const DEFAULT_CATEGORY = "other";

// ---------------------------------------------------------------------------
// Device type aliases
// ---------------------------------------------------------------------------

export const DEVICE_IOS_ALIASES = ["ios", "iphone", "ipad", "apple", "app store"];
export const DEVICE_ANDROID_ALIASES = ["android", "google play", "play store"];
export const DEVICE_PC_ALIASES = ["pc", "windows", "desktop", "mac", "browser"];

// ---------------------------------------------------------------------------
// Game title → slug matching
//
// Each entry: [pattern, slug]
// Pattern is matched against the lowercased offer title.
// First match wins — order matters for ambiguous titles.
// ---------------------------------------------------------------------------

export const GAME_TITLE_MAP: Array<[RegExp, string]> = [
    [/coin master/i, "coin-master"],
    [/bingo blitz/i, "bingo-blitz"],
    [/clash of clans/i, "clash-of-clans"],
    [/clash royale/i, "clash-royale"],
    [/rise of kingdoms/i, "rise-of-kingdoms"],
    [/township/i, "township"],
    [/solitaire.*grand harvest/i, "solitaire-grand-harvest"],
    [/gardenscapes/i, "gardenscapes"],
    [/homescapes/i, "homescapes"],
    [/royal match/i, "royal-match"],
    [/merge mansion/i, "merge-mansion"],
    [/state of survival/i, "state-of-survival"],
    [/harry potter.*magic awakened/i, "harry-potter-magic-awakened"],
    [/call of duty.*mobile/i, "call-of-duty-mobile"],
    [/candy crush/i, "candy-crush"],
    [/hay day/i, "hay-day"],
    [/empires.{0,5}puzzles/i, "empires-and-puzzles"],
    [/scopely.*star trek|star trek.*fleet/i, "star-trek-fleet-command"],
    [/world of warships/i, "world-of-warships-blitz"],
    [/lords mobile/i, "lords-mobile"],
    [/idle heroes/i, "idle-heroes"],
    [/afk arena/i, "afk-arena"],
    [/war robots/i, "war-robots"],
    [/battle of evony|evony/i, "evony"],
    [/age of origins/i, "age-of-origins"],
    [/last war/i, "last-war"],
];

// ---------------------------------------------------------------------------
// Country code inference from currency (fallback if countries_raw not set)
// ---------------------------------------------------------------------------

export const CURRENCY_COUNTRY_FALLBACK: Record<string, string[]> = {
    GBP: ["GB"],
    EUR: ["DE", "FR", "IT", "ES", "NL"],
    CAD: ["CA"],
    AUD: ["AU"],
    USD: ["US"],
    SB: ["US"],
    FC: ["US"],
};
