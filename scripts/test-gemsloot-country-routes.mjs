import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const countries = read("src/lib/gemsloot-countries.ts");
const page = read("src/app/offers/gemsloot/[country]/page.tsx");
const providerPage = read("src/app/offers/gemsloot/[country]/[provider]/page.tsx");
const component = read("src/components/offers/GemslootCountryOffersPage.tsx");
const sitemap = read("src/lib/sitemap-builder.ts");

for (const code of ["US", "GB"]) assert(countries.includes(`code: "${code}"`), `missing ${code} registry entry`);
assert(countries.includes("getGemslootPublicCountry"), "country lookup is required");
assert(page.includes("notFound()") && page.includes("canonical: `/offers/gemsloot/${country.slug}`"), "country page must reject unsupported values and canonicalize supported values");
assert(providerPage.includes("notFound()") && providerPage.includes("getProvider"), "provider-country page must validate both parameters");
assert(component.includes('.contains("countries", [countryCode])'), "offer query must filter by country");
assert(component.includes('`/offers/gemsloot/${country.slug}/${item.slug}`'), "provider navigation must retain the active country");
assert(sitemap.includes("GEMSLOOT_PUBLIC_COUNTRIES.flatMap"), "sitemap must derive indexable country URLs from the registry");
console.log("Gemsloot country route coverage checks passed");