import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";
import { indexFollowRobots } from "@/lib/seo-metadata";
import { renderMarkdown } from "../[slug]/markdownRenderer";

const PAGE_PATH = "/guides/lords-mobile";
const PAGE_URL = absoluteUrl(PAGE_PATH);
const MARKDOWN_PATH = path.join(process.cwd(), "guides", "lords-mobile", "index.md");
const TITLE = "Lords Mobile Guide: Beginner Strategy, Academy, Heroes, Castle, and Fast Progression";
const DESCRIPTION =
    "Lords Mobile guide for beginners: castle upgrades, Academy research, heroes, troops, guilds, monster hunt, resources, spending, codes, and fast progression.";

export const dynamic = "force-static";

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: {
        canonical: PAGE_URL,
    },
    robots: indexFollowRobots(),
    openGraph: {
        title: TITLE,
        description: DESCRIPTION,
        url: PAGE_URL,
        type: "article",
    },
    twitter: {
        card: "summary",
        title: TITLE,
        description: DESCRIPTION,
    },
};

function readGuideBody() {
    return fs
        .readFileSync(MARKDOWN_PATH, "utf8")
        .replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "")
        .replace(/^# .+\n+/, "");
}

export default function LordsMobileGuidePage() {
    const html = renderMarkdown(readGuideBody());

    return (
        <main className="min-h-screen bg-[#f5f5f0]">
            <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
                <style>{`
                    .static-guide{color:#374151;font-size:1rem;line-height:1.75;overflow-wrap:anywhere}
                    .static-guide h1,.static-guide h2,.static-guide h3{color:#111827;font-weight:900;line-height:1.22}
                    .static-guide h1{font-size:2.25rem;margin:0 0 1.25rem}
                    .static-guide h2{font-size:1.5rem;margin:2.25rem 0 .8rem}
                    .static-guide h3{font-size:1.15rem;margin:1.5rem 0 .55rem}
                    .static-guide p{margin:.85rem 0}
                    .static-guide a{color:#047857;text-decoration:underline;text-underline-offset:3px}
                    .static-guide ul,.static-guide ol{margin:.85rem 0;padding-left:1.35rem}
                    .static-guide li{margin:.3rem 0}
                    .static-guide blockquote{border-left:4px solid #84cc16;background:#f7fee7;margin:1.25rem 0;padding:.8rem 1rem;color:#365314}
                    .static-guide table{display:block;width:100%;max-width:100%;overflow-x:auto;border-collapse:collapse;margin:1rem 0}
                    .static-guide th,.static-guide td{border:1px solid #d1d5db;padding:.55rem;text-align:left;vertical-align:top}
                    .static-guide th{background:#f9fafb;color:#111827}
                    .static-guide code{background:#f3f4f6;border:1px solid #e5e7eb;border-radius:4px;padding:1px 5px}
                `}</style>
                <div className="static-guide rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
                    <h1>{TITLE}</h1>
                    <div dangerouslySetInnerHTML={{ __html: html }} />
                </div>
            </article>
        </main>
    );
}
