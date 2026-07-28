import { NextRequest, NextResponse } from "next/server";
import { getPublicOfferCountryByCode } from "@/lib/earnlab-countries";
import { OFFER_COUNTRY_COOKIE } from "@/lib/offer-country";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const SUPPORTED_CONTENT_TYPES = [
    "application/x-www-form-urlencoded",
    "multipart/form-data",
];

export async function POST(req: NextRequest) {
    if (!isSameOriginRequest(req)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
    if (!SUPPORTED_CONTENT_TYPES.some((type) => contentType.startsWith(type))) {
        return NextResponse.json(
            { error: "unsupported_media_type", message: "Submit the country selector as form data." },
            { status: 415 },
        );
    }

    const formData = await req.formData();
    const country = getPublicOfferCountryByCode(String(formData.get("country") ?? ""));
    if (!country) {
        return NextResponse.json(
            { error: "invalid_country", message: "Country must be one of the supported public offer countries." },
            { status: 400 },
        );
    }

    const destination = new URL(`/offers/${country.slug}`, req.nextUrl.origin);
    const response = NextResponse.redirect(destination, { status: 303 });
    response.cookies.set(OFFER_COUNTRY_COOKIE, country.code, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: COOKIE_MAX_AGE_SECONDS,
    });
    return response;
}

function isSameOriginRequest(req: NextRequest): boolean {
    const expectedOrigin = req.nextUrl.origin;
    const origin = req.headers.get("origin");
    if (origin) return origin === expectedOrigin;

    const referer = req.headers.get("referer");
    if (!referer) return false;

    try {
        return new URL(referer).origin === expectedOrigin;
    } catch {
        return false;
    }
}
