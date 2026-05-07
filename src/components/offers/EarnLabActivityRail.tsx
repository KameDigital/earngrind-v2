"use client";

import { useEffect, useMemo, useState } from "react";
import type { EarnLabActivity } from "@/lib/earnlab-activities";

type RailState = {
    activities: EarnLabActivity[];
    loading: boolean;
};

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

export default function EarnLabActivityRail() {
    const [{ activities, loading }, setState] = useState<RailState>({
        activities: [],
        loading: true,
    });

    useEffect(() => {
        let isActive = true;

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

        void loadActivities();

        return () => {
            isActive = false;
        };
    }, []);

    const content = useMemo(() => {
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

        return activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
        ));
    }, [activities, loading]);

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

                <div className="-mx-4 min-w-0 flex-1 overflow-x-auto px-4 hide-scrollbar sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
                    <div className="flex min-h-14 snap-x snap-mandatory gap-3">
                        {content}
                    </div>
                </div>
            </div>
        </section>
    );
}
