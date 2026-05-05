import { supabase } from "@/lib/supabase/public";
import { shapePublicOffer } from "@/lib/public-offers";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 60;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function escapeLikeTerm(value: string): string {
    return value.replace(/[%_,]/g, (match) => `\\${match}`);
}

function clientKey(req: NextRequest) {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown"
    );
}

function isRateLimited(req: NextRequest) {
    const key = clientKey(req);
    const now = Date.now();
    const current = requestCounts.get(key);

    if (!current || current.resetAt <= now) {
        requestCounts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }

    current.count += 1;
    return current.count > RATE_LIMIT_MAX_REQUESTS;
}

export async function GET(req: NextRequest) {
    if (isRateLimited(req)) {
        return NextResponse.json(
            { error: "rate_limited", message: "Too many requests" },
            {
                status: 429,
                headers: {
                    "Cache-Control": "no-store",
                    "Retry-After": "60",
                },
            },
        );
    }

    const { searchParams } = req.nextUrl;

    const q = (searchParams.get("q") ?? "").trim().slice(0, 80);
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
    const page = Math.min(50, Math.max(1, parseInt(searchParams.get("page") ?? "1")));
    const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get("per_page") ?? "20")));

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

    const shaped = (data ?? []).map((row) => shapePublicOffer(row));

    const total = count ?? 0;

    const responseHeaders: Record<string, string> = {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
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
