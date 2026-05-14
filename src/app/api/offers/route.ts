import { fetchPublicOffers, publicOfferFiltersFromSearchParams } from "@/lib/public-offer-search";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 60;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

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

    let result;
    try {
        result = await fetchPublicOffers(publicOfferFiltersFromSearchParams(req.nextUrl.searchParams));
    } catch (error) {
        console.error("[GET /api/offers]", error);
        return NextResponse.json(
            { error: "internal", message: error instanceof Error ? error.message : "Offer search failed" },
            { status: 500 },
        );
    }

    const responseHeaders: Record<string, string> = {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    };

    if (process.env.NODE_ENV !== "production" && result.data[0]) {
        responseHeaders["x-api-offers-route"] = "route.ts";
        responseHeaders["x-api-offers-image-url"] = result.data[0].image_url ?? "null";
        responseHeaders["x-api-offers-redirect-url"] = result.data[0].redirect_url ?? "null";
    }

    return NextResponse.json({
        data: result.data,
        meta: result.meta,
    }, {
        headers: responseHeaders,
    });
}
