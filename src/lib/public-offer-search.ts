import { supabase } from "@/lib/supabase/public";
import { isPublicOfferRowEligible, shapePublicOffer } from "@/lib/public-offers";
import { getPublicOfferMinPayout } from "@/lib/offer-quality";
import { normalizeOfferCountryCode } from "@/lib/offer-country";

export type PublicOfferSort = "payout_desc" | "payout_asc" | "heat_desc" | "newest" | "completed_desc";
export type PublicOfferSource = "" | "ingested" | "manual";

export interface PublicOfferSearchFilters {
    q?: string;
    gameSlug?: string;
    platformId?: string;
    platformKind?: string;
    device?: string;
    country?: string;
    payoutType?: string;
    source?: PublicOfferSource;
    isNew?: boolean;
    isHot?: boolean;
    isAth?: boolean;
    isBoosted?: boolean;
    minPayout?: number;
    sort?: PublicOfferSort;
    page?: number;
    perPage?: number;
}

export interface PublicOfferSearchResult {
    data: ReturnType<typeof shapePublicOffer>[];
    meta: {
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
    };
}

function escapeLikeTerm(value: string): string {
    return value.replace(/[%_,]/g, (match) => `\\${match}`);
}

function offerDedupeKey(offer: ReturnType<typeof shapePublicOffer>): string {
    return [
        offer.game?.slug ?? offer.title ?? "",
        offer.platform?.id ?? offer.platform?.slug ?? "",
        offer.provider_id ?? offer.provider_name ?? "",
    ].join("|").toLowerCase();
}

export function dedupePublicOffers<T extends ReturnType<typeof shapePublicOffer>>(offers: T[]): T[] {
    const seen = new Set<string>();
    const deduped: T[] = [];

    for (const offer of offers) {
        const key = offerDedupeKey(offer);
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(offer);
    }

    return deduped;
}

export function normalizePublicOfferSearchFilters(filters: PublicOfferSearchFilters): Required<Pick<PublicOfferSearchFilters, "q" | "gameSlug" | "platformId" | "platformKind" | "device" | "country" | "payoutType" | "source" | "isNew" | "isHot" | "isAth" | "isBoosted" | "minPayout" | "sort" | "page" | "perPage">> {
    const sort = filters.sort === "payout_asc" || filters.sort === "heat_desc" || filters.sort === "newest" || filters.sort === "completed_desc"
        ? filters.sort
        : "payout_desc";
    const source = filters.source === "ingested" || filters.source === "manual" ? filters.source : "";

    return {
        q: (filters.q ?? "").trim().slice(0, 80),
        gameSlug: filters.gameSlug ?? "",
        platformId: filters.platformId ?? "",
        platformKind: filters.platformKind ?? "",
        device: filters.device ?? "",
        country: normalizeOfferCountryCode(filters.country) ?? "",
        payoutType: filters.payoutType ?? "",
        source,
        isNew: Boolean(filters.isNew),
        isHot: Boolean(filters.isHot),
        isAth: Boolean(filters.isAth),
        isBoosted: Boolean(filters.isBoosted),
        minPayout: Number.isFinite(filters.minPayout) ? filters.minPayout ?? 0 : 0,
        sort,
        page: Math.min(100, Math.max(1, Math.trunc(filters.page ?? 1))),
        perPage: Math.min(100, Math.max(1, Math.trunc(filters.perPage ?? 24))),
    };
}

export function publicOfferFiltersFromSearchParams(searchParams: URLSearchParams): PublicOfferSearchFilters {
    return {
        q: searchParams.get("q") ?? "",
        gameSlug: searchParams.get("game_slug") ?? "",
        platformId: searchParams.get("platform_id") ?? "",
        platformKind: searchParams.get("platform_kind") ?? "",
        device: searchParams.get("device") ?? "",
        country: searchParams.get("country") ?? "",
        payoutType: searchParams.get("payout_type") ?? "",
        source: (searchParams.get("source") ?? "") as PublicOfferSource,
        isNew: searchParams.get("is_new") === "true",
        isHot: searchParams.get("is_hot") === "true",
        isAth: searchParams.get("is_ath") === "true",
        isBoosted: searchParams.get("is_boosted") === "true",
        minPayout: parseFloat(searchParams.get("min_payout") ?? "0") || 0,
        sort: (searchParams.get("sort") ?? "payout_desc") as PublicOfferSort,
        page: parseInt(searchParams.get("page") ?? "1", 10),
        perPage: parseInt(searchParams.get("per_page") ?? "20", 10),
    };
}

export async function fetchPublicOffers(filters: PublicOfferSearchFilters): Promise<PublicOfferSearchResult> {
    const normalized = normalizePublicOfferSearchFilters(filters);
    const minPayout = Math.max(normalized.minPayout, getPublicOfferMinPayout());

    if (normalized.sort === "completed_desc") {
        return fetchPublicOffersCompatibility(normalized, minPayout);
    }

    try {
        const { data, error } = await supabase.rpc("search_public_offers", {
            p_q: normalized.q,
            p_game_slug: normalized.gameSlug,
            p_platform_id: normalized.platformId,
            p_platform_kind: normalized.platformKind,
            p_device: normalized.device,
            p_country: normalized.country,
            p_payout_type: normalized.payoutType,
            p_source: normalized.source,
            p_is_new: normalized.isNew,
            p_is_hot: normalized.isHot,
            p_is_ath: normalized.isAth,
            p_is_boosted: normalized.isBoosted,
            p_min_payout: minPayout,
            p_sort: normalized.sort,
            p_page: normalized.page,
            p_per_page: normalized.perPage,
        });

        if (error) {
            console.warn("[fetchPublicOffers] search_public_offers RPC encountered an error, falling back to compatibility query:", error.message || error);
            return fetchPublicOffersCompatibility(normalized, minPayout);
        }

        const rows = (data ?? []) as Array<Record<string, unknown> & { total_count?: number | string | null }>;
        const shaped = dedupePublicOffers(
            rows
                .filter((row) => isPublicOfferRowEligible(row))
                .map((row) => shapePublicOffer(row)),
        );
        const total = Number(rows[0]?.total_count ?? 0);

        return {
            data: shaped,
            meta: {
                total,
                page: normalized.page,
                per_page: normalized.perPage,
                total_pages: Math.ceil(total / normalized.perPage),
            },
        };
    } catch (err) {
        console.warn("[fetchPublicOffers] search RPC failed unexpectedly, using compatibility query fallback:", err);
        return fetchPublicOffersCompatibility(normalized, minPayout);
    }
}

function isMissingSearchRpcError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const record = error as Record<string, unknown>;
    return record.code === "PGRST202" ||
        String(record.message ?? "").includes("search_public_offers") ||
        String(record.details ?? "").includes("search_public_offers");
}

async function fetchPublicOffersCompatibility(
    normalized: ReturnType<typeof normalizePublicOfferSearchFilters>,
    minPayout: number,
): Promise<PublicOfferSearchResult> {
    const from = (normalized.page - 1) * normalized.perPage;
    const to = from + normalized.perPage * 3 - 1;

    let query = supabase
        .from("unified_offers_view")
        .select("*", { count: "exact" })
        .gte("payout_usd", minPayout)
        .gte("total_payout_usd", minPayout);

    if (normalized.q) {
        const terms = normalized.q
            .split(/\s+/)
            .map(escapeLikeTerm)
            .filter(Boolean);

        for (const term of terms) {
            query = query.or([
                `title.ilike.%${term}%`,
                `game_name.ilike.%${term}%`,
                `platform_name.ilike.%${term}%`,
                `provider_name.ilike.%${term}%`,
                `category.ilike.%${term}%`,
                `goal_text.ilike.%${term}%`,
            ].join(","));
        }
    }

    if (normalized.source) query = query.eq("source", normalized.source);
    if (normalized.gameSlug) query = query.eq("game_slug", normalized.gameSlug);
    if (normalized.platformId) query = query.eq("platform_id", normalized.platformId);
    if (normalized.platformKind) query = query.eq("platform_kind", normalized.platformKind);
    if (normalized.device) query = query.contains("devices", [normalized.device]);
    if (normalized.country) query = query.contains("countries", [normalized.country]);
    if (normalized.payoutType) query = query.eq("payout_type", normalized.payoutType);
    if (normalized.isNew) query = query.eq("is_new", true);
    if (normalized.isHot) query = query.eq("is_hot", true);
    if (normalized.isAth) query = query.eq("is_ath", true);
    if (normalized.isBoosted) query = query.eq("is_boosted", true);

    switch (normalized.sort) {
        case "completed_desc":
            query = query.order("completion_count", { ascending: false, nullsFirst: false });
            break;
        case "payout_asc":
            query = query.order("payout_usd", { ascending: true });
            break;
        case "heat_desc":
            query = query.order("heat_score", { ascending: false });
            break;
        case "newest":
            query = query.order("updated_at", { ascending: false });
            break;
        default:
            query = query.order("payout_usd", { ascending: false });
    }

    try {
        const { data, error, count } = await query.range(from, to);
        if (error) {
            console.error("[fetchPublicOffersCompatibility] query error:", error.message || error);
            return {
                data: [],
                meta: { total: 0, page: normalized.page, per_page: normalized.perPage, total_pages: 1 },
            };
        }

        const shaped = dedupePublicOffers(
            (data ?? [])
                .filter((row) => isPublicOfferRowEligible(row))
                .map((row) => shapePublicOffer(row)),
        ).slice(0, normalized.perPage);
        const total = count ?? shaped.length;

        return {
            data: shaped,
            meta: {
                total,
                page: normalized.page,
                per_page: normalized.perPage,
                total_pages: Math.max(1, Math.ceil(total / normalized.perPage)),
            },
        };
    } catch (err) {
        console.error("[fetchPublicOffersCompatibility] unexpected error:", err);
        return {
            data: [],
            meta: { total: 0, page: normalized.page, per_page: normalized.perPage, total_pages: 1 },
        };
    }
}
