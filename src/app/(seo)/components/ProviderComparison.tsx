import ProviderLogo from "@/components/providers/ProviderLogo";

type ProviderRow = {
  providerName: string;
  offers: number;
  bestPayoutUsd: number;
  avgPayoutUsd: number;
  platformCount: number;
};

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

export default function ProviderComparison({ rows }: { rows: ProviderRow[] }) {
  if (rows.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-extrabold text-[var(--brand-ink)] tracking-tight">Provider Comparison</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.slice(0, 9).map((row) => (
          <article key={row.providerName} className="rounded-2xl border border-[var(--border-default)] bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <ProviderLogo name={row.providerName} className="h-10 max-w-[180px]" />
              <h3 className="min-w-0 text-sm font-extrabold text-[var(--brand-ink)]">{row.providerName}</h3>
            </div>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">{row.offers} offer{row.offers !== 1 ? "s" : ""}</p>
            <dl className="mt-3 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-[var(--text-secondary)]">Best payout</dt>
                <dd className="font-bold text-[var(--brand-ink)]">{money(row.bestPayoutUsd)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--text-secondary)]">Avg payout</dt>
                <dd className="font-bold text-[var(--brand-ink)]">{money(row.avgPayoutUsd)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--text-secondary)]">Platforms</dt>
                <dd className="font-bold text-[var(--brand-ink)]">{row.platformCount}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
