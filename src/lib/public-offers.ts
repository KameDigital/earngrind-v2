import { isPublicPayoutEligible, normalizeTotalPayout } from "@/lib/offer-quality";
import { normalizeProviderDisplayName } from "@/lib/provider-normalization";

type PublicOfferSource = "ingested" | "manual";
type PublicPayoutType = "online_cashback" | "gift_card" | "points" | "crypto" | null;
type PublicDevice = "ios" | "android" | "pc" | "web";
type PublicPlatformKind = "gpt_site" | "offerwall" | "casino" | "sportsbook" | "cashback";

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

function toPublicPayoutType(value: unknown): PublicPayoutType {
    return value === "online_cashback" || value === "gift_card" || value === "points" || value === "crypto"
        ? value
        : null;
}

function toPublicDevices(values: unknown): PublicDevice[] {
    if (!Array.isArray(values)) return [];
    return values.filter((value): value is PublicDevice =>
        value === "ios" || value === "android" || value === "pc" || value === "web");
}

function toPublicPlatformKind(value: unknown): PublicPlatformKind {
    return value === "offerwall" || value === "casino" || value === "sportsbook" || value === "cashback"
        ? value
        : "gpt_site";
}

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
    const totalPayoutUsd = normalizeTotalPayout(payoutUsd, toNumber(row.total_payout_usd, payoutUsd));
    const providerName = typeof row.provider_name === "string" ? normalizeProviderDisplayName(row.provider_name) : row.provider_name ?? null;
    const gameName = firstNonEmpty(row.game_name, row.title) ?? "Unknown offer";
    const gameSlug = firstNonEmpty(row.game_slug) ?? "";
    const platformName = firstNonEmpty(row.platform_name) ?? "Unknown platform";
    const platformSlug = firstNonEmpty(row.platform_slug) ?? "";
    const source: PublicOfferSource = row.source === "manual" ? "manual" : "ingested";

    return {
        id: firstNonEmpty(row.id) ?? "",
        source,
        title: firstNonEmpty(row.title, row.game_name) ?? "Unknown offer",
        image_url: getUnifiedOfferImageUrl(row),
        payout_usd: payoutUsd,
        total_payout_usd: totalPayoutUsd,
        payout_type: toPublicPayoutType(row.payout_type),
        devices: toPublicDevices(row.devices),
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
        updated_at: firstNonEmpty(row.updated_at) ?? "",
        offer_url: firstNonEmpty(row.offer_url),
        goal_text: row.goal_text ?? null,
        provider_id: row.provider_id ?? null,
        provider_name: providerName,
        is_public_payout_eligible: isPublicPayoutEligible(payoutUsd, totalPayoutUsd),
        redirect_url: getUnifiedOfferRedirectUrl(row),
        game: {
            id: firstNonEmpty(row.game_id) ?? "",
            name: gameName,
            slug: gameSlug,
            thumbnail_url: row.game_thumbnail ?? null,
            devices: toPublicDevices(row.game_devices),
        },
        platform: {
            id: firstNonEmpty(row.platform_id) ?? "",
            name: platformName,
            slug: platformSlug,
            logo_url: row.platform_logo ?? null,
            platform_kind: toPublicPlatformKind(row.platform_kind),
        },
    };
}

export function isPublicOfferRowEligible(row: UnifiedOfferRow): boolean {
    const payoutUsd = toNumber(row.payout_usd);
    const totalPayoutUsd = normalizeTotalPayout(payoutUsd, toNumber(row.total_payout_usd, payoutUsd));
    return isPublicPayoutEligible(payoutUsd, totalPayoutUsd);
}
