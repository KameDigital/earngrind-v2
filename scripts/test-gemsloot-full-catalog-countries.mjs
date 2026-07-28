import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const gallerySource = read("src/lib/gemsloot-gallery.ts");
const refreshSource = read("scripts/refresh-provider-gallery.ts");
const adminRouteSource = read("src/app/api/admin/gemsloot/gallery-import/route.ts");
const upsertSource = read("src/lib/provider-gallery/upsert.ts");
const countriesSource = read("src/lib/gemsloot-countries.ts");
const registrySource = read("src/lib/provider-gallery/provider-registry.ts");

assert(
  gallerySource.includes("allCountries?: boolean") &&
    gallerySource.includes("countries: string[];") &&
    gallerySource.includes("offer.countries.includes(countryCode ?? \"\")") &&
    gallerySource.includes("normalizeCatalogLimit"),
  "Gemsloot gallery should support full-catalog all-country mode and preserve backend country arrays",
);

assert(
  refreshSource.includes("gemslootAllCountries") &&
    refreshSource.includes("countries: offer.countries") &&
    refreshSource.includes('country ?? "all-countries"'),
  "refresh-provider-gallery should support Gemsloot full-catalog imports with preserved countries",
);

assert(
  adminRouteSource.includes("allCountries") &&
    adminRouteSource.includes("countries: offer.countries"),
  "admin Gemsloot gallery import route should support full-catalog imports and preserved countries",
);

assert(
  !upsertSource.includes("buildGemslootEquivalentExternalIdLike"),
  "provider-gallery upsert should not use SQL LIKE source-id matching for Gemsloot because source ids contain wildcard underscores",
);

assert(
  registrySource.includes("gemsloot-${slugifyGalleryValue(offer.providerDisplayName)}-${offer.sourceOfferId}`") &&
    !registrySource.includes("gemsloot-${slugifyGalleryValue(offer.providerDisplayName)}-${offer.sourceOfferId}-${offer.countryCode}"),
  "Gemsloot external ids should be canonical per backend offer id, not per country",
);

assert(
  countriesSource.includes("GEMSLOOT_PUBLIC_COUNTRIES") &&
    countriesSource.includes('code: "US"') &&
    countriesSource.includes('code: "GB"') &&
    countriesSource.includes("getGemslootPublicCountry"),
  "Gemsloot country routes should validate the supported US and GB public country registry",
);

console.log("Gemsloot full-catalog country guard passed");
