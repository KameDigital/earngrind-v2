export const GEMSLOOT_PUBLIC_COUNTRIES = [
  { code: "US", slug: "us", name: "United States", shortName: "US" },
  { code: "GB", slug: "gb", name: "United Kingdom", shortName: "UK" },
] as const;

export type GemslootPublicCountry = typeof GEMSLOOT_PUBLIC_COUNTRIES[number];
export type GemslootPublicCountryCode = GemslootPublicCountry["code"];

export function getGemslootPublicCountry(value: string | null | undefined): GemslootPublicCountry | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;

  return GEMSLOOT_PUBLIC_COUNTRIES.find((country) => (
    country.slug === normalized || country.code.toLowerCase() === normalized
  )) ?? null;
}
