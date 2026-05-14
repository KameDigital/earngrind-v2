import { Metadata } from 'next';
import Link from 'next/link';
import React, { Suspense } from 'react';
import OfferSearchEngine from '@/components/offers/OfferSearchEngine';
import Container from '@/components/layout/Container';
import { canonicalAlternates } from '@/lib/seo-metadata';
import { fetchPublicOffers, publicOfferFiltersFromSearchParams } from '@/lib/public-offer-search';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Compare High-Paying Offers | EarnGrind',
    description: 'Compare current payouts, filter live offer opportunities, and find the best-paying games, signup routes, and tasks faster.',
    alternates: canonicalAlternates('/offers'),
    openGraph: {
        title: 'Compare High-Paying Offers | EarnGrind',
        description: 'Compare current payouts, filter live offer opportunities, and find the best-paying games, signup routes, and tasks faster.',
        url: 'https://earngrind.com/offers',
        siteName: 'EarnGrind',
        images: [
            {
                url: '/og-earngrind.png',
                width: 1200,
                height: 630,
                alt: 'Compare high-paying offers on EarnGrind',
            },
        ],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Compare High-Paying Offers | EarnGrind',
        description: 'Compare current payouts, filter live offer opportunities, and find the best-paying games, signup routes, and tasks faster.',
        images: ['/og-earngrind.png'],
    },
};

interface OffersPageProps {
    searchParams?: Record<string, string | string[] | undefined>;
}

function pageSearchParamsToUrlSearchParams(searchParams: OffersPageProps["searchParams"]): URLSearchParams {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(searchParams ?? {})) {
        if (Array.isArray(value)) {
            for (const item of value) params.append(key, item);
        } else if (typeof value === "string") {
            params.set(key, value);
        }
    }

    return params;
}

function initialOfferQueryString(searchParams: URLSearchParams): string {
    const params = new URLSearchParams(searchParams);
    if (!params.has("country")) params.set("country", "US");
    if (!params.has("sort")) params.set("sort", "payout_desc");
    if (!params.has("page")) params.set("page", "1");
    return params.toString();
}

const GAIN_OFFERWALL_LINKS = [
    { href: "/offers/gain/us", label: "All Gain" },
    { href: "/offers/gain/us/native", label: "Native Gain / Torox" },
    { href: "/offers/gain/us/revu", label: "Revenue Universe" },
    { href: "/offers/gain/us/adtowall", label: "AdToWall" },
    { href: "/offers/gain/us/asmwall", label: "ASMWall" },
    { href: "/offers/gain/us/lootably", label: "Lootably" },
    { href: "/offers/gain/us/cpx", label: "CPX Research" },
];

export default async function OffersPage({ searchParams }: OffersPageProps) {
    const initialSearchParams = pageSearchParamsToUrlSearchParams(searchParams);
    const initialQueryString = initialOfferQueryString(initialSearchParams);
    const initialOffers = await fetchPublicOffers({
        ...publicOfferFiltersFromSearchParams(new URLSearchParams(initialQueryString)),
        country: initialSearchParams.get("country") ?? "US",
    });

    return (
        <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-6 sm:pt-10">
            <Container>
                {/* Page Header */}
                <div className="mb-5 sm:mb-8">
                    <p className="section-label mb-2">Offers</p>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--brand-ink)] tracking-tight mb-2">
                        Compare high-paying offers faster
                    </h1>
                    <p className="text-sm sm:text-lg text-[var(--text-secondary)] max-w-3xl leading-relaxed">
                        Scan current payouts, compare platforms, and open the best route into each game or offer before you waste time on lower-value tasks.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {[
                            "Sorted for faster payout discovery",
                            "Compare platforms and devices",
                            "Open the best route from each card",
                        ].map((item) => (
                            <span
                                key={item}
                                className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] shadow-[var(--shadow-card)]"
                            >
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                <section
                    className="mb-6 rounded-2xl border border-[var(--border-default)] bg-white p-4 shadow-[var(--shadow-card)] sm:mb-8 sm:p-5"
                    aria-labelledby="gain-offerwall-heading"
                >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-2xl">
                            <p className="section-label mb-2">Browse by Offerwall</p>
                            <h2 id="gain-offerwall-heading" className="text-xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-2xl">
                                Browse Gain.gg Offers
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                                Browse imported Gain.gg offers by provider and route, including native Gain, Revenue Universe, AdToWall, ASMWall, Lootably, and CPX Research.
                            </p>
                        </div>
                        <Link
                            href="/offers/gain/us/native"
                            className="inline-flex items-center justify-center rounded-xl bg-[var(--brand-ink)] px-4 py-2.5 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px hover:bg-[var(--brand-ink)]/90"
                        >
                            View Gain.gg Offers
                            <span aria-hidden="true" className="ml-2">-&gt;</span>
                        </Link>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {GAIN_OFFERWALL_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-lime)]/50 hover:bg-[var(--brand-lime)]/10 hover:text-[var(--brand-ink)]"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Main Client UI */}
                <Suspense fallback={null}>
                    <OfferSearchEngine
                        initialOffers={initialOffers.data}
                        initialMeta={initialOffers.meta}
                        initialQueryString={initialQueryString}
                    />
                </Suspense>
            </Container>
        </main>
    );
}
