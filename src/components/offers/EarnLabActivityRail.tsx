"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
            <Image
                src={activity.avatarUrl}
                alt={activity.username}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
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
        <div className="flex w-[220px] flex-shrink-0 snap-start items-center gap-3 rounded-2xl border border-white/10 bg-[rgba(10,16,30,0.88)] px-3.5 py-3 text-left shadow-[0_18px_44px_-28px_rgba(15,23,42,0.9)] transition-colors hover:border-[var(--brand-lime)]/35 sm:w-[250px]">
            <Avatar activity={activity} />
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold text-white">
                    {activity.title}
                </div>
                <div className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {secondaryLabel}
                </div>
            </div>
            {amount ? (
                <div className="text-right">
                    <div className="text-sm font-extrabold text-[var(--brand-lime)]">{amount}</div>
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
            return Array.from({ length: 4 }, (_, index) => (
                <div
                    key={`earnlab-activity-skeleton-${index}`}
                    className="h-[72px] w-[220px] flex-shrink-0 animate-pulse rounded-2xl border border-white/8 bg-white/5 sm:w-[250px]"
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
        <section className="mb-6 overflow-hidden rounded-[28px] border border-[rgba(148,163,184,0.16)] bg-[linear-gradient(180deg,rgba(9,14,28,0.98),rgba(15,23,42,0.96))] px-4 py-4 text-white shadow-[0_24px_64px_-32px_rgba(15,23,42,0.85)] sm:mb-8 sm:px-5 sm:py-5">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand-lime)]">
                        EarnLab activity
                    </p>
                    <h2 className="text-lg font-extrabold tracking-tight text-white sm:text-xl">
                        Recently completed
                    </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                    Live feed
                </div>
            </div>

            <div className="-mx-4 overflow-x-auto px-4 pb-1 hide-scrollbar sm:-mx-5 sm:px-5">
                <div className="flex min-h-[72px] snap-x snap-mandatory gap-3">
                    {content}
                </div>
            </div>
        </section>
    );
}

