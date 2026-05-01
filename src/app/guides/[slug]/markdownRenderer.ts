import sanitizeHtml from "sanitize-html";

function isHtmlContent(value: string) {
    return /<\/?[a-z][\s\S]*>/i.test(value);
}

function slugifyHeading(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function addHeadingIds(html: string) {
    return html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_match, level, attrs, inner) => {
        const hasId = /\sid=/.test(attrs);
        const plain = inner.replace(/<[^>]+>/g, "").trim();
        const id = slugifyHeading(plain);
        const nextAttrs = hasId || !id ? attrs : `${attrs} id="${id}"`;
        return `<h${level}${nextAttrs}>${inner}</h${level}>`;
    });
}

export function sanitizeGuideHtml(html: string): string {
    const sanitized = sanitizeHtml(html, {
        allowedTags: [
            "h2",
            "h3",
            "p",
            "strong",
            "em",
            "ul",
            "ol",
            "li",
            "a",
            "img",
            "table",
            "thead",
            "tbody",
            "tr",
            "th",
            "td",
            "blockquote",
            "br",
            "hr",
            "div",
        ],
        allowedAttributes: {
            a: ["href", "target", "rel"],
            img: ["src", "alt", "title", "width", "height"],
            div: ["class"],
            th: ["colspan", "rowspan"],
            td: ["colspan", "rowspan"],
            h2: ["id"],
            h3: ["id"],
        },
        allowedSchemes: ["http", "https", "mailto"],
        transformTags: {
            a: (_tagName, attribs) => ({
                tagName: "a",
                attribs: {
                    href: attribs.href ?? "#",
                    target: "_blank",
                    rel: "noopener noreferrer nofollow",
                },
            }),
            img: (_tagName, attribs) => ({
                tagName: "img",
                attribs: {
                    src: attribs.src ?? "",
                    alt: attribs.alt ?? "",
                    title: attribs.title ?? undefined,
                    width: attribs.width ?? undefined,
                    height: attribs.height ?? undefined,
                },
            }),
        },
    });

    return addHeadingIds(sanitized);
}

function inlineMarkdown(text: string): string {
    return text
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer nofollow">$1</a>',
        );
}

function markdownToHtml(md: string): string {
    if (!md) return "";

    let html = md
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const lines = html.split("\n");
    const out: string[] = [];
    let inList = false;
    let inOList = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (/^[-*_]{3,}$/.test(trimmed)) {
            if (inList) { out.push("</ul>"); inList = false; }
            if (inOList) { out.push("</ol>"); inOList = false; }
            out.push("<hr />");
            continue;
        }

        const hMatch = trimmed.match(/^(#{1,6})\s*(.+)$/);
        if (hMatch) {
            if (inList) { out.push("</ul>"); inList = false; }
            if (inOList) { out.push("</ol>"); inOList = false; }
            const level = hMatch[1].length;
            const text = inlineMarkdown(hMatch[2]);
            const id = slugifyHeading(hMatch[2]);
            out.push(`<h${level} id="${id}">${text}</h${level}>`);
            continue;
        }

        if (trimmed.startsWith("&gt; ")) {
            if (inList) { out.push("</ul>"); inList = false; }
            if (inOList) { out.push("</ol>"); inOList = false; }
            out.push(`<blockquote>${inlineMarkdown(trimmed.slice(5))}</blockquote>`);
            continue;
        }

        const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
        if (ulMatch) {
            if (inOList) { out.push("</ol>"); inOList = false; }
            if (!inList) { out.push("<ul>"); inList = true; }
            out.push(`<li>${inlineMarkdown(ulMatch[1])}</li>`);
            continue;
        }

        const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
        if (olMatch) {
            if (inList) { out.push("</ul>"); inList = false; }
            if (!inOList) { out.push("<ol>"); inOList = true; }
            out.push(`<li>${inlineMarkdown(olMatch[1])}</li>`);
            continue;
        }

        if (trimmed === "") {
            if (inList) { out.push("</ul>"); inList = false; }
            if (inOList) { out.push("</ol>"); inOList = false; }
            out.push("");
            continue;
        }

        if (inList) { out.push("</ul>"); inList = false; }
        if (inOList) { out.push("</ol>"); inOList = false; }
        out.push(`<p>${inlineMarkdown(trimmed)}</p>`);
    }

    if (inList) out.push("</ul>");
    if (inOList) out.push("</ol>");

    return out.join("\n");
}

export function renderMarkdown(content: string): string {
    if (!content) return "";
    return sanitizeGuideHtml(isHtmlContent(content) ? content : markdownToHtml(content));
}

export interface Section {
    id: string;
    heading: string;
    body: string;
}

export function extractPreamble(content: string): string {
    const html = renderMarkdown(content);
    const firstH2 = html.search(/<h2\b[^>]*>/i);
    if (firstH2 === -1) return html.trim();
    return html.slice(0, firstH2).trim();
}

export function extractSections(content: string): Section[] {
    const html = renderMarkdown(content);
    if (!html) return [];

    const sections: Section[] = [];
    const regex = /<h2\b([^>]*)>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2\b[^>]*>|$)/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
        const attrs = match[1] ?? "";
        const headingHtml = match[2] ?? "";
        const body = (match[3] ?? "").trim();
        const heading = headingHtml.replace(/<[^>]+>/g, "").trim();
        const idMatch = attrs.match(/\sid="([^"]+)"/i);
        sections.push({
            id: idMatch?.[1] ?? slugifyHeading(heading),
            heading,
            body,
        });
    }

    return sections;
}
