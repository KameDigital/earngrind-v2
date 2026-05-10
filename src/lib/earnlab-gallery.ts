import "server-only";
import {
    EARNLAB_COUNTRY_NAMES,
    EARNLAB_GALLERY_COUNTRIES,
    getEarnLabCountryName,
    isSupportedEarnLabCountry,
    normalizeEarnLabCountryCode,
} from "@/lib/earnlab-countries";

const EARNLAB_API_BASE = process.env.EARNLAB_API_BASE?.trim() || "https://api.earnlab.com";
const EARNLAB_TASKS_API_URL = process.env.EARNLAB_TASKS_API_URL?.trim() || `${EARNLAB_API_BASE}/tasks`;
const EARNLAB_TASKS_PAGE_URL = "https://earnlab.com/tasks";
const EARNLAB_PLATFORM_REDIRECT = "/go/platform/earnlab";
const DEFAULT_SORT = "POPULARITY";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 75;
const CACHE_SECONDS = 60 * 30;

export {
    EARNLAB_COUNTRY_NAMES,
    EARNLAB_GALLERY_COUNTRIES,
    getEarnLabCountryName,
    isSupportedEarnLabCountry,
    normalizeEarnLabCountryCode,
};

export type EarnLabGalleryTask = {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;
    countryCode: string;
    reward: number;
    payout: number;
    currency: "USD";
    imageUrl: string | null;
    trackingUrl: string | null;
    startUrl: string;
    advertiserName: string | null;
    providerName: string;
    platform: Array<"iOS" | "Android" | "Desktop" | "Web">;
    category: string;
    difficulty: string | null;
    estimatedTime: string | null;
    requirements: string[];
    tasks: EarnLabGalleryTaskStep[];
    expiresAt: string | null;
    status: "active";
    rawSourceMetadata: {
        source: "earnlab";
        sourceId: string;
        provider: string | null;
        category: string | null;
        customCategory: string | null;
        isDesktop: boolean;
        isAndroid: boolean;
        isIOS: boolean;
    };
};

export type EarnLabGalleryTaskStep = {
    title: string;
    rewardAmount: number;
    rewardDisplay: string;
    taskType: "install" | "milestone" | "purchase" | "signup" | "other";
    timeLimitText: string | null;
    notes: string | null;
    sortOrder: number;
};

type EarnLabTasksApiResponse = {
    success?: boolean;
    data?: {
        items?: EarnLabTaskSummary[];
        totalItems?: number | null;
        totalPages?: number | null;
    } | null;
};

type EarnLabTaskSummary = {
    id?: string | null;
    name?: string | null;
    provider?: string | null;
    description?: string | null;
    thumbnail?: string | null;
    reward?: number | null;
    category?: string | null;
    customCategory?: string | null;
    isDesktop?: boolean | null;
    isAndroid?: boolean | null;
    isIOS?: boolean | null;
};

export type EarnLabGalleryResult = {
    countryCode: string;
    countryName: string;
    offers: EarnLabGalleryTask[];
    meta: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        cacheSeconds: number;
    };
};

export async function getEarnLabGalleryTasksByCountry(
    countryCode: string,
    options: {
        page?: number;
        limit?: number;
        refresh?: boolean;
        sort?: string;
    } = {},
): Promise<EarnLabGalleryResult> {
    const country = normalizeEarnLabCountryCode(countryCode);
    if (!country) {
        throw new EarnLabGalleryValidationError("Invalid country code. Use a two-letter ISO-style value such as US, GB, CA, or AU.");
    }

    const page = normalizePage(options.page);
    const limit = normalizeLimit(options.limit);
    const sort = options.sort?.trim() || DEFAULT_SORT;
    const url = new URL(EARNLAB_TASKS_API_URL);
    url.searchParams.set("country", country);
    url.searchParams.set("sort", sort);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: buildEarnLabGalleryHeaders(country),
        cache: options.refresh ? "no-store" : "force-cache",
        next: options.refresh ? undefined : {
            revalidate: CACHE_SECONDS,
            tags: [`earnlab-gallery-${country}`],
        },
    });

    if (!response.ok) {
        throw new EarnLabGalleryFetchError(`EarnLab gallery request failed with status ${response.status}`, response.status);
    }

    const payload = await response.json() as EarnLabTasksApiResponse;
    const items = Array.isArray(payload.data?.items) ? payload.data.items : [];
    const offers = items
        .map((item) => normalizeEarnLabGalleryTask(item, country))
        .filter((item): item is EarnLabGalleryTask => Boolean(item));

    return {
        countryCode: country,
        countryName: getEarnLabCountryName(country),
        offers,
        meta: {
            page,
            limit,
            totalItems: Number(payload.data?.totalItems ?? offers.length),
            totalPages: Number(payload.data?.totalPages ?? (offers.length < limit ? page + 1 : page + 2)),
            cacheSeconds: options.refresh ? 0 : CACHE_SECONDS,
        },
    };
}

export class EarnLabGalleryValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "EarnLabGalleryValidationError";
    }
}

export class EarnLabGalleryFetchError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "EarnLabGalleryFetchError";
        this.status = status;
    }
}

function normalizeEarnLabGalleryTask(task: EarnLabTaskSummary, countryCode: string): EarnLabGalleryTask | null {
    const id = task.id?.trim() ?? "";
    const title = normalizeWhitespace(task.name ?? "");
    const payout = toEarnLabUsd(task.reward);

    if (!id || !title || payout <= 0) {
        return null;
    }

    const description = normalizeWhitespace(task.description ?? "") || null;
    const providerName = normalizeEarnLabProviderName(task.provider);
    const platforms = normalizeEarnLabPlatforms(task);
    const category = normalizeEarnLabCategory(task.category, task.customCategory);
    const shortDescription = description ? truncateSentence(description, 150) : null;
    const inferredSteps = buildEarnLabGalleryTaskSteps(title, payout, description);
    const startUrl = buildEarnLabGalleryStartUrl({
        title,
        countryCode,
        payout,
        providerName,
    });

    return {
        id,
        title,
        slug: slugify(title),
        description,
        shortDescription,
        countryCode,
        reward: Number(task.reward ?? 0),
        payout,
        currency: "USD",
        imageUrl: isHttpUrl(task.thumbnail) ? task.thumbnail!.trim() : null,
        trackingUrl: null,
        startUrl,
        advertiserName: title,
        providerName,
        platform: platforms,
        category,
        difficulty: inferDifficulty(description, payout),
        estimatedTime: extractEstimatedTime(description),
        requirements: extractEarnLabRequirements(description),
        tasks: inferredSteps,
        expiresAt: null,
        status: "active",
        rawSourceMetadata: {
            source: "earnlab",
            sourceId: id,
            provider: task.provider ?? null,
            category: task.category ?? null,
            customCategory: task.customCategory ?? null,
            isDesktop: Boolean(task.isDesktop),
            isAndroid: Boolean(task.isAndroid),
            isIOS: Boolean(task.isIOS),
        },
    };
}

function buildEarnLabGalleryHeaders(countryCode: string): HeadersInit {
    const headers: Record<string, string> = {
        "User-Agent": process.env.EARNLAB_API_USER_AGENT?.trim() ||
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://earnlab.com",
        "Referer": `${EARNLAB_TASKS_PAGE_URL}?country=${countryCode}`,
    };

    const cookie = process.env.EARNLAB_API_COOKIE?.trim();
    if (cookie) headers.Cookie = cookie;

    const authorization = process.env.EARNLAB_API_AUTHORIZATION?.trim();
    if (authorization) headers.Authorization = authorization;

    return headers;
}

function buildEarnLabGalleryStartUrl({
    title,
    countryCode,
    payout,
    providerName,
}: {
    title: string;
    countryCode: string;
    payout: number;
    providerName: string;
}): string {
    const params = new URLSearchParams({
        platform_name: "EarnLab",
        offer_title: title,
        provider_name: providerName,
        payout_usd: String(payout),
        total_payout_usd: String(payout),
        click_location: `earnlab-country-${countryCode.toLowerCase()}`,
        source_context: "earnlab-gallery-country-page",
    });

    return `${EARNLAB_PLATFORM_REDIRECT}?${params.toString()}`;
}

function normalizePage(value: number | undefined): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.floor(Number(value)));
}

function normalizeLimit(value: number | undefined): number {
    if (!Number.isFinite(value)) return DEFAULT_LIMIT;
    return Math.min(MAX_LIMIT, Math.max(1, Math.floor(Number(value))));
}

function toEarnLabUsd(reward: number | null | undefined): number {
    if (!Number.isFinite(reward)) return 0;
    // EarnLab's frontend applies the USD display rate 0.00100000 to raw reward units.
    return round(Number(reward) / 1000);
}

function normalizeEarnLabPlatforms(task: EarnLabTaskSummary): Array<"iOS" | "Android" | "Desktop" | "Web"> {
    const platforms: Array<"iOS" | "Android" | "Desktop" | "Web"> = [];
    if (task.isIOS) platforms.push("iOS");
    if (task.isAndroid) platforms.push("Android");
    if (task.isDesktop) platforms.push("Desktop");
    if (platforms.length === 0) platforms.push("Web");
    return platforms;
}

function normalizeEarnLabCategory(category?: string | null, customCategory?: string | null): string {
    const raw = `${category ?? ""} ${customCategory ?? ""}`.trim().toLowerCase();
    if (!raw) return "Other";
    if (raw.includes("game")) return "Game";
    if (raw.includes("survey")) return "Survey";
    if (raw.includes("shop")) return "Shopping";
    if (raw.includes("finance")) return "Finance";
    return raw.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function normalizeEarnLabProviderName(provider?: string | null): string {
    const value = (provider ?? "").trim();
    if (!value) return "EarnLab";

    const directMap: Record<string, string> = {
        EARN_LAB: "EarnLab",
        OFFERTORO: "OfferToro",
        TOROX: "Torox",
        MY_APP_FREE: "MyAppFree",
        AYE_T: "ayeT-Studios",
        REVENUE_UNIVERSE: "Revenue Universe",
        REVU: "Revenue Universe",
        ADGATE_MEDIA: "AdGate Media",
    };

    return directMap[value] ??
        value
            .toLowerCase()
            .split(/[_\s-]+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");
}

export function buildEarnLabGalleryTaskSteps(
    title: string,
    payout: number,
    description: string | null,
): EarnLabGalleryTaskStep[] {
    const fragments = splitEarnLabDescription(description);
    const timeLimitText = extractEstimatedTime(description);

    return fragments.map((fragment, index) => {
        const isFinalStep = index === fragments.length - 1;
        return {
            title: inferStepTitle(fragment, title),
            rewardAmount: isFinalStep ? payout : 0,
            rewardDisplay: isFinalStep ? formatUsd(payout) : "$0.00",
            taskType: inferTaskType(fragment),
            timeLimitText: extractEstimatedTime(fragment) ?? timeLimitText,
            notes: fragment,
            sortOrder: index + 1,
        };
    });
}

export function extractEarnLabRequirements(description: string | null): string[] {
    const fragments = splitEarnLabDescription(description);
    if (fragments.length === 0) return [];

    const requirements = new Set<string>();
    for (const fragment of fragments) {
        const cleaned = normalizeWhitespace(fragment.replace(/^[0-9]+[.)]\s*/, ""));
        if (!cleaned) continue;

        requirements.add(cleaned);

        const timeLimit = extractEstimatedTime(cleaned);
        if (timeLimit) requirements.add(`Complete within ${timeLimit}`);
        if (/\bnew (?:players?|users?|customers?) only\b/i.test(cleaned)) requirements.add("New users only");
        if (/\b(?:purchase|buy|deposit|spend|subscription|subscribe)\b/i.test(cleaned)) requirements.add("May require spending or a paid action");
        if (/\b(?:install|download)\b/i.test(cleaned)) requirements.add("Install from the tracked EarnLab or offerwall link");
        if (/\b(?:register|sign up|signup|create an account)\b/i.test(cleaned)) requirements.add("Register through the tracked flow");
    }

    return Array.from(requirements).slice(0, 8);
}

function splitEarnLabDescription(description: string | null): string[] {
    const value = normalizeWhitespace(description ?? "");
    if (!value) return [];

    const numberedMatches = Array.from(value.matchAll(/(?:^|\s)(\d{1,2})[.)]\s+(.+?)(?=\s+\d{1,2}[.)]\s+|$)/g))
        .map((match) => normalizeWhitespace(match[2] ?? ""))
        .filter(Boolean);
    if (numberedMatches.length > 1) {
        return numberedMatches.slice(0, 8);
    }

    const sentenceParts = value
        .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
        .map(normalizeWhitespace)
        .filter(Boolean);
    if (sentenceParts.length > 1) {
        return sentenceParts.slice(0, 6);
    }

    const clauseParts = value
        .split(/\s+(?:then|and then|after that)\s+/i)
        .map(normalizeWhitespace)
        .filter(Boolean);

    return clauseParts.length > 1 ? clauseParts.slice(0, 6) : [value];
}

function inferStepTitle(fragment: string, fallbackTitle: string): string {
    const text = fragment.toLowerCase();
    const levelMatch = fragment.match(/\breach\s+(?:level|lvl)\s+([0-9A-Za-z-]+)/i);
    if (levelMatch) return `Reach level ${levelMatch[1]}`;

    const chapterMatch = fragment.match(/\b(?:complete|finish|reach)\s+chapter\s+([0-9A-Za-z-]+)/i);
    if (chapterMatch) return `Complete chapter ${chapterMatch[1]}`;

    const stageMatch = fragment.match(/\b(?:complete|finish|reach)\s+stage\s+([0-9A-Za-z-]+)/i);
    if (stageMatch) return `Complete stage ${stageMatch[1]}`;

    const worthMatch = fragment.match(/\bcomplete a task worth at least\s+\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
    if (worthMatch) return `Complete a task worth at least $${worthMatch[1]}`;

    const earnOnMatch = fragment.match(/\bearn\s+\$?\s*([0-9]+(?:\.[0-9]{1,2})?)\s+on\s+(.+?)(?:[.!]|$)/i);
    if (earnOnMatch) return `Earn $${earnOnMatch[1]} on ${normalizeWhitespace(earnOnMatch[2] ?? "")}`;

    if (/\b(?:install|download)\b/.test(text)) return "Install and open through the tracked link";
    if (/\b(?:register|sign up|signup|create an account)\b/.test(text)) return "Register through the tracked flow";
    if (/\b(?:purchase|buy|deposit|spend|subscription|subscribe)\b/.test(text)) return "Complete the required paid action";
    if (/\b(?:within|in)\s+\d{1,3}\s+(?:minutes?|hours?|days?|weeks?)\b/i.test(fragment)) return "Complete before the deadline";
    if (/\bcomplete\b/.test(text)) return "Complete the listed requirement";

    return truncateSentence(fragment || fallbackTitle, 80);
}

function inferTaskType(value: string | null): EarnLabGalleryTaskStep["taskType"] {
    const text = value?.toLowerCase() ?? "";
    if (/\binstall|download\b/.test(text)) return "install";
    if (/\bsign up|signup|register|account\b/.test(text)) return "signup";
    if (/\bpurchase|buy|deposit|spend\b/.test(text)) return "purchase";
    if (/\breach|complete|level|chapter|stage|milestone|board|village\b/.test(text)) return "milestone";
    return "other";
}

function inferDifficulty(description: string | null, payout: number): string | null {
    const text = description?.toLowerCase() ?? "";
    if (payout >= 150 || /\blimited time|30 days|level|milestone|purchase\b/.test(text)) return "Medium";
    if (payout >= 50) return "Easy-Medium";
    return "Easy";
}

function extractEstimatedTime(value: string | null): string | null {
    const match = value?.match(/\b(?:in|within|under)?\s*(\d{1,3})\s*(minutes?|hours?|days?|weeks?)\b/i);
    return match ? `${match[1]} ${match[2].toLowerCase()}` : null;
}

function normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

function truncateSentence(value: string, maxLength: number): string {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 1).trim()}...`;
}

export function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}

function isHttpUrl(value: string | null | undefined): boolean {
    if (!value) return false;
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

function formatUsd(value: number): string {
    return `$${value.toFixed(2)}`;
}

function round(value: number): number {
    return Number(value.toFixed(2));
}
