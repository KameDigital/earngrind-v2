import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const countriesSource = read("src/lib/earnlab-countries.ts");
const routeSource = read("src/app/api/admin/earnlab/gallery-import/route.ts");
const panelSource = read("src/app/app/admin/site-offers/EarnLabGalleryImportPanel.tsx");
const registrySource = read("src/lib/provider-gallery/provider-registry.ts");
const upsertSource = read("src/lib/provider-gallery/upsert.ts");

const countriesMatch = countriesSource.match(/EARNLAB_GALLERY_COUNTRIES\s*=\s*\[([\s\S]*?)\]\s*as const/);
assert(countriesMatch, "EarnLab countries should be exported from one canonical registry");

const countries = [...countriesMatch[1].matchAll(/"([A-Z]{2})"/g)].map((match) => match[1]);
const expectedCountries = ["US", "GB", "CA", "AU", "DE", "FR", "NL", "SE", "NO", "DK", "FI", "ES", "IT", "BR", "MX", "IN"];
const singleCountryValidationIndex = routeSource.indexOf("const country = normalizeSupportedEarnLabImportCountry");
const singleCountryImportIndex = routeSource.lastIndexOf("await importEarnLabCountry(country");

function expectedSingleCountryDecision(value) {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!/^[A-Z]{2}$/.test(normalized)) return { status: "malformed" };
  return countries.includes(normalized)
    ? { status: "supported", country: normalized }
    : { status: "unsupported", country: normalized };
}

assert(
  JSON.stringify(countries) === JSON.stringify(expectedCountries),
  "EarnLab configured country registry should contain the expected uppercase two-letter codes",
);

assert(
  countries.every((country) => /^[A-Z]{2}$/.test(country)),
  "EarnLab country registry should use uppercase ISO-style two-letter codes",
);

assert(
  JSON.stringify(expectedSingleCountryDecision("US")) === JSON.stringify({ status: "supported", country: "US" }),
  "supported single-country imports such as US should remain accepted",
);

assert(
  JSON.stringify(expectedSingleCountryDecision(" us ")) === JSON.stringify({ status: "supported", country: "US" }),
  "lowercase supported single-country input should normalize before registry lookup",
);

assert(
  JSON.stringify(expectedSingleCountryDecision("JP")) === JSON.stringify({ status: "unsupported", country: "JP" }),
  "unsupported syntactically valid single-country input such as JP should be rejected",
);

assert(
  expectedSingleCountryDecision("USA").status === "malformed" &&
    expectedSingleCountryDecision("U1").status === "malformed" &&
    expectedSingleCountryDecision("").status === "malformed",
  "malformed country values should remain rejected before registry membership is considered",
);

assert(
  registrySource.includes("import { EARNLAB_GALLERY_COUNTRIES }") &&
    registrySource.includes("supportedCountries: [...EARNLAB_GALLERY_COUNTRIES]"),
  "provider-gallery registry should reuse the canonical EarnLab country registry instead of duplicating it",
);

assert(
  routeSource.includes("const auth = await requireProviderGalleryEditor()") &&
    routeSource.indexOf("const auth = await requireProviderGalleryEditor()") < routeSource.indexOf("await req.json()"),
  "EarnLab import route should authorize before parsing or running single/batch imports",
);

assert(
  routeSource.includes('typeof body.allCountries !== "boolean"') &&
    routeSource.includes("allCountries must be a boolean when provided"),
  "allCountries should be strictly boolean when provided",
);

assert(
  routeSource.includes("allCountries && body.country !== undefined") &&
    routeSource.includes("country must not be provided when allCountries is true"),
  "batch imports should reject ambiguous allCountries plus country requests",
);

assert(
  routeSource.includes("function normalizeSupportedEarnLabImportCountry") &&
    routeSource.includes("normalizeEarnLabCountryCode(value)") &&
    routeSource.includes("EARNLAB_GALLERY_COUNTRIES.includes(normalized"),
  "single-country imports should normalize input and require membership in the canonical EarnLab country registry",
);

assert(
  routeSource.includes("const country = normalizeSupportedEarnLabImportCountry") &&
    routeSource.includes("Unsupported EarnLab gallery country") &&
    singleCountryValidationIndex > -1 &&
    singleCountryImportIndex > -1 &&
    singleCountryValidationIndex < singleCountryImportIndex,
  "unsupported single-country imports such as JP should be rejected before the shared importer runs",
);

assert(
  routeSource.includes("const unsupported = normalizeEarnLabCountryCode") &&
    routeSource.includes("Unsupported EarnLab gallery country") &&
    routeSource.includes("status: 400"),
  "unsupported but syntactically valid country values should return a controlled 400 response",
);

assert(
  routeSource.includes("mode: \"all-countries\"") &&
    routeSource.includes("countriesRequested") &&
    routeSource.includes("countriesSucceeded") &&
    routeSource.includes("countriesFailed") &&
    routeSource.includes("totals: stats") &&
    routeSource.includes("formatCountryImportResult"),
  "batch response should expose a stable aggregate report",
);

assert(
  routeSource.includes("for (let index = 0; index < countries.length; index += 1)") &&
    routeSource.includes("await importEarnLabCountry(country") &&
    !routeSource.includes("Promise.all"),
  "all-country imports should process countries sequentially with no unbounded concurrency",
);

assert(
  routeSource.includes("const countries = [...EARNLAB_GALLERY_COUNTRIES]"),
  "all-countries mode should continue to use the full canonical EarnLab country registry",
);

assert(
  routeSource.includes("index < countries.length - 1 && delayMs > 0") &&
    routeSource.includes("await sleep(delayMs)"),
  "batch delay should not run after the final country",
);

assert(
  routeSource.includes("Math.min(5000, Math.max(250") &&
    routeSource.includes("DEFAULT_ALL_COUNTRIES_DELAY_MS = 750"),
  "batch delay should be conservative and clamped",
);

assert(
  routeSource.includes("success: false") &&
    routeSource.includes("sanitizeImportError") &&
    routeSource.includes("status: countriesFailed > 0 ? 207 : 200"),
  "one country failure should be sanitized, reported, and represented as partial success without stopping the batch",
);

assert(
  routeSource.includes("countryCode: result.country") &&
    routeSource.includes("countryName: getEarnLabCountryName(result.country)") &&
    routeSource.includes("stats: result.stats"),
  "single-country response should remain backward-compatible",
);

assert(
  routeSource.includes("runProviderGalleryAdminImport") &&
    routeSource.includes("offers: gallery.offers.map(toNormalizedEarnLabOffer)") &&
    upsertSource.includes("importProviderGalleryOffers") &&
    upsertSource.includes("const directUrl = safeDirectOfferUrl(offer.trackingUrl) ?? safeDirectOfferUrl(offer.offerUrl)") &&
    upsertSource.includes("if (directUrl)") &&
    !routeSource.includes(".from(\"site_offers\")"),
  "EarnLab route should reuse the shared provider-gallery import/upsert path and not duplicate Supabase upsert logic",
);

assert(
  registrySource.includes("externalIdStrategy: (offer) => `${offer.sourceOfferId}-${offer.countryCode}`"),
  "EarnLab reruns should keep using the idempotent sourceOfferId-countryCode external_id convention",
);

assert(
  panelSource.includes("secondaryLabel=\"Pull all countries\"") &&
    panelSource.includes("primaryLabel=\"Pull country\"") &&
    panelSource.includes("result.countriesFailed") &&
    panelSource.includes("item.success ? item.country : `${item.country} failed`"),
  "admin UI should distinguish country and all-country imports and surface partial-failure information",
);

console.log("EarnLab all-countries import guard passed");
