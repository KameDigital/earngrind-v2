import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnvFile(".env.local");
loadEnvFile(".env.production");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const OFFER_PAGE_SIZE = 1000;
const MAX_AUDIT_OFFERS = 20000;

const [guidesResult, gamesResult] = await Promise.all([
  supabase
    .from("guides")
    .select("id, status, slug, updated_at, body_md, seo_title, seo_description, keyword_target, keyword_cluster_id, keyword_intent, needs_variation, game_id")
    .eq("status", "published")
    .order("updated_at", { ascending: false }),
  supabase
    .from("games")
    .select("id, slug, updated_at, description")
    .order("updated_at", { ascending: false })
    .limit(500),
]);

for (const [name, result] of [
  ["guides", guidesResult],
  ["games", gamesResult],
]) {
  if (result.error) {
    console.error(`Failed to fetch ${name}: ${result.error.message}`);
    process.exit(1);
  }
}

const guides = guidesResult.data ?? [];
const games = gamesResult.data ?? [];
const offers = await fetchOfferRows();
const offerStats = getEligibleOfferStats(offers);
const publishedGuideGameIds = new Set(guides.map((guide) => guide.game_id).filter(Boolean));
const duplicateKeywordGuideIds = getDuplicateKeywordGuideIds(guides);
const taskRows = await fetchTaskRows(offerStats.eligibleManualOfferIds);
const manualOfferIdsWithTasks = new Set(taskRows.map((task) => task.site_offer_id).filter(Boolean));
const gameIdsWithTaskData = new Set(
  offers
    .filter((offer) => offer.source === "manual" && offer.id && manualOfferIdsWithTasks.has(offer.id))
    .map((offer) => offer.game_id)
    .filter(Boolean),
);

const guideAudit = auditGuides(guides, duplicateKeywordGuideIds);
const offerPageAudit = auditGameBackedUrls({
  games,
  routePrefix: "/offers",
  decide: (game) => shouldIncludeOfferPageInSitemap(game, offerStats.byGameId.get(game.id) ?? 0),
});
const gamePageAudit = auditGameBackedUrls({
  games,
  routePrefix: "/games",
  decide: (game) => shouldIncludeGameInSitemap(game, {
    eligibleOfferCount: offerStats.byGameId.get(game.id) ?? 0,
    hasPublishedGuide: publishedGuideGameIds.has(game.id),
  }),
});
const generatedGuideAudit = auditGameBackedUrls({
  games,
  routePrefix: "/guides/how-to-earn",
  decide: (game) => shouldIncludeGeneratedHowToEarnInSitemap(game, {
    eligibleOfferCount: offerStats.byGameId.get(game.id) ?? 0,
    hasCuratedGuide: publishedGuideGameIds.has(game.id),
    hasTaskData: gameIdsWithTaskData.has(game.id),
  }),
});

const taskDataOnlyExclusions = generatedGuideAudit.excluded.filter(
  (item) => item.reasons.length === 1 && item.reasons[0] === "No eligible offer task data.",
);

printSection("Sitemap Quality Audit");
console.log(`Published guides checked: ${guides.length}`);
console.log(`Games checked: ${games.length}`);
console.log(`Offer rows checked: ${offers.length}`);
console.log(`Eligible manual offers checked for task data: ${offerStats.eligibleManualOfferIds.length}`);
console.log("");

printSection("Guides");
printAudit("Guides", guideAudit);
printReasons(guideAudit.reasonCounts);
printExamples(guideAudit.excluded);

printSection("/offers/[slug]");
printAudit("/offers/[slug]", offerPageAudit);
printExamples(offerPageAudit.excluded);

printSection("/games/[slug]");
printAudit("/games/[slug]", gamePageAudit);
printExamples(gamePageAudit.excluded);

printSection("/guides/how-to-earn/[slug]");
printAudit("/guides/how-to-earn/[slug]", generatedGuideAudit);
printReasons(generatedGuideAudit.reasonCounts);
printExamples(generatedGuideAudit.excluded);
console.log(`Excluded only because task data is missing: ${taskDataOnlyExclusions.length}`);
printExamples(taskDataOnlyExclusions);

function auditGuides(rows, duplicateKeywordIds) {
  const included = [];
  const excluded = [];
  const reasonCounts = new Map();

  for (const guide of rows) {
    const decision = shouldIncludeGuideInSitemap(guide, duplicateKeywordIds);
    const url = guide.slug ? `/guides/${guide.slug}` : "/guides/[missing-slug]";
    if (decision.include) {
      included.push({ url, reasons: [] });
    } else {
      excluded.push({ url, reasons: decision.reasons });
      countReasons(reasonCounts, decision.reasons);
    }
  }

  return { total: rows.length, included, excluded, reasonCounts };
}

function auditGameBackedUrls({ games: rows, routePrefix, decide }) {
  const included = [];
  const excluded = [];
  const reasonCounts = new Map();

  for (const game of rows) {
    const decision = decide(game);
    const url = game.slug ? `${routePrefix}/${game.slug}` : `${routePrefix}/[missing-slug]`;
    if (decision.include) {
      included.push({ url, reasons: [] });
    } else {
      excluded.push({ url, reasons: decision.reasons });
      countReasons(reasonCounts, decision.reasons);
    }
  }

  return { total: rows.length, included, excluded, reasonCounts };
}

function printAudit(label, audit) {
  console.log(`${label} checked: ${audit.total}`);
  console.log(`${label} included: ${audit.included.length}`);
  console.log(`${label} excluded: ${audit.excluded.length}`);
}

function printReasons(reasonCounts) {
  console.log("Exclusion reasons:");
  const entries = Array.from(reasonCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (entries.length === 0) {
    console.log("  none");
    return;
  }
  for (const [reason, count] of entries) {
    console.log(`  ${count} - ${reason}`);
  }
}

function printExamples(items) {
  console.log("Excluded examples:");
  if (items.length === 0) {
    console.log("  none");
    return;
  }
  for (const item of items.slice(0, 10)) {
    console.log(`  ${item.url} :: ${item.reasons.join(" | ")}`);
  }
}

function printSection(title) {
  console.log(`\n== ${title} ==`);
}

function countReasons(reasonCounts, reasons) {
  for (const reason of reasons) {
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
  }
}

async function fetchTaskRows(offerIds) {
  if (offerIds.length === 0) return [];
  const rows = [];
  for (let i = 0; i < offerIds.length; i += 200) {
    const chunk = offerIds.slice(i, i + 200);
    const { data, error } = await supabase
      .from("site_offer_tasks")
      .select("site_offer_id")
      .in("site_offer_id", chunk);
    if (error) {
      console.error(`Failed to fetch site_offer_tasks: ${error.message}`);
      process.exit(1);
    }
    rows.push(...(data ?? []));
  }
  return rows;
}

async function fetchOfferRows() {
  const rows = [];
  for (let from = 0; from < MAX_AUDIT_OFFERS; from += OFFER_PAGE_SIZE) {
    const to = Math.min(from + OFFER_PAGE_SIZE - 1, MAX_AUDIT_OFFERS - 1);
    const { data, error } = await supabase
      .from("unified_offers_view")
      .select("id, source, game_id, game_slug, payout_usd, total_payout_usd, updated_at")
      .order("updated_at", { ascending: false })
      .range(from, to);
    if (error) {
      console.error(`Failed to fetch offers: ${error.message}`);
      process.exit(1);
    }
    rows.push(...(data ?? []));
    if (!data || data.length < OFFER_PAGE_SIZE) break;
  }
  return rows;
}

function shouldIncludeGuideInSitemap(guide, duplicateKeywordGuideIds = new Set()) {
  const quality = analyzeGuideQuality({
    bodyHtml: guide.body_md,
    seoTitle: guide.seo_title,
    seoDescription: guide.seo_description,
    keywordTarget: guide.keyword_target,
  });

  const reasons = [];
  if (guide.status !== "published") reasons.push("Guide is not published.");
  if (!guide.slug?.trim()) reasons.push("Guide slug is missing.");
  if (!guide.updated_at) reasons.push("Guide updated_at is missing.");
  if (!guide.seo_title?.trim()) reasons.push("SEO title is missing.");
  if (!guide.seo_description?.trim()) reasons.push("SEO description is missing.");
  if (!guide.body_md?.trim()) reasons.push("Body content is missing.");
  if (quality.wordCount < 600) reasons.push("Body has fewer than 600 words.");
  if (quality.internalLinkCount < 2) reasons.push("At least 2 internal links are required.");
  if (guide.needs_variation) reasons.push("Guide is marked needs_variation.");
  if (guide.id && duplicateKeywordGuideIds.has(guide.id)) reasons.push("Duplicate exact keyword target.");

  return { include: reasons.length === 0, reasons };
}

function shouldIncludeGameInSitemap(game, signals = {}) {
  const reasons = [];
  if (!game.slug?.trim()) reasons.push("Game slug is missing.");
  if (!game.updated_at) reasons.push("Game updated_at is missing.");

  const hasEligibleOffer = (signals.eligibleOfferCount ?? 0) > 0;
  const hasPublishedGuide = Boolean(signals.hasPublishedGuide);
  const hasMeaningfulContent = Boolean(signals.hasMeaningfulContent ?? hasMeaningfulGameContent(game));
  if (!hasEligibleOffer && !hasPublishedGuide && !hasMeaningfulContent) {
    reasons.push("Game has no eligible offers, published guide, or meaningful page content.");
  }

  return { include: reasons.length === 0, reasons };
}

function shouldIncludeOfferPageInSitemap(game, eligibleOfferCount = 0) {
  const reasons = [];
  if (!game.slug?.trim()) reasons.push("Game slug is missing.");
  if (!game.updated_at) reasons.push("Game updated_at is missing.");
  if (eligibleOfferCount <= 0) reasons.push("No active public eligible offers.");
  return { include: reasons.length === 0, reasons };
}

function shouldIncludeGeneratedHowToEarnInSitemap(game, signals = {}) {
  const reasons = [];
  if (!game.slug?.trim()) reasons.push("Game slug is missing.");
  if (!game.updated_at) reasons.push("Game updated_at is missing.");
  if ((signals.eligibleOfferCount ?? 0) <= 0) reasons.push("No active public eligible offers.");
  if (signals.hasCuratedGuide) reasons.push("Curated guide exists for this game.");
  if (!signals.hasTaskData) reasons.push("No eligible offer task data.");
  return { include: reasons.length === 0, reasons };
}

function getEligibleOfferStats(rows) {
  const byGameId = new Map();
  const byGameSlug = new Map();
  const eligibleManualOfferIds = [];

  for (const row of rows) {
    const payoutUsd = toNumber(row.payout_usd);
    const totalPayoutUsd = normalizeTotalPayout(payoutUsd, toNumber(row.total_payout_usd, payoutUsd));
    if (!isPublicPayoutEligible(payoutUsd, totalPayoutUsd)) continue;

    const gameId = row.game_id?.trim();
    const gameSlug = row.game_slug?.trim();
    if (gameId) byGameId.set(gameId, (byGameId.get(gameId) ?? 0) + 1);
    if (gameSlug) byGameSlug.set(gameSlug, (byGameSlug.get(gameSlug) ?? 0) + 1);
    if (row.source === "manual" && row.id) eligibleManualOfferIds.push(row.id);
  }

  return { byGameId, byGameSlug, eligibleManualOfferIds };
}

function getDuplicateKeywordGuideIds(guides) {
  const byKeyword = new Map();

  for (const guide of guides) {
    const id = guide.id?.trim();
    const keyword = normalizeKeyword(guide.keyword_target);
    if (!id || !keyword) continue;
    byKeyword.set(keyword, [...(byKeyword.get(keyword) ?? []), id]);
  }

  const duplicateIds = new Set();
  for (const ids of Array.from(byKeyword.values())) {
    if (ids.length <= 1) continue;
    ids.forEach((id) => duplicateIds.add(id));
  }
  return duplicateIds;
}

function analyzeGuideQuality(input) {
  const bodyHtml = input.bodyHtml ?? "";
  const plainText = stripTags(bodyHtml);
  const words = plainText ? plainText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const htmlH2Count = countMatches(bodyHtml, /<h2\b/gi);
  const markdownH2Count = countMatches(bodyHtml, /^##\s+\S.*$/gm);
  const h2Count = htmlH2Count || markdownH2Count;
  const internalLinkCount = countInternalLinks(bodyHtml);

  let score = 0;
  if (input.keywordTarget?.trim()) score += 10;
  if (input.seoTitle?.trim()) score += 10;
  if (input.seoDescription?.trim()) score += 10;
  if (wordCount >= 600) score += 15;
  if (h2Count >= 3) score += 10;
  if (/<h2\b[^>]*>\s*faq\s*<\/h2>|<h[23]\b[^>]*>\s*faq\b|^#{2,3}\s*faq\b/im.test(bodyHtml)) score += 10;
  if (internalLinkCount >= 2) score += 15;
  if (/start this offer|compare more offers|offers page/i.test(plainText)) score += 10;
  if (/pros\s*&\s*cons|pros and cons/i.test(plainText)) score += 5;
  if (/<table\b/i.test(bodyHtml)) score += 5;

  return { score, wordCount, internalLinkCount };
}

function countInternalLinks(bodyHtml = "") {
  const hrefs = [
    ...Array.from(bodyHtml.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)).map((match) => match[1] ?? ""),
    ...Array.from(bodyHtml.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)).map((match) => match[1] ?? ""),
  ];
  return hrefs.filter((href) => href.startsWith("/") || href.includes("earngrind.com")).length;
}

function hasMeaningfulGameContent(game) {
  return (game.description?.trim().length ?? 0) >= 80;
}

function isPublicPayoutEligible(payoutUsd, totalPayoutUsd, threshold = getPublicOfferMinPayout()) {
  return payoutUsd >= threshold && totalPayoutUsd >= threshold;
}

function getPublicOfferMinPayout() {
  const raw = process.env.MIN_PUBLIC_OFFER_PAYOUT_USD ?? process.env.NEXT_PUBLIC_MIN_PUBLIC_OFFER_PAYOUT_USD;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0.05;
}

function normalizeTotalPayout(payoutUsd, totalPayoutUsd) {
  if (!Number.isFinite(payoutUsd)) return Number.isFinite(Number(totalPayoutUsd)) ? Number(totalPayoutUsd) : 0;
  const total = Number(totalPayoutUsd);
  if (!Number.isFinite(total)) return payoutUsd;
  return total < payoutUsd ? payoutUsd : total;
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function countMatches(value, pattern) {
  return value.match(pattern)?.length ?? 0;
}

function normalizeKeyword(value) {
  return value?.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim() ?? "";
}

function toNumber(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function loadEnvFile(fileName) {
  const path = resolve(process.cwd(), fileName);
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] != null) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}
