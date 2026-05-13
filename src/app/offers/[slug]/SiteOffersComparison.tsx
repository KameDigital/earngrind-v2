"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import ProviderLogo from "@/components/providers/ProviderLogo";
import { formatPayoutFreshness } from "@/lib/payout-freshness";

export interface SiteOfferTask {
  id: string;
  sort_order: number;
  title: string;
  reward_amount: number;
  reward_display: string | null;
  task_type: string;
  time_limit_text: string | null;
}

export interface SiteOffer {
  id: string;
  payout_usd: number;
  total_payout_usd: number;
  goal_text: string | null;
  offer_url: string | null;
  status: string;
  updated_at: string | null;
  site: { name: string } | null;
  provider: { name: string } | null;
  tasks: SiteOfferTask[];
}

type SortOption = "highest-payout" | "fastest-completion" | "most-popular";
type TaskFilter = "all" | "multi-step" | "single-step";

type ProviderGroup = {
  providerName: string;
  offers: SiteOffer[];
  bestOffer: SiteOffer;
};

const TYPE_COLORS: Record<string, string> = {
  install: "bg-blue-100 text-blue-700",
  milestone: "bg-green-100 text-green-700",
  purchase: "bg-purple-100 text-purple-700",
  signup: "bg-yellow-100 text-yellow-700",
  other: "bg-gray-100 text-gray-500",
};

const DEFAULT_VISIBLE_COUNT = 3;
const DEFAULT_EXPANDED_PROVIDERS = 2;
const PRIMARY_CTA_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-ink)] px-4 py-3 text-sm font-extrabold text-[var(--brand-lime)] shadow-sm transition-all hover:-translate-y-px hover:bg-[var(--brand-ink)]/95 active:translate-y-0";
const SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] bg-white px-4 py-3 text-sm font-bold text-[var(--brand-ink)] transition-colors hover:border-lime-400 hover:bg-lime-50";

function formatUsd(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function getTaskMode(row: SiteOffer): TaskFilter {
  return row.tasks.length > 1 ? "multi-step" : "single-step";
}

function getPopularityScore(row: SiteOffer, providerCounts: Map<string, number>) {
  return (providerCounts.get(row.provider?.name ?? "Unknown Provider") ?? 0) * 1000 + row.total_payout_usd;
}

function sortOffers(rows: SiteOffer[], sortBy: SortOption, providerCounts: Map<string, number>) {
  return [...rows].sort((a, b) => {
    if (sortBy === "fastest-completion") {
      const taskDelta = a.tasks.length - b.tasks.length;
      if (taskDelta !== 0) return taskDelta;
      return b.total_payout_usd - a.total_payout_usd;
    }

    if (sortBy === "most-popular") {
      return getPopularityScore(b, providerCounts) - getPopularityScore(a, providerCounts);
    }

    if (b.total_payout_usd !== a.total_payout_usd) return b.total_payout_usd - a.total_payout_usd;
    return b.payout_usd - a.payout_usd;
  });
}

function OfferCard({
  row,
  isBest,
  isSelected,
  expanded,
  onToggleSelect,
  onToggleExpand,
}: {
  row: SiteOffer;
  isBest: boolean;
  isSelected: boolean;
  expanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
}) {
  const milestoneCount = row.tasks.length;
  const providerName = row.provider?.name ?? "Unknown Provider";
  const platformName = row.site?.name ?? "Unknown Site";
  const routeSummary =
    row.goal_text ??
    (milestoneCount > 1
      ? `${milestoneCount} milestones available on this route.`
      : "Single-step route.");

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-md ${
        isBest ? "border-lime-400 bg-lime-50/70 ring-1 ring-lime-200" : "border-[var(--border-default)] bg-white"
      }`}
    >
      {isBest ? <div className="absolute inset-x-0 top-0 h-1 bg-[var(--brand-lime)]" /> : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-extrabold text-[var(--brand-ink)]">{platformName}</h3>
            <ProviderLogo name={providerName} compact className="h-8" />
            <span className="text-xs text-[var(--text-tertiary)]">via {providerName}</span>
            {isBest ? (
              <span className="rounded-full bg-[var(--brand-lime)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[var(--brand-ink)]">
                Best route
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{routeSummary}</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Total payout</div>
          <div className="text-2xl font-extrabold text-[var(--brand-ink)]">{formatUsd(row.total_payout_usd)}</div>
          <div className="text-xs text-[var(--text-tertiary)]">Best step {formatUsd(row.payout_usd)}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-tertiary)]">
        <span className="rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)] px-2.5 py-1">
          {milestoneCount} milestone{milestoneCount !== 1 ? "s" : ""}
        </span>
        <span className="rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)] px-2.5 py-1">
          {milestoneCount > 1 ? "Multi-step" : "Single-step"}
        </span>
        <span className="rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)] px-2.5 py-1">
          {milestoneCount <= 3 ? "Shorter route" : "More steps, bigger payout"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <TrackedOutboundLink
          href={`/go/${row.id}`}
          eventLabel="site-offer-comparison-cta"
          offerId={row.id}
          offerTitle={row.goal_text ?? `${platformName} ${providerName} offer`}
          platformName={platformName}
          providerName={providerName}
          payoutUsd={row.total_payout_usd}
          location="site-offers-comparison"
          sourceContext="offer-detail"
          className={`min-w-[10rem] flex-1 ${
            isBest
              ? PRIMARY_CTA_CLASS
              : "inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--brand-ink)] bg-[var(--brand-ink)] px-4 py-3 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
          }`}
        >
          {isBest ? "Start Best Payout" : "Start Offer"} <ArrowRight aria-hidden className="h-4 w-4" />
        </TrackedOutboundLink>
        <button
          type="button"
          onClick={onToggleExpand}
          className={SECONDARY_BUTTON_CLASS}
        >
          {expanded ? <ChevronUp aria-hidden className="h-4 w-4" /> : <ChevronDown aria-hidden className="h-4 w-4" />}
          {expanded ? "Hide milestones" : "Expand route"}
        </button>
        <button
          type="button"
          onClick={onToggleSelect}
          className={`inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-bold ${
            isSelected
              ? "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-[var(--brand-lime)]"
              : "border-[var(--border-default)] bg-white text-[var(--brand-ink)] hover:border-lime-400"
          }`}
        >
          {isSelected ? "Selected" : "Compare"}
        </button>
      </div>

      <div className="mt-3 text-[11px] text-[var(--text-tertiary)]">
        {formatPayoutFreshness(row.updated_at)}. Payouts can change by device, country, and provider rules. Some outbound links may be affiliate links.
      </div>

      {expanded && milestoneCount > 0 ? (
        <div className="mt-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Milestone breakdown</div>
          <ol className="mt-2 space-y-2">
            {row.tasks.map((task) => (
              <li key={task.id} className="flex items-start justify-between gap-3 border-t border-[var(--border-default)] pt-2 first:border-0 first:pt-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--brand-ink)]">{task.title}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${TYPE_COLORS[task.task_type] ?? TYPE_COLORS.other}`}>
                      {task.task_type}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {task.time_limit_text ?? "No time limit listed"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[var(--brand-ink)]">{formatUsd(task.reward_amount)}</div>
                  {task.reward_display ? <div className="text-xs text-[var(--text-tertiary)]">{task.reward_display}</div> : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </article>
  );
}

export default function SiteOffersComparison({ rows }: { rows: SiteOffer[] }) {
  const [sortBy, setSortBy] = useState<SortOption>("highest-payout");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const [showLowValue, setShowLowValue] = useState(false);
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});
  const [providerVisibleCounts, setProviderVisibleCounts] = useState<Record<string, number>>({});
  const [expandedOffers, setExpandedOffers] = useState<Record<string, boolean>>({});
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);

  const providerCounts = rows.reduce((acc, row) => {
    const providerName = row.provider?.name ?? "Unknown Provider";
    acc.set(providerName, (acc.get(providerName) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());

  const filteredRows = rows.filter((row) => {
    if (taskFilter === "all") return true;
    return getTaskMode(row) === taskFilter;
  });

  const sortedRows = sortOffers(filteredRows, sortBy, providerCounts);
  const bestOverall = sortedRows[0] ?? null;
  const lowValueThreshold = bestOverall ? Math.max(1, bestOverall.total_payout_usd * 0.15) : 0;
  const visibleRows = showLowValue
    ? sortedRows
    : sortedRows.filter((row) => row.total_payout_usd >= lowValueThreshold);

  const groupedProviders = useMemo(() => {
    return visibleRows.reduce<ProviderGroup[]>((acc, row) => {
      const providerName = row.provider?.name ?? "Unknown Provider";
      const existing = acc.find((group) => group.providerName === providerName);
      if (existing) {
        existing.offers.push(row);
        return acc;
      }
      acc.push({
        providerName,
        offers: [row],
        bestOffer: row,
      });
      return acc;
    }, []);
  }, [visibleRows]);

  const selectedRows = rows.filter((row) => selectedOffers.includes(row.id)).slice(0, 3);
  const topGridRows = visibleRows.slice(0, 3);

  useEffect(() => {
    setExpandedProviders((current) => {
      if (Object.keys(current).length > 0) return current;
      const next: Record<string, boolean> = {};
      groupedProviders.forEach((group, index) => {
        next[group.providerName] = index < DEFAULT_EXPANDED_PROVIDERS;
      });
      return next;
    });
    setProviderVisibleCounts((current) => {
      if (Object.keys(current).length > 0) return current;
      const next: Record<string, number> = {};
      groupedProviders.forEach((group) => {
        next[group.providerName] = DEFAULT_VISIBLE_COUNT;
      });
      return next;
    });
  }, [groupedProviders]);

  function toggleProvider(providerName: string) {
    setExpandedProviders((current) => ({
      ...current,
      [providerName]: !current[providerName],
    }));
  }

  function showMore(providerName: string, offerCount: number) {
    setProviderVisibleCounts((current) => ({
      ...current,
      [providerName]: Math.min((current[providerName] ?? DEFAULT_VISIBLE_COUNT) + DEFAULT_VISIBLE_COUNT, offerCount),
    }));
  }

  function toggleSelectedOffer(id: string) {
    setSelectedOffers((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return [...current, id].slice(-3);
    });
  }

  function toggleExpandedOffer(id: string) {
    setExpandedOffers((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  if (rows.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-[var(--brand-ink)] bg-[var(--brand-ink)] p-5 text-white shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--brand-lime)]">Best Offer</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {bestOverall ? <ProviderLogo name={bestOverall.provider?.name} className="h-10 max-w-[180px]" /> : null}
              <h2 className="text-2xl font-extrabold text-white">
                {bestOverall ? `${bestOverall.site?.name ?? "Unknown Site"} via ${bestOverall.provider?.name ?? "Unknown Provider"}` : "No active route"}
              </h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              {bestOverall
                ? `${formatUsd(bestOverall.total_payout_usd)} is the strongest visible payout in this comparison. Start there first if you want the highest-value route.`
                : "No offers match the current filters."}
            </p>
          </div>
          {bestOverall ? (
            <TrackedOutboundLink
              href={`/go/${bestOverall.id}`}
              eventLabel="site-offer-best-cta"
              offerId={bestOverall.id}
              offerTitle={bestOverall.goal_text ?? `${bestOverall.site?.name ?? "Site"} offer`}
              platformName={bestOverall.site?.name}
              providerName={bestOverall.provider?.name}
              payoutUsd={bestOverall.total_payout_usd}
              location="site-offers-best"
              sourceContext="offer-detail"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-lime)] px-5 py-3 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px"
            >
              Start Best Offer <ArrowRight aria-hidden className="h-4 w-4" />
            </TrackedOutboundLink>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[var(--brand-ink)] tracking-tight">Compare GPT Sites</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Use provider groups to compare payouts first, then expand only the routes you actually want to inspect.
            </p>
          </div>
          <div className="text-sm font-bold text-[var(--text-secondary)] rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2">
            {visibleRows.length} visible route{visibleRows.length !== 1 ? "s" : ""} across {groupedProviders.length} provider{groupedProviders.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm font-semibold text-[var(--brand-ink)]">
            <span className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Sort by</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="w-full rounded-xl border border-[var(--border-default)] bg-white px-3 py-2 text-sm"
            >
              <option value="highest-payout">Highest payout</option>
              <option value="fastest-completion">Fastest completion</option>
              <option value="most-popular">Most popular</option>
            </select>
          </label>

          <label className="text-sm font-semibold text-[var(--brand-ink)]">
            <span className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Task type</span>
            <select
              value={taskFilter}
              onChange={(event) => setTaskFilter(event.target.value as TaskFilter)}
              className="w-full rounded-xl border border-[var(--border-default)] bg-white px-3 py-2 text-sm"
            >
              <option value="all">All tasks</option>
              <option value="multi-step">Multi-step</option>
              <option value="single-step">Single-step</option>
            </select>
          </label>

          <label className="inline-flex items-center gap-2 self-end text-sm font-semibold text-[var(--brand-ink)]">
            <input
              type="checkbox"
              checked={showLowValue}
              onChange={(event) => setShowLowValue(event.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-default)]"
            />
            Show all low payout offers
          </label>
        </div>
      </div>

      {topGridRows.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xl font-extrabold text-[var(--brand-ink)]">Top Paying Offers</h3>
          <div className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
            {topGridRows.map((row, index) => (
              <OfferCard
                key={row.id}
                row={row}
                isBest={index === 0}
                isSelected={selectedOffers.includes(row.id)}
                expanded={!!expandedOffers[row.id]}
                onToggleSelect={() => toggleSelectedOffer(row.id)}
                onToggleExpand={() => toggleExpandedOffer(row.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-xl font-extrabold text-[var(--brand-ink)]">All Providers</h3>
        {groupedProviders.map((group, index) => {
          const isOpen = expandedProviders[group.providerName] ?? index < DEFAULT_EXPANDED_PROVIDERS;
          const visibleCount = providerVisibleCounts[group.providerName] ?? DEFAULT_VISIBLE_COUNT;
          const providerOffers = group.offers.slice(0, isOpen ? visibleCount : 0);

          return (
            <section
              key={group.providerName}
              className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]"
            >
              <button
                type="button"
                onClick={() => toggleProvider(group.providerName)}
                className="flex w-full items-start justify-between gap-4 text-left"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ProviderLogo name={group.providerName} className="h-10 max-w-[180px]" />
                    <h4 className="text-xl font-extrabold text-[var(--brand-ink)]">{group.providerName}</h4>
                    {index < 2 ? (
                      <span className="rounded-full border border-lime-300 bg-lime-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-lime-800">
                        Top provider
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Best payout {formatUsd(group.bestOffer.total_payout_usd)} across {group.offers.length} route{group.offers.length !== 1 ? "s" : ""}.
                  </p>
                </div>
                <span className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-bold text-[var(--brand-ink)]">
                  {isOpen ? "Collapse" : "Expand"}
                </span>
              </button>

              {isOpen ? (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
                    {providerOffers.map((row) => (
                      <OfferCard
                        key={row.id}
                        row={row}
                        isBest={row.id === group.bestOffer.id}
                        isSelected={selectedOffers.includes(row.id)}
                        expanded={!!expandedOffers[row.id]}
                        onToggleSelect={() => toggleSelectedOffer(row.id)}
                        onToggleExpand={() => toggleExpandedOffer(row.id)}
                      />
                    ))}
                  </div>

                  {group.offers.length > visibleCount ? (
                    <button
                      type="button"
                      onClick={() => showMore(group.providerName, group.offers.length)}
                      className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-3 text-sm font-extrabold text-[var(--brand-ink)] hover:border-lime-400 hover:bg-lime-50"
                    >
                      Show more
                    </button>
                  ) : null}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      {selectedRows.length > 0 ? (
        <aside className="fixed bottom-4 left-1/2 z-30 w-[min(1100px,calc(100%-1rem))] -translate-x-1/2 rounded-2xl border border-[var(--border-default)] bg-white p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Selected offers</div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">
                Compare payouts side by side, then click into the route you want.
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {selectedRows.map((row) => (
                <div key={row.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2">
                  <div className="text-sm font-bold text-[var(--brand-ink)]">{row.site?.name ?? "Unknown Site"}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                    <ProviderLogo name={row.provider?.name} compact className="h-8" />
                    <span>{row.provider?.name ?? "Unknown Provider"}</span>
                  </div>
                  <div className="mt-1 text-sm font-extrabold text-[var(--brand-ink)]">{formatUsd(row.total_payout_usd)}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      ) : null}
    </section>
  );
}
