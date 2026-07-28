import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const sitemapSource = read("src/lib/sitemap-builder.ts");
const appSitemapSource = read("src/app/sitemap.ts");
const auditSource = read("scripts/audit-sitemap-quality.mjs");
const adminSitemapSource = read("src/app/app/admin/seo/sitemap/page.tsx");
const gainGallerySource = read("src/lib/gain-gallery.ts");
const gemslootProvidersSource = read("src/lib/gemsloot-providers.ts");
const gemslootCountriesSource = read("src/lib/gemsloot-countries.ts");
const gemslootCountryPageSource = read("src/components/offers/GemslootCountryOffersPage.tsx");
const gemslootDynamicPageSource = read("src/app/offers/gemsloot/[country]/[provider]/page.tsx");
const sitemapFiltersSource = read("src/lib/sitemap-filters.ts");
const sitemapShardRouteSource = read("src/app/sitemap/[id]/route.ts");
const robotsSource = read("src/app/robots.ts");
const offersPageSource = read("src/app/offers/page.tsx");
const gainCountryPageSource = read("src/components/offers/GainCountryOffersPage.tsx");

for (const path of ["/games", "/legal/privacy", "/legal/terms", "/legal/disclosure"]) {
  assert(
    sitemapSource.includes(`staticPage(baseUrl, '${path}'`),
    `sitemap static pages should include ${path}`,
  );
}
assert(
  /export\s+default\s+async\s+function\s+sitemap/.test(appSitemapSource),
  "src/app/sitemap.ts should be the active Next.js sitemap entrypoint",
);
assert(
  appSitemapSource.includes("buildSitemapShard") && appSitemapSource.includes("getSitemapShardIds"),
  "src/app/sitemap.ts should build URLs through the shared sitemap builder",
);
for (const path of ["/games", "/offers", "/guides", "/reviews", "/blog", "/best-gpt-sites", "/highest-paying-gpt-games"]) {
  assert(robotsSource.includes(path), `robots rules should explicitly allow ${path}`);
}
assert(robotsSource.includes("sitemap.xml"), "robots rules should point crawlers at /sitemap.xml");

assert(
  gainGallerySource.includes("PUBLIC_GAIN_WALLS"),
  "gain-gallery should export a shared PUBLIC_GAIN_WALLS list",
);

for (const wall of ["native", "revu", "adtowall", "mychips", "cpx", "asmwall", "lootably"]) {
  assert(gainGallerySource.includes(`"${wall}"`), `PUBLIC_GAIN_WALLS should include ${wall}`);
}

assert(
  sitemapSource.includes("PUBLIC_GAIN_WALLS.map"),
  "sitemap should build Gain wall routes from PUBLIC_GAIN_WALLS",
);

assert(
  gemslootProvidersSource.includes("GEMSLOOT_PUBLIC_PROVIDERS"),
  "gemsloot-providers should export a shared GEMSLOOT_PUBLIC_PROVIDERS list",
);
assert(
  gemslootCountriesSource.includes("GEMSLOOT_PUBLIC_COUNTRIES") &&
    gemslootCountriesSource.includes('"GB"'),
  "gemsloot-countries should export shared public Gemsloot country routes including GB",
);
for (const provider of ["gemsloot", "torox", "revu", "bitlabs", "tyrads", "adscendmedia", "hangmyads", "adtowall", "ayetstudios", "lootably", "waxrewards", "pixylabs", "farly"]) {
  assert(
    gemslootProvidersSource.includes(`"${provider}"`),
    `GEMSLOOT_PUBLIC_PROVIDERS should include ${provider}`,
  );
}
assert(
  gemslootCountryPageSource.includes("@/lib/gemsloot-providers"),
  "Gemsloot country page should import providers from the shared Gemsloot provider module",
);
assert(
  gemslootDynamicPageSource.includes("@/lib/gemsloot-providers"),
  "Gemsloot dynamic route should import providers from the shared Gemsloot provider module",
);
assert(
  sitemapSource.includes("GEMSLOOT_PUBLIC_COUNTRIES.flatMap") &&
    sitemapSource.includes("GEMSLOOT_PUBLIC_PROVIDERS.map"),
  "sitemap should build Gemsloot country/provider routes from shared lists",
);

assert(
  offersPageSource.includes("PUBLIC_GAIN_WALLS"),
  "offers page should build Gain links from PUBLIC_GAIN_WALLS",
);
assert(
  gainCountryPageSource.includes("PUBLIC_GAIN_WALLS"),
  "Gain country page should build wall pills from PUBLIC_GAIN_WALLS",
);
assert(
  sitemapSource.includes("fetchSitemapGames"),
  "sitemap should fetch games through a paginated helper",
);
assert(
  sitemapSource.includes("fetchSitemapTaskRows"),
  "sitemap should fetch site offer task rows through a chunked helper",
);
assert(
  sitemapSource.includes("TASK_PAGE_SIZE"),
  "sitemap task helper should use a bounded TASK_PAGE_SIZE",
);
assert(
  sitemapSource.includes(".in('site_offer_id', chunk)"),
  "sitemap task helper should query site_offer_tasks in chunks",
);
assert(
  auditSource.includes("fetchGameRows"),
  "sitemap quality audit should fetch games through a paginated helper",
);
assert(
  adminSitemapSource.includes("fetchGameRows"),
  "admin sitemap preview should fetch games through a paginated helper",
);
assert(
  adminSitemapSource.includes("PUBLIC_GAIN_WALLS.map"),
  "admin sitemap preview should build Gain wall rows from PUBLIC_GAIN_WALLS",
);
assert(
  adminSitemapSource.includes("GEMSLOOT_PUBLIC_COUNTRIES.flatMap") &&
    adminSitemapSource.includes("GEMSLOOT_PUBLIC_PROVIDERS.map"),
  "admin sitemap preview should build Gemsloot country/provider rows from shared lists",
);
for (const filterName of [
  "shouldIncludeGuideInSitemap",
  "shouldIncludeOfferPageInSitemap",
  "shouldIncludeGameInSitemap",
  "shouldIncludeGeneratedHowToEarnInSitemap",
]) {
  assert(sitemapFiltersSource.includes(`function ${filterName}`), `sitemap-filters should define ${filterName}`);
  assert(sitemapSource.includes("@/lib/sitemap-filters"), "sitemap should import filters from sitemap-filters");
  assert(adminSitemapSource.includes(filterName), `admin sitemap preview should apply ${filterName}`);
}
assert(
  sitemapSource.includes("getSitemapShardIds") && sitemapShardRouteSource.includes("generateStaticParams"),
  "custom sitemap shard route should expose generated shard params",
);
for (const shardId of ["guides", "offers-0", "offers-1", "games-0", "games-1", "how-to-earn-0", "how-to-earn-1"]) {
  assert(sitemapSource.includes(`"${shardId}"`), `sitemap shards should include ${shardId}`);
}
assert(appSitemapSource.includes("flat()"), "root sitemap should flatten shard entries into the active sitemap output");
assert(
  sitemapShardRouteSource.includes("buildSitemapShard") && sitemapShardRouteSource.includes("sitemapEntriesToXml"),
  "sitemap shard route should render shard XML from the shared builder",
);
for (const path of ["/games", "/legal/privacy", "/legal/terms", "/legal/disclosure"]) {
  assert(adminSitemapSource.includes(path), `admin sitemap static preview should include ${path}`);
}
assert(
  sitemapSource.includes("throw new Error"),
  "sitemap fetch failures should be loud instead of silently shrinking URL output",
);

console.log("sitemap route coverage checks passed");
