import { formatMoney } from "../_lib/seo-data";
import { ArrowRight, Trophy } from "lucide-react";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import ProviderLogo from "@/components/providers/ProviderLogo";
import { formatPayoutFreshness, payoutFreshnessIsStale } from "@/lib/payout-freshness";

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
    updatedAt: string | null;
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
    <header className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white shadow-[var(--shadow-card)]">
      <div className="grid gap-0 lg:grid-cols-[1fr_22rem]">
        <div className="p-5 sm:p-6">
          <p className="section-label">Game Offer Comparison</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
            Best {gameName} offers
          </h1>
          <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">{intro}</p>
        </div>

        <div className="bg-[var(--brand-ink)] p-5 text-white lg:p-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[var(--brand-lime)]">
            <Trophy aria-hidden className="h-3.5 w-3.5" />
            Highest current payout
          </p>
          <p className="mt-4 text-5xl font-black tracking-tight text-[var(--brand-lime)]">{formatMoney(maxPayoutUsd)}</p>
          {bestOffer ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/75">
              <ProviderLogo name={bestOffer.providerName} compact className="h-8" />
              <span>{bestOffer.platformName} via {bestOffer.providerName}</span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-white/70">No active route available</p>
          )}
          {bestOffer ? (
            <div className={`mt-3 rounded-xl border px-3 py-2 text-xs font-bold ${
              payoutFreshnessIsStale(bestOffer.updatedAt)
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-lime-200 bg-white/70 text-lime-800"
            }`}>
              {formatPayoutFreshness(bestOffer.updatedAt)}
            </div>
          ) : null}
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
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-lime)] px-4 py-3 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px"
            >
              Start Highest Payout <ArrowRight aria-hidden className="h-4 w-4" />
            </TrackedOutboundLink>
          ) : null}
          <p className="mt-3 text-[11px] leading-relaxed text-white/55">
            Payouts can change by provider, country, and device. Some outbound links may be affiliate links.
          </p>
        </div>
      </div>

      <div className="grid gap-3 border-t border-[var(--border-default)] bg-[var(--surface-muted)]/50 p-5 sm:grid-cols-3 sm:p-6">
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
