import "server-only";

const GAIN_API_URL = process.env.GAIN_API_URL?.trim() || "https://gain.gg/api/v2/offers";
const GAIN_SITE_SETTINGS_URL = "https://gain.gg/api/v3/site/settings";
const GAIN_PLATFORM_REDIRECT = "/go/platform/gain-gg";
const GAIN_REVU_PROFILE_URL = process.env.GAIN_REVU_PROFILE_URL?.trim() || "https://api-wall.revenueuniverse.com/profile.php";
const GAIN_REVU_WALL_ID = process.env.GAIN_REVU_WALL_ID?.trim() || "307";
const GAIN_REVU_UID = process.env.GAIN_REVU_UID?.trim() || "gainid-sync-sync";
const GAIN_ADTOWALL_URL = process.env.GAIN_ADTOWALL_URL?.trim() || "https://adtowall.com/5753/gainid-sync-sync";
const GAIN_MYCHIPS_WALL_URL = process.env.GAIN_MYCHIPS_WALL_URL?.trim() || "https://trk301.com?cid=2597981&pid=2435&adunit_id=632c1881-80ec-4c17-9170-c6e4100fd3af&user_id=gainid-sync-sync";
const GAIN_MYCHIPS_API_URL = process.env.GAIN_MYCHIPS_API_URL?.trim() || "https://api.mychips.io/v1.6/campaigns/users";
const GAIN_CPX_SURVEYS_URL = process.env.GAIN_CPX_SURVEYS_URL?.trim() || "https://live-api.cpx-research.com/api/get-surveys.php?call=true&output_method=jsscriptv1&source=offers_page&app_id=7824&ext_user_id=gainid-sync-sync&order_by=";
const GAIN_ASMWALL_OFFERS_URL = process.env.GAIN_ASMWALL_OFFERS_URL?.trim() || "https://asmwall.com/adwall/api/publisher/114020/profile/14890/offers.json?subid1=nwgain-sync-sync&subid2=&subid3=&subid4=&device=&gender=&prod_channel=5";
const GAIN_LOOTABLY_URL = process.env.GAIN_LOOTABLY_URL?.trim() || "https://wall.lootably.com/?placementID=ckhifb725001301zh68ccflpr&sid=gainid-sync-sync";
const DEFAULT_LIMIT = 300;
const MAX_LIMIT = 300;
const CACHE_SECONDS = 60 * 30;
const FEATURED_CACHE_SECONDS = 60 * 60 * 24;

export const GAIN_GALLERY_WALLS = [
    "native",
    "revu",
    "adtowall",
    "timewall",
    "mychips",
    "grabcherries",
    "cpx",
    "adgate",
    "ayet",
    "polltastic",
    "asmwall",
    "lootably",
    "theoremreach",
    "primeearn",
    "bitlabs",
] as const;

export type GainGalleryWall = typeof GAIN_GALLERY_WALLS[number];

export type GainGalleryOffer = {
    id: string;
    wall: GainGalleryWall;
    title: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;
    countryCode: string;
    reward: number;
    payout: number;
    totalPayout: number;
    currency: "USD";
    imageUrl: string | null;
    trackingUrl: string | null;
    startUrl: string;
    advertiserName: string | null;
    providerName: string;
    platform: Array<"iOS" | "Android" | "Desktop" | "Web">;
    category: string;
    requirements: string[];
    tasks: GainGalleryTaskStep[];
    expiresAt: string | null;
    status: "active";
    rawSourceMetadata: {
        source: "gain";
        wall: GainGalleryWall;
        sourceId: string;
        provider: string | null;
    };
};

export type GainGalleryTaskStep = {
    title: string;
    rewardAmount: number;
    rewardDisplay: string;
    taskType: "install" | "milestone" | "purchase" | "signup" | "survey" | "other";
    timeLimitText: string | null;
    notes: string | null;
    sortOrder: number;
};

export type GainGalleryResult = {
    wall: GainGalleryWall;
    countryCode: string;
    offers: GainGalleryOffer[];
    meta: {
        limit: number;
        cacheSeconds: number;
        upstreamCount: number;
    };
};

type GainNativeResponse = {
    status?: string;
    data?: {
        featuredOffers?: unknown[];
        offers?: unknown[];
        inProgressOffers?: unknown[];
    };
};

export class GainGalleryValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "GainGalleryValidationError";
    }
}

export class GainGalleryFetchError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "GainGalleryFetchError";
        this.status = status;
    }
}

export function normalizeGainWall(value: string | null | undefined): GainGalleryWall | null {
    const wall = value?.trim().toLowerCase();
    if (wall === "native" || wall === "gain" || wall === "gain-native" || wall === "torox") return "native";
    if (wall === "revu" || wall === "revenue-universe" || wall === "revenue universe") return "revu";
    if (wall === "adtowall" || wall === "ad-to-wall") return "adtowall";
    if (wall === "timewall") return "timewall";
    if (wall === "mychips" || wall === "my-chips") return "mychips";
    if (wall === "grabcherries" || wall === "grab-cherries" || wall === "cherries") return "grabcherries";
    if (wall === "cpx" || wall === "cpx-research" || wall === "cpx research") return "cpx";
    if (wall === "adgate" || wall === "adgate-media" || wall === "adgate rewards") return "adgate";
    if (wall === "ayet" || wall === "ayet-studios" || wall === "ayet studios") return "ayet";
    if (wall === "polltastic") return "polltastic";
    if (wall === "asmwall" || wall === "asm-wall") return "asmwall";
    if (wall === "lootably") return "lootably";
    if (wall === "theoremreach" || wall === "theorem-reach") return "theoremreach";
    if (wall === "primeearn" || wall === "prime-earn") return "primeearn";
    if (wall === "bitlabs" || wall === "bit-labs") return "bitlabs";
    return null;
}

export function normalizeGainCountryCode(value: string | null | undefined): string | null {
    const normalized = value?.trim().toUpperCase() ?? "";
    return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

export async function getGainGalleryOffers(
    wall: GainGalleryWall,
    options: {
        country?: string | null;
        limit?: number;
        refresh?: boolean;
    } = {},
): Promise<GainGalleryResult> {
    const limit = normalizeLimit(options.limit);
    const refresh = options.refresh === true;

    if (wall === "native") {
        return getNativeGainOffers({ limit, refresh, country: options.country });
    }
    if (wall === "revu") {
        return getGainRevuOffers({ limit, refresh, country: options.country });
    }
    if (wall === "adtowall") {
        return getGainAdToWallOffers({ limit, refresh, country: options.country });
    }
    if (wall === "mychips") {
        return getGainMyChipsOffers({ limit, refresh, country: options.country });
    }
    if (wall === "cpx") {
        return getGainCpxOffers({ limit, refresh, country: options.country });
    }
    if (wall === "asmwall") {
        return getGainAsmWallOffers({ limit, refresh, country: options.country });
    }
    if (wall === "lootably") {
        return getGainLootablyOffers({ limit, refresh, country: options.country });
    }
    return getUnsupportedShellWall(wall, { limit, refresh, country: options.country });
}

export async function getGainFeaturedGalleryOffers(
    options: {
        country?: string | null;
        limit?: number;
        refresh?: boolean;
    } = {},
): Promise<GainGalleryResult> {
    const limit = normalizeLimit(options.limit);
    const refresh = options.refresh === true;
    const requestCountry = normalizeGainCountryCode(options.country) ?? await getRequestCountry(refresh) ?? "US";
    const url = new URL(GAIN_API_URL);
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString(), {
        headers: buildGainHeaders("https://gain.gg/earn"),
        cache: refresh ? "no-store" : undefined,
        next: refresh ? undefined : { revalidate: FEATURED_CACHE_SECONDS, tags: ["gain-gallery-featured-native"] },
    });
    if (!response.ok) throw new GainGalleryFetchError(`Gain featured gallery request failed with status ${response.status}`, response.status);

    const payload = await response.json() as GainNativeResponse;
    const rows = Array.isArray(payload.data?.featuredOffers) ? payload.data!.featuredOffers! : [];
    const seen = new Set<string>();
    const offers = rows
        .slice(0, limit)
        .map((row) => normalizeNativeGainOffer(row, requestCountry))
        .filter((offer): offer is GainGalleryOffer => Boolean(offer))
        .filter((offer) => {
            const key = offer.id;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

    return { wall: "native", countryCode: requestCountry, offers, meta: { limit, cacheSeconds: refresh ? 0 : FEATURED_CACHE_SECONDS, upstreamCount: rows.length } };
}

async function getNativeGainOffers({ limit, refresh, country }: { limit: number; refresh: boolean; country?: string | null }): Promise<GainGalleryResult> {
    const requestCountry = normalizeGainCountryCode(country) ?? await getRequestCountry(refresh) ?? "US";
    const url = new URL(GAIN_API_URL);
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString(), {
        headers: buildGainHeaders("https://gain.gg/earn"),
        cache: refresh ? "no-store" : undefined,
        next: refresh ? undefined : { revalidate: CACHE_SECONDS, tags: ["gain-gallery-native"] },
    });
    if (!response.ok) throw new GainGalleryFetchError(`Gain native gallery request failed with status ${response.status}`, response.status);

    const payload = await response.json() as GainNativeResponse;
    const rows = [
        ...(Array.isArray(payload.data?.featuredOffers) ? payload.data!.featuredOffers! : []),
        ...(Array.isArray(payload.data?.offers) ? payload.data!.offers! : []),
    ];
    const seen = new Set<string>();
    const offers = rows
        .map((row) => normalizeNativeGainOffer(row, requestCountry))
        .filter((offer): offer is GainGalleryOffer => Boolean(offer))
        .filter((offer) => {
            const key = offer.id;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

    return { wall: "native", countryCode: requestCountry, offers, meta: { limit, cacheSeconds: refresh ? 0 : CACHE_SECONDS, upstreamCount: rows.length } };
}

async function getGainRevuOffers({ limit, refresh, country }: { limit: number; refresh: boolean; country?: string | null }): Promise<GainGalleryResult> {
    const profileUrl = new URL(GAIN_REVU_PROFILE_URL);
    profileUrl.searchParams.set("api_key", GAIN_REVU_WALL_ID);
    profileUrl.searchParams.set("uid", GAIN_REVU_UID);
    profileUrl.searchParams.set("type", process.env.GAIN_REVU_TYPE?.trim() || "desktop");
    profileUrl.searchParams.set("os", process.env.GAIN_REVU_OS?.trim() || "web");
    profileUrl.searchParams.set("version", process.env.GAIN_REVU_VERSION?.trim() || "");

    const profileResponse = await fetch(profileUrl.toString(), {
        headers: buildGainHeaders("https://gain.gg/earn"),
        cache: refresh ? "no-store" : "force-cache",
        next: refresh ? undefined : { revalidate: CACHE_SECONDS, tags: ["gain-gallery-revu"] },
    });
    if (!profileResponse.ok) throw new GainGalleryFetchError(`Gain RevU profile request failed with status ${profileResponse.status}`, profileResponse.status);

    const profile = await profileResponse.json() as Record<string, unknown>;
    const offersUrl = firstString(profile.offers_url, profile.offersUrl);
    if (!offersUrl) throw new GainGalleryFetchError("Gain RevU profile did not return offers_url", 502);

    const offerResponse = await fetch(offersUrl, {
        headers: buildGainHeaders("https://gain.gg/earn"),
        cache: refresh ? "no-store" : "force-cache",
        next: refresh ? undefined : { revalidate: CACHE_SECONDS, tags: ["gain-gallery-revu-offers"] },
    });
    if (!offerResponse.ok) throw new GainGalleryFetchError(`Gain RevU offers request failed with status ${offerResponse.status}`, offerResponse.status);

    const payload = await offerResponse.json() as Record<string, unknown>;
    const rows = Array.isArray(payload.offers) ? payload.offers : [];
    const countryCode = normalizeGainCountryCode(country) ?? normalizeGainCountryCode(firstString(profile.country)) ?? "US";
    const offers = rows
        .slice(0, limit)
        .map((row) => normalizeRevuOffer(row, countryCode))
        .filter((offer): offer is GainGalleryOffer => Boolean(offer));

    return { wall: "revu", countryCode, offers, meta: { limit, cacheSeconds: refresh ? 0 : CACHE_SECONDS, upstreamCount: rows.length } };
}

async function getGainAdToWallOffers({ limit, refresh, country }: { limit: number; refresh: boolean; country?: string | null }): Promise<GainGalleryResult> {
    const response = await fetch(GAIN_ADTOWALL_URL, {
        headers: buildGainHeaders("https://gain.gg/earn"),
        cache: refresh ? "no-store" : "force-cache",
        next: refresh ? undefined : { revalidate: CACHE_SECONDS, tags: ["gain-gallery-adtowall"] },
    });
    if (!response.ok) throw new GainGalleryFetchError(`Gain AdToWall request failed with status ${response.status}`, response.status);

    const html = await response.text();
    const detectedCountry = normalizeGainCountryCode(country) ?? normalizeGainCountryCode(extractFirstMatch(html, /&quot;geo&quot;:&quot;([^&]+)&quot;/)) ?? "US";
    const articleHtml = extractAdToWallArticles(html).slice(0, limit);
    const offers = articleHtml
        .map((article) => normalizeAdToWallOffer(article, detectedCountry))
        .filter((offer): offer is GainGalleryOffer => Boolean(offer));

    return { wall: "adtowall", countryCode: detectedCountry, offers, meta: { limit, cacheSeconds: refresh ? 0 : CACHE_SECONDS, upstreamCount: articleHtml.length } };
}

async function getGainMyChipsOffers({ limit, refresh, country }: { limit: number; refresh: boolean; country?: string | null }): Promise<GainGalleryResult> {
    const countryCode = normalizeGainCountryCode(country) ?? "US";
    const bootstrap = await fetch(GAIN_MYCHIPS_WALL_URL, {
        headers: buildGainHeaders("https://gain.gg/earn"),
        cache: "no-store",
        redirect: "follow",
    });
    if (!bootstrap.ok) throw new GainGalleryFetchError(`Gain MyChips bootstrap failed with status ${bootstrap.status}`, bootstrap.status);

    const finalUrl = new URL(bootstrap.url);
    const userId = finalUrl.searchParams.get("user_id") || "gainid-sync-sync";
    const contentId = finalUrl.searchParams.get("adunit_id") || "632c1881-80ec-4c17-9170-c6e4100fd3af";
    const clickId = finalUrl.searchParams.get("click_id") || "";
    const apiUrl = new URL(`${GAIN_MYCHIPS_API_URL.replace(/\/+$/, "")}/${encodeURIComponent(userId)}`);
    apiUrl.searchParams.set("content_id", contentId);
    apiUrl.searchParams.set("user_id", userId);
    if (clickId) apiUrl.searchParams.set("click_id", clickId);
    apiUrl.searchParams.set("language", "en");
    apiUrl.searchParams.set("offset", "0");
    apiUrl.searchParams.set("limit", String(limit));
    apiUrl.searchParams.set("country", countryCode);

    const response = await fetch(apiUrl.toString(), {
        headers: buildGainHeaders(finalUrl.toString()),
        cache: refresh ? "no-store" : "force-cache",
        next: refresh ? undefined : { revalidate: CACHE_SECONDS, tags: ["gain-gallery-mychips"] },
    });
    if (!response.ok) throw new GainGalleryFetchError(`Gain MyChips campaigns request failed with status ${response.status}`, response.status);

    const payload = await response.json() as Record<string, unknown>;
    const rows = Array.isArray(payload.campaigns) ? payload.campaigns : [];
    const offers = rows
        .map((row) => normalizeMyChipsOffer(row, countryCode))
        .filter((offer): offer is GainGalleryOffer => Boolean(offer));

    return { wall: "mychips", countryCode, offers, meta: { limit, cacheSeconds: refresh ? 0 : CACHE_SECONDS, upstreamCount: rows.length } };
}

async function getGainCpxOffers({ limit, refresh, country }: { limit: number; refresh: boolean; country?: string | null }): Promise<GainGalleryResult> {
    const countryCode = normalizeGainCountryCode(country) ?? "US";
    const response = await fetch(GAIN_CPX_SURVEYS_URL, {
        headers: buildGainHeaders("https://gain.gg/earn"),
        cache: refresh ? "no-store" : "force-cache",
        next: refresh ? undefined : { revalidate: CACHE_SECONDS, tags: ["gain-gallery-cpx"] },
    });
    if (!response.ok) throw new GainGalleryFetchError(`Gain CPX request failed with status ${response.status}`, response.status);

    const payload = await response.json() as Record<string, unknown>;
    const rows = Array.isArray(payload.surveys) ? payload.surveys.slice(0, limit) : [];
    const offers = rows
        .map((row) => normalizeCpxSurvey(row, countryCode))
        .filter((offer): offer is GainGalleryOffer => Boolean(offer));

    return { wall: "cpx", countryCode, offers, meta: { limit, cacheSeconds: refresh ? 0 : CACHE_SECONDS, upstreamCount: rows.length } };
}

async function getGainAsmWallOffers({ limit, refresh, country }: { limit: number; refresh: boolean; country?: string | null }): Promise<GainGalleryResult> {
    const countryCode = normalizeGainCountryCode(country) ?? "US";
    const response = await fetch(GAIN_ASMWALL_OFFERS_URL, {
        headers: buildGainHeaders("https://gain.gg/earn"),
        cache: refresh ? "no-store" : "force-cache",
        next: refresh ? undefined : { revalidate: CACHE_SECONDS, tags: ["gain-gallery-asmwall"] },
    });
    if (!response.ok) throw new GainGalleryFetchError(`Gain ASMWall request failed with status ${response.status}`, response.status);

    const payload = await response.json() as Record<string, unknown>;
    const rows = Array.isArray(payload.offers) ? payload.offers.slice(0, limit) : [];
    const offers = rows
        .map((row) => normalizeAsmWallOffer(row, countryCode))
        .filter((offer): offer is GainGalleryOffer => Boolean(offer));

    return { wall: "asmwall", countryCode, offers, meta: { limit, cacheSeconds: refresh ? 0 : CACHE_SECONDS, upstreamCount: rows.length } };
}

async function getGainLootablyOffers({ limit, refresh, country }: { limit: number; refresh: boolean; country?: string | null }): Promise<GainGalleryResult> {
    const countryCode = normalizeGainCountryCode(country) ?? "US";
    const response = await fetch(GAIN_LOOTABLY_URL, {
        headers: buildGainHeaders("https://gain.gg/earn"),
        cache: refresh ? "no-store" : "force-cache",
        next: refresh ? undefined : { revalidate: CACHE_SECONDS, tags: ["gain-gallery-lootably"] },
    });
    if (!response.ok) throw new GainGalleryFetchError(`Gain Lootably request failed with status ${response.status}`, response.status);

    const html = await response.text();
    const rows = extractLootablyOffers(html).slice(0, limit);
    const offers = rows
        .map((row) => normalizeLootablyOffer(row, countryCode))
        .filter((offer): offer is GainGalleryOffer => Boolean(offer));

    return { wall: "lootably", countryCode, offers, meta: { limit, cacheSeconds: refresh ? 0 : CACHE_SECONDS, upstreamCount: rows.length } };
}

async function getUnsupportedShellWall(
    wall: Exclude<GainGalleryWall, "native" | "revu" | "adtowall" | "mychips" | "cpx" | "asmwall" | "lootably">,
    { limit, refresh, country }: { limit: number; refresh: boolean; country?: string | null },
): Promise<GainGalleryResult> {
    const countryCode = normalizeGainCountryCode(country) ?? "US";
    const sourceUrls: Record<typeof wall, string> = {
        timewall: "https://timewall.io/users/login?oid=d94bc3acef79d396&uid=gainid-sync-sync",
        grabcherries: "https://grabcherries.com/wall?panelist_id=gainid-sync-sync&supplier=gai",
        adgate: "https://wall.adgaterewards.com/na-crw/gainid-sync-sync",
        ayet: "https://www.ayetstudios.com/offers/web_offerwall/2668?external_identifier=gainid-sync-sync",
        polltastic: "https://surveys.ayet.io/?adSlot=13282&external_identifier=gainid-sync-sync&custom_1=Polltastic",
        theoremreach: "https://theoremreach.com/respondent_entry/direct?api_key=aebb9cccc4919c9393f0a5017921&user_id=gainid-sync-sync",
        primeearn: "https://monetize.primeearn.com/offers?app=e4D2Xj4D73&uuid=gainid-sync-sync",
        bitlabs: "https://web.bitlabs.ai/?uid=gainid-sync-sync&token=1d52e311-dbac-4157-bb06-cd899742ca51",
    };

    await fetch(sourceUrls[wall], {
        headers: buildGainHeaders("https://gain.gg/earn"),
        cache: refresh ? "no-store" : "force-cache",
        next: refresh ? undefined : { revalidate: CACHE_SECONDS, tags: [`gain-gallery-${wall}`] },
    }).catch(() => null);

    return { wall, countryCode, offers: [], meta: { limit, cacheSeconds: refresh ? 0 : CACHE_SECONDS, upstreamCount: 0 } };
}

function normalizeNativeGainOffer(row: unknown, countryCode: string): GainGalleryOffer | null {
    if (!isRecord(row)) return null;
    const id = firstString(row.id);
    const title = cleanText(firstString(row.name));
    if (!id || !title) return null;

    const rawCoins = toNumber(row.coins) ?? 0;
    const tasks = Array.isArray(row.taskList)
        ? row.taskList.map((task, index) => normalizeNativeTask(task, index)).filter((task): task is GainGalleryTaskStep => Boolean(task))
        : [];
    const bestPayout = tasks.length > 0 ? Math.max(...tasks.map((task) => task.rewardAmount)) : coinsToUsd(rawCoins);
    const totalPayout = tasks.length > 0 ? round(tasks.reduce((sum, task) => sum + task.rewardAmount, 0)) : bestPayout;
    if (bestPayout <= 0 && totalPayout <= 0) return null;

    const description = cleanText(firstString(row.description)) || null;
    const providerName = normalizeProviderName(firstString(row.provider) || "Torox");
    const trackingUrl = normalizeHttpUrl(firstString(row.offerLink));

    return {
        id,
        wall: "native",
        title,
        slug: slugify(title),
        description,
        shortDescription: description ? truncate(description, 150) : null,
        countryCode,
        reward: rawCoins,
        payout: bestPayout,
        totalPayout,
        currency: "USD",
        imageUrl: normalizeHttpUrl(firstString(row.squareImage, row.image, row.icon)),
        trackingUrl,
        startUrl: buildGainStartUrl({ title, payout: bestPayout, totalPayout, providerName }),
        advertiserName: title,
        providerName,
        platform: normalizePlatforms(row.platforms),
        category: inferCategory(title, description),
        requirements: description ? [description] : tasks.map((task) => task.title).slice(0, 3),
        tasks,
        expiresAt: null,
        status: "active",
        rawSourceMetadata: { source: "gain", wall: "native", sourceId: id, provider: providerName },
    };
}

function normalizeNativeTask(row: unknown, index: number): GainGalleryTaskStep | null {
    if (!isRecord(row)) return null;
    const title = cleanText(firstString(row.name, row.title, row.description, row.requirement));
    const coins = toNumber(row.coins) ?? toNumber(row.reward) ?? toNumber(row.payout) ?? 0;
    const rewardAmount = coinsToUsd(coins);
    if (!title || rewardAmount <= 0) return null;
    return {
        title,
        rewardAmount,
        rewardDisplay: formatUsd(rewardAmount),
        taskType: inferTaskType(title),
        timeLimitText: firstString(row.timeLimit, row.time_limit, row.deadline) || null,
        notes: cleanText(firstString(row.description, row.instructions)) || null,
        sortOrder: index + 1,
    };
}

function normalizeRevuOffer(row: unknown, countryCode: string): GainGalleryOffer | null {
    if (!isRecord(row)) return null;
    const id = firstString(row.cid, row.id, row.campaign_id);
    const title = cleanText(firstString(row.name, row.title));
    const payout = coinsToUsd(toNumber(row.currency) ?? toNumber(row.payout) ?? 0);
    if (!id || !title || payout <= 0) return null;

    const description = cleanText(firstString(row.description, row.terms, row.view_more)) || null;
    const category = cleanText(firstString(row.category)) || inferCategory(title, description);
    const trackingUrl = normalizeHttpUrl(firstString(row.url));

    return {
        id,
        wall: "revu",
        title: extractParentTitle(title),
        slug: slugify(extractParentTitle(title)),
        description,
        shortDescription: description ? truncate(description, 150) : null,
        countryCode,
        reward: toNumber(row.currency) ?? 0,
        payout,
        totalPayout: payout,
        currency: "USD",
        imageUrl: normalizeHttpUrl(firstString(row.creative, row.image, row.icon)),
        trackingUrl,
        startUrl: buildGainStartUrl({ title, payout, totalPayout: payout, providerName: "Revenue Universe" }),
        advertiserName: extractParentTitle(title),
        providerName: "Revenue Universe",
        platform: ["Desktop"],
        category,
        requirements: description ? [description] : [],
        tasks: [{
            title,
            rewardAmount: payout,
            rewardDisplay: formatUsd(payout),
            taskType: inferTaskType(`${title} ${description ?? ""}`),
            timeLimitText: null,
            notes: description,
            sortOrder: 1,
        }],
        expiresAt: null,
        status: "active",
        rawSourceMetadata: { source: "gain", wall: "revu", sourceId: id, provider: "Revenue Universe" },
    };
}

function normalizeAdToWallOffer(articleHtml: string, countryCode: string): GainGalleryOffer | null {
    const offerLinkId = extractFirstMatch(articleHtml, /offerLinkId&quot;:\s*(\d+)/) ?? extractFirstMatch(articleHtml, /"offerLinkId":\s*(\d+)/);
    const title = cleanText(stripTags(extractFirstMatch(articleHtml, /task__title[^>]*>([\s\S]*?)<\/[^>]+>/)));
    if (!offerLinkId || !title) return null;

    const subtitle = cleanText(stripTags(extractFirstMatch(articleHtml, /task__subtitle[^>]*>([\s\S]*?)<\/[^>]+>/)));
    const payoutText = cleanText(stripTags(extractFirstMatch(articleHtml, /btn--transformer[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/)));
    const payout = coinsToUsd(parsePoints(payoutText));
    if (payout <= 0) return null;

    const parentTitle = subtitle || extractParentTitle(title);
    const imageUrl = normalizeHttpUrl(decodeHtml(extractFirstMatch(articleHtml, /<img[^>]+src=["']([^"']+)/i) ?? ""));
    const deviceLabels = Array.from(articleHtml.matchAll(/label[^>]*>([\s\S]*?)<\/[^>]+>/gi))
        .map((match) => cleanText(stripTags(match[1])))
        .filter(Boolean);

    return {
        id: offerLinkId,
        wall: "adtowall",
        title: parentTitle,
        slug: slugify(parentTitle),
        description: title,
        shortDescription: truncate(title, 150),
        countryCode,
        reward: parsePoints(payoutText),
        payout,
        totalPayout: payout,
        currency: "USD",
        imageUrl,
        trackingUrl: null,
        startUrl: buildGainStartUrl({ title: parentTitle, payout, totalPayout: payout, providerName: "AdToWall" }),
        advertiserName: parentTitle,
        providerName: "AdToWall",
        platform: normalizePlatforms(deviceLabels),
        category: inferCategory(`${parentTitle} ${deviceLabels.join(" ")}`, title),
        requirements: [title],
        tasks: [{
            title,
            rewardAmount: payout,
            rewardDisplay: formatUsd(payout),
            taskType: inferTaskType(title),
            timeLimitText: null,
            notes: null,
            sortOrder: 1,
        }],
        expiresAt: null,
        status: "active",
        rawSourceMetadata: { source: "gain", wall: "adtowall", sourceId: offerLinkId, provider: "AdToWall" },
    };
}

function normalizeMyChipsOffer(row: unknown, countryCode: string): GainGalleryOffer | null {
    if (!isRecord(row)) return null;
    const id = firstString(row.id, row.campaignId, row.campaign_id);
    const title = cleanText(firstString(row.title, row.subtitle, row.name));
    if (!id || !title) return null;

    const taskRows = [
        ...(Array.isArray(row.events) ? row.events : []),
        ...(Array.isArray(row.bonusEvents) ? row.bonusEvents : []),
        ...(Array.isArray(row.recurringEvents) ? row.recurringEvents : []),
    ];
    const tasks = taskRows
        .map((task, index) => normalizeGenericTask(task, index))
        .filter((task): task is GainGalleryTaskStep => Boolean(task));
    const fallbackPayout = bestNumber([
        ["bid", row.bid, "usd"],
        ["totalConvertedValue", row.totalConvertedValue, "coins"],
        ["remainingConvertedValue", row.remainingConvertedValue, "coins"],
        ["chips", row.chips, "coins"],
        ["remainingChips", row.remainingChips, "coins"],
    ]);
    const payout = tasks.length > 0 ? Math.max(...tasks.map((task) => task.rewardAmount)) : fallbackPayout;
    const totalPayout = tasks.length > 0 ? round(tasks.reduce((sum, task) => sum + task.rewardAmount, 0)) : payout;
    if (payout <= 0) return null;

    const description = cleanText(firstString(row.description, row.subtitle)) || null;
    const imageUrl = normalizeHttpUrl(firstString(row.thumbnail, row.cover, row.image, row.image_url, row.icon));
    const trackingUrl = normalizeHttpUrl(firstString(row.trackingUrl, row.tracking_url, row.offer_url, row.click_url));

    return {
        id,
        wall: "mychips",
        title: extractParentTitle(title),
        slug: slugify(extractParentTitle(title)),
        description,
        shortDescription: description ? truncate(description, 150) : null,
        countryCode,
        reward: Math.round(totalPayout * 1000),
        payout,
        totalPayout,
        currency: "USD",
        imageUrl,
        trackingUrl,
        startUrl: buildGainStartUrl({ title, payout, totalPayout, providerName: "MyChips" }),
        advertiserName: extractParentTitle(title),
        providerName: "MyChips",
        platform: normalizePlatforms(firstString(row.device, row.devices, row.platform, row.platforms, row.os)),
        category: inferCategory(title, description),
        requirements: tasks.length > 0 ? tasks.map((task) => task.title).slice(0, 5) : description ? [description] : [],
        tasks,
        expiresAt: firstString(row.expires_at, row.expiry, row.expiration_date) || null,
        status: "active",
        rawSourceMetadata: { source: "gain", wall: "mychips", sourceId: id, provider: "MyChips" },
    };
}

function normalizeCpxSurvey(row: unknown, countryCode: string): GainGalleryOffer | null {
    if (!isRecord(row)) return null;
    const id = firstString(row.id);
    if (!id) return null;
    const category = cleanText(firstString(row.category)) || "Survey";
    const loi = toNumber(row.loi);
    const title = `${category} survey${loi ? ` - ${loi} min` : ""}`;
    const payout = coinsToUsd(toNumber(row.payout) ?? 0);
    if (payout <= 0) return null;

    return {
        id,
        wall: "cpx",
        title,
        slug: slugify(`cpx-${category}-${id}`),
        description: `CPX Research ${category.toLowerCase()} survey${loi ? ` with an estimated ${loi} minute length` : ""}.`,
        shortDescription: `CPX Research ${category.toLowerCase()} survey.`,
        countryCode,
        reward: toNumber(row.payout) ?? 0,
        payout,
        totalPayout: payout,
        currency: "USD",
        imageUrl: null,
        trackingUrl: null,
        startUrl: buildGainStartUrl({ title, payout, totalPayout: payout, providerName: "CPX Research" }),
        advertiserName: title,
        providerName: "CPX Research",
        platform: ["Web"],
        category: "Survey",
        requirements: [`Complete the ${category.toLowerCase()} survey.`],
        tasks: [{
            title: `Complete the ${category.toLowerCase()} survey`,
            rewardAmount: payout,
            rewardDisplay: formatUsd(payout),
            taskType: "survey",
            timeLimitText: loi ? `${loi} minutes` : null,
            notes: null,
            sortOrder: 1,
        }],
        expiresAt: null,
        status: "active",
        rawSourceMetadata: { source: "gain", wall: "cpx", sourceId: id, provider: "CPX Research" },
    };
}

function normalizeAsmWallOffer(row: unknown, countryCode: string): GainGalleryOffer | null {
    if (!isRecord(row)) return null;
    const id = firstString(row.offer_id, row.id);
    const title = cleanText(firstString(row.name, row.title));
    const payout = toNumber(row.payout) ?? coinsToUsd(toNumber(row.currency_count) ?? 0);
    if (!id || !title || payout <= 0) return null;

    const description = cleanText(firstString(row.description, row.requirements)) || null;
    const eventRows = Array.isArray(row.events) ? row.events : [];
    const tasks = eventRows
        .map((event, index) => normalizeAsmWallTask(event, index))
        .filter((task): task is GainGalleryTaskStep => Boolean(task));
    const totalPayout = tasks.length > 0 ? round(tasks.reduce((sum, task) => sum + task.rewardAmount, 0)) : payout;
    const trackingUrl = normalizeHttpUrl(firstString(row.click_url));
    const imageUrl = normalizeHttpUrl(firstString(row.creative_url, row.image_url).replace(/^\/\//, "https://"));

    return {
        id,
        wall: "asmwall",
        title: extractParentTitle(title),
        slug: slugify(extractParentTitle(title)),
        description,
        shortDescription: description ? truncate(description, 150) : null,
        countryCode,
        reward: toNumber(row.currency_count) ?? Math.round(payout * 1000),
        payout,
        totalPayout,
        currency: "USD",
        imageUrl,
        trackingUrl,
        startUrl: buildGainStartUrl({ title, payout, totalPayout, providerName: "ASMWall" }),
        advertiserName: extractParentTitle(title),
        providerName: "ASMWall",
        platform: normalizePlatforms(firstString(row.target_system, row.device, row.devices)),
        category: inferCategory(title, description),
        requirements: description ? [description] : tasks.map((task) => task.title).slice(0, 3),
        tasks,
        expiresAt: null,
        status: "active",
        rawSourceMetadata: { source: "gain", wall: "asmwall", sourceId: id, provider: "ASMWall" },
    };
}

function normalizeAsmWallTask(row: unknown, index: number): GainGalleryTaskStep | null {
    if (!isRecord(row)) return null;
    const title = cleanText(firstString(row.event_name, row.name, row.title, row.event_description));
    const payout = toNumber(row.payout) ?? coinsToUsd(toNumber(row.currency_count) ?? 0);
    if (!title || payout <= 0) return null;
    return {
        title,
        rewardAmount: payout,
        rewardDisplay: formatUsd(payout),
        taskType: inferTaskType(title),
        timeLimitText: null,
        notes: cleanText(firstString(row.event_description, row.description)) || null,
        sortOrder: index + 1,
    };
}

function normalizeLootablyOffer(row: Record<string, unknown>, countryCode: string): GainGalleryOffer | null {
    const id = firstString(row.offerID, row.id);
    const title = cleanText(firstString(row.name, row.title));
    const goals = Array.isArray(row.goals) ? row.goals : [];
    const tasks = goals
        .map((goal, index) => normalizeLootablyGoal(goal, index))
        .filter((task): task is GainGalleryTaskStep => Boolean(task));
    const fallbackPayout = coinsToUsd(toNumber(row.currencyReward) ?? toNumber(row.originalCurrencyReward) ?? 0);
    const payout = tasks.length > 0 ? Math.max(...tasks.map((task) => task.rewardAmount)) : fallbackPayout;
    const totalPayout = tasks.length > 0 ? round(tasks.reduce((sum, task) => sum + task.rewardAmount, 0)) : payout;
    if (!id || !title || payout <= 0) return null;

    const description = cleanText(firstString(row.description, row.tagline)) || null;
    const trackingTemplate = firstString(row.link);
    const trackingUrl = normalizeHttpUrl(trackingTemplate
        .replace("{placementID}", "ckhifb725001301zh68ccflpr")
        .replace("{userID}", "gainid-sync-sync"));

    return {
        id,
        wall: "lootably",
        title: extractParentTitle(title),
        slug: slugify(extractParentTitle(title)),
        description,
        shortDescription: description ? truncate(description, 150) : null,
        countryCode: normalizeGainCountryCode(firstString(row.countries)) ?? countryCode,
        reward: toNumber(row.currencyReward) ?? Math.round(totalPayout * 1000),
        payout,
        totalPayout,
        currency: "USD",
        imageUrl: normalizeHttpUrl(firstString(row.image)),
        trackingUrl,
        startUrl: buildGainStartUrl({ title, payout, totalPayout, providerName: "Lootably" }),
        advertiserName: extractParentTitle(title),
        providerName: "Lootably",
        platform: normalizePlatforms(row.devices),
        category: inferCategory(`${title} ${Array.isArray(row.categories) ? row.categories.join(" ") : ""}`, description),
        requirements: description ? [description] : tasks.map((task) => task.title).slice(0, 3),
        tasks,
        expiresAt: null,
        status: "active",
        rawSourceMetadata: { source: "gain", wall: "lootably", sourceId: id, provider: "Lootably" },
    };
}

function normalizeLootablyGoal(row: unknown, index: number): GainGalleryTaskStep | null {
    if (!isRecord(row)) return null;
    const title = cleanText(firstString(row.description, row.name, row.title));
    const payout = coinsToUsd(toNumber(row.currencyReward) ?? toNumber(row.originalCurrencyReward) ?? 0);
    if (!title || payout <= 0) return null;
    return {
        title,
        rewardAmount: payout,
        rewardDisplay: formatUsd(payout),
        taskType: inferTaskType(title),
        timeLimitText: null,
        notes: null,
        sortOrder: index + 1,
    };
}

function normalizeGenericTask(row: unknown, index: number): GainGalleryTaskStep | null {
    if (!isRecord(row)) return null;
    const title = cleanText(firstString(row.userFlow, row.userFlowDetails, row.title, row.eventName, row.subtitle, row.description, row.requirement, row.name));
    const payout = bestNumber([
        ["bid", row.bid, "usd"],
        ["totalBid", row.totalBid, "usd"],
        ["convertedBid", row.convertedBid, "coins"],
        ["totalConvertedBid", row.totalConvertedBid, "coins"],
        ["convertedBidPromo", row.convertedBidPromo, "coins"],
        ["chips", row.chips, "coins"],
        ["remainingChips", row.remainingChips, "coins"],
        ["reward", row.reward, "coins"],
        ["amount", row.amount, "coins"],
    ]);
    if (!title || payout <= 0) return null;
    return {
        title,
        rewardAmount: payout,
        rewardDisplay: formatUsd(payout),
        taskType: inferTaskType(title),
        timeLimitText: firstString(row.time_limit, row.timeLimit, row.deadline, row.expiry) || null,
        notes: cleanText(firstString(row.note, row.instructions, row.description)) || null,
        sortOrder: index + 1,
    };
}

function bestNumber(candidates: Array<[string, unknown, "usd" | "coins"]>): number {
    for (const [, value, unit] of candidates) {
        const parsed = toNumber(value);
        if (parsed !== null && parsed > 0) return unit === "usd" ? round(parsed) : coinsToUsd(parsed);
    }
    return 0;
}

function extractLootablyOffers(html: string): Array<Record<string, unknown>> {
    const offers: Array<Record<string, unknown>> = [];
    const marker = '"offers":[';
    const streamChunks = Array.from(html.matchAll(/self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"\]\)<\/script>/g))
        .map((match) => {
            try {
                return JSON.parse(`"${match[1]}"`) as string;
            } catch {
                return "";
            }
        });
    const source = streamChunks.length > 0 ? streamChunks.join("") : html;
    let searchFrom = 0;
    while (searchFrom < source.length) {
        const markerIndex = source.indexOf(marker, searchFrom);
        if (markerIndex < 0) break;
        const arrayStart = source.indexOf("[", markerIndex);
        const arrayEnd = findMatchingBracket(source, arrayStart);
        if (arrayStart < 0 || arrayEnd < 0) break;
        const rawJson = source.slice(arrayStart, arrayEnd + 1);
        try {
            const parsed = JSON.parse(rawJson) as unknown;
            if (Array.isArray(parsed)) {
                for (const item of parsed) {
                    if (isRecord(item) && firstString(item.offerID, item.name)) offers.push(item);
                }
            }
        } catch {
            // Continue scanning. Lootably embeds this inside streamed Next.js script chunks.
        }
        searchFrom = arrayEnd + 1;
    }
    return offers;
}

function findMatchingBracket(value: string, start: number): number {
    if (start < 0 || value[start] !== "[") return -1;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < value.length; index += 1) {
        const char = value[index];
        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (char === "\\") {
                escaped = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }
        if (char === '"') {
            inString = true;
        } else if (char === "[") {
            depth += 1;
        } else if (char === "]") {
            depth -= 1;
            if (depth === 0) return index;
        }
    }
    return -1;
}

async function getRequestCountry(refresh: boolean): Promise<string | null> {
    try {
        const response = await fetch(GAIN_SITE_SETTINGS_URL, {
            headers: buildGainHeaders("https://gain.gg/earn"),
            cache: refresh ? "no-store" : "force-cache",
            next: refresh ? undefined : { revalidate: CACHE_SECONDS, tags: ["gain-site-settings"] },
        });
        if (!response.ok) return null;
        const payload = await response.json() as { data?: { requestCountry?: string } };
        return normalizeGainCountryCode(payload.data?.requestCountry);
    } catch {
        return null;
    }
}

function buildGainHeaders(referer: string): HeadersInit {
    return {
        "User-Agent": process.env.GAIN_API_USER_AGENT?.trim() ||
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "Accept": "application/json, text/html, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://gain.gg",
        "Referer": referer,
    };
}

function buildGainStartUrl({ title, payout, totalPayout, providerName }: { title: string; payout: number; totalPayout: number; providerName: string }): string {
    const params = new URLSearchParams({
        platform_name: "Gain.gg",
        offer_title: title,
        provider_name: providerName,
        payout_usd: String(payout),
        total_payout_usd: String(totalPayout),
        click_location: "gain-gallery-import",
        source_context: "gain-gallery",
    });
    return `${GAIN_PLATFORM_REDIRECT}?${params.toString()}`;
}

function extractAdToWallArticles(html: string): string[] {
    return Array.from(html.matchAll(/<article\b[^>]*class=["'][^"']*\btask\b[^"']*["'][^>]*>[\s\S]*?<\/article>/gi)).map((match) => match[0]);
}

function extractFirstMatch(value: string, regex: RegExp): string | null {
    return regex.exec(value)?.[1] ?? null;
}

function normalizeLimit(value: number | undefined): number {
    if (!Number.isFinite(value)) return DEFAULT_LIMIT;
    return Math.min(MAX_LIMIT, Math.max(1, Math.floor(Number(value))));
}

function normalizePlatforms(value: unknown): GainGalleryOffer["platform"] {
    const raw = Array.isArray(value) ? value.join(" ") : String(value ?? "");
    const lower = raw.toLowerCase();
    const platforms: GainGalleryOffer["platform"] = [];
    if (/\bios\b|iphone|ipad/.test(lower)) platforms.push("iOS");
    if (/android/.test(lower)) platforms.push("Android");
    if (/desktop|web|pc|windows|mac/.test(lower)) platforms.push("Desktop");
    if (platforms.length === 0) platforms.push("Web");
    return Array.from(new Set(platforms));
}

function normalizeProviderName(value: string): string {
    const raw = value.trim();
    if (!raw) return "Gain.gg";
    if (/torox/i.test(raw)) return "Torox";
    return raw;
}

function inferCategory(title: string, description: string | null): string {
    const text = `${title} ${description ?? ""}`.toLowerCase();
    if (/\bsurvey|research\b/.test(text)) return "Survey";
    if (/\bgame|level|city|kingdom|raid|casino\b/.test(text)) return "Game";
    if (/\bbank|credit|cash|deposit|finance|invest\b/.test(text)) return "Finance";
    if (/\binstall|app\b/.test(text)) return "App";
    return "Other";
}

function inferTaskType(value: string): GainGalleryTaskStep["taskType"] {
    const text = value.toLowerCase();
    if (/\bsurvey|research\b/.test(text)) return "survey";
    if (/\binstall|download\b/.test(text)) return "install";
    if (/\bsign up|signup|register|account\b/.test(text)) return "signup";
    if (/\bpurchase|buy|deposit|spend\b/.test(text)) return "purchase";
    if (/\breach|complete|level|chapter|stage|milestone|board|village\b/.test(text)) return "milestone";
    return "other";
}

function extractParentTitle(value: string): string {
    const trimmed = value.trim();
    const [head, tail] = trimmed.split(" - ", 2);
    if (tail && /\b(reach|complete|level|install|purchase|deposit|sign up)\b/i.test(tail)) return head.trim();
    return trimmed;
}

function coinsToUsd(coins: number): number {
    if (!Number.isFinite(coins) || coins <= 0) return 0;
    // Gain displays 1,000 coins as $1.00 across native, RevU, and AdToWall wall data.
    return round(coins / 1000);
}

function parsePoints(value: string): number {
    const normalized = value.replace(/,/g, "");
    const match = normalized.match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : 0;
}

function firstString(...values: unknown[]): string {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) return value.trim();
        if (typeof value === "number" && Number.isFinite(value)) return String(value);
        if (Array.isArray(value)) {
            const nested = firstString(...value);
            if (nested) return nested;
        }
    }
    return "";
}

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number(value.replace(/[$,\s]/g, ""));
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function normalizeHttpUrl(value: string): string | null {
    if (!value) return null;
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
    } catch {
        return null;
    }
}

function cleanText(value: string): string {
    return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function stripTags(value: string | null): string {
    return (value ?? "").replace(/<[^>]+>/g, " ");
}

function decodeHtml(value: string): string {
    return value
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ");
}

function truncate(value: string, maxLength: number): string {
    return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trim()}...`;
}

export function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "gain-offer";
}

function formatUsd(value: number): string {
    return `$${value.toFixed(2)}`;
}

function round(value: number): number {
    return Number(value.toFixed(2));
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
