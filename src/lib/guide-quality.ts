export type GuideQualityInput = {
  bodyHtml?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  keywordTarget?: string | null;
};

export type GuideQualityResult = {
  score: number;
  wordCount: number;
  h2Count: number;
  internalLinkCount: number;
  requiredErrors: string[];
  optionalWarnings: string[];
};

const UNSAFE_PHRASES = [
  "guaranteed payout",
  "you will get paid",
  "always credits",
  "guaranteed earnings",
];

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length ?? 0;
}

export function countInternalLinks(bodyHtml?: string | null) {
  const html = bodyHtml ?? "";
  const hrefs = Array.from(html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)).map((match) => match[1] ?? "");
  return hrefs.filter((href) => href.startsWith("/") || href.includes("earngrind.com")).length;
}

export function analyzeGuideQuality(input: GuideQualityInput): GuideQualityResult {
  const bodyHtml = input.bodyHtml ?? "";
  const plainText = stripTags(bodyHtml);
  const words = plainText ? plainText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const h2Count = countMatches(bodyHtml, /<h2\b/gi);
  const internalLinkCount = countInternalLinks(bodyHtml);
  const hasFaq = /<h2\b[^>]*>\s*faq\s*<\/h2>|<h[23]\b[^>]*>\s*faq\b/i.test(bodyHtml);
  const hasCta = /start this offer|compare more offers|offers page/i.test(plainText);
  const hasProsCons = /pros\s*&\s*cons|pros and cons/i.test(plainText);
  const hasTaskTable = /<table\b/i.test(bodyHtml);
  const hasImage = /<img\b/i.test(bodyHtml);
  const lower = plainText.toLowerCase();

  const requiredErrors: string[] = [];
  if (!input.seoTitle?.trim()) requiredErrors.push("SEO title is missing.");
  if (!input.seoDescription?.trim()) requiredErrors.push("SEO description is missing.");
  if (!input.keywordTarget?.trim()) requiredErrors.push("Keyword target is missing.");
  if (wordCount < 600) requiredErrors.push("Body has fewer than 600 words.");
  if (h2Count < 3) requiredErrors.push("Body has fewer than 3 H2 sections.");
  if (!hasFaq) requiredErrors.push("FAQ section is missing.");
  if (internalLinkCount < 2) requiredErrors.push("At least 2 internal links are required.");
  const unsafe = UNSAFE_PHRASES.filter((phrase) => lower.includes(phrase));
  if (unsafe.length > 0) requiredErrors.push(`Unsafe guarantee language found: ${unsafe.join(", ")}.`);

  const optionalWarnings: string[] = [];
  if (!hasImage) optionalWarnings.push("No image included.");
  if (!hasCta) optionalWarnings.push("No CTA section detected.");
  if (!hasTaskTable) optionalWarnings.push("No task table detected.");
  if (!hasProsCons) optionalWarnings.push("No pros/cons section detected.");

  let score = 0;
  if (input.keywordTarget?.trim()) score += 10;
  if (input.seoTitle?.trim()) score += 10;
  if (input.seoDescription?.trim()) score += 10;
  if (wordCount >= 600) score += 15;
  if (h2Count >= 3) score += 10;
  if (hasFaq) score += 10;
  if (internalLinkCount >= 2) score += 15;
  if (hasCta) score += 10;
  if (hasProsCons) score += 5;
  if (hasTaskTable) score += 5;

  return {
    score,
    wordCount,
    h2Count,
    internalLinkCount,
    requiredErrors,
    optionalWarnings,
  };
}
