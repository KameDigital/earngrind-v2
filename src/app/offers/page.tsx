import { Metadata } from 'next';
import React, { Suspense } from 'react';
import OfferSearchEngine from '@/components/offers/OfferSearchEngine';
import Container from '@/components/layout/Container';
import { canonicalAlternates } from '@/lib/seo-metadata';

export const metadata: Metadata = {
    title: 'Compare High-Paying Offers | EarnGrind',
    description: 'Compare current payouts, filter live offer opportunities, and find the best-paying games, signup routes, and tasks faster.',
    alternates: canonicalAlternates('/offers'),
};

export default function OffersPage() {
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

                {/* Main Client UI */}
                <Suspense fallback={null}>
                    <OfferSearchEngine />
                </Suspense>
            </Container>
        </main>
    );
}
