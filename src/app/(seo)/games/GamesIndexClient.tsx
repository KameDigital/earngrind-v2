"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Clock3,
  Compass,
  Gamepad2,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { formatPayoutFreshness } from "@/lib/payout-freshness";

export type GamesIndexItem = {
  id: string;
  slug: string;
  name: string;
  thumbnailUrl: string | null;
  gameThumbnailUrl?: string | null;
  offerImageUrl?: string | null;
  platformLogoUrl?: string | null;
  providerLogoUrl?: string | null;
  topPayout: number;
  guideCount: number;
  guideSlug?: string | null;
  offerCount: number;
  bestProvider: string;
  bestPlatform: string;
  category: string;
  updatedAt: string | null;
  providerCount: number;
  platformCount: number;
};

type GamesIndexSummary = {
  totalGames: number;
  highestPayout: number;
  guidesAvailable: number;
  trackedOffers: number;
  providersTracked: number;
};

type SortOption = "top-payout" | "most-offers" | "has-guide" | "name";
type QuickFilter =
  | "all"
  | "highest-paying"
  | "beginner-friendly"
  | "has-guide"
  | "multiple-providers"
  | "android"
  | "ios"
  | "desktop";
type ThumbnailVariant = "card" | "featured" | "hero";
type BadgeTone = "lime" | "amber" | "blue" | "purple" | "orange" | "slate";

const SEA_OF_CONQUEST_GUIDE_MAP: Record<string, string> = {
  "sea-of-conquest-pirate-war": "sea-of-conquest-flagship-level-30-guide",
};

const filterLabels: Array<{ id: QuickFilter; label: string; icon: LucideIcon }> = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "highest-paying", label: "Highest paying", icon: TrendingUp },
  { id: "beginner-friendly", label: "Beginner friendly", icon: ShieldCheck },
  { id: "has-guide", label: "Has guide", icon: BadgeCheck },
  { id: "multiple-providers", label: "Multiple providers", icon: Users },
  { id: "android", label: "Android", icon: Gamepad2 },
  { id: "ios", label: "iOS", icon: Gamepad2 },
  { id: "desktop", label: "Desktop", icon: BarChart3 },
];

function money(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function initials(name: string) {
  const compact = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return compact || "EG";
}

function getGuideSlug(game: GamesIndexItem) {
  return game.guideSlug ?? SEA_OF_CONQUEST_GUIDE_MAP[game.slug] ?? null;
}

function getGameImageUrl(game: GamesIndexItem) {
  return (
    game.gameThumbnailUrl ??
    game.thumbnailUrl ??
    game.offerImageUrl ??
    null
  );
}

function getDifficulty(game: GamesIndexItem) {
  const text = `${game.name} ${game.category}`.toLowerCase();
  if (game.topPayout >= 250 || /casino|slots|strategy|conquest|survival|rpg|city|kingdom|empire/.test(text)) return "High effort";
  if (game.topPayout >= 100 || /merge|puzzle|miner|idle/.test(text)) return "Moderate";
  return "Beginner friendly";
}

function isBeginnerFriendly(game: GamesIndexItem) {
  return getDifficulty(game) === "Beginner friendly" || (game.topPayout < 150 && !/casino|slots|conquest|kingdom|empire/i.test(game.name));
}

function getPlatformText(game: GamesIndexItem) {
  return `${game.bestPlatform || ""} ${game.category || ""}`.toLowerCase();
}

function supportsPlatform(game: GamesIndexItem, platform: "android" | "ios" | "desktop") {
  const text = getPlatformText(game);
  if (platform === "desktop") return /desktop|web|pc|browser/.test(text);
  return text.includes(platform);
}

function badgeClass(tone: BadgeTone) {
  const tones = {
    lime: "border-lime-200 bg-lime-100 text-lime-800",
    amber: "border-amber-200 bg-amber-100 text-amber-800",
    blue: "border-sky-200 bg-sky-100 text-sky-800",
    purple: "border-violet-200 bg-violet-100 text-violet-800",
    orange: "border-orange-200 bg-orange-100 text-orange-800",
    slate: "border-slate-200 bg-slate-100 text-slate-700",
  };
  return tones[tone];
}

function GameThumbnail({
  title,
  imageUrl,
  category,
  platform,
  variant = "card",
  priority = false,
}: {
  title: string;
  imageUrl?: string | null;
  category?: string | null;
  platform?: string | null;
  variant?: ThumbnailVariant;
  priority?: boolean;
}) {
  const [hasError, setHasError] = useState(false);
  const sizeClass =
    variant === "hero"
      ? "h-16 w-16 rounded-2xl"
      : variant === "featured"
        ? "h-36 w-full rounded-[1.35rem]"
        : "h-14 w-14 rounded-2xl";
  const textClass = variant === "featured" ? "text-3xl" : "text-base";
  const fallbackLabel = category || platform || "Game offer";

  if (!imageUrl || hasError) {
    return (
      <div
        className={`${sizeClass} relative flex shrink-0 items-center justify-center overflow-hidden border border-lime-200 bg-[radial-gradient(circle_at_30%_20%,#ecfccb,#dcfce7_42%,#f8fafc)] shadow-sm`}
        aria-label={`${title} game offer icon fallback`}
      >
        <div className="absolute -right-4 -top-4 h-14 w-14 rounded-full bg-lime-300/30" />
        <div className="absolute -bottom-5 -left-3 h-16 w-16 rounded-full bg-emerald-300/20" />
        <span className={`${textClass} relative font-black tracking-tight text-lime-900`}>{initials(title)}</span>
        {variant !== "card" ? (
          <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-sm">
            {fallbackLabel}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`${sizeClass} relative shrink-0 overflow-hidden border border-slate-200 bg-white shadow-sm`}>
      {/* Imported offer images come from several wall CDNs; native img avoids next/image host allow-list crashes. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={`${title} game offer icon`}
        className="h-full w-full object-cover"
        loading={priority ? "eager" : "lazy"}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

function Badge({ icon: Icon, label, tone }: { icon: LucideIcon; label: string; tone: BadgeTone }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${badgeClass(tone)}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}

function GameBadges({ game, compact = false }: { game: GamesIndexItem; compact?: boolean }) {
  const guideSlug = getGuideSlug(game);
  const difficulty = getDifficulty(game);
  const badges = [
    game.topPayout >= 250
      ? { icon: Trophy, label: "Top payout", tone: "amber" as const }
      : game.topPayout >= 100
        ? { icon: TrendingUp, label: "High payout", tone: "amber" as const }
        : null,
    game.providerCount >= 3 ? { icon: Users, label: "Multiple providers", tone: "blue" as const } : null,
    guideSlug ? { icon: BadgeCheck, label: "Guide available", tone: "purple" as const } : null,
    difficulty === "Beginner friendly"
      ? { icon: ShieldCheck, label: "Beginner friendly", tone: "lime" as const }
      : difficulty === "Moderate"
        ? { icon: Target, label: "Moderate", tone: "slate" as const }
        : { icon: Clock3, label: "High effort", tone: "orange" as const },
  ].filter(Boolean) as Array<{ icon: LucideIcon; label: string; tone: BadgeTone }>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.slice(0, compact ? 3 : 4).map((badge) => (
        <Badge key={badge.label} {...badge} />
      ))}
    </div>
  );
}

function DifficultyBadge({ game }: { game: GamesIndexItem }) {
  const difficulty = getDifficulty(game);
  const tone: BadgeTone = difficulty === "Beginner friendly" ? "lime" : difficulty === "Moderate" ? "slate" : "orange";
  const icon = difficulty === "Beginner friendly" ? ShieldCheck : difficulty === "Moderate" ? Target : Clock3;
  return <Badge icon={icon} label={difficulty} tone={tone} />;
}

function getGridHighlightBadges(game: GamesIndexItem) {
  return [
    game.topPayout >= 100 ? { icon: TrendingUp, label: game.topPayout >= 250 ? "Top payout" : "High payout", tone: "amber" as const } : null,
    game.providerCount >= 3 ? { icon: Users, label: "Compare routes", tone: "blue" as const } : null,
    getGuideSlug(game) ? { icon: BadgeCheck, label: "Guide available", tone: "purple" as const } : null,
    isBeginnerFriendly(game) ? { icon: ShieldCheck, label: "Beginner pick", tone: "lime" as const } : null,
  ].filter(Boolean) as Array<{ icon: LucideIcon; label: string; tone: BadgeTone }>;
}

function AdvancedLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const base =
    "group/cta inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500";
  const styles = {
    primary: "bg-slate-950 text-lime-300 shadow-lg shadow-lime-900/10 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-lime-900/15",
    secondary: "border border-lime-300 bg-lime-50 text-slate-950 hover:-translate-y-0.5 hover:bg-lime-100 hover:shadow-md",
    ghost: "border border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-lime-300 hover:bg-lime-50",
  };
  return (
    <Link href={href} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </Link>
  );
}

function pickFeaturedGames(games: GamesIndexItem[]) {
  const picks: Array<{ key: string; label: string; reason: string; icon: LucideIcon; game: GamesIndexItem }> = [];
  const addPick = (key: string, label: string, reason: string, icon: LucideIcon, game?: GamesIndexItem) => {
    if (!game || picks.some((pick) => pick.game.id === game.id)) return;
    picks.push({ key, label, reason, icon, game });
  };

  addPick("highest", "Highest payout", "Highest tracked payout in this view.", Trophy, games[0]);
  addPick(
    "overall",
    "Best beginner pick",
    "Strong payout-to-provider mix with a lower-friction difficulty signal.",
    Star,
    [...games].filter(isBeginnerFriendly).sort((a, b) => b.topPayout + b.providerCount * 25 + b.guideCount * 20 - (a.topPayout + a.providerCount * 25 + a.guideCount * 20))[0],
  );
  addPick(
    "beginner",
    "Beginner-friendly",
    "Lower-risk starting point based on payout and category signals.",
    ShieldCheck,
    games.find(isBeginnerFriendly),
  );
  addPick("providers", "Most providers", "More provider routes to compare before starting.", Users, [...games].sort((a, b) => b.providerCount - a.providerCount || b.topPayout - a.topPayout)[0]);
  addPick("guide", "Guide available", "Read a route guide before committing time or money.", BadgeCheck, games.find((game) => Boolean(getGuideSlug(game))));

  return picks.slice(0, 4);
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
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");

  const latestUpdatedAt = useMemo(
    () =>
      games
        .map((game) => game.updatedAt)
        .filter(Boolean)
        .sort()
        .at(-1) ?? null,
    [games],
  );
  const featuredPicks = useMemo(() => pickFeaturedGames(games), [games]);
  const topHeroGames = games.slice(0, 3);
  const categories = useMemo(() => Array.from(new Set(games.map((game) => game.category).filter(Boolean))).slice(0, 7), [games]);

  const visibleGames = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...games]
      .filter((game) => {
        if (quickFilter === "highest-paying" && game.topPayout < 100) return false;
        if (quickFilter === "beginner-friendly" && !isBeginnerFriendly(game)) return false;
        if (quickFilter === "has-guide" && !getGuideSlug(game)) return false;
        if (quickFilter === "multiple-providers" && game.providerCount < 3) return false;
        if (quickFilter === "android" && !supportsPlatform(game, "android")) return false;
        if (quickFilter === "ios" && !supportsPlatform(game, "ios")) return false;
        if (quickFilter === "desktop" && !supportsPlatform(game, "desktop")) return false;
        if (!normalizedQuery) return true;
        return [game.name, game.bestProvider, game.bestPlatform, game.category]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (sortBy === "most-offers") return b.offerCount - a.offerCount || b.topPayout - a.topPayout;
        if (sortBy === "has-guide") return Number(Boolean(getGuideSlug(b))) - Number(Boolean(getGuideSlug(a))) || b.topPayout - a.topPayout;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return b.topPayout - a.topPayout || b.offerCount - a.offerCount;
      });
  }, [games, quickFilter, query, sortBy]);

  if (games.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border-default)] bg-white p-12 text-center shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-bold text-[var(--brand-ink)]">No games available</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">No tracked games are available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-[2rem] border border-lime-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-center">
          <div>
            <p className="section-label mb-3">Game offer discovery</p>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Find the highest-paying game offers
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Compare payouts, difficulty, providers, deadlines, and tracking risk before you start.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setQuickFilter("highest-paying");
                  setSortBy("top-payout");
                }}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-extrabold text-lime-300 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500"
              >
                <Trophy className="h-4 w-4" aria-hidden="true" />
                Highest payout
              </button>
              <button
                type="button"
                onClick={() => setQuickFilter("beginner-friendly")}
                className="inline-flex items-center gap-2 rounded-full border border-lime-300 bg-lime-50 px-4 py-2 text-sm font-extrabold text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-lime-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Beginner-friendly
              </button>
              <button
                type="button"
                onClick={() => setSortBy("most-offers")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-800 transition-all hover:-translate-y-0.5 hover:border-lime-300 hover:bg-lime-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500"
              >
                <Zap className="h-4 w-4" aria-hidden="true" />
                Fastest completion
              </button>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Games tracked</p>
                <p className="mt-1 text-3xl font-black text-slate-950">{summary.totalGames}</p>
              </div>
              <div className="rounded-2xl border border-lime-200 bg-lime-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-lime-800">Highest payout</p>
                <p className="mt-1 text-3xl font-black text-slate-950">{money(summary.highestPayout)}</p>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-sky-800">Available offers</p>
                <p className="mt-1 text-3xl font-black text-slate-950">{summary.trackedOffers}</p>
              </div>
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-violet-800">Providers tracked</p>
                <p className="mt-1 text-3xl font-black text-slate-950">{summary.providersTracked}</p>
              </div>
            </div>
            {latestUpdatedAt ? (
              <p className="mt-3 text-xs font-semibold text-slate-500">Freshness signal: {formatPayoutFreshness(latestUpdatedAt)}</p>
            ) : null}
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-4 text-white shadow-2xl shadow-slate-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-lime-300">Top payout today</p>
                <p className="mt-1 text-3xl font-black">{money(summary.highestPayout)}</p>
              </div>
              <div className="rounded-2xl bg-lime-300 p-3 text-slate-950">
                <BarChart3 className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {topHeroGames.map((game, index) => (
                <Link
                  key={game.id}
                  href={`/games/${game.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 p-3 transition-all hover:-translate-y-0.5 hover:border-lime-300/70 hover:bg-white/12"
                >
                  <GameThumbnail title={game.name} imageUrl={getGameImageUrl(game)} category={game.category} platform={game.bestPlatform} variant="hero" priority={index === 0} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Featured route</p>
                    <p className="truncate font-black text-white">{game.name}</p>
                    <p className="text-xs text-slate-300">{game.providerCount || 1} provider route{game.providerCount !== 1 ? "s" : ""}</p>
                  </div>
                  <p className="text-lg font-black text-lime-300">{money(game.topPayout)}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-label">Editorial shortcuts</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Best game offers right now</h2>
            <p className="mt-1 text-sm text-slate-600">Dynamic picks from the current tracked game data.</p>
          </div>
          <AdvancedLink href="#all-games" variant="ghost">
            Browse games <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </AdvancedLink>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featuredPicks.map((pick, index) => {
            const guideSlug = getGuideSlug(pick.game);
            const Icon = pick.icon;
            return (
              <article
                key={`${pick.key}-${pick.game.id}`}
                className="group relative flex min-h-[28rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-1 hover:border-lime-300 hover:shadow-[0_26px_80px_rgba(15,23,42,0.13)] focus-within:border-lime-400"
              >
                <Link href={`/games/${pick.game.slug}`} className="absolute inset-0 rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500" aria-label={`Compare ${pick.game.name} offers`} />
                <Link href={`/games/${pick.game.slug}`} className="relative z-10 block">
                  <GameThumbnail title={pick.game.name} imageUrl={getGameImageUrl(pick.game)} category={pick.game.category} platform={pick.game.bestPlatform} variant="featured" priority={index < 2} />
                </Link>
                <div className="relative z-10 mt-4 flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${badgeClass(pick.key === "highest" ? "amber" : pick.key === "providers" ? "blue" : pick.key === "guide" ? "purple" : "lime")}`}>
                      <Icon className="h-3 w-3" aria-hidden="true" />
                      {pick.label}
                    </span>
                    <h3 className="mt-3 line-clamp-2 text-lg font-black leading-tight text-slate-950">
                      <Link href={`/games/${pick.game.slug}`} className="relative z-10 hover:text-lime-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500">
                        {pick.game.name}
                      </Link>
                    </h3>
                  </div>
                </div>
                <div className="relative z-10 mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Max payout</p>
                    <p className="mt-1 text-3xl font-black text-slate-950">{money(pick.game.topPayout)}</p>
                  </div>
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-sky-800">Providers</p>
                    <p className="mt-1 text-3xl font-black text-slate-950">{pick.game.providerCount || 1}</p>
                  </div>
                </div>
                <p className="relative z-10 mt-3 text-sm leading-relaxed text-slate-600">
                  {pick.reason} {pick.game.bestProvider ? `Top route currently appears via ${pick.game.bestProvider}.` : ""}
                </p>
                <div className="relative z-10 mt-3 flex flex-wrap gap-1.5">
                  <DifficultyBadge game={pick.game} />
                  {guideSlug ? <Badge icon={BadgeCheck} label="Guide available" tone="purple" /> : null}
                </div>
                <div className="relative z-10 mt-auto flex flex-wrap gap-2 pt-5">
                  <AdvancedLink href={`/games/${pick.game.slug}`} className="flex-1 min-w-[8.5rem]">
                    Compare offers <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" aria-hidden="true" />
                  </AdvancedLink>
                  {guideSlug ? (
                    <AdvancedLink href={`/guides/${guideSlug}`} variant="secondary" className="flex-1 min-w-[7.5rem]">
                      View guide
                    </AdvancedLink>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="section-label">How EarnGrind ranks game offers</p>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-600">
              EarnGrind compares available payout, provider count, difficulty, platform availability, guide coverage, and tracking risk signals where available. Always verify the live offer terms before starting because payouts and requirements can change.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: TrendingUp, title: "Compare payout", text: "Start with the strongest tracked route." },
              { icon: Users, title: "Check providers", text: "Look for multiple options before clicking out." },
              { icon: Compass, title: "Read guides", text: "Use route notes before spending time or money." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <Icon className="h-5 w-5 text-lime-700" aria-hidden="true" />
                  <h3 className="mt-2 text-sm font-black text-slate-950">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="all-games" className="space-y-4">
        <div className="sticky top-16 z-20 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-label">Offer finder</p>
              <h2 className="text-2xl font-black text-slate-950">Find your next game offer</h2>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              Showing {visibleGames.length} games sorted by {sortBy === "top-payout" ? "highest payout" : sortBy === "most-offers" ? "most offers" : sortBy === "has-guide" ? "guide coverage" : "A to Z"}
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem]">
            <label className="relative text-sm font-semibold text-slate-950">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">Search games</span>
              <Search className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by game, provider, platform..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-200"
              />
            </label>
            <label className="text-sm font-semibold text-slate-950">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-200"
              >
                <option value="top-payout">Highest payout</option>
                <option value="most-offers">Most offers</option>
                <option value="has-guide">Guide available</option>
                <option value="name">A to Z</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs font-semibold leading-relaxed text-slate-500">
            Rankings use tracked max payout, provider count, difficulty, and guide coverage where available. Always verify live offer terms before starting.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {filterLabels.map((filter) => {
              const Icon = filter.icon;
              const active = quickFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setQuickFilter(filter.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500 ${
                    active
                      ? "border-slate-950 bg-slate-950 text-lime-300 shadow-md"
                      : "border-slate-200 bg-white text-slate-700 hover:border-lime-300 hover:bg-lime-50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleGames.map((game) => {
            const guideSlug = getGuideSlug(game);
            const highlightBadges = getGridHighlightBadges(game);
            return (
              <article
                key={game.id}
                className="group relative flex min-h-[18rem] flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-1 hover:border-lime-300 hover:shadow-[0_22px_60px_rgba(15,23,42,0.1)] focus-within:border-lime-400"
              >
                <Link href={`/games/${game.slug}`} className="absolute inset-0 rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500" aria-label={`Compare ${game.name} offers`} />
                <Link href={`/games/${game.slug}`} className="relative z-10 flex items-start gap-3">
                  <GameThumbnail title={game.name} imageUrl={getGameImageUrl(game)} category={game.category} platform={game.bestPlatform} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{game.category || "Game offer"}</p>
                    <h2 className="mt-1 line-clamp-2 text-lg font-black leading-tight text-slate-950 group-hover:text-lime-700">{game.name}</h2>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-lime-700" aria-hidden="true" />
                </Link>

                <div className="relative z-10 mt-4 flex flex-wrap gap-1.5">
                  {highlightBadges.length > 0 ? (
                    highlightBadges.slice(0, 3).map((badge) => <Badge key={badge.label} {...badge} />)
                  ) : (
                    <GameBadges game={game} compact />
                  )}
                </div>

                <div className="relative z-10 mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Max payout</p>
                    <p className="mt-1 text-2xl font-black text-slate-950">{money(game.topPayout)}</p>
                  </div>
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-sky-800">Providers</p>
                    <p className="mt-1 text-2xl font-black text-slate-950">{game.providerCount || 1}</p>
                  </div>
                </div>

                <div className="relative z-10 mt-4 space-y-1 text-sm text-slate-600">
                  <p>
                    Best provider: <span className="font-bold text-slate-950">{game.bestProvider}</span>
                  </p>
                  <p>
                    Platform route: <span className="font-bold text-slate-950">{game.bestPlatform}</span>
                  </p>
                  <p className="text-xs font-semibold text-slate-500">{formatPayoutFreshness(game.updatedAt)}</p>
                </div>

                <div className="relative z-10 mt-auto flex flex-wrap gap-2 pt-5">
                  <AdvancedLink href={`/games/${game.slug}`} className="flex-1 min-w-[8.5rem]">
                    Compare offers <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" aria-hidden="true" />
                  </AdvancedLink>
                  {guideSlug ? (
                    <AdvancedLink href={`/guides/${guideSlug}`} variant="secondary" className="flex-1 min-w-[7.5rem]">
                      View guide
                    </AdvancedLink>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        {visibleGames.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-default)] bg-white p-8 text-center shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-extrabold text-[var(--brand-ink)]">No games match those filters</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Clear the search or try another quick filter.</p>
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-lime-200 bg-[linear-gradient(135deg,#f7fee7,#ffffff_52%,#ecfeff)] p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="section-label">Next step</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Not sure which game offer to start?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
              Compare the highest-paying games, check tracking basics, and read route guides before spending time or money.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <AdvancedLink href="#all-games">
                Browse highest-paying games <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </AdvancedLink>
              <AdvancedLink href="/guides" variant="secondary">
                Read route guides
              </AdvancedLink>
              <AdvancedLink href="/highest-paying-gpt-games" variant="ghost">
                View beginner-friendly offers
              </AdvancedLink>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p className="text-2xl font-black text-slate-950">{summary.totalGames}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Games</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p className="text-2xl font-black text-slate-950">{summary.trackedOffers}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Offers</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p className="text-2xl font-black text-slate-950">{summary.guidesAvailable}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Guides</p>
            </div>
          </div>
        </div>
        {categories.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((category) => (
              <span key={category} className="rounded-full border border-lime-200 bg-white/80 px-3 py-1 text-xs font-bold text-slate-600">
                {category}
              </span>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
