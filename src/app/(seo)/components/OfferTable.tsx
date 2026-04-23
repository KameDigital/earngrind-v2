"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import type { SeoOfferRow } from "../_lib/seo-data";
import { formatMoney } from "../_lib/seo-data";

type OfferTableProps = {
  rows: SeoOfferRow[];
  title?: string;
  showTasks?: boolean;
  compact?: boolean;
};

type SortOption = "highest-payout" | "fastest-completion" | "most-popular";
type DeviceFilter = "all" | "ios" | "android" | "desktop";
type TaskFilter = "all" | "multi-step" | "single-step";

type ProviderGroup = {
  providerName: string;
  offers: SeoOfferRow[];
  bestOffer: SeoOfferRow;
};

const DEFAULT_VISIBLE_COUNT = 3;
const DEFAULT_EXPANDED_PROVIDERS = 2;
const DEVICE_LABELS: Record<DeviceFilter, string> = {
  all: "All devices",
  ios: "iOS",
  android: "Android",
  desktop: "Desktop",
};

function inferDevices(row: SeoOfferRow): DeviceFilter[] {
  const haystack = [
    row.title,
    row.goalText ?? "",
    row.platformName,
    ...row.tasks.map((task) => `${task.title} ${task.time_limit_text ?? ""}`),
  ]
    .join(" ")
    .toLowerCase();

  const devices = new Set<DeviceFilter>();
  if (/(^|[^a-z])ios([^a-z]|$)|iphone|ipad/.test(haystack)) devices.add("ios");
  if (/(^|[^a-z])android([^a-z]|$)|google play/.test(haystack)) devices.add("android");
  if (/(^|[^a-z])desktop([^a-z]|$)|(^|[^a-z])web([^a-z]|$)|browser|pc/.test(haystack)) devices.add("desktop");
  return devices.size > 0 ? Array.from(devices) : [];
}

function getTaskMode(row: SeoOfferRow): TaskFilter {
  return row.tasks.length > 1 ? "multi-step" : "single-step";
}

function getPopularityScore(row: SeoOfferRow, providerOfferCounts: Map<string, number>) {
  return (providerOfferCounts.get(row.providerName) ?? 0) * 1000 + row.totalPayoutUsd;
}

function sortRows(rows: SeoOfferRow[], sortBy: SortOption, providerOfferCounts: Map<string, number>) {
  return [...rows].sort((a, b) => {
    if (sortBy === "fastest-completion") {
      const taskDelta = a.tasks.length - b.tasks.length;
      if (taskDelta !== 0) return taskDelta;
      return b.totalPayoutUsd - a.totalPayoutUsd;
    }

    if (sortBy === "most-popular") {
      return getPopularityScore(b, providerOfferCounts) - getPopularityScore(a, providerOfferCounts);
    }

    if (b.totalPayoutUsd !== a.totalPayoutUsd) return b.totalPayoutUsd - a.totalPayoutUsd;
    return b.payoutUsd - a.payoutUsd;
  });
}

function OfferCard({
  row,
  isBest,
  isSelected,
  expanded,
  showTasks,
  compact,
  onToggleSelect,
  onToggleExpand,
}: {
  row: SeoOfferRow;
  isBest: boolean;
  isSelected: boolean;
  expanded: boolean;
  showTasks: boolean;
  compact: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
}) {
  const milestoneCount = row.tasks.length;
  const visibleTasks = compact ? row.tasks.slice(0, 3) : row.tasks;
  const routeSummary =
    row.goalText ??
    (milestoneCount > 1
      ? `${milestoneCount} milestones available on this route.`
      : "Single-step route.");

  return (
    <article
      className={`rounded-2xl border p-4 shadow-[var(--shadow-card)] transition-all ${
        isBest
          ? "border-lime-400 bg-lime-50/60"
          : "border-[var(--border-default)] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-extrabold text-[var(--brand-ink)]">{row.title}</h3>
            {isBest ? (
              <span className="rounded-full bg-[var(--brand-lime)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[var(--brand-ink)]">
                Best route
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            {row.providerName} on {row.platformName}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Total payout</div>
          <div className="text-2xl font-extrabold text-[var(--brand-ink)]">{formatMoney(row.totalPayoutUsd)}</div>
          <div className="text-xs text-[var(--text-tertiary)]">Best step {formatMoney(row.payoutUsd)}</div>
        </div>
      </div>

      <p className="mt-3 text-sm text-[var(--text-secondary)]">{routeSummary}</p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-tertiary)]">
        <span className="rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)] px-2.5 py-1">
          {milestoneCount} milestone{milestoneCount !== 1 ? "s" : ""}
        </span>
        <span className="rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)] px-2.5 py-1">
          {milestoneCount > 1 ? "Multi-step" : "Single-step"}
        </span>
        <span className="rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)] px-2.5 py-1">
          <Link href={`/games/${row.gameSlug}`} className="hover:text-lime-700 hover:underline">
            {row.gameName}
          </Link>
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <TrackedOutboundLink
          href={row.redirectUrl}
          className={`inline-flex rounded-xl px-4 py-2 text-sm font-extrabold transition-all hover:-translate-y-px ${
            isBest
              ? "bg-[var(--brand-ink)] text-[var(--brand-lime)]"
              : "border border-[var(--border-default)] bg-[var(--surface-muted)] text-[var(--brand-ink)] hover:border-lime-400"
          }`}
          eventLabel="seo-offer-table-cta"
          offerId={row.id}
          offerTitle={row.title}
          gameTitle={row.gameName}
          platformName={row.platformName}
          providerName={row.providerName}
          payoutUsd={row.totalPayoutUsd}
          location="seo-offer-table"
          sourceContext="seo-page"
        >
          {isBest ? "Start Best Offer" : "Start Offer"}
        </TrackedOutboundLink>
        <button
          type="button"
          onClick={onToggleExpand}
          className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-bold text-[var(--brand-ink)] hover:border-lime-400"
        >
          {expanded ? "Hide milestones" : "Expand route"}
        </button>
        <button
          type="button"
          onClick={onToggleSelect}
          className={`inline-flex rounded-xl border px-4 py-2 text-sm font-bold ${
            isSelected
              ? "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-[var(--brand-lime)]"
              : "border-[var(--border-default)] bg-white text-[var(--brand-ink)] hover:border-lime-400"
          }`}
        >
          {isSelected ? "Selected" : "Compare"}
        </button>
      </div>

      {expanded && showTasks && milestoneCount > 0 ? (
        <div className="mt-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Milestone breakdown</div>
          <ol className="mt-2 space-y-2">
            {visibleTasks.map((task) => (
              <li key={task.id} className="flex items-start justify-between gap-3 border-t border-[var(--border-default)] pt-2 first:border-0 first:pt-0">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--brand-ink)]">{task.title}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {task.task_type}
                    {task.time_limit_text ? ` • ${task.time_limit_text}` : ""}
                  </div>
                </div>
                <div className="text-right text-sm font-bold text-[var(--brand-ink)]">
                  {typeof task.reward_amount === "number" && task.reward_amount > 0 ? formatMoney(task.reward_amount) : task.reward_display ?? "—"}
                </div>
              </li>
            ))}
          </ol>
          {compact && row.tasks.length > visibleTasks.length ? (
            <div className="mt-2 text-xs text-[var(--text-tertiary)]">
              Showing {visibleTasks.length} of {row.tasks.length} milestones.
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function OfferTable({ rows, title, showTasks = false, compact = false }: OfferTableProps) {
  const [sortBy, setSortBy] = useState<SortOption>("highest-payout");
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>("all");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const [showLowValue, setShowLowValue] = useState(false);
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});
  const [providerVisibleCounts, setProviderVisibleCounts] = useState<Record<string, number>>({});
  const [expandedOffers, setExpandedOffers] = useState<Record<string, boolean>>({});
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border-default)] bg-white p-6 text-sm text-[var(--text-secondary)]">
        No offers found for this section.
      </div>
    );
  }

  const providerOfferCounts = rows.reduce((acc, row) => {
    acc.set(row.providerName, (acc.get(row.providerName) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());

  const rowsAfterFilters = rows.filter((row) => {
    const devices = inferDevices(row);
    const deviceMatch = deviceFilter === "all" ? true : devices.includes(deviceFilter);
    const taskMatch = taskFilter === "all" ? true : getTaskMode(row) === taskFilter;
    return deviceMatch && taskMatch;
  });

  const sortedRows = sortRows(rowsAfterFilters, sortBy, providerOfferCounts);
  const bestOverall = sortedRows[0] ?? null;
  const lowValueThreshold = bestOverall ? Math.max(1, bestOverall.totalPayoutUsd * 0.15) : 0;

  const visibleRows = showLowValue
    ? sortedRows
    : sortedRows.filter((row) => row.totalPayoutUsd >= lowValueThreshold);

  const groupedProviders = visibleRows.reduce<ProviderGroup[]>((acc, row) => {
    const current = acc.find((group) => group.providerName === row.providerName);
    if (current) {
      current.offers.push(row);
      return acc;
    }
    acc.push({
      providerName: row.providerName,
      offers: [row],
      bestOffer: row,
    });
    return acc;
  }, []);

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

  return (
    <section className="space-y-4">
      {title ? (
        <div className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-[var(--brand-ink)] tracking-tight">{title}</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Compare the strongest routes first, then expand providers only when you need more depth.
              </p>
            </div>
            <div className="text-sm text-[var(--text-tertiary)]">
              {visibleRows.length} visible offer{visibleRows.length !== 1 ? "s" : ""} across {groupedProviders.length} provider{groupedProviders.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label">Best Offer</p>
            <h3 className="mt-2 text-2xl font-extrabold text-[var(--brand-ink)]">
              {bestOverall ? `${bestOverall.providerName} on ${bestOverall.platformName}` : "No active offer"}
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {bestOverall
                ? `${formatMoney(bestOverall.totalPayoutUsd)} is the strongest current route in this view. Start there if you want the highest visible return first.`
                : "No offers match the current filters."}
            </p>
          </div>
          {bestOverall ? (
            <TrackedOutboundLink
              href={bestOverall.redirectUrl}
              className="inline-flex rounded-xl bg-[var(--brand-ink)] px-4 py-2 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
              eventLabel="seo-best-offer-cta"
              offerId={bestOverall.id}
              offerTitle={bestOverall.title}
              gameTitle={bestOverall.gameName}
              platformName={bestOverall.platformName}
              providerName={bestOverall.providerName}
              payoutUsd={bestOverall.totalPayoutUsd}
              location="seo-best-offer"
              sourceContext="seo-page"
            >
              Start Best Offer
            </TrackedOutboundLink>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label">Controls</p>
            <h3 className="mt-2 text-2xl font-extrabold text-[var(--brand-ink)]">Top Paying Offers</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Change sort and filters without losing the provider grouping.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-ink)]">
            <input
              type="checkbox"
              checked={showLowValue}
              onChange={(event) => setShowLowValue(event.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-default)]"
            />
            Show all low payout offers
          </label>
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
            <span className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Device</span>
            <select
              value={deviceFilter}
              onChange={(event) => setDeviceFilter(event.target.value as DeviceFilter)}
              className="w-full rounded-xl border border-[var(--border-default)] bg-white px-3 py-2 text-sm"
            >
              {Object.entries(DEVICE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
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
                showTasks={showTasks}
                compact={compact}
                onToggleSelect={() => toggleSelectedOffer(row.id)}
                onToggleExpand={() => toggleExpandedOffer(row.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-xl font-extrabold text-[var(--brand-ink)]">Compare by Platform</h3>
        {groupedProviders.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-default)] bg-white p-6 text-sm text-[var(--text-secondary)]">
            No offers match the current filters.
          </div>
        ) : null}

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
                    <h4 className="text-xl font-extrabold text-[var(--brand-ink)]">{group.providerName}</h4>
                    {index < 2 ? (
                      <span className="rounded-full border border-lime-300 bg-lime-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-lime-800">
                        Top provider
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Best payout {formatMoney(group.bestOffer.totalPayoutUsd)} across {group.offers.length} offer{group.offers.length !== 1 ? "s" : ""}.
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
                        showTasks={showTasks}
                        compact={compact}
                        onToggleSelect={() => toggleSelectedOffer(row.id)}
                        onToggleExpand={() => toggleExpandedOffer(row.id)}
                      />
                    ))}
                  </div>

                  {group.offers.length > visibleCount ? (
                    <button
                      type="button"
                      onClick={() => showMore(group.providerName, group.offers.length)}
                      className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] hover:border-lime-400"
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
                  <div className="text-sm font-bold text-[var(--brand-ink)]">{row.providerName}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">{row.platformName}</div>
                  <div className="mt-1 text-sm font-extrabold text-[var(--brand-ink)]">{formatMoney(row.totalPayoutUsd)}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      ) : null}
    </section>
  );
}
