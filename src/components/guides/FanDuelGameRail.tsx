"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import {
    FANDUEL_CASINO_AFFILIATE_URL,
    FANDUEL_GAMES,
    type FanDuelGame,
    type FanDuelGameCategory,
} from "@/data/fanduel-games";

type FanDuelGameRailProps = {
    games?: FanDuelGame[];
};

type FilterValue = "all" | FanDuelGameCategory;

const filters: Array<{ value: FilterValue; label: string }> = [
    { value: "all", label: "All" },
    { value: "slots", label: "Slots" },
    { value: "table-games", label: "Table Games" },
    { value: "live-dealer", label: "Live Dealer" },
    { value: "jackpot", label: "Jackpots" },
    { value: "video-poker", label: "Video Poker" },
];

const categoryLabels: Record<FanDuelGameCategory, string> = {
    slots: "Slots",
    "table-games": "Table Games",
    "live-dealer": "Live Dealer",
    jackpot: "Jackpots",
    "video-poker": "Video Poker",
    exclusive: "Exclusive",
};

function gameEventSlug(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function FanDuelGameImage({ game }: { game: FanDuelGame }) {
    const [failed, setFailed] = useState(false);
    const [videoFailed, setVideoFailed] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const showImage = Boolean(game.imageUrl && !failed);
    const showAnimatedMedia = Boolean(game.animatedMediaUrl && !videoFailed && !prefersReducedMotion);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mediaQuery.matches);

        function handleChange(event: MediaQueryListEvent) {
            setPrefersReducedMotion(event.matches);
        }

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    if (showImage) {
        return (
            <div className="absolute inset-0">
                {showAnimatedMedia ? (
                    <video
                        src={game.animatedMediaUrl}
                        poster={game.imageUrl}
                        className="h-full w-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        aria-label={`${game.name} animated FanDuel Casino preview`}
                        onError={() => setVideoFailed(true)}
                    />
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={game.imageUrl}
                        alt={`${game.name} on FanDuel Casino`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={() => setFailed(true)}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            </div>
        );
    }

    return (
        <div
            className="absolute inset-0 flex flex-col justify-between p-4 text-white"
            style={{
                background:
                    game.fallbackGradient ??
                    "linear-gradient(135deg, #08111f 0%, #10233f 48%, #1493ff 100%)",
            }}
        >
            <div className="flex items-center justify-between">
                {game.featured ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-[rgba(15,23,15,0.78)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--brand-lime)] backdrop-blur-sm">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        Featured
                    </span>
                ) : (
                    <span />
                )}
            </div>
            <div>
                <p className="max-w-[10rem] text-2xl font-black leading-none text-white drop-shadow">
                    {game.fallbackIcon ?? game.name}
                </p>
            </div>
        </div>
    );
}

export default function FanDuelGameRail({ games }: FanDuelGameRailProps) {
    const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
    const sourceGames = games?.length ? games : FANDUEL_GAMES;

    const sortedGames = useMemo(() => {
        return [...sourceGames].sort((a, b) => {
            if (a.featured !== b.featured) return a.featured ? -1 : 1;
            return (a.popularityRank ?? 999) - (b.popularityRank ?? 999);
        });
    }, [sourceGames]);

    const visibleGames = useMemo(() => {
        if (activeFilter === "all") return sortedGames;
        return sortedGames.filter((game) => game.category === activeFilter);
    }, [activeFilter, sortedGames]);

    function scrollRail(direction: "left" | "right") {
        const rail = document.getElementById("fanduel-game-rail-scroll");
        if (!rail) return;

        const offset = Math.max(rail.clientWidth * 0.8, 240);
        rail.scrollBy({
            left: direction === "left" ? -offset : offset,
            behavior: "smooth",
        });
    }

    return (
        <section aria-labelledby="fanduel-game-rail-title" className="space-y-4">
            <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                        Curated game preview
                    </p>
                    <h2 id="fanduel-game-rail-title" className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--brand-ink)]">
                        Popular FanDuel Casino Games
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
                        FanDuel Casino includes slots, table games, live dealer games, roulette, blackjack,
                        video poker, and rotating promos for eligible players.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => scrollRail("left")}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-white text-[var(--brand-ink)] transition-colors hover:border-[var(--brand-lime)]/45 hover:bg-[var(--surface-muted)]"
                        aria-label="Scroll FanDuel games left"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollRail("right")}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-white text-[var(--brand-ink)] transition-colors hover:border-[var(--brand-lime)]/45 hover:bg-[var(--surface-muted)]"
                        aria-label="Scroll FanDuel games right"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="mt-6 flex gap-2 overflow-x-auto pb-2" aria-label="FanDuel Casino game filters">
                {filters.map((filter) => {
                    const isActive = activeFilter === filter.value;
                    return (
                        <button
                            key={filter.value}
                            type="button"
                            onClick={() => setActiveFilter(filter.value)}
                            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] transition focus:outline-none focus:ring-4 focus:ring-[var(--brand-lime)]/20 ${
                                isActive
                                    ? "border-[var(--brand-lime)] bg-[var(--brand-lime)] text-[var(--brand-ink)]"
                                    : "border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--brand-lime)]/45 hover:bg-[var(--surface-muted)]"
                            }`}
                            aria-pressed={isActive}
                        >
                            {filter.label}
                        </button>
                    );
                })}
            </div>

            <div
                id="fanduel-game-rail-scroll"
                className="-mx-4 mt-5 overflow-x-auto px-4 pb-2 hide-scrollbar scroll-smooth sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
                tabIndex={0}
                aria-label="Popular FanDuel Casino games"
            >
                <div className="flex snap-x snap-mandatory gap-4">
                    {visibleGames.map((game) => {
                        const ctaHref = game.ctaUrl ?? game.affiliateUrl ?? FANDUEL_CASINO_AFFILIATE_URL;

                        return (
                            <TrackedOutboundLink
                                key={game.id}
                                href={ctaHref}
                                eventLabel={`fanduel_casino_game_rail_${gameEventSlug(game.slug)}`}
                                location="fanduel_game_rail"
                                sourceContext="fanduel_casino_review_bonus"
                                platformName="FanDuel Casino"
                                rel="sponsored noopener noreferrer"
                                className="group flex w-[172px] flex-shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white text-left shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-lime)]/40 hover:shadow-[0_16px_36px_-20px_rgba(132,204,22,0.35)] sm:w-[196px] lg:w-[212px]"
                            >
                                <div className="relative aspect-[1.1/1] overflow-hidden border-b border-[var(--border-default)] bg-[var(--surface-muted)]">
                                    <FanDuelGameImage game={game} />
                                </div>

                                <div className="flex flex-1 flex-col gap-2 px-3.5 py-3.5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="mb-1 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                                                {[categoryLabels[game.category], game.provider].filter(Boolean).join(" / ")}
                                            </div>
                                            <h3 className="line-clamp-2 text-sm font-extrabold leading-tight text-[var(--brand-ink)] transition-colors group-hover:text-[color:hsl(84,93%,32%)]">
                                                {game.name}
                                            </h3>
                                        </div>
                                        <svg
                                            className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--brand-ink)] transition-transform duration-200 group-hover:translate-x-0.5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2.5}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </div>

                                    <p className="line-clamp-3 text-xs leading-5 text-[var(--text-secondary)]">
                                        {game.shortDescription}
                                    </p>

                                    <div className="mt-auto">
                                        <div className="line-clamp-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                                            {game.tags.slice(0, 2).join(" / ")}
                                        </div>
                                        <div className="text-lg font-extrabold text-[color:hsl(84,93%,30%)]">
                                            Play on FanDuel
                                        </div>
                                    </div>
                                </div>
                            </TrackedOutboundLink>
                        );
                    })}
                </div>
            </div>
            <p className="text-xs leading-5 text-[var(--text-tertiary)]">
                21+. New players only where applicable. Terms apply. Availability varies by state.
            </p>
        </section>
    );
}
