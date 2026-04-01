import { Metadata } from 'next';
import React from 'react';
import OfferSearchEngine from '@/components/offers/OfferSearchEngine';
import Container from '@/components/layout/Container';

export const metadata: Metadata = {
    title: 'Find the Best Offerwall Tasks | EarnGrind',
    description: 'Search, filter, and compare the highest paying offerwall tasks, games, and sign-up offers across all major platforms.',
};

export default function OffersPage() {
    return (
        <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
            <Container>
                {/* Page Header */}
                <div className="mb-8">
                    <p className="section-label mb-3">Offers</p>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--brand-ink)] tracking-tight mb-3">
                        Offer Search Engine
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)] max-w-3xl leading-relaxed">
                        Find the highest paying tasks across Swagbucks, Freecash, InboxDollars, and more.
                        Filter by device, platform, and payout to maximize your earnings.
                    </p>
                </div>

                {/* Main Client UI */}
                <OfferSearchEngine />
            </Container>
        </main>
    );
}
