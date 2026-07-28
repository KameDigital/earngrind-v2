import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    AlertTriangle,
    ArrowRight,
    Camera,
    CheckCircle2,
    ClipboardCheck,
    Compass,
    ExternalLink,
    Gift,
    ListChecks,
    ShieldCheck,
    Sparkles,
    Target,
} from "lucide-react";
import {
    GPT_SITE_GUIDES,
    getPublishedGptSiteGuides,
    getGptSiteFeatureAudits,
    getGptSiteGuide,
    getGptSiteNavigationAudit,
    getGptSiteReaderInterests,
    getGptSiteTrackedHref,
    type GptSiteGuide,
} from "@/lib/gpt-site-guides";
import { absoluteUrl } from "@/lib/site-url";

const accentClasses: Record<string, { soft: string; icon: string; border: string }> = {
    purple: { soft: "bg-purple-50", icon: "text-purple-700", border: "border-purple-200" },
    blue: { soft: "bg-sky-50", icon: "text-sky-700", border: "border-sky-200" },
    green: { soft: "bg-emerald-50", icon: "text-emerald-700", border: "border-emerald-200" },
    red: { soft: "bg-rose-50", icon: "text-rose-700", border: "border-rose-200" },
    orange: { soft: "bg-orange-50", icon: "text-orange-700", border: "border-orange-200" },
    teal: { soft: "bg-teal-50", icon: "text-teal-700", border: "border-teal-200" },
    violet: { soft: "bg-violet-50", icon: "text-violet-700", border: "border-violet-200" },
};

export function generateStaticParams() {
    return GPT_SITE_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const guide = getGptSiteGuide(params.slug);
    if (!guide) return { title: "GPT Site Guide Not Found | EarnGrind" };

    const path = `/guides/best-gpt-sites/${guide.slug}`;
    const imageUrl = absoluteUrl(guide.screenshot);

    return {
        title: guide.title,
        description: guide.description,
        alternates: { canonical: absoluteUrl(path) },
        robots: guide.status === "draft" ? { index: false, follow: false } : undefined,
        openGraph: {
            title: guide.title,
            description: guide.description,
            url: absoluteUrl(path),
            type: "article",
            images: [{ url: imageUrl, alt: `${guide.name} website screenshot` }],
        },
        twitter: {
            card: "summary_large_image",
            title: guide.title,
            description: guide.description,
            images: [imageUrl],
        },
    };
}

function JsonLd({ guide }: { guide: GptSiteGuide }) {
    const pageUrl = absoluteUrl(`/guides/best-gpt-sites/${guide.slug}`);
    const article = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        url: pageUrl,
        mainEntityOfPage: pageUrl,
        datePublished: guide.updatedAt,
        dateModified: guide.updatedAt,
        image: absoluteUrl(guide.screenshot),
        author: { "@type": "Organization", name: "EarnGrind" },
        publisher: { "@type": "Organization", name: "EarnGrind" },
    };
    const faq = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: guide.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
    };
    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Best GPT Sites", item: absoluteUrl("/best-gpt-sites") },
            { "@type": "ListItem", position: 3, name: "Site Guides", item: absoluteUrl("/guides/best-gpt-sites") },
            { "@type": "ListItem", position: 4, name: guide.name, item: pageUrl },
        ],
    };

    return (
        <>
            {[article, faq, breadcrumb].map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
        </>
    );
}

function BulletList({
    items,
    icon,
    iconClassName,
}: {
    items: string[];
    icon: "check" | "warn" | "step";
    iconClassName: string;
}) {
    const Icon = icon === "warn" ? AlertTriangle : icon === "step" ? ClipboardCheck : CheckCircle2;
    return (
        <ul className="space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
            {items.map((item) => (
                <li key={item} className="flex gap-3">
                    <Icon className={`mt-0.5 h-5 w-5 flex-none ${iconClassName}`} aria-hidden="true" />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

export default function GptSiteGuidePage({ params }: { params: { slug: string } }) {
    const guide = getGptSiteGuide(params.slug);
    if (!guide) notFound();

    const accent = accentClasses[guide.accent] ?? accentClasses.green;
    const trackedHref = getGptSiteTrackedHref(guide, `gpt_site_guide_${guide.slug}_primary`);
    const primaryCtaHref = guide.primaryCtaHref ?? trackedHref;
    const primaryCtaLabel = guide.primaryCtaLabel ?? `Start ${guide.name}`;
    const sidebarCtaHref = guide.sidebarCtaHref ?? primaryCtaHref;
    const sidebarCtaLabel = guide.sidebarCtaLabel ?? `Open ${guide.name}`;
    const relatedGuides = getPublishedGptSiteGuides().filter((item) => item.slug !== guide.slug).slice(0, 3);
    const featureAudits = getGptSiteFeatureAudits(guide.slug);
    const navigationAudit = getGptSiteNavigationAudit(guide.slug);
    const readerInterests = getGptSiteReaderInterests(guide.slug);
    const bottomSignupHref = getGptSiteTrackedHref(guide, `gpt_site_guide_${guide.slug}_bottom_recap`);
    const hasContextualArticle = Boolean(guide.contextualArticleHtml);

    if (guide.slug === "earnlab" && guide.contextualArticleHtml) {
        const tocLinks = [
            ["#executive-summary", "Executive summary"],
            ["#platform-overview-and-economic-model", "Platform overview and economic model"],
            ["#earning-through-offers-and-surveys", "Earning through offers and surveys"],
            ["#original-games-and-race-mechanics", "Original games and race mechanics"],
            ["#wallets-rewards-and-withdrawals", "Wallets, rewards, and withdrawals"],
            ["#security-fraud-controls-and-legal-considerations", "Security, fraud controls, and legal considerations"],
            ["#practical-playbook-and-faq", "Practical playbook and FAQ"],
        ];
        const pills = ["Earn first, game second", "Offerwalls", "Dual wallet", "Boxes", "Mines", "Keno", "Races", "Rewards & withdrawals"];
        const kpis = [
            ["20+", "Offerwalls / providers discussed"],
            ["98%", "Published Mines RTP referenced"],
            ["1-10", "Keno numbers selected from 1-40"],
            ["$50 / $2,500", "Daily and monthly race examples"],
        ];

        return (
            <main className="earnlab-preview-layout min-h-screen">
                <JsonLd guide={guide} />
                <div className="preview-layout">
                    <aside className="preview-sidebar">
                        <div className="preview-logo">
                            <span className="preview-logo-mark" aria-hidden="true" />
                            <span>EarnLab <span>Guide</span></span>
                        </div>
                        <div className="preview-toc-label">Preview navigation</div>
                        <nav className="preview-toc" aria-label="EarnLab guide sections">
                            {tocLinks.map(([href, label]) => (
                                <a key={href} href={href}>{label}</a>
                            ))}
                        </nav>
                        <div className="preview-source-note">
                            Built from the supplied research draft and the selected real UI-style visuals. The pasted source citation tokens were removed inside the preview for readability.
                        </div>
                    </aside>

                    <div className="preview-article">
                        <header className="preview-cover">
                            <div className="preview-eyebrow">Contextual HTML preview</div>
                            <h1>EarnLab Guide for <span>Offers Plus Original Games</span></h1>
                            <p className="preview-lede">
                                A full article preview with the research copy inserted into the guide flow and the selected EarnLab UI-style images placed beside the sections they support.
                            </p>
                            <div className="preview-pills" aria-label="Guide topics">
                                {pills.map((pill) => (
                                    <span key={pill} className="preview-pill">{pill}</span>
                                ))}
                            </div>
                            <div className="preview-kpi-row">
                                {kpis.map(([value, label]) => (
                                    <div key={label} className="preview-kpi">
                                        <strong>{value}</strong>
                                        <span>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </header>

                        <article
                            className="preview-article-body"
                            dangerouslySetInnerHTML={{ __html: guide.contextualArticleHtml }}
                        />
                    </div>
                </div>
                <style dangerouslySetInnerHTML={{ __html: `
                    .earnlab-preview-layout {
                        --preview-bg: var(--surface-muted);
                        --preview-bg-2: #eefdfa;
                        --preview-panel: #0b1626;
                        --preview-panel-2: #101d31;
                        --preview-line: rgba(41, 221, 204, 0.28);
                        --preview-line-2: rgba(255, 255, 255, 0.09);
                        --preview-text: #f6f9ff;
                        --preview-muted: #a9b8cc;
                        --preview-soft: #d5e0f0;
                        --preview-teal: #29ddcc;
                        --preview-teal-2: #73f7e8;
                        --preview-blue: #0f83ff;
                        background:
                            radial-gradient(circle at 50% -12%, rgba(41, 221, 204, 0.16), transparent 34%),
                            linear-gradient(180deg, #eefdfa 0%, var(--surface-muted) 28%, var(--surface-muted) 100%);
                        color: var(--preview-text);
                        overflow-x: clip;
                        padding: 28px 0 80px;
                    }
                    .preview-layout {
                        display: grid;
                        gap: 30px;
                        grid-template-columns: 280px minmax(0, 1fr);
                        margin: 0 auto;
                        max-width: 1380px;
                        padding: 0 26px;
                    }
                    .preview-sidebar {
                        align-self: start;
                        backdrop-filter: blur(14px);
                        background: rgba(8, 18, 32, 0.72);
                        border: 1px solid var(--preview-line);
                        border-radius: 22px;
                        box-shadow: 0 20px 70px rgba(0, 0, 0, 0.3);
                        max-height: calc(100vh - 116px);
                        overflow-y: auto;
                        padding: 18px;
                        position: sticky;
                        top: 92px;
                        z-index: 20;
                    }
                    .preview-logo {
                        align-items: center;
                        display: flex;
                        font-size: 22px;
                        font-weight: 900;
                        gap: 10px;
                        letter-spacing: -0.03em;
                        margin-bottom: 18px;
                    }
                    .preview-logo span span,
                    .preview-cover h1 span,
                    .preview-article-body h2 em {
                        color: var(--preview-teal);
                        font-style: normal;
                    }
                    .preview-logo-mark {
                        background: linear-gradient(135deg, var(--preview-teal), var(--preview-blue));
                        border-radius: 9px;
                        box-shadow: 0 0 30px rgba(41, 221, 204, 0.28);
                        height: 30px;
                        position: relative;
                        width: 30px;
                    }
                    .preview-logo-mark:after {
                        border: 2px solid rgba(255, 255, 255, 0.85);
                        border-radius: 4px;
                        content: "";
                        inset: 8px;
                        position: absolute;
                    }
                    .preview-toc-label {
                        color: var(--preview-muted);
                        font-size: 12px;
                        font-weight: 800;
                        letter-spacing: 0.14em;
                        margin: 4px 0 10px;
                        text-transform: uppercase;
                    }
                    .preview-toc a {
                        border: 1px solid transparent;
                        border-radius: 12px;
                        color: #d7e5f7;
                        display: block;
                        font-size: 14px;
                        padding: 10px 12px;
                    }
                    .preview-toc a:hover {
                        background: rgba(41, 221, 204, 0.08);
                        border-color: rgba(41, 221, 204, 0.18);
                        text-decoration: none;
                    }
                    .preview-source-note {
                        background: rgba(41, 221, 204, 0.06);
                        border: 1px solid rgba(41, 221, 204, 0.16);
                        border-radius: 16px;
                        color: var(--preview-muted);
                        font-size: 13px;
                        line-height: 1.55;
                        margin-top: 16px;
                        padding: 14px;
                    }
                    .preview-article {
                        min-width: 0;
                    }
                    .preview-cover {
                        background: linear-gradient(180deg, rgba(13, 28, 49, 0.84), rgba(5, 11, 20, 0.96));
                        border: 1px solid var(--preview-line);
                        border-radius: 32px;
                        box-shadow: 0 30px 120px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
                        overflow: hidden;
                        padding: 38px;
                    }
                    .preview-eyebrow {
                        color: var(--preview-teal);
                        font-size: 13px;
                        font-weight: 900;
                        letter-spacing: 0.15em;
                        text-transform: uppercase;
                    }
                    .preview-cover h1 {
                        color: var(--preview-text);
                        font-size: clamp(48px, 7vw, 96px);
                        font-weight: 900;
                        letter-spacing: -0.065em;
                        line-height: 0.92;
                        margin: 12px 0 18px;
                    }
                    .preview-lede {
                        color: var(--preview-muted);
                        font-size: 20px;
                        line-height: 1.66;
                        margin: 0 0 22px;
                        max-width: 860px;
                    }
                    .preview-pills {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        margin: 22px 0 0;
                    }
                    .preview-pill {
                        align-items: center;
                        background: rgba(41, 221, 204, 0.07);
                        border: 1px solid rgba(41, 221, 204, 0.24);
                        border-radius: 999px;
                        color: #e2fffc;
                        display: inline-flex;
                        font-size: 14px;
                        font-weight: 700;
                        gap: 8px;
                        padding: 9px 13px;
                    }
                    .preview-kpi-row {
                        display: grid;
                        gap: 12px;
                        grid-template-columns: repeat(4, 1fr);
                        margin-top: 22px;
                    }
                    .preview-kpi {
                        background: rgba(3, 8, 18, 0.44);
                        border: 1px solid var(--preview-line);
                        border-radius: 18px;
                        padding: 15px;
                    }
                    .preview-kpi strong {
                        color: #fff;
                        display: block;
                        font-size: 22px;
                        font-weight: 900;
                        letter-spacing: -0.02em;
                    }
                    .preview-kpi span {
                        color: var(--preview-muted);
                        font-size: 13px;
                        line-height: 1.35;
                    }
                    .preview-article-body {
                        margin-top: 28px;
                    }
                    .preview-article-body > h2,
                    .preview-article-body > h3 {
                        scroll-margin-top: 98px;
                    }
                    .preview-article-body h2 {
                        border-top: 1px solid var(--border-default);
                        color: var(--brand-ink);
                        font-size: clamp(34px, 4vw, 54px);
                        font-weight: 900;
                        letter-spacing: -0.055em;
                        line-height: 1.02;
                        margin: 54px 0 14px;
                        padding-top: 20px;
                    }
                    .preview-article-body h3 {
                        color: var(--brand-ink);
                        font-size: clamp(26px, 2.6vw, 36px);
                        font-weight: 900;
                        letter-spacing: -0.035em;
                        line-height: 1.14;
                        margin: 38px 0 12px;
                    }
                    .preview-article-body p,
                    .preview-article-body li {
                        color: var(--text-secondary);
                        font-size: 17px;
                        line-height: 1.66;
                    }
                    .preview-article-body p {
                        margin: 0 0 18px;
                    }
                    .preview-article-body strong {
                        color: var(--brand-ink);
                        font-weight: 800;
                    }
                    .preview-article-body a {
                        color: var(--preview-teal-2);
                    }
                    .preview-article-body ul,
                    .preview-article-body ol {
                        padding-left: 24px;
                    }
                    .preview-article-body li {
                        margin: 8px 0;
                    }
                    .preview-article-body figure {
                        margin: 22px 0 28px;
                    }
                    .preview-article-body figure img {
                        border: 1px solid rgba(41, 221, 204, 0.28);
                        border-radius: 22px;
                        box-shadow: 0 24px 70px rgba(13, 13, 18, 0.16), 0 0 0 1px rgba(255, 255, 255, 0.7) inset;
                        display: block;
                        height: auto;
                        width: 100%;
                    }
                    .preview-article-body figcaption {
                        color: var(--text-tertiary);
                        font-size: 13px;
                        font-weight: 600;
                        line-height: 1.5;
                        margin-top: 10px;
                    }
                    .preview-article-body .image-pair {
                        display: grid;
                        gap: 18px;
                        grid-template-columns: 1fr 1fr;
                        margin: 22px 0 30px;
                    }
                    .preview-article-body .image-pair figure {
                        margin: 0;
                    }
                    .preview-article-body table {
                        background: var(--surface-card);
                        border: 1px solid var(--preview-line);
                        border-collapse: separate;
                        border-radius: 18px;
                        border-spacing: 0;
                        display: block;
                        margin: 20px 0 28px;
                        max-width: 100%;
                        overflow: hidden;
                        overflow-x: auto;
                        width: 100%;
                    }
                    .preview-article-body th,
                    .preview-article-body td {
                        border-bottom: 1px solid var(--border-default);
                        border-right: 1px solid var(--border-default);
                        min-width: 150px;
                        padding: 14px 15px;
                        text-align: left;
                        vertical-align: top;
                    }
                    .preview-article-body th {
                        background: #ccfbf1;
                        color: var(--brand-ink);
                        font-size: 14px;
                        font-weight: 900;
                        letter-spacing: 0.06em;
                        text-transform: uppercase;
                    }
                    .preview-article-body td {
                        color: var(--text-secondary);
                        font-size: 15px;
                        line-height: 1.66;
                    }
                    .preview-article-body tr:last-child td {
                        border-bottom: none;
                    }
                    .preview-article-body th:last-child,
                    .preview-article-body td:last-child {
                        border-right: none;
                    }
                    .preview-article-body .diagram-block {
                        background: linear-gradient(180deg, rgba(240, 253, 250, 0.9), rgba(255, 255, 255, 0.95));
                        border: 1px solid var(--preview-line);
                        border-radius: 22px;
                        margin: 24px 0 30px;
                        padding: 18px;
                    }
                    .preview-article-body .diagram-title {
                        color: var(--brand-ink);
                        font-size: 13px;
                        font-weight: 900;
                        letter-spacing: 0.1em;
                        margin-bottom: 14px;
                        text-transform: uppercase;
                    }
                    .preview-article-body .flow-grid {
                        display: grid;
                        gap: 12px;
                        grid-template-columns: repeat(5, 1fr);
                    }
                    .preview-article-body .flow-card {
                        background: #ffffff;
                        border: 1px solid rgba(41, 221, 204, 0.18);
                        border-radius: 16px;
                        padding: 14px;
                    }
                    .preview-article-body .flow-card span {
                        background: linear-gradient(135deg, var(--preview-teal), var(--preview-blue));
                        border-radius: 10px;
                        color: #fff;
                        display: inline-grid;
                        font-size: 14px;
                        font-weight: 900;
                        height: 30px;
                        margin-bottom: 10px;
                        place-items: center;
                        width: 30px;
                    }
                    .preview-article-body .flow-card strong {
                        display: block;
                        font-size: 15px;
                        margin-bottom: 5px;
                    }
                    .preview-article-body .flow-card p {
                        color: var(--text-secondary);
                        font-size: 13px;
                        line-height: 1.5;
                        margin: 0;
                    }
                    .preview-article-body .formula {
                        background: #ffffff;
                        border: 1px solid var(--preview-line);
                        border-radius: 18px;
                        color: var(--brand-ink);
                        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
                        font-size: 15px;
                        margin: 18px 0 24px;
                        overflow-x: auto;
                        padding: 18px;
                    }
                    @media (max-width: 1120px) {
                        .preview-layout {
                            grid-template-columns: 1fr;
                        }
                        .preview-sidebar {
                            max-height: calc(100vh - 92px);
                            top: 72px;
                        }
                    }
                    @media (max-width: 760px) {
                        .earnlab-preview-layout {
                            padding-top: 18px;
                        }
                        .preview-layout {
                            padding: 0 14px 60px;
                        }
                        .preview-sidebar {
                            max-height: calc(100dvh - 76px);
                            top: 62px;
                        }
                        .preview-cover {
                            border-radius: 24px;
                            padding: 24px;
                        }
                        .preview-kpi-row,
                        .preview-article-body .image-pair {
                            grid-template-columns: 1fr;
                        }
                        .preview-article-body .flow-grid {
                            grid-template-columns: 1fr;
                        }
                        .preview-article-body p,
                        .preview-article-body li {
                            font-size: 16px;
                        }
                    }
                ` }} />
            </main>
        );
    }

    return (
        <main className="min-h-screen overflow-x-hidden bg-[var(--surface-muted)] pb-24 pt-8 sm:pt-10">
            <JsonLd guide={guide} />
            <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 sm:px-6 lg:px-8">
                <section className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white shadow-[var(--shadow-card)]">
                    <div className="p-5 sm:p-6 lg:p-8">
                        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--text-tertiary)]">
                            <Link href="/" className="hover:text-[var(--brand-ink)]">Home</Link>
                            <span>/</span>
                            <Link href="/best-gpt-sites" className="hover:text-[var(--brand-ink)]">Best GPT Sites</Link>
                            <span>/</span>
                            <Link href="/guides/best-gpt-sites" className="hover:text-[var(--brand-ink)]">Site Guides</Link>
                            <span>/</span>
                            <span className="text-[var(--brand-ink)]">{guide.name}</span>
                        </nav>
                        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)] lg:items-center xl:gap-10">
                            <div className="min-w-0">
                                <p className="section-label">{guide.bestFor}</p>
                                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl lg:text-5xl">
                                    {guide.title}
                                </h1>
                                <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)] lg:text-lg lg:leading-8">
                                    {guide.description}
                                </p>
                                <div className="mt-5 flex flex-wrap gap-2">
                                    <Link
                                        href={primaryCtaHref}
                                        prefetch={false}
                                        className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-ink)] px-5 py-3 text-sm font-extrabold text-[var(--brand-lime)] transition hover:-translate-y-0.5"
                                    >
                                        {primaryCtaLabel}
                                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                    </Link>
                                    <Link
                                        href="/best-gpt-sites"
                                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-white px-5 py-3 text-sm font-extrabold text-[var(--brand-ink)] hover:border-lime-400"
                                    >
                                        Compare all GPT sites
                                    </Link>
                                </div>
                            </div>
                            <div className={`min-w-0 rounded-2xl border ${accent.border} ${accent.soft} p-3 sm:p-4`}>
                                <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-white shadow-sm">
                                    <Image
                                        src={guide.screenshot}
                                        alt={`${guide.name} website screenshot captured for this EarnGrind guide`}
                                        fill
                                        priority
                                        sizes="(min-width: 1280px) 480px, (min-width: 1024px) 38vw, 100vw"
                                        className="object-cover"
                                />
                            </div>
                            <p className="mt-3 text-xs font-semibold text-[var(--text-tertiary)]">
                                {guide.screenshotCaption ?? `Public ${guide.name} page shown for context. Verify live terms before signing up.`}
                            </p>
                        </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        [Gift, "Reward style", guide.payoutStyle],
                        [Target, "Best fit", guide.accountFit],
                        [ListChecks, "Cashout note", guide.minimumCashout],
                        [ShieldCheck, "Rewards", guide.rewardOptions],
                    ].map(([Icon, label, value]) => {
                        const CardIcon = Icon as typeof Gift;
                        return (
                            <div key={label as string} className="rounded-2xl border border-[var(--border-default)] bg-white p-4 shadow-[var(--shadow-card)]">
                                <CardIcon className={`mb-3 h-5 w-5 ${accent.icon}`} aria-hidden="true" />
                                <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--text-tertiary)]">{label as string}</p>
                                <p className="mt-2 text-sm font-bold leading-6 text-[var(--brand-ink)]">{value as string}</p>
                            </div>
                        );
                    })}
                </section>

                <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
                    <article className="min-w-0 space-y-6">
                        <div className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                            <p className="section-label">Quick verdict</p>
                            <h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-ink)]">Is {guide.name} worth using?</h2>
                            <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">{guide.verdict}</p>
                        </div>

                        {readerInterests.length > 0 ? (
                            <section className={`rounded-2xl border ${accent.border} ${accent.soft} p-5 shadow-[var(--shadow-card)] sm:p-6`}>
                                <p className="section-label">What people check first</p>
                                <h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-ink)]">
                                    Questions this {guide.name} guide answers
                                </h2>
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    {readerInterests.map((interest) => (
                                        <div key={interest} className="rounded-xl border border-white/70 bg-white/70 p-3 text-sm font-extrabold text-[var(--brand-ink)]">
                                            {interest}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        {guide.contextualArticleHtml ? (
                            <section className={`overflow-hidden rounded-2xl border ${accent.border} bg-white shadow-[var(--shadow-card)]`}>
                                <div
                                    className="earnlab-contextual-guide p-5 sm:p-6 lg:p-8"
                                    dangerouslySetInnerHTML={{ __html: guide.contextualArticleHtml }}
                                />
                                <style dangerouslySetInnerHTML={{ __html: `
                                    .earnlab-contextual-guide {
                                        --earnlab-accent: #0f766e;
                                        --earnlab-accent-soft: #ccfbf1;
                                        --earnlab-accent-line: #99f6e4;
                                        color: var(--text-secondary);
                                    }
                                    .earnlab-contextual-guide h2 {
                                        border-top: 1px solid var(--border-default);
                                        color: var(--brand-ink);
                                        font-size: clamp(1.75rem, 3vw, 2.6rem);
                                        font-weight: 900;
                                        letter-spacing: -0.025em;
                                        line-height: 1.05;
                                        margin-top: 2.25rem;
                                        padding-top: 1.5rem;
                                    }
                                    .earnlab-contextual-guide h2:first-child {
                                        border-top: 0;
                                        margin-top: 0;
                                        padding-top: 0;
                                    }
                                    .earnlab-contextual-guide h3 {
                                        color: var(--brand-ink);
                                        font-size: clamp(1.35rem, 2vw, 1.9rem);
                                        font-weight: 900;
                                        letter-spacing: -0.015em;
                                        line-height: 1.15;
                                        margin-top: 2rem;
                                    }
                                    .earnlab-contextual-guide p,
                                    .earnlab-contextual-guide li,
                                    .earnlab-contextual-guide td {
                                        color: var(--text-secondary);
                                        font-size: 0.98rem;
                                        line-height: 1.75;
                                    }
                                    .earnlab-contextual-guide p {
                                        margin-top: 1rem;
                                    }
                                    .earnlab-contextual-guide strong {
                                        color: var(--brand-ink);
                                        font-weight: 800;
                                    }
                                    .earnlab-contextual-guide figure {
                                        margin: 1.25rem 0 1.75rem;
                                    }
                                    .earnlab-contextual-guide img {
                                        border: 1px solid var(--earnlab-accent-line);
                                        border-radius: 1rem;
                                        box-shadow: 0 18px 50px rgba(15, 118, 110, 0.16);
                                        display: block;
                                        height: auto;
                                        width: 100%;
                                    }
                                    .earnlab-contextual-guide figcaption {
                                        color: var(--text-tertiary);
                                        font-size: 0.82rem;
                                        font-weight: 700;
                                        line-height: 1.5;
                                        margin-top: 0.65rem;
                                    }
                                    .earnlab-contextual-guide table {
                                        border: 1px solid var(--earnlab-accent-line);
                                        border-collapse: separate;
                                        border-radius: 0.9rem;
                                        border-spacing: 0;
                                        display: block;
                                        margin: 1rem 0 1.5rem;
                                        max-width: 100%;
                                        overflow-x: auto;
                                    }
                                    .earnlab-contextual-guide th,
                                    .earnlab-contextual-guide td {
                                        border-bottom: 1px solid var(--border-default);
                                        border-right: 1px solid var(--border-default);
                                        min-width: 160px;
                                        padding: 0.85rem 0.95rem;
                                        text-align: left;
                                        vertical-align: top;
                                    }
                                    .earnlab-contextual-guide th {
                                        background: var(--earnlab-accent-soft);
                                        color: var(--brand-ink);
                                        font-size: 0.78rem;
                                        font-weight: 900;
                                        letter-spacing: 0.04em;
                                        text-transform: uppercase;
                                    }
                                    .earnlab-contextual-guide tr:last-child td {
                                        border-bottom: 0;
                                    }
                                    .earnlab-contextual-guide th:last-child,
                                    .earnlab-contextual-guide td:last-child {
                                        border-right: 0;
                                    }
                                    .earnlab-contextual-guide ol,
                                    .earnlab-contextual-guide ul {
                                        margin: 1rem 0 1.25rem;
                                        padding-left: 1.35rem;
                                    }
                                    .earnlab-contextual-guide .diagram-block {
                                        border: 1px solid var(--earnlab-accent-line);
                                        border-radius: 1rem;
                                        background: linear-gradient(180deg, #f0fdfa, #ffffff);
                                        margin: 1rem 0 1.5rem;
                                        padding: 1rem;
                                    }
                                    .earnlab-contextual-guide .diagram-title {
                                        color: var(--brand-ink);
                                        font-size: 0.8rem;
                                        font-weight: 900;
                                        letter-spacing: 0.08em;
                                        margin-bottom: 0.8rem;
                                        text-transform: uppercase;
                                    }
                                    .earnlab-contextual-guide .flow-grid {
                                        display: grid;
                                        gap: 0.75rem;
                                        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
                                    }
                                    .earnlab-contextual-guide .flow-card {
                                        border: 1px solid rgba(15, 118, 110, 0.18);
                                        border-radius: 0.75rem;
                                        background: white;
                                        padding: 0.85rem;
                                    }
                                    .earnlab-contextual-guide .flow-card span {
                                        align-items: center;
                                        background: var(--earnlab-accent);
                                        border-radius: 999px;
                                        color: white;
                                        display: inline-flex;
                                        font-size: 0.75rem;
                                        font-weight: 900;
                                        height: 1.5rem;
                                        justify-content: center;
                                        margin-bottom: 0.65rem;
                                        width: 1.5rem;
                                    }
                                    .earnlab-contextual-guide .flow-card strong {
                                        display: block;
                                    }
                                    .earnlab-contextual-guide .flow-card p {
                                        font-size: 0.88rem;
                                        line-height: 1.55;
                                        margin-top: 0.35rem;
                                    }
                                    .earnlab-contextual-guide .formula {
                                        border: 1px solid var(--earnlab-accent-line);
                                        border-radius: 0.85rem;
                                        background: #f8fffd;
                                        color: var(--brand-ink);
                                        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
                                        font-size: 0.95rem;
                                        margin: 1rem 0 1.5rem;
                                        overflow-x: auto;
                                        padding: 1rem;
                                    }
                                ` }} />
                            </section>
                        ) : null}

                        {!hasContextualArticle && guide.articleSections?.length ? (
                            <section className="space-y-4">
                                {guide.articleSections.map((section) => (
                                    <section key={section.title} className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                                        {section.eyebrow ? (
                                            <p className="section-label">{section.eyebrow}</p>
                                        ) : null}
                                        <h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-ink)]">{section.title}</h2>
                                        <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
                                            {section.body.map((paragraph) => (
                                                <p key={paragraph}>{paragraph}</p>
                                            ))}
                                        </div>
                                        {section.bullets?.length ? (
                                            <div className="mt-4">
                                                <BulletList items={section.bullets} icon="check" iconClassName={accent.icon} />
                                            </div>
                                        ) : null}
                                        {section.callout ? (
                                            <p className="mt-4 rounded-xl border border-lime-200 bg-lime-50 p-4 text-sm font-semibold leading-6 text-[var(--brand-ink)]">
                                                {section.callout}
                                            </p>
                                        ) : null}
                                        {section.cta ? (
                                            <Link
                                                href={section.cta.href}
                                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-ink)] px-5 py-3 text-sm font-extrabold text-[var(--brand-lime)] transition hover:-translate-y-0.5"
                                            >
                                                {section.cta.label}
                                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                            </Link>
                                        ) : null}
                                    </section>
                                ))}
                            </section>
                        ) : null}

                        {!hasContextualArticle && navigationAudit ? (
                            <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <p className="section-label">Site layout</p>
                                        <h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-ink)]">
                                            How {guide.name} is organized
                                        </h2>
                                        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                                            {navigationAudit.standout}
                                        </p>
                                        {navigationAudit.gatedNote ? (
                                            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-800">
                                                {navigationAudit.gatedNote}
                                            </p>
                                        ) : null}
                                    </div>
                                    <Compass className={`h-8 w-8 flex-none ${accent.icon}`} aria-hidden="true" />
                                </div>
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {navigationAudit.primary.map((item) => (
                                        <span key={item} className={`rounded-full border ${accent.border} ${accent.soft} px-3 py-1.5 text-xs font-extrabold text-[var(--brand-ink)]`}>
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        {!hasContextualArticle && featureAudits.length > 0 && guide.compactEvidence ? (
                            <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                                <div className="flex items-start gap-3">
                                    <Camera className={`mt-1 h-6 w-6 flex-none ${accent.icon}`} aria-hidden="true" />
                                    <div>
                                        <p className="section-label">Supporting evidence</p>
                                        <h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-ink)]">
                                            {guide.evidenceTitle ?? `Public ${guide.name} pages worth checking`}
                                        </h2>
                                        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                                            {guide.evidenceIntro ?? "These public pages support the guide, but live terms can change."}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-5 grid gap-4 md:grid-cols-2">
                                    {featureAudits.map((feature) => (
                                        <details key={feature.title} className="group rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
                                            <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                                                <span>
                                                    <span className={`block text-xs font-extrabold uppercase tracking-wide ${accent.icon}`}>{feature.eyebrow}</span>
                                                    <span className="mt-1 block font-extrabold text-[var(--brand-ink)]">{feature.title}</span>
                                                </span>
                                                <ArrowRight className="mt-1 h-4 w-4 flex-none text-[var(--text-tertiary)] transition group-open:rotate-90" aria-hidden="true" />
                                            </summary>
                                            <div className="mt-4 space-y-4">
                                                <div className="relative aspect-[16/9] max-h-[300px] overflow-hidden rounded-lg bg-white p-2">
                                                    <Image
                                                        src={feature.image}
                                                        alt={feature.imageAlt}
                                                        fill
                                                        sizes="(min-width: 768px) 45vw, 100vw"
                                                        className="object-contain p-2"
                                                    />
                                                </div>
                                                <p className="text-sm leading-6 text-[var(--text-secondary)]">{feature.summary}</p>
                                                <div className="rounded-lg border border-white bg-white p-3">
                                                    <BulletList items={feature.mechanics} icon="check" iconClassName={accent.icon} />
                                                </div>
                                                <p className="rounded-lg border border-lime-200 bg-lime-50 p-3 text-sm font-semibold leading-6 text-[var(--brand-ink)]">
                                                    {feature.readerValue}
                                                </p>
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </section>
                        ) : !hasContextualArticle && featureAudits.length > 0 ? (
                            <section className="space-y-4">
                                <div className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                                    <div className="flex items-start gap-3">
                                        <Camera className={`mt-1 h-6 w-6 flex-none ${accent.icon}`} aria-hidden="true" />
                                        <div>
                                            <p className="section-label">Public screenshots</p>
                                            <h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-ink)]">
                                                The parts of {guide.name} people actually want to inspect
                                            </h2>
                                            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                                                These are browser-captured public screens and feature pages, paired with the practical details that determine whether the site is worth your time.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {featureAudits.map((feature, index) => (
                                    <article
                                        key={feature.title}
                                        className={`overflow-hidden rounded-2xl border ${index === 0 ? accent.border : "border-[var(--border-default)]"} bg-white shadow-[var(--shadow-card)]`}
                                    >
                                        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
                                            <div className={`${accent.soft} min-w-0 border-b border-[var(--border-default)] xl:self-start xl:border-b-0 xl:border-r`}>
                                                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto p-3 sm:p-4">
                                                    {(feature.gallery ?? [{ image: feature.image, imageAlt: feature.imageAlt, caption: feature.eyebrow }]).map((item) => (
                                                        <figure key={item.image} className="min-w-full snap-center">
                                                            <div className="relative aspect-[16/10] min-h-[190px] max-h-[470px] overflow-hidden rounded-xl border border-white/80 bg-white shadow-sm sm:min-h-[320px] lg:min-h-[360px]">
                                                                <Image
                                                                    src={item.image}
                                                                    alt={item.imageAlt}
                                                                    fill
                                                                    sizes="(min-width: 1024px) 45vw, 100vw"
                                                                    className="object-contain p-3 sm:p-4"
                                                                />
                                                            </div>
                                                            <figcaption className="mt-2 text-xs font-semibold leading-5 text-[var(--text-secondary)]">
                                                                {item.caption}
                                                            </figcaption>
                                                        </figure>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="min-w-0 p-5 sm:p-6 xl:p-7">
                                                <p className={`text-xs font-extrabold uppercase tracking-wide ${accent.icon}`}>{feature.eyebrow}</p>
                                                <h3 className="mt-2 text-2xl font-extrabold text-[var(--brand-ink)]">{feature.title}</h3>
                                                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{feature.summary}</p>
                                                <div className="mt-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
                                                    <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-[var(--text-tertiary)]">
                                                        <Sparkles className={`h-4 w-4 ${accent.icon}`} aria-hidden="true" />
                                                        Mechanics to know
                                                    </p>
                                                    <BulletList items={feature.mechanics} icon="check" iconClassName={accent.icon} />
                                                </div>
                                                <p className="mt-4 rounded-xl border border-lime-200 bg-lime-50 p-4 text-sm font-semibold leading-6 text-[var(--brand-ink)]">
                                                    {feature.readerValue}
                                                </p>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </section>
                        ) : null}

                        {!hasContextualArticle ? (
                            <>
                                <div className="grid gap-6 lg:grid-cols-2">
                                    <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
                                        <h2 className="text-xl font-extrabold text-[var(--brand-ink)]">Where {guide.name} is strong</h2>
                                        <div className="mt-4">
                                            <BulletList items={guide.strengths} icon="check" iconClassName={accent.icon} />
                                        </div>
                                    </section>
                                    <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-[var(--shadow-card)]">
                                        <h2 className="text-xl font-extrabold text-[var(--brand-ink)]">What to verify first</h2>
                                        <div className="mt-4">
                                            <BulletList items={guide.watchouts} icon="warn" iconClassName="text-amber-600" />
                                        </div>
                                    </section>
                                </div>

                                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(280px,0.82fr)]">
                                    <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                                        <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Best {guide.name} strategy</h2>
                                        <div className="mt-4">
                                            <BulletList items={guide.strategy} icon="step" iconClassName={accent.icon} />
                                        </div>
                                    </section>

                                    <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                                        <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">{guide.name} earning modes</h2>
                                        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                                            {guide.earningModes.map((mode) => (
                                                <span key={mode} className={`rounded-lg border ${accent.border} ${accent.soft} px-3 py-2 text-sm font-bold text-[var(--brand-ink)]`}>
                                                    {mode}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                                    <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">{guide.name} FAQ</h2>
                                    <div className="mt-4 divide-y divide-[var(--border-default)]">
                                        {guide.faq.map((item) => (
                                            <details key={item.question} className="group py-4">
                                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-extrabold text-[var(--brand-ink)]">
                                                    {item.question}
                                                    <ArrowRight className="h-4 w-4 flex-none text-[var(--text-tertiary)] transition group-open:rotate-90" aria-hidden="true" />
                                                </summary>
                                                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{item.answer}</p>
                                            </details>
                                        ))}
                                    </div>
                                </section>
                            </>
                        ) : null}

                        <section className={`rounded-2xl border ${accent.border} ${accent.soft} p-5 shadow-[var(--shadow-card)] sm:p-6`}>
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="section-label">Ready to try it?</p>
                                    <h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-ink)]">
                                        Join {guide.name} after checking the terms
                                    </h2>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                                        Use the tracked EarnGrind route so signup clicks, platform choice, and guide context stay connected.
                                    </p>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2 md:flex md:flex-none">
                                    <Link
                                        href="/best-gpt-sites"
                                        className="inline-flex items-center justify-center rounded-xl border border-white/80 bg-white px-4 py-3 text-sm font-extrabold text-[var(--brand-ink)] transition hover:border-lime-400"
                                    >
                                        Compare first
                                    </Link>
                                    <Link
                                        href={bottomSignupHref}
                                        prefetch={false}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-ink)] px-4 py-3 text-sm font-extrabold text-[var(--brand-lime)] transition hover:-translate-y-0.5"
                                    >
                                        Join {guide.name}
                                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                    </Link>
                                </div>
                            </div>
                        </section>

                        {guide.sourcesPlacement === "bottom" ? (
                            <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                                <details className="group">
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-extrabold text-[var(--brand-ink)]">
                                        Sources checked
                                        <ArrowRight className="h-4 w-4 flex-none text-[var(--text-tertiary)] transition group-open:rotate-90" aria-hidden="true" />
                                    </summary>
                                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                                        These are the public pages behind the main claims above. Live offers, rewards, survey inventory, and account-specific availability can change.
                                    </p>
                                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                        {guide.sources.map((source) => (
                                            <a
                                                key={source.href}
                                                href={source.href}
                                                target="_blank"
                                                rel="noopener noreferrer nofollow"
                                                className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-bold text-[var(--brand-ink)] hover:border-lime-400"
                                            >
                                                <span>{source.label}</span>
                                                <ExternalLink className="mt-0.5 h-4 w-4 flex-none text-[var(--text-tertiary)]" aria-hidden="true" />
                                            </a>
                                        ))}
                                    </div>
                                    <p className="mt-3 text-xs leading-5 text-[var(--text-tertiary)]">
                                        Source review date: {guide.updatedAt}.
                                    </p>
                                </details>
                            </section>
                        ) : null}
                    </article>

                    <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
                        <section className={`rounded-2xl border ${accent.border} ${accent.soft} p-5`}>
                            <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--text-tertiary)]">Recommended next step</p>
                            <h2 className="mt-2 text-xl font-extrabold text-[var(--brand-ink)]">Check the live {guide.name} terms</h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                Offers, cashout thresholds, country rules, and tracking requirements can change. Read the live terms before installing or depositing time into an offer.
                            </p>
                            <Link
                                href={sidebarCtaHref}
                                prefetch={false}
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-ink)] px-4 py-3 text-sm font-extrabold text-[var(--brand-lime)]"
                            >
                                {sidebarCtaLabel}
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        </section>

                        {guide.sourcesPlacement !== "bottom" ? (
                            <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
                                <h2 className="font-extrabold text-[var(--brand-ink)]">Research sources</h2>
                                <div className="mt-3 space-y-2">
                                    {guide.sources.map((source) => (
                                        <a
                                            key={source.href}
                                            href={source.href}
                                            target="_blank"
                                            rel="noopener noreferrer nofollow"
                                            className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-bold text-[var(--brand-ink)] hover:border-lime-400"
                                        >
                                            <span>{source.label}</span>
                                            <ExternalLink className="mt-0.5 h-4 w-4 flex-none text-[var(--text-tertiary)]" aria-hidden="true" />
                                        </a>
                                    ))}
                                </div>
                                <p className="mt-3 text-xs leading-5 text-[var(--text-tertiary)]">
                                    Source review date: {guide.updatedAt}. EarnGrind may earn a commission from tracked links.
                                </p>
                            </section>
                        ) : null}

                        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
                            <h2 className="font-extrabold text-[var(--brand-ink)]">More GPT site guides</h2>
                            <div className="mt-3 space-y-2">
                                {relatedGuides.map((item) => (
                                    <Link
                                        key={item.slug}
                                        href={`/guides/best-gpt-sites/${item.slug}`}
                                        className="block rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-bold text-[var(--brand-ink)] hover:border-lime-400"
                                    >
                                        {item.name} Guide
                                    </Link>
                                ))}
                            </div>
                        </section>
                    </aside>
                </section>
            </div>
        </main>
    );
}
