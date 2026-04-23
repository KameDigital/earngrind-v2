import axios from "axios";
import * as cheerio from "cheerio";
import { withRetry } from "../core/db";
import { logger } from "../core/logger";
import { SourceAdapter } from "../models/source";
import { SourceOffer } from "../types/offer";

const DEFAULT_EARNLAB_SITE_URL = "https://earnlab.com/earn";
const DEFAULT_EARNLAB_TASKS_URL = "https://earnlab.com/tasks";
const DEFAULT_EARNLAB_API_BASE = "https://api.earnlab.com";
const DEFAULT_EARNLAB_TASKS_API_URL = `${DEFAULT_EARNLAB_API_BASE}/tasks`;
const DEFAULT_EARNLAB_BOOT_API_URL = `${DEFAULT_EARNLAB_API_BASE}/boot`;
const DEFAULT_EARNLAB_COUNTRY = "US";
const DEFAULT_EARNLAB_SORT = "POPULARITY";
const DEFAULT_EARNLAB_LIMIT = 75;
const MAX_EARNLAB_LIMIT = 75;
const DEFAULT_EARNLAB_TOROX_BOOTSTRAP_URL = "https://api.earnlab.com/tasks/walls/torox";
const DEFAULT_EARNLAB_TOROX_CAMPAIGNS_URL = "https://api.wall.torox.io/player/campaigns";
const DEFAULT_EARNLAB_TOROX_SETTINGS_URL = "https://api.wall.torox.io/player/settings";
const DEFAULT_EARNLAB_TOROX_OS = "web,ios,android";
const DEFAULT_EARNLAB_TOROX_LIMIT = 100;
const DEFAULT_EARNLAB_TOROX_BOOST_MULTIPLIER = 1.8;
const DEFAULT_PAGE_SIZE = 50;
const MAX_AUTO_PAGES = 5;
const TOROX_WALL_ORIGIN = "https://wall.torox.io";
const TOROX_WALL_REFERER = "https://wall.torox.io/";

const MOCK_EARNLAB_OFFERS: SourceOffer[] = [
    {
        external_id: "earnlab-torox-1001",
        title: "Raid: Shadow Legends",
        payout_raw: "32.00",
        total_payout_raw: "71.00",
        currency: "USD",
        device_raw: "web,ios,android",
        category_raw: "Mobile Games",
        url: "https://earnlab.com/earn",
        expires_raw: null,
        game_slug: "raid-shadow-legends",
        countries_raw: ["US", "CA"],
        game_title: "Raid: Shadow Legends",
        provider_name: "Torox",
        image_url: "https://example.com/raid-shadow-legends.jpg",
        best_payout_usd: 32,
        task_list: [
            {
                title: "Install and open the game",
                reward_amount_usd: 4,
                reward_display: "$4.00",
                task_type: "install",
                time_limit_text: null,
                notes: null,
                sort_order: 1,
            },
            {
                title: "Reach Level 15",
                reward_amount_usd: 12,
                reward_display: "$12.00",
                task_type: "milestone",
                time_limit_text: "30 days",
                notes: null,
                sort_order: 2,
            },
            {
                title: "Reach Level 25",
                reward_amount_usd: 32,
                reward_display: "$32.00",
                task_type: "milestone",
                time_limit_text: "30 days",
                notes: null,
                sort_order: 3,
            },
            {
                title: "Make any in-app purchase",
                reward_amount_usd: 23,
                reward_display: "$23.00",
                task_type: "purchase",
                time_limit_text: null,
                notes: null,
                sort_order: 4,
            },
        ],
    },
    {
        external_id: "earnlab-torox-1002",
        title: "Monopoly GO",
        payout_raw: "21.50",
        total_payout_raw: "21.50",
        currency: "USD",
        device_raw: "ios,android",
        category_raw: "Mobile Games",
        url: "https://earnlab.com/earn",
        expires_raw: null,
        game_slug: "monopoly-go",
        countries_raw: ["US"],
        game_title: "Monopoly GO",
        provider_name: "Torox",
        image_url: "https://example.com/monopoly-go.jpg",
        best_payout_usd: 21.5,
        task_list: [
            {
                title: "Reach Board 71",
                reward_amount_usd: 21.5,
                reward_display: "$21.50",
                task_type: "milestone",
                time_limit_text: "21 days",
                notes: null,
                sort_order: 1,
            },
        ],
    },
];

interface RequestTrace {
    url: string;
    finalUrl: string;
    status: number;
    data: unknown;
    topLevelKeys: string[];
    headers: Record<string, unknown>;
}

interface EarnlabBootResponse {
    success?: boolean;
    data?: {
        countryCode?: string | null;
    } | null;
}

interface EarnlabTasksResponse {
    success?: boolean;
    data?: {
        items?: EarnlabTaskSummary[];
        totalItems?: number | null;
        totalPages?: number | null;
    } | null;
}

interface EarnlabTaskSummary {
    id: string;
    name: string;
    provider?: string | null;
    description?: string | null;
    thumbnail?: string | null;
    reward?: number | null;
    category?: string | null;
    customCategory?: string | null;
    isDesktop?: boolean | null;
    isAndroid?: boolean | null;
    isIOS?: boolean | null;
}

interface EarnlabConfig {
    bootstrapUrl: string;
    frameUrl: string | null;
    campaignsUrl: string;
    settingsUrl: string;
    os: string;
    limit: number;
    boostMultiplier: number;
    bootstrapReferer: string;
    bootstrapOrigin: string;
    bootstrapCookie: string | null;
    toroxCookie: string | null;
    bootstrapHeaders: Record<string, string>;
    toroxHeaders: Record<string, string>;
}

interface ToroxContext {
    cookieHeader: string | null;
    inferredParams: Record<string, string>;
    bootstrapRequired: boolean | null;
    bootstrapAttempted: boolean;
    authBlocked: boolean;
    frameUrl: string | null;
    toroxOrigin: string;
    toroxReferer: string;
}

interface FrameHandoffResult {
    finalUrl: string;
    cookieHeader: string | null;
}

export async function fetchOffers(): Promise<SourceOffer[]> {
    const useMock = (process.env.EARNLAB_USE_MOCK ?? "true").toLowerCase() === "true";
    if (useMock) {
        logger.info("EarnLab source using mock offers", { count: MOCK_EARNLAB_OFFERS.length });
        return [...MOCK_EARNLAB_OFFERS];
    }

    const apiOffers = await fetchEarnlabApiOffers();
    if (apiOffers.length > 0) {
        logger.info("EarnLab parsed offer count", {
            parsedCount: apiOffers.length,
            source: "public-api",
        });
        return apiOffers;
    }

    const config = getConfig();
    const taskPageOffers = await fetchEarnlabTasksPageOffers(config.limit);
    if (taskPageOffers.length > 0) {
        logger.info("EarnLab parsed offer count", {
            parsedCount: taskPageOffers.length,
            source: "tasks-page",
        });
        return taskPageOffers;
    }

    const context = await discoverToroxContext(config);
    const offers = await fetchToroxCampaigns(config, context);

    logger.info("EarnLab parsed offer count", {
        parsedCount: offers.length,
        source: "torox-fallback",
        bootstrapRequired: context.bootstrapRequired,
        bootstrapAttempted: context.bootstrapAttempted,
        authBlocked: context.authBlocked,
    });

    if (offers.length === 0) {
        throw new Error("EarnLab/Torox source returned 0 parsed offers.");
    }

    return offers;
}

export const earnlabSource: SourceAdapter = {
    key: "earnlab",
    name: "EarnLab",
    type: "api",
    baseUrl: DEFAULT_EARNLAB_TOROX_CAMPAIGNS_URL,
    storage: "site_offers",
    mockEnvVar: "EARNLAB_USE_MOCK",
    fetchOffers,
};

async function fetchEarnlabApiOffers(): Promise<SourceOffer[]> {
    const apiBase = process.env.EARNLAB_API_BASE?.trim() || DEFAULT_EARNLAB_API_BASE;
    const bootUrl = process.env.EARNLAB_BOOT_API_URL?.trim() || `${apiBase}/boot`;
    const tasksUrl = process.env.EARNLAB_TASKS_API_URL?.trim() || `${apiBase}/tasks`;
    const country = await resolveEarnlabCountryCode(bootUrl);
    const limit = Math.min(parsePositiveInt(process.env.EARNLAB_API_LIMIT, DEFAULT_EARNLAB_LIMIT), MAX_EARNLAB_LIMIT);
    const sort = process.env.EARNLAB_API_SORT?.trim() || DEFAULT_EARNLAB_SORT;

    const offers: SourceOffer[] = [];
    let totalPages = 1;

    for (let page = 0; page < totalPages; page += 1) {
        const response = await withRetry(
            () =>
                axios.get<EarnlabTasksResponse>(tasksUrl, {
                    timeout: 20000,
                    headers: buildEarnlabApiHeaders(),
                    params: {
                        country,
                        sort,
                        page,
                        limit,
                    },
                }),
            `earnlab-api-tasks-${page}`,
        );

        const items = response.data?.data?.items ?? [];
        const responseTotalPages = response.data?.data?.totalPages;
        if (Number.isFinite(responseTotalPages) && Number(responseTotalPages) > 0) {
            totalPages = Number(responseTotalPages);
        } else if (items.length < limit) {
            totalPages = page + 1;
        }

        logger.info("EarnLab API page fetched", {
            page,
            totalPages,
            count: items.length,
            country,
            sort,
        });

        for (const item of items) {
            const normalized = normalizeEarnlabTaskSummary(item);
            if (normalized) {
                offers.push(normalized);
            }
        }

        if (items.length === 0) {
            break;
        }
    }

    return offers;
}

async function resolveEarnlabCountryCode(bootUrl: string): Promise<string> {
    const configured = process.env.EARNLAB_COUNTRY?.trim().toUpperCase();
    if (configured) {
        return configured;
    }

    try {
        const response = await withRetry(
            () =>
                axios.get<EarnlabBootResponse>(bootUrl, {
                    timeout: 15000,
                    headers: buildEarnlabApiHeaders(),
                }),
            "earnlab-api-boot",
        );

        const countryCode = response.data?.data?.countryCode?.trim().toUpperCase();
        if (countryCode && /^[A-Z]{2}$/.test(countryCode)) {
            return countryCode;
        }
    } catch (error) {
        logger.warn("EarnLab boot lookup failed; falling back to default country", {
            error: error instanceof Error ? error.message : String(error),
        });
    }

    return DEFAULT_EARNLAB_COUNTRY;
}

function normalizeEarnlabTaskSummary(task: EarnlabTaskSummary): SourceOffer | null {
    const externalId = task.id?.trim();
    const title = task.name?.trim();
    const payoutUsd = toEarnlabUsd(task.reward);

    if (!externalId || !title || payoutUsd <= 0) {
        return null;
    }

    const devices = normalizeEarnlabDevices(task);
    const category = normalizeEarnlabCategory(task.category, task.customCategory);
    const providerName = normalizeEarnlabProviderName(task.provider);
    const description = normalizeWhitespace(task.description ?? "");

    return {
        external_id: externalId,
        title,
        payout_raw: payoutUsd.toFixed(2),
        total_payout_raw: payoutUsd.toFixed(2),
        currency: "USD",
        device_raw: devices,
        category_raw: category,
        url: DEFAULT_EARNLAB_TASKS_URL,
        expires_raw: null,
        game_slug: null,
        countries_raw: [DEFAULT_EARNLAB_COUNTRY],
        game_title: title,
        provider_name: providerName,
        image_url: task.thumbnail?.trim() || null,
        best_payout_usd: payoutUsd,
        task_list: description
            ? [
                {
                    title,
                    reward_amount_usd: payoutUsd,
                    reward_display: `$${payoutUsd.toFixed(2)}`,
                    task_type: "other",
                    time_limit_text: null,
                    notes: description,
                    sort_order: 1,
                },
            ]
            : [],
    };
}

function buildEarnlabApiHeaders(): Record<string, string> {
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://earnlab.com",
        "Referer": `${DEFAULT_EARNLAB_TASKS_URL}?country=${DEFAULT_EARNLAB_COUNTRY}`,
    };
}

function toEarnlabUsd(reward: number | null | undefined): number {
    if (!Number.isFinite(reward)) {
        return 0;
    }

    return round(Number(reward) / 1000);
}

function normalizeEarnlabDevices(task: EarnlabTaskSummary): string {
    const devices: string[] = [];

    if (task.isDesktop) devices.push("pc");
    if (task.isAndroid) devices.push("android");
    if (task.isIOS) devices.push("ios");

    return devices.length > 0 ? devices.join(",") : "web";
}

function normalizeEarnlabCategory(category?: string | null, customCategory?: string | null): string {
    const raw = `${category ?? ""} ${customCategory ?? ""}`.trim().toLowerCase();
    if (!raw) return "other";
    if (raw.includes("game")) return "mobile_game";
    if (raw.includes("survey")) return "survey";
    if (raw.includes("shop")) return "shopping";
    if (raw.includes("finance")) return "finance";
    return raw.replace(/\s+/g, "_");
}

function normalizeEarnlabProviderName(provider?: string | null): string {
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

    if (directMap[value]) {
        return directMap[value];
    }

    return value
        .toLowerCase()
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

async function fetchEarnlabTasksPageOffers(limit: number): Promise<SourceOffer[]> {
    const trace = await fetchJson(DEFAULT_EARNLAB_TASKS_URL, {
        label: "earnlab-public-tasks-page",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
        responseType: "text",
    });

    const html = typeof trace.data === "string" ? trace.data : "";
    const offers = parseEarnlabTasksHtml(html, Math.max(1, limit));
    const sampleOffer = offers[0] ?? null;

    logger.info("EarnLab public tasks page parsed", {
        responseStatus: trace.status,
        finalUrl: trace.finalUrl,
        parsedTaskCount: offers.length,
        sampleParsedItemShape: sampleOffer ? Object.keys(sampleOffer) : null,
    });

    return trace.status >= 200 && trace.status < 300 ? offers : [];
}

function parseEarnlabTasksHtml(html: string, limit: number): SourceOffer[] {
    if (!html.trim()) return [];

    const $ = cheerio.load(html);
    const offers: SourceOffer[] = [];
    const seen = new Set<string>();
    const selectors = [
        "[data-task-id]",
        "[data-offer-id]",
        "[data-testid*='task']",
        "[data-testid*='offer']",
        ".task-card",
        ".offer-card",
        ".task-item",
        ".offer-item",
        "[class*='task-card']",
        "[class*='offer-card']",
        "[class*='task-item']",
        "[class*='offer-item']",
        "main a[href*='/tasks/']",
        "main [href*='/tasks/']",
    ];

    for (const selector of selectors) {
        $(selector).each((_, element) => {
            if (offers.length >= limit) return false;
            const parsed = parseEarnlabTaskCard($, element);
            if (!parsed || seen.has(parsed.external_id)) return;
            seen.add(parsed.external_id);
            offers.push(parsed);
        });

        if (offers.length > 0) {
            break;
        }
    }

    return offers.slice(0, limit);
}

function parseEarnlabTaskCard($: cheerio.CheerioAPI, element: any): SourceOffer | null {
    const node = $(element);
    if (!isPlausibleTaskCardNode($, node)) return null;

    const text = normalizeWhitespace(node.text());
    if (!text || text.length < 8) return null;

    const payoutText = findFirstMatchingText(text, /\$?\s?\d+(?:\.\d{1,2})?/g);
    const payoutValue = payoutText ? parseMoneyLikeString(payoutText) ?? toNumber(payoutText) : null;
    if (!isPlausiblePayout(payoutValue)) return null;
    if (payoutValue === null) return null;
    const normalizedPayout = payoutValue;

    const title = extractTaskCardTitle($, node);
    if (!isValidTaskTitle(title)) return null;

    const provider = extractTaskCardProvider($, node) ?? "EarnLab";
    const grouping = extractTaskCardGrouping($, node);
    const imageUrl = extractTaskCardImage($, node);
    const href = node.is("a") ? node.attr("href") : node.find("a[href]").first().attr("href");
    const normalizedUrl = toAbsoluteUrl(href, DEFAULT_EARNLAB_TASKS_URL) ?? DEFAULT_EARNLAB_TASKS_URL;
    const externalId = buildEarnlabTaskExternalId(title, provider, grouping);

    return {
        external_id: externalId,
        title,
        payout_raw: round(normalizedPayout).toFixed(2),
        total_payout_raw: round(normalizedPayout).toFixed(2),
        best_payout_usd: round(normalizedPayout),
        currency: "USD",
        device_raw: "web",
        category_raw: grouping ?? "other",
        url: normalizedUrl,
        expires_raw: null,
        game_slug: null,
        countries_raw: null,
        game_title: title,
        provider_name: provider,
        image_url: imageUrl,
        task_list: [],
    };
}

async function discoverToroxContext(config: EarnlabConfig): Promise<ToroxContext> {
    if (config.frameUrl) {
        const bootstrapTrace = await fetchJson(config.bootstrapUrl, {
            label: "earnlab-bootstrap",
            headers: buildEarnlabBootstrapHeaders(config),
        });
        const bootstrapCookieHeader = mergeCookieHeaders(toCookieHeader(bootstrapTrace), config.toroxCookie ?? null);
        const handoffContext = await resolveFrameContext(config, config.frameUrl, bootstrapCookieHeader);
        const frameSettingsProbe = await fetchJson(config.settingsUrl, {
            label: "earnlab-torox-settings-frame-probe",
            headers: buildToroxHeaders(handoffContext, config.toroxHeaders),
            params: handoffContext.inferredParams,
        });
        const frameContextParams = extractToroxCampaignContext(frameSettingsProbe.data);
        const frameCampaignProbe = await fetchJson(config.campaignsUrl, {
            label: "earnlab-torox-campaigns-frame-probe",
            headers: buildToroxHeaders(handoffContext, config.toroxHeaders),
            params: {
                ...handoffContext.inferredParams,
                ...frameContextParams,
                ...buildCampaignParams(1, config.os),
            },
        });
        const frameCampaignItems = extractCampaignNodes(frameCampaignProbe.data);
        const handoffWorked = frameCampaignProbe.status >= 200 && frameCampaignProbe.status < 300 && frameCampaignItems.length > 0;

        logger.info("EarnLab bootstrap + frame handoff probe", {
            bootstrapStatus: bootstrapTrace.status,
            bootstrapKeys: bootstrapTrace.topLevelKeys,
            bootstrapSetCookie: toCookieHeader(bootstrapTrace),
            frameUrlHost: safeHost(config.frameUrl),
            finalResolvedFrameUrl: handoffContext.frameUrl,
            toroxHeaderKeys: getHeaderKeys(config.toroxHeaders),
            appId: frameContextParams.app_id ?? null,
            uid: frameContextParams.uid ?? frameContextParams.user_id ?? null,
            settingsStatus: frameSettingsProbe.status,
            campaignsStatus: frameCampaignProbe.status,
            campaignsKeys: frameCampaignProbe.topLevelKeys,
            finalCampaignRequestUrl: frameCampaignProbe.url,
            campaignCountReturned: frameCampaignItems.length,
            handoffWorked,
        });

        if (frameCampaignItems.length === 0) {
            logger.info("EarnLab empty campaigns response body", {
                requestUrl: frameCampaignProbe.url,
                responseBody: frameCampaignProbe.data,
            });
        }

        return {
            ...handoffContext,
            inferredParams: frameContextParams,
            bootstrapRequired: true,
            bootstrapAttempted: true,
            authBlocked: !handoffWorked,
        };
    }

    const directFallbackContext = buildFallbackToroxContext(config);
    let settingsWorked = false;
    let directContextParams: Record<string, string> = {};
    if (config.settingsUrl) {
        const directSettingsProbe = await fetchJson(config.settingsUrl, {
            label: "earnlab-torox-settings-probe",
            headers: buildToroxHeaders(directFallbackContext, config.toroxHeaders),
        });
        settingsWorked = directSettingsProbe.status >= 200 && directSettingsProbe.status < 300;
        directContextParams = extractToroxCampaignContext(directSettingsProbe.data);
        logger.info("EarnLab direct Torox settings status", {
            responseStatus: directSettingsProbe.status,
            topLevelKeys: directSettingsProbe.topLevelKeys,
            appId: directContextParams.app_id ?? null,
            uid: directContextParams.uid ?? directContextParams.user_id ?? null,
        });
    }

    const directCampaignProbe = await fetchJson(config.campaignsUrl, {
        label: "earnlab-torox-campaigns-probe",
        headers: buildToroxHeaders(directFallbackContext, config.toroxHeaders),
        params: {
            ...directContextParams,
            ...buildCampaignParams(1, config.os),
        },
    });

    const directCampaignItems = extractCampaignNodes(directCampaignProbe.data);
    const directWorked = directCampaignProbe.status >= 200 && directCampaignProbe.status < 300 && directCampaignItems.length > 0;
    if (directCampaignItems.length === 0) {
        logger.info("EarnLab empty campaigns response body", {
            requestUrl: directCampaignProbe.url,
            responseBody: directCampaignProbe.data,
        });
    }

    if (directWorked) {
        logger.info("EarnLab direct Torox access succeeded", {
            campaignCount: directCampaignItems.length,
            settingsWorked,
            bootstrapRequired: false,
            appId: directContextParams.app_id ?? null,
            uid: directContextParams.uid ?? directContextParams.user_id ?? null,
            finalCampaignRequestUrl: directCampaignProbe.url,
        });
        return {
            cookieHeader: null,
            inferredParams: directContextParams,
            bootstrapRequired: false,
            bootstrapAttempted: false,
            authBlocked: false,
            frameUrl: null,
            toroxOrigin: "https://api.wall.torox.io",
            toroxReferer: "https://api.wall.torox.io/",
        };
    }

    const bootstrapUrl = config.bootstrapUrl;
    if (!bootstrapUrl) {
        logger.warn("EarnLab bootstrap URL missing after direct Torox probe failure", {
            directCampaignStatus: directCampaignProbe.status,
        });
        return {
            cookieHeader: null,
            inferredParams: {},
            bootstrapRequired: null,
            bootstrapAttempted: false,
            authBlocked: true,
            frameUrl: null,
            toroxOrigin: "https://api.wall.torox.io",
            toroxReferer: "https://api.wall.torox.io/",
        };
    }

    const bootstrapTrace = await fetchJson(bootstrapUrl, {
        label: "earnlab-bootstrap",
        headers: buildEarnlabBootstrapHeaders(config),
    });
    const extractedFrameUrl = extractUsableFrameUrl(config, bootstrapTrace);
    const bootstrapContext = extractedFrameUrl
        ? await resolveFrameContext(config, extractedFrameUrl, toCookieHeader(bootstrapTrace) ?? config.toroxCookie)
        : buildFallbackToroxContext(config, toCookieHeader(bootstrapTrace) ?? config.toroxCookie);
    const bootstrapParams = extractedFrameUrl
        ? bootstrapContext.inferredParams
        : extractBootstrapParams(bootstrapUrl, bootstrapTrace.data);

    logger.info("EarnLab bootstrap analysis", {
        bootstrapStatus: bootstrapTrace.status,
        bootstrapKeys: bootstrapTrace.topLevelKeys,
        usableFrameUrlExtracted: Boolean(extractedFrameUrl),
        frameUrlHost: safeHost(extractedFrameUrl),
        finalResolvedFrameUrl: bootstrapContext.frameUrl,
        inferredParams: bootstrapParams,
        extractedQueryParams: bootstrapContext.inferredParams,
        hasCookie: Boolean(bootstrapContext.cookieHeader),
    });

    const bootstrapSettingsProbe = await fetchJson(config.settingsUrl, {
        label: "earnlab-torox-settings-bootstrap-probe",
        headers: buildToroxHeaders(bootstrapContext, config.toroxHeaders),
        params: bootstrapContext.inferredParams,
    });
    const bootstrapContextParams = extractToroxCampaignContext(bootstrapSettingsProbe.data);
    const bootstrapCampaignProbe = await fetchJson(config.campaignsUrl, {
        label: "earnlab-torox-campaigns-bootstrap-probe",
        headers: buildToroxHeaders(bootstrapContext, config.toroxHeaders),
        params: {
            ...bootstrapContext.inferredParams,
            ...bootstrapContextParams,
            ...buildCampaignParams(1, config.os),
        },
    });

    const bootstrapCampaignItems = extractCampaignNodes(bootstrapCampaignProbe.data);
    const bootstrapWorked = bootstrapCampaignProbe.status >= 200
        && bootstrapCampaignProbe.status < 300
        && bootstrapCampaignItems.length > 0;
    const bootstrapRequired = bootstrapWorked ? true : null;

        logger.info("EarnLab bootstrap requirement check", {
        directCampaignStatus: directCampaignProbe.status,
        directCampaignCount: directCampaignItems.length,
        settingsStatus: bootstrapSettingsProbe.status,
        bootstrapCampaignStatus: bootstrapCampaignProbe.status,
        bootstrapCampaignCount: bootstrapCampaignItems.length,
        bootstrapRequired,
        authBlocked: !directWorked && !bootstrapWorked,
        toroxHeaderKeys: getHeaderKeys(config.toroxHeaders),
        appId: bootstrapContextParams.app_id ?? null,
        uid: bootstrapContextParams.uid ?? bootstrapContextParams.user_id ?? null,
        finalCampaignRequestUrl: bootstrapCampaignProbe.url,
    });

    if (bootstrapCampaignItems.length === 0) {
        logger.info("EarnLab empty campaigns response body", {
            requestUrl: bootstrapCampaignProbe.url,
            responseBody: bootstrapCampaignProbe.data,
        });
    }

    return {
        ...bootstrapContext,
        inferredParams: bootstrapContextParams,
        bootstrapRequired,
        bootstrapAttempted: true,
        authBlocked: !directWorked && !bootstrapWorked,
    };
}

async function fetchToroxCampaigns(
    config: ReturnType<typeof getConfig>,
    context: ToroxContext,
): Promise<SourceOffer[]> {
    const offers: SourceOffer[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= MAX_AUTO_PAGES; page += 1) {
        const pageSize = Math.min(DEFAULT_PAGE_SIZE, Math.max(1, config.limit - offers.length));
        if (pageSize <= 0) break;

        const trace = await fetchJson(config.campaignsUrl, {
            label: `earnlab-torox-campaigns-page-${page}`,
            headers: buildToroxHeaders(context, config.toroxHeaders),
            params: {
                ...context.inferredParams,
                ...buildCampaignParams(page, config.os),
            },
        });

        const campaignInspection = inspectCampaignPayload(trace.data);
        const campaigns = campaignInspection.accepted;
        const sampleCampaign = campaigns[0];
        logger.info("EarnLab campaigns page parsed", {
            page,
            requestUrl: trace.url,
            responseStatus: trace.status,
            topLevelKeys: trace.topLevelKeys,
            responseDataType: Array.isArray(trace.data) ? "array" : typeof trace.data,
            responseIsArray: Array.isArray(trace.data),
            appId: context.inferredParams.app_id ?? null,
            uid: context.inferredParams.uid ?? context.inferredParams.user_id ?? null,
            toroxHeaderKeys: getHeaderKeys(config.toroxHeaders),
            sampleCampaignShape: sampleCampaign && isRecord(sampleCampaign) ? Object.keys(sampleCampaign) : null,
            firstAcceptedCampaignShape: campaignInspection.firstAcceptedShape,
            firstRejectedCampaignShape: campaignInspection.firstRejectedShape,
            firstRejectedCampaignReason: campaignInspection.firstRejectedReason,
            pageCampaignCount: campaigns.length,
            finalAcceptedCampaignCount: campaigns.length,
        });

        if (campaigns.length === 0) {
            logger.info("EarnLab empty campaigns response body", {
                requestUrl: trace.url,
                responseBody: trace.data,
            });
        }

        if (trace.status < 200 || trace.status >= 300 || campaigns.length === 0) {
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

        if (campaigns.length < pageSize || offers.length >= config.limit) {
            break;
        }
    }

    return offers;
}

async function parseCampaign(
    config: ReturnType<typeof getConfig>,
    context: ToroxContext,
    campaign: unknown,
): Promise<SourceOffer | null> {
    if (!isRecord(campaign)) return null;

    const campaignId = extractCampaignId(campaign);
    const rawTitle = firstString(campaign.name, campaign.title, campaign.offer_name);
    if (!campaignId || !rawTitle) return null;

    const detail = await fetchCampaignDetail(config, context, campaignId);
    const merged = mergeRecords(campaign, detail);
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
    const destinationUrl = extractDestinationUrl(merged) || DEFAULT_EARNLAB_SITE_URL;

    logger.info("EarnLab Torox payout normalization", {
        campaignId,
        rawBaseAmount: rawCampaignAmount,
        normalizedAmount: baseFallbackPayout,
        boostedAmount: fallbackPayout,
        multiplier: config.boostMultiplier,
        extractedEventCount: Array.isArray(merged.events) ? merged.events.length : 0,
        finalTaskListLength: detailTasks.length,
    });

    return {
        external_id: `torox-${campaignId}`,
        title: parentTitle,
        payout_raw: bestPayoutUsd.toFixed(2),
        total_payout_raw: Number.isFinite(totalPayoutUsd) ? totalPayoutUsd.toFixed(2) : bestPayoutUsd.toFixed(2),
        best_payout_usd: bestPayoutUsd,
        currency: "USD",
        device_raw: normalizeDevices(merged),
        category_raw: firstString(merged.verticalNames, merged.vertical_names, merged.category, merged.vertical, merged.type) || inferCategory(merged),
        url: destinationUrl,
        expires_raw: extractExpiry(merged),
        game_slug: null,
        countries_raw: extractCountries(merged),
        game_title: parentTitle,
        provider_name: "Torox",
        image_url: extractImageUrl(merged),
        task_list: detailTasks,
    };
}

async function fetchCampaignDetail(
    config: ReturnType<typeof getConfig>,
    context: ToroxContext,
    campaignId: string,
): Promise<Record<string, any> | null> {
    const detailUrl = buildDetailUrl(config.campaignsUrl, campaignId);
    const trace = await fetchJson(detailUrl, {
        label: `earnlab-torox-campaign-detail-${campaignId}`,
        headers: buildToroxHeaders(context, config.toroxHeaders),
        params: context.inferredParams,
    });

    const detailRecord = unwrapRecord(trace.data);
    logger.info("EarnLab campaign detail fetched", {
        campaignId,
        requestUrl: trace.url,
        responseStatus: trace.status,
        topLevelKeys: trace.topLevelKeys,
        detailKeys: detailRecord ? Object.keys(detailRecord) : null,
    });

    return trace.status >= 200 && trace.status < 300 ? detailRecord : null;
}

async function fetchJson(
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

    logger.info("EarnLab request started", {
        label: options.label,
        requestUrl: url.toString(),
    });

    const response = await withRetry(
        () =>
            axios.get(url.toString(), {
                timeout: 20000,
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
    const finalUrl = getFinalUrl(response, url.toString());
    logger.info("EarnLab request completed", {
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

function buildEarnlabBootstrapHeaders(config: EarnlabConfig): Record<string, string> {
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": config.bootstrapOrigin,
        "Referer": config.bootstrapReferer,
        ...(config.bootstrapCookie ? { "Cookie": config.bootstrapCookie } : {}),
        ...config.bootstrapHeaders,
    };
}

function buildFrameHandoffHeaders(config: EarnlabConfig, cookieHeader?: string | null): Record<string, string> {
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": config.bootstrapOrigin,
        "Referer": config.bootstrapReferer,
        ...(cookieHeader ? { "Cookie": cookieHeader } : {}),
        ...config.bootstrapHeaders,
    };
}

function buildToroxHeaders(
    context: Pick<ToroxContext, "cookieHeader" | "toroxOrigin" | "toroxReferer">,
    extraHeaders: Record<string, string> = {},
): Record<string, string> {
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Origin": TOROX_WALL_ORIGIN,
        "Referer": TOROX_WALL_REFERER,
        ...(context.cookieHeader ? { "Cookie": context.cookieHeader } : {}),
        ...extraHeaders,
    };
}

function buildCampaignParams(page: number, os: string): Record<string, string | number> {
    return {
        page,
        sort: "completions-DESC",
        os,
    };
}

function buildDetailUrl(campaignsUrl: string, campaignId: string): string {
    const url = new URL(campaignsUrl);
    url.search = "";
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/${encodeURIComponent(campaignId)}`;
    return url.toString();
}

function extractCampaignNodes(payload: unknown): unknown[] {
    if (Array.isArray(payload)) {
        return payload.filter(looksLikeCampaign);
    }

    if (isRecord(payload) && Array.isArray(payload.data)) {
        return payload.data.filter(looksLikeCampaign);
    }

    const direct = findArraysByKey(payload, ["campaigns", "data", "items", "results", "offers"]);
    if (direct.length > 0) {
        return direct.filter(looksLikeCampaign);
    }

    return flattenNodes(payload).filter(looksLikeCampaign);
}

function inspectCampaignPayload(payload: unknown): {
    accepted: unknown[];
    firstAcceptedShape: string[] | null;
    firstRejectedReason: string | null;
    firstRejectedShape: string[] | null;
} {
    const nodes = Array.isArray(payload)
        ? payload
        : isRecord(payload) && Array.isArray(payload.data)
            ? payload.data
            : (() => {
                const direct = findArraysByKey(payload, ["campaigns", "data", "items", "results", "offers"]);
                return direct.length > 0 ? direct : flattenNodes(payload);
            })();

    const accepted: unknown[] = [];
    let firstAcceptedShape: string[] | null = null;
    let firstRejectedReason: string | null = null;
    let firstRejectedShape: string[] | null = null;

    for (const node of nodes) {
        const validation = validateCampaignNode(node);
        if (validation.accepted) {
            accepted.push(node);
            if (!firstAcceptedShape && isRecord(node)) {
                firstAcceptedShape = Object.keys(node);
            }
            continue;
        }

        if (!firstRejectedReason) {
            firstRejectedReason = validation.reason;
            firstRejectedShape = isRecord(node) ? Object.keys(node) : null;
        }
    }

    return {
        accepted,
        firstAcceptedShape,
        firstRejectedReason,
        firstRejectedShape,
    };
}

function extractTaskList(payload: Record<string, any>): NonNullable<SourceOffer["task_list"]> {
    const nodes = findArraysByKey(payload, [
        "milestones",
        "steps",
        "tasks",
        "goals",
        "events",
        "rewards",
        "reward_breakdown",
        "rewardBreakdown",
        "conversions",
    ]);

    const tasks: NonNullable<SourceOffer["task_list"]> = [];
    for (const [index, node] of nodes.entries()) {
        const task = parseTaskNode(node, index);
        if (task) {
            tasks.push(task);
        }
    }
    return tasks;
}

function extractToroxEventTaskList(payload: Record<string, any>, multiplier: number): NonNullable<SourceOffer["task_list"]> {
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
            task_type: "milestone",
            time_limit_text: firstString(event.time_limit_text, event.timeLimitText, event.deadline_text, event.deadline),
            notes: buildToroxBasePayoutNote(
                firstString(event.callToAction, event.call_to_action, event.description, payload.callToAction, payload.call_to_action),
                normalizedAmount,
            ),
            sort_order: extractToroxEventOrder(event, index),
        } as const);
    }

    logger.info("EarnLab Torox events mapped", {
        extractedEventCount: events.length,
        multiplier,
        basePayouts: tasks.map((task) => extractBasePayoutFromNotes(task.notes ?? null)).filter(Boolean),
        normalizedPayouts: tasks.map((task) => task.reward_amount_usd),
        finalTaskListLength: tasks.length,
    });

    return tasks;
}

function extractRawToroxAmount(payload: Record<string, any>): number | null {
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
    const effectiveMultiplier = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : DEFAULT_EARNLAB_TOROX_BOOST_MULTIPLIER;
    return round(baseAmount * effectiveMultiplier);
}

function buildToroxBasePayoutNote(note: string, baseAmount: number): string | null {
    const basePayoutNote = Number.isFinite(baseAmount) && baseAmount > 0 ? `Base payout: $${baseAmount.toFixed(2)}` : "";
    return [note, basePayoutNote].filter(Boolean).join(" | ") || null;
}

function extractBasePayoutFromNotes(notes: string | null): string | null {
    if (!notes) return null;
    const match = notes.match(/Base payout: \$([0-9]+(?:\.[0-9]{2})?)/i);
    return match ? match[1] : null;
}

function extractToroxEventOrder(event: Record<string, any>, index: number): number {
    const explicitOrder = toNumber(event.orderId ?? event.order_id ?? event.order);
    if (explicitOrder !== null && explicitOrder > 0) {
        return Math.trunc(explicitOrder);
    }
    return index + 1;
}

function parseTaskNode(task: unknown, index: number): NonNullable<SourceOffer["task_list"]>[number] | null {
    if (!isRecord(task)) return null;

    const title = firstString(
        task.title,
        task.name,
        task.description,
        task.requirement,
        task.goal,
        task.event_name,
        task.label,
    );
    const payoutUsd = extractPayoutUsd(task);
    if (!title || !Number.isFinite(payoutUsd) || payoutUsd <= 0) return null;

    return {
        title: sanitizeTaskTitle(title),
        reward_amount_usd: round(payoutUsd),
        reward_display: `$${round(payoutUsd).toFixed(2)}`,
        task_type: inferTaskType(title),
        time_limit_text: firstString(task.time_limit_text, task.timeLimitText, task.deadline_text, task.deadline),
        notes: firstString(task.notes, task.note, task.terms, task.requirement_detail),
        sort_order: index + 1,
    } as const;
}

function extractDestinationUrl(payload: Record<string, any>): string | null {
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

    const urlCandidates = findStringValues(payload, 0, 3).filter(isHttpUrl);
    return urlCandidates[0] ?? null;
}

function extractTaskCardTitle($: cheerio.CheerioAPI, node: cheerio.Cheerio<any>): string | null {
    const candidates = [
        node.attr("data-title"),
        node.find("[data-title]").attr("data-title"),
        node.find("[class*='title']").first().text(),
        node.find("[class*='name']").first().text(),
        node.find("h1, h2, h3, h4").first().text(),
        node.find("strong").first().text(),
        node.find("img[alt]").first().attr("alt"),
    ];

    for (const candidate of candidates) {
        const normalized = cleanTaskTitle(candidate);
        if (normalized && isValidTaskTitle(normalized)) {
            return normalized;
        }
    }

    const textLines = uniqueTextLines(node.text());
    return textLines
        .map(cleanTaskTitle)
        .find(isValidTaskTitle) ?? null;
}

function extractTaskCardProvider($: cheerio.CheerioAPI, node: cheerio.Cheerio<any>): string | null {
    const providerSelectors = [
        "[data-provider]",
        "[class*='provider']",
        "[class*='wall']",
        "[class*='network']",
    ];

    for (const selector of providerSelectors) {
        const candidate = normalizeWhitespace(node.find(selector).first().text() || node.attr("data-provider"));
        if (candidate && !looksLikeMoneyText(candidate) && looksLikeProviderLabel(candidate)) {
            return candidate;
        }
    }

    const textLines = uniqueTextLines(node.text());
    return textLines.find((line) => looksLikeProviderLabel(line) && !isGenericUiWord(line)) ?? null;
}

function extractTaskCardGrouping($: cheerio.CheerioAPI, node: cheerio.Cheerio<any>): string | null {
    const explicit = normalizeWhitespace(
        node.attr("data-group")
        || node.attr("data-section")
        || node.closest("[data-group], [data-section]").attr("data-group")
        || node.closest("[data-group], [data-section]").attr("data-section"),
    );
    if (explicit) return explicit;

    const section = node.closest("section");
    if (section.length > 0) {
        const heading = normalizeWhitespace(section.find("h1, h2, h3, h4").first().text());
        if (heading) return heading;
    }

    const previousHeading = normalizeWhitespace(node.prevAll("h1, h2, h3, h4").first().text());
    return previousHeading || null;
}

function extractTaskCardImage($: cheerio.CheerioAPI, node: cheerio.Cheerio<any>): string | null {
    const image = node.find("img").first();
    const raw = image.attr("src") || image.attr("data-src") || image.attr("srcset");
    if (!raw) return null;
    const candidate = raw.split(",")[0]?.trim().split(" ")[0]?.trim() ?? "";
    return toAbsoluteUrl(candidate, DEFAULT_EARNLAB_TASKS_URL);
}

function buildEarnlabTaskExternalId(title: string, provider: string, grouping: string | null): string {
    const base = [provider, title, grouping].filter(Boolean).join("-");
    return `earnlab-task-${slugify(base)}`;
}

function isPlausibleTaskCardNode($: cheerio.CheerioAPI, node: cheerio.Cheerio<any>): boolean {
    if (node.closest("nav, header, footer, aside, menu").length > 0) return false;

    const text = normalizeWhitespace(node.text());
    if (!text || text.length < 8) return false;
    if (isGenericUiWord(text)) return false;
    if (!looksLikeMoneyText(text)) return false;

    const hasStructuredContent =
        node.find("img").length > 0
        || node.find("a[href]").length > 0
        || node.is("a[href]")
        || node.find("[class*='title'], [class*='name'], h1, h2, h3, h4").length > 0;

    return hasStructuredContent;
}

function isPlausiblePayout(value: number | null): boolean {
    return value !== null && Number.isFinite(value) && value > 0 && value < 100000;
}

function cleanTaskTitle(value: unknown): string {
    const normalized = normalizeWhitespace(value);
    if (!normalized) return "";

    return normalized
        .replace(/\b(Torox|Ayet|AdGate|AdGem|Lootably|CPX|RevU)\b\s*$/i, "")
        .replace(/\s+-\s+\$?\d+(?:\.\d{1,2})?.*$/i, "")
        .replace(/\s+/g, " ")
        .trim();
}

function isValidTaskTitle(value: string | null): value is string {
    if (!value) return false;
    if (value.length < 3) return false;
    if (isGenericUiWord(value)) return false;
    if (looksLikeProviderLabel(value)) return false;
    if (looksLikeMoneyText(value)) return false;
    return /[a-z]/i.test(value);
}

function isGenericUiWord(value: string): boolean {
    const normalized = normalizeWhitespace(value).toLowerCase();
    return /^(menu|login|log in|sign up|signup|earn|tasks|offers|home|profile|settings|rewards?)$/.test(normalized);
}

function normalizeWhitespace(value: unknown): string {
    return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function uniqueTextLines(value: string): string[] {
    return Array.from(
        new Set(
            value
                .split(/\r?\n+/)
                .map(normalizeWhitespace)
                .filter(Boolean),
        ),
    );
}

function looksLikeProviderLabel(value: string): boolean {
    return /\b(torox|ayet|adgate|adgem|lootably|cpx|revu|offerwall|provider|wall)\b/i.test(value);
}

function looksLikeMoneyText(value: string): boolean {
    return /[$€£]\s?\d|\b\d+(?:\.\d{1,2})?\s?(usd|coins|points)\b/i.test(value);
}

function findFirstMatchingText(value: string, pattern: RegExp): string | null {
    const match = value.match(pattern);
    return match?.[0] ?? null;
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120);
}

function toAbsoluteUrl(value: string | undefined, baseUrl: string): string | null {
    const normalized = normalizeWhitespace(value);
    if (!normalized) return null;
    try {
        return new URL(normalized, baseUrl).toString();
    } catch {
        return null;
    }
}

function extractImageUrl(payload: Record<string, any>): string | null {
    const direct = firstString(
        payload.image,
        payload.coverImage,
        payload.image_url,
        payload.imageUrl,
        payload.cover_image,
        payload.thumbnail,
        payload.thumbnail_url,
        payload.thumbnailUrl,
        payload.icon,
        payload.icon_url,
        payload.iconUrl,
        payload.logo,
        payload.logo_url,
        payload.logoUrl,
    );
    if (isHttpUrl(direct)) return direct;

    const creatives = flattenNodes(payload.creatives).filter((node) => isRecord(node)) as Record<string, any>[];
    for (const creative of creatives) {
        const candidate = firstString(creative.url, creative.image, creative.image_url, creative.src);
        if (isHttpUrl(candidate)) return candidate;
    }

    return null;
}

function extractCountries(payload: Record<string, any>): string[] | null {
    const candidateArrays = findArraysByKey(payload, [
        "countries",
        "country_codes",
        "countryCodes",
        "allowed_countries",
        "allowedCountries",
        "geo",
        "geos",
    ]);

    for (const candidate of candidateArrays) {
        if (!Array.isArray(candidate)) continue;
        const countries = candidate
            .map((value: unknown) => {
                if (typeof value === "string") return value;
                if (isRecord(value)) return firstString(value.code, value.country_code, value.countryCode, value.iso2, value.iso);
                return "";
            })
            .map((value: string) => value.trim().toUpperCase())
            .filter((value: string) => /^[A-Z]{2}$/.test(value));

        if (countries.length > 0) {
            return Array.from(new Set(countries));
        }
    }

    return null;
}

function extractExpiry(payload: Record<string, any>): string | null {
    const candidate = firstString(payload.expires_at, payload.expiresAt, payload.end_date, payload.endDate, payload.deadline_at, payload.deadlineAt);
    return candidate || null;
}

function normalizeDevices(payload: Record<string, any>): string {
    const value = [
        firstString(payload.os, payload.device, payload.devices, payload.platform),
        ...findArraysByKey(payload, ["os", "platforms", "devices"]).map((items) => {
            if (!Array.isArray(items)) return "";
            return items
                .map((item: unknown) => (typeof item === "string" ? item : isRecord(item) ? firstString(item.name, item.os, item.platform) : ""))
                .filter(Boolean)
                .join(",");
        }),
    ]
        .filter(Boolean)
        .join(",");

    return value || "web";
}

function inferCategory(payload: Record<string, any>): string {
    const haystack = [
        firstString(payload.category, payload.vertical, payload.type),
        firstString(payload.name, payload.title, payload.description),
    ].join(" ").toLowerCase();

    if (/survey|quiz|opinion|research/.test(haystack)) return "survey";
    if (/shop|purchase|cashback|deal/.test(haystack)) return "shopping";
    if (/game|level|raid|board|village|install|play/.test(haystack)) return "mobile_game";
    return "other";
}

function extractPayoutUsd(payload: Record<string, any>): number {
    const candidates = [
        payload.payout,
        payload.reward,
        payload.amount,
        payload.total_reward,
        payload.totalReward,
        payload.usd,
        payload.value,
        payload.price,
        payload.coins,
        payload.points,
    ];

    for (const candidate of candidates) {
        const parsed = toNumber(candidate);
        if (parsed !== null && parsed > 0) return parsed;
    }

    const payoutStrings = findStringValues(payload, 0, 2);
    for (const value of payoutStrings) {
        const parsed = parseMoneyLikeString(value);
        if (parsed !== null && parsed > 0) return parsed;
    }

    return 0;
}

function extractBootstrapParams(bootstrapUrl: string, payload: unknown): Record<string, string> {
    const params: Record<string, string> = {};
    const bootstrapParsed = new URL(bootstrapUrl);
    const sessionId = bootstrapParsed.searchParams.get("sessionId");
    if (sessionId) params.sessionId = sessionId;

    const urls = findStringValues(payload, 0, 4).filter((value) => /^https?:\/\//i.test(value));
    for (const raw of urls) {
        try {
            const url = new URL(raw);
            for (const [key, value] of url.searchParams.entries()) {
                if (!params[key]) params[key] = value;
            }
        } catch {
            continue;
        }
    }

    const directSessionId = findStringByKeys(payload, ["sessionId", "session_id", "wallSessionId"]);
    if (directSessionId && !params.sessionId) {
        params.sessionId = directSessionId;
    }

    return params;
}

function extractToroxCampaignContext(payload: unknown): Record<string, string> {
    const params: Record<string, string> = {};
    const appId = findScalarByKeys(payload, ["app_id", "appId"]);
    const uid = findScalarByKeys(payload, ["uid", "user_id", "userId"]);

    if (appId) {
        params.app_id = appId;
    }

    if (uid) {
        params.uid = uid;
    }

    return params;
}

function extractUsableFrameUrl(config: EarnlabConfig, bootstrapTrace: RequestTrace): string | null {
    const candidates = [
        bootstrapTrace.finalUrl,
        findStringByKeys(bootstrapTrace.data, ["frameUrl", "iframeUrl", "wallUrl", "url"]),
        ...findStringValues(bootstrapTrace.data, 0, 4),
    ]
        .filter(Boolean)
        .map((value) => String(value).trim())
        .filter((value) => /^https?:\/\//i.test(value));

    for (const candidate of candidates) {
        const host = safeHost(candidate);
        if (host && /torox/i.test(host) && !/earnlab/i.test(host)) {
            return candidate;
        }
    }

    return config.frameUrl;
}

async function resolveFrameContext(
    config: EarnlabConfig,
    frameUrl: string,
    cookieHeader?: string | null,
): Promise<ToroxContext> {
    const handoff = await performFrameHandoff(config, frameUrl, cookieHeader ?? config.bootstrapCookie ?? config.toroxCookie ?? null);

    logger.info("EarnLab resolved frame session", {
        initialFrameUrl: frameUrl,
        finalResolvedFrameUrl: handoff.finalUrl,
        toroxAuthHeaderKeys: getHeaderKeys(config.toroxHeaders),
        hasCookie: Boolean(handoff.cookieHeader),
    });

    return {
        cookieHeader: handoff.cookieHeader,
        inferredParams: {},
        bootstrapRequired: true,
        bootstrapAttempted: false,
        authBlocked: false,
        frameUrl: handoff.finalUrl,
        toroxOrigin: TOROX_WALL_ORIGIN,
        toroxReferer: TOROX_WALL_REFERER,
    };
}

async function performFrameHandoff(
    config: EarnlabConfig,
    frameUrl: string,
    initialCookieHeader: string | null,
): Promise<FrameHandoffResult> {
    let currentUrl = frameUrl;
    let cookieHeader = initialCookieHeader;

    for (let step = 1; step <= 5; step += 1) {
        const response = await withRetry(
            () =>
                axios.get(currentUrl, {
                    timeout: 20000,
                    headers: buildFrameHandoffHeaders(config, cookieHeader),
                    responseType: "text",
                    withCredentials: true,
                    maxRedirects: 0,
                    validateStatus: () => true,
                }),
            `earnlab-frame-handoff-${step}`,
        );

        const responseHeaders = response.headers as Record<string, unknown>;
        const setCookieHeader = normalizeSetCookieHeader(responseHeaders["set-cookie"]);
        cookieHeader = mergeCookieHeaders(cookieHeader, setCookieHeader);
        const locationHeader = typeof responseHeaders.location === "string" ? responseHeaders.location : null;
        const redirectTarget = locationHeader ? new URL(locationHeader, currentUrl).toString() : null;

        logger.info("EarnLab frame handoff step", {
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

        logger.info("EarnLab frame handoff resolved", {
            finalToroxUrl: currentUrl,
            capturedSetCookie: cookieHeader,
        });

        return {
            finalUrl: currentUrl,
            cookieHeader,
        };
    }

    logger.warn("EarnLab frame handoff exceeded redirect limit", {
        initialFrameUrl: frameUrl,
        finalAttemptedUrl: currentUrl,
    });

    return {
        finalUrl: currentUrl,
        cookieHeader,
    };
}

function buildFallbackToroxContext(config: EarnlabConfig, cookieHeader?: string | null): ToroxContext {
    const campaignsUrl = new URL(config.campaignsUrl);
    return {
        cookieHeader: cookieHeader ?? config.toroxCookie ?? null,
        inferredParams: {},
        bootstrapRequired: null,
        bootstrapAttempted: false,
        authBlocked: false,
        frameUrl: null,
        toroxOrigin: TOROX_WALL_ORIGIN,
        toroxReferer: TOROX_WALL_REFERER,
    };
}

function toCookieHeader(trace: RequestTrace): string | null {
    return normalizeSetCookieHeader(trace.headers["set-cookie"]);
}

function unwrapRecord(payload: unknown): Record<string, any> | null {
    if (isRecord(payload)) {
        if (isRecord(payload.data)) return payload.data;
        return payload;
    }
    return null;
}

function mergeRecords(primary: Record<string, any>, secondary: Record<string, any> | null): Record<string, any> {
    return secondary ? { ...primary, ...secondary } : primary;
}

function flattenNodes(node: unknown): unknown[] {
    if (Array.isArray(node)) return node;
    if (!isRecord(node)) return [];

    const values: unknown[] = [];
    for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
            values.push(...value);
        } else if (isRecord(value)) {
            values.push(...flattenNodes(value));
        }
    }
    return values;
}

function findArraysByKey(node: unknown, keys: string[], depth = 0): unknown[] {
    if (!isRecord(node) || depth > 4) return [];

    const target = new Set(keys.map((key) => key.toLowerCase()));
    const matches: unknown[] = [];

    for (const [key, value] of Object.entries(node)) {
        const normalizedKey = key.toLowerCase();
        if (target.has(normalizedKey) && Array.isArray(value)) {
            matches.push(...value);
        }

        if (isRecord(value)) {
            matches.push(...findArraysByKey(value, keys, depth + 1));
        }
    }

    return matches;
}

function findStringByKeys(node: unknown, keys: string[], depth = 0): string | null {
    if (!isRecord(node) || depth > 4) return null;
    const target = new Set(keys.map((key) => key.toLowerCase()));

    for (const [key, value] of Object.entries(node)) {
        if (target.has(key.toLowerCase()) && typeof value === "string" && value.trim()) {
            return value.trim();
        }
        if (isRecord(value)) {
            const nested = findStringByKeys(value, keys, depth + 1);
            if (nested) return nested;
        }
    }

    return null;
}

function findScalarByKeys(node: unknown, keys: string[], depth = 0): string | null {
    if (!isRecord(node) || depth > 4) return null;
    const target = new Set(keys.map((key) => key.toLowerCase()));

    for (const [key, value] of Object.entries(node)) {
        if (target.has(key.toLowerCase())) {
            if (typeof value === "string" && value.trim()) return value.trim();
            if (typeof value === "number" && Number.isFinite(value)) return String(value);
        }
        if (isRecord(value)) {
            const nested = findScalarByKeys(value, keys, depth + 1);
            if (nested) return nested;
        }
    }

    return null;
}

function findStringValues(node: unknown, depth = 0, maxDepth = 2): string[] {
    if (depth > maxDepth) return [];
    if (typeof node === "string") return node.trim() ? [node.trim()] : [];
    if (Array.isArray(node)) return node.flatMap((value) => findStringValues(value, depth + 1, maxDepth));
    if (!isRecord(node)) return [];

    return Object.values(node).flatMap((value) => findStringValues(value, depth + 1, maxDepth));
}

function looksLikeCampaign(node: unknown): boolean {
    return validateCampaignNode(node).accepted;
}

function validateCampaignNode(node: unknown): { accepted: boolean; reason: string | null } {
    if (!isRecord(node)) return { accepted: false, reason: "not-object" };

    const id = extractCampaignId(node);
    const name = firstString(node.name, node.title, node.offer_name);
    const amount = extractPayoutUsd(node);

    if (!id) return { accepted: false, reason: "missing-offer-id" };
    if (!name) return { accepted: false, reason: "missing-name" };
    if (!Number.isFinite(amount) || amount <= 0) return { accepted: false, reason: "missing-amount" };

    return { accepted: true, reason: null };
}

function extractCampaignId(node: Record<string, any>): string {
    return firstString(
        scalarToString(node.offerId),
        scalarToString(node.id),
        scalarToString(node.campaign_id),
        scalarToString(node.uuid),
        scalarToString(node.offer_id),
    );
}

function scalarToString(value: unknown): string {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return "";
}

function extractParentTitle(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) return trimmed;

    const separators = [" - ", " | ", ": ", " – ", " — "];
    for (const separator of separators) {
        const [head, tail] = trimmed.split(separator, 2);
        if (tail && looksLikeMilestoneText(tail)) {
            return head.trim();
        }
    }

    const inlineMatch = trimmed.match(/^(.*?)(?:\s+(reach|complete|install|unlock|finish|purchase|deposit|play|achieve|get|sign up)\b.*)$/i);
    return inlineMatch?.[1]?.trim() || trimmed;
}

function looksLikeMilestoneText(value: string): boolean {
    return /\b(reach|complete|install|unlock|finish|purchase|deposit|play|achieve|get|sign up|level|board|village|chapter|stage|milestone)\b/i.test(value);
}

function sanitizeTaskTitle(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

function inferTaskType(title: string): "install" | "milestone" | "purchase" | "signup" | "other" {
    if (/\binstall\b/i.test(title)) return "install";
    if (/\b(sign up|signup|register)\b/i.test(title)) return "signup";
    if (/\b(purchase|buy|spend|deposit)\b/i.test(title)) return "purchase";
    if (/\b(reach|complete|finish|unlock|level|board|village|chapter|stage|milestone)\b/i.test(title)) return "milestone";
    return "other";
}

function firstString(...values: unknown[]): string {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }
    return "";
}

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const normalized = value.replace(/[^0-9.\-]/g, "");
        const parsed = Number.parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function parseMoneyLikeString(value: string): number | null {
    if (!/[$€£]|usd|eur|gbp|reward|payout|earn/i.test(value)) return null;
    return toNumber(value);
}

function round(value: number): number {
    return Number(value.toFixed(2));
}

function isHttpUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

function isRecord(value: unknown): value is Record<string, any> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getFinalUrl(response: any, fallbackUrl: string): string {
    return response?.request?.res?.responseUrl || response?.request?.responseURL || fallbackUrl;
}

function safeHost(value: string | null): string | null {
    if (!value) return null;
    try {
        return new URL(value).host;
    } catch {
        return null;
    }
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

function getHeaderKeys(headers: Record<string, string>): string[] {
    return Object.keys(headers).sort();
}

function normalizeSetCookieHeader(value: unknown): string | null {
    if (!Array.isArray(value) || value.length === 0) {
        return null;
    }

    const normalized = value
        .map((entry) => String(entry).split(";", 1)[0].trim())
        .filter(Boolean)
        .join("; ");

    return normalized || null;
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

function getConfig(): EarnlabConfig {
    return {
        bootstrapUrl: process.env.EARNLAB_TOROX_BOOTSTRAP_URL ?? DEFAULT_EARNLAB_TOROX_BOOTSTRAP_URL,
        frameUrl: process.env.EARNLAB_TOROX_FRAME_URL?.trim() || null,
        campaignsUrl: process.env.EARNLAB_TOROX_CAMPAIGNS_URL ?? DEFAULT_EARNLAB_TOROX_CAMPAIGNS_URL,
        settingsUrl: process.env.EARNLAB_TOROX_SETTINGS_URL ?? DEFAULT_EARNLAB_TOROX_SETTINGS_URL,
        os: process.env.EARNLAB_TOROX_OS ?? DEFAULT_EARNLAB_TOROX_OS,
        limit: parsePositiveInt(process.env.EARNLAB_TOROX_LIMIT, DEFAULT_EARNLAB_TOROX_LIMIT),
        boostMultiplier: parsePositiveFloat(process.env.EARNLAB_TOROX_BOOST_MULTIPLIER, DEFAULT_EARNLAB_TOROX_BOOST_MULTIPLIER),
        bootstrapReferer: process.env.EARNLAB_TOROX_BOOTSTRAP_REFERER ?? DEFAULT_EARNLAB_SITE_URL,
        bootstrapOrigin: process.env.EARNLAB_TOROX_BOOTSTRAP_ORIGIN ?? "https://earnlab.com",
        bootstrapCookie: process.env.EARNLAB_TOROX_BOOTSTRAP_COOKIE?.trim() || null,
        toroxCookie: process.env.EARNLAB_TOROX_COOKIE?.trim() || null,
        bootstrapHeaders: parseHeadersJson(process.env.EARNLAB_TOROX_BOOTSTRAP_HEADERS_JSON),
        toroxHeaders: parseHeadersJson(process.env.EARNLAB_TOROX_HEADERS_JSON),
    };
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePositiveFloat(value: string | undefined, fallback: number): number {
    const parsed = Number.parseFloat(value ?? "");
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
