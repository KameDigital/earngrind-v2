import Link from "next/link";
import OfferTable from "@/app/(seo)/components/OfferTable";
import type { SeoOfferRow } from "@/app/(seo)/_lib/seo-data";
import type { PublicOfferSearchResult } from "@/lib/public-offer-search";

type PublicOffer = PublicOfferSearchResult["data"][number];

export type PlatformReviewPageProps = {
  h1: string;
  intro: string;
  offerRows: SeoOfferRow[];
  affiliateCta: {
    label: string;
    href: string;
  };
};

export function toPlatformReviewOfferRows(offers: PublicOffer[]): SeoOfferRow[] {
  return offers
    .filter((offer) => offer.game && offer.platform)
    .map((offer) => ({
      id: offer.id,
      title: offer.title,
      gameName: offer.game.name,
      gameSlug: offer.game.slug,
      imageUrl: offer.image_url ?? offer.game.thumbnail_url ?? null,
      providerName: offer.provider_name ?? offer.platform.name,
      platformName: offer.platform.name,
      payoutUsd: Number(offer.payout_usd ?? 0),
      totalPayoutUsd: Number(offer.total_payout_usd ?? offer.payout_usd ?? 0),
      redirectUrl: offer.redirect_url ?? "#",
      goalText: offer.goal_text ?? null,
      updatedAt: offer.updated_at ?? null,
      tasks: [],
    }));
}

export default function PlatformReviewPage({
  h1,
  intro,
  offerRows,
  affiliateCta,
}: PlatformReviewPageProps) {
  return (
    <main className="bg-[var(--background)]">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="section-label">Platform research</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-5xl">
            {h1}
          </h1>
          {/* TODO: Replace placeholder intro copy with source-backed platform research before final SEO push. */}
          <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">
            {intro}
          </p>
          <Link
            href={affiliateCta.href}
            className="mt-6 inline-flex items-center justify-center rounded-none bg-[var(--brand-ink)] px-5 py-3 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px hover:bg-[var(--brand-ink)]/95"
          >
            {affiliateCta.label}
          </Link>
        </div>

        <div className="mt-10">
          <OfferTable rows={offerRows} title="Relevant offers" compact showBestSummary={false} />
        </div>
      </section>
    </main>
  );
}
