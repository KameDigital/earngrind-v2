import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const siteUrl = (process.env.SEO_AUDIT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://earngrind.com").replace(/\/$/, "");
const reportPath = path.join(root, "reports", "seo-public-route-coverage.md");
const staticGuideHrefs = [...read("src/lib/static-guides.ts").matchAll(/href:\s*"([^"]+)"/g)].map((match) => match[1]);
const staticGuideRoutes = staticGuideHrefs.map((href) =>
  route(`Static guide ${href}`, href, `src/app${href}/page.tsx`, new RegExp(`^${escapeRegExp(href)}$`), [href]),
);

const routeFamilies = [
  route("Home", "/", "src/app/page.tsx", /^\/$/),
  route("Offers hub", "/offers", "src/app/offers/page.tsx", /^\/offers$/),
  route("Game index", "/games", "src/app/(seo)/games/page.tsx", /^\/games$/),
  route("Game hub pages", "/games/[slug]", "src/app/(seo)/games/[slug]/page.tsx", /^\/games\/[^/]+$/),
  route("Offer comparison pages", "/offers/[slug]", "src/app/offers/[slug]/page.tsx", /^\/offers\/[^/]+$/),
  route("Guides hub", "/guides", "src/app/guides/page.tsx", /^\/guides$/),
  route("Database guides", "/guides/[slug]", "src/app/guides/[slug]/page.tsx", /^\/guides\/[^/]+$/),
  ...staticGuideRoutes,
  route("How-to-earn hub", "/guides/how-to-earn", "src/app/(seo)/guides/how-to-earn/page.tsx", /^\/guides\/how-to-earn$/),
  route("Generated how-to-earn guides", "/guides/how-to-earn/[slug]", "src/app/(seo)/guides/how-to-earn/[slug]/page.tsx", /^\/guides\/how-to-earn\/[^/]+$/),
  route("Best GPT sites", "/best-gpt-sites", "src/app/(seo)/best-gpt-sites/page.tsx", /^\/best-gpt-sites$/),
  route("GPT site guide hub", "/guides/best-gpt-sites", "src/app/guides/best-gpt-sites/page.tsx", /^\/guides\/best-gpt-sites$/),
  route("GPT site guide pages", "/guides/best-gpt-sites/[slug]", "src/app/guides/best-gpt-sites/[slug]/page.tsx", /^\/guides\/best-gpt-sites\/[^/]+$/),
  route("Highest-paying GPT games", "/highest-paying-gpt-games", "src/app/(seo)/highest-paying-gpt-games/page.tsx", /^\/highest-paying-gpt-games$/),
  route("Best money-making games", "/best-money-making-games", "src/app/(seo)/best-money-making-games/page.tsx", /^\/best-money-making-games$/),
  route("Best Freecash games", "/best-freecash-games", "src/app/(seo)/best-freecash-games/page.tsx", /^\/best-freecash-games$/),
  route("Best Gain.gg offers", "/best-gain-gg-offers", "src/app/(seo)/best-gain-gg-offers/page.tsx", /^\/best-gain-gg-offers$/),
  route("Best paying mobile games on GPT sites", "/best-paying-mobile-games-gpt", "src/app/(seo)/best-paying-mobile-games-gpt/page.tsx", /^\/best-paying-mobile-games-gpt$/),
  route("Is Freecash legit", "/is-freecash-legit", "src/app/(seo)/is-freecash-legit/page.tsx", /^\/is-freecash-legit$/),
  route("Is Swagbucks legit", "/is-swagbucks-legit", "src/app/(seo)/is-swagbucks-legit/page.tsx", /^\/is-swagbucks-legit$/),
  route("Freecash payout timing", "/how-long-does-freecash-take-to-pay", "src/app/(seo)/how-long-does-freecash-take-to-pay/page.tsx", /^\/how-long-does-freecash-take-to-pay$/),
  route("Gain.gg US offers", "/offers/gain/us", "src/app/offers/gain/us/page.tsx", /^\/offers\/gain\/us$/),
  route("Gain.gg wall pages", "/offers/gain/us/[wall]", "src/app/offers/gain/us/[wall]/page.tsx", /^\/offers\/gain\/us\/[^/]+$/),
  route("Gemsloot US offers", "/offers/gemsloot/us", "src/app/offers/gemsloot/us/page.tsx", /^\/offers\/gemsloot\/us$/),
  route("Gemsloot provider pages", "/offers/gemsloot/us/[provider]", "src/app/offers/gemsloot/us/[provider]/page.tsx", /^\/offers\/gemsloot\/us\/[^/]+$/),
  route("Blog index", "/blog", "src/app/blog/page.tsx", /^\/blog$/),
  route("Blog posts", "/blog/[slug]", "src/app/blog/[slug]/page.tsx", /^\/blog\/[^/]+$/),
  route("Platform reviews", "/review/[slug]", "src/app/review/[slug]/page.tsx", /^\/review\/[^/]+$/),
  route("About", "/about", "src/app/about/page.tsx", /^\/about$/),
  route("How it works", "/how-it-works", "src/app/how-it-works/page.tsx", /^\/how-it-works$/),
  route("Privacy policy", "/legal/privacy", "src/app/legal/privacy/page.tsx", /^\/legal\/privacy$/),
  route("Terms", "/legal/terms", "src/app/legal/terms/page.tsx", /^\/legal\/terms$/),
  route("Affiliate disclosure", "/legal/disclosure", "src/app/legal/disclosure/page.tsx", /^\/legal\/disclosure$/),
];

const sitemapBuilder = read("src/lib/sitemap-builder.ts");
const sitemapUrls = await fetchSitemapUrls().catch((error) => {
  console.warn(`[seo-coverage] live sitemap fetch skipped: ${error.message}`);
  return [];
});
const sitemapPaths = sitemapUrls.map((url) => new URL(url).pathname.replace(/\/$/, "") || "/");

const rows = routeFamilies.map((item) => {
  const source = read(item.sourceFile);
  const liveMatches = item.exactPaths.length > 0
    ? item.exactPaths.filter((pathname) => sitemapPaths.includes(pathname))
    : sitemapPaths.filter((pathname) => item.sitemapPattern.test(pathname));
  return {
    ...item,
    metadata: hasMetadata(source),
    canonical: hasCanonical(source),
    schema: hasSchema(source),
    breadcrumbSchema: hasBreadcrumbSchema(source),
    visibleBreadcrumb: hasVisibleBreadcrumb(source, item),
    sitemapSource: hasSitemapSource(item),
    liveSitemapCount: liveMatches.length,
    examples: liveMatches.slice(0, 3),
  };
});

const missing = rows.filter((row) =>
  !row.metadata ||
  !row.canonical ||
  !row.schema ||
  !row.breadcrumbSchema ||
  !row.visibleBreadcrumb ||
  !row.sitemapSource ||
  (sitemapUrls.length > 0 && row.liveSitemapCount === 0)
);

const report = [
  "# Public Indexable Route SEO Coverage",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Site: ${siteUrl}`,
  `Live sitemap URLs expanded: ${sitemapUrls.length}`,
  "",
  "## Summary",
  "",
  `- Route families audited: ${rows.length}`,
  `- Route families passing all checks: ${rows.length - missing.length}`,
  `- Route families with gaps: ${missing.length}`,
  "",
  "## Route Coverage",
  "",
  "| Route | Source | Metadata | Canonical | Schema | Breadcrumb Schema | Visible Breadcrumb | Sitemap Source | Live Sitemap Count | Examples |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- |",
  ...rows.map((row) => [
    row.template,
    row.sourceFile,
    mark(row.metadata),
    mark(row.canonical),
    mark(row.schema),
    mark(row.breadcrumbSchema),
    mark(row.visibleBreadcrumb),
    mark(row.sitemapSource),
    String(row.liveSitemapCount),
    row.examples.join("<br>") || "none",
  ].join(" | ").replace(/^/, "| ").replace(/$/, " |")),
  "",
  "## Gaps",
  "",
  ...(missing.length === 0
    ? ["No gaps found by this audit."]
    : missing.map((row) => `- ${row.template}: ${gapList(row).join(", ")}`)),
  "",
].join("\n");

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, report);
console.log(report);
console.log(`Report written to ${path.relative(root, reportPath)}`);

function route(name, template, sourceFile, sitemapPattern, exactPaths = []) {
  return { name, template, sourceFile, sitemapPattern, exactPaths };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function hasMetadata(source) {
  return /export\s+(?:(?:async\s+)?function\s+generateMetadata|const\s+metadata)|buildSeoMetadata|getBestPageMetadata/.test(source);
}

function hasCanonical(source) {
  return /canonicalAlternates|canonical\s*:|canonicalPath|absoluteUrl\(|metadataSlug|PAGE_URL|buildSeoMetadata|getBestPageMetadata/.test(source);
}

function hasSchema(source) {
  return /<JsonLd|function\s+JsonLd|BlogJsonLd|GuideJsonLd|StaticGuideShell|BestOffersPageTemplate|GainCountryOffersPage|GemslootCountryOffersPage|PlatformReviewPage/.test(source);
}

function hasBreadcrumbSchema(source) {
  return /buildBreadcrumbList|BreadcrumbList|BlogJsonLd|GuideJsonLd|StaticGuideShell|BestOffersPageTemplate|GainCountryOffersPage|GemslootCountryOffersPage|PlatformReviewPage/.test(source);
}

function hasVisibleBreadcrumb(source, item) {
  if (item.template === "/") return true;
  if (/aria-label=["']Breadcrumb["']/.test(source)) return true;
  if (/<nav\b[\s\S]{0,400}Home[\s\S]{0,400}(?:\/|›|&gt;)/.test(source)) return true;
  if (/GameHeader|GuideHeader|StaticGuideShell|BestOffersPageTemplate|GainCountryOffersPage|GemslootCountryOffersPage|PlatformReviewPage/.test(source)) return true;
  if (item.template.startsWith("/legal/")) return true;
  return false;
}

function hasSitemapSource(item) {
  if (item.exactPaths.length > 0 && item.exactPaths.every((href) => staticGuideHrefs.includes(href))) return /STATIC_GUIDES\.map/.test(sitemapBuilder);
  if (item.template === "/offers/gain/us/[wall]") return /PUBLIC_GAIN_WALLS\.map/.test(sitemapBuilder);
  if (item.template === "/offers/gemsloot/us/[provider]") return /GEMSLOOT_PUBLIC_PROVIDERS\.map/.test(sitemapBuilder);
  if (item.template === "/guides/[slug]") return /\/guides\/\$\{guide\.slug\}/.test(sitemapBuilder);
  if (item.template === "/blog/[slug]") return /\/blog\/\$\{p\.slug\}/.test(sitemapBuilder);
  if (item.template === "/review/[slug]") return /\/review\/\$\{r\.slug\}/.test(sitemapBuilder);
  if (item.template === "/offers/[slug]") return /\/offers\/\$\{g\.slug\}/.test(sitemapBuilder);
  if (item.template === "/games/[slug]") return /\/games\/\$\{g\.slug\}/.test(sitemapBuilder);
  if (item.template === "/guides/how-to-earn/[slug]") return /\/guides\/how-to-earn\/\$\{g\.slug\}/.test(sitemapBuilder);
  if (item.template === "/guides/best-gpt-sites") return /\/guides\/best-gpt-sites/.test(sitemapBuilder);
  if (item.template === "/guides/best-gpt-sites/[slug]") return /\/guides\/best-gpt-sites\/\$\{guide\.slug\}/.test(sitemapBuilder);
  return sitemapBuilder.includes(`staticPage(baseUrl, '${item.template}'`);
}

function mark(value) {
  return value ? "yes" : "no";
}

function gapList(row) {
  const gaps = [];
  if (!row.metadata) gaps.push("metadata");
  if (!row.canonical) gaps.push("canonical");
  if (!row.schema) gaps.push("schema");
  if (!row.breadcrumbSchema) gaps.push("breadcrumb schema");
  if (!row.visibleBreadcrumb) gaps.push("visible breadcrumb");
  if (!row.sitemapSource) gaps.push("sitemap source");
  if (sitemapUrls.length > 0 && row.liveSitemapCount === 0) gaps.push("live sitemap");
  return gaps;
}

async function fetchSitemapUrls() {
  const visited = new Set();
  const urls = [];
  await visit(`${siteUrl}/sitemap.xml`);
  return urls;

  async function visit(url) {
    if (visited.has(url)) return;
    visited.add(url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    const xml = await response.text();
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]).filter(Boolean);
    if (/<sitemapindex\b/i.test(xml)) {
      await Promise.all(locs.map((loc) => visit(loc)));
      return;
    }
    urls.push(...locs);
  }
}
