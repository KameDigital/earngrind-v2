export type StructuredDataCheckInput = {
  title?: string | null;
  slug?: string | null;
  bodyHtml?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
};

export type StructuredDataCheckResult = {
  articleJsonLd: boolean;
  breadcrumbJsonLd: boolean;
  faqPageJsonLd: boolean;
  faqRequired: boolean;
  errors: string[];
  warnings: string[];
};

function hasFaqSection(bodyHtml: string) {
  return /<h2\b[^>]*>\s*faq\s*<\/h2>|<h[23]\b[^>]*>\s*faq\b/i.test(bodyHtml);
}

function hasFaqQuestionAnswerPairs(bodyHtml: string) {
  if (!hasFaqSection(bodyHtml)) return false;
  return /<h3\b[^>]*>[\s\S]*?<\/h3>\s*<p\b[^>]*>[\s\S]*?<\/p>/i.test(bodyHtml);
}

export function checkStructuredData(input: StructuredDataCheckInput): StructuredDataCheckResult {
  const bodyHtml = input.bodyHtml ?? "";
  const errors: string[] = [];
  const warnings: string[] = [];

  const articleJsonLd = Boolean(input.title?.trim() && input.slug?.trim() && (input.updatedAt || input.publishedAt));
  const breadcrumbJsonLd = Boolean(input.slug?.trim());
  const faqRequired = hasFaqSection(bodyHtml);
  const faqPageJsonLd = faqRequired ? hasFaqQuestionAnswerPairs(bodyHtml) : false;

  if (!articleJsonLd) errors.push("Article JSON-LD is missing required title, slug, or date fields.");
  if (!breadcrumbJsonLd) errors.push("BreadcrumbList JSON-LD cannot be generated without a slug.");
  if (faqRequired && !faqPageJsonLd) warnings.push("FAQ section exists, but FAQPage JSON-LD may not have valid question/answer pairs.");

  return {
    articleJsonLd,
    breadcrumbJsonLd,
    faqPageJsonLd,
    faqRequired,
    errors,
    warnings,
  };
}
