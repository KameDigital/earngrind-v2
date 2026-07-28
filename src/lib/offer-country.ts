import {
    getPublicOfferCountryByCode,
    getPublicOfferCountryBySlug,
    normalizePublicOfferCountryCode,
    type EarnLabCountryCode,
    type PublicOfferCountry,
} from "@/lib/earnlab-countries";

export const OFFER_COUNTRY_COOKIE = "eg_offer_country";
export const DEFAULT_PUBLIC_OFFER_COUNTRY: EarnLabCountryCode = "US";
export const TRUSTED_GEO_COUNTRY_HEADERS = ["x-vercel-ip-country"] as const;

type HeaderReader = {
    get(name: string): string | null;
};

export type OfferCountryResolutionSource = "explicit" | "cookie" | "profile" | "header" | "default";

export type OfferCountryResolution = {
    country: PublicOfferCountry;
    source: OfferCountryResolutionSource;
    attemptedCookieCountry: string | null;
    attemptedHeaderCountry: string | null;
    fellBack: boolean;
};

export function normalizeOfferCountryCode(value: string | null | undefined): EarnLabCountryCode | null {
    return normalizePublicOfferCountryCode(value);
}

export function getOfferCountryBySlug(value: string | null | undefined): PublicOfferCountry | null {
    return getPublicOfferCountryBySlug(value);
}

export function resolvePublicOfferCountry({
    explicitCountry,
    selectedCountryCookie,
    profileCountry,
    requestHeaders,
    defaultCountry = DEFAULT_PUBLIC_OFFER_COUNTRY,
}: {
    explicitCountry?: string | null;
    selectedCountryCookie?: string | null;
    profileCountry?: string | null;
    requestHeaders?: HeaderReader | null;
    defaultCountry?: string | null;
}): OfferCountryResolution {
    const explicit = getPublicOfferCountryByCode(explicitCountry);
    if (explicit) {
        return buildResolution(explicit, "explicit", selectedCountryCookie ?? null, null, false);
    }

    const cookie = getPublicOfferCountryByCode(selectedCountryCookie);
    if (cookie) {
        return buildResolution(cookie, "cookie", selectedCountryCookie ?? null, null, false);
    }

    const profile = getPublicOfferCountryByCode(profileCountry);
    if (profile) {
        return buildResolution(profile, "profile", selectedCountryCookie ?? null, null, false);
    }

    const attemptedHeaderCountry = getTrustedHeaderCountryValue(requestHeaders);
    const header = getPublicOfferCountryByCode(attemptedHeaderCountry);
    if (header) {
        return buildResolution(header, "header", selectedCountryCookie ?? null, attemptedHeaderCountry, false);
    }

    const fallback = getPublicOfferCountryByCode(defaultCountry) ?? getPublicOfferCountryByCode(DEFAULT_PUBLIC_OFFER_COUNTRY);
    if (!fallback) {
        throw new Error("Default public offer country is not configured");
    }

    return buildResolution(
        fallback,
        "default",
        selectedCountryCookie ?? null,
        attemptedHeaderCountry,
        Boolean(explicitCountry || selectedCountryCookie || profileCountry || attemptedHeaderCountry),
    );
}

export function getTrustedHeaderCountryValue(headers: HeaderReader | null | undefined): string | null {
    if (!headers) return null;
    for (const header of TRUSTED_GEO_COUNTRY_HEADERS) {
        const value = headers.get(header);
        if (value) return value;
    }
    return null;
}

function buildResolution(
    country: PublicOfferCountry,
    source: OfferCountryResolutionSource,
    attemptedCookieCountry: string | null,
    attemptedHeaderCountry: string | null,
    fellBack: boolean,
): OfferCountryResolution {
    return {
        country,
        source,
        attemptedCookieCountry,
        attemptedHeaderCountry,
        fellBack,
    };
}
