import { analyzeGuideQuality } from "@/lib/guide-quality";
import { isPublicPayoutEligible, normalizeTotalPayout } from "@/lib/offer-quality";

export type SitemapGuide = {
  id?: string | null;
  status?: string | null;
  slug?: string | null;
  updated_at?: string | null;
  body_md?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  keyword_target?: string | null;
  needs_variation?: boolean | null;
};

export type SitemapGame = {
  id?: string | null;
  slug?: string | null;
  updated_at?: string | null;
  description?: string | null;
};

export type SitemapOfferRow = {
  id?: string | null;
  source?: string | null;
  game_id?: string | null;
  game_slug?: string | null;
  payout_usd?: number | string | null;
  total_payout_usd?: number | string | null;
  updated_at?: string | null;
};

export type GameSitemapSignals = {
  eligibleOfferCount?: number;
  hasPublishedGuide?: boolean;
  hasMeaningfulContent?: boolean;
};

export type GeneratedGuideSitemapSignals = {
  eligibleOfferCount?: number;
  hasCuratedGuide?: boolean;
  hasTaskData?: boolean;
};

export function getDuplicateKeywordGuideIds(guides: SitemapGuide[]): Set<string> {
  const byKeyword = new Map<string, string[]>();

  for (const guide of guides) {
    const id = guide.id?.trim();
    const keyword = normalizeKeyword(guide.keyword_target);
    if (!id || !keyword) continue;
    byKeyword.set(keyword, [...(byKeyword.get(keyword) ?? []), id]);
  }

  const duplicateIds = new Set<string>();
  for (const ids of Array.from(byKeyword.values())) {
    if (ids.length <= 1) continue;
    ids.forEach((id: string) => duplicateIds.add(id));
  }
  return duplicateIds;
}

export function shouldIncludeGuideInSitemap(
  guide: SitemapGuide,
  duplicateKeywordGuideIds = new Set<string>(),
) {
  const quality = analyzeGuideQuality({
    bodyHtml: guide.body_md,
    seoTitle: guide.seo_title,
    seoDescription: guide.seo_description,
    keywordTarget: guide.keyword_target,
  });

  const reasons: string[] = [];
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

  return {
    include: reasons.length === 0,
    reasons,
    score: quality.score,
  };
}

export function shouldIncludeGameInSitemap(game: SitemapGame, signals: GameSitemapSignals = {}) {
  const reasons: string[] = [];
  if (!game.slug?.trim()) reasons.push("Game slug is missing.");
  if (!game.updated_at) reasons.push("Game updated_at is missing.");

  const hasEligibleOffer = (signals.eligibleOfferCount ?? 0) > 0;
  const hasPublishedGuide = Boolean(signals.hasPublishedGuide);
  const hasMeaningfulContent = Boolean(signals.hasMeaningfulContent ?? hasMeaningfulGameContent(game));
  if (!hasEligibleOffer && !hasPublishedGuide && !hasMeaningfulContent) {
    reasons.push("Game has no eligible offers, published guide, or meaningful page content.");
  }

  return {
    include: reasons.length === 0,
    reasons,
  };
}

export function shouldIncludeOfferPageInSitemap(game: SitemapGame, eligibleOfferCount = 0) {
  const reasons: string[] = [];
  if (!game.slug?.trim()) reasons.push("Game slug is missing.");
  if (!game.updated_at) reasons.push("Game updated_at is missing.");
  if (eligibleOfferCount <= 0) reasons.push("No active public eligible offers.");

  return {
    include: reasons.length === 0,
    reasons,
  };
}

export function shouldIncludeGeneratedHowToEarnInSitemap(
  game: SitemapGame,
  signals: GeneratedGuideSitemapSignals = {},
) {
  const reasons: string[] = [];
  if (!game.slug?.trim()) reasons.push("Game slug is missing.");
  if (!game.updated_at) reasons.push("Game updated_at is missing.");
  if ((signals.eligibleOfferCount ?? 0) <= 0) reasons.push("No active public eligible offers.");
  if (signals.hasCuratedGuide) reasons.push("Curated guide exists for this game.");
  if (!signals.hasTaskData) reasons.push("No eligible offer task data.");

  return {
    include: reasons.length === 0,
    reasons,
  };
}

export function getEligibleOfferStats(rows: SitemapOfferRow[]) {
  const byGameId = new Map<string, number>();
  const byGameSlug = new Map<string, number>();
  const eligibleManualOfferIds: string[] = [];

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

  return {
    byGameId,
    byGameSlug,
    eligibleManualOfferIds,
  };
}

function hasMeaningfulGameContent(game: SitemapGame) {
  return (game.description?.trim().length ?? 0) >= 80;
}

function normalizeKeyword(value?: string | null) {
  return value?.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim() ?? "";
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}
