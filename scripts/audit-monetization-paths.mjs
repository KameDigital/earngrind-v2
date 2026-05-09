import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const root = process.cwd();

loadEnvFile(".env.local");
loadEnvFile(".env.production");

const sourceRoots = ["src/app", "src/components", "src/lib"]
  .map((path) => resolve(root, path))
  .filter((path) => existsSync(path));
const files = sourceRoots.flatMap((path) => walk(path)).filter(isSourceFile);

const platformSource = readText("src/lib/gpt-affiliate-platforms.ts");
const bestGptSitesSource = readText("src/app/(seo)/best-gpt-sites/page.tsx");
const bestOffersTemplateSource = readText("src/app/(seo)/components/BestOffersPageTemplate.tsx");
const gamePageSource = readText("src/app/(seo)/games/[slug]/page.tsx");
const offerDetailSource = readText("src/app/offers/[slug]/page.tsx");
const trackedPlatformCount = countPlatformEntries(platformSource);
const buildTrackedPlatformHrefUsers = grepFiles(/buildTrackedPlatformHref/);
const goLinkUsage = grepFiles(/\/go\/(?:platform\/)?|\bredirect_url\b|\bredirectUrl\b|TrackedOutboundLink|buildGoHref/);
const ctaUsage = grepFiles(/TrackedOutboundLink|GuideOfferCtaBlock|data-guide-cta|Start Best|Start Offer|Start Highest|Compare live offers|Start Best Payout|Compare Offers|Browse Offers/i);
const possibleUntrackedMoneyLinks = grepFiles(/href=\{?[^}\n]*(startUrl|offer_url|affiliate_template|platformVisitHref)|href="https?:\/\//i)
  .filter((entry) => !/TrackedOutboundLink|\/go\//.test(entry.line));

const guideCtaSource = readText("src/app/guides/[slug]/GuideOfferCtaBlock.tsx");
const warnings = [];
const phase7cChecks = [
  {
    label: "/best-gpt-sites hero platform CTA exists",
    pass: bestGptSitesSource.includes("best_gpt_sites_hero_primary"),
  },
  {
    label: "tracked platform links keep prefetch={false}",
    pass: (bestGptSitesSource.match(/href=\{buildTrackedPlatformHref/g) ?? []).length > 0 &&
      (bestGptSitesSource.match(/prefetch=\{false\}/g) ?? []).length >= (bestGptSitesSource.match(/href=\{buildTrackedPlatformHref/g) ?? []).length,
  },
  {
    label: "shared SEO pages have bottom recap CTA",
    pass: bestOffersTemplateSource.includes("seo_bottom_recap") &&
      bestOffersTemplateSource.includes("Start the current best offer"),
  },
  {
    label: "/games/[slug] has bottom recap CTA",
    pass: gamePageSource.includes("game_bottom_recap"),
  },
  {
    label: "/offers/[slug] has bottom recap CTA",
    pass: offerDetailSource.includes("offer_detail_bottom_recap"),
  },
  {
    label: "related SEO links include /best-freecash-games",
    pass: bestGptSitesSource.includes("/best-freecash-games") &&
      bestOffersTemplateSource.includes("/best-freecash-games"),
  },
  {
    label: "related SEO links include /best-gain-gg-offers",
    pass: bestGptSitesSource.includes("/best-gain-gg-offers") &&
      bestOffersTemplateSource.includes("/best-gain-gg-offers"),
  },
];

for (const check of phase7cChecks) {
  if (!check.pass) warnings.push(`Phase 7C check failed: ${check.label}`);
}

if (guideCtaSource.includes("best.targetUrl") === false && guideCtaSource.includes("const best = offers[0]")) {
  warnings.push("GuideOfferCtaBlock has matched offer targetUrl data available upstream, but primary CTAs route to /games or /offers instead of direct /go.");
}

if (possibleUntrackedMoneyLinks.length > 0) {
  warnings.push("Possible untracked money links found. Review each href that references startUrl, offer_url, affiliate templates, platformVisitHref, or direct external URLs without /go.");
}

const dbSummary = await loadDatabaseSummary().catch((error) => ({
  error: error.message,
}));

console.log("Monetization Path Audit");
console.log(`Tracked static affiliate platforms: ${trackedPlatformCount}`);
console.log(`Files using buildTrackedPlatformHref: ${buildTrackedPlatformHrefUsers.length}`);
printFileLineSummary("buildTrackedPlatformHref usage", buildTrackedPlatformHrefUsers);

console.log("");
console.log("Phase 7C CTA checks:");
phase7cChecks.forEach((check) => {
  console.log(`  ${check.pass ? "OK" : "WARN"} ${check.label}`);
});

console.log("");
console.log(`/go link usage by file: ${goLinkUsage.length}`);
printGroupedCounts(goLinkUsage);

console.log("");
console.log(`Pages/components with obvious CTA usage: ${ctaUsage.length}`);
printGroupedCounts(ctaUsage);

console.log("");
if ("error" in dbSummary) {
  console.log(`Database read summary: skipped (${dbSummary.error})`);
} else {
  console.log("Database read summary:");
  console.log(`  published guides: ${dbSummary.publishedGuideCount}`);
  console.log(`  published guides with related game: ${dbSummary.publishedGuidesWithGame}`);
  console.log(`  active platforms: ${dbSummary.activePlatformCount}`);
  console.log(`  active unified offers sampled: ${dbSummary.activeUnifiedOfferCount}`);
  console.log(`  recent offer clicks sampled: ${dbSummary.recentOfferClicks}`);
  console.log(`  recent site offer clicks sampled: ${dbSummary.recentSiteOfferClicks}`);
  console.log(`  recent platform clicks sampled: ${dbSummary.recentPlatformClicks}`);
}

console.log("");
console.log(`Possible untracked money links: ${possibleUntrackedMoneyLinks.length}`);
printFileLineSummary("possible untracked money links", possibleUntrackedMoneyLinks.slice(0, 40));

console.log("");
console.log("Warnings:");
if (warnings.length === 0) {
  console.log("  none");
} else {
  warnings.forEach((warning) => console.log(`  - ${warning}`));
}

function readText(path) {
  const fullPath = resolve(root, path);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const fullPath = join(dir, name);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      if ([".next", "node_modules", ".git"].includes(name)) return [];
      return walk(fullPath);
    }
    return [fullPath];
  });
}

function isSourceFile(path) {
  return [".ts", ".tsx", ".js", ".jsx", ".mjs"].includes(extname(path));
}

function grepFiles(pattern) {
  const matches = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    text.split(/\r?\n/).forEach((line, index) => {
      if (pattern.test(line)) {
        matches.push({
          file: relative(root, file).replaceAll("\\", "/"),
          lineNumber: index + 1,
          line: line.trim(),
        });
      }
    });
    pattern.lastIndex = 0;
  }
  return matches;
}

function countPlatformEntries(source) {
  const arrayBody = source.match(/GPT_AFFILIATE_PLATFORMS[\s\S]*?=\s*\[([\s\S]*?)\];/)?.[1] ?? "";
  return (arrayBody.match(/\bid:\s*"/g) ?? []).length;
}

function printGroupedCounts(entries) {
  const counts = new Map();
  entries.forEach((entry) => counts.set(entry.file, (counts.get(entry.file) ?? 0) + 1));
  Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 40)
    .forEach(([file, count]) => console.log(`  ${file}: ${count}`));
}

function printFileLineSummary(title, entries) {
  if (entries.length === 0) {
    console.log(`  ${title}: none`);
    return;
  }
  entries.slice(0, 30).forEach((entry) => {
    console.log(`  ${entry.file}:${entry.lineNumber} ${entry.line.slice(0, 160)}`);
  });
}

async function loadDatabaseSummary() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [
    guides,
    guidesWithGame,
    platforms,
    unifiedOffers,
    offerClicks,
    siteOfferClicks,
    platformClicks,
  ] = await Promise.all([
    countRows(db.from("guides").select("id", { count: "exact", head: true }).eq("status", "published")),
    countRows(db.from("guides").select("id", { count: "exact", head: true }).eq("status", "published").not("game_id", "is", null)),
    countRows(db.from("platforms").select("id", { count: "exact", head: true }).eq("is_active", true)),
    countRows(db.from("unified_offers_view").select("id", { count: "exact", head: true }).limit(1)),
    countRows(db.from("offer_clicks").select("id", { count: "exact", head: true }).limit(1)),
    countRows(db.from("site_offer_clicks").select("id", { count: "exact", head: true }).limit(1)),
    countRows(db.from("platform_clicks").select("id", { count: "exact", head: true }).limit(1)),
  ]);

  return {
    publishedGuideCount: guides,
    publishedGuidesWithGame: guidesWithGame,
    activePlatformCount: platforms,
    activeUnifiedOfferCount: unifiedOffers,
    recentOfferClicks: offerClicks,
    recentSiteOfferClicks: siteOfferClicks,
    recentPlatformClicks: platformClicks,
  };
}

async function countRows(query) {
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function loadEnvFile(fileName) {
  const filePath = resolve(root, fileName);
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}
