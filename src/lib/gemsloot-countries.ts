export const GEMSLOOT_PUBLIC_COUNTRIES = [
  { code: "US", slug: "us", name: "United States", shortName: "US" },
  { code: "GB", slug: "gb", name: "United Kingdom", shortName: "UK" },
] as const;

export type GemslootPublicCountryCode = string;

export function normalizeGemslootPublicCountry(value: string) {
  const normalized = value.trim().toLowerCase();
  const listed = GEMSLOOT_PUBLIC_COUNTRIES.find((country) => (
    country.slug === normalized || country.code.toLowerCase() === normalized
  ));
  if (listed) return listed;

  const code = normalized.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;
  const name = countryDisplayName(code);
  return { code, slug: normalized, name, shortName: code };
}

export function getGemslootPublicCountry(value: string) {
  return normalizeGemslootPublicCountry(value);
}

export function getGemslootCountryName(countryCode: GemslootPublicCountryCode) {
  return normalizeGemslootPublicCountry(countryCode)?.name ?? countryCode;
}

export function getGemslootCountrySlug(countryCode: GemslootPublicCountryCode) {
  return normalizeGemslootPublicCountry(countryCode)?.slug ?? countryCode.toLowerCase();
}

function countryDisplayName(countryCode: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}
