import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Search, ShieldCheck } from "lucide-react";
import Container from "@/components/layout/Container";
import { getPublishedGptSiteGuides } from "@/lib/gpt-site-guides";
import { absoluteUrl } from "@/lib/site-url";

const PAGE_PATH = "/guides/best-gpt-sites";

export const metadata: Metadata = {
    title: "Best GPT Site Guides: Compare Rewards Sites Before You Join",
    description:
        "Detailed EarnGrind guides for comparing rewards sites, public terms, payout fit, offer tracking, and user risks before you join.",
    alternates: { canonical: absoluteUrl(PAGE_PATH) },
};

function JsonLd() {
    const guides = getPublishedGptSiteGuides();
    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Best GPT Sites", item: absoluteUrl("/best-gpt-sites") },
            { "@type": "ListItem", position: 3, name: "Site Guides", item: absoluteUrl(PAGE_PATH) },
        ],
    };
    const itemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Best GPT Site Guides",
        itemListElement: guides.map((guide, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: guide.name,
            url: absoluteUrl(`/best-gpt-sites/${guide.slug}`),
        })),
    };

    return (
        <>
            {[breadcrumb, itemList].map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
        </>
    );
}

export default function BestGptSiteGuidesHubPage() {
    const guides = getPublishedGptSiteGuides();

    return (
        <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
            <JsonLd />
            <Container className="space-y-6">
                <section className="rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)]">
                    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--text-tertiary)]">
                        <Link href="/" className="hover:text-[var(--brand-ink)]">Home</Link>
                        <span>/</span>
                        <Link href="/best-gpt-sites" className="hover:text-[var(--brand-ink)]">Best GPT Sites</Link>
                        <span>/</span>
                        <span className="text-[var(--brand-ink)]">Site Guides</span>
                    </nav>
                    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
                        <div>
                            <p className="section-label">Best GPT site guides</p>
                            <h1 className="mt-2 max-w-4xl text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
                                Compare each GPT site before you give it your time
                            </h1>
                            <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">
                                These guides pair live EarnGrind strategy with official-source research and browser screenshots.
                                Use them to decide where to start, what to verify, and which offers are worth tracking.
                            </p>
                        </div>
                        <div className="grid gap-3 rounded-xl border border-lime-200 bg-lime-50 p-4">
                            {[
                                [Search, "Research-backed", "Official help pages and public site details."],
                                [ShieldCheck, "Risk-aware", "Tracking, payment, and eligibility checks."],
                                [CheckCircle2, "Actionable", "Clear strategy for each platform."],
                            ].map(([Icon, title, copy]) => {
                                const ItemIcon = Icon as typeof Search;
                                return (
                                    <div key={title as string} className="flex gap-3">
                                        <ItemIcon className="mt-0.5 h-5 w-5 flex-none text-lime-700" aria-hidden="true" />
                                        <div>
                                            <p className="font-extrabold text-[var(--brand-ink)]">{title as string}</p>
                                            <p className="text-sm text-[var(--text-secondary)]">{copy as string}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {guides.map((guide) => (
                        <Link
                            key={guide.slug}
                            href={`/best-gpt-sites/${guide.slug}`}
                            className="group overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-lime-300"
                        >
                            <div className="relative aspect-[16/10] bg-[var(--surface-muted)]">
                                <Image
                                    src={guide.screenshot}
                                    alt={`${guide.name} website screenshot`}
                                    fill
                                    sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                                    className="object-cover"
                                />
                            </div>
                            <div className="p-4">
                                <p className="text-xs font-extrabold uppercase tracking-wide text-lime-700">{guide.bestFor}</p>
                                <h2 className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">{guide.name} Guide</h2>
                                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">{guide.description}</p>
                                <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--brand-ink)]">
                                    Read guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </section>
            </Container>
        </main>
    );
}
