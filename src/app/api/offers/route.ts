import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function firstNonEmpty(...values: Array<unknown>): string | null {
    for (const value of values) {
        if (typeof value !== "string") continue;
        const trimmed = value.trim();
        if (trimmed) return trimmed;
    }
    return null;
}

const isImageUrl = (url?: string | null) =>
    typeof url === "string" &&
    /\.(jpg|jpeg|png|webp)$/i.test(url);

function getOfferImageUrl(row: Record<string, unknown>): string | null {
    return firstNonEmpty(
        row.image_url,
        row.offer_image_url,
        row.raw_image_url,
    ) ?? (isImageUrl(firstNonEmpty(row.offer_url)) ? firstNonEmpty(row.offer_url) : null);
}

function getOfferRedirectUrl(row: Record<string, unknown>): string | null {
    const id = firstNonEmpty(row.id);
    return id ? `/go/${id}` : null;
}

function escapeLikeTerm(value: string): string {
    return value.replace(/[%_,]/g, (match) => `\\${match}`);
}

export async function GET(req: NextRequest) {
    console.log("API FIX ACTIVE /api/offers");

    const supabase = createClient();
    const { searchParams } = req.nextUrl;

    const q = searchParams.get("q") ?? "";
    const gameSlug = searchParams.get("game_slug") ?? "";
    const platformId = searchParams.get("platform_id") ?? "";
    const platformKind = searchParams.get("platform_kind") ?? "";
    const device = searchParams.get("device") ?? "";
    const country = searchParams.get("country") ?? "";
    const payoutType = searchParams.get("payout_type") ?? "";
    const source = searchParams.get("source") ?? "";
    const isNew = searchParams.get("is_new") === "true";
    const isHot = searchParams.get("is_hot") === "true";
    const isAth = searchParams.get("is_ath") === "true";
    const isBoosted = searchParams.get("is_boosted") === "true";
    const minPayout = parseFloat(searchParams.get("min_payout") ?? "0") || 0;
    const sort = searchParams.get("sort") ?? "payout_desc";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const perPage = Math.min(100, parseInt(searchParams.get("per_page") ?? "20"));

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
        .from("unified_offers_view")
        .select("*", { count: "exact" });

    if (q.trim()) {
        const terms = q
            .trim()
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

    if (source === "ingested" || source === "manual") {
        query = query.eq("source", source);
    }

    if (gameSlug) query = query.eq("game_slug", gameSlug);
    if (platformId) query = query.eq("platform_id", platformId);
    if (platformKind) query = query.eq("platform_kind", platformKind);
    if (device) query = query.contains("devices", [device]);
    if (country) query = query.contains("countries", [country]);
    if (payoutType) query = query.eq("payout_type", payoutType);
    if (isNew) query = query.eq("is_new", true);
    if (isHot) query = query.eq("is_hot", true);
    if (isAth) query = query.eq("is_ath", true);
    if (isBoosted) query = query.eq("is_boosted", true);
    if (minPayout > 0) query = query.gte("payout_usd", minPayout);

    switch (sort) {
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

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
        console.error("[GET /api/offers]", error);
        return NextResponse.json({ error: "internal", message: error.message }, { status: 500 });
    }

    const shaped = (data ?? []).map((row) => {
        const image_url = getOfferImageUrl(row);
        const redirect_url = getOfferRedirectUrl(row);

        return {
            id: row.id,
            source: row.source,
            title: row.title,
            image_url,
            payout_usd: row.payout_usd,
            payout_type: row.payout_type,
            devices: row.devices,
            countries: row.countries,
            category: row.category,
            status: row.status,
            is_featured: row.is_featured,
            is_ath: row.is_ath,
            is_new: row.is_new,
            is_hot: row.is_hot,
            is_boosted: row.is_boosted,
            heat_score: row.heat_score,
            offer_expires_at: row.offer_expires_at,
            updated_at: row.updated_at,
            goal_text: row.goal_text,
            provider_name: row.provider_name,
            redirect_url,
            game: {
                id: row.game_id,
                name: row.game_name,
                slug: row.game_slug,
                thumbnail_url: row.game_thumbnail,
                devices: row.game_devices,
            },
            platform: {
                id: row.platform_id,
                name: row.platform_name,
                slug: row.platform_slug,
                logo_url: row.platform_logo,
                platform_kind: row.platform_kind,
            },
        };
    });

    if (data?.[0]) {
        console.log("[/api/offers] debug row", {
            id: data[0].id,
            offer_url: typeof data[0].offer_url === "string" ? data[0].offer_url : null,
            image_url: shaped[0]?.image_url ?? null,
            redirect_url: shaped[0]?.redirect_url ?? null,
        });
    }

    const total = count ?? 0;

    const responseHeaders: Record<string, string> = {
        "Cache-Control": "no-store, max-age=0",
    };

    if (process.env.NODE_ENV !== "production" && shaped[0]) {
        responseHeaders["x-api-offers-route"] = "route.ts";
        responseHeaders["x-api-offers-image-url"] = shaped[0].image_url ?? "null";
        responseHeaders["x-api-offers-redirect-url"] = shaped[0].redirect_url ?? "null";
    }

    return NextResponse.json({
        data: shaped,
        meta: {
            total,
            page,
            per_page: perPage,
            total_pages: Math.ceil(total / perPage),
        },
    }, {
        headers: responseHeaders,
    });
}
