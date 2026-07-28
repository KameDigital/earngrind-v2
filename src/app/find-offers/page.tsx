import type { Metadata } from "next";
import PersonalizedOfferFinder from "@/components/offers/PersonalizedOfferFinder";
import { fetchPublicOffers } from "@/lib/public-offer-search";
import { FINDER_COUNTRY_OPTIONS } from "@/lib/personalized-offer-finder";
import { canonicalAlternates } from "@/lib/seo-metadata";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Find Your Best Mobile Game Offers",
  description:
    "Use EarnGrind's personalized offer finder to compare top offers by country, device, and offer type.",
  alternates: canonicalAlternates("/find-offers"),
};

export default async function FindOffersPage() {
  const offerResults = await Promise.all(
    FINDER_COUNTRY_OPTIONS.map((country) =>
      fetchPublicOffers({
        sort: "payout_desc",
        perPage: 50,
        country: country.value,
      }),
    ),
  );
  const offers = Array.from(
    new Map(offerResults.flatMap((result) => result.data).map((offer) => [offer.id, offer])).values(),
  );

  return (
    <main className="bg-[var(--background)]">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="section-label">Personalized Offer Finder</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-5xl">
            Find the best offers for your device and goal
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">
            Answer three quick questions and EarnGrind will rank the highest-paying visible offers that match your country, device, and offer type.
          </p>
        </div>

        <PersonalizedOfferFinder offers={offers} />
      </section>
    </main>
  );
}
