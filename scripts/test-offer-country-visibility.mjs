import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function read(file) {
  return readFileSync(path.join(process.cwd(), file), "utf8");
}

function assertOrder(source, needles, message) {
  let previous = -1;
  for (const needle of needles) {
    const current = source.indexOf(needle);
    assert.notEqual(current, -1, `${message}: missing ${needle}`);
    assert.ok(current > previous, `${message}: ${needle} should appear after the previous checkpoint`);
    previous = current;
  }
}

const countries = read("src/lib/earnlab-countries.ts");
const resolver = read("src/lib/offer-country.ts");
const serverResolver = read("src/lib/server-offer-country.ts");
const offersPage = read("src/app/offers/page.tsx");
const offersApi = read("src/app/api/offers/route.ts");
const countryRoute = read("src/app/api/offers/country/route.ts");
const search = read("src/lib/public-offer-search.ts");
const searchComponent = read("src/components/offers/OfferSearchEngine.tsx");
const countryPage = read("src/components/offers/EarnLabCountryOffersPage.tsx");
const countrySelector = read("src/components/offers/CountrySelector.tsx");
const sitemapBuilder = read("src/lib/sitemap-builder.ts");

assert.match(countries, /PUBLIC_OFFER_COUNTRIES[\s\S]*EARNLAB_GALLERY_COUNTRIES\.map/, "public country registry should reuse canonical EarnLab countries");
assert.match(countries, /slug: code\.toLowerCase\(\)/, "country registry should expose URL slugs");
assert.match(countries, /supported: true/, "country registry should expose public browsing support");
assert.match(countries, /normalizePublicOfferCountryCode/, "country registry should expose a validated public country normalizer");

assert.match(resolver, /OFFER_COUNTRY_COOKIE = "eg_offer_country"/, "resolver should define the selected-country cookie name");
assert.match(resolver, /TRUSTED_GEO_COUNTRY_HEADERS = \["x-vercel-ip-country"\]/, "resolver should use Vercel country header as the trusted geo hint");
assertOrder(
  resolver,
  [
    "const explicit = getPublicOfferCountryByCode(explicitCountry)",
    "const cookie = getPublicOfferCountryByCode(selectedCountryCookie)",
    "const profile = getPublicOfferCountryByCode(profileCountry)",
    "const attemptedHeaderCountry = getTrustedHeaderCountryValue(requestHeaders)",
    "const fallback = getPublicOfferCountryByCode(defaultCountry)",
  ],
  "country resolution precedence",
);
assert.match(resolver, /return normalizePublicOfferCountryCode\(value\)/, "normalization should reject malformed or unsupported country values");
assert.match(serverResolver, /selectedCountryCookie = cookies\(\)\.get\(OFFER_COUNTRY_COOKIE\)/, "server resolver should read the selected-country cookie");
assert.match(serverResolver, /profileCountry/, "server resolver should consult a signed-in profile only when no country cookie exists");
assert.match(serverResolver, /requestHeaders: headers\(\)/, "server resolver should read trusted server request headers");

assert.match(offersPage, /await resolveRequestOfferCountry\(\)/, "/offers should resolve country on the server");
assert.match(offersPage, /params\.set\("country", countryCode\)/, "/offers initial query should always include effective country");
assert.match(offersPage, /country: effectiveCountry\.code/, "/offers data load should pass the validated country into fetchPublicOffers");
assert.match(offersPage, /<CountrySelector activeCountryCode=\{effectiveCountry\.code\}/, "/offers should render the country selector");
assert.match(offersPage, /export const metadata: Metadata = \{[\s\S]*Compare High-Paying Offers and Games/, "/offers metadata should stay generic under the /offers canonical");
assert.doesNotMatch(offersPage, /generateMetadata/, "/offers should not emit country-specific metadata under the generic canonical URL");
assert.doesNotMatch(offersPage, /title = `Compare High-Paying Offers in \$\{country\.name\}/, "/offers should not personalize title tags by country");
assert.match(offersPage, /name: "Compare High-Paying Offers and Games"/, "/offers structured data should stay generic");
assert.match(sitemapBuilder, /getSupportedPublicOfferCountries\(\)\.map/, "sitemap should discover explicit country pages from the canonical country registry");
assert.match(sitemapBuilder, /`\/offers\/\$\{country\.slug\}`/, "sitemap should include explicit /offers/{country-slug} URLs");

assert.match(offersApi, /resolvePublicOfferCountry/, "public offers API should use shared country resolution");
assert.match(offersApi, /rawCountryQuery && !explicitCountry/, "malformed or unsupported explicit query country should be rejected");
assert.match(offersApi, /status: 400/, "invalid explicit country query should return a controlled 400");
assert.match(offersApi, /explicitCountry: explicitCountry\?\.code \?\? null/, "validated country query should be treated as explicit");
assert.match(offersApi, /const selectedCountryCookie = req\.cookies\.get\(OFFER_COUNTRY_COOKIE\)/, "API should honor selected-country cookie");
assert.match(offersApi, /profileCountry/, "API should use a signed-in profile only after explicit and cookie choices");
assert.match(offersApi, /requestHeaders: req\.headers/, "API should honor trusted server geo headers");
assert.match(offersApi, /country: countryResolution\.country\.code/, "API should pass only validated country to data loading");
assert.match(offersApi, /"Cache-Control": "private, no-store"/, "API should avoid shared caching when country comes from cookie/header");
assert.match(offersApi, /"Vary": "Cookie, x-vercel-ip-country"/, "API should isolate non-query country responses by cookie/header");
assert.match(offersApi, /"Vary": "Accept-Encoding"/, "explicit query country responses should not vary by cookie/header");
assert.match(offersApi, /country_source: countryResolution\.source/, "API metadata should report resolution source for tests/debugging");

assert.match(search, /normalizeOfferCountryCode\(filters\.country\) \?\? ""/, "public search filters should sanitize country before RPC/query use");
assert.match(search, /p_country: normalized\.country/, "public RPC should receive the sanitized country");
assert.match(search, /query = query\.contains\("countries", \[normalized\.country\]\)/, "compatibility query should filter country at the database layer");

assert.match(searchComponent, /import type \{ PublicOfferCountry \}/, "client country filter should use registry metadata from the server");
assert.match(searchComponent, /countries: PublicOfferCountry\[\]/, "client filter should receive supported countries as data");
assert.doesNotMatch(searchComponent, /\(\["US", "UK", ""\] as const\)/, "client filter should not hard-code a separate country toggle");
assert.match(searchComponent, /aria-label="Filter offers by country"/, "client country filter should be labeled");
assert.match(searchComponent, /setOffers\(\[\]\);\s*setMeta\(null\);/, "client fetch should clear prior results before loading a new country-scoped query");

assert.match(countrySelector, /method="POST"/, "country selector should use a strict POST route");
assert.match(countrySelector, /disabled=\{submitting\}/, "country selector should disable duplicate submissions while navigating");
assert.match(countryRoute, /export async function POST/, "cookie route should expose only POST");
assert.doesNotMatch(countryRoute, /export async function GET/, "cookie route should not set cookies via GET");
assert.match(countryRoute, /isSameOriginRequest\(req\)/, "cookie route should enforce same-origin submissions");
assert.match(countryRoute, /SUPPORTED_CONTENT_TYPES/, "cookie route should strictly handle form content types");
assert.match(countryRoute, /req\.formData\(\)/, "cookie route should read form data rather than trusting URL query state");
assert.match(countryRoute, /getPublicOfferCountryByCode/, "cookie route should validate country against registry");
assert.match(countryRoute, /error: "invalid_country"/, "cookie route should reject unsupported countries");
assert.match(countryRoute, /httpOnly: true/, "country cookie should be httpOnly");
assert.match(countryRoute, /sameSite: "lax"/, "country cookie should use SameSite=Lax");
assert.match(countryRoute, /secure: process\.env\.NODE_ENV === "production"/, "country cookie should be secure in production");
assert.match(countryRoute, /path: "\/"/, "country cookie should be available site-wide");
assert.match(countryRoute, /NextResponse\.redirect\(destination, \{ status: 303 \}\)/, "country selector should navigate to the explicit country page");
assert.doesNotMatch(countryRoute, /searchParams\.get\("(?:redirect|return|next)"/, "cookie route should not accept a client-provided redirect URL");

assert.match(countryPage, /getImportedEarnLabOffers\(countryCode, sort\)/, "EarnLab country pages should read imported rows for the explicit country first");
assert.match(countryPage, /getEarnLabGalleryTasksByCountry\(countryCode/, "live fallback should receive the explicit validated country");
assert.match(countryPage, /<CountrySelector activeCountryCode=\{country\}/, "explicit country pages should expose the country selector");
assert.doesNotMatch(countryPage, /getEarnLabGalleryTasksByCountry\("US"/, "live fallback should not hard-code US");

const parsedCountries = [...countries.matchAll(/^\s*"([A-Z]{2})",$/gm)].map((match) => match[1]);
const countrySet = new Set(parsedCountries);
assert.deepEqual(parsedCountries.slice(0, 4), ["US", "GB", "CA", "AU"], "behavioral fixture should parse canonical registry order");

function normalizeCountry(value) {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  return /^[A-Z]{2}$/.test(normalized) && countrySet.has(normalized) ? normalized : null;
}

function resolve({ explicitCountry, cookieCountry, profileCountry, headerCountry, defaultCountry = "US" }) {
  return normalizeCountry(explicitCountry) ??
    normalizeCountry(cookieCountry) ??
    normalizeCountry(profileCountry) ??
    normalizeCountry(headerCountry) ??
    normalizeCountry(defaultCountry) ??
    "US";
}

assert.equal(resolve({ explicitCountry: "gb", cookieCountry: "US", headerCountry: "CA" }), "GB", "valid explicit query country overrides cookie/header");
assert.equal(resolve({ cookieCountry: "CA", headerCountry: "GB" }), "CA", "valid cookie overrides header");
assert.equal(resolve({ profileCountry: "CA", headerCountry: "GB" }), "CA", "profile applies before geo only when no explicit or cookie country exists");
assert.equal(resolve({ cookieCountry: "US", profileCountry: "CA" }), "US", "cookie remains stronger than profile preference");
assert.equal(resolve({ cookieCountry: "ZZ", headerCountry: "GB" }), "GB", "unsupported cookie is ignored");
assert.equal(resolve({ headerCountry: "ZZ" }), "US", "unsupported geo country falls back to US");
assert.equal(normalizeCountry("USA"), null, "malformed country values are rejected");

console.log("Offer country visibility guard passed");
