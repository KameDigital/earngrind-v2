"use client";

import React, { useEffect, useState, useMemo } from "react";
import { X, ExternalLink, Copy, Check, Flame, Globe, ShieldCheck, DollarSign, Smartphone, Laptop, Sparkles, CheckCircle, ArrowRight } from "lucide-react";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import ProviderLogo from "@/components/providers/ProviderLogo";
import type { Offer } from "@/components/offers/OfferSearchEngine";

interface OfferTask {
    id: string;
    sortOrder: number;
    title: string;
    rewardAmount: number;
    rewardDisplay: string;
    taskType: string;
    timeLimitText: string | null;
    notes: string | null;
}

interface OfferDetailsModalProps {
    offer: Offer | null;
    onClose: () => void;
    onPin?: (offer: Offer) => void;
    isPinned?: boolean;
}

export default function OfferDetailsModal({
    offer,
    onClose,
    onPin,
    isPinned = false,
}: OfferDetailsModalProps) {
    const [tasks, setTasks] = useState<OfferTask[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showRegions, setShowRegions] = useState(false);
    const [aboutExpanded, setAboutExpanded] = useState(false);

    useEffect(() => {
        if (!offer) return;
        setTasks([]);
        setLoadingTasks(true);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);

        fetch(`/api/offers/${encodeURIComponent(offer.id)}`)
            .then(async (res) => {
                if (!res.ok) return { tasks: [] };
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data.tasks)) {
                    setTasks(data.tasks);
                }
            })
            .catch((err) => {
                console.error("[OfferDetailsModal] failed to load tasks", err);
            })
            .finally(() => {
                setLoadingTasks(false);
            });

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [offer, onClose]);

    // Render all verified milestone tiers
    const cleanedTasks = useMemo(() => {
        if (!tasks || tasks.length === 0) return [];

        // Filter out zero-reward disclaimer rows that were dumped as tasks
        const valid = tasks.filter((t) => {
            const title = (t.title || "").trim();
            const isDisclaimerOrJunk = /^(?:Important:|The platform features|combines a|wagered on|^s_\d+|^Default$)/i.test(title);
            if (isDisclaimerOrJunk && Number(t.rewardAmount ?? 0) === 0) return false;
            return true;
        });

        const paying = valid.filter((t) => Number(t.rewardAmount ?? 0) > 0);
        // If only 1 paying task exists and there were junk/zero-dollar tasks, return that 1 task
        if (paying.length === 1 && valid.length > 1) {
            return paying;
        }

        return valid.length > 0 ? valid : tasks;
    }, [tasks]);

    if (!offer) return null;

    const gameName = offer.game?.name ?? offer.title ?? "Offer";
    const platformName = offer.platform?.name ?? "Partner Site";
    const providerName = offer.provider_name ?? platformName;
    const thumbnailUrl = offer.image_url ?? offer.game?.thumbnail_url ?? null;
    const totalPayout = offer.total_payout_usd > 0 ? offer.total_payout_usd : offer.payout_usd;
    const description = offer.goal_text || offer.title || "Complete the verified offer tasks on the partner platform to earn rewards.";

    const copyLink = () => {
        if (typeof window === "undefined") return;
        const url = `${window.location.origin}/offers?q=${encodeURIComponent(gameName)}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
            {/* Modal Container: Clean Light Aesthetic */}
            <div
                className="relative flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-200 bg-white text-slate-900 shadow-2xl rounded-none my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Status Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-900">
                            Live Offer Intelligence
                        </span>
                        <span className="text-slate-300 font-bold">/</span>
                        <span className="text-xs font-bold text-slate-600">{platformName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={copyLink}
                            title="Copy link to offer"
                            className="flex items-center gap-1 border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 hover:text-black transition-colors"
                        >
                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                            <span>{copied ? "Copied" : "Share"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-7 w-7 items-center justify-center border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-black transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {/* Hero Information Card */}
                    <div className="border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            {/* Left: Thumbnail & Title */}
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="relative h-16 w-16 sm:h-18 sm:w-18 flex-shrink-0 overflow-hidden border border-slate-200 bg-white">
                                    {thumbnailUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={thumbnailUrl}
                                            alt={gameName}
                                            className="h-full w-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center font-black text-slate-400 text-xl">
                                            {gameName.slice(0, 2)}
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg sm:text-xl font-black text-slate-950 truncate" title={gameName}>
                                        {gameName}
                                    </h2>

                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                                        <span className="border border-slate-200 bg-white px-2 py-0.5 font-extrabold text-slate-900 shadow-2xs">
                                            {platformName}
                                        </span>
                                        {providerName && providerName !== platformName ? (
                                            <span className="border border-slate-200 bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                                                {providerName}
                                            </span>
                                        ) : null}
                                        <span className="flex items-center gap-1 bg-white px-1.5 py-0.5 border border-slate-200 shadow-2xs">
                                            {offer.devices.map((d) => (
                                                <span key={d} className="font-bold text-[11px] text-slate-700 uppercase">
                                                    {d === "ios" ? "🍎 iOS" : d === "android" ? "🤖 Android" : "💻 PC"}
                                                </span>
                                            ))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Total Payout Block */}
                            <div className="border border-slate-200 bg-white p-3.5 sm:text-right flex-shrink-0 shadow-2xs">
                                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                    Total Payout
                                </div>
                                <div className="text-2xl sm:text-3xl font-black leading-none text-emerald-600 mt-1">
                                    ${totalPayout.toFixed(2)}
                                </div>
                                {offer.completion_count && offer.completion_count > 0 ? (
                                    <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-amber-700 sm:justify-end">
                                        <Flame className="h-3 w-3 fill-current text-amber-500" />
                                        <span>{offer.completion_count.toLocaleString()} completed</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* About & Target Goal Description */}
                    <div className="border border-slate-200 bg-slate-50/60 p-4 space-y-1.5">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            Offer Goal & Summary
                        </h3>
                        <p className={`text-xs text-slate-600 leading-relaxed ${aboutExpanded ? "" : "line-clamp-3"}`}>
                            {description}
                        </p>
                        {description.length > 160 ? (
                            <button
                                type="button"
                                onClick={() => setAboutExpanded(!aboutExpanded)}
                                className="text-slate-900 hover:text-black font-extrabold text-xs pt-0.5 underline underline-offset-2"
                            >
                                {aboutExpanded ? "Show Less ▲" : "Read Full Description ▼"}
                            </button>
                        ) : null}
                    </div>

                    {/* Milestone Tasks Section */}
                    <div className="border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                Required Milestones & Payout Steps
                            </h3>
                            <span className="text-[11px] font-bold text-slate-500">
                                {cleanedTasks.length > 1 ? `${cleanedTasks.length} Milestones` : "1 Target Goal"}
                            </span>
                        </div>

                        {loadingTasks ? (
                            <div className="space-y-2 py-2">
                                <div className="h-10 bg-slate-100 border border-slate-200 animate-pulse" />
                                <div className="h-10 bg-slate-100 border border-slate-200 animate-pulse" />
                            </div>
                        ) : cleanedTasks.length > 1 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {cleanedTasks.map((task, idx) => (
                                    <div
                                        key={task.id || idx}
                                        className="flex items-center justify-between gap-2.5 border border-slate-200 bg-white p-3 shadow-2xs hover:border-slate-300 transition"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center border border-slate-200 bg-slate-100 text-[10px] font-black text-slate-700">
                                                {idx + 1}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-bold text-slate-900 truncate" title={task.title}>
                                                    {task.title}
                                                </div>
                                                {task.notes && task.notes !== task.title ? (
                                                    <div className="text-[10px] text-slate-500 truncate" title={task.notes}>
                                                        {task.notes}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>

                                        <span className="flex-shrink-0 font-black text-emerald-600 text-xs">
                                            {task.rewardAmount > 0 ? task.rewardDisplay || `$${task.rewardAmount.toFixed(2)}` : "Step"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Single Objective Goal Card */
                            <div className="flex items-center justify-between border border-slate-200 bg-white p-3.5 shadow-2xs">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-6 w-6 items-center justify-center border border-emerald-300 bg-emerald-50 text-xs font-black text-emerald-700">
                                        ✓
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">
                                            {cleanedTasks[0]?.title && !/^(?:Important:|The platform features|combines a|Complete the (?:listed|required))/i.test(cleanedTasks[0].title)
                                                ? cleanedTasks[0].title
                                                : description || `Complete ${gameName}`}
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                            Complete all requirements through the tracked route
                                        </div>
                                    </div>
                                </div>
                                <span className="font-black text-emerald-600 text-sm">
                                    ${totalPayout.toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Terms & Verification Rules */}
                    <div className="border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 space-y-2">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            Tracking & Eligibility Requirements
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600 list-disc list-inside">
                            <li>New users only on first install</li>
                            <li>Complete within 30-day window</li>
                            <li>Disable VPNs and Adblockers</li>
                            <li>Tracking takes up to 24h to verify</li>
                        </ul>
                    </div>

                    {/* Action Bar: Start Offer & Country Selector */}
                    <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                            {onPin ? (
                                <button
                                    type="button"
                                    onClick={() => onPin(offer)}
                                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center border text-sm font-black transition-colors ${
                                        isPinned
                                            ? "border-slate-950 bg-slate-950 text-lime-400"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:text-black"
                                    }`}
                                    title={isPinned ? "Remove from comparison" : "Add to comparison"}
                                >
                                    {isPinned ? "✓" : "+"}
                                </button>
                            ) : null}

                            {offer.redirect_url ? (
                                <TrackedOutboundLink
                                    href={offer.redirect_url}
                                    eventLabel="modal-offer-cta"
                                    offerId={offer.id}
                                    offerTitle={gameName}
                                    gameTitle={gameName}
                                    platformName={platformName}
                                    providerName={offer.provider_name}
                                    payoutUsd={offer.payout_usd}
                                    location="offer-details-modal"
                                    sourceContext="offer-modal-cta"
                                    className="flex h-12 flex-1 items-center justify-center gap-2 border border-slate-950 bg-slate-950 px-5 text-sm font-black uppercase tracking-wider text-white shadow-md transition-all hover:bg-slate-800 active:scale-[0.99]"
                                >
                                    <span>Start Offer on {platformName}</span>
                                    <ArrowRight className="h-4 w-4 text-lime-400" />
                                </TrackedOutboundLink>
                            ) : (
                                <span className="flex h-12 flex-1 items-center justify-center border border-slate-200 bg-slate-100 text-xs font-bold text-slate-500">
                                    Direct Link via {platformName}
                                </span>
                            )}
                        </div>

                        {/* Regions Dropdown */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                            <button
                                type="button"
                                onClick={() => setShowRegions(!showRegions)}
                                className="flex items-center gap-1 hover:text-slate-900 font-semibold transition-colors"
                            >
                                <Globe className="h-3.5 w-3.5 text-slate-400" />
                                <span>Supported Regions {showRegions ? "▲" : "▼"}</span>
                            </button>

                            <span>Refreshed live from {platformName}</span>
                        </div>

                        {showRegions ? (
                            <div className="border border-slate-200 bg-slate-50 p-2.5 text-xs">
                                <div className="flex flex-wrap gap-1">
                                    {offer.countries && offer.countries.length > 0 ? (
                                        offer.countries.map((c) => (
                                            <span key={c} className="border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-800 shadow-2xs">
                                                {c}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-slate-500">All supported countries</span>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
