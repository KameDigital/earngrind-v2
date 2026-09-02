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
        return tasks;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
            {/* Modal Container: EarnGrind Terminal Aesthetic */}
            <div
                className="relative flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-700 bg-slate-950 text-white shadow-2xl rounded-none my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Status Header */}
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-[var(--brand-lime)] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--brand-lime)]">
                            Live Offer Intelligence
                        </span>
                        <span className="text-slate-600 font-bold">/</span>
                        <span className="text-xs font-bold text-slate-300">{platformName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={copyLink}
                            title="Copy link to offer"
                            className="flex items-center gap-1 border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-300 hover:border-slate-500 hover:text-white"
                        >
                            {copied ? <Check className="h-3.5 w-3.5 text-[var(--brand-lime)]" /> : <Copy className="h-3.5 w-3.5" />}
                            <span>{copied ? "Copied" : "Share"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-7 w-7 items-center justify-center border border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-white transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {/* Hero Information Card */}
                    <div className="border border-slate-800 bg-slate-900/90 p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            {/* Left: Thumbnail & Title */}
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="relative h-16 w-16 sm:h-18 sm:w-18 flex-shrink-0 overflow-hidden border border-slate-700 bg-slate-950">
                                    {thumbnailUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={thumbnailUrl}
                                            alt={gameName}
                                            className="h-full w-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center font-black text-[var(--brand-lime)] text-xl">
                                            {gameName.slice(0, 2)}
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg sm:text-xl font-black text-white truncate" title={gameName}>
                                        {gameName}
                                    </h2>

                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                                        <span className="border border-slate-700 bg-slate-950 px-2 py-0.5 font-bold text-[var(--brand-lime)]">
                                            {platformName}
                                        </span>
                                        {providerName && providerName !== platformName ? (
                                            <span className="border border-slate-800 bg-slate-900 px-2 py-0.5 font-semibold text-slate-300">
                                                {providerName}
                                            </span>
                                        ) : null}
                                        <span className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 border border-slate-800">
                                            {offer.devices.map((d) => (
                                                <span key={d} className="font-bold text-[11px] text-slate-300 uppercase">
                                                    {d === "ios" ? "🍎 iOS" : d === "android" ? "🤖 Android" : "💻 PC"}
                                                </span>
                                            ))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Total Payout Block */}
                            <div className="border border-slate-800 bg-slate-950 p-3.5 sm:text-right flex-shrink-0">
                                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Total Payout
                                </div>
                                <div className="text-2xl sm:text-3xl font-black leading-none text-[var(--brand-lime)] mt-1">
                                    ${totalPayout.toFixed(2)}
                                </div>
                                {offer.completion_count && offer.completion_count > 0 ? (
                                    <div className="mt-1.5 flex items-center gap-1 text-[11px] font-black text-orange-400 sm:justify-end">
                                        <Flame className="h-3 w-3 fill-current" />
                                        <span>{offer.completion_count.toLocaleString()} completed</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* About & Target Goal Description */}
                    <div className="border border-slate-800 bg-slate-900/50 p-4 space-y-1.5">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-[var(--brand-lime)]" />
                            Offer Goal & Summary
                        </h3>
                        <p className={`text-xs text-slate-300 leading-relaxed ${aboutExpanded ? "" : "line-clamp-3"}`}>
                            {description}
                        </p>
                        {description.length > 160 ? (
                            <button
                                type="button"
                                onClick={() => setAboutExpanded(!aboutExpanded)}
                                className="text-[var(--brand-lime)] hover:underline font-bold text-xs pt-0.5"
                            >
                                {aboutExpanded ? "Show Less ▲" : "Read Full Description ▼"}
                            </button>
                        ) : null}
                    </div>

                    {/* Milestone Tasks Section */}
                    <div className="border border-slate-800 bg-slate-900/70 p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                                <CheckCircle className="h-3.5 w-3.5 text-[var(--brand-lime)]" />
                                Required Milestones & Payout Steps
                            </h3>
                            <span className="text-[11px] font-bold text-slate-400">
                                {cleanedTasks.length > 1 ? `${cleanedTasks.length} Milestones` : "1 Target Goal"}
                            </span>
                        </div>

                        {loadingTasks ? (
                            <div className="space-y-2 py-2">
                                <div className="h-10 bg-slate-900 border border-slate-800 animate-pulse" />
                                <div className="h-10 bg-slate-900 border border-slate-800 animate-pulse" />
                            </div>
                        ) : cleanedTasks.length > 1 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {cleanedTasks.map((task, idx) => (
                                    <div
                                        key={task.id || idx}
                                        className="flex items-center justify-between gap-2.5 border border-slate-800 bg-slate-950 p-3"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center border border-slate-700 bg-slate-900 text-[10px] font-black text-slate-300">
                                                {idx + 1}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-bold text-white truncate" title={task.title}>
                                                    {task.title}
                                                </div>
                                                {task.notes && task.notes !== task.title ? (
                                                    <div className="text-[10px] text-slate-400 truncate" title={task.notes}>
                                                        {task.notes}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>

                                        <span className="flex-shrink-0 font-black text-[var(--brand-lime)] text-xs">
                                            {task.rewardAmount > 0 ? task.rewardDisplay || `$${task.rewardAmount.toFixed(2)}` : "Step"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Single Objective Goal Card */
                            <div className="flex items-center justify-between border border-slate-800 bg-slate-950 p-3.5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-6 w-6 items-center justify-center border border-lime-400/40 bg-[var(--brand-lime)]/10 text-xs font-black text-[var(--brand-lime)]">
                                        ✓
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-white">
                                            {cleanedTasks[0]?.title || description || `Complete ${gameName}`}
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            Complete all requirements through the tracked route
                                        </div>
                                    </div>
                                </div>
                                <span className="font-black text-[var(--brand-lime)] text-sm">
                                    ${totalPayout.toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Terms & Verification Rules */}
                    <div className="border border-slate-800 bg-slate-900/40 p-3.5 text-xs text-slate-400 space-y-2">
                        <div className="font-bold text-slate-300 flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-[var(--brand-lime)]" />
                            Tracking & Eligibility Requirements
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-400 list-disc list-inside">
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
                                            ? "border-lime-400 bg-[var(--brand-lime)] text-slate-950"
                                            : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white"
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
                                    className="flex h-12 flex-1 items-center justify-center gap-2 border border-lime-400 bg-[var(--brand-lime)] px-5 text-sm font-black uppercase tracking-wider text-slate-950 shadow-md transition-all hover:bg-lime-400 hover:scale-[1.01]"
                                >
                                    <span>Start Offer on {platformName}</span>
                                    <ArrowRight className="h-4 w-4" />
                                </TrackedOutboundLink>
                            ) : (
                                <span className="flex h-12 flex-1 items-center justify-center border border-slate-800 bg-slate-900 text-xs font-bold text-slate-500">
                                    Direct Link via {platformName}
                                </span>
                            )}
                        </div>

                        {/* Regions Dropdown */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                            <button
                                type="button"
                                onClick={() => setShowRegions(!showRegions)}
                                className="flex items-center gap-1 hover:text-white transition-colors"
                            >
                                <Globe className="h-3.5 w-3.5" />
                                <span>Supported Regions {showRegions ? "▲" : "▼"}</span>
                            </button>

                            <span>Refreshed live from {platformName}</span>
                        </div>

                        {showRegions ? (
                            <div className="border border-slate-800 bg-slate-950 p-2.5 text-xs">
                                <div className="flex flex-wrap gap-1">
                                    {offer.countries && offer.countries.length > 0 ? (
                                        offer.countries.map((c) => (
                                            <span key={c} className="border border-slate-800 bg-slate-900 px-2 py-0.5 text-[11px] font-black text-[var(--brand-lime)]">
                                                {c}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-slate-400">All supported countries</span>
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
