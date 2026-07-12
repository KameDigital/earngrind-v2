import { Metadata } from 'next';
import Link from 'next/link';
import React, { Suspense } from 'react';
import GamesIndexClient from '@/app/(seo)/games/GamesIndexClient';
import OfferSearchEngine from '@/components/offers/OfferSearchEngine';
import { CountrySelector } from '@/components/offers/CountrySelector';
import Container from '@/components/layout/Container';
import { canonicalAlternates } from '@/lib/seo-metadata';
import { buildBreadcrumbList, buildCollectionPage, buildItemList, JsonLd } from '@/lib/seo-schema';
import { EARNLAB_COUNTRY_NAMES, EARNLAB_GALLERY_COUNTRIES, getSupportedPublicOfferCountries } from '@/lib/earnlab-countries';
import { getGamesIndexData } from '@/lib/games-index-data';
import { fetchPublicOffers, publicOfferFiltersFromSearchParams } from '@/lib/public-offer-search';
import { PUBLIC_GAIN_WALLS, type GainGalleryWall } from '@/lib/gain-gallery';
import { GEMSLOOT_PUBLIC_PROVIDERS } from '@/lib/gemsloot-providers';
import { GEMSLOOT_PUBLIC_COUNTRIES } from '@/lib/gemsloot-countries';
import { resolveRequestOfferCountry } from '@/lib/server-offer-country';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Compare High-Paying Offers and Games',
    description: 'Compare current offer payouts, search live GPT opportunities, and browse the highest-paying game offers from one EarnGrind hub.',
    alternates: canonicalAlternates('/offers'),
    openGraph: {
        title: 'Compare High-Paying Offers and Games',
        description: 'Compare current offer payouts, search live GPT opportunities, and browse the highest-paying game offers from one EarnGrind hub.',
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
        title: 'Compare High-Paying Offers and Games',
        description: 'Compare current offer payouts, search live GPT opportunities, and browse the highest-paying game offers from one EarnGrind hub.',
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

function initialOfferQueryString(searchParams: URLSearchParams, countryCode: string): string {
    const params = new URLSearchParams(searchParams);
    params.set("country", countryCode);
    if (!params.has("sort")) params.set("sort", "payout_desc");
    if (!params.has("page")) params.set("page", "1");
    if (!params.has("per_page")) params.set("per_page", "4");
    return params.toString();
}

const GAIN_WALL_LABELS: Record<GainGalleryWall, string> = {
    native: "Native Gain / Torox",
    revu: "Revenue Universe",
    adtowall: "AdToWall",
    timewall: "Timewall",
    mychips: "MyChips",
    grabcherries: "GrabCherries",
    cpx: "CPX Research",
    adgate: "AdGate",
    ayet: "AyeT Studios",
    polltastic: "Polltastic",
    asmwall: "ASMWall",
    lootably: "Lootably",
    theoremreach: "TheoremReach",
    primeearn: "PrimeEarn",
    bitlabs: "BitLabs",
};

const GAIN_OFFERWALL_LINKS = [
    { href: "/offers/gain/us", label: "All Gain" },
    ...PUBLIC_GAIN_WALLS.map((wall) => ({
        href: `/offers/gain/us/${wall}`,
        label: GAIN_WALL_LABELS[wall],
    })),
];

const GEMSLOOT_OFFERWALL_LINKS = GEMSLOOT_PUBLIC_COUNTRIES.flatMap((country) => [
    { href: `/offers/gemsloot/${country.slug}`, label: `${country.shortName} Gemsloot` },
    ...GEMSLOOT_PUBLIC_PROVIDERS.map((provider) => ({
        href: `/offers/gemsloot/${country.slug}/${provider.slug}`,
        label: `${provider.label} ${country.shortName}`,
    })),
]);

const EARNLAB_COUNTRY_LINKS = EARNLAB_GALLERY_COUNTRIES.slice(0, 8).map((countryCode) => ({
    href: `/offers/${countryCode.toLowerCase()}`,
    label: EARNLAB_COUNTRY_NAMES[countryCode] ?? countryCode,
}));

const POPULAR_OFFER_ROUTE_LINKS = [
    { href: "/highest-paying-gpt-games", label: "Highest-paying GPT games" },
    { href: "/best-money-making-games", label: "Best money-making games" },
    { href: "/best-gain-gg-offers", label: "Best Gain.gg offers" },
    { href: "/best-freecash-games", label: "Best Freecash games" },
    { href: "/guides/how-to-earn", label: "How-to-earn game guides" },
];

export default async function OffersPage({ searchParams }: OffersPageProps) {
    const initialSearchParams = pageSearchParamsToUrlSearchParams(searchParams);
    const countryResolution = resolveRequestOfferCountry(initialSearchParams.get("country"));
    const effectiveCountry = countryResolution.country;
    const supportedCountries = getSupportedPublicOfferCountries();
    const initialQueryString = initialOfferQueryString(initialSearchParams, effectiveCountry.code);
    const [initialOffers, gamesIndex] = await Promise.all([
        fetchPublicOffers({
            ...publicOfferFiltersFromSearchParams(new URLSearchParams(initialQueryString)),
            country: effectiveCountry.code,
        }),
        getGamesIndexData(),
    ]);
    const schemas = [
        buildCollectionPage({
            name: "Compare High-Paying Offers and Games",
            path: "/offers",
            description: metadata.description as string,
            mainEntity: buildItemList([
                { name: "Offer search", path: "/offers#offer-search", description: "Search live GPT offers by payout, site, source, device, and country." },
                { name: "Games list", path: "/offers#games", description: "Browse game hubs with payout snapshots and guide coverage." },
                { name: "Gain.gg offers", path: "/offers/gain/us", description: "Browse Gain.gg routes by offerwall." },
                { name: "Gemsloot providers", path: "/offers/gemsloot/us", description: "Compare Gemsloot routes by country and provider." },
            ]),
        }),
        buildBreadcrumbList([
            { name: "Home", path: "/" },
            { name: "Offers", path: "/offers" },
        ]),
    ];

    return (
        <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-6 sm:pt-10">
            <JsonLd data={schemas} />
            <Container>
                {/* Page Header */}
                <div className="mb-6 overflow-hidden border border-slate-700 bg-[var(--brand-ink)] px-5 py-6 text-white shadow-[var(--shadow-card)] sm:px-7 sm:py-8">
                    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-sm font-semibold text-white/55">
                        <Link href="/" className="hover:text-[var(--brand-lime)]">Home</Link>
                        <span aria-hidden="true">/</span>
                        <span className="text-white">Offers</span>
                    </nav>
                    <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--brand-lime)]">Live offer discovery</p>
                    <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                        Compare high-paying offers and games faster
                    </h1>
                    <p className="max-w-3xl text-sm leading-relaxed text-white/70 sm:text-lg">
                        Search live GPT offers, scan current payouts, compare platforms, and browse game routes from one consolidated EarnGrind hub.
                    </p>
                    {countryResolution.fellBack && (
                        <p className="mt-3 max-w-3xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold leading-relaxed text-amber-900">
                            Showing {effectiveCountry.name} offers because your country could not be matched to a supported market.
                        </p>
                    )}
                    <p className="mt-4 max-w-3xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold leading-relaxed text-white/70">
                        Showing {effectiveCountry.name} offers. EarnGrind is the comparison layer; partner GPT sites and offerwalls handle eligibility, tracking, approval, and payouts after you click out.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {[
                            "Sorted for faster payout discovery",
                            "Compare platforms and devices",
                            "Open the best route from each card",
                        ].map((item) => (
                            <span
                                key={item}
                                className="inline-flex items-center border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/75"
                            >
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                <section id="offer-search" className="mb-8 scroll-mt-24" aria-labelledby="offer-search-heading">
                    <div className="mb-3 max-w-4xl">
                        <p className="section-label mb-2">Offer search terminal</p>
                        <h2 id="offer-search-heading" className="text-xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-2xl">
                            Search offers for {effectiveCountry.name} by payout, site, source, and device
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                            Use this offer search terminal to compare current GPT offer payouts for {effectiveCountry.name}, filter games and tasks by device, and find the strongest route before opening a partner site.
                        </p>
                    </div>
                    <CountrySelector activeCountryCode={effectiveCountry.code} className="mb-4 max-w-2xl" />
                    <Suspense fallback={null}>
                        <OfferSearchEngine
                            initialOffers={initialOffers.data}
                            initialMeta={initialOffers.meta}
                            initialQueryString={initialQueryString}
                            initialCountry={effectiveCountry.code}
                            countries={supportedCountries}
                        />
                    </Suspense>
                </section>

                <section id="games" className="mb-8 scroll-mt-24">
                    <div>
                        <GamesIndexClient
                            games={gamesIndex.games}
                            summary={gamesIndex.summary}
                            variant="embedded"
                            sectionId="games-list"
                        />
                    </div>
                </section>

                <section
                    className="mb-6 sm:mb-8"
                    aria-labelledby="offerwall-route-heading"
                >
                    <div className="max-w-3xl">
                        <p className="section-label mb-2">Browse by route</p>
                        <h2 id="offerwall-route-heading" className="text-xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-2xl">
                            Offerwall, country, and provider hubs
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                            Jump into the most useful public offer routes without adding more items to the main header.
                        </p>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-3">
                        <div className="group rounded-none border border-[var(--border-default)] bg-[var(--surface-muted)] p-4 transition-all hover:-translate-y-1 hover:border-lime-300 hover:bg-white hover:ring-2 hover:ring-lime-300/35 hover:shadow-[0_18px_45px_rgba(15,23,42,0.1)]">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-extrabold text-[var(--brand-ink)]">Gain.gg offers</h3>
                                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                                        Browse Gain.gg by wall, including native Gain, RevU, MyChips, ASMWall, Lootably, and CPX.
                                    </p>
                                </div>
                                <Link href="/offers/gain/us" className="shrink-0 text-xs font-extrabold text-lime-700 hover:text-lime-800">
                                    All Gain
                                </Link>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {GAIN_OFFERWALL_LINKS.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="inline-flex items-center rounded-none border border-[var(--border-default)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-lime)]/50 hover:bg-[var(--brand-lime)]/10 hover:text-[var(--brand-ink)]"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="group rounded-none border border-[var(--border-default)] bg-[var(--surface-muted)] p-4 transition-all hover:-translate-y-1 hover:border-lime-300 hover:bg-white hover:ring-2 hover:ring-lime-300/35 hover:shadow-[0_18px_45px_rgba(15,23,42,0.1)]">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-extrabold text-[var(--brand-ink)]">Gemsloot providers</h3>
                                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                                        Compare US and UK Gemsloot routes by provider before opening a Gemsloot offer.
                                    </p>
                                </div>
                                <Link href="/offers/gemsloot/gb" className="shrink-0 text-xs font-extrabold text-lime-700 hover:text-lime-800">
                                    UK Gemsloot
                                </Link>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {GEMSLOOT_OFFERWALL_LINKS.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="inline-flex items-center rounded-none border border-[var(--border-default)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-lime)]/50 hover:bg-[var(--brand-lime)]/10 hover:text-[var(--brand-ink)]"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="group rounded-none border border-[var(--border-default)] bg-[var(--surface-muted)] p-4 transition-all hover:-translate-y-1 hover:border-lime-300 hover:bg-white hover:ring-2 hover:ring-lime-300/35 hover:shadow-[0_18px_45px_rgba(15,23,42,0.1)]">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-extrabold text-[var(--brand-ink)]">EarnLab countries</h3>
                                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                                        Check imported EarnLab country pages for regional payout availability.
                                    </p>
                                </div>
                                <Link href="/offers/us" className="shrink-0 text-xs font-extrabold text-lime-700 hover:text-lime-800">
                                    United States
                                </Link>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {EARNLAB_COUNTRY_LINKS.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="inline-flex items-center rounded-none border border-[var(--border-default)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-lime)]/50 hover:bg-[var(--brand-lime)]/10 hover:text-[var(--brand-ink)]"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 border-t border-[var(--border-default)] pt-4">
                        <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-[var(--text-tertiary)]">
                            Popular offer routes
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {POPULAR_OFFER_ROUTE_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="inline-flex items-center rounded-none border border-[var(--border-default)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-lime)]/50 hover:bg-[var(--brand-lime)]/10 hover:text-[var(--brand-ink)]"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            </Container>
        </main>
    );
}
