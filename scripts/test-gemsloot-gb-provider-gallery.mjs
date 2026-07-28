import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const registrySource = read("src/lib/provider-gallery/provider-registry.ts");
const refreshSource = read("scripts/refresh-provider-gallery.ts");
const countryConfigPath = "src/lib/gemsloot-countries.ts";
const countryPageSource = read("src/components/offers/GemslootCountryOffersPage.tsx");
const sitemapSource = read("src/lib/sitemap-builder.ts");
const adminSitemapSource = read("src/app/app/admin/seo/sitemap/page.tsx");
const offersPageSource = read("src/app/offers/page.tsx");

assert(
  registrySource.includes('supportedCountries: ["US", "GB"]'),
  "Gemsloot provider-gallery registry should declare US and GB as supported countries",
);
assert(
  refreshSource.includes('args["gemsloot-countries"] ?? args.countries ?? "US,GB"'),
  "bulk provider-gallery refresh should include Gemsloot GB by default",
);
assert(
  existsSync(resolve(process.cwd(), countryConfigPath)),
  "Gemsloot public country config should exist",
);

const countryConfigSource = read(countryConfigPath);

assert(
  countryConfigSource.includes("GEMSLOOT_PUBLIC_COUNTRIES") &&
    countryConfigSource.includes('"US"') &&
    countryConfigSource.includes('"GB"') &&
    countryConfigSource.includes("United Kingdom"),
  "Gemsloot public country config should expose US and GB labels",
);
for (const provider of ["adtowall", "ayetstudios", "lootably", "waxrewards", "pixylabs", "farly"]) {
  assert(
    read("src/lib/gemsloot-providers.ts").includes(`"${provider}"`),
    `Gemsloot public provider routes should include backend provider ${provider}`,
  );
}
assert(
  existsSync(resolve(process.cwd(), "src/app/offers/gemsloot/[country]/page.tsx")),
  "Gemsloot all-offers route should be country-param based",
);
assert(
  existsSync(resolve(process.cwd(), "src/app/offers/gemsloot/[country]/[provider]/page.tsx")),
  "Gemsloot provider route should be country-param based",
);
assert(
  countryPageSource.includes('country: GemslootPublicCountry') &&
    countryPageSource.includes('`/offers/gemsloot/${country.slug}`') &&
    countryPageSource.includes("GEMSLOOT_PUBLIC_PROVIDERS.map"),
  "Gemsloot country page should render links and copy from the requested public country",
);
assert(
  sitemapSource.includes("GEMSLOOT_PUBLIC_COUNTRIES.flatMap") &&
    adminSitemapSource.includes("GEMSLOOT_PUBLIC_COUNTRIES.flatMap"),
  "public and admin sitemap surfaces should build Gemsloot URLs for every public country",
);
assert(
  offersPageSource.includes("/offers/gemsloot/gb") &&
    offersPageSource.includes("UK Gemsloot"),
  "offers hub should expose UK Gemsloot discovery links",
);

console.log("Gemsloot GB provider-gallery route checks passed");
