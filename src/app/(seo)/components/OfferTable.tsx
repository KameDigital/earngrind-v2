import Link from "next/link";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import type { SeoOfferRow } from "../_lib/seo-data";
import { formatMoney } from "../_lib/seo-data";

type OfferTableProps = {
  rows: SeoOfferRow[];
  title?: string;
  showTasks?: boolean;
  compact?: boolean;
};

export default function OfferTable({ rows, title, showTasks = false, compact = false }: OfferTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border-default)] bg-white p-6 text-sm text-[var(--text-secondary)]">
        No offers found for this section.
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {title ? <h2 className="text-2xl font-extrabold text-[var(--brand-ink)] tracking-tight">{title}</h2> : null}
      <div className="overflow-x-auto rounded-2xl border border-[var(--border-default)] bg-white shadow-[var(--shadow-card)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--surface-muted)] text-left text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
            <tr>
              <th className="px-4 py-3 font-bold">Offer</th>
              <th className="px-4 py-3 font-bold">Provider</th>
              <th className="px-4 py-3 font-bold">Platform</th>
              <th className="px-4 py-3 font-bold text-right">Payout</th>
              <th className="px-4 py-3 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[var(--border-default)] align-top">
                <td className="px-4 py-3">
                  <div className="font-semibold text-[var(--brand-ink)]">{row.title}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    <Link href={`/games/${row.gameSlug}`} className="hover:text-lime-700 hover:underline">
                      {row.gameName}
                    </Link>
                  </div>
                  {showTasks && row.tasks.length > 0 ? (
                    <ol className="mt-2 list-decimal pl-5 text-xs text-[var(--text-secondary)] space-y-1">
                      {(compact ? row.tasks.slice(0, 3) : row.tasks).map((task) => (
                        <li key={task.id}>
                          {task.title}
                          {typeof task.reward_amount === "number" && task.reward_amount > 0 ? ` (${formatMoney(task.reward_amount)})` : ""}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{row.providerName}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{row.platformName}</td>
                <td className="px-4 py-3 text-right font-extrabold text-[var(--brand-ink)]">{formatMoney(row.payoutUsd)}</td>
                <td className="px-4 py-3 text-right">
                  <TrackedOutboundLink
                    href={row.redirectUrl}
                    className="inline-flex rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-bold text-[var(--brand-ink)] hover:border-lime-400 hover:bg-lime-50"
                    eventLabel="seo-offer-table-cta"
                    offerId={row.id}
                    offerTitle={row.title}
                    gameTitle={row.gameName}
                    platformName={row.platformName}
                    providerName={row.providerName}
                    payoutUsd={row.payoutUsd}
                    location="seo-offer-table"
                    sourceContext="seo-page"
                  >
                    View Offer
                  </TrackedOutboundLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
