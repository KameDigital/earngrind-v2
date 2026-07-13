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
