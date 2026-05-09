"use client";

import { useEffect, useMemo, useState } from "react";
import type { EarnLabActivity } from "@/lib/earnlab-activities";

type RailState = {
    activities: EarnLabActivity[];
    loading: boolean;
};

type CachedActivityRail = {
    fetchedAt: number;
    activities: EarnLabActivity[];
};

const ACTIVITY_CACHE_KEY = "earngrind:earnlab-activity-rail:v1";
const ACTIVITY_REFRESH_MS = 60 * 60 * 1000;

const amountFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function formatAmount(amountUsd?: number): string {
    return typeof amountUsd === "number" && Number.isFinite(amountUsd)
        ? amountFormatter.format(amountUsd)
        : "";
}

function getAvatarFallback(activity: EarnLabActivity): string {
    if (activity.type === "WITHDRAWAL") {
        return "$";
    }

    const label = activity.username || activity.title;
    return label.trim().charAt(0).toUpperCase() || "A";
}

function getSecondaryLabel(activity: EarnLabActivity): string {
    if (activity.type === "WITHDRAWAL") {
        return activity.subTitle || "Cashout";
    }

    return activity.provider || activity.subTitle || activity.username;
}

function Avatar({ activity }: { activity: EarnLabActivity }) {
    const [imageFailed, setImageFailed] = useState(false);

    if (activity.avatarUrl && !imageFailed) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={activity.avatarUrl}
                alt={activity.username}
                className="h-8 w-8 rounded-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
            />
        );
    }

    return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xs font-extrabold uppercase text-white/85">
            {getAvatarFallback(activity)}
        </div>
    );
}

function ActivityCard({ activity }: { activity: EarnLabActivity }) {
    const secondaryLabel = getSecondaryLabel(activity);
    const amount = formatAmount(activity.amountUsd);

    return (
        <div className="flex h-14 w-[236px] flex-shrink-0 snap-start items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-left transition-colors hover:border-[var(--brand-lime)]/35 hover:bg-white/[0.09] sm:w-[260px]">
            <Avatar activity={activity} />
            <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-extrabold text-white">
                    {activity.title}
                </div>
                <div className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {secondaryLabel}
                </div>
            </div>
            {amount ? (
                <div className="min-w-[56px] text-right">
                    <div className="text-[13px] font-extrabold text-[var(--brand-lime)]">{amount}</div>
                </div>
            ) : null}
        </div>
    );
}

function readCachedActivities(): CachedActivityRail | null {
    try {
        const raw = window.localStorage.getItem(ACTIVITY_CACHE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as CachedActivityRail;
        if (!Array.isArray(parsed.activities) || typeof parsed.fetchedAt !== "number") {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
}

function writeCachedActivities(activities: EarnLabActivity[]) {
    try {
        window.localStorage.setItem(
            ACTIVITY_CACHE_KEY,
            JSON.stringify({
                fetchedAt: Date.now(),
                activities,
            } satisfies CachedActivityRail),
        );
    } catch {
        // Storage can be unavailable in private or restricted browser contexts.
    }
}

export default function EarnLabActivityRail() {
    const [{ activities, loading }, setState] = useState<RailState>({
        activities: [],
        loading: true,
    });

    useEffect(() => {
        let isActive = true;
        let refreshTimeout: ReturnType<typeof setTimeout> | undefined;
        let refreshInterval: ReturnType<typeof setInterval> | undefined;

        async function loadActivities() {
            try {
                const response = await fetch("/api/earnlab/activities", {
                    headers: {
                        accept: "application/json",
                    },
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error(`unexpected_status_${response.status}`);
                }

                const payload = await response.json();
                const nextActivities = Array.isArray(payload) ? (payload as EarnLabActivity[]) : [];
                writeCachedActivities(nextActivities);

                if (isActive) {
                    setState({
                        activities: nextActivities,
                        loading: false,
                    });
                }
            } catch {
                if (isActive) {
                    setState({
                        activities: [],
                        loading: false,
                    });
                }
            }
        }

        function scheduleHourlyRefresh(delayMs: number) {
            refreshTimeout = setTimeout(() => {
                void loadActivities();
                refreshInterval = setInterval(() => {
                    void loadActivities();
                }, ACTIVITY_REFRESH_MS);
            }, delayMs);
        }

        const cached = readCachedActivities();
        const cacheAge = cached ? Date.now() - cached.fetchedAt : Number.POSITIVE_INFINITY;

        if (cached && cacheAge >= 0 && cacheAge < ACTIVITY_REFRESH_MS) {
            setState({
                activities: cached.activities,
                loading: false,
            });
            scheduleHourlyRefresh(ACTIVITY_REFRESH_MS - cacheAge);
        } else {
            void loadActivities();
            scheduleHourlyRefresh(ACTIVITY_REFRESH_MS);
        }

        return () => {
            isActive = false;
            if (refreshTimeout) clearTimeout(refreshTimeout);
            if (refreshInterval) clearInterval(refreshInterval);
        };
    }, []);

    const marqueeItems = useMemo(() => {
        if (loading) {
            return Array.from({ length: 6 }, (_, index) => (
                <div
                    key={`earnlab-activity-skeleton-${index}`}
                    className="h-14 w-[236px] flex-shrink-0 animate-pulse rounded-xl border border-white/8 bg-white/5 sm:w-[260px]"
                />
            ));
        }

        if (activities.length === 0) {
            return (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    No recent EarnLab activity is available right now.
                </div>
            );
        }

        return activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />);
    }, [activities, loading]);

    const shouldAnimate = !loading && activities.length > 0;

    return (
        <section className="overflow-hidden border-y border-white/10 bg-[#070b16] text-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:px-8">
                <div className="flex min-w-[176px] items-center justify-between gap-3 lg:block">
                    <div>
                        <h2 className="text-sm font-extrabold tracking-tight text-white">
                            Recently completed
                        </h2>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300 lg:hidden">
                        Live
                    </div>
                </div>

                <div className="-mx-4 min-w-0 flex-1 overflow-hidden px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
                    <div className={shouldAnimate ? "activity-marquee flex min-h-14 w-max gap-3" : "flex min-h-14 gap-3"}>
                        <div className="flex gap-3">
                            {marqueeItems}
                        </div>
                        {shouldAnimate ? (
                            <div className="flex gap-3" aria-hidden="true">
                                {activities.map((activity) => (
                                    <ActivityCard key={`${activity.id}-duplicate`} activity={activity} />
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            <style jsx>{`
                .activity-marquee {
                    animation: earnlab-activity-marquee 48s linear infinite;
                }

                .activity-marquee:hover {
                    animation-play-state: paused;
                }

                @keyframes earnlab-activity-marquee {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(calc(-50% - 0.375rem));
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .activity-marquee {
                        animation: none;
                    }
                }
            `}</style>
        </section>
    );
}
