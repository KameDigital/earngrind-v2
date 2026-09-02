"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ChevronRight, Sparkles, AlertCircle } from "lucide-react";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";

export interface PreviewOfferItem {
    id: string;
    title: string;
    gameName?: string | null;
    gameSlug?: string | null;
    imageUrl?: string | null;
    payoutUsd: number;
    totalPayoutUsd: number;
    providerName?: string | null;
    platformName?: string | null;
    goalText?: string | null;
    offerUrl?: string | null;
}

interface SiteOfferPreviewProps {
    platformName: string;
    platformSlug?: string;
    initialOffers?: PreviewOfferItem[];
}

export default function SiteOfferPreview({
    platformName,
    platformSlug,
    initialOffers = [],
}: SiteOfferPreviewProps) {
    const [offers, setOffers] = useState<PreviewOfferItem[]>(initialOffers ?? []);
    const [loading, setLoading] = useState<boolean>((initialOffers?.length ?? 0) === 0);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const fetchedForRef = React.useRef<string | null>(null);

    useEffect(() => {
        if (initialOffers && initialOffers.length > 0) {
            setOffers(initialOffers);
            setLoading(false);
            return;
        }

        if (fetchedForRef.current === platformName) return;
        fetchedForRef.current = platformName;

        let isMounted = true;
        async function fetchPlatformOffers() {
            setLoading(true);
            try {
                const res = await fetch(`/api/offers?per_page=18&platform_name=${encodeURIComponent(platformName)}`);
                if (!res.ok) throw new Error("Failed to fetch platform offers");
                const json = await res.json();
                if (isMounted && Array.isArray(json.data) && json.data.length > 0) {
                    const mapped: PreviewOfferItem[] = json.data.map((item: any) => ({
                        id: item.id,
                        title: item.title,
                        gameName: item.game?.name || item.title,
                        gameSlug: item.game?.slug || null,
                        imageUrl: item.image_url || item.game?.thumbnail_url || null,
                        payoutUsd: Number(item.payout_usd || 0),
                        totalPayoutUsd: Number(item.total_payout_usd || item.payout_usd || 0),
                        providerName: item.provider_name || null,
                        platformName: item.platform?.name || platformName,
                        goalText: item.goal_text || null,
                        offerUrl: item.redirect_url || item.offer_url || null,
                    }));
                    setOffers(mapped);
                } else if (isMounted) {
                    // Fallback to top featured offers if zero direct platform offers returned
                    const fallbackRes = await fetch(`/api/offers?per_page=9`);
                    if (fallbackRes.ok) {
                        const fallbackJson = await fallbackRes.json();
                        if (Array.isArray(fallbackJson.data)) {
                            setOffers(
                                fallbackJson.data.map((item: any) => ({
                                    id: item.id,
                                    title: item.title,
                                    gameName: item.game?.name || item.title,
                                    gameSlug: item.game?.slug || null,
                                    imageUrl: item.image_url || item.game?.thumbnail_url || null,
                                    payoutUsd: Number(item.payout_usd || 0),
                                    totalPayoutUsd: Number(item.total_payout_usd || item.payout_usd || 0),
                                    providerName: item.provider_name || null,
                                    platformName: item.platform?.name || null,
                                    goalText: item.goal_text || null,
                                    offerUrl: item.redirect_url || item.offer_url || null,
                                }))
                            );
                        }
                    }
                }
            } catch (err) {
                console.error("SiteOfferPreview fetch error:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchPlatformOffers();
        return () => {
            isMounted = false;
        };
    }, [platformName]);

    const filteredOffers = useMemo(() => {
        if (!searchQuery.trim()) return offers.slice(0, 6);
        const q = searchQuery.toLowerCase().trim();
        return offers
            .filter(
                (o) =>
                    o.title.toLowerCase().includes(q) ||
                    (o.gameName && o.gameName.toLowerCase().includes(q)) ||
                    (o.providerName && o.providerName.toLowerCase().includes(q))
            )
            .slice(0, 6);
    }, [offers, searchQuery]);

    const seeAllHref = `/offers?q=${encodeURIComponent(platformName)}`;

    return (
        <section aria-labelledby="platform-offers-heading" className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2
                        id="platform-offers-heading"
                        className="text-lg font-black tracking-tight text-slate-950 sm:text-xl flex items-center gap-2"
                    >
                        <span>Top {platformName} offers right now</span>
                        <span className="inline-flex items-center rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-extrabold text-lime-900">
                            Live
                        </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Verified payout routes available on {platformName} and partner offerwalls.
                    </p>
                </div>
                <Link
                    href={seeAllHref}
                    className="group inline-flex items-center text-xs font-bold text-slate-800 transition hover:text-black hover:underline"
                >
                    <span>See all {platformName} offers</span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </div>

            {/* Quick Search Filter */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${platformName} games or offers…`}
                    className="w-full rounded-none border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none shadow-sm"
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((idx) => (
                        <div
                            key={idx}
                            className="flex h-24 animate-pulse items-center gap-3 rounded-none border border-slate-200 bg-slate-50 p-3"
                        >
                            <div className="h-16 w-16 shrink-0 rounded-none bg-slate-200" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3.5 w-3/4 rounded-none bg-slate-200" />
                                <div className="h-2.5 w-1/2 rounded-none bg-slate-200" />
                                <div className="h-4 w-1/3 rounded-none bg-slate-200" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredOffers.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredOffers.map((offer) => {
                        const displayPayout = Math.max(offer.totalPayoutUsd, offer.payoutUsd);
                        const offerDestination = offer.gameSlug
                            ? `/games/${offer.gameSlug}`
                            : `/offers?q=${encodeURIComponent(offer.title)}`;

                        return (
                            <div
                                key={offer.id}
                                className="group relative flex items-center justify-between gap-3 rounded-none border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-none border border-slate-100 bg-slate-100">
                                        {offer.imageUrl ? (
                                            <Image
                                                src={offer.imageUrl}
                                                alt={offer.title}
                                                fill
                                                unoptimized
                                                className="object-cover transition duration-200 group-hover:scale-105"
                                                sizes="56px"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs font-black uppercase text-slate-400">
                                                {offer.title.slice(0, 2)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1 truncate text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                                            {offer.platformName ? (
                                                <span className="truncate text-slate-600">{offer.platformName}</span>
                                            ) : null}
                                            {offer.platformName && offer.providerName ? (
                                                <span className="text-slate-300">/</span>
                                            ) : null}
                                            {offer.providerName ? (
                                                <span className="truncate">{offer.providerName}</span>
                                            ) : null}
                                        </div>
                                        <h3 className="truncate text-xs font-extrabold text-slate-900 group-hover:text-black">
                                            {offer.title}
                                        </h3>
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <span className="text-xs font-black text-emerald-600">
                                                ${displayPayout.toFixed(2)}
                                            </span>
                                            {offer.goalText ? (
                                                <span className="truncate text-[10px] text-slate-500">
                                                    · {offer.goalText}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    href={offerDestination}
                                    className="shrink-0 rounded-none bg-slate-100 p-1.5 text-slate-600 transition group-hover:bg-slate-900 group-hover:text-white"
                                    aria-label={`View ${offer.title} offer details`}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-none border border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-sm font-bold text-slate-700">No matching offers found for &ldquo;{searchQuery}&rdquo;</p>
                    <p className="mt-1 text-xs text-slate-500">Browse all live rewards available on {platformName}.</p>
                    <Link
                        href={seeAllHref}
                        className="mt-3 inline-flex items-center rounded-none bg-slate-900 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-slate-800"
                    >
                        Browse all {platformName} offers →
                    </Link>
                </div>
            )}
        </section>
    );
}
