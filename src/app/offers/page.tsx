import { Metadata } from 'next';
import React, { Suspense } from 'react';
import OfferSearchEngine from '@/components/offers/OfferSearchEngine';
import Container from '@/components/layout/Container';
import { canonicalAlternates } from '@/lib/seo-metadata';
import { buildBreadcrumbList, buildCollectionPage, buildItemList, JsonLd } from '@/lib/seo-schema';
import { getSupportedPublicOfferCountries } from '@/lib/earnlab-countries';
import { fetchPublicOffers, publicOfferFiltersFromSearchParams, type PublicOfferSearchResult } from '@/lib/public-offer-search';
import { resolveRequestOfferCountry } from '@/lib/server-offer-country';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Compare High-Paying Offers and Games | EarnGrind',
    description: 'Search live GPT offers, compare payout rates, filter by country and device, and find the highest paying rewards across partner sites.',
    alternates: canonicalAlternates('/offers'),
    openGraph: {
        title: 'Compare High-Paying Offers and Games | EarnGrind',
        description: 'Search live GPT offers, compare payout rates, filter by country and device, and find the highest paying rewards across partner sites.',
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
        title: 'Compare High-Paying Offers and Games | EarnGrind',
        description: 'Search live GPT offers, compare payout rates, filter by country and device, and find the highest paying rewards across partner sites.',
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

function initialOfferQueryString(searchParams: URLSearchParams, defaultCountry: string): string {
    const params = new URLSearchParams(searchParams);
    if (!params.has("sort")) params.set("sort", "payout_desc");
    if (!params.has("page")) params.set("page", "1");
    if (!params.has("per_page")) params.set("per_page", "24");
    if (!params.has("country") && defaultCountry) params.set("country", defaultCountry);
    return params.toString();
}

export default async function OffersPage({ searchParams }: OffersPageProps) {
    const countryResolution = await resolveRequestOfferCountry();
    const effectiveCountry = countryResolution.country;
    const supportedCountries = getSupportedPublicOfferCountries();
    const initialSearchParams = pageSearchParamsToUrlSearchParams(searchParams);
    const initialQueryString = initialOfferQueryString(initialSearchParams, effectiveCountry.code);

    let initialOffers: PublicOfferSearchResult = {
        data: [],
        meta: { total: 0, page: 1, per_page: 24, total_pages: 1 },
    };

    try {
        initialOffers = await fetchPublicOffers({
            ...publicOfferFiltersFromSearchParams(new URLSearchParams(initialQueryString)),
            country: initialSearchParams.get("country") ?? effectiveCountry.code,
            perPage: 24,
        });
    } catch (err) {
        console.warn("[OffersPage] Initial offer fetch encountered an error, rendering fallback search terminal:", err);
    }

    const schemas = [
        buildCollectionPage({
            name: "Compare High-Paying Offers and Games",
            path: "/offers",
            description: metadata.description as string,
            mainEntity: buildItemList([
                { name: "Live Offer Search", path: "/offers", description: "Search live GPT offers by payout, site, source, device, and country." },
            ]),
        }),
        buildBreadcrumbList([
            { name: "Home", path: "/" },
            { name: "Offers", path: "/offers" },
        ]),
    ];

    return (
        <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-4 sm:pt-6">
            <JsonLd data={schemas} />
            <Container>
                <div className="mb-4 max-w-4xl">
                    <p className="section-label mb-1">Live Offer Discovery</p>
                    <h1 className="text-2xl font-black tracking-tight text-[var(--brand-ink)] sm:text-3xl">
                        Search & Compare High-Paying GPT Offers
                    </h1>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                        Real-time payout rates across verified partner sites. Filter by your country, device, or payout threshold to find the best earning routes before you start.
                    </p>
                </div>

                <Suspense fallback={null}>
                    <OfferSearchEngine
                        initialOffers={initialOffers.data}
                        initialMeta={initialOffers.meta}
                        initialQueryString={initialQueryString}
                        initialCountry={initialSearchParams.get("country") ?? effectiveCountry.code}
                        countries={supportedCountries}
                    />
                </Suspense>
            </Container>
        </main>
    );
}
