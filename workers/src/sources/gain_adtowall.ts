import axios from "axios";
import * as cheerio from "cheerio";
import { readFile } from "node:fs/promises";
import { SourceAdapter } from "../models/source";
import { SourceOffer } from "../types/offer";
import { withRetry } from "../core/db";
import { logger } from "../core/logger";

const DEFAULT_ADTOWALL_URL = "https://adtowall.com";
const DEFAULT_GAIN_SITE_URL = "https://gain.gg/earn";

const MOCK_OFFERS: SourceOffer[] = [
    {
        external_id: "adtowall-83807",
        title: "Kraken Crypto Trading",
        payout_raw: "24.00",
        currency: "USD",
        device_raw: "web",
        category_raw: "finance",
        url: DEFAULT_GAIN_SITE_URL,
        expires_raw: null,
        game_slug: null,
        countries_raw: ["US"],
        game_title: "Kraken Crypto Trading",
        provider_name: "AdToWall",
        image_url: "https://assets.efusercontent.com/311/offers/19459/thumb/kraken-digital-asset-exchange-logo-1677303879776.jpg",
        total_payout_raw: "24.00",
        best_payout_usd: 24,
        task_list: [
            {
                title: "Create account",
                reward_amount_usd: 24,
                reward_display: "$24.00",
                task_type: "signup",
                time_limit_text: null,
                notes: null,
                sort_order: 1,
            },
        ],
    },
];

export const gainAdToWallSource: SourceAdapter = {
    key: "gain-adtowall",
    name: "Gain.gg AdToWall",
    type: "html",
    baseUrl: DEFAULT_ADTOWALL_URL,
    storage: "site_offers",
    mockEnvVar: "GAIN_USE_MOCK",
    fetchOffers,
};

export async function fetchOffers(): Promise<SourceOffer[]> {
    const useMock = (process.env.GAIN_USE_MOCK ?? "false").toLowerCase() === "true";
    if (useMock) {
        logger.info("Gain AdToWall source using mock offers", { count: MOCK_OFFERS.length });
        return [...MOCK_OFFERS];
    }

    const source = await loadAdToWallSource();
    const html = extractHtmlFragment(source.body);
    if (!html) {
        throw new Error("Gain AdToWall source did not produce a parsable HTML fragment.");
    }

    const offers = parseAdToWallHtml(html, source.sourceUrl, source.modalTasksByOfferId ?? {});
    const enrichTasks = (process.env.GAIN_ADTOWALL_ENRICH_TASKS ?? "true").toLowerCase() !== "false";
    if (enrichTasks && source.liveModalSeed) {
        const enrichedCount = await enrichOffersWithLiveModalTasks(offers, source.liveModalSeed, source.modalTasksByOfferId ?? {});
        logger.info("Gain AdToWall live modal enrichment completed", {
            enrichedCount,
            totalOffers: offers.length,
        });
    }

    logger.info("Gain AdToWall parsed offers", {
        sourceUrl: source.sourceUrl,
        parsedCount: offers.length,
    });

    if (offers.length === 0) {
        throw new Error(`Gain AdToWall parsed 0 offers from ${source.sourceUrl}.`);
    }

    return offers;
}

async function loadAdToWallSource(): Promise<{
    body: string;
    sourceUrl: string;
    modalTasksByOfferId?: Record<string, NonNullable<SourceOffer["task_list"]>>;
    liveModalSeed?: LiveModalSeed;
}> {
    const harFile = process.env.GAIN_ADTOWALL_HAR_FILE?.trim();
    const responseFile = process.env.GAIN_ADTOWALL_RESPONSE_FILE?.trim();
    const inlineJson = process.env.GAIN_ADTOWALL_RESPONSE_JSON?.trim();
    const inlineHtml = process.env.GAIN_ADTOWALL_HTML?.trim();
    const requestUrl = process.env.GAIN_ADTOWALL_URL?.trim() || DEFAULT_ADTOWALL_URL;
    const sourceUrl = process.env.GAIN_ADTOWALL_SOURCE_URL?.trim() || DEFAULT_GAIN_SITE_URL;

    if (harFile) {
        return loadAdToWallSourceFromHar(harFile, sourceUrl);
    }

    if (responseFile) {
        const body = await readFile(responseFile, "utf8");
        return { body, sourceUrl };
    }

    if (inlineJson) {
        return { body: inlineJson, sourceUrl };
    }

    if (inlineHtml) {
        return { body: inlineHtml, sourceUrl };
    }

    const method = (process.env.GAIN_ADTOWALL_METHOD?.trim() || "GET").toUpperCase();
    const body = process.env.GAIN_ADTOWALL_BODY?.trim();
    const headers = parseJsonRecord(process.env.GAIN_ADTOWALL_HEADERS_JSON);

    const response = await withRetry(
        () =>
            axios.request({
                url: requestUrl,
                method,
                timeout: 20000,
                responseType: "text",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
                    "Accept": "application/json, text/plain, */*",
                    "Accept-Language": "en-US,en;q=0.9",
                    ...headers,
                },
                data: body || undefined,
            }),
        "gain-adtowall-fetch",
    );

    logger.info("Gain AdToWall fetch succeeded", {
        requestUrl,
        method,
        status: response.status,
        responseLength: typeof response.data === "string" ? response.data.length : 0,
    });

    const responseBody = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
    const liveModalSeed = extractLiveModalSeedFromPage(responseBody, requestUrl);

    logger.info("Gain AdToWall live seed detection", {
        requestUrl,
        hasLiveModalSeed: Boolean(liveModalSeed),
    });

    return {
        body: responseBody,
        sourceUrl,
        liveModalSeed,
    };
}

async function loadAdToWallSourceFromHar(
    harFile: string,
    sourceUrl: string,
): Promise<{ body: string; sourceUrl: string; modalTasksByOfferId: Record<string, NonNullable<SourceOffer["task_list"]>> }> {
    const body = await readFile(harFile, "utf8");
    const parsed = JSON.parse(body) as { log?: { entries?: HarEntry[] } };
    const entries = parsed.log?.entries ?? [];

    const offerwallEntries = entries.filter((entry) => entry.request?.url === "https://adtowall.com/livewire/message/offerwall");
    if (offerwallEntries.length === 0) {
        throw new Error("AdToWall HAR did not contain any offerwall Livewire responses.");
    }

    const selectedOfferwallEntry = chooseBestOfferwallEntry(offerwallEntries);
    const selectedBody = selectedOfferwallEntry.response?.content?.text ?? "";
    if (!selectedBody.trim()) {
        throw new Error("AdToWall HAR did not contain a usable offerwall response body.");
    }

    const modalTasksByOfferId = extractModalTasksByOfferId(entries);
    logger.info("Gain AdToWall HAR extracted", {
        harFile,
        modalTaskOffers: Object.keys(modalTasksByOfferId).length,
        responseLength: selectedBody.length,
    });

    return {
        body: selectedBody,
        sourceUrl,
        modalTasksByOfferId,
    };
}

export function parseAdToWallHtml(
    html: string,
    sourceUrl: string,
    modalTasksByOfferId: Record<string, NonNullable<SourceOffer["task_list"]>> = {},
): SourceOffer[] {
    const $ = cheerio.load(html);
    const offers: SourceOffer[] = [];

    $("article.task").each((_, element) => {
        const article = $(element);
        const modalPayload = extractModalPayload(article);
        const offerLinkId = modalPayload.offerLinkId;
        if (!offerLinkId) {
            return;
        }

        const cardTitle = cleanText(article.find(".task__title").first().text());
        const subtitle = cleanText(article.find(".task__subtitle").first().text());
        const payoutPoints = parseAdToWallPoints(article.find("button.btn--transformer span").first().text());

        if (!cardTitle || payoutPoints <= 0) {
            return;
        }

        const payoutUsd = round(payoutPoints / 1000);
        const parentTitle = subtitle || extractParentTitle(cardTitle);
        const imageUrl = normalizeImageUrl(article.find(".task__thumbnail img").first().attr("src") || "");
        const labels = article
            .find(".task__footer .label, .task__head .label")
            .map((__, label) => cleanText($(label).text()))
            .get()
            .filter(Boolean);
        const categoryRaw = inferCategoryLabel(labels, cardTitle);
        const deviceRaw = extractDeviceRaw(article);
        const countries = modalPayload.geo ? [modalPayload.geo.toUpperCase()] : ["US"];

        const taskList = modalTasksByOfferId[String(offerLinkId)] ?? [
            {
                title: cardTitle,
                reward_amount_usd: payoutUsd,
                reward_display: `$${payoutUsd.toFixed(2)}`,
                task_type: inferTaskType(cardTitle),
                time_limit_text: null,
                notes: buildTaskNotes(modalPayload),
                sort_order: 1,
            },
        ];

        const bestTaskPayout = taskList.reduce((max, task) => Math.max(max, task.reward_amount_usd), 0);
        const totalTaskPayout = round(taskList.reduce((sum, task) => sum + task.reward_amount_usd, 0));

        offers.push({
            external_id: `adtowall-${offerLinkId}`,
            title: parentTitle,
            payout_raw: (bestTaskPayout || payoutUsd).toFixed(2),
            currency: "USD",
            device_raw: deviceRaw,
            category_raw: categoryRaw,
            url: sourceUrl || DEFAULT_GAIN_SITE_URL,
            expires_raw: null,
            game_slug: null,
            countries_raw: countries,
            game_title: parentTitle,
            provider_name: "AdToWall",
            image_url: imageUrl,
            total_payout_raw: (totalTaskPayout || payoutUsd).toFixed(2),
            best_payout_usd: bestTaskPayout || payoutUsd,
            task_list: taskList,
        });
    });

    return offers;
}

function chooseBestOfferwallEntry(entries: HarEntry[]): HarEntry {
    const candidates = entries
        .map((entry) => ({
            entry,
            requestBody: entry.request?.postData?.text ?? "",
            responseBody: entry.response?.content?.text ?? "",
        }))
        .filter((candidate) => candidate.responseBody.trim().length > 0)
        .map((candidate) => ({
            ...candidate,
            type: matchGroup(candidate.requestBody, /"type":"([^"]+)"/) ?? "",
            hasDirtyType: /"dirty":\["type"\]/.test(candidate.responseBody),
        }))
        .filter((candidate) => candidate.type === "available")
        .sort((left, right) => {
            if (Number(left.hasDirtyType) !== Number(right.hasDirtyType)) {
                return Number(left.hasDirtyType) - Number(right.hasDirtyType);
            }
            return right.responseBody.length - left.responseBody.length;
        });

    return candidates[0]?.entry ?? entries[0];
}

function extractModalTasksByOfferId(entries: HarEntry[]): Record<string, NonNullable<SourceOffer["task_list"]>> {
    const modalEntries = entries.filter((entry) => entry.request?.url === "https://adtowall.com/livewire/message/livewire-ui-modal");
    const tasksByOfferId: Record<string, NonNullable<SourceOffer["task_list"]>> = {};

    for (const entry of modalEntries) {
        const requestBody = entry.request?.postData?.text ?? "";
        const offerLinkId = matchGroup(requestBody, /"offerLinkId":(\d+)/);
        const responseBody = entry.response?.content?.text ?? "";
        const html = extractHtmlFragment(responseBody);
        if (!offerLinkId || !html) {
            continue;
        }

        const taskList = parseModalTaskList(html);
        if (taskList.length > 0) {
            tasksByOfferId[offerLinkId] = taskList;
        }
    }

    return tasksByOfferId;
}

function parseModalTaskList(html: string): NonNullable<SourceOffer["task_list"]> {
    const $ = cheerio.load(html);
    const taskList: NonNullable<SourceOffer["task_list"]> = [];

    $(".single__tasks-list-item").each((index, element) => {
        const item = $(element);
        const title = cleanText(item.find(".single__tasks-list-item-title").first().text());
        const rewardPoints = parseAdToWallPoints(item.find(".btn-pts").first().text());
        const rewardAmountUsd = round(rewardPoints / 1000);

        if (!title || rewardAmountUsd <= 0) {
            return;
        }

        taskList.push({
            title,
            reward_amount_usd: rewardAmountUsd,
            reward_display: `$${rewardAmountUsd.toFixed(2)}`,
            task_type: inferTaskType(title),
            time_limit_text: null,
            notes: null,
            sort_order: index + 1,
        });
    });

    return taskList;
}

async function enrichOffersWithLiveModalTasks(
    offers: SourceOffer[],
    seed: LiveModalSeed,
    existingTaskLists: Record<string, NonNullable<SourceOffer["task_list"]>>,
): Promise<number> {
    const concurrency = Math.max(1, Number.parseInt(process.env.GAIN_ADTOWALL_MODAL_CONCURRENCY ?? "4", 10) || 4);
    let enrichedCount = 0;

    await mapWithConcurrency(offers, concurrency, async (offer) => {
        const offerLinkId = extractOfferLinkIdFromExternalId(offer.external_id);
        if (!offerLinkId) return;
        if (existingTaskLists[offerLinkId]?.length) return;

        const taskList = await fetchLiveModalTaskList(seed, offerLinkId);
        if (taskList.length === 0) {
            return;
        }

        offer.task_list = taskList;
        offer.best_payout_usd = taskList.reduce((max, task) => Math.max(max, task.reward_amount_usd), 0);
        offer.total_payout_raw = round(taskList.reduce((sum, task) => sum + task.reward_amount_usd, 0)).toFixed(2);
        offer.payout_raw = (offer.best_payout_usd || Number.parseFloat(offer.payout_raw) || 0).toFixed(2);
        enrichedCount += 1;
    });

    return enrichedCount;
}

async function fetchLiveModalTaskList(seed: LiveModalSeed, offerLinkId: string): Promise<NonNullable<SourceOffer["task_list"]>> {
    const payload = {
        fingerprint: seed.fingerprint,
        serverMemo: seed.serverMemo,
        updates: [
            {
                type: "fireEvent",
                payload: {
                    id: `eg${offerLinkId}`,
                    event: "openModal",
                    params: [
                        "single-offer",
                        {
                            offerLinkId: Number.parseInt(offerLinkId, 10),
                            userId: seed.context.userId,
                            affiliateId: seed.context.affiliateId,
                            lang: seed.context.lang,
                            geo: seed.context.geo,
                            region: seed.context.region,
                        },
                    ],
                },
            },
        ],
    };

    const response = await withRetry(
        () =>
            axios.post(`${DEFAULT_ADTOWALL_URL}/livewire/message/livewire-ui-modal`, payload, {
                timeout: 20000,
                responseType: "text",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
                    "Accept": "text/html, application/xhtml+xml",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Content-Type": "application/json",
                    "Origin": DEFAULT_ADTOWALL_URL,
                    "Referer": seed.referer,
                    "X-Livewire": "true",
                },
            }),
        `gain-adtowall-modal-${offerLinkId}`,
    );

    const responseBody = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
    const html = extractHtmlFragment(responseBody);
    if (!html) {
        return [];
    }

    return parseModalTaskList(html);
}

function extractLiveModalSeedFromPage(html: string, requestUrl: string): LiveModalSeed | undefined {
    if (!/<html/i.test(html) || !/wire:initial-data=/.test(html)) {
        return undefined;
    }

    const matches = [...html.matchAll(/wire:initial-data="([^"]+)"/g)];
    for (const match of matches) {
        const encoded = match[1];
        if (!encoded.includes("livewire-ui-modal")) {
            continue;
        }

        const decoded = decodeHtmlEntities(encoded);
        try {
            const parsed = JSON.parse(decoded) as LivewireInitialData;
            const context = extractOfferwallContext(html);
            if (!context) {
                return undefined;
            }

            return {
                referer: requestUrl,
                fingerprint: parsed.fingerprint,
                serverMemo: parsed.serverMemo,
                context,
            };
        } catch {
            continue;
        }
    }

    return undefined;
}

function extractOfferwallContext(html: string): OfferwallContext | undefined {
    const regexMatch = html.match(/offerLinkId&quot;:\s*\d+.*?userId&quot;:&quot;([^&]+).*?affiliateId&quot;:&quot;([^&]+).*?lang&quot;:&quot;([^&]+).*?geo&quot;:&quot;([^&]+).*?region&quot;:&quot;([^&]+)/s);
    if (regexMatch) {
        return {
            userId: regexMatch[1],
            affiliateId: regexMatch[2],
            lang: regexMatch[3],
            geo: regexMatch[4],
            region: regexMatch[5],
        };
    }

    const $ = cheerio.load(html);
    const firstArticle = $("article.task").first();
    if (!firstArticle.length) {
        return undefined;
    }

    const payload = extractModalPayload(firstArticle);
    if (!payload.userId || !payload.affiliateId || !payload.lang || !payload.geo || !payload.region) {
        return undefined;
    }

    return {
        userId: payload.userId,
        affiliateId: payload.affiliateId,
        lang: payload.lang,
        geo: payload.geo,
        region: payload.region,
    };
}

function decodeHtmlEntities(value: string): string {
    return value
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}

function extractOfferLinkIdFromExternalId(externalId: string): string | null {
    const match = externalId.match(/adtowall-(\d+)/);
    return match?.[1] ?? null;
}

async function mapWithConcurrency<T>(
    items: T[],
    concurrency: number,
    worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
    let nextIndex = 0;

    const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (nextIndex < items.length) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            await worker(items[currentIndex], currentIndex);
        }
    });

    await Promise.all(runners);
}

function extractHtmlFragment(input: string): string | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("<")) {
        return trimmed;
    }

    try {
        const parsed = JSON.parse(trimmed);
        const html = extractHtmlFromObject(parsed);
        if (html) return html;
    } catch {
        // Fall through to tolerant extraction.
    }

    const quotedHtmlMatch = trimmed.match(/html\s*:\s*"((?:\\.|[^"\\])*)"/s)
        ?? trimmed.match(/"html"\s*:\s*"((?:\\.|[^"\\])*)"/s);
    if (quotedHtmlMatch?.[1]) {
        return decodeEscapedJsonString(quotedHtmlMatch[1]);
    }

    return null;
}

function extractHtmlFromObject(payload: unknown): string | null {
    if (!isRecord(payload)) return null;
    const effects = payload.effects;
    if (isRecord(effects) && typeof effects.html === "string" && effects.html.trim()) {
        return effects.html;
    }
    return null;
}

function decodeEscapedJsonString(value: string): string {
    try {
        return JSON.parse(`"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
    } catch {
        return value
            .replace(/\\"/g, '"')
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "\t")
            .replace(/\\\\/g, "\\");
    }
}

function extractModalPayload(article: cheerio.Cheerio<any>): {
    offerLinkId: string | null;
    userId: string | null;
    affiliateId: string | null;
    lang: string | null;
    geo: string | null;
    region: string | null;
} {
    const clickAttr =
        article.find(".task__title").attr("wire:click")
        || article.find(".task__thumbnail").attr("wire:click")
        || article.find("button.btn--transformer").attr("wire:click")
        || "";

    const decoded = clickAttr
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, "&");

    return {
        offerLinkId: matchGroup(decoded, /"offerLinkId":\s*(\d+)/),
        userId: matchGroup(decoded, /"userId":\s*"([^"]+)"/),
        affiliateId: matchGroup(decoded, /"affiliateId":\s*"([^"]+)"/),
        lang: matchGroup(decoded, /"lang":\s*"([^"]+)"/),
        geo: matchGroup(decoded, /"geo":\s*"([^"]+)"/),
        region: matchGroup(decoded, /"region":\s*"([^"]+)"/),
    };
}

function matchGroup(value: string, pattern: RegExp): string | null {
    const match = value.match(pattern);
    return match?.[1] ?? null;
}

function parseAdToWallPoints(value: string): number {
    const digits = value.replace(/[^0-9]/g, "");
    const parsed = Number.parseInt(digits, 10);
    return Number.isFinite(parsed) ? parsed : 0;
}

function extractDeviceRaw(article: cheerio.Cheerio<any>): string {
    const classNames = article
        .find('[class*="i-platform-"]')
        .map((_, node) => String(node.attribs.class || ""))
        .get()
        .join(" ");

    const devices: string[] = [];
    if (/i-platform-world/.test(classNames)) devices.push("web");
    if (/i-platform-desktop/.test(classNames)) devices.push("desktop");
    if (/i-platform-android/.test(classNames)) devices.push("android");
    if (/i-platform-ios/.test(classNames)) devices.push("ios");

    return devices.length > 0 ? Array.from(new Set(devices)).join(" & ") : "web";
}

function inferCategoryLabel(labels: string[], title: string): string {
    const filtered = labels.filter((label) => {
        const normalized = label.toLowerCase();
        if (!normalized) return false;
        if (normalized === "available" || normalized === "in progress" || normalized === "completed") return false;
        if (normalized === "free" || normalized === "paid") return false;
        if (/^\d+$/.test(normalized)) return false;
        return true;
    });

    return filtered[0] || inferCategoryFromTitle(title);
}

function inferCategoryFromTitle(title: string): string {
    if (/\b(casino|slot|deposit|wager|bet)\b/i.test(title)) return "casino";
    if (/\b(finance|bank|crypto|credit|trade|account)\b/i.test(title)) return "finance";
    if (/\b(game|level|launch|install the game)\b/i.test(title)) return "game";
    return "other";
}

function inferTaskType(title: string): "install" | "milestone" | "purchase" | "signup" | "other" {
    if (/\binstall|launch\b/i.test(title)) return "install";
    if (/\bcreate account|sign up|signup|register|confirm email\b/i.test(title)) return "signup";
    if (/\bbuy|purchase|deposit|wager|pay|trade\b/i.test(title)) return "purchase";
    if (/\breach|complete|finish|level|goal|board|village|earn\b/i.test(title)) return "milestone";
    return "other";
}

function buildTaskNotes(payload: {
    userId: string | null;
    affiliateId: string | null;
    lang: string | null;
    geo: string | null;
    region: string | null;
}): string | null {
    const parts = [
        payload.lang ? `lang=${payload.lang}` : null,
        payload.geo ? `geo=${payload.geo}` : null,
        payload.region ? `region=${payload.region}` : null,
        payload.affiliateId ? `affiliate=${payload.affiliateId}` : null,
        payload.userId ? `user=${payload.userId}` : null,
    ].filter((part): part is string => Boolean(part));

    return parts.length > 0 ? parts.join(", ") : null;
}

function extractParentTitle(title: string): string {
    const trimmed = cleanText(title);
    if (!trimmed) return trimmed;

    const inlineMatch = trimmed.match(/^(.*?)(?:\s+(reach|complete|install|launch|register|create|deposit|pay|trade)\b.*)$/i);
    if (inlineMatch?.[1]?.trim()) {
        return inlineMatch[1].trim();
    }

    return trimmed;
}

function normalizeImageUrl(url: string): string | null {
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    if (trimmed.startsWith("/")) return `${DEFAULT_ADTOWALL_URL}${trimmed}`;
    return trimmed;
}

function parseJsonRecord(value: string | undefined): Record<string, string> {
    if (!value?.trim()) return {};

    const parsed = JSON.parse(value);
    if (!isRecord(parsed)) {
        throw new Error("GAIN_ADTOWALL_HEADERS_JSON must parse to an object.");
    }

    return Object.fromEntries(
        Object.entries(parsed)
            .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
}

function cleanText(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

function round(value: number): number {
    return Math.round(value * 100) / 100;
}

function isRecord(value: unknown): value is Record<string, any> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

interface HarEntry {
    request?: {
        url?: string;
        postData?: {
            text?: string;
        };
    };
    response?: {
        content?: {
            text?: string;
        };
    };
}

interface LivewireInitialData {
    fingerprint: {
        id: string;
        name: string;
        locale: string;
        path: string;
        method: string;
        v: string;
    };
    serverMemo: {
        children: unknown[];
        errors: unknown[];
        htmlHash: string;
        data: Record<string, unknown>;
        dataMeta: unknown;
        checksum: string;
    };
}

interface OfferwallContext {
    userId: string;
    affiliateId: string;
    lang: string;
    geo: string;
    region: string;
}

interface LiveModalSeed {
    referer: string;
    fingerprint: LivewireInitialData["fingerprint"];
    serverMemo: LivewireInitialData["serverMemo"];
    context: OfferwallContext;
}
