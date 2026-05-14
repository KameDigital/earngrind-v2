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
import Container from "@/components/layout/Container";
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
            { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("/guides") },
            { "@type": "ListItem", position: 3, name: "Best GPT Sites", item: absoluteUrl("/guides/best-gpt-sites") },
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

    return (
        <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
            <JsonLd guide={guide} />
            <Container className="space-y-6">
                <section className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white shadow-[var(--shadow-card)]">
                    <div className="p-5 sm:p-6">
                        <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--text-tertiary)]">
                            <Link href="/" className="hover:text-[var(--brand-ink)]">Home</Link>
                            <span>/</span>
                            <Link href="/guides" className="hover:text-[var(--brand-ink)]">Guides</Link>
                            <span>/</span>
                            <Link href="/guides/best-gpt-sites" className="hover:text-[var(--brand-ink)]">Best GPT Sites</Link>
                            <span>/</span>
                            <span className="text-[var(--brand-ink)]">{guide.name}</span>
                        </nav>
                        <div className="grid gap-7 lg:grid-cols-[1fr_420px] lg:items-center">
                            <div>
                                <p className="section-label">{guide.bestFor}</p>
                                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
                                    {guide.title}
                                </h1>
                                <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">
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
                            <div className={`rounded-2xl border ${accent.border} ${accent.soft} p-3`}>
                                <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-white">
                                    <Image
                                        src={guide.screenshot}
                                        alt={`${guide.name} website screenshot captured for this EarnGrind guide`}
                                        fill
                                        priority
                                        sizes="(min-width: 1024px) 420px, 100vw"
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

                <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
                    <article className="space-y-6">
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
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    {readerInterests.map((interest) => (
                                        <div key={interest} className="rounded-xl border border-white/70 bg-white/70 p-3 text-sm font-extrabold text-[var(--brand-ink)]">
                                            {interest}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        {guide.articleSections?.length ? (
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

                        {navigationAudit ? (
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

                        {featureAudits.length > 0 && guide.compactEvidence ? (
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
                                <div className="mt-5 grid gap-3 md:grid-cols-2">
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
                                                <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-slate-950">
                                                    <Image
                                                        src={feature.image}
                                                        alt={feature.imageAlt}
                                                        fill
                                                        sizes="(min-width: 768px) 45vw, 100vw"
                                                        className="object-contain"
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
                        ) : featureAudits.length > 0 ? (
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
                                        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                                            <div className="bg-slate-950">
                                                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto p-3">
                                                    {(feature.gallery ?? [{ image: feature.image, imageAlt: feature.imageAlt, caption: feature.eyebrow }]).map((item) => (
                                                        <figure key={item.image} className="min-w-full snap-center">
                                                            <div className="relative min-h-[360px] overflow-hidden rounded-xl bg-slate-950 lg:min-h-[430px]">
                                                                <Image
                                                                    src={item.image}
                                                                    alt={item.imageAlt}
                                                                    fill
                                                                    sizes="(min-width: 1024px) 45vw, 100vw"
                                                                    className="object-contain"
                                                                />
                                                            </div>
                                                            <figcaption className="mt-2 text-xs font-semibold leading-5 text-slate-300">
                                                                {item.caption}
                                                            </figcaption>
                                                        </figure>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="p-5 sm:p-6">
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

                        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                            <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Best {guide.name} strategy</h2>
                            <div className="mt-4">
                                <BulletList items={guide.strategy} icon="step" iconClassName={accent.icon} />
                            </div>
                        </section>

                        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                            <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">{guide.name} earning modes</h2>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {guide.earningModes.map((mode) => (
                                    <span key={mode} className={`rounded-lg border ${accent.border} ${accent.soft} px-3 py-2 text-sm font-bold text-[var(--brand-ink)]`}>
                                        {mode}
                                    </span>
                                ))}
                            </div>
                        </section>

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

                    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
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
            </Container>
        </main>
    );
}
