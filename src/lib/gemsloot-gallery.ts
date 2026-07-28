import "server-only";

const GEMSLOOT_LIST_URL = process.env.GEMSLOOT_LIST_URL?.trim() || "https://gemsloot.com/_api/offer/list";
const GEMSLOOT_PROVIDERS_URL = process.env.GEMSLOOT_PROVIDERS_URL?.trim() || "https://gemsloot.com/_api/offer/providers";
const GEMSLOOT_DETAIL_URL = process.env.GEMSLOOT_DETAIL_URL?.trim() || "https://gemsloot.com/_api/offer/get_offer";
const GEMSLOOT_SITE_URL = process.env.GEMSLOOT_SITE_URL?.trim() || "https://gemsloot.com/transactions";
const DEFAULT_LIMIT = 120;
const MAX_LIMIT = 300;
const ALL_PROVIDER_LIST_LIMIT = 1000;
const PAGE_SIZE = 30;
const CACHE_SECONDS = 60 * 30;

export const FEATURED_GEMSLOOT_OFFER_IDS = [
    "TyrAds__5553",
    "HangMyAds__82544",
    "TyrAds__4884",
    "TyrAds__4922",
    "WaxRewards__10-4513",
] as const;

export type GemslootGalleryOffer = {
    id: string;
    provider: string;
    title: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;
    countryCode: string;
    countries: string[];
    reward: number;
    payout: number;
    totalPayout: number;
    currency: "USD";
    imageUrl: string | null;
    videoUrl: string | null;
    trackingUrl: string | null;
    startUrl: string;
    advertiserName: string | null;
    providerName: string;
    platform: Array<"iOS" | "Android" | "Desktop" | "Web">;
    category: string;
    completionCount: number | null;
    requirements: string[];
    tasks: GemslootGalleryTaskStep[];
    expiresAt: string | null;
    status: "active";
    rawSourceMetadata: {
        source: "gemsloot";
        sourceId: string;
        provider: string;
        advertiserUrlTemplate: string | null;
    };
};

export type GemslootGalleryTaskStep = {
    title: string;
    rewardAmount: number;
    rewardDisplay: string;
    taskType: "install" | "milestone" | "purchase" | "signup" | "survey" | "other";
    timeLimitText: string | null;
    notes: string | null;
    sortOrder: number;
};

export type GemslootGalleryResult = {
    countryCode: string;
    provider: string | null;
    offers: GemslootGalleryOffer[];
    providers: Array<{ name: string; count: number | null; bonus: number | null }>;
    meta: {
        limit: number;
        cacheSeconds: number;
        upstreamCount: number;
    };
};

type GemslootProviderNode = {
    name?: string;
    count?: number;
    bonus?: number;
};

type GemslootListNode = {
    id?: string;
    provider?: string;
    points?: number;
    img?: string;
    video?: string;
    name?: string;
    os?: Record<string, unknown> | null;
    category?: Record<string, unknown> | null;
};

type GemslootListPayload = {
    offers?: GemslootListNode[];
    completed_amount?: number[];
};

type GemslootDetailStep = {
    id?: string;
    name?: string;
    points?: number;
    expire_hours?: number;
};

type GemslootDetailPayload = {
    id?: string;
    provider?: string;
    points?: number;
    img?: string;
    video?: string;
    name?: string;
    os?: Record<string, unknown> | null;
    my_category?: Record<string, unknown> | null;
    dsc?: string | null;
    to_know?: string | null;
    url?: string | null;
    loc?: string[] | null;
    steps?: GemslootDetailStep[] | null;
};

export class GemslootGalleryValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "GemslootGalleryValidationError";
    }
}

export class GemslootGalleryFetchError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "GemslootGalleryFetchError";
        this.status = status;
    }
}

export function normalizeGemslootCountryCode(value: string | null | undefined): string | null {
    const normalized = value?.trim().toUpperCase() ?? "";
    return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

export function normalizeGemslootProvider(value: string | null | undefined): string | null {
    const normalized = cleanText(value ?? "");
    if (!normalized || normalized === "all") return null;
    return normalized;
}

export function normalizeGemslootOfferIds(value: unknown): string[] {
    const rawValues = Array.isArray(value)
        ? value
        : typeof value === "string"
            ? value.split(/[\s,]+/)
            : [];
    return Array.from(
        new Set(
            rawValues
                .map((item) => cleanText(String(item ?? "")))
                .filter((item) => /^[A-Za-z][A-Za-z0-9]*__[A-Za-z0-9_-]+$/.test(item)),
        ),
    );
}

export async function getGemslootGalleryOffers(options: {
    country?: string | null;
    allCountries?: boolean;
    provider?: string | null;
    limit?: number;
    refresh?: boolean;
    search?: string | null;
    device?: string | null;
    offerIds?: string[];
    sort?: "epc" | "completed";
} = {}): Promise<GemslootGalleryResult> {
    const allCountries = options.allCountries === true;
    const countryCode = allCountries ? null : normalizeGemslootCountryCode(options.country) ?? "US";
    const limit = allCountries ? normalizeCatalogLimit(options.limit) : normalizeLimit(options.limit);
    const refresh = options.refresh === true;
    const offerIds = normalizeGemslootOfferIds(options.offerIds);
    const providers = offerIds.length > 0 ? [] : await getGemslootProviders(refresh);
    const provider = normalizeGemslootProvider(options.provider);
    const providerNames = provider ? [provider] : providers.map((item) => item.name);
    const detailRows = offerIds.length > 0
        ? await loadExactOfferDetails({
            offerIds: offerIds.slice(0, limit),
            countryCode,
            refresh,
        })
        : provider
            ? await loadListOfferDetails({
                providerNames,
                search: options.search,
                device: options.device,
                limit,
                countryCode,
                refresh,
            })
            : await loadAllProviderListOfferDetails({
            providerNames,
            search: options.search,
            device: options.device,
            limit,
            countryCode,
            refresh,
        });

    const offers = detailRows
        .filter((offer): offer is GemslootGalleryOffer => Boolean(offer))
        .filter((offer) => allCountries || offer.countries.includes(countryCode ?? ""))
        .sort((left, right) => {
            if (offerIds.length > 0) {
                return offerIds.indexOf(left.id) - offerIds.indexOf(right.id);
            }
            if (options.sort === "completed") {
                return (right.completionCount ?? 0) - (left.completionCount ?? 0);
            }
            return right.totalPayout - left.totalPayout;
        })
        .slice(0, limit);

    return {
        countryCode: countryCode ?? "ALL",
        provider,
        offers,
        providers,
        meta: {
            limit,
            cacheSeconds: refresh ? 0 : CACHE_SECONDS,
            upstreamCount: detailRows.length,
        },
    };
}

async function loadExactOfferDetails({
    offerIds,
    countryCode,
    refresh,
}: {
    offerIds: string[];
    countryCode: string | null;
    refresh: boolean;
}) {
    return mapWithConcurrency(offerIds, 5, async (offerId) => {
        const detail = await fetchOfferDetail(offerId, refresh).catch((error) => {
            console.warn("[gemsloot-gallery] exact detail fetch failed", {
                offerId,
                message: error instanceof Error ? error.message : String(error),
            });
            return null;
        });
        return normalizeGemslootOffer(detailToListNode(detail, offerId), detail, {
            countryCode,
            completionCount: null,
        });
    });
}

async function loadListOfferDetails({
    providerNames,
    search,
    device,
    limit,
    countryCode,
    refresh,
}: {
    providerNames: string[];
    search?: string | null;
    device?: string | null;
    limit: number;
    countryCode: string | null;
    refresh: boolean;
}) {
    const listRows = await fetchListRows({
        providerNames,
        search,
        device,
        limit,
        refresh,
    });

    return mapWithConcurrency(listRows.slice(0, limit), 8, async (entry) => {
        const detail = await fetchOfferDetail(entry.offer.id, refresh).catch((error) => {
            console.warn("[gemsloot-gallery] detail fetch failed", {
                offerId: entry.offer.id,
                message: error instanceof Error ? error.message : String(error),
            });
            return null;
        });
        return normalizeGemslootOffer(entry.offer, detail, {
            countryCode,
            completionCount: entry.completionCount,
        });
    });
}

async function loadAllProviderListOfferDetails({
    providerNames,
    search,
    device,
    limit,
    countryCode,
    refresh,
}: {
    providerNames: string[];
    search?: string | null;
    device?: string | null;
    limit: number;
    countryCode: string | null;
    refresh: boolean;
}) {
    const providerRows = await mapWithConcurrency(providerNames, 3, (providerName) => (
        loadListOfferDetails({
            providerNames: [providerName],
            search,
            device,
            limit: ALL_PROVIDER_LIST_LIMIT,
            countryCode,
            refresh,
        })
    ));

    return dedupeGemslootOffers(providerRows.flat());
}

function dedupeGemslootOffers(offers: Array<GemslootGalleryOffer | null>) {
    const byId = new Map<string, GemslootGalleryOffer>();
    for (const offer of offers) {
        if (!offer?.id) continue;
        const existing = byId.get(offer.id);
        if (!existing || offer.totalPayout > existing.totalPayout) {
            byId.set(offer.id, offer);
        }
    }
    return Array.from(byId.values());
}

async function getGemslootProviders(refresh: boolean): Promise<Array<{ name: string; count: number | null; bonus: number | null }>> {
    const response = await fetch(GEMSLOOT_PROVIDERS_URL, {
        headers: buildGemslootHeaders(),
        cache: refresh ? "no-store" : "force-cache",
        next: refresh ? undefined : { revalidate: CACHE_SECONDS, tags: ["gemsloot-providers"] },
    });
    if (!response.ok) throw new GemslootGalleryFetchError(`Gemsloot provider request failed with status ${response.status}`, response.status);

    const payload = await response.json() as GemslootProviderNode[];
    return (Array.isArray(payload) ? payload : [])
        .map((item) => ({
            name: cleanText(item.name ?? ""),
            count: Number.isFinite(item.count) ? Number(item.count) : null,
            bonus: Number.isFinite(item.bonus) ? Number(item.bonus) : null,
        }))
        .filter((item) => item.name);
}

async function fetchListRows(options: {
    providerNames: string[];
    search?: string | null;
    device?: string | null;
    limit: number;
    refresh: boolean;
}): Promise<Array<{ offer: GemslootListNode; completionCount: number | null }>> {
    const rows: Array<{ offer: GemslootListNode; completionCount: number | null }> = [];
    const maxPages = Math.ceil(options.limit / PAGE_SIZE) + 2;
    const os = normalizeOsFilter(options.device);

    for (let page = 0; page < maxPages && rows.length < options.limit; page += 1) {
        const body: Record<string, unknown> = {
            search: [options.search?.trim() || ""],
            filter: "epc",
            categorie: "all",
            page,
            provider: options.providerNames,
        };
        if (os.length > 0) body.os = os;

        const response = await fetch(GEMSLOOT_LIST_URL, {
            method: "POST",
            headers: buildGemslootHeaders(),
            body: JSON.stringify(body),
            cache: options.refresh ? "no-store" : "force-cache",
            next: options.refresh ? undefined : { revalidate: CACHE_SECONDS, tags: ["gemsloot-list"] },
        });
        if (!response.ok) throw new GemslootGalleryFetchError(`Gemsloot list request failed with status ${response.status}`, response.status);

        const payload = await response.json() as GemslootListPayload;
        const offers = Array.isArray(payload.offers) ? payload.offers : [];
        const completed = Array.isArray(payload.completed_amount) ? payload.completed_amount : [];
        for (let index = 0; index < offers.length; index += 1) {
            rows.push({
                offer: offers[index],
                completionCount: Number.isFinite(completed[index]) ? Number(completed[index]) : null,
            });
        }

        if (offers.length < PAGE_SIZE) break;
    }

    return rows;
}

async function fetchOfferDetail(offerId: string | undefined, refresh: boolean): Promise<GemslootDetailPayload | null> {
    if (!offerId) return null;
    const response = await fetch(`${GEMSLOOT_DETAIL_URL}/${encodeURIComponent(offerId)}`, {
        headers: buildGemslootHeaders(),
        cache: refresh ? "no-store" : "force-cache",
        next: refresh ? undefined : { revalidate: CACHE_SECONDS, tags: [`gemsloot-detail-${offerId}`] },
    });
    if (!response.ok) throw new GemslootGalleryFetchError(`Gemsloot detail request failed with status ${response.status}`, response.status);

    const payload = await response.json() as GemslootDetailPayload;
    return payload?.id ? payload : null;
}

function normalizeGemslootOffer(
    list: GemslootListNode,
    detail: GemslootDetailPayload | null,
    context: { countryCode: string | null; completionCount: number | null },
): GemslootGalleryOffer | null {
    const id = cleanText(detail?.id ?? list.id ?? "");
    const title = cleanText(detail?.name ?? list.name ?? "");
    const provider = cleanText(detail?.provider ?? list.provider ?? "Gemsloot") || "Gemsloot";
    const totalPayout = round(toPositiveNumber(detail?.points ?? list.points));
    const tasks = normalizeTasks(detail?.steps);
    const bestTaskPayout = tasks.reduce((max, task) => Math.max(max, task.rewardAmount), 0);
    const payout = bestTaskPayout > 0 ? bestTaskPayout : totalPayout;
    const countries = normalizeCountries(detail?.loc);
    const countryCode = context.countryCode && countries.includes(context.countryCode)
        ? context.countryCode
        : countries[0] ?? context.countryCode ?? "XX";
    const description = cleanText(detail?.dsc ?? detail?.to_know ?? "");

    if (!id || !title || totalPayout <= 0) return null;

    const modalUrl = buildGemslootOfferModalUrl(id);

    return {
        id,
        provider,
        title,
        slug: slugify(title),
        description: description || null,
        shortDescription: description ? truncate(description, 150) : null,
        countryCode,
        countries,
        reward: payout,
        payout,
        totalPayout,
        currency: "USD",
        imageUrl: cleanText(detail?.img ?? list.img ?? "") || null,
        videoUrl: cleanText(detail?.video ?? list.video ?? "") || null,
        trackingUrl: modalUrl,
        startUrl: modalUrl,
        advertiserName: title,
        providerName: provider,
        platform: normalizePlatforms(detail?.os ?? list.os),
        category: extractCategories(detail?.my_category ?? list.category),
        completionCount: context.completionCount,
        requirements: tasks.map((task) => task.title),
        tasks,
        expiresAt: null,
        status: "active",
        rawSourceMetadata: {
            source: "gemsloot",
            sourceId: id,
            provider,
            advertiserUrlTemplate: normalizeHttpUrl(detail?.url ?? "")?.includes("CLICKID") ? detail?.url ?? null : null,
        },
    };
}

function detailToListNode(detail: GemslootDetailPayload | null, fallbackId: string): GemslootListNode {
    return {
        id: detail?.id ?? fallbackId,
        provider: detail?.provider,
        points: detail?.points,
        img: detail?.img,
        video: detail?.video,
        name: detail?.name,
        os: detail?.os,
        category: detail?.my_category,
    };
}

function buildGemslootOfferModalUrl(offerId: string): string {
    const url = new URL(GEMSLOOT_SITE_URL);
    url.searchParams.set("modal", "offer_3");
    url.searchParams.set("name", offerId);
    url.searchParams.set("aff", "kamedev");
    return url.toString();
}

function normalizeTasks(steps: GemslootDetailStep[] | null | undefined): GemslootGalleryTaskStep[] {
    if (!Array.isArray(steps)) return [];
    return steps
        .map((step, index) => {
            const title = cleanText(step.name ?? "");
            const rewardAmount = round(toPositiveNumber(step.points));
            if (!title || rewardAmount < 0) return null;
            const normalizedTask: GemslootGalleryTaskStep = {
                title,
                rewardAmount,
                rewardDisplay: formatUsd(rewardAmount),
                taskType: inferTaskType(title),
                timeLimitText: formatExpireHours(step.expire_hours),
                notes: null,
                sortOrder: index + 1,
            };
            return normalizedTask;
        })
        .filter((task): task is GemslootGalleryTaskStep => Boolean(task));
}

function normalizeCountries(value: unknown): string[] {
    if (!Array.isArray(value)) return ["US"];
    const countries = value
        .map((item) => cleanText(String(item ?? "")).toUpperCase())
        .filter((item) => /^[A-Z]{2}$/.test(item));
    return countries.length > 0 ? Array.from(new Set(countries)) : ["US"];
}

function normalizePlatforms(value: Record<string, unknown> | null | undefined): GemslootGalleryOffer["platform"] {
    const keys = value && typeof value === "object" ? Object.keys(value).map((item) => item.toLowerCase()) : [];
    const platforms: GemslootGalleryOffer["platform"] = [];
    if (keys.includes("ios")) platforms.push("iOS");
    if (keys.includes("android")) platforms.push("Android");
    if (keys.some((item) => ["windows", "mac", "desktop", "pc"].includes(item))) platforms.push("Desktop");
    if (keys.includes("web")) platforms.push("Web");
    if (platforms.length === 0) platforms.push("Web");
    return Array.from(new Set(platforms));
}

function normalizeOsFilter(value: string | null | undefined): string[] {
    const device = value?.trim().toLowerCase() ?? "";
    if (!device) return [];
    if (device === "ios" || device === "iphone" || device === "ipad") return ["ios"];
    if (device === "android") return ["android"];
    if (["desktop", "pc", "windows"].includes(device)) return ["windows"];
    if (device === "mac") return ["mac"];
    return [];
}

function extractCategories(value: Record<string, unknown> | null | undefined): string {
    if (!value || typeof value !== "object") return "Other";
    const keys = Object.keys(value).map((item) => cleanText(item)).filter(Boolean);
    return keys.length > 0 ? keys.join(", ") : "Other";
}

function inferTaskType(value: string): GemslootGalleryTaskStep["taskType"] {
    const text = value.toLowerCase();
    if (/\bsurvey|research\b/.test(text)) return "survey";
    if (/\binstall|download\b/.test(text)) return "install";
    if (/\bsign up|signup|register|account\b/.test(text)) return "signup";
    if (/\bpurchase|buy|deposit|spend|recharge|pack\b/.test(text)) return "purchase";
    if (/\breach|complete|level|chapter|stage|milestone|board|village|tutorial\b/.test(text)) return "milestone";
    return "other";
}

function formatExpireHours(value: number | undefined): string | null {
    if (!Number.isFinite(value) || Number(value) <= 0) return null;
    const hours = Number(value);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"}`;
}

function buildGemslootHeaders(): Record<string, string> {
    return {
        accept: "application/json, text/plain, */*",
        origin: "https://gemsloot.com",
        referer: "https://gemsloot.com/earn/all",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/147.0.0.0 Safari/537.36",
        "content-type": "application/json",
    };
}

function normalizeLimit(value: number | undefined): number {
    if (!Number.isFinite(value)) return DEFAULT_LIMIT;
    return Math.min(MAX_LIMIT, Math.max(1, Math.floor(Number(value))));
}

function normalizeCatalogLimit(value: number | undefined): number {
    if (!Number.isFinite(value)) return 5000;
    return Math.min(5000, Math.max(1, Math.floor(Number(value))));
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = [];
    let index = 0;
    const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
        for (;;) {
            const current = index;
            index += 1;
            if (current >= items.length) return;
            results[current] = await mapper(items[current]);
        }
    });
    await Promise.all(workers);
    return results;
}

function toPositiveNumber(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
    if (typeof value === "string") {
        const parsed = Number(value.replace(/[$,\s]/g, ""));
        return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    }
    return 0;
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
    return decodeHtml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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
        .slice(0, 80) || "gemsloot-offer";
}

function formatUsd(value: number): string {
    return `$${value.toFixed(2)}`;
}

function round(value: number): number {
    return Number(value.toFixed(2));
}
