export type GuideLinkSuggestion = {
  label: string;
  href: string;
  reason?: string;
  type?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeHref(value: string) {
  return value.trim();
}

export function insertApprovedInternalLinks(bodyHtml: string, suggestions: GuideLinkSuggestion[]) {
  const html = bodyHtml || "";
  const existingHrefs = new Set(
    Array.from(html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)).map((match) => normalizeHref(match[1] ?? "")),
  );

  const uniqueSuggestions = suggestions
    .map((suggestion) => ({
      ...suggestion,
      href: normalizeHref(suggestion.href),
      label: suggestion.label.trim(),
    }))
    .filter((suggestion) => suggestion.href && suggestion.label)
    .filter((suggestion, index, array) => array.findIndex((item) => item.href === suggestion.href) === index)
    .filter((suggestion) => !existingHrefs.has(suggestion.href));

  if (uniqueSuggestions.length === 0) return html;

  const section = [
    "<h2>Related Guides &amp; Offers</h2>",
    "<ul>",
    ...uniqueSuggestions.map(
      (suggestion) => `<li><a href="${escapeHtml(suggestion.href)}">${escapeHtml(suggestion.label)}</a></li>`,
    ),
    "</ul>",
  ].join("");

  const finalVerdictMatch = html.match(/<h2\b[^>]*>\s*Final Verdict\s*<\/h2>/i);
  if (finalVerdictMatch?.index !== undefined) {
    return `${html.slice(0, finalVerdictMatch.index)}${section}${html.slice(finalVerdictMatch.index)}`;
  }

  return `${html}${section}`;
}
