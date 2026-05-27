import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const sitemapSource = read("src/app/sitemap.ts");
const auditSource = read("scripts/audit-sitemap-quality.mjs");
const adminSitemapSource = read("src/app/app/admin/seo/sitemap/page.tsx");
const gainGallerySource = read("src/lib/gain-gallery.ts");
const offersPageSource = read("src/app/offers/page.tsx");
const gainCountryPageSource = read("src/components/offers/GainCountryOffersPage.tsx");

for (const path of ["/games", "/legal/privacy", "/legal/terms", "/legal/disclosure"]) {
  assert(
    sitemapSource.includes(`staticPage(baseUrl, '${path}'`),
    `sitemap static pages should include ${path}`,
  );
}

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
for (const path of ["/games", "/legal/privacy", "/legal/terms", "/legal/disclosure"]) {
  assert(adminSitemapSource.includes(path), `admin sitemap static preview should include ${path}`);
}
assert(
  sitemapSource.includes("throw new Error"),
  "sitemap fetch failures should be loud instead of silently shrinking URL output",
);

console.log("sitemap route coverage checks passed");
