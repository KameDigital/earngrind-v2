export type RedirectAttribution = {
    offer_id?: string;
    offer_title?: string;
    game_title?: string;
    platform_name?: string;
    provider_name?: string;
    payout_usd?: number;
    total_payout_usd?: number;
    click_location?: string;
    source_context?: string;
    destination_url?: string;
    affiliate_mode?: string;
};

export type RedirectAttributionInput = {
    offer_id?: string | null;
    offer_title?: string | null;
    game_title?: string | null;
    platform_name?: string | null;
    provider_name?: string | null;
    payout_usd?: number | string | null;
    total_payout_usd?: number | string | null;
    click_location?: string | null;
    source_context?: string | null;
    destination_url?: string | null;
    affiliate_mode?: string | null;
};

function normalizeString(value: string | null | undefined): string | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
}

function normalizeNumber(value: number | string | null | undefined): number | undefined {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : undefined;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return undefined;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
}

export function normalizeRedirectAttribution(
    attribution: RedirectAttributionInput,
): Partial<RedirectAttribution> {
    const normalized: Partial<RedirectAttribution> = {
        offer_id: normalizeString(attribution.offer_id),
        offer_title: normalizeString(attribution.offer_title),
        game_title: normalizeString(attribution.game_title),
        platform_name: normalizeString(attribution.platform_name),
        provider_name: normalizeString(attribution.provider_name),
        payout_usd: normalizeNumber(attribution.payout_usd),
        total_payout_usd: normalizeNumber(attribution.total_payout_usd),
        click_location: normalizeString(attribution.click_location),
        source_context: normalizeString(attribution.source_context),
        destination_url: normalizeString(attribution.destination_url),
        affiliate_mode: normalizeString(attribution.affiliate_mode),
    };

    return Object.fromEntries(
        Object.entries(normalized).filter(([, value]) => value !== undefined),
    ) as Partial<RedirectAttribution>;
}

export function buildRedirectAttributionSearchParams(
    attribution: Partial<RedirectAttribution>,
): URLSearchParams {
    const normalized = normalizeRedirectAttribution(attribution);
    const searchParams = new URLSearchParams();

    if (normalized.offer_title) searchParams.set("offer_title", normalized.offer_title);
    if (normalized.game_title) searchParams.set("game_title", normalized.game_title);
    if (normalized.platform_name) searchParams.set("platform_name", normalized.platform_name);
    if (normalized.provider_name) searchParams.set("provider_name", normalized.provider_name);
    if (normalized.payout_usd !== undefined) searchParams.set("payout_usd", String(normalized.payout_usd));
    if (normalized.total_payout_usd !== undefined) searchParams.set("total_payout_usd", String(normalized.total_payout_usd));
    if (normalized.click_location) searchParams.set("click_location", normalized.click_location);
    if (normalized.source_context) searchParams.set("source_context", normalized.source_context);
    if (normalized.destination_url) searchParams.set("destination_url", normalized.destination_url);
    if (normalized.affiliate_mode) searchParams.set("affiliate_mode", normalized.affiliate_mode);

    return searchParams;
}

export function readRedirectAttributionFromSearchParams(
    searchParams: URLSearchParams,
): Partial<RedirectAttribution> {
    return normalizeRedirectAttribution({
        offer_title: searchParams.get("offer_title"),
        game_title: searchParams.get("game_title"),
        platform_name: searchParams.get("platform_name"),
        provider_name: searchParams.get("provider_name"),
        payout_usd: searchParams.get("payout_usd"),
        total_payout_usd: searchParams.get("total_payout_usd"),
        click_location: searchParams.get("click_location") ?? searchParams.get("location"),
        source_context: searchParams.get("source_context"),
        destination_url: searchParams.get("destination_url"),
        affiliate_mode: searchParams.get("affiliate_mode"),
    });
}
