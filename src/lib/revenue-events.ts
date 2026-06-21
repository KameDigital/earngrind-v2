export const REVENUE_EVENT_NAMES = [
    "page_view",
    "cta_impression",
    "cta_click",
    "outbound_click",
    "conversion_postback",
] as const;

export const REVENUE_ROUTE_GROUPS = [
    "homepage",
    "best_gpt_sites",
    "seo_best_offers",
    "game",
    "offer",
    "guide",
    "platform_go",
    "offer_go",
    "earn_go",
    "postback",
    "admin",
    "unknown",
] as const;

export const REVENUE_ENTITY_TYPES = [
    "guide",
    "game",
    "offer",
    "platform",
    "provider",
] as const;

export type RevenueEventName = (typeof REVENUE_EVENT_NAMES)[number];
export type RevenueRouteGroup = (typeof REVENUE_ROUTE_GROUPS)[number];
export type RevenueEntityType = (typeof REVENUE_ENTITY_TYPES)[number];
type RevenueOutboundClickTable = "offer_clicks" | "site_offer_clicks" | "platform_clicks";

export type RevenueEventInput = {
    event_name?: unknown;
    route_path?: unknown;
    route_group?: unknown;
    entity_type?: unknown;
    entity_id?: unknown;
    entity_slug?: unknown;
    guide_id?: unknown;
    guide_slug?: unknown;
    game_id?: unknown;
    game_slug?: unknown;
    offer_id?: unknown;
    platform_id?: unknown;
    platform_slug?: unknown;
    provider_id?: unknown;
    provider_name?: unknown;
    cta_location?: unknown;
    source_context?: unknown;
    target_url?: unknown;
    referrer_path?: unknown;
    session_key?: unknown;
    visitor_key?: unknown;
    user_agent_family?: unknown;
    outbound_click_table?: unknown;
    outbound_click_id?: unknown;
    conversion_event_id?: unknown;
    metadata?: unknown;
};

export type NormalizedRevenueEvent = {
    event_name: RevenueEventName;
    route_path: string;
    route_group: RevenueRouteGroup;
    entity_type?: RevenueEntityType;
    entity_id?: string;
    entity_slug?: string;
    guide_id?: string;
    guide_slug?: string;
    game_id?: string;
    game_slug?: string;
    offer_id?: string;
    platform_id?: string;
    platform_slug?: string;
    provider_id?: string;
    provider_name?: string;
    cta_location?: string;
    source_context?: string;
    target_url?: string;
    referrer_path?: string;
    session_key?: string;
    visitor_key?: string;
    user_agent_family?: string;
    outbound_click_table?: RevenueOutboundClickTable;
    outbound_click_id?: string;
    conversion_event_id?: string;
    metadata: Record<string, string | number | boolean>;
};

const EVENT_NAMES = new Set<string>(REVENUE_EVENT_NAMES);
const ROUTE_GROUPS = new Set<string>(REVENUE_ROUTE_GROUPS);
const ENTITY_TYPES = new Set<string>(REVENUE_ENTITY_TYPES);
const OUTBOUND_TABLES = new Set(["offer_clicks", "site_offer_clicks", "platform_clicks"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanString(value: unknown, maxLength: number): string | undefined {
    const text = typeof value === "string" ? value.trim() : "";
    return text ? text.slice(0, maxLength) : undefined;
}

function cleanEnum<T extends string>(value: unknown, allowed: Set<string>): T | undefined {
    const text = cleanString(value, 80);
    return text && allowed.has(text) ? text as T : undefined;
}

function cleanUuid(value: unknown): string | undefined {
    const text = cleanString(value, 80);
    return text && UUID_PATTERN.test(text) ? text : undefined;
}

function cleanPath(value: unknown): string | undefined {
    const path = cleanString(value, 500);
    if (!path) return undefined;
    if (path.startsWith("/")) return path;
    try {
        const url = new URL(path);
        return `${url.pathname}${url.search}`.slice(0, 500);
    } catch {
        return undefined;
    }
}

function cleanTargetUrl(value: unknown): string | undefined {
    const target = cleanString(value, 1000);
    if (!target) return undefined;
    if (target.startsWith("/")) return target;
    try {
        const url = new URL(target);
        return ["http:", "https:"].includes(url.protocol) ? url.toString().slice(0, 1000) : undefined;
    } catch {
        return undefined;
    }
}

function cleanMetadata(value: unknown): Record<string, string | number | boolean> {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const metadata: Record<string, string | number | boolean> = {};

    for (const [key, rawValue] of Object.entries(value as Record<string, unknown>).slice(0, 30)) {
        const safeKey = key.replace(/[^a-zA-Z0-9_:-]/g, "").slice(0, 50);
        if (!safeKey) continue;
        if (typeof rawValue === "string") metadata[safeKey] = rawValue.slice(0, 300);
        if (typeof rawValue === "number" && Number.isFinite(rawValue)) metadata[safeKey] = rawValue;
        if (typeof rawValue === "boolean") metadata[safeKey] = rawValue;
    }

    return metadata;
}

export function inferRevenueRouteGroup(path: string): RevenueRouteGroup {
    if (path === "/") return "homepage";
    if (path.startsWith("/best-gpt-sites")) return "best_gpt_sites";
    if (
        path.startsWith("/highest-paying-gpt-games") ||
        path.startsWith("/best-money-making-games") ||
        path.startsWith("/best-freecash-games") ||
        path.startsWith("/best-gain-gg-offers") ||
        path.startsWith("/best-paying-mobile-games-gpt")
    ) return "seo_best_offers";
    if (path.startsWith("/games/")) return "game";
    if (path.startsWith("/offers/")) return "offer";
    if (path.startsWith("/guides/")) return "guide";
    if (path.startsWith("/go/platform/")) return "platform_go";
    if (path.startsWith("/go/earn/")) return "earn_go";
    if (path.startsWith("/go/")) return "offer_go";
    if (path.startsWith("/api/postbacks/")) return "postback";
    if (path.startsWith("/app/admin")) return "admin";
    return "unknown";
}

export function normalizeRevenueEvent(input: RevenueEventInput): {
    ok: true;
    event: NormalizedRevenueEvent;
} | {
    ok: false;
    error: string;
} {
    const eventName = cleanEnum<RevenueEventName>(input.event_name, EVENT_NAMES);
    if (!eventName) return { ok: false, error: "invalid_event_name" };

    const routePath = cleanPath(input.route_path);
    if (!routePath) return { ok: false, error: "invalid_route_path" };

    const routeGroup = cleanEnum<RevenueRouteGroup>(input.route_group, ROUTE_GROUPS) ?? inferRevenueRouteGroup(routePath);
    const entityType = cleanEnum<RevenueEntityType>(input.entity_type, ENTITY_TYPES);
    const outboundClickTable = cleanEnum<RevenueOutboundClickTable>(input.outbound_click_table, OUTBOUND_TABLES);

    const event: NormalizedRevenueEvent = {
        event_name: eventName,
        route_path: routePath,
        route_group: routeGroup,
        metadata: cleanMetadata(input.metadata),
    };

    const optional = {
        entity_type: entityType,
        entity_id: cleanString(input.entity_id, 120),
        entity_slug: cleanString(input.entity_slug, 220),
        guide_id: cleanUuid(input.guide_id),
        guide_slug: cleanString(input.guide_slug, 220),
        game_id: cleanUuid(input.game_id),
        game_slug: cleanString(input.game_slug, 220),
        offer_id: cleanString(input.offer_id, 120),
        platform_id: cleanUuid(input.platform_id),
        platform_slug: cleanString(input.platform_slug, 220),
        provider_id: cleanUuid(input.provider_id),
        provider_name: cleanString(input.provider_name, 220),
        cta_location: cleanString(input.cta_location, 160),
        source_context: cleanString(input.source_context, 160),
        target_url: cleanTargetUrl(input.target_url),
        referrer_path: cleanPath(input.referrer_path),
        session_key: cleanString(input.session_key, 120),
        visitor_key: cleanString(input.visitor_key, 120),
        user_agent_family: cleanString(input.user_agent_family, 80),
        outbound_click_table: outboundClickTable,
        outbound_click_id: cleanUuid(input.outbound_click_id),
        conversion_event_id: cleanUuid(input.conversion_event_id),
    };

    for (const [key, value] of Object.entries(optional)) {
        if (value !== undefined) {
            (event as Record<string, unknown>)[key] = value;
        }
    }

    return { ok: true, event };
}
