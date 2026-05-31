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

function titleCaseLabel(value: string) {
    return value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatDisplayLabel(value: string) {
    return value
        .split(/(https?:\/\/\S+)/g)
        .map((part) => {
            if (/^https?:\/\//.test(part)) return part;
            return part
                .replace(/\btask_0*(\d+)\b/gi, (_match, taskNumber) => `Task ${Number(taskNumber)}`)
                .replace(/\b[a-z][a-z0-9]+(?:_[a-z0-9]+)+\b/g, (match) => titleCaseLabel(match));
        })
        .join("");
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

function definedAttributes(attributes: Record<string, string | undefined>) {
    return Object.entries(attributes).reduce<Record<string, string>>((nextAttributes, [key, value]) => {
        if (typeof value === "string") nextAttributes[key] = value;
        return nextAttributes;
    }, {});
}

export function sanitizeGuideHtml(html: string): string {
    const sanitized = sanitizeHtml(html, {
        allowedTags: [
            "h2",
            "h3",
            "p",
            "strong",
            "em",
            "u",
            "span",
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
            "figure",
            "figcaption",
            "video",
            "source",
            "details",
            "summary",
            "br",
            "hr",
            "div",
        ],
        allowedAttributes: {
            a: ["href", "target", "rel"],
            img: ["src", "alt", "title", "width", "height", "loading", "class"],
            video: ["src", "title", "width", "height", "controls", "preload", "poster", "class"],
            source: ["src", "type"],
            p: ["style"],
            span: ["style"],
            div: ["class"],
            figure: ["class"],
            details: ["class", "open"],
            summary: ["class"],
            th: ["colspan", "rowspan"],
            td: ["colspan", "rowspan", "data-label"],
            h2: ["id", "style"],
            h3: ["id", "style"],
        },
        allowedStyles: {
            "*": {
                color: [/^#[0-9a-f]{3,6}$/i, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i],
                "font-size": [/^(12|14|16|18|20|24|28|32)px$/],
                "font-family": [
                    /^Arial,\s*sans-serif$/,
                    /^Georgia,\s*serif$/,
                    /^Times New Roman,\s*serif$/,
                    /^Verdana,\s*sans-serif$/,
                    /^ui-monospace,\s*SFMono-Regular,\s*Menlo,\s*monospace$/,
                ],
                "text-align": [/^(left|center|right)$/],
            },
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
                attribs: definedAttributes({
                    src: attribs.src ?? "",
                    alt: attribs.alt ?? "",
                    title: attribs.title,
                    width: attribs.width,
                    height: attribs.height,
                    loading: attribs.loading === "eager" ? "eager" : "lazy",
                    class: attribs.class,
                }),
            }),
            video: (_tagName, attribs) => ({
                tagName: "video",
                attribs: definedAttributes({
                    src: attribs.src,
                    title: attribs.title,
                    width: attribs.width,
                    height: attribs.height,
                    controls: "controls",
                    preload: attribs.preload === "auto" ? "metadata" : attribs.preload ?? "metadata",
                    poster: attribs.poster,
                    class: attribs.class,
                }),
            }),
        },
    });

    return addHeadingIds(sanitized);
}

function inlineMarkdown(text: string): string {
    return formatDisplayLabel(text)
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

    function isTableDivider(value: string) {
        const cells = value
            .trim()
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((cell) => cell.trim());

        return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
    }

    function isTableRow(value: string) {
        const trimmedValue = value.trim();
        return trimmedValue.includes("|") && !trimmedValue.startsWith("| ---") && trimmedValue.split("|").length > 2;
    }

    function parseTableCells(value: string) {
        return value
            .trim()
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((cell) => inlineMarkdown(cell.trim()));
    }

    function tableLabel(value: string) {
        return value.replace(/<[^>]+>/g, "").replace(/"/g, "&quot;");
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (/^[-*_]{3,}$/.test(trimmed)) {
            if (inList) { out.push("</ul>"); inList = false; }
            if (inOList) { out.push("</ol>"); inOList = false; }
            out.push("<hr />");
            continue;
        }

        if (isTableRow(line) && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
            if (inList) { out.push("</ul>"); inList = false; }
            if (inOList) { out.push("</ol>"); inOList = false; }

            const headers = parseTableCells(line);
            i += 2;
            const rows: string[][] = [];

            while (i < lines.length && isTableRow(lines[i])) {
                rows.push(parseTableCells(lines[i]));
                i++;
            }

            i--;
            out.push("<table>");
            out.push("<thead>");
            out.push(`<tr>${headers.map((cell) => `<th>${cell}</th>`).join("")}</tr>`);
            out.push("</thead>");
            out.push("<tbody>");
            rows.forEach((row) => {
                out.push(`<tr>${row.map((cell, cellIndex) => `<td data-label="${tableLabel(headers[cellIndex] ?? "")}">${cell}</td>`).join("")}</tr>`);
            });
            out.push("</tbody>");
            out.push("</table>");
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
    level?: number;
}

export function extractPreamble(content: string, headingLevels: Array<2 | 3> = [2]): string {
    const html = renderMarkdown(content);
    const headingPattern = headingLevels.includes(3) ? /<h[23]\b[^>]*>/i : /<h2\b[^>]*>/i;
    const firstHeading = html.search(headingPattern);
    if (firstHeading === -1) return html.trim();
    return html.slice(0, firstHeading).trim();
}

export function extractSections(content: string, headingLevels: Array<2 | 3> = [2]): Section[] {
    const html = renderMarkdown(content);
    if (!html) return [];

    const sections: Section[] = [];
    const regex = headingLevels.includes(3)
        ? /<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>([\s\S]*?)(?=<h[23]\b[^>]*>|$)/gi
        : /<h(2)\b([^>]*)>([\s\S]*?)<\/h\1>([\s\S]*?)(?=<h2\b[^>]*>|$)/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
        const level = Number(match[1] ?? 2);
        const attrs = match[2] ?? "";
        const headingHtml = match[3] ?? "";
        const body = (match[4] ?? "").trim();
        const heading = headingHtml.replace(/<[^>]+>/g, "").trim();
        const idMatch = attrs.match(/\sid="([^"]+)"/i);
        sections.push({
            id: idMatch?.[1] ?? slugifyHeading(heading),
            heading,
            body,
            level,
        });
    }

    return sections;
}
