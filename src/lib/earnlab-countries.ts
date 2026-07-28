export const EARNLAB_GALLERY_COUNTRIES = [
    "US",
    "GB",
    "CA",
    "AU",
    "DE",
    "FR",
    "NL",
    "SE",
    "NO",
    "DK",
    "FI",
    "ES",
    "IT",
    "BR",
    "MX",
    "IN",
] as const;

export const EARNLAB_COUNTRY_NAMES: Record<string, string> = {
    US: "United States",
    GB: "United Kingdom",
    CA: "Canada",
    AU: "Australia",
    DE: "Germany",
    FR: "France",
    NL: "Netherlands",
    SE: "Sweden",
    NO: "Norway",
    DK: "Denmark",
    FI: "Finland",
    ES: "Spain",
    IT: "Italy",
    BR: "Brazil",
    MX: "Mexico",
    IN: "India",
};

export type EarnLabCountryCode = typeof EARNLAB_GALLERY_COUNTRIES[number];

export type PublicOfferCountry = {
    code: EarnLabCountryCode;
    slug: string;
    name: string;
    supported: boolean;
};

export const PUBLIC_OFFER_COUNTRIES: PublicOfferCountry[] = EARNLAB_GALLERY_COUNTRIES.map((code) => ({
    code,
    slug: code.toLowerCase(),
    name: EARNLAB_COUNTRY_NAMES[code],
    supported: true,
}));

export function normalizeEarnLabCountryCode(value: string | null | undefined): string | null {
    const normalized = value?.trim().toUpperCase() ?? "";
    if (!/^[A-Z]{2}$/.test(normalized)) return null;
    return normalized;
}

export function isSupportedEarnLabCountry(value: string | null | undefined): value is string {
    const normalized = normalizeEarnLabCountryCode(value);
    return Boolean(normalized && EARNLAB_COUNTRY_NAMES[normalized]);
}

export function getEarnLabCountryName(countryCode: string): string {
    const normalized = normalizeEarnLabCountryCode(countryCode);
    return normalized ? EARNLAB_COUNTRY_NAMES[normalized] ?? normalized : countryCode;
}

export function normalizePublicOfferCountryCode(value: string | null | undefined): EarnLabCountryCode | null {
    const normalized = normalizeEarnLabCountryCode(value);
    if (!normalized) return null;
    return PUBLIC_OFFER_COUNTRIES.some((country) => country.supported && country.code === normalized)
        ? normalized as EarnLabCountryCode
        : null;
}

export function getPublicOfferCountryByCode(value: string | null | undefined): PublicOfferCountry | null {
    const normalized = normalizePublicOfferCountryCode(value);
    return normalized ? PUBLIC_OFFER_COUNTRIES.find((country) => country.code === normalized) ?? null : null;
}

export function getPublicOfferCountryBySlug(value: string | null | undefined): PublicOfferCountry | null {
    const slug = value?.trim().toLowerCase() ?? "";
    if (!slug) return null;
    return PUBLIC_OFFER_COUNTRIES.find((country) => country.supported && country.slug === slug) ?? null;
}

export function getSupportedPublicOfferCountries(): PublicOfferCountry[] {
    return PUBLIC_OFFER_COUNTRIES.filter((country) => country.supported);
}
