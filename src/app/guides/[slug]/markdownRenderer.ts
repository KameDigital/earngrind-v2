// Minimal server-side markdown → HTML renderer.
// No heavy runtime deps — uses regex transforms that cover the patterns
// we use in guide body_md fields (headings, bold, italic, lists, code, links, hr, blockquotes).

export function renderMarkdown(md: string): string {
    if (!md) return "";

    let html = md
        // Escape bare HTML entities first to avoid XSS via body_md
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Process block elements line by line
    const lines = html.split("\n");
    const out: string[] = [];
    let inList = false;
    let inOList = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // HR
        if (/^[-*_]{3,}$/.test(trimmed)) {
            if (inList)  { out.push("</ul>"); inList = false; }
            if (inOList) { out.push("</ol>"); inOList = false; }
            out.push("<hr />");
            continue;
        }

        // Headings
        const hMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (hMatch) {
            if (inList)  { out.push("</ul>"); inList = false; }
            if (inOList) { out.push("</ol>"); inOList = false; }
            const level = hMatch[1].length;
            const text  = inlineMarkdown(hMatch[2]);
            const id    = hMatch[2].toLowerCase().replace(/[^a-z0-9]+/g, "-");
            out.push(`<h${level} id="${id}">${text}</h${level}>`);
            continue;
        }

        // Blockquote
        if (trimmed.startsWith("&gt; ")) {
            if (inList)  { out.push("</ul>"); inList = false; }
            if (inOList) { out.push("</ol>"); inOList = false; }
            out.push(`<blockquote>${inlineMarkdown(trimmed.slice(5))}</blockquote>`);
            continue;
        }

        // Unordered list
        const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
        if (ulMatch) {
            if (inOList) { out.push("</ol>"); inOList = false; }
            if (!inList) { out.push("<ul>"); inList = true; }
            out.push(`<li>${inlineMarkdown(ulMatch[1])}</li>`);
            continue;
        }

        // Ordered list
        const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
        if (olMatch) {
            if (inList) { out.push("</ul>"); inList = false; }
            if (!inOList) { out.push("<ol>"); inOList = true; }
            out.push(`<li>${inlineMarkdown(olMatch[1])}</li>`);
            continue;
        }

        // Close open lists on blank line or non-list content
        if (trimmed === "") {
            if (inList)  { out.push("</ul>"); inList = false; }
            if (inOList) { out.push("</ol>"); inOList = false; }
            out.push("");
            continue;
        }

        // Close lists before paragraph
        if (inList)  { out.push("</ul>"); inList = false; }
        if (inOList) { out.push("</ol>"); inOList = false; }

        out.push(`<p>${inlineMarkdown(trimmed)}</p>`);
    }

    if (inList)  out.push("</ul>");
    if (inOList) out.push("</ol>");

    return out.join("\n");
}

function inlineMarkdown(text: string): string {
    return text
        // Inline code
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        // Bold+italic
        .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
        // Bold
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        // Italic
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-lime-700 underline" target="_blank" rel="noopener">$1</a>');
}

// Extract sections based on ## headings — used by Steps and Pro layouts
export interface Section {
    id:   string;
    heading: string;
    body: string; // raw markdown between this heading and the next
}

export function extractSections(md: string): Section[] {
    if (!md) return [];
    const parts = md.split(/^##\s+/m);
    const sections: Section[] = [];
    for (const part of parts) {
        if (!part.trim()) continue;
        const newline = part.indexOf("\n");
        if (newline === -1) {
            // heading with no body
            const heading = part.trim();
            sections.push({ id: heading.toLowerCase().replace(/[^a-z0-9]+/g, "-"), heading, body: "" });
        } else {
            const heading = part.slice(0, newline).trim();
            const body    = part.slice(newline + 1).trim();
            sections.push({ id: heading.toLowerCase().replace(/[^a-z0-9]+/g, "-"), heading, body });
        }
    }
    return sections;
}
