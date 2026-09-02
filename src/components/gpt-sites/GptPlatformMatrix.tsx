"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Search,
    SlidersHorizontal,
    Star,
    Zap,
    DollarSign,
    Globe2,
    ShieldCheck,
    CheckCircle2,
    ArrowRight,
    ExternalLink,
    ChevronRight,
    Sparkles,
    Grid2X2,
    List,
    Clock,
    UserCheck,
    Gift,
    Flame,
    Layers,
    X,
    TrendingUp
} from "lucide-react";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import { type GptAffiliatePlatform, buildTrackedPlatformHref } from "@/lib/gpt-affiliate-platforms";
import { type PlatformReview } from "@/lib/platform-reviews-data";

export interface GptPlatformItem {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    rating: number;
    bestFor: string;
    payoutMethods: string[];
    minCashout: string;
    payoutSpeed: string;
    kycRequired: string;
    signupBonus: string;
    referralRate: string;
    worldwide: string;
    isPrimary: boolean;
    logoUrl: string;
    cta: string;
    liveOfferCount?: number;
    pros?: string[];
    cons?: string[];
}

interface GptPlatformMatrixProps {
    platforms: GptPlatformItem[];
    catalogOfferTotal: number;
}

type FilterTab = "all" | "crypto" | "paypal" | "instant" | "low_min" | "worldwide" | "us_cash";
type SortOption = "rating_desc" | "min_asc" | "offers_desc" | "name_asc";

export default function GptPlatformMatrix({ platforms, catalogOfferTotal }: GptPlatformMatrixProps) {
    const [activeTab, setActiveTab] = useState<FilterTab>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("rating_desc");
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
    const [comparedSlugs, setComparedSlugs] = useState<string[]>([]);
    const [isCompareOpen, setIsCompareOpen] = useState(false);

    // Filter logic
    const filteredPlatforms = useMemo(() => {
        return platforms.filter((p) => {
            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchName = p.name.toLowerCase().includes(q);
                const matchBestFor = p.bestFor.toLowerCase().includes(q);
                const matchMethods = p.payoutMethods.some((m) => m.toLowerCase().includes(q));
                if (!matchName && !matchBestFor && !matchMethods) return false;
            }

            // Tabs
            if (activeTab === "crypto") {
                return p.payoutMethods.some((m) => m.toLowerCase().includes("crypto") || m.toLowerCase().includes("bitcoin"));
            }
            if (activeTab === "paypal") {
                return p.payoutMethods.some((m) => m.toLowerCase().includes("paypal") || m.toLowerCase().includes("visa") || m.toLowerCase().includes("venmo"));
            }
            if (activeTab === "instant") {
                return p.payoutSpeed.toLowerCase().includes("instant") || p.payoutSpeed.toLowerCase().includes("mins");
            }
            if (activeTab === "low_min") {
                return p.minCashout.includes("$0.50") || p.minCashout.includes("$1.00") || p.minCashout.includes("$3.00");
            }
            if (activeTab === "worldwide") {
                return p.worldwide.toLowerCase().includes("worldwide") || p.worldwide.toLowerCase().includes("180+");
            }
            if (activeTab === "us_cash") {
                return p.worldwide.toLowerCase().includes("united states") || p.payoutMethods.some((m) => m.toLowerCase().includes("paypal") || m.toLowerCase().includes("venmo"));
            }

            return true;
        });
    }, [platforms, activeTab, searchQuery]);

    // Sort logic
    const sortedPlatforms = useMemo(() => {
        return [...filteredPlatforms].sort((a, b) => {
            if (sortBy === "rating_desc") return b.rating - a.rating;
            if (sortBy === "offers_desc") return (b.liveOfferCount ?? 0) - (a.liveOfferCount ?? 0);
            if (sortBy === "min_asc") {
                const getNum = (s: string) => {
                    const match = s.match(/\$([0-9.]+)/);
                    return match ? parseFloat(match[1]) : 999;
                };
                return getNum(a.minCashout) - getNum(b.minCashout);
            }
            if (sortBy === "name_asc") return a.name.localeCompare(b.name);
            return 0;
        });
    }, [filteredPlatforms, sortBy]);

    const toggleCompare = (slug: string) => {
        setComparedSlugs((prev) => {
            if (prev.includes(slug)) return prev.filter((s) => s !== slug);
            if (prev.length >= 3) return [...prev.slice(1), slug];
            return [...prev, slug];
        });
    };

    const comparedPlatforms = useMemo(() => {
        return platforms.filter((p) => comparedSlugs.includes(p.slug));
    }, [platforms, comparedSlugs]);

    return (
        <div className="space-y-8">
            {/* Quick Filter Navigation Bar */}
            <div className="border border-slate-900 bg-slate-950 p-4 text-white shadow-2xl">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                        {[
                            { id: "all", label: "All Sites", count: platforms.length, icon: Layers },
                            { id: "crypto", label: "⚡ Instant Crypto", count: platforms.filter(p => p.payoutMethods.some(m => m.toLowerCase().includes("crypto"))).length, icon: Zap },
                            { id: "paypal", label: "💵 PayPal & Cash", count: platforms.filter(p => p.payoutMethods.some(m => m.toLowerCase().includes("paypal"))).length, icon: DollarSign },
                            { id: "instant", label: "🚀 Fast Payouts", count: platforms.filter(p => p.payoutSpeed.toLowerCase().includes("instant")).length, icon: Clock },
                            { id: "low_min", label: "🎯 Low Min (<$1)", count: platforms.filter(p => p.minCashout.includes("$0.50") || p.minCashout.includes("$1.00")).length, icon: Sparkles },
                            { id: "worldwide", label: "🌍 Worldwide (180+)", count: platforms.filter(p => p.worldwide.toLowerCase().includes("worldwide")).length, icon: Globe2 },
                            { id: "us_cash", label: "🇺🇸 US Cash First", count: platforms.filter(p => p.worldwide.toLowerCase().includes("united states")).length, icon: ShieldCheck },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as FilterTab)}
                                    className={`flex items-center gap-1.5 px-3 py-2 font-mono font-bold tracking-tight uppercase transition ${
                                        isActive
                                            ? "bg-lime-400 text-slate-950 ring-1 ring-lime-300"
                                            : "bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white"
                                    }`}
                                >
                                    <Icon size={13} className={isActive ? "text-slate-950" : "text-lime-400"} />
                                    <span>{tab.label}</span>
                                    <span className={`ml-1 px-1 py-0.2 text-[10px] ${isActive ? "bg-slate-950 text-lime-400 font-extrabold" : "bg-slate-800 text-slate-400"}`}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* View Controls & Search */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search Input */}
                        <div className="relative min-w-[180px] flex-1 sm:w-56">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search site or reward..."
                                className="w-full bg-slate-900 border border-slate-800 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-lime-400 focus:outline-none"
                            />
                            {searchQuery ? (
                                <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                    <X size={12} />
                                </button>
                            ) : null}
                        </div>

                        {/* Sort Dropdown */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-mono font-bold text-slate-200 focus:border-lime-400 focus:outline-none"
                        >
                            <option value="rating_desc">Sort: Highest Rated</option>
                            <option value="min_asc">Sort: Lowest Min ($)</option>
                            <option value="offers_desc">Sort: Most Live Offers</option>
                            <option value="name_asc">Sort: Name (A-Z)</option>
                        </select>

                        {/* Layout Toggle */}
                        <div className="flex items-center border border-slate-800 bg-slate-900 p-0.5">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-1.5 ${viewMode === "grid" ? "bg-lime-400 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}
                                aria-label="Grid View"
                            >
                                <Grid2X2 size={15} />
                            </button>
                            <button
                                onClick={() => setViewMode("table")}
                                className={`p-1.5 ${viewMode === "table" ? "bg-lime-400 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}
                                aria-label="Table View"
                            >
                                <List size={15} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sub-bar stats */}
                <div className="mt-3 flex flex-wrap items-center justify-between border-t border-slate-900 pt-3 text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-3">
                        <span className="text-lime-400">● Showing {sortedPlatforms.length} of {platforms.length} Platforms</span>
                        <span className="hidden sm:inline text-slate-600">|</span>
                        <span className="hidden sm:inline">Total Live Offers Indexed: <strong className="text-white">{catalogOfferTotal.toLocaleString()}+</strong></span>
                    </div>
                    {comparedSlugs.length > 0 ? (
                        <button
                            onClick={() => setIsCompareOpen(true)}
                            className="flex items-center gap-1.5 border border-lime-400 bg-lime-400/10 px-2 py-0.5 font-bold text-lime-300 hover:bg-lime-400 hover:text-slate-950"
                        >
                            <span>Compare ({comparedSlugs.length}/3)</span>
                            <ArrowRight size={12} />
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Platform Grid View */}
            {viewMode === "grid" ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {sortedPlatforms.map((platform, index) => {
                        const isCompared = comparedSlugs.includes(platform.slug);
                        return (
                            <article
                                key={platform.slug}
                                className={`group relative flex flex-col justify-between border bg-white shadow-xl transition hover:-translate-y-1 ${
                                    platform.isPrimary
                                        ? "border-slate-950 ring-1 ring-slate-950/10"
                                        : "border-slate-300 hover:border-slate-950"
                                }`}
                            >
                                {/* Top highlight accent bar */}
                                <div className={`h-1.5 w-full ${platform.isPrimary ? "bg-lime-400" : "bg-slate-900"}`} />

                                <div className="p-5 flex-1 flex flex-col">
                                    {/* Header Row: Rank, Logo, Name, Rating */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* Rank badge */}
                                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center bg-slate-950 font-mono text-xs font-black text-lime-400">
                                                #{index + 1}
                                            </div>
                                            {/* Logo */}
                                            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden border border-slate-200 bg-slate-50 p-1">
                                                <Image
                                                    src={platform.logoUrl}
                                                    alt={`${platform.name} logo`}
                                                    fill
                                                    sizes="40px"
                                                    className="object-contain p-1"
                                                    unoptimized
                                                />
                                            </div>
                                            {/* Name & Tagline */}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="truncate text-base font-black tracking-tight text-slate-950">
                                                        {platform.name}
                                                    </h3>
                                                    {platform.isPrimary ? (
                                                        <span className="flex items-center gap-0.5 rounded-none bg-lime-100 border border-lime-300 px-1 py-0.2 text-[9px] font-mono font-extrabold uppercase text-lime-800">
                                                            <CheckCircle2 size={10} className="text-lime-600" />
                                                            Verified
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="truncate text-[11px] font-medium text-slate-500 font-mono">
                                                    {platform.bestFor}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Rating Pill */}
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 text-xs font-black text-lime-400 font-mono">
                                                <Star size={11} className="fill-lime-400 text-lime-400" />
                                                <span>{platform.rating.toFixed(1)}</span>
                                            </div>
                                            <span className="text-[9px] font-mono text-slate-400">Trust Score</span>
                                        </div>
                                    </div>

                                    {/* Key Specs Matrix Box */}
                                    <div className="mt-4 grid grid-cols-2 gap-2 border border-slate-200 bg-slate-50 p-3 font-mono text-xs">
                                        <div>
                                            <span className="block text-[10px] uppercase font-bold text-slate-400">Min Cashout</span>
                                            <strong className="block text-slate-900 text-[13px] font-extrabold">{platform.minCashout}</strong>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase font-bold text-slate-400">Payout Speed</span>
                                            <strong className="block text-emerald-700 text-[13px] font-extrabold">{platform.payoutSpeed}</strong>
                                        </div>
                                        <div className="mt-1 border-t border-slate-200/60 pt-1">
                                            <span className="block text-[10px] uppercase font-bold text-slate-400">KYC Policy</span>
                                            <span className="block text-slate-700 font-bold">{platform.kycRequired}</span>
                                        </div>
                                        <div className="mt-1 border-t border-slate-200/60 pt-1">
                                            <span className="block text-[10px] uppercase font-bold text-slate-400">Live Offers</span>
                                            <span className="block text-slate-900 font-extrabold">
                                                {platform.liveOfferCount ? `${platform.liveOfferCount.toLocaleString()} offers` : "Catalog"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payout Methods Pills */}
                                    <div className="mt-3">
                                        <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">Payment Rails</span>
                                        <div className="flex flex-wrap gap-1">
                                            {platform.payoutMethods.map((method) => (
                                                <span
                                                    key={method}
                                                    className="border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700"
                                                >
                                                    {method}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sign up Bonus / Perk */}
                                    {platform.signupBonus ? (
                                        <div className="mt-3 flex items-center gap-1.5 border border-lime-200 bg-lime-50/70 px-2.5 py-1.5 text-xs text-lime-900">
                                            <Gift size={13} className="text-lime-700 flex-shrink-0" />
                                            <span className="font-mono text-[11px] font-bold truncate">
                                                Bonus: <strong>{platform.signupBonus}</strong>
                                            </span>
                                        </div>
                                    ) : null}
                                </div>

                                {/* Bottom Action Footer */}
                                <div className="border-t border-slate-200 bg-slate-50/80 p-4 space-y-2">
                                    {/* Primary CTA Outbound */}
                                    <TrackedOutboundLink
                                        href={`/go/platform/${platform.slug}?click_location=best_gpt_matrix_card&source_context=best_gpt_sites&platform_name=${encodeURIComponent(platform.name)}`}
                                        eventLabel={`best_gpt_matrix_${platform.slug}`}
                                        platformName={platform.name}
                                        location="best_gpt_matrix_card"
                                        sourceContext="best_gpt_sites"
                                        className="flex w-full items-center justify-center gap-2 bg-slate-950 px-4 py-3 font-mono text-xs font-black uppercase tracking-wider text-lime-400 transition hover:bg-slate-900 hover:text-white group-hover:ring-1 group-hover:ring-slate-950"
                                    >
                                        <span>{platform.cta || `Join ${platform.name}`}</span>
                                        <ExternalLink size={13} />
                                    </TrackedOutboundLink>

                                    {/* Secondary Links: Review + Live Offers + Compare */}
                                    <div className="flex items-center justify-between text-[11px] font-mono font-bold pt-1">
                                        <Link
                                            href={`/best-gpt-sites/${platform.slug}`}
                                            className="text-slate-600 hover:text-slate-950 flex items-center gap-1"
                                        >
                                            <span>Full Review</span>
                                            <ChevronRight size={11} />
                                        </Link>

                                        <Link
                                            href={`/offers?q=${encodeURIComponent(platform.name)}`}
                                            className="text-lime-700 hover:text-lime-900 flex items-center gap-1"
                                        >
                                            <span>Browse Offers</span>
                                            <ArrowRight size={11} />
                                        </Link>

                                        <button
                                            onClick={() => toggleCompare(platform.slug)}
                                            className={`text-[10px] px-1.5 py-0.5 border transition ${
                                                isCompared
                                                    ? "bg-slate-950 text-lime-400 border-slate-950"
                                                    : "bg-white text-slate-500 border-slate-300 hover:border-slate-800 hover:text-slate-950"
                                            }`}
                                        >
                                            {isCompared ? "✓ Added" : "+ Compare"}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                /* Matrix Table View */
                <div className="overflow-x-auto border border-slate-950 bg-white shadow-2xl">
                    <table className="w-full min-w-[960px] border-collapse text-left font-mono text-xs">
                        <thead className="border-b border-slate-900 bg-slate-950 text-slate-300 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="p-3.5 text-center w-12">Rank</th>
                                <th className="p-3.5">Platform</th>
                                <th className="p-3.5 text-center">Score</th>
                                <th className="p-3.5">Min Cashout</th>
                                <th className="p-3.5">Speed</th>
                                <th className="p-3.5">KYC</th>
                                <th className="p-3.5">Payment Rails</th>
                                <th className="p-3.5">Signup Bonus</th>
                                <th className="p-3.5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {sortedPlatforms.map((platform, idx) => {
                                const isCompared = comparedSlugs.includes(platform.slug);
                                return (
                                    <tr key={platform.slug} className="hover:bg-slate-50 transition">
                                        {/* Rank */}
                                        <td className="p-3.5 text-center font-black text-slate-500">
                                            #{idx + 1}
                                        </td>
                                        {/* Platform */}
                                        <td className="p-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="relative h-7 w-7 flex-shrink-0 border border-slate-200 bg-slate-50 p-0.5">
                                                    <Image
                                                        src={platform.logoUrl}
                                                        alt={platform.name}
                                                        fill
                                                        sizes="28px"
                                                        className="object-contain"
                                                        unoptimized
                                                    />
                                                </div>
                                                <div>
                                                    <strong className="block font-black text-slate-950 text-[13px]">{platform.name}</strong>
                                                    <span className="block text-[10px] text-slate-500">{platform.bestFor}</span>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Score */}
                                        <td className="p-3.5 text-center">
                                            <span className="inline-flex items-center gap-1 bg-slate-950 px-2 py-0.5 font-bold text-lime-400">
                                                <Star size={10} className="fill-lime-400" />
                                                {platform.rating.toFixed(1)}
                                            </span>
                                        </td>
                                        {/* Min Cashout */}
                                        <td className="p-3.5 font-bold text-slate-900">
                                            {platform.minCashout}
                                        </td>
                                        {/* Speed */}
                                        <td className="p-3.5 text-emerald-700 font-bold">
                                            {platform.payoutSpeed}
                                        </td>
                                        {/* KYC */}
                                        <td className="p-3.5 text-slate-600">
                                            {platform.kycRequired}
                                        </td>
                                        {/* Payment Rails */}
                                        <td className="p-3.5">
                                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                                                {platform.payoutMethods.slice(0, 3).map((m) => (
                                                    <span key={m} className="border border-slate-200 bg-slate-50 px-1.5 py-0.2 text-[9px] text-slate-700">
                                                        {m}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        {/* Signup Bonus */}
                                        <td className="p-3.5 text-slate-700 font-medium">
                                            {platform.signupBonus || "—"}
                                        </td>
                                        {/* Action */}
                                        <td className="p-3.5 text-right space-x-2">
                                            <TrackedOutboundLink
                                                href={`/go/platform/${platform.slug}?click_location=best_gpt_matrix_table&source_context=best_gpt_sites&platform_name=${encodeURIComponent(platform.name)}`}
                                                eventLabel={`best_gpt_matrix_table_${platform.slug}`}
                                                platformName={platform.name}
                                                location="best_gpt_matrix_table"
                                                sourceContext="best_gpt_sites"
                                                className="inline-flex items-center gap-1 bg-slate-950 px-3 py-1.5 font-bold text-lime-400 hover:bg-slate-900"
                                            >
                                                <span>Join</span>
                                                <ExternalLink size={11} />
                                            </TrackedOutboundLink>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Side-by-Side Compare Modal / Drawer */}
            {isCompareOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-5xl border-2 border-slate-900 bg-slate-950 p-6 text-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div>
                                <span className="font-mono text-xs font-extrabold uppercase text-lime-400">● LIVE SPEC MATRIX</span>
                                <h3 className="text-xl font-black tracking-tight">Side-by-Side Platform Comparison</h3>
                            </div>
                            <button
                                onClick={() => setIsCompareOpen(false)}
                                className="border border-slate-700 bg-slate-900 p-2 text-slate-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {comparedPlatforms.length === 0 ? (
                            <div className="py-12 text-center font-mono text-sm text-slate-400">
                                No platforms selected. Click <strong>+ Compare</strong> on up to 3 platforms to compare them.
                            </div>
                        ) : (
                            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 font-mono text-xs">
                                {comparedPlatforms.map((p) => (
                                    <div key={p.slug} className="border border-slate-800 bg-slate-900 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="relative h-8 w-8 border border-slate-700 bg-slate-800 p-1">
                                                    <Image src={p.logoUrl} alt={p.name} fill sizes="32px" className="object-contain" unoptimized />
                                                </div>
                                                <strong className="text-base text-white">{p.name}</strong>
                                            </div>
                                            <button onClick={() => toggleCompare(p.slug)} className="text-slate-500 hover:text-rose-400">
                                                <X size={14} />
                                            </button>
                                        </div>

                                        <div className="space-y-2 border-t border-slate-800 pt-3">
                                            <div>
                                                <span className="text-slate-400 text-[10px] block uppercase">Trust Score</span>
                                                <strong className="text-lime-400 text-sm">{p.rating.toFixed(1)} / 5.0 ★</strong>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 text-[10px] block uppercase">Min Cashout</span>
                                                <strong className="text-white">{p.minCashout}</strong>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 text-[10px] block uppercase">Payout Speed</span>
                                                <strong className="text-emerald-400">{p.payoutSpeed}</strong>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 text-[10px] block uppercase">KYC Policy</span>
                                                <span className="text-slate-300">{p.kycRequired}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 text-[10px] block uppercase">Worldwide Access</span>
                                                <span className="text-slate-300">{p.worldwide}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 text-[10px] block uppercase">Signup Bonus</span>
                                                <span className="text-lime-300">{p.signupBonus || "Standard Tier"}</span>
                                            </div>
                                        </div>

                                        <TrackedOutboundLink
                                            href={`/go/platform/${p.slug}?click_location=best_gpt_compare_modal&source_context=best_gpt_sites&platform_name=${encodeURIComponent(p.name)}`}
                                            eventLabel={`best_gpt_compare_${p.slug}`}
                                            platformName={p.name}
                                            location="best_gpt_compare_modal"
                                            sourceContext="best_gpt_sites"
                                            className="mt-4 flex w-full items-center justify-center gap-1.5 bg-lime-400 py-2.5 font-bold uppercase text-slate-950 hover:bg-lime-300"
                                        >
                                            <span>Join {p.name}</span>
                                            <ExternalLink size={12} />
                                        </TrackedOutboundLink>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
