import type { Metadata } from "next";
import PersonalizedOfferFinder from "@/components/offers/PersonalizedOfferFinder";
import { fetchPublicOffers } from "@/lib/public-offer-search";
import { canonicalAlternates } from "@/lib/seo-metadata";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Find Your Best Mobile Game Offers | EarnGrind",
  description:
    "Use EarnGrind's personalized offer finder to filter top mobile game payouts by country, device, and daily time available.",
  alternates: canonicalAlternates("/find-offers"),
};

export default async function FindOffersPage() {
  const offers = await fetchPublicOffers({
    sort: "payout_desc",
    perPage: 50,
    country: "US",
  });

  return (
    <main className="bg-[var(--background)]">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="section-label">Personalized Offer Finder</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-5xl">
            Find the best offers for your device and schedule
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">
            Answer three quick questions and EarnGrind will rank the highest-paying visible offers that match how you actually play.
          </p>
        </div>

        <PersonalizedOfferFinder offers={offers.data} />
      </section>
    </main>
  );
}
