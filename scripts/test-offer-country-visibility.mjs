import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function read(file) {
  const fullPath = path.join(process.cwd(), file);
  assert.ok(existsSync(fullPath), `${file} should exist`);
  return readFileSync(fullPath, "utf8");
}

const countries = read("src/lib/earnlab-countries.ts");
const resolver = read("src/lib/offer-country.ts");
const serverResolver = read("src/lib/server-offer-country.ts");
const offersPage = read("src/app/offers/page.tsx");
const offersApi = read("src/app/api/offers/route.ts");
const search = read("src/lib/public-offer-search.ts");
const searchComponent = read("src/components/offers/OfferSearchEngine.tsx");
const countryPage = read("src/components/offers/EarnLabCountryOffersPage.tsx");
const countrySelector = read("src/components/offers/CountrySelector.tsx");

assert.match(
  countries,
  /PUBLIC_OFFER_COUNTRIES[\s\S]*EARNLAB_GALLERY_COUNTRIES\.map/,
  "public country registry should reuse canonical EarnLab countries",
);
assert.match(
  countries,
  /normalizePublicOfferCountryCode/,
  "country registry should expose a validated public country normalizer",
);

assert.match(
  resolver,
  /resolvePublicOfferCountry/,
  "resolver should expose shared country resolution",
);
assert.match(
  resolver,
  /TRUSTED_GEO_COUNTRY_HEADERS = \["x-vercel-ip-country"\]/,
  "resolver should use Vercel country header as the trusted geo hint",
);
assert.match(
  serverResolver,
  /headers\(\)/,
  "server resolver should read trusted server request headers",
);

assert.match(
  offersPage,
  /resolveRequestOfferCountry\(initialSearchParams\.get\("country"\)\)/,
  "/offers should resolve country on the server",
);
assert.match(
  offersPage,
  /country: effectiveCountry\.code/,
  "/offers data load should pass the validated country into fetchPublicOffers",
);
assert.match(
  offersPage,
  /<CountrySelector activeCountryCode=\{effectiveCountry\.code\}/,
  "/offers should render the country selector",
);
assert.doesNotMatch(
  offersPage,
  /generateMetadata/,
  "/offers should not emit country-specific metadata under the generic canonical URL",
);
assert.match(
  offersApi,
  /publicOfferFiltersFromSearchParams\(req\.nextUrl\.searchParams\)/,
  "public offers API should route query filters through the shared public search normalizer",
);
assert.match(
  offersApi,
  /"Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"/,
  "explicit query-filtered offer responses should use the public cache policy",
);

assert.match(
  search,
  /country: filters\.country \?\? ""/,
  "public search filters should carry country through the shared normalizer",
);
assert.match(
  search,
  /p_country: normalized\.country/,
  "public RPC should receive the sanitized country",
);

assert.match(
  searchComponent,
  /import type \{ PublicOfferCountry \}/,
  "client country filter should use registry metadata from the server",
);
assert.match(
  searchComponent,
  /countries: PublicOfferCountry\[\]/,
  "client filter should receive supported countries as data",
);
assert.match(countrySelector, /action="\/offers"/, "country selector should submit back to /offers");
assert.match(countrySelector, /method="GET"/, "country selector should use crawlable query-string navigation");
assert.match(countrySelector, /name="country"/, "country selector should submit a country query parameter");
assert.match(countrySelector, /disabled=\{submitting\}/, "country selector should disable duplicate submissions while navigating");

assert.match(
  countryPage,
  /getImportedEarnLabOffers\(countryCode, sort\)/,
  "EarnLab country pages should read imported rows for the explicit country first",
);
assert.match(
  countryPage,
  /getEarnLabGalleryTasksByCountry\(countryCode/,
  "live fallback should receive the explicit validated country",
);
assert.doesNotMatch(
  countryPage,
  /getEarnLabGalleryTasksByCountry\("US"/,
  "live fallback should not hard-code US",
);

console.log("Offer country visibility guard passed");
