export type UnifiedOfferRow = Record<string, unknown> & {
    id?: string | null;
    source?: string | null;
    title?: string | null;
    payout_usd?: number | string | null;
    total_payout_usd?: number | string | null;
    payout_type?: string | null;
    devices?: string[] | null;
    countries?: string[] | null;
    category?: string | null;
    status?: string | null;
    is_featured?: boolean | null;
    is_ath?: boolean | null;
    is_new?: boolean | null;
    is_hot?: boolean | null;
    is_boosted?: boolean | null;
    heat_score?: number | null;
    offer_expires_at?: string | null;
    updated_at?: string | null;
    offer_url?: string | null;
    goal_text?: string | null;
    image_url?: string | null;
    game_id?: string | null;
    game_name?: string | null;
    game_slug?: string | null;
    game_thumbnail?: string | null;
    game_devices?: string[] | null;
    platform_id?: string | null;
    platform_name?: string | null;
    platform_slug?: string | null;
    platform_logo?: string | null;
    platform_kind?: string | null;
    provider_id?: string | null;
    provider_name?: string | null;
};

export function firstNonEmpty(...values: Array<unknown>): string | null {
    for (const value of values) {
        if (typeof value !== "string") continue;
        const trimmed = value.trim();
        if (trimmed) return trimmed;
    }
    return null;
}

export const isImageUrl = (url?: string | null) =>
    typeof url === "string" &&
    /\.(jpg|jpeg|png|webp|gif|avif|svg)(?:$|[?#])/i.test(url);

export function toNumber(value: unknown, fallback = 0): number {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
}

export function getUnifiedOfferImageUrl(row: UnifiedOfferRow): string | null {
    return firstNonEmpty(row.image_url, row.game_thumbnail, row.platform_logo) ??
        (isImageUrl(firstNonEmpty(row.offer_url)) ? firstNonEmpty(row.offer_url) : null);
}

export function getUnifiedOfferRedirectUrl(row: UnifiedOfferRow): string | null {
    const id = firstNonEmpty(row.id);
    return id ? `/go/${id}` : null;
}

export function shapePublicOffer(row: UnifiedOfferRow) {
    const payoutUsd = toNumber(row.payout_usd);
    const totalPayoutUsd = toNumber(row.total_payout_usd, payoutUsd);

    return {
        id: firstNonEmpty(row.id) ?? "",
        source: row.source,
        title: row.title,
        image_url: getUnifiedOfferImageUrl(row),
        payout_usd: payoutUsd,
        total_payout_usd: totalPayoutUsd,
        payout_type: row.payout_type,
        devices: row.devices ?? [],
        countries: row.countries ?? [],
        category: row.category,
        status: row.status,
        is_featured: Boolean(row.is_featured),
        is_ath: Boolean(row.is_ath),
        is_new: Boolean(row.is_new),
        is_hot: Boolean(row.is_hot),
        is_boosted: Boolean(row.is_boosted),
        heat_score: row.heat_score ?? 0,
        offer_expires_at: row.offer_expires_at ?? null,
        updated_at: row.updated_at ?? null,
        offer_url: firstNonEmpty(row.offer_url),
        goal_text: row.goal_text ?? null,
        provider_id: row.provider_id ?? null,
        provider_name: row.provider_name ?? null,
        redirect_url: getUnifiedOfferRedirectUrl(row),
        game: {
            id: row.game_id ?? null,
            name: row.game_name ?? null,
            slug: row.game_slug ?? null,
            thumbnail_url: row.game_thumbnail ?? null,
            devices: row.game_devices ?? [],
        },
        platform: {
            id: row.platform_id ?? null,
            name: row.platform_name ?? null,
            slug: row.platform_slug ?? null,
            logo_url: row.platform_logo ?? null,
            platform_kind: row.platform_kind ?? null,
        },
    };
}
