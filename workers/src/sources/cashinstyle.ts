import axios from "axios";
import { withRetry } from "../core/db";
import { logger } from "../core/logger";
import { SourceAdapter } from "../models/source";
import { SourceOffer } from "../types/offer";

const DEFAULT_CASHINSTYLE_SITE_URL = "https://cashinstyle.com";
const DEFAULT_CASHINSTYLE_WALL_URL = "https://cashinstyle.com/walls/torox";
const DEFAULT_TOROX_CAMPAIGNS_URL = "https://api.wall.torox.io/player/campaigns";
const DEFAULT_TOROX_SETTINGS_URL = "https://api.wall.torox.io/player/settings";
const DEFAULT_TOROX_SORT = "rating-DESC";
const DEFAULT_TOROX_OS = "web,ios,android";
const DEFAULT_LIMIT = 100;
const DEFAULT_MAX_PAGES = 5;
const DEFAULT_TOROX_BOOST_MULTIPLIER = 1;
const TOROX_WALL_ORIGIN = "https://wall.torox.io";
const TOROX_WALL_REFERER = "https://wall.torox.io/";
const DEFAULT_CASHINSTYLE_HEADERS: Record<string, string> = {
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    pragma: "no-cache",
    referer: "https://cashinstyle.com/home",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/147.0.0.0 Safari/537.36",
};
const DEFAULT_TOROX_HEADERS: Record<string, string> = {
    accept: "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    origin: TOROX_WALL_ORIGIN,
    referer: TOROX_WALL_REFERER,
    "x-torox-sid": "unknown",
};

const MOCK_OFFERS: SourceOffer[] = [
    {
        external_id: "cashinstyle-torox-monopoly-go",
        title: "Monopoly GO",
        payout_raw: "18.00",
        total_payout_raw: "34.00",
        currency: "USD",
        device_raw: "ios,android",
        category_raw: "Mobile Games",
        url: DEFAULT_CASHINSTYLE_WALL_URL,
        expires_raw: null,
        game_slug: "monopoly-go",
        countries_raw: ["US"],
        game_title: "Monopoly GO",
        provider_name: "CashInStyle",
        image_url: null,
        best_payout_usd: 18,
        task_list: [
            {
                title: "Install and open the app",
                reward_amount_usd: 2,
                reward_display: "$2.00",
                task_type: "install",
                time_limit_text: null,
                notes: null,
                sort_order: 1,
            },
            {
                title: "Reach Board 25",
                reward_amount_usd: 18,
                reward_display: "$18.00",
                task_type: "milestone",
                time_limit_text: "30 days",
                notes: null,
                sort_order: 2,
            },
            {
                title: "Reach Board 42",
                reward_amount_usd: 14,
                reward_display: "$14.00",
                task_type: "milestone",
                time_limit_text: "30 days",
                notes: null,
                sort_order: 3,
            },
        ],
    },
];

interface CashInStyleConfig {
    wallUrl: string;
    siteUrl: string;
    wallReferer: string;
    wallOrigin: string;
    wallCookie: string | null;
    wallHeaders: Record<string, string>;
    frameUrl: string | null;
    toroxCookie: string | null;
    toroxSid: string | null;
    toroxHeaders: Record<string, string>;
    campaignsUrl: string;
    settingsUrl: string;
    os: string;
    sort: string;
    limit: number;
    maxPages: number;
    boostMultiplier: number;
}

interface RequestTrace {
    url: string;
    finalUrl: string;
    status: number;
    data: unknown;
    topLevelKeys: string[];
    headers: Record<string, unknown>;
}

interface ToroxContext {
    cookieHeader: string | null;
    inferredParams: Record<string, string>;
    frameUrl: string | null;
}

interface FrameHandoffResult {
    finalUrl: string;
    cookieHeader: string | null;
}

export const cashInStyleSource: SourceAdapter = {
    key: "cashinstyle",
    name: "CashInStyle",
    type: "api",
    baseUrl: DEFAULT_CASHINSTYLE_WALL_URL,
    storage: "site_offers",
    mockEnvVar: "CASHINSTYLE_USE_MOCK",
    fetchOffers,
};

export async function fetchOffers(): Promise<SourceOffer[]> {
    const useMock = (process.env.CASHINSTYLE_USE_MOCK ?? "true").toLowerCase() === "true";
    if (useMock) {
        logger.info("CashInStyle source using mock offers", { count: MOCK_OFFERS.length });
        return [...MOCK_OFFERS];
    }

    const config = getConfig();
    const context = await discoverToroxContext(config);
    const offers = await fetchToroxCampaigns(config, context);

    logger.info("CashInStyle parsed offers", {
        parsedCount: offers.length,
        sampleParsedItemShape: offers[0] ? Object.keys(offers[0]) : null,
        sampleParsedItem: offers[0] ?? null,
    });

    if (offers.length === 0) {
        throw new Error("CashInStyle/Torox source returned 0 parsed offers.");
    }

    return offers;
}

async function discoverToroxContext(config: CashInStyleConfig): Promise<ToroxContext> {
    if (config.frameUrl) {
        const handoff = await resolveFrameContext(config, config.frameUrl, config.wallCookie);
        return {
            cookieHeader: handoff.cookieHeader,
            inferredParams: {},
            frameUrl: handoff.finalUrl,
        };
    }

    const bootstrapTrace = await fetchRequest(config.wallUrl, {
        label: "cashinstyle-wall-bootstrap",
        headers: buildWallHeaders(config, config.wallCookie),
        responseType: "text",
    });

    const bootstrapCookie = mergeCookieHeaders(config.wallCookie, toCookieHeader(bootstrapTrace));
    const extractedFrameUrl = extractUsableFrameUrl(bootstrapTrace);
    const redirectedToRegister = /\/register\b/i.test(bootstrapTrace.finalUrl);

    logger.info("CashInStyle wall bootstrap completed", {
        requestUrl: bootstrapTrace.url,
        finalUrl: bootstrapTrace.finalUrl,
        responseStatus: bootstrapTrace.status,
        topLevelKeys: bootstrapTrace.topLevelKeys,
        extractedFrameUrl,
        redirectedToRegister,
        hasCookie: Boolean(bootstrapCookie),
    });

    if (!extractedFrameUrl) {
        if (redirectedToRegister) {
            throw new Error(
                "CashInStyle wall access redirected to register. Set CASHINSTYLE_COOKIE from an authenticated browser session.",
            );
        }

        throw new Error("CashInStyle wall bootstrap did not expose a usable Torox frame URL.");
    }

    const handoff = await resolveFrameContext(config, extractedFrameUrl, bootstrapCookie);
    const settingsTrace = await fetchRequest(config.settingsUrl, {
        label: "cashinstyle-torox-settings",
        headers: buildToroxHeaders(handoff.cookieHeader, config.toroxSid, handoff.finalUrl, config.toroxHeaders),
    });

    logger.info("CashInStyle Torox settings completed", {
        requestUrl: settingsTrace.url,
        finalUrl: settingsTrace.finalUrl,
        responseStatus: settingsTrace.status,
        topLevelKeys: settingsTrace.topLevelKeys,
        hasToroxSid: Boolean(config.toroxSid || config.toroxHeaders["x-torox-sid"]),
    });

    if (settingsTrace.status === 401) {
        throw new Error(
            "CashInStyle Torox wall rejected the session after frame handoff. Refresh CASHINSTYLE_COOKIE and CASHINSTYLE_TOROX_SID from a fresh browser session.",
        );
    }

    return {
        cookieHeader: handoff.cookieHeader,
        inferredParams: extractToroxCampaignContext(settingsTrace.data),
        frameUrl: handoff.finalUrl,
    };
}

async function resolveFrameContext(
    config: CashInStyleConfig,
    frameUrl: string,
    cookieHeader?: string | null,
): Promise<FrameHandoffResult> {
    const handoff = await performFrameHandoff(config, frameUrl, cookieHeader ?? null);

    logger.info("CashInStyle frame handoff resolved", {
        initialFrameUrl: frameUrl,
        finalResolvedFrameUrl: handoff.finalUrl,
        hasCookie: Boolean(handoff.cookieHeader),
        hasToroxSid: Boolean(config.toroxSid || config.toroxHeaders["x-torox-sid"]),
        toroxHeaderKeys: Object.keys(config.toroxHeaders).sort(),
    });

    return handoff;
}

async function performFrameHandoff(
    config: CashInStyleConfig,
    frameUrl: string,
    initialCookieHeader: string | null,
): Promise<FrameHandoffResult> {
    let currentUrl = frameUrl;
    let cookieHeader = mergeCookieHeaders(initialCookieHeader, config.toroxCookie);

    for (let step = 1; step <= 5; step += 1) {
        const response = await withRetry(
            () =>
                axios.get(currentUrl, {
                    timeout: 30000,
                    headers: buildWallHeaders(config, cookieHeader),
                    responseType: "text",
                    withCredentials: true,
                    maxRedirects: 0,
                    validateStatus: () => true,
                }),
            `cashinstyle-frame-handoff-${step}`,
        );

        const responseHeaders = response.headers as Record<string, unknown>;
        const setCookieHeader = normalizeSetCookieHeader(responseHeaders["set-cookie"]);
        cookieHeader = mergeCookieHeaders(cookieHeader, setCookieHeader);
        const locationHeader = typeof responseHeaders.location === "string" ? responseHeaders.location : null;
        const redirectTarget = locationHeader ? new URL(locationHeader, currentUrl).toString() : null;

        logger.info("CashInStyle frame handoff step", {
            step,
            requestUrl: currentUrl,
            responseStatus: response.status,
            redirectTarget,
            capturedSetCookie: setCookieHeader,
            mergedCookieHeader: cookieHeader,
        });

        if (redirectTarget) {
            currentUrl = redirectTarget;
            continue;
        }

        return {
            finalUrl: currentUrl,
            cookieHeader,
        };
    }

    return {
        finalUrl: currentUrl,
        cookieHeader,
    };
}

async function fetchToroxCampaigns(config: CashInStyleConfig, context: ToroxContext): Promise<SourceOffer[]> {
    const offers: SourceOffer[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= config.maxPages; page += 1) {
        const trace = await fetchRequest(config.campaignsUrl, {
            label: `cashinstyle-torox-campaigns-page-${page}`,
            headers: buildToroxHeaders(context.cookieHeader, config.toroxSid, context.frameUrl, config.toroxHeaders),
            params: {
                ...context.inferredParams,
                page,
                sort: config.sort,
                os: config.os,
            },
        });

        const campaigns = extractCampaignNodes(trace.data);
        logger.info("CashInStyle campaigns page parsed", {
            page,
            requestUrl: trace.url,
            finalUrl: trace.finalUrl,
            responseStatus: trace.status,
            topLevelKeys: trace.topLevelKeys,
            parsedCount: campaigns.length,
        });

        if (trace.status === 401) {
            throw new Error(
                "CashInStyle Torox campaigns request returned 401. Refresh CASHINSTYLE_COOKIE and CASHINSTYLE_TOROX_SID from a fresh browser session.",
            );
        }

        if (campaigns.length === 0) {
            break;
        }

        for (const campaign of campaigns) {
            const parsed = await parseCampaign(config, context, campaign);
            if (!parsed) continue;
            if (seen.has(parsed.external_id)) continue;
            seen.add(parsed.external_id);
            offers.push(parsed);
            if (offers.length >= config.limit) break;
        }

        if (campaigns.length < 50 || offers.length >= config.limit) {
            break;
        }
    }

    return offers;
}

async function parseCampaign(
    config: CashInStyleConfig,
    context: ToroxContext,
    campaign: unknown,
): Promise<SourceOffer | null> {
    if (!isRecord(campaign)) return null;

    const campaignId = firstString(campaign.id, campaign.campaign_id, campaign.offer_id, campaign.offerId);
    const rawTitle = firstString(campaign.name, campaign.title, campaign.offer_name);
    if (!campaignId || !rawTitle) return null;

    const detail = await fetchCampaignDetail(config, context, campaignId);
    const merged = detail ? { ...campaign, ...detail } : campaign;
    const detailTasks = extractToroxEventTaskList(merged, config.boostMultiplier);
    const rawCampaignAmount = extractRawToroxAmount(merged);
    const baseFallbackPayout = normalizeToroxAmount(rawCampaignAmount);
    const fallbackPayout = applyToroxBoostMultiplier(baseFallbackPayout, config.boostMultiplier);
    const totalPayoutUsd = detailTasks.length > 0
        ? round(detailTasks.reduce((sum, task) => sum + task.reward_amount_usd, 0))
        : fallbackPayout;
    const bestPayoutUsd = detailTasks.length > 0
        ? Math.max(...detailTasks.map((task) => task.reward_amount_usd))
        : fallbackPayout;

    if (!Number.isFinite(bestPayoutUsd) || bestPayoutUsd <= 0) {
        return null;
    }

    const parentTitle = extractParentTitle(rawTitle);
    const clickUrl = await fetchCampaignClickUrl(config, context, campaignId);
    const destinationUrl = clickUrl || extractDestinationUrl(merged) || config.wallUrl;

    return {
        external_id: `cashinstyle-${campaignId}`,
        title: parentTitle,
        payout_raw: bestPayoutUsd.toFixed(2),
        total_payout_raw: totalPayoutUsd.toFixed(2),
        best_payout_usd: bestPayoutUsd,
        currency: "USD",
        device_raw: normalizeDevices(merged),
        category_raw: firstString(merged.verticalNames, merged.vertical_names, merged.category, merged.vertical, merged.type) || inferCategory(merged),
        url: destinationUrl,
        expires_raw: extractExpiry(merged),
        game_slug: null,
        countries_raw: extractCountries(merged),
        game_title: parentTitle,
        provider_name: "CashInStyle",
        image_url: extractImageUrl(merged),
        task_list: detailTasks,
    };
}

async function fetchCampaignDetail(
    config: CashInStyleConfig,
    context: ToroxContext,
    campaignId: string,
): Promise<Record<string, unknown> | null> {
    const detailUrl = buildDetailUrl(config.campaignsUrl, campaignId);
    const trace = await fetchRequest(detailUrl, {
        label: `cashinstyle-torox-campaign-detail-${campaignId}`,
        headers: buildToroxHeaders(context.cookieHeader, config.toroxSid, context.frameUrl, config.toroxHeaders),
        params: context.inferredParams,
    });

    const detailRecord = unwrapRecord(trace.data);
    logger.info("CashInStyle campaign detail fetched", {
        campaignId,
        requestUrl: trace.url,
        finalUrl: trace.finalUrl,
        responseStatus: trace.status,
        topLevelKeys: trace.topLevelKeys,
        detailKeys: detailRecord ? Object.keys(detailRecord) : null,
    });

    return trace.status >= 200 && trace.status < 300 ? detailRecord : null;
}

async function fetchCampaignClickUrl(
    config: CashInStyleConfig,
    context: ToroxContext,
    campaignId: string,
): Promise<string | null> {
    const clickUrl = buildClickUrl(config.campaignsUrl, campaignId);
    const trace = await fetchRequest(clickUrl, {
        label: `cashinstyle-torox-campaign-click-${campaignId}`,
        headers: buildToroxHeaders(context.cookieHeader, config.toroxSid, context.frameUrl, config.toroxHeaders),
    });

    const payload = unwrapRecord(trace.data);
    const resolvedClickUrl = payload ? firstString(payload.clickUrl, payload.click_url, payload.url) : "";

    logger.info("CashInStyle campaign click fetched", {
        campaignId,
        requestUrl: trace.url,
        finalUrl: trace.finalUrl,
        responseStatus: trace.status,
        topLevelKeys: trace.topLevelKeys,
        hasClickUrl: Boolean(resolvedClickUrl),
    });

    return isHttpUrl(resolvedClickUrl) ? resolvedClickUrl : null;
}

async function fetchRequest(
    rawUrl: string,
    options: {
        label: string;
        headers?: Record<string, string>;
        params?: Record<string, string | number | undefined>;
        responseType?: "json" | "text";
    },
): Promise<RequestTrace> {
    const url = new URL(rawUrl);
    for (const [key, value] of Object.entries(options.params ?? {})) {
        if (value === undefined || value === null || value === "") continue;
        url.searchParams.set(key, String(value));
    }

    logger.info("CashInStyle request started", {
        label: options.label,
        requestUrl: url.toString(),
    });

    const response = await withRetry(
        () =>
            axios.get(url.toString(), {
                timeout: 30000,
                headers: options.headers,
                responseType: options.responseType ?? "json",
                withCredentials: true,
                maxRedirects: 10,
                validateStatus: () => true,
            }),
        options.label,
    );

    const data = response.data;
    const topLevelKeys = isRecord(data) ? Object.keys(data) : [];
    const finalUrl = response?.request?.res?.responseUrl || response?.request?.responseURL || url.toString();

    logger.info("CashInStyle request completed", {
        label: options.label,
        requestUrl: url.toString(),
        finalUrl,
        responseStatus: response.status,
        topLevelKeys,
    });

    return {
        url: url.toString(),
        finalUrl,
        status: response.status,
        data,
        topLevelKeys,
        headers: response.headers as Record<string, unknown>,
    };
}

function buildWallHeaders(config: CashInStyleConfig, cookieHeader?: string | null): Record<string, string> {
    return {
        ...DEFAULT_CASHINSTYLE_HEADERS,
        referer: config.wallReferer,
        ...(cookieHeader ? { "Cookie": cookieHeader } : {}),
        ...config.wallHeaders,
    };
}

function buildToroxHeaders(
    cookieHeader?: string | null,
    toroxSid?: string | null,
    frameUrl?: string | null,
    extraHeaders: Record<string, string> = {},
): Record<string, string> {
    const toroxCookieHeader = filterToroxCookieHeader(cookieHeader);
    const bearerToken = extractToroxBearerToken(frameUrl);
    return {
        ...DEFAULT_CASHINSTYLE_HEADERS,
        ...DEFAULT_TOROX_HEADERS,
        ...(toroxSid ? { "x-torox-sid": toroxSid } : {}),
        ...(bearerToken ? { authorization: `Bearer ${bearerToken}` } : {}),
        ...(toroxCookieHeader ? { "Cookie": toroxCookieHeader } : {}),
        ...extraHeaders,
    };
}

function extractToroxBearerToken(frameUrl?: string | null): string | null {
    if (!frameUrl) return null;

    try {
        const url = new URL(frameUrl);
        const token = url.pathname.split("/").filter(Boolean).at(-1)?.trim() || "";
        return token || null;
    } catch {
        return null;
    }
}

function extractUsableFrameUrl(trace: RequestTrace): string | null {
    const candidates = [
        trace.finalUrl,
        typeof trace.data === "string" ? extractFirstHttpUrl(trace.data, /https:\/\/wall\.torox\.io\/[A-Za-z0-9-]+/i) : null,
        isRecord(trace.data) ? findStringByKeys(trace.data, ["frameUrl", "iframeUrl", "wallUrl", "url"]) : null,
    ].filter(Boolean);

    for (const candidate of candidates) {
        const value = String(candidate).trim();
        if (/^https:\/\/wall\.torox\.io\/[A-Za-z0-9-]+/i.test(value)) {
            return value;
        }
    }

    return null;
}

function extractToroxCampaignContext(payload: unknown): Record<string, string> {
    if (!isRecord(payload)) return {};

    const params: Record<string, string> = {};
    const candidates: Array<[string, unknown]> = [
        ["app_id", payload.app_id ?? payload.appId],
        ["uid", payload.uid ?? payload.user_id ?? payload.userId],
        ["sid", payload.sid ?? payload.session_id ?? payload.sessionId],
        ["pubid", payload.pubid ?? payload.publisher_id ?? payload.publisherId],
        ["subid", payload.subid ?? payload.sub_id ?? payload.subId],
    ];

    for (const [key, value] of candidates) {
        const normalized = firstString(value);
        if (normalized) params[key] = normalized;
    }

    return params;
}

function extractCampaignNodes(payload: unknown): unknown[] {
    if (Array.isArray(payload)) {
        return payload.filter(looksLikeCampaign);
    }

    if (!isRecord(payload)) return [];

    for (const key of ["data", "campaigns", "items", "results", "offers"]) {
        const candidate = payload[key];
        if (Array.isArray(candidate)) {
            return candidate.filter(looksLikeCampaign);
        }
    }

    return [];
}

function looksLikeCampaign(node: unknown): boolean {
    if (!isRecord(node)) return false;
    return Boolean(firstString(node.id, node.campaign_id, node.offer_id, node.offerId)) &&
        Boolean(firstString(node.name, node.title, node.offer_name));
}

function extractToroxEventTaskList(payload: Record<string, unknown>, multiplier: number): NonNullable<SourceOffer["task_list"]> {
    const events = Array.isArray(payload.events) ? payload.events : [];
    const tasks: NonNullable<SourceOffer["task_list"]> = [];

    for (const [index, event] of events.entries()) {
        if (!isRecord(event)) continue;

        const title = firstString(event.eventName, event.event_name, event.name, event.title);
        const rawAmount = extractRawToroxAmount(event);
        const normalizedAmount = normalizeToroxAmount(rawAmount);
        const boostedAmount = applyToroxBoostMultiplier(normalizedAmount, multiplier);
        if (!title || !Number.isFinite(boostedAmount) || boostedAmount <= 0) continue;

        tasks.push({
            title: sanitizeTaskTitle(title),
            reward_amount_usd: round(boostedAmount),
            reward_display: `$${round(boostedAmount).toFixed(2)}`,
            task_type: inferTaskType(title),
            time_limit_text: firstString(event.time_limit_text, event.timeLimitText, event.deadline_text, event.deadline),
            notes: buildToroxBasePayoutNote(
                firstString(event.callToAction, event.call_to_action, event.description, payload.callToAction, payload.call_to_action),
                normalizedAmount,
            ),
            sort_order: extractToroxEventOrder(event, index),
        });
    }

    return tasks;
}

function extractRawToroxAmount(payload: Record<string, unknown>): number | null {
    const candidates = [
        payload.amount,
        payload.reward,
        payload.payout,
        payload.total_reward,
        payload.totalReward,
        payload.value,
    ];

    for (const candidate of candidates) {
        const parsed = toNumber(candidate);
        if (parsed !== null && parsed > 0) {
            return parsed;
        }
    }

    return null;
}

function normalizeToroxAmount(amount: number | null): number {
    if (amount === null || !Number.isFinite(amount) || amount <= 0) return 0;
    return round(amount / 1000);
}

function applyToroxBoostMultiplier(baseAmount: number, multiplier: number): number {
    if (!Number.isFinite(baseAmount) || baseAmount <= 0) return 0;
    const effectiveMultiplier = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : DEFAULT_TOROX_BOOST_MULTIPLIER;
    return round(baseAmount * effectiveMultiplier);
}

function buildToroxBasePayoutNote(note: string, baseAmount: number): string | null {
    const basePayoutNote = Number.isFinite(baseAmount) && baseAmount > 0 ? `Base payout: $${baseAmount.toFixed(2)}` : "";
    return [note, basePayoutNote].filter(Boolean).join(" | ") || null;
}

function extractToroxEventOrder(event: Record<string, unknown>, index: number): number {
    const explicitOrder = toNumber(event.orderId ?? event.order_id ?? event.order);
    if (explicitOrder !== null && explicitOrder > 0) {
        return Math.trunc(explicitOrder);
    }
    return index + 1;
}

function extractParentTitle(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    const [head, tail] = trimmed.split(" - ", 2);
    if (tail && /\b(reach|complete|level|install|purchase)\b/i.test(tail)) {
        return head.trim();
    }
    return trimmed;
}

function extractDestinationUrl(payload: Record<string, unknown>): string | null {
    const direct = firstString(
        payload.click_url,
        payload.clickUrl,
        payload.offer_url,
        payload.offerUrl,
        payload.url,
        payload.link,
        payload.tracking_url,
        payload.trackingUrl,
        payload.action_url,
        payload.actionUrl,
        payload.cta_url,
        payload.ctaUrl,
    );
    if (isHttpUrl(direct)) return direct;
    return null;
}

function extractImageUrl(payload: Record<string, unknown>): string | null {
    const direct = firstString(
        payload.image,
        payload.image_url,
        payload.imageUrl,
        payload.thumbnail,
        payload.thumbnail_url,
        payload.thumbnailUrl,
        payload.icon,
        payload.logo,
    );
    return isHttpUrl(direct) ? direct : null;
}

function extractCountries(payload: Record<string, unknown>): string[] | null {
    const candidates = [payload.countries, payload.country_codes, payload.countryCodes];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            const countries = candidate
                .map((value) => firstString(value).toUpperCase())
                .filter((value) => /^[A-Z]{2}$/.test(value));
            if (countries.length > 0) return Array.from(new Set(countries));
        }

        if (typeof candidate === "string" && candidate.trim()) {
            const countries = candidate
                .split(/[\s,|]+/)
                .map((value) => value.trim().toUpperCase())
                .filter((value) => /^[A-Z]{2}$/.test(value));
            if (countries.length > 0) return Array.from(new Set(countries));
        }
    }

    return null;
}

function extractExpiry(payload: Record<string, unknown>): string | null {
    return firstString(
        payload.expires_at,
        payload.offer_expires_at,
        payload.expiry,
        payload.expiration_date,
        payload.deadline,
    ) || null;
}

function normalizeDevices(payload: Record<string, unknown>): string {
    const values = [
        payload.devices,
        payload.os,
        payload.oses,
        payload.platform,
        payload.platforms,
        payload.device,
    ];

    const tokens = new Set<string>();
    for (const value of values) {
        if (typeof value === "string") {
            for (const part of value.split(/[\s,|/]+/)) {
                const normalized = normalizeDeviceToken(part);
                if (normalized) tokens.add(normalized);
            }
        } else if (Array.isArray(value)) {
            for (const part of value) {
                const normalized = normalizeDeviceToken(firstString(part));
                if (normalized) tokens.add(normalized);
            }
        }
    }

    return tokens.size > 0 ? Array.from(tokens).join(",") : "web";
}

function normalizeDeviceToken(value: string): string | null {
    const token = value.trim().toLowerCase();
    if (!token) return null;
    if (token.includes("android")) return "android";
    if (token.includes("ios") || token.includes("iphone") || token.includes("ipad")) return "ios";
    if (token.includes("desktop") || token.includes("pc") || token.includes("windows") || token.includes("mac")) return "pc";
    if (token.includes("web")) return "web";
    return null;
}

function inferCategory(payload: Record<string, unknown>): string {
    const raw = `${firstString(payload.category, payload.vertical, payload.type, payload.verticalNames, payload.vertical_names)} ${firstString(payload.name, payload.title)}`.trim().toLowerCase();
    if (!raw) return "other";
    if (raw.includes("survey")) return "survey";
    if (raw.includes("game")) return "mobile_game";
    if (/\b(level|board|village|puzzle|casino)\b/i.test(raw)) return "mobile_game";
    return raw.replace(/\s+/g, "_");
}

function inferTaskType(title: string): "install" | "milestone" | "purchase" | "signup" | "other" {
    const raw = title.toLowerCase();
    if (/\binstall|download|open\b/.test(raw)) return "install";
    if (/\bpurchase|spend|buy\b/.test(raw)) return "purchase";
    if (/\bsign\s?up|register|create account\b/.test(raw)) return "signup";
    if (/\breach|complete|finish|level|board|stage|chapter\b/.test(raw)) return "milestone";
    return "other";
}

function sanitizeTaskTitle(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

function unwrapRecord(payload: unknown): Record<string, unknown> | null {
    if (isRecord(payload)) {
        if (isRecord(payload.data)) return payload.data;
        return payload;
    }
    return null;
}

function buildDetailUrl(campaignsUrl: string, campaignId: string): string {
    const url = new URL(campaignsUrl);
    url.search = "";
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/${encodeURIComponent(campaignId)}`;
    return url.toString();
}

function buildClickUrl(campaignsUrl: string, campaignId: string): string {
    const url = new URL(campaignsUrl);
    url.search = "";
    url.pathname = `${url.pathname.replace(/\/campaigns\/?$/i, "/campaign").replace(/\/+$/, "")}/${encodeURIComponent(campaignId)}/click`;
    return url.toString();
}

function parseHeadersJson(value: string | undefined): Record<string, string> {
    if (!value?.trim()) return {};
    try {
        const parsed = JSON.parse(value);
        if (!isRecord(parsed)) return {};
        return Object.fromEntries(
            Object.entries(parsed)
                .filter(([, headerValue]) => typeof headerValue === "string" && headerValue.trim())
                .map(([key, headerValue]) => [key, String(headerValue)]),
        );
    } catch {
        return {};
    }
}

function normalizeSetCookieHeader(value: unknown): string | null {
    if (!Array.isArray(value) || value.length === 0) return null;
    const normalized = value
        .map((entry) => String(entry).split(";", 1)[0].trim())
        .filter(Boolean)
        .join("; ");
    return normalized || null;
}

function toCookieHeader(trace: RequestTrace): string | null {
    return normalizeSetCookieHeader(trace.headers["set-cookie"]);
}

function mergeCookieHeaders(existing: string | null, incoming: string | null): string | null {
    const cookieMap = new Map<string, string>();

    for (const header of [existing, incoming]) {
        if (!header) continue;
        for (const part of header.split(";")) {
            const trimmed = part.trim();
            if (!trimmed) continue;
            const separatorIndex = trimmed.indexOf("=");
            if (separatorIndex <= 0) continue;
            const key = trimmed.slice(0, separatorIndex).trim();
            const value = trimmed.slice(separatorIndex + 1).trim();
            cookieMap.set(key, value);
        }
    }

    if (cookieMap.size === 0) return null;
    return Array.from(cookieMap.entries()).map(([key, value]) => `${key}=${value}`).join("; ");
}

function filterToroxCookieHeader(cookieHeader: string | null | undefined): string | null {
    if (!cookieHeader) return null;

    const toroxPairs = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part) => {
            const separatorIndex = part.indexOf("=");
            if (separatorIndex <= 0) return false;
            const key = part.slice(0, separatorIndex).trim().toLowerCase();
            return key.includes("torox");
        });

    return toroxPairs.length > 0 ? toroxPairs.join("; ") : null;
}

function firstString(...values: unknown[]): string {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) return value.trim();
        if (typeof value === "number" && Number.isFinite(value)) return String(value);
    }
    return "";
}

function findStringByKeys(payload: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
        const direct = payload[key];
        const normalized = firstString(direct);
        if (normalized) return normalized;
    }
    return null;
}

function findStringValues(value: unknown, depth = 0, maxDepth = 3): string[] {
    if (depth > maxDepth) return [];
    if (typeof value === "string" && value.trim()) return [value.trim()];
    if (Array.isArray(value)) {
        return value.flatMap((item) => findStringValues(item, depth + 1, maxDepth));
    }
    if (!isRecord(value)) return [];
    return Object.values(value).flatMap((item) => findStringValues(item, depth + 1, maxDepth));
}

function extractFirstHttpUrl(value: string, pattern: RegExp): string | null {
    const match = value.match(pattern);
    return match ? match[0] : null;
}

function isHttpUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function round(value: number): number {
    return Math.round(value * 100) / 100;
}

function isRecord(value: unknown): value is Record<string, any> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePositiveFloat(value: string | undefined, fallback: number): number {
    const parsed = Number.parseFloat(value ?? "");
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getConfig(): CashInStyleConfig {
    const siteUrl = process.env.CASHINSTYLE_SITE_URL?.trim() || DEFAULT_CASHINSTYLE_SITE_URL;
    const wallUrl = process.env.CASHINSTYLE_API_URL?.trim() || process.env.CASHINSTYLE_WALL_URL?.trim() || DEFAULT_CASHINSTYLE_WALL_URL;
    return {
        wallUrl,
        siteUrl,
        wallReferer: process.env.CASHINSTYLE_REFERER?.trim() || `${siteUrl}/home`,
        wallOrigin: process.env.CASHINSTYLE_ORIGIN?.trim() || siteUrl,
        wallCookie: process.env.CASHINSTYLE_COOKIE?.trim() || null,
        wallHeaders: parseHeadersJson(process.env.CASHINSTYLE_HEADERS_JSON),
        frameUrl: process.env.CASHINSTYLE_TOROX_FRAME_URL?.trim() || null,
        toroxCookie: process.env.CASHINSTYLE_TOROX_COOKIE?.trim() || null,
        toroxSid: process.env.CASHINSTYLE_TOROX_SID?.trim() || null,
        toroxHeaders: parseHeadersJson(process.env.CASHINSTYLE_TOROX_HEADERS_JSON),
        campaignsUrl: process.env.CASHINSTYLE_TOROX_CAMPAIGNS_URL?.trim() || DEFAULT_TOROX_CAMPAIGNS_URL,
        settingsUrl: process.env.CASHINSTYLE_TOROX_SETTINGS_URL?.trim() || DEFAULT_TOROX_SETTINGS_URL,
        os: process.env.CASHINSTYLE_TOROX_OS?.trim() || DEFAULT_TOROX_OS,
        sort: process.env.CASHINSTYLE_TOROX_SORT?.trim() || DEFAULT_TOROX_SORT,
        limit: parsePositiveInt(process.env.CASHINSTYLE_LIMIT, DEFAULT_LIMIT),
        maxPages: parsePositiveInt(process.env.CASHINSTYLE_MAX_PAGES, DEFAULT_MAX_PAGES),
        boostMultiplier: parsePositiveFloat(process.env.CASHINSTYLE_TOROX_BOOST_MULTIPLIER, DEFAULT_TOROX_BOOST_MULTIPLIER),
    };
}
