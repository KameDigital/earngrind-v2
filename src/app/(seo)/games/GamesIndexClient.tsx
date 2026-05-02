"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export type GamesIndexItem = {
  id: string;
  slug: string;
  name: string;
  thumbnailUrl: string | null;
  topPayout: number;
  guideCount: number;
  offerCount: number;
  bestProvider: string;
  bestPlatform: string;
  category: string;
  providerCount: number;
  platformCount: number;
};

type GamesIndexSummary = {
  totalGames: number;
  highestPayout: number;
  guidesAvailable: number;
  trackedOffers: number;
};

type SortOption = "top-payout" | "most-offers" | "has-guide" | "name";
type GuideFilter = "all" | "with-guides" | "without-guides";

function money(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function GameThumbnail({ game }: { game: GamesIndexItem }) {
  if (!game.thumbnailUrl) {
    return (
      <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-[var(--border-default)] bg-lime-50 text-sm font-extrabold text-lime-800">
        {initials(game.name)}
      </div>
    );
  }

  return (
    <div className="relative h-12 w-12 flex-none overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)]">
      <Image src={game.thumbnailUrl} alt="" fill sizes="48px" className="object-cover" />
    </div>
  );
}

export default function GamesIndexClient({
  games,
  summary,
}: {
  games: GamesIndexItem[];
  summary: GamesIndexSummary;
}) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("top-payout");
  const [guideFilter, setGuideFilter] = useState<GuideFilter>("all");

  const featuredGames = games.slice(0, 4);
  const visibleGames = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...games]
      .filter((game) => {
        const guideMatch =
          guideFilter === "all" ||
          (guideFilter === "with-guides" && game.guideCount > 0) ||
          (guideFilter === "without-guides" && game.guideCount === 0);
        if (!guideMatch) return false;
        if (!normalizedQuery) return true;
        return [game.name, game.bestProvider, game.bestPlatform, game.category]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (sortBy === "most-offers") return b.offerCount - a.offerCount || b.topPayout - a.topPayout;
        if (sortBy === "has-guide") return b.guideCount - a.guideCount || b.topPayout - a.topPayout;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return b.topPayout - a.topPayout || b.offerCount - a.offerCount;
      });
  }, [games, guideFilter, query, sortBy]);

  if (games.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border-default)] bg-white p-12 text-center shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-bold text-[var(--brand-ink)]">No games available</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">No tracked games are available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div>
            <p className="section-label mb-3">Games</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
              Compare offerwall games by payout
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              Find games with the strongest current payouts, compare provider routes, and open guides before starting an offer.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Games tracked</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--brand-ink)]">{summary.totalGames}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-lime-50 p-3">
              <p className="text-xs uppercase tracking-wide text-lime-800">Highest payout</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--brand-ink)]">{money(summary.highestPayout)}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Guides available</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--brand-ink)]">{summary.guidesAvailable}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Tracked offers</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--brand-ink)]">{summary.trackedOffers}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-label">Best right now</p>
            <h2 className="mt-2 text-xl font-extrabold text-[var(--brand-ink)]">Highest-paying games</h2>
          </div>
          <Link
            href="#all-games"
            className="inline-flex rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] hover:border-lime-400"
          >
            Browse all games
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {featuredGames.map((game, index) => (
            <Link
              key={game.id}
              href={`/games/${game.slug}`}
              className="group rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4 transition-all hover:-translate-y-0.5 hover:border-lime-400 hover:bg-lime-50/50"
            >
              <div className="flex items-center gap-3">
                <GameThumbnail game={game} />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">#{index + 1} payout</p>
                  <h3 className="truncate text-base font-extrabold text-[var(--brand-ink)]">{game.name}</h3>
                </div>
              </div>
              <p className="mt-4 text-2xl font-extrabold text-[var(--brand-ink)]">{money(game.topPayout)}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {game.bestPlatform} via {game.bestProvider}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section id="all-games" className="space-y-4">
        <div className="sticky top-16 z-20 rounded-2xl border border-[var(--border-default)] bg-white/95 p-4 shadow-[var(--shadow-card)] backdrop-blur">
          <div className="grid gap-3 lg:grid-cols-[1fr_13rem_13rem]">
            <label className="text-sm font-semibold text-[var(--brand-ink)]">
              <span className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Search games</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by game, provider, platform..."
                className="w-full rounded-xl border border-[var(--border-default)] bg-white px-3 py-2 text-sm outline-none focus:border-lime-400"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--brand-ink)]">
              <span className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="w-full rounded-xl border border-[var(--border-default)] bg-white px-3 py-2 text-sm"
              >
                <option value="top-payout">Highest payout</option>
                <option value="most-offers">Most offers</option>
                <option value="has-guide">Guide available</option>
                <option value="name">A to Z</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-[var(--brand-ink)]">
              <span className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Guide status</span>
              <select
                value={guideFilter}
                onChange={(event) => setGuideFilter(event.target.value as GuideFilter)}
                className="w-full rounded-xl border border-[var(--border-default)] bg-white px-3 py-2 text-sm"
              >
                <option value="all">All games</option>
                <option value="with-guides">Has guide</option>
                <option value="without-guides">No guide yet</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            Showing {visibleGames.length} of {games.length} tracked games. Payouts can change by country, device, and provider rules.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleGames.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.slug}`}
              className="group flex min-h-[13.5rem] flex-col rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-lime-400"
            >
              <div className="flex items-start gap-3">
                <GameThumbnail game={game} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    {game.guideCount > 0 ? (
                      <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-lime-800">
                        Guide available
                      </span>
                    ) : (
                      <span className="rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[var(--text-tertiary)]">
                        No guide yet
                      </span>
                    )}
                    <span className="rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[var(--text-tertiary)]">
                      {game.offerCount} offer{game.offerCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <h2 className="mt-2 line-clamp-2 text-lg font-extrabold leading-tight text-[var(--brand-ink)] group-hover:text-lime-700">
                    {game.name}
                  </h2>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Top payout</p>
                  <p className="text-2xl font-extrabold text-[var(--brand-ink)]">{money(game.topPayout)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Providers</p>
                  <p className="text-2xl font-extrabold text-[var(--brand-ink)]">{game.providerCount || 1}</p>
                </div>
              </div>

              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                Best visible route: <span className="font-bold text-[var(--brand-ink)]">{game.bestPlatform}</span> via {game.bestProvider}.
              </p>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                <span className="inline-flex rounded-xl bg-[var(--brand-ink)] px-4 py-2 text-sm font-extrabold text-[var(--brand-lime)]">
                  Compare offers
                </span>
                {game.guideCount > 0 ? (
                  <span className="inline-flex rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-bold text-[var(--brand-ink)]">
                    {game.guideCount} guide{game.guideCount !== 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>

        {visibleGames.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-default)] bg-white p-8 text-center shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-extrabold text-[var(--brand-ink)]">No games match those filters</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Clear the search or change the guide filter.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
