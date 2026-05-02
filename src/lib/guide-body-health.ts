export type GuideBodyHealth = {
  hasBody: boolean;
  hasMarkdownHeadings: boolean;
  hasHtmlTags: boolean;
  hasMixedMarkdownHtml: boolean;
  markdownHeadingCount: number;
  htmlHeadingCount: number;
  headingCount: number;
  issues: string[];
  warnings: string[];
};

const markdownHeadingPattern = /^#{1,6}\s*\S.*$/gm;
const htmlTagPattern = /<\/?[a-z][\s\S]*?>/gi;
const htmlHeadingPattern = /<h[23]\b/gi;

export function analyzeGuideBodyHealth(body?: string | null): GuideBodyHealth {
  const value = body ?? "";
  const trimmed = value.trim();
  const markdownHeadingCount = value.match(markdownHeadingPattern)?.length ?? 0;
  const htmlHeadingCount = value.match(htmlHeadingPattern)?.length ?? 0;
  const hasHtmlTags = htmlTagPattern.test(value);
  const hasMarkdownHeadings = markdownHeadingCount > 0;
  const hasMixedMarkdownHtml = hasMarkdownHeadings && hasHtmlTags;
  const headingCount = hasHtmlTags && !hasMixedMarkdownHtml ? htmlHeadingCount : markdownHeadingCount;

  const issues: string[] = [];
  const warnings: string[] = [];

  if (!trimmed) issues.push("Body is empty.");
  if (hasMixedMarkdownHtml) {
    issues.push("Body mixes Markdown headings with raw HTML. Convert the HTML to Markdown or use the rich text editor only.");
  }
  if (trimmed && headingCount === 0) issues.push("No H2 or H3 sections detected.");
  if (trimmed && headingCount > 0 && headingCount < 3) warnings.push("Few content sections detected.");

  return {
    hasBody: Boolean(trimmed),
    hasMarkdownHeadings,
    hasHtmlTags,
    hasMixedMarkdownHtml,
    markdownHeadingCount,
    htmlHeadingCount,
    headingCount,
    issues,
    warnings,
  };
}
