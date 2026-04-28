import { analyzeGuideQuality } from "@/lib/guide-quality";
import { detectCannibalization } from "@/lib/keyword-cannibalization";
import { checkStructuredData } from "@/lib/structured-data-check";

export type IndexableGuide = {
  id?: string | null;
  title?: string | null;
  slug?: string | null;
  status?: string | null;
  body_md?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  keyword_target?: string | null;
  keyword_cluster_id?: string | null;
  keyword_intent?: string | null;
  needs_variation?: boolean | null;
  updated_at?: string | null;
  published_at?: string | null;
};

export type IndexingReadinessResult = {
  ready: boolean;
  score: number;
  canonicalUrl: string | null;
  blockers: string[];
  warnings: string[];
  includedInSitemap: boolean;
};

export function getGuideSitemapPriority(score: number) {
  if (score >= 90) return 0.9;
  if (score >= 75) return 0.8;
  return 0.6;
}

export function evaluateIndexingReadiness({
  guide,
  allGuides = [],
  includedInSitemap = false,
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
}: {
  guide: IndexableGuide;
  allGuides?: IndexableGuide[];
  includedInSitemap?: boolean;
  baseUrl?: string;
}): IndexingReadinessResult {
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
  const cannibalization = detectCannibalization(
    allGuides
      .filter((candidate) => candidate.keyword_target)
      .map((candidate) => ({
        id: candidate.id ?? undefined,
        keyword_target: candidate.keyword_target ?? "",
        keyword_cluster_id: candidate.keyword_cluster_id ?? undefined,
        keyword_intent: candidate.keyword_intent ?? undefined,
      })),
  );
  const duplicateKeyword = cannibalization.find(
    (finding) =>
      finding.type === "duplicate_keyword" &&
      finding.guideIds.includes(guide.id ?? ""),
  );

  const blockers: string[] = [];
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

  const warnings = [
    ...quality.optionalWarnings,
    ...structuredData.warnings,
  ];
  if (!/<img\b/i.test(guide.body_md ?? "")) warnings.push("No image found in body.");
  if (structuredData.faqRequired && !structuredData.faqPageJsonLd) warnings.push("FAQ schema is not ready.");
  if (!/<table\b/i.test(guide.body_md ?? "")) warnings.push("No task table found.");
  if (!/start this offer|compare more offers|offers page/i.test(guide.body_md ?? "")) warnings.push("No CTA section detected.");

  const canonicalUrl = guide.slug ? `${baseUrl.replace(/\/$/, "")}/guides/${guide.slug}` : null;

  return {
    ready: blockers.length === 0,
    score: quality.score,
    canonicalUrl,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
    includedInSitemap,
  };
}
