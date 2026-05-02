import { formatMoney } from "../_lib/seo-data";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";

type GameHeaderProps = {
  gameName: string;
  maxPayoutUsd: number;
  intro: string;
  offerCount: number;
  providerCount: number;
  category: string | null;
  bestOffer?: {
    id: string;
    title: string;
    providerName: string;
    platformName: string;
    payoutUsd: number;
    totalPayoutUsd: number;
    redirectUrl: string;
  } | null;
};

export default function GameHeader({
  gameName,
  maxPayoutUsd,
  intro,
  offerCount,
  providerCount,
  category,
  bestOffer = null,
}: GameHeaderProps) {
  return (
    <header className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div>
          <p className="section-label">Game Offer Comparison</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
            Best {gameName} offers
          </h1>
          <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">{intro}</p>
        </div>

        <div className="rounded-2xl border border-lime-300 bg-lime-50 p-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-lime-800">Highest current payout</p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--brand-ink)]">{formatMoney(maxPayoutUsd)}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {bestOffer ? `${bestOffer.platformName} via ${bestOffer.providerName}` : "No active route available"}
          </p>
          {bestOffer ? (
            <TrackedOutboundLink
              href={bestOffer.redirectUrl}
              eventLabel="game-header-best-route"
              offerId={bestOffer.id}
              offerTitle={bestOffer.title}
              gameTitle={gameName}
              platformName={bestOffer.platformName}
              providerName={bestOffer.providerName}
              payoutUsd={bestOffer.totalPayoutUsd}
              location="game-header-best-route"
              sourceContext="game-page"
              className="mt-4 inline-flex w-full justify-center rounded-xl bg-[var(--brand-ink)] px-4 py-3 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
            >
              Start Highest Payout
            </TrackedOutboundLink>
          ) : null}
          <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-tertiary)]">
            Payouts can change by provider, country, and device. Some outbound links may be affiliate links.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Tracked offers</p>
          <p className="text-xl font-extrabold text-[var(--brand-ink)]">{offerCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Providers</p>
          <p className="text-xl font-extrabold text-[var(--brand-ink)]">{providerCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Category</p>
          <p className="text-xl font-extrabold text-[var(--brand-ink)]">{category ?? "General"}</p>
        </div>
      </div>
    </header>
  );
}
