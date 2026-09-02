import { fetchPublicOffers, publicOfferFiltersFromSearchParams } from "@/lib/public-offer-search";
import { getPublicOfferCountryByCode } from "@/lib/earnlab-countries";
import { OFFER_COUNTRY_COOKIE, resolvePublicOfferCountry } from "@/lib/offer-country";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const rawCountryQuery = req.nextUrl.searchParams.get("country");
    const explicitCountry = rawCountryQuery ? getPublicOfferCountryByCode(rawCountryQuery) : null;
    if (rawCountryQuery && !explicitCountry) {
        return NextResponse.json(
            { error: "invalid_country", message: "country must be one of the supported public offer countries" },
            {
                status: 400,
                headers: {
                    "Cache-Control": "no-store",
                },
            },
        );
    }

    const selectedCountryCookie = req.cookies.get(OFFER_COUNTRY_COOKIE)?.value ?? null;
    let profileCountry: string | null = null;
    if (!explicitCountry && !selectedCountryCookie) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from("profiles").select("country_code").eq("id", user.id).maybeSingle();
            profileCountry = profile?.country_code ?? null;
        }
    }

    const requestedFilters = publicOfferFiltersFromSearchParams(req.nextUrl.searchParams);
    const countryResolution = resolvePublicOfferCountry({
        explicitCountry: explicitCountry?.code ?? null,
        selectedCountryCookie,
        profileCountry,
        requestHeaders: req.headers,
    });
    const filters = {
        ...requestedFilters,
        country: requestedFilters.country,
    };

    let result;
    try {
        result = await fetchPublicOffers(filters);
    } catch (error) {
        console.error("[GET /api/offers]", error);
        return NextResponse.json(
            { error: "internal", message: error instanceof Error ? error.message : "Offer search failed" },
            { status: 500 },
        );
    }

    const hasExplicitCountryParam = Boolean(requestedFilters.country);
    const responseHeaders: Record<string, string> = hasExplicitCountryParam
        ? {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            "Vary": "Accept-Encoding",
        }
        : {
            "Cache-Control": "private, no-store",
            "Vary": "Cookie, x-vercel-ip-country",
        };
    responseHeaders["x-offer-country"] = countryResolution.country.code;

    if (process.env.NODE_ENV !== "production" && result.data[0]) {
        responseHeaders["x-api-offers-route"] = "route.ts";
        responseHeaders["x-api-offers-image-url"] = result.data[0].image_url ?? "null";
        responseHeaders["x-api-offers-redirect-url"] = result.data[0].redirect_url ?? "null";
    }

    return NextResponse.json({
        data: result.data,
        meta: {
            ...result.meta,
            country: countryResolution.country.code,
            country_source: countryResolution.source,
        },
    }, {
        headers: responseHeaders,
    });
}
