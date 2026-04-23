import { readFile } from "node:fs/promises";
import axios from "axios";
import { SourceAdapter } from "../models/source";
import { logger } from "../core/logger";
import { SourceOffer } from "../types/offer";

const DEFAULT_GEMSLOOT_LIST_URL = "https://gemsloot.com/_api/offer/list";
const DEFAULT_GEMSLOOT_PROVIDERS_URL = "https://gemsloot.com/_api/offer/providers";
const DEFAULT_GEMSLOOT_DETAIL_URL = "https://gemsloot.com/_api/offer/get_offer";
const DEFAULT_GEMSLOOT_SITE_URL = "https://gemsloot.com/earn";
const DEFAULT_PAGE_SIZE = 30;
const DEFAULT_DETAIL_CONCURRENCY = 8;

const MOCK_OFFERS: SourceOffer[] = [
    {
        external_id: "Gemsloot__105",
        title: "Raid Shadow Legends 2026 (Exclusive)",
        payout_raw: "327.35",
        currency: "USD",
        device_raw: "pc",
        category_raw: "game",
        url: "https://gemsloot.com/earn?modal=offer_2&name=Gemsloot__105",
        expires_raw: null,
        game_slug: buildGameSlug("Raid Shadow Legends 2026 (Exclusive)", "Gemsloot__105"),
        countries_raw: ["US"],
        game_title: "Raid Shadow Legends 2026 (Exclusive)",
        provider_name: "Gemsloot",
        image_url: "https://img.gemsloot.com/offer/raid_2.avif",
        total_payout_raw: "327.35",
        best_payout_usd: 180,
        task_list: [
            {
                title: "Register on Game",
                reward_amount_usd: 0.15,
                reward_display: "$0.15",
                task_type: "signup",
                time_limit_text: null,
                notes: null,
                sort_order: 1,
            },
            {
                title: "Reach Level 25",
                reward_amount_usd: 45,
                reward_display: "$45.00",
                task_type: "milestone",
                time_limit_text: "30 days",
                notes: null,
                sort_order: 2,
            },
            {
                title: "Purchase pack",
                reward_amount_usd: 180,
                reward_display: "$180.00",
                task_type: "purchase",
                time_limit_text: null,
                notes: null,
                sort_order: 3,
            },
        ],
    },
];

interface HarEntry {
    request?: {
        method?: string;
        url?: string;
        postData?: {
            text?: string;
        };
    };
    response?: {
        status?: number;
        content?: {
            text?: string;
            encoding?: string;
        };
    };
}

interface GemslootListRequest {
    search?: string[];
    filter?: string;
    categorie?: string;
    os?: string[];
    page?: number;
    provider?: string[];
}

interface GemslootProviderNode {
    name?: string;
    count?: number;
}

interface GemslootListNode {
    id?: string;
    provider?: string;
    points?: number;
    img?: string;
    name?: string;
    os?: Record<string, unknown> | null;
    category?: Record<string, unknown> | null;
}

interface GemslootListPayload {
    offers?: GemslootListNode[];
}

interface GemslootDetailStep {
    id?: string;
    name?: string;
    points?: number;
    expire_hours?: number;
}

interface GemslootDetailPayload {
    id?: string;
    provider?: string;
    points?: number;
    img?: string;
    name?: string;
    os?: Record<string, unknown> | null;
    my_category?: Record<string, unknown> | null;
    url?: string;
    loc?: string[] | null;
    steps?: GemslootDetailStep[] | null;
}

export const gemslootSource: SourceAdapter = {
    key: "gemsloot",
    name: "Gemsloot",
    type: "api",
    baseUrl: DEFAULT_GEMSLOOT_LIST_URL,
    storage: "site_offers",
    mockEnvVar: "GEMSLOOT_USE_MOCK",
    fetchOffers,
};

export async function fetchOffers(): Promise<SourceOffer[]> {
    const useMock = (process.env.GEMSLOOT_USE_MOCK ?? "false").toLowerCase() === "true";
    if (useMock) {
        logger.info("Gemsloot source using mock offers", { count: MOCK_OFFERS.length });
        return [...MOCK_OFFERS];
    }

    const siteUrl = process.env.GEMSLOOT_SITE_URL?.trim() || DEFAULT_GEMSLOOT_SITE_URL;
    const harFile = process.env.GEMSLOOT_HAR_FILE?.trim();

    const offers = harFile
        ? await loadOffersFromHar(harFile, siteUrl)
        : await loadOffersFromApi(siteUrl);

    logger.info("Gemsloot parsed offers", {
        mode: harFile ? "har" : "live",
        parsedCount: offers.length,
    });

    if (offers.length === 0) {
        throw new Error("Gemsloot parsed 0 offers.");
    }

    const enrichTasks = (process.env.GEMSLOOT_ENRICH_TASKS ?? "true").toLowerCase() !== "false";
    const enriched = enrichTasks ? await enrichOffersWithDetails(offers, siteUrl) : offers;

    return enriched.sort(compareOffers);
}

async function loadOffersFromHar(harFile: string, siteUrl: string): Promise<SourceOffer[]> {
    const body = await readFile(harFile, "utf8");
    const parsed = JSON.parse(body) as { log?: { entries?: HarEntry[] } };
    const entries = parsed.log?.entries ?? [];
    const offers = new Map<string, SourceOffer>();

    const listEntries = entries.filter(
        (entry) =>
            entry.request?.method === "POST" &&
            entry.request?.url === DEFAULT_GEMSLOOT_LIST_URL,
    );

    for (const entry of listEntries) {
        const request = parseRequest(entry.request?.postData?.text);
        if (!shouldUseEntry(request)) {
            continue;
        }

        const responseText = getHarContentText(entry.response?.content);
        if (!responseText) {
            continue;
        }

        const payload = parseListPayload(responseText);
        if (!payload?.offers?.length) {
            continue;
        }

        const page = typeof request?.page === "number" ? request.page : 0;
        logger.info("Gemsloot HAR page extracted", {
            page,
            categorie: request?.categorie ?? null,
            providers: request?.provider?.length ?? 0,
            offerCount: payload.offers.length,
        });

        for (const node of payload.offers) {
            const offer = parseListOffer(node, siteUrl);
            if (offer) {
                offers.set(offer.external_id, offer);
            }
        }
    }

    return Array.from(offers.values());
}

async function loadOffersFromApi(siteUrl: string): Promise<SourceOffer[]> {
    const providers = await fetchProviderNames();
    const maxPages = toPositiveInteger(process.env.GEMSLOOT_MAX_PAGES);
    const offers = new Map<string, SourceOffer>();

    for (let page = 0; ; page += 1) {
        if (maxPages !== null && page >= maxPages) {
            break;
        }

        const payload = await fetchListPage(page, providers);
        const nodes = payload.offers ?? [];

        logger.info("Gemsloot live page extracted", {
            page,
            providers: providers.length,
            offerCount: nodes.length,
        });

        if (nodes.length === 0) {
            break;
        }

        for (const node of nodes) {
            const offer = parseListOffer(node, siteUrl);
            if (offer) {
                offers.set(offer.external_id, offer);
            }
        }

        if (nodes.length < DEFAULT_PAGE_SIZE) {
            break;
        }
    }

    return Array.from(offers.values());
}

async function fetchProviderNames(): Promise<string[]> {
    const filter = parseCsv(process.env.GEMSLOOT_PROVIDER_FILTER);
    if (filter.length > 0) {
        return filter;
    }

    const response = await axios.get<GemslootProviderNode[]>(DEFAULT_GEMSLOOT_PROVIDERS_URL, {
        headers: buildJsonHeaders(),
        timeout: 30000,
        validateStatus: (status) => status >= 200 && status < 300,
    });

    const names = (Array.isArray(response.data) ? response.data : [])
        .map((item) => cleanText(asString(item?.name)))
        .filter(Boolean);

    if (names.length === 0) {
        throw new Error("Gemsloot provider discovery returned 0 providers.");
    }

    return names;
}

async function fetchListPage(page: number, providers: string[]): Promise<GemslootListPayload> {
    const response = await axios.post<GemslootListPayload>(
        DEFAULT_GEMSLOOT_LIST_URL,
        {
            search: [""],
            filter: "epc",
            categorie: "all",
            page,
            provider: providers,
        },
        {
            headers: buildJsonHeaders(),
            timeout: 30000,
            validateStatus: (status) => status >= 200 && status < 300,
        },
    );

    return response.data ?? {};
}

async function enrichOffersWithDetails(offers: SourceOffer[], siteUrl: string): Promise<SourceOffer[]> {
    const concurrency = toPositiveInteger(process.env.GEMSLOOT_DETAIL_CONCURRENCY) ?? DEFAULT_DETAIL_CONCURRENCY;
    const enriched = await mapWithConcurrency(offers, concurrency, async (offer) => {
        try {
            const detail = await fetchOfferDetail(offer.external_id);
            return applyDetail(offer, detail, siteUrl);
        } catch (error) {
            logger.warn("Gemsloot detail fetch failed", {
                externalId: offer.external_id,
                provider: offer.provider_name,
                error: error instanceof Error ? error.message : String(error),
            });
            return offer;
        }
    });

    logger.info("Gemsloot detail enrichment completed", {
        offerCount: enriched.length,
        enrichedWithTasks: enriched.filter((offer) => (offer.task_list?.length ?? 0) > 0).length,
    });

    return enriched;
}

async function fetchOfferDetail(externalId: string): Promise<GemslootDetailPayload | null> {
    const response = await axios.get<GemslootDetailPayload>(
        `${DEFAULT_GEMSLOOT_DETAIL_URL}/${encodeURIComponent(externalId)}`,
        {
            headers: buildJsonHeaders(),
            timeout: 30000,
            validateStatus: (status) => status >= 200 && status < 300,
        },
    );

    const payload = response.data ?? null;
    if (!payload?.id) {
        return null;
    }

    return payload;
}

function applyDetail(base: SourceOffer, detail: GemslootDetailPayload | null, siteUrl: string): SourceOffer {
    if (!detail?.id) {
        return base;
    }

    const taskList = extractTaskList(detail.steps);
    const maxTaskPayout = taskList.reduce((max, task) => Math.max(max, task.reward_amount_usd), 0);
    const totalPayout = toPositiveNumber(detail.points);
    const bestPayout = maxTaskPayout > 0 ? maxTaskPayout : totalPayout;

    return {
        ...base,
        external_id: cleanText(asString(detail.id)) || base.external_id,
        title: cleanText(asString(detail.name)) || base.title,
        payout_raw: bestPayout > 0 ? bestPayout.toFixed(2) : base.payout_raw,
        device_raw: extractDevices(detail.os) || base.device_raw,
        category_raw: extractCategories(detail.my_category) || base.category_raw,
        url: `${siteUrl}?modal=offer_2&name=${encodeURIComponent(cleanText(asString(detail.id)) || base.external_id)}`,
        game_slug: buildGameSlug(
            cleanText(asString(detail.name)) || base.game_title || base.title,
            cleanText(asString(detail.id)) || base.external_id,
        ),
        countries_raw: normalizeCountryList(detail.loc) ?? base.countries_raw ?? null,
        game_title: cleanText(asString(detail.name)) || base.game_title,
        provider_name: cleanText(asString(detail.provider)) || base.provider_name,
        image_url: cleanText(asString(detail.img)) || base.image_url,
        total_payout_raw: totalPayout > 0 ? totalPayout.toFixed(2) : base.total_payout_raw,
        best_payout_usd: bestPayout > 0 ? bestPayout : base.best_payout_usd,
        task_list: taskList,
    };
}

function extractTaskList(steps: GemslootDetailStep[] | null | undefined): NonNullable<SourceOffer["task_list"]> {
    if (!Array.isArray(steps) || steps.length === 0) {
        return [];
    }

    const taskList: NonNullable<SourceOffer["task_list"]> = [];

    for (let index = 0; index < steps.length; index += 1) {
        const step = steps[index];
        const title = cleanText(asString(step?.name));
        const rewardAmount = toPositiveNumber(step?.points);

        if (!title || rewardAmount < 0) {
            continue;
        }

        const timeLimitText = formatExpireHours(step?.expire_hours);

        taskList.push({
            title,
            reward_amount_usd: rewardAmount,
            reward_display: `$${rewardAmount.toFixed(2)}`,
            task_type: classifyTaskType(title),
            time_limit_text: timeLimitText,
            notes: null,
            sort_order: index + 1,
        });
    }

    return taskList;
}

function shouldUseEntry(request: GemslootListRequest | null): boolean {
    if (!request) return false;
    if (request.categorie !== "all") return false;
    if (!Array.isArray(request.provider) || request.provider.length === 0) return false;
    return true;
}

function parseRequest(value?: string): GemslootListRequest | null {
    if (!value?.trim()) return null;
    try {
        return JSON.parse(value) as GemslootListRequest;
    } catch {
        return null;
    }
}

function parseListPayload(value: string): GemslootListPayload | null {
    try {
        return JSON.parse(value) as GemslootListPayload;
    } catch {
        return null;
    }
}

function parseListOffer(node: GemslootListNode | null | undefined, siteUrl: string): SourceOffer | null {
    const externalId = cleanText(asString(node?.id));
    const title = cleanText(asString(node?.name));
    const providerName = cleanText(asString(node?.provider)) || "Gemsloot";
    const payoutUsd = toPositiveNumber(node?.points);
    const imageUrl = cleanText(asString(node?.img));

    if (!externalId || !title || payoutUsd <= 0) {
        return null;
    }

    return {
        external_id: externalId,
        title,
        payout_raw: payoutUsd.toFixed(2),
        currency: "USD",
        device_raw: extractDevices(node?.os),
        category_raw: extractCategories(node?.category),
        url: `${siteUrl}?modal=offer_2&name=${encodeURIComponent(externalId)}`,
        expires_raw: null,
        game_slug: buildGameSlug(title, externalId),
        countries_raw: null,
        game_title: title,
        provider_name: providerName,
        image_url: imageUrl || null,
        total_payout_raw: payoutUsd.toFixed(2),
        best_payout_usd: payoutUsd,
        task_list: [],
    };
}

function getHarContentText(content?: { text?: string; encoding?: string }): string {
    if (!content?.text) return "";
    if (content.encoding?.toLowerCase() === "base64") {
        return Buffer.from(content.text, "base64").toString("utf8");
    }
    return content.text;
}

function buildJsonHeaders(): Record<string, string> {
    return {
        accept: "application/json, text/plain, */*",
        origin: "https://gemsloot.com",
        referer: "https://gemsloot.com/earn/all",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
        "content-type": "application/json",
    };
}

function extractDevices(value: Record<string, unknown> | null | undefined): string {
    if (!value || typeof value !== "object") return "web";
    const keys = Object.keys(value).map((item) => item.toLowerCase());
    if (keys.length === 0) return "web";

    const devices: string[] = [];
    if (keys.includes("ios")) devices.push("ios");
    if (keys.includes("android")) devices.push("android");
    if (keys.some((item) => item === "windows" || item === "mac" || item === "desktop" || item === "pc")) {
        devices.push("pc");
    }
    if (keys.includes("web")) devices.push("web");

    return devices.length > 0 ? devices.join(", ") : keys.join(", ");
}

function extractCategories(value: Record<string, unknown> | null | undefined): string {
    if (!value || typeof value !== "object") return "other";
    const keys = Object.keys(value).map((item) => cleanText(item)).filter(Boolean);
    return keys.length > 0 ? keys.join(", ") : "other";
}

function normalizeCountryList(value: string[] | null | undefined): string[] | null {
    if (!Array.isArray(value) || value.length === 0) {
        return null;
    }

    const countries = value
        .map((item) => cleanText(asString(item)).toUpperCase())
        .filter((item) => /^[A-Z]{2}$/.test(item));

    return countries.length > 0 ? Array.from(new Set(countries)) : null;
}

function classifyTaskType(title: string): NonNullable<SourceOffer["task_list"]>[number]["task_type"] {
    const value = title.toLowerCase();
    if (/(buy|purchase|recharge|pack|\$)/.test(value)) return "purchase";
    if (/(install|open the game|launch|download)/.test(value)) return "install";
    if (/(register|sign up|signup|create account|login)/.test(value)) return "signup";
    if (/(reach|level|complete|bet|spin|board|castle|chapter|episode|wave|purchase)/.test(value)) return "milestone";
    return "other";
}

function formatExpireHours(value: unknown): string | null {
    const hours = toPositiveNumber(value);
    if (!hours) return null;
    if (hours % 24 === 0) {
        const days = hours / 24;
        return `${days} day${days === 1 ? "" : "s"}`;
    }
    return `${hours} hour${hours === 1 ? "" : "s"}`;
}

function toPositiveNumber(value: unknown): number {
    const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function toPositiveInteger(value: string | undefined): number | null {
    const parsed = Number.parseInt(String(value ?? "").trim(), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseCsv(value: string | undefined): string[] {
    return String(value ?? "")
        .split(",")
        .map((item) => cleanText(item))
        .filter(Boolean);
}

function asString(value: unknown): string {
    return typeof value === "string" ? value : "";
}

function cleanText(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

function buildGameSlug(title: string, externalId: string): string {
    const normalizedTitle = cleanText(title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    if (normalizedTitle) {
        return normalizedTitle;
    }

    return cleanText(externalId)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function compareOffers(a: SourceOffer, b: SourceOffer): number {
    return (
        compareString(a.provider_name ?? "", b.provider_name ?? "") ||
        compareString(a.game_title ?? a.title, b.game_title ?? b.title) ||
        compareString(a.external_id, b.external_id)
    );
}

function compareString(a: string, b: string): number {
    return a.localeCompare(b, "en", { sensitivity: "base" });
}

async function mapWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
    const results = new Array<R>(items.length);
    let nextIndex = 0;

    async function worker(): Promise<void> {
        while (true) {
            const currentIndex = nextIndex;
            nextIndex += 1;

            if (currentIndex >= items.length) {
                return;
            }

            results[currentIndex] = await mapper(items[currentIndex], currentIndex);
        }
    }

    const workerCount = Math.max(1, Math.min(concurrency, items.length));
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return results;
}
