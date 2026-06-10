import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnvFile(".env.local");
loadEnvFile(".env.production");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://earngrind.com").replace(/\/$/, "");

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
    .select("id, title, slug, status, body_md, seo_title, seo_description, excerpt, keyword_target, keyword_cluster_id, keyword_intent, needs_variation, updated_at, published_at, game_id")
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
const duplicateGuideIds = getDuplicateKeywordGuideIds(guides);
const guideByGameId = new Map();

for (const guide of guides) {
  if (!guide.game_id || !guide.slug) continue;
  if (!guideByGameId.has(guide.game_id)) guideByGameId.set(guide.game_id, guide);
}

const taskRows = await fetchTaskRows(offerStats.eligibleManualOfferIds);
const manualOfferIdsWithTasks = new Set(taskRows.map((task) => task.site_offer_id).filter(Boolean));
const gameIdsWithTaskData = new Set(
  offers
    .filter((offer) => offer.source === "manual" && offer.id && manualOfferIdsWithTasks.has(offer.id))
    .map((offer) => offer.game_id)
    .filter(Boolean),
);

const curatedGuideAudit = auditCuratedGuides();
const gameAudit = auditGames();
const offerAudit = auditOffers();
const generatedAudit = auditGeneratedHowToEarn();
const mismatches = [
  ...gameAudit.mismatches,
  ...offerAudit.mismatches,
  ...generatedAudit.mismatches,
  ...curatedGuideAudit.mismatches,
];

printSection("SEO Metadata Audit");
console.log(`Curated guides checked: ${curatedGuideAudit.total}`);
console.log(`Curated guides index/follow: ${curatedGuideAudit.index.length}`);
console.log(`Curated guides noindex/follow: ${curatedGuideAudit.noindex.length}`);
console.log(`Game pages checked: ${gameAudit.total}`);
console.log(`Game pages index/follow: ${gameAudit.index.length}`);
console.log(`Game pages noindex/follow: ${gameAudit.noindex.length}`);
console.log(`Offer pages checked: ${offerAudit.total}`);
console.log(`Offer pages index/follow: ${offerAudit.index.length}`);
console.log(`Offer pages noindex/follow: ${offerAudit.noindex.length}`);
console.log(`Generated how-to-earn pages checked: ${generatedAudit.total}`);
console.log(`Generated how-to-earn index/follow: ${generatedAudit.index.length}`);
console.log(`Generated how-to-earn noindex/follow because curated guide exists: ${generatedAudit.noindexCurated.length}`);
console.log(`Generated how-to-earn noindex/follow because weak/thin/no task data: ${generatedAudit.noindexWeak.length}`);
console.log(`Sitemap vs metadata mismatches: ${mismatches.length}`);

printSection("Examples");
printExamples("Curated guides index/follow", curatedGuideAudit.index);
printExamples("Curated guides noindex/follow", curatedGuideAudit.noindex);
printExamples("Game pages index/follow", gameAudit.index);
printExamples("Game pages noindex/follow", gameAudit.noindex);
printExamples("Offer pages index/follow", offerAudit.index);
printExamples("Offer pages noindex/follow", offerAudit.noindex);
printExamples("Generated how-to-earn index/follow", generatedAudit.index);
printExamples("Generated how-to-earn noindex/follow because curated guide exists", generatedAudit.noindexCurated);
printExamples("Generated how-to-earn noindex/follow because weak/thin/no task data", generatedAudit.noindexWeak);

printSection("Canonical Target Examples For Noindexed Generated Pages");
printCanonicalExamples([...generatedAudit.noindexCurated, ...generatedAudit.noindexWeak]);

printSection("Sitemap vs Metadata Mismatches");
printMismatchExamples(mismatches);

function auditCuratedGuides() {
  const index = [];
  const noindex = [];
  const mismatches = [];

  for (const guide of guides) {
    const sitemapDecision = shouldIncludeGuideInSitemap(guide, duplicateGuideIds);
    const readiness = evaluateGuideIndexingReadiness(guide, guides, sitemapDecision.include);
    const url = guide.slug ? `/guides/${guide.slug}` : "/guides/[missing-slug]";
    const item = {
      url,
      canonical: absolute(url),
      reasons: readiness.blockers,
      sitemapIncluded: sitemapDecision.include,
      metadataIndex: readiness.ready,
    };
    (readiness.ready ? index : noindex).push(item);
    collectMismatch(mismatches, item);
  }

  return { total: guides.length, index, noindex, mismatches };
}

function auditGames() {
  const index = [];
  const noindex = [];
  const mismatches = [];

  for (const game of games) {
    const eligibleOfferCount = offerStats.byGameId.get(game.id) ?? 0;
    const hasPublishedGuide = guideByGameId.has(game.id);
    const metadataIndex = eligibleOfferCount > 0 || hasPublishedGuide || hasMeaningfulGameContent(game);
    const sitemapDecision = shouldIncludeGameInSitemap(game, { eligibleOfferCount, hasPublishedGuide });
    const url = game.slug ? `/games/${game.slug}` : "/games/[missing-slug]";
    const reasons = [];
    if (!metadataIndex) reasons.push("No eligible offers, published guide, or meaningful page content.");
    const item = {
      url,
      canonical: absolute(url),
      reasons,
      sitemapIncluded: sitemapDecision.include,
      metadataIndex,
    };
    (metadataIndex ? index : noindex).push(item);
    collectMismatch(mismatches, item);
  }

  return { total: games.length, index, noindex, mismatches };
}

function auditOffers() {
  const index = [];
  const noindex = [];
  const mismatches = [];

  for (const game of games) {
    const eligibleOfferCount = offerStats.byGameId.get(game.id) ?? 0;
    const metadataIndex = eligibleOfferCount > 0;
    const sitemapDecision = shouldIncludeOfferPageInSitemap(game, eligibleOfferCount);
    const url = game.slug ? `/offers/${game.slug}` : "/offers/[missing-slug]";
    const reasons = [];
    if (eligibleOfferCount <= 0) reasons.push("No active public eligible offers.");
    const item = {
      url,
      canonical: absolute(url),
      reasons,
      sitemapIncluded: sitemapDecision.include,
      metadataIndex,
    };
    (metadataIndex ? index : noindex).push(item);
    collectMismatch(mismatches, item);
  }

  return { total: games.length, index, noindex, mismatches };
}

function auditGeneratedHowToEarn() {
  const index = [];
  const noindexCurated = [];
  const noindexWeak = [];
  const mismatches = [];

  for (const game of games) {
    const curatedGuide = guideByGameId.get(game.id) ?? null;
    const signals = {
      eligibleOfferCount: offerStats.manualByGameId.get(game.id) ?? 0,
      hasCuratedGuide: Boolean(curatedGuide),
      hasTaskData: gameIdsWithTaskData.has(game.id),
    };
    const metadataDecision = shouldIncludeGeneratedHowToEarnInSitemap(game, signals);
    const sitemapDecision = shouldIncludeGeneratedHowToEarnInSitemap(game, {
      eligibleOfferCount: offerStats.byGameId.get(game.id) ?? 0,
      hasCuratedGuide: Boolean(curatedGuide),
      hasTaskData: gameIdsWithTaskData.has(game.id),
    });
    const url = game.slug ? `/guides/how-to-earn/${game.slug}` : "/guides/how-to-earn/[missing-slug]";
    const canonical = curatedGuide
      ? absolute(`/guides/${curatedGuide.slug}`)
      : metadataDecision.include
        ? absolute(url)
        : absolute(`/games/${game.slug ?? ""}`);
    const item = {
      url,
      canonical,
      reasons: metadataDecision.reasons,
      sitemapIncluded: sitemapDecision.include,
      metadataIndex: metadataDecision.include,
    };
    if (metadataDecision.include) index.push(item);
    else if (curatedGuide) noindexCurated.push(item);
    else noindexWeak.push(item);
    collectMismatch(mismatches, item);
  }

  return {
    total: games.length,
    index,
    noindex: [...noindexCurated, ...noindexWeak],
    noindexCurated,
    noindexWeak,
    mismatches,
  };
}

function collectMismatch(mismatches, item) {
  if (item.sitemapIncluded === item.metadataIndex) return;
  mismatches.push(item);
}

function evaluateGuideIndexingReadiness(guide, allGuides, includedInSitemap) {
  const quality = analyzeGuideQuality({
    bodyHtml: guide.body_md,
    seoTitle: guide.seo_title,
    seoDescription: guide.seo_description,
    keywordTarget: guide.keyword_target,
  });
  const structuredData = checkStructuredData({
    title: guide.title,
    slug: guide.slug,
    bodyHtml: guide.body_md,
    updatedAt: guide.updated_at,
    publishedAt: guide.published_at,
  });
  const duplicateKeyword = duplicateGuideIds.has(guide.id);
  const blockers = [];

  if (guide.status !== "published") blockers.push("Guide is not published.");
  if (!guide.slug?.trim()) blockers.push("Canonical URL cannot be generated without a slug.");
  if (quality.wordCount < 600) blockers.push("Body has fewer than 600 words.");
  if (quality.internalLinkCount < 2) blockers.push("At least 2 internal links are required.");
  if (!guide.seo_title?.trim()) blockers.push("SEO title is missing.");
  if (!guide.seo_description?.trim()) blockers.push("SEO description is missing.");
  if (duplicateKeyword) blockers.push("Duplicate keyword target blocks indexing readiness.");
  if (guide.needs_variation) blockers.push("Guide is marked needs variation.");
  if (!includedInSitemap) blockers.push("Guide is not included in the sitemap.");
  blockers.push(...structuredData.errors);

  return {
    ready: blockers.length === 0,
    blockers: Array.from(new Set(blockers)),
  };
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
  if ((signals.eligibleOfferCount ?? 0) <= 0 && !signals.hasPublishedGuide && !hasMeaningfulGameContent(game)) {
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
  const manualByGameId = new Map();
  const eligibleManualOfferIds = [];

  for (const row of rows) {
    const payoutUsd = toNumber(row.payout_usd);
    const totalPayoutUsd = normalizeTotalPayout(payoutUsd, toNumber(row.total_payout_usd, payoutUsd));
    if (!isPublicPayoutEligible(payoutUsd, totalPayoutUsd)) continue;

    const gameId = row.game_id?.trim();
    if (gameId) byGameId.set(gameId, (byGameId.get(gameId) ?? 0) + 1);
    if (row.source === "manual" && row.id) {
      eligibleManualOfferIds.push(row.id);
      if (gameId) manualByGameId.set(gameId, (manualByGameId.get(gameId) ?? 0) + 1);
    }
  }

  return { byGameId, manualByGameId, eligibleManualOfferIds };
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

function getDuplicateKeywordGuideIds(rows) {
  const byKeyword = new Map();
  for (const guide of rows) {
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
  const internalLinkCount = countInternalLinks(bodyHtml);
  return { wordCount, internalLinkCount };
}

function checkStructuredData(input) {
  const errors = [];
  if (!input.title?.trim() || !input.slug?.trim() || !(input.updatedAt || input.publishedAt)) {
    errors.push("Article JSON-LD is missing required title, slug, or date fields.");
  }
  if (!input.slug?.trim()) errors.push("BreadcrumbList JSON-LD cannot be generated without a slug.");
  return { errors };
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

function absolute(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalized}`;
}

function printSection(title) {
  console.log(`\n== ${title} ==`);
}

function printExamples(label, items) {
  console.log(`${label}:`);
  if (items.length === 0) {
    console.log("  none");
    return;
  }
  for (const item of items.slice(0, 10)) {
    const reason = item.reasons.length ? ` :: ${item.reasons.join(" | ")}` : "";
    console.log(`  ${item.url} → ${item.canonical}${reason}`);
  }
}

function printCanonicalExamples(items) {
  if (items.length === 0) {
    console.log("  none");
    return;
  }
  for (const item of items.slice(0, 10)) {
    console.log(`  ${item.url} canonical → ${item.canonical}`);
  }
}

function printMismatchExamples(items) {
  if (items.length === 0) {
    console.log("  none");
    return;
  }
  for (const item of items.slice(0, 10)) {
    console.log(
      `  ${item.url} :: sitemap=${item.sitemapIncluded ? "included" : "excluded"} metadata=${item.metadataIndex ? "index" : "noindex"} canonical=${item.canonical} reason=${item.reasons.join(" | ") || "none"}`,
    );
  }
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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
