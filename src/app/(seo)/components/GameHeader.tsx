import { formatMoney } from "../_lib/seo-data";

type GameHeaderProps = {
  gameName: string;
  maxPayoutUsd: number;
  intro: string;
  offerCount: number;
  providerCount: number;
  category: string | null;
};

export default function GameHeader({
  gameName,
  maxPayoutUsd,
  intro,
  offerCount,
  providerCount,
  category,
}: GameHeaderProps) {
  return (
    <header className="rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)]">
      <p className="section-label">Game Offer Comparison</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--brand-ink)]">
        Best {gameName} Offers (Earn Up To {formatMoney(maxPayoutUsd)})
      </h1>
      <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">{intro}</p>

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
