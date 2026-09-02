"use client";

import React, { useReducer, useEffect, useRef, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Grid2X2, List, Search, X, Flame, DollarSign, Sparkles, Smartphone, Laptop, CheckCircle2, ChevronDown, SlidersHorizontal, ArrowUpDown, Tag } from "lucide-react";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import ProviderLogo from "@/components/providers/ProviderLogo";
import OfferDetailsModal from "@/components/offers/OfferDetailsModal";
import { formatDataRefreshedLabel } from "@/lib/payout-freshness";
import type { PublicOfferCountry } from "@/lib/earnlab-countries";

// ---------------------------------------------------------------
// TYPES — mirrors /api/offers response
// ---------------------------------------------------------------
export interface OfferGame {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
}

export interface OfferPlatform {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    platform_kind: "gpt_site" | "offerwall" | "casino" | "sportsbook" | "cashback";
}

export interface Offer {
    id: string;
    source: "ingested" | "manual";
    title: string;
    image_url: string | null;
    payout_usd: number;
    total_payout_usd: number;
    completion_count: number | null;
    payout_type: "online_cashback" | "gift_card" | "points" | "crypto" | null;
    devices: ("ios" | "android" | "pc" | "web")[];
    countries: string[];
    is_featured: boolean;
    is_ath: boolean;
    is_new: boolean;
    is_hot: boolean;
    is_boosted: boolean;
    heat_score: number;
    offer_expires_at: string | null;
    updated_at: string;
    goal_text: string | null;
    category?: string | null;
    provider_name: string | null;
    game: OfferGame;
    platform: OfferPlatform;
    redirect_url: string | null;
}

export interface OfferMeta {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    country?: string;
    country_source?: string;
}

const isImageUrl = (url?: string | null) =>
    typeof url === "string" &&
    /\.(jpg|jpeg|png|webp|gif|avif|svg)(?:$|[?#])/i.test(url);

function formatCompletions(count: number | null | undefined): string | null {
    if (!count || count <= 0) return null;
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    }
    return count.toLocaleString();
}

function OfferThumbnail({
    src,
    alt,
    fallbackText,
    className,
}: {
    src: string | null;
    alt: string;
    fallbackText: string;
    className: string;
}) {
    const [failed, setFailed] = React.useState(false);

    if (!src || failed) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-xs font-black uppercase text-[var(--brand-lime)]">
                {fallbackText.slice(0, 3)}
            </div>
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element -- Imported offer thumbnails come from volatile third-party URLs.
        <img
            src={src}
            alt={alt}
            className={className}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
        />
    );
}

function PlatformLogoImage({
    src,
    name,
}: {
    src: string | null;
    name: string;
}) {
    const [failed, setFailed] = React.useState(false);

    if (!src || failed) {
        return <span className="text-xs font-black text-white">{name}</span>;
    }

    return (
        <>
            {/* eslint-disable-next-line @next/next/no-img-element -- Platform logos come from volatile third-party URLs. */}
            <img
                src={src}
                alt=""
                className="max-h-4 w-auto max-w-[4rem] object-contain"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setFailed(true)}
            />
            <span className="sr-only">{name}</span>
        </>
    );
}

// ---------------------------------------------------------------
// FILTER STATE
// ---------------------------------------------------------------
export type SortOption = "payout_desc" | "completed_desc" | "newest" | "payout_asc" | "heat_desc";

interface FilterState {
    q: string;
    source: "" | "ingested" | "manual";
    platform_id: string;
    platform_kind: string;
    category: string;
    device: string;
    country: string;
    payout_type: string;
    is_new: boolean;
    is_hot: boolean;
    is_ath: boolean;
    is_boosted: boolean;
    min_payout: number;
    sort: SortOption;
    page: number;
    per_page: number;
}

function defaultFilterState(country = "US"): FilterState {
    return {
        q: "",
        source: "",
        platform_id: "",
        platform_kind: "",
        category: "",
        device: "",
        country,
        payout_type: "",
        is_new: false,
        is_hot: false,
        is_ath: false,
        is_boosted: false,
        min_payout: 0,
        sort: "payout_desc",
        page: 1,
        per_page: 24,
    };
}

type FilterAction =
    | { type: "SET"; key: keyof FilterState; value: FilterState[keyof FilterState] }
    | { type: "HYDRATE"; filters: FilterState }
    | { type: "RESET"; country?: string }
    | { type: "SET_PAGE"; page: number };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
    switch (action.type) {
        case "SET":
            return { ...state, [action.key]: action.value, page: 1 };
        case "SET_PAGE":
            return { ...state, page: action.page };
        case "HYDRATE":
            return action.filters;
        case "RESET":
            return defaultFilterState(action.country ?? state.country);
        default:
            return state;
    }
}

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

type SearchParamsLike = {
    get(name: string): string | null;
};

function buildFiltersFromSearchParams(searchParams: SearchParamsLike): FilterState {
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const perPage = parseInt(searchParams.get("per_page") ?? "24", 10);
    const rawSort = searchParams.get("sort");
    const sort: SortOption =
        rawSort === "completed_desc" || rawSort === "payout_asc" || rawSort === "heat_desc" || rawSort === "newest"
            ? rawSort
            : "payout_desc";
    const source = searchParams.get("source");

    return {
        q: searchParams.get("q") ?? (searchParams.get("platform_id") ? "" : searchParams.get("platform_name") ?? ""),
        source: source === "ingested" || source === "manual" ? source : "",
        platform_id: searchParams.get("platform_id") ?? "",
        platform_kind: searchParams.get("platform_kind") ?? "",
        category: searchParams.get("category") ?? "",
        device: searchParams.get("device") ?? "",
        country: searchParams.get("country") || "US",
        payout_type: searchParams.get("payout_type") ?? "",
        is_new: searchParams.get("is_new") === "true",
        is_hot: searchParams.get("is_hot") === "true",
        is_ath: searchParams.get("is_ath") === "true",
        is_boosted: searchParams.get("is_boosted") === "true",
        min_payout: parseFloat(searchParams.get("min_payout") ?? "0") || 0,
        sort,
        page: Number.isFinite(page) && page > 0 ? page : 1,
        per_page: Number.isFinite(perPage) && perPage > 0 ? perPage : 24,
    };
}

function serializeFilterState(filters: FilterState): string {
    return JSON.stringify(filters);
}

function buildShareableSearchParams(
    filters: FilterState,
    context?: { platformName?: string; fromReview?: boolean }
): URLSearchParams {
    const params = new URLSearchParams();
    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.source) params.set("source", filters.source);
    if (filters.platform_id) {
        params.set("platform_id", filters.platform_id);
        if (context?.platformName) params.set("platform_name", context.platformName);
        if (context?.fromReview) params.set("from_review", "1");
    }
    if (filters.platform_kind) params.set("platform_kind", filters.platform_kind);
    if (filters.category) params.set("category", filters.category);
    if (filters.device) params.set("device", filters.device);
    // Always preserve explicit country in shareable search params so switching to US or any other region always works!
    if (filters.country) params.set("country", filters.country);
    if (filters.payout_type) params.set("payout_type", filters.payout_type);
    if (filters.is_new) params.set("is_new", "true");
    if (filters.is_hot) params.set("is_hot", "true");
    if (filters.is_ath) params.set("is_ath", "true");
    if (filters.is_boosted) params.set("is_boosted", "true");
    if (filters.min_payout > 0) params.set("min_payout", String(filters.min_payout));
    if (filters.sort !== "payout_desc") params.set("sort", filters.sort);
    if (filters.page > 1) params.set("page", String(filters.page));
    if (filters.per_page !== 24) params.set("per_page", String(filters.per_page));
    return params;
}

function buildQueryString(filters: FilterState, debouncedQ: string): string {
    const params = new URLSearchParams();
    if (debouncedQ) params.set("q", debouncedQ);
    if (filters.source) params.set("source", filters.source);
    if (filters.platform_id) params.set("platform_id", filters.platform_id);
    if (filters.platform_kind) params.set("platform_kind", filters.platform_kind);
    if (filters.category) params.set("category", filters.category);
    if (filters.device) params.set("device", filters.device);
    if (filters.country) params.set("country", filters.country);
    if (filters.payout_type) params.set("payout_type", filters.payout_type);
    if (filters.is_new) params.set("is_new", "true");
    if (filters.is_hot) params.set("is_hot", "true");
    if (filters.is_ath) params.set("is_ath", "true");
    if (filters.is_boosted) params.set("is_boosted", "true");
    if (filters.min_payout > 0) params.set("min_payout", String(filters.min_payout));
    params.set("sort", filters.sort);
    params.set("page", String(filters.page));
    params.set("per_page", String(filters.per_page || 24));
    return params.toString();
}

// ---------------------------------------------------------------
// BADGE COMPONENT
// ---------------------------------------------------------------
interface BadgeProps {
    label: string;
    variant: "ath" | "new" | "hot" | "boosted" | "featured" | "best" | "completed";
}

const badgeStyles: Record<BadgeProps["variant"], string> = {
    ath: "bg-[var(--brand-lime)] text-[var(--brand-ink)] font-black",
    best: "bg-[var(--brand-ink)] text-[var(--brand-lime)] font-black border border-slate-700",
    completed: "bg-amber-500/15 text-amber-900 border border-amber-500/30 font-extrabold",
    new: "bg-blue-50 text-blue-700 border border-blue-200",
    hot: "bg-orange-100 text-orange-700 border border-orange-200",
    boosted: "bg-purple-50 text-purple-700 border border-purple-200",
    featured: "bg-amber-50 text-amber-700 border border-amber-200",
};

function Badge({ label, variant }: BadgeProps) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider leading-none ${badgeStyles[variant]}`}>
            {label}
        </span>
    );
}

// ---------------------------------------------------------------
// DEVICE ICONS
// ---------------------------------------------------------------
const DeviceIcon = ({ device }: { device: string }) => {
    const icons: Record<string, string> = {
        ios: "🍎", android: "🤖", pc: "💻", web: "🌐",
    };
    return <span title={device} className="text-xs">{icons[device] ?? "📱"}</span>;
};

// ---------------------------------------------------------------
// OFFER CARD (GRID VIEW)
// ---------------------------------------------------------------
function OfferGridCard({
    offer,
    onPin,
    onOpenModal,
    isPinned,
}: {
    offer: Offer;
    onPin: (offer: Offer) => void;
    onOpenModal: (offer: Offer) => void;
    isPinned: boolean;
}) {
    const gameName = offer.game?.name ?? offer.title ?? "Offer";
    const platformName = offer.platform?.name ?? "Partner Site";
    const providerName = offer.provider_name ?? platformName;
    const thumbnailUrl = offer.image_url ?? (isImageUrl(offer.redirect_url) ? offer.redirect_url : null) ?? offer.game?.thumbnail_url ?? null;
    const completionLabel = formatCompletions(offer.completion_count);

    return (
        <article
            onClick={() => onOpenModal(offer)}
            className="group flex flex-col overflow-hidden border border-slate-200/90 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-slate-800 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)] cursor-pointer"
        >
            {/* Card Header & Thumbnail */}
            <div className="relative flex h-40 w-full items-center justify-center overflow-hidden border-b border-slate-100 bg-slate-900">
                <OfferThumbnail
                    src={thumbnailUrl}
                    alt={gameName}
                    fallbackText={gameName.slice(0, 3)}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Badges Overlay */}
                <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
                    {completionLabel ? (
                        <span className="inline-flex items-center gap-1 border border-orange-400/40 bg-slate-950/90 px-2 py-0.5 text-[10px] font-black text-orange-400 shadow-sm backdrop-blur-md">
                            <Flame className="h-3 w-3 fill-orange-400" />
                            {completionLabel} completed
                        </span>
                    ) : offer.is_hot || offer.heat_score >= 50 ? (
                        <span className="inline-flex items-center gap-1 border border-orange-400/40 bg-slate-950/90 px-2 py-0.5 text-[10px] font-black text-orange-400 shadow-sm backdrop-blur-md">
                            <Flame className="h-3 w-3 fill-orange-400" />
                            Popular Pick
                        </span>
                    ) : null}
                    {offer.is_ath ? <Badge label="ATH PAYOUT" variant="ath" /> : null}
                    {offer.is_new ? <Badge label="NEW" variant="new" /> : null}
                    {offer.is_boosted ? <Badge label="BOOSTED" variant="boosted" /> : null}
                </div>

                {/* Payout Badge */}
                <div className="absolute bottom-2.5 right-2.5 border border-slate-700 bg-slate-950/95 px-3 py-1 text-right shadow-md backdrop-blur-md">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Prize</div>
                    <div className="text-xl font-black leading-none text-[var(--brand-lime)]">
                        ${offer.payout_usd.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Card Body */}
            <div className="flex flex-1 flex-col p-4">
                {/* Title & Goal */}
                <div className="mb-2">
                    <h3 className="line-clamp-1 text-base font-black text-slate-900 transition-colors group-hover:text-slate-800" title={gameName}>
                        {gameName}
                    </h3>
                    <p className="line-clamp-1 text-xs text-slate-500" title={offer.goal_text ?? offer.title}>
                        {offer.goal_text || offer.title}
                    </p>
                </div>

                {/* Platform & Provider Row */}
                <div className="mt-auto space-y-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="flex h-6 items-center gap-1 border border-slate-700 bg-slate-900 px-2 font-bold text-[var(--brand-lime)] shadow-xs">
                                <PlatformLogoImage src={offer.platform?.logo_url} name={platformName} />
                            </span>
                            {providerName && providerName !== platformName ? (
                                <ProviderLogo name={providerName} compact className="h-6 max-w-[4.5rem]" />
                            ) : null}
                        </div>

                        <div className="flex items-center gap-1 text-slate-400">
                            {offer.devices.map((device) => (
                                <DeviceIcon key={device} device={device} />
                            ))}
                        </div>
                    </div>

                    {/* Action Row */}
                    <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => onPin(offer)}
                            title={isPinned ? "Remove from comparison" : "Add to comparison"}
                            aria-label={isPinned ? "Remove from comparison" : "Add to comparison"}
                            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center border text-sm font-black transition-colors ${
                                isPinned
                                    ? "border-lime-500 bg-[var(--brand-lime)] text-slate-950"
                                    : "border-slate-300 bg-white text-slate-500 hover:border-slate-800 hover:text-slate-900"
                            }`}
                        >
                            {isPinned ? "✓" : "+"}
                        </button>

                        <button
                            type="button"
                            onClick={() => onOpenModal(offer)}
                            className="flex h-9 flex-1 items-center justify-center border border-slate-900 bg-slate-900 px-3 text-xs font-black uppercase tracking-wider text-[var(--brand-lime)] shadow-xs transition-all hover:bg-slate-800 hover:text-white"
                        >
                            View Details →
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}

// ---------------------------------------------------------------
// OFFER ROW (LIST VIEW)
// ---------------------------------------------------------------
function OfferRowItem({
    offer,
    onPin,
    onOpenModal,
    isPinned,
}: {
    offer: Offer;
    onPin: (offer: Offer) => void;
    onOpenModal: (offer: Offer) => void;
    isPinned: boolean;
}) {
    const gameName = offer.game?.name ?? offer.title ?? "Offer";
    const platformName = offer.platform?.name ?? "Partner Site";
    const providerName = offer.provider_name ?? platformName;
    const thumbnailUrl = offer.image_url ?? (isImageUrl(offer.redirect_url) ? offer.redirect_url : null) ?? offer.game?.thumbnail_url ?? null;
    const completionLabel = formatCompletions(offer.completion_count);

    return (
        <div
            onClick={() => onOpenModal(offer)}
            className="flex flex-col gap-3 border-b border-slate-200/90 bg-white p-3.5 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4 cursor-pointer"
        >
            {/* Left: Thumbnail & Info */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden border border-slate-200 bg-slate-900 sm:h-14 sm:w-14">
                    <OfferThumbnail
                        src={thumbnailUrl}
                        alt={gameName}
                        fallbackText={gameName.slice(0, 3)}
                        className="h-full w-full object-cover"
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="truncate text-sm font-black text-slate-900 sm:text-base" title={gameName}>
                            {gameName}
                        </h3>
                        {completionLabel ? (
                            <span className="inline-flex items-center gap-1 border border-orange-300 bg-orange-50 px-1.5 py-0.5 text-[10px] font-extrabold text-orange-700">
                                <Flame className="h-3 w-3 fill-orange-500 text-orange-500" />
                                {completionLabel}
                            </span>
                        ) : null}
                        {offer.is_ath ? <Badge label="ATH" variant="ath" /> : null}
                        {offer.is_new ? <Badge label="NEW" variant="new" /> : null}
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                        <span className="flex h-5 items-center gap-1 border border-slate-700 bg-slate-900 px-1.5 text-[11px] font-bold text-[var(--brand-lime)]">
                            <PlatformLogoImage src={offer.platform?.logo_url} name={platformName} />
                        </span>
                        {providerName && providerName !== platformName ? (
                            <span className="border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700">
                                {providerName}
                            </span>
                        ) : null}
                        <span className="flex items-center gap-0.5">
                            {offer.devices.map((device) => (
                                <DeviceIcon key={device} device={device} />
                            ))}
                        </span>
                        <span className="hidden text-slate-400 sm:inline">·</span>
                        <span className="hidden text-[11px] text-slate-400 sm:inline">
                            {formatDataRefreshedLabel(offer.updated_at)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right: Payout & Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 border-t border-slate-100 sm:border-0 sm:pt-0" onClick={(e) => e.stopPropagation()}>
                <div className="text-left sm:text-right pr-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Prize</div>
                    <div className="text-lg font-black text-slate-900 sm:text-xl">
                        ${offer.payout_usd.toFixed(2)}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onPin(offer)}
                        className={`flex h-9 w-9 items-center justify-center border text-sm font-black transition-colors ${
                            isPinned
                                ? "border-lime-500 bg-[var(--brand-lime)] text-slate-950"
                                : "border-slate-300 bg-white text-slate-500 hover:border-slate-800 hover:text-slate-900"
                        }`}
                        title={isPinned ? "Remove from comparison" : "Compare"}
                    >
                        {isPinned ? "✓" : "+"}
                    </button>

                    <button
                        type="button"
                        onClick={() => onOpenModal(offer)}
                        className="flex h-9 items-center justify-center border border-slate-900 bg-slate-900 px-4 text-xs font-black uppercase tracking-wider text-[var(--brand-lime)] shadow-xs transition-all hover:bg-slate-800 hover:text-white"
                    >
                        View Details →
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------
// SEARCH & FILTER CONTROLS
// ---------------------------------------------------------------
interface FilterControlsProps {
    filters: FilterState;
    dispatch: React.Dispatch<FilterAction>;
    platforms: OfferPlatform[];
    countries: PublicOfferCountry[];
    totalResults?: number;
    loading: boolean;
}

function FilterControls({
    filters,
    dispatch,
    platforms,
    countries,
}: FilterControlsProps) {
    const set = (key: keyof FilterState, value: FilterState[keyof FilterState]) =>
        dispatch({ type: "SET", key, value });

    const handleCountryChange = (countryCode: string) => {
        set("country", countryCode);
        if (typeof document !== "undefined") {
            document.cookie = `earngrind_offer_country=${encodeURIComponent(countryCode)}; path=/; max-age=31536000; SameSite=Lax`;
        }
    };

    const countryOptions = countries.length > 0
        ? countries
        : [{ code: "US", slug: "us", name: "United States", supported: true } as PublicOfferCountry];

    const selectStyle =
        "h-10 w-full appearance-none border border-slate-200 bg-white px-3 pr-8 text-xs font-bold text-slate-800 shadow-2xs transition-colors hover:border-slate-400 focus:border-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-950";

    return (
        <div className="border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            {/* Search Bar */}
            <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                    type="search"
                    aria-label="Search offers by name, site, or provider"
                    placeholder="Search by game name (e.g. Monopoly Go, Raid), partner site, or provider..."
                    value={filters.q}
                    onChange={(e) => set("q", e.target.value)}
                    className="h-12 w-full border border-slate-200 bg-slate-50/50 pl-11 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-inner/5 transition-colors focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-950"
                />
                {filters.q ? (
                    <button
                        type="button"
                        onClick={() => set("q", "")}
                        aria-label="Clear search"
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900"
                    >
                        <X className="h-4 w-4" />
                    </button>
                ) : null}
            </div>

            {/* Quick Filter Presets Row */}
            <div className="mb-4 flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="mr-1 text-[11px] font-black uppercase tracking-wider text-slate-500">Presets:</span>

                {/* Most Completed Preset */}
                <button
                    type="button"
                    onClick={() => set("sort", filters.sort === "completed_desc" ? "payout_desc" : "completed_desc")}
                    className={`inline-flex items-center gap-1 border px-2.5 py-1 text-xs font-black transition-all ${
                        filters.sort === "completed_desc"
                            ? "border-orange-500 bg-orange-500 text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950 shadow-2xs"
                    }`}
                >
                    <Flame className="h-3.5 w-3.5 fill-current" />
                    Most Completed
                </button>

                {/* $100+ High Pay Preset */}
                <button
                    type="button"
                    onClick={() => set("min_payout", filters.min_payout === 100 ? 0 : 100)}
                    className={`inline-flex items-center gap-1 border px-2.5 py-1 text-xs font-black transition-all ${
                        filters.min_payout === 100
                            ? "border-slate-950 bg-slate-950 text-lime-400 shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950 shadow-2xs"
                    }`}
                >
                    <DollarSign className="h-3.5 w-3.5" />
                    $100+ Payouts
                </button>

                {/* $25+ Quick Wins */}
                <button
                    type="button"
                    onClick={() => set("min_payout", filters.min_payout === 25 ? 0 : 25)}
                    className={`inline-flex items-center gap-1 border px-2.5 py-1 text-xs font-black transition-all ${
                        filters.min_payout === 25
                            ? "border-slate-950 bg-slate-950 text-lime-400 shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950 shadow-2xs"
                    }`}
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    $25+ Payouts
                </button>

                {/* iOS */}
                <button
                    type="button"
                    onClick={() => set("device", filters.device === "ios" ? "" : "ios")}
                    className={`inline-flex items-center gap-1 border px-2.5 py-1 text-xs font-black transition-all ${
                        filters.device === "ios"
                            ? "border-slate-950 bg-slate-950 text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950 shadow-2xs"
                    }`}
                >
                    🍎 iOS
                </button>

                {/* Android */}
                <button
                    type="button"
                    onClick={() => set("device", filters.device === "android" ? "" : "android")}
                    className={`inline-flex items-center gap-1 border px-2.5 py-1 text-xs font-black transition-all ${
                        filters.device === "android"
                            ? "border-slate-950 bg-slate-950 text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950 shadow-2xs"
                    }`}
                >
                    🤖 Android
                </button>

                {/* PC */}
                <button
                    type="button"
                    onClick={() => set("device", filters.device === "pc" ? "" : "pc")}
                    className={`inline-flex items-center gap-1 border px-2.5 py-1 text-xs font-black transition-all ${
                        filters.device === "pc"
                            ? "border-slate-950 bg-slate-950 text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950 shadow-2xs"
                    }`}
                >
                    💻 PC
                </button>
            </div>

            {/* Structured Select Dropdowns Grid */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 border-t border-slate-100 pt-4">
                {/* 1. Sort By */}
                <div className="relative">
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Sort By
                    </label>
                    <div className="relative">
                        <select
                            aria-label="Sort offers"
                            value={filters.sort}
                            onChange={(e) => set("sort", e.target.value as SortOption)}
                            className={selectStyle}
                        >
                            <option value="payout_desc">💰 Highest Payout</option>
                            <option value="completed_desc">🔥 Most Completed</option>
                            <option value="newest">⚡ Newest Added</option>
                            <option value="payout_asc">Lowest Payout</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                {/* 2. Country */}
                <div className="relative">
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Country
                    </label>
                    <div className="relative">
                        <select
                            aria-label="Filter by country"
                            value={filters.country}
                            onChange={(e) => handleCountryChange(e.target.value)}
                            className={selectStyle}
                        >
                            {countryOptions.map((country) => (
                                <option key={country.code} value={country.code}>
                                    {country.name} ({country.code})
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                {/* 3. Partner Site */}
                <div className="relative">
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Partner Site
                    </label>
                    <div className="relative">
                        <select
                            aria-label="Filter by partner site"
                            value={filters.platform_id}
                            onChange={(e) => set("platform_id", e.target.value)}
                            className={selectStyle}
                        >
                            <option value="">All Sites</option>
                            {platforms.map((platform) => (
                                <option key={platform.id} value={platform.id}>
                                    {platform.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                {/* 4. Category Filter */}
                <div className="relative">
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Category
                    </label>
                    <div className="relative">
                        <select
                            aria-label="Filter by category"
                            value={filters.category}
                            onChange={(e) => set("category", e.target.value)}
                            className={selectStyle}
                        >
                            <option value="">All Categories</option>
                            <option value="games">🎮 Games & RPG</option>
                            <option value="casino">🎰 Casino & Slots</option>
                            <option value="signup">✍️ Sign Up / Trial</option>
                            <option value="finance">💰 Finance & Crypto</option>
                            <option value="apps">📱 Mobile Apps</option>
                            <option value="survey">📋 Surveys</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                {/* 5. Device */}
                <div className="relative">
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Device
                    </label>
                    <div className="relative">
                        <select
                            aria-label="Filter by device"
                            value={filters.device}
                            onChange={(e) => set("device", e.target.value)}
                            className={selectStyle}
                        >
                            <option value="">All Devices</option>
                            <option value="ios">🍏 iOS</option>
                            <option value="android">🤖 Android</option>
                            <option value="pc">💻 PC</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                {/* 6. Minimum Payout / Reset */}
                <div className="relative flex items-end gap-1.5">
                    <div className="flex-1">
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Min Payout
                        </label>
                        <div className="relative">
                            <select
                                aria-label="Filter by minimum payout"
                                value={String(filters.min_payout)}
                                onChange={(e) => set("min_payout", parseFloat(e.target.value) || 0)}
                                className={selectStyle}
                            >
                                <option value="0">Any Payout</option>
                                <option value="5">$5.00+</option>
                                <option value="25">$25.00+</option>
                                <option value="50">$50.00+</option>
                                <option value="100">$100.00+</option>
                                <option value="250">$250.00+</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => dispatch({ type: "RESET", country: filters.country })}
                        title="Reset all filters"
                        className="flex h-10 items-center justify-center border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:border-slate-400 hover:text-slate-950 shadow-2xs transition-colors"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------
// COMPARISON DRAWER
// ---------------------------------------------------------------
interface CompareDrawerProps {
    pinned: Offer[];
    onRemove: (id: string) => void;
    onClear: () => void;
}

function CompareDrawer({ pinned, onRemove, onClear }: CompareDrawerProps) {
    if (pinned.length === 0) return null;
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                    <span className="flex h-6 w-6 items-center justify-center bg-slate-950 text-xs font-black text-lime-400">
                        {pinned.length}
                    </span>
                    <span>Comparing Offers ({pinned.length}/3)</span>
                </div>

                <div className="flex w-full flex-1 gap-2 overflow-x-auto pb-1 sm:w-auto sm:pb-0 hide-scrollbar">
                    {pinned.map((offer) => (
                        <div
                            key={offer.id}
                            className="relative flex min-w-[200px] items-center gap-2.5 border border-slate-200 bg-slate-50 px-3 py-1.5 shadow-2xs"
                        >
                            <div className="h-8 w-8 flex-shrink-0 overflow-hidden bg-white border border-slate-200">
                                <OfferThumbnail
                                    src={offer.image_url ?? offer.game?.thumbnail_url}
                                    alt={offer.game?.name ?? offer.title}
                                    fallbackText={(offer.game?.name ?? offer.title).slice(0, 2)}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="min-w-0 flex-1 pr-4">
                                <div className="truncate text-xs font-bold text-slate-900">
                                    {offer.game?.name ?? offer.title}
                                </div>
                                <div className="text-[11px] font-black text-emerald-600">
                                    ${offer.payout_usd.toFixed(2)}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onRemove(offer.id)}
                                className="absolute right-1.5 top-1.5 p-1 text-slate-400 hover:text-slate-900"
                                aria-label="Remove offer"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                    <button
                        type="button"
                        onClick={onClear}
                        className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
                    >
                        Clear All
                    </button>
                    <a
                        href={`/tools/compare?offers=${pinned.map((o) => o.id).join(",")}`}
                        className="flex items-center gap-1.5 border border-slate-950 bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-slate-800"
                    >
                        Compare Payouts →
                    </a>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------
// MAIN SEARCH TERMINAL COMPONENT
// ---------------------------------------------------------------
interface OfferSearchEngineProps {
    initialGameSlug?: string;
    initialOffers?: Offer[];
    initialMeta?: OfferMeta | null;
    initialQueryString?: string;
    initialCountry?: string;
    countries?: PublicOfferCountry[];
}

export default function OfferSearchEngine({
    initialGameSlug,
    initialOffers,
    initialMeta,
    initialQueryString,
    initialCountry = "US",
    countries = [],
}: OfferSearchEngineProps) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [filters, dispatch] = useReducer(filterReducer, searchParams, (params) => ({
        ...buildFiltersFromSearchParams(params),
        country: params.get("country") || initialCountry || "US",
    }));

    const [offers, setOffers] = React.useState<Offer[]>(() => initialOffers ?? []);
    const [meta, setMeta] = React.useState<OfferMeta | null>(() => initialMeta ?? null);
    const [platforms, setPlatforms] = React.useState<OfferPlatform[]>([]);
    const [loading, setLoading] = React.useState(initialOffers === undefined);
    const [pinned, setPinned] = React.useState<Offer[]>([]);
    const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
    const [selectedOfferModal, setSelectedOfferModal] = useState<Offer | null>(null);

    const abortRef = useRef<AbortController | null>(null);
    const hasRenderedInitialOffers = useRef(initialOffers !== undefined && !initialGameSlug);
    const filtersRef = useRef(filters);

    const debouncedQ = useDebounce(filters.q, 250);
    const searchParamsString = searchParams.toString();
    const hydrationSearchParams = useMemo(() => new URLSearchParams(searchParamsString), [searchParamsString]);

    useEffect(() => {
        let cancelled = false;
        void fetch("/api/platforms")
            .then(async (response) => {
                if (!response.ok) throw new Error("Failed to load platforms");
                return response.json() as Promise<{ data?: OfferPlatform[] }>;
            })
            .then((payload) => {
                if (!cancelled && Array.isArray(payload.data)) {
                    setPlatforms(payload.data.filter((platform): platform is OfferPlatform => Boolean(platform?.id && platform?.name)));
                }
            })
            .catch((error) => {
                console.error("[OfferSearchEngine] failed to load platforms", error);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const fetchOffers = useCallback(async () => {
        if (filters.q !== debouncedQ) return;

        const qs = buildQueryString(filters, debouncedQ);
        if (hasRenderedInitialOffers.current && qs === initialQueryString) {
            hasRenderedInitialOffers.current = false;
            return;
        }

        hasRenderedInitialOffers.current = false;
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setLoading(true);

        try {
            const endpoint = initialGameSlug
                ? `/api/offers/game/${initialGameSlug}?${qs}`
                : `/api/offers?${qs}`;
            const res = await fetch(endpoint, { signal: abortRef.current.signal });
            if (!res.ok) throw new Error("Fetch failed");
            const json = await res.json();
            const nextOffers = (initialGameSlug ? json.offers : json.data) ?? [];
            setOffers(Array.isArray(nextOffers) ? nextOffers.filter((offer) => offer && typeof offer.id === "string") : []);
            setMeta(initialGameSlug ? null : json.meta);
        } catch (err: unknown) {
            if ((err as Error).name !== "AbortError") {
                console.error("[OfferSearchEngine] error fetching offers", err);
            }
        } finally {
            setLoading(false);
        }
    }, [filters, debouncedQ, initialGameSlug, initialQueryString]);

    useEffect(() => {
        fetchOffers();
    }, [fetchOffers]);

    useEffect(() => {
        filtersRef.current = filters;
    }, [filters]);

    useEffect(() => {
        const nextFilters = buildFiltersFromSearchParams(hydrationSearchParams);
        nextFilters.country = hydrationSearchParams.get("country") || initialCountry || "US";
        if (serializeFilterState(nextFilters) !== serializeFilterState(filtersRef.current)) {
            dispatch({ type: "HYDRATE", filters: nextFilters });
        }
    }, [hydrationSearchParams, initialCountry]);

    useEffect(() => {
        if (initialGameSlug) return;
        if (filters.q !== debouncedQ) return;

        const nextParams = buildShareableSearchParams({ ...filters, q: debouncedQ });
        const nextQuery = nextParams.toString();
        const currentQuery = searchParams.toString();

        if (nextQuery !== currentQuery) {
            router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
        }
    }, [filters, debouncedQ, pathname, router, initialGameSlug, searchParams, searchParamsString]);

    const handlePin = (offer: Offer) => {
        setPinned((prev) => {
            const exists = prev.find((p) => p.id === offer.id);
            if (exists) return prev.filter((p) => p.id !== offer.id);
            if (prev.length >= 3) return prev;
            return [...prev, offer];
        });
    };

    const selectedCountry = countries.find((country) => country.code === filters.country)?.name ?? filters.country;

    return (
        <div className="space-y-4">
            {/* Filter Control Terminal */}
            <FilterControls
                filters={filters}
                dispatch={dispatch}
                platforms={platforms}
                countries={countries}
                totalResults={meta?.total}
                loading={loading}
            />

            {/* Results Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-xs">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">
                        {loading ? "Searching..." : meta ? `${meta.total.toLocaleString()} Offers Available` : "Offers"}
                    </span>
                    <span className="border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                        {selectedCountry}
                    </span>
                    {filters.sort === "completed_desc" ? (
                        <span className="inline-flex items-center gap-1 border border-orange-300 bg-orange-50 px-2 py-0.5 text-xs font-black text-orange-800">
                            <Flame className="h-3 w-3 fill-orange-500 text-orange-500" />
                            Sorted by Most Completed
                        </span>
                    ) : null}
                </div>

                <div className="flex items-center gap-2">
                    {/* View Switcher */}
                    <div className="flex border border-slate-300 bg-slate-100 p-0.5">
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            aria-label="Grid view"
                            className={`flex h-7 w-7 items-center justify-center transition-colors ${
                                viewMode === "grid"
                                    ? "bg-slate-900 text-[var(--brand-lime)] shadow-xs"
                                    : "text-slate-500 hover:text-slate-900"
                            }`}
                        >
                            <Grid2X2 className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("list")}
                            aria-label="List view"
                            className={`flex h-7 w-7 items-center justify-center transition-colors ${
                                viewMode === "list"
                                    ? "bg-slate-900 text-[var(--brand-lime)] shadow-xs"
                                    : "text-slate-500 hover:text-slate-900"
                            }`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Offer Results View */}
            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex h-72 flex-col border border-slate-200 bg-white p-4 shadow-xs animate-pulse">
                            <div className="mb-3 h-32 w-full bg-slate-200" />
                            <div className="mb-2 h-4 w-3/4 bg-slate-200" />
                            <div className="mb-4 h-3 w-1/2 bg-slate-200" />
                            <div className="mt-auto h-8 w-full bg-slate-200" />
                        </div>
                    ))}
                </div>
            ) : offers.length === 0 ? (
                <div className="border border-slate-200 bg-white p-12 text-center shadow-xs">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center border border-slate-200 bg-slate-100 text-2xl">
                        🔍
                    </div>
                    <h3 className="text-base font-black text-slate-900">No matching offers found</h3>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                        Try clearing some filters, searching for a different game, or selecting another country.
                    </p>
                    <button
                        type="button"
                        onClick={() => dispatch({ type: "RESET", country: filters.country })}
                        className="mt-4 border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-wider text-[var(--brand-lime)] hover:bg-slate-800"
                    >
                        Reset All Filters
                    </button>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {offers.map((offer) => (
                        <OfferGridCard
                            key={offer.id}
                            offer={offer}
                            onPin={handlePin}
                            onOpenModal={(off) => setSelectedOfferModal(off)}
                            isPinned={pinned.some((p) => p.id === offer.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="border border-slate-200 bg-white shadow-xs">
                    {offers.map((offer) => (
                        <OfferRowItem
                            key={offer.id}
                            offer={offer}
                            onPin={handlePin}
                            onOpenModal={(off) => setSelectedOfferModal(off)}
                            isPinned={pinned.some((p) => p.id === offer.id)}
                        />
                    ))}
                </div>
            )}

            {/* Pagination Bar */}
            {meta && meta.total_pages > 1 && (
                <div className="flex flex-col items-center justify-between gap-3 border border-slate-200 bg-white p-4 shadow-xs sm:flex-row">
                    <div className="text-xs font-bold text-slate-600">
                        Showing{" "}
                        <span className="font-black text-slate-900">
                            {(filters.page - 1) * meta.per_page + 1}–{Math.min(filters.page * meta.per_page, meta.total)}
                        </span>{" "}
                        of <span className="font-black text-slate-900">{meta.total.toLocaleString()}</span> offers
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => dispatch({ type: "SET_PAGE", page: filters.page - 1 })}
                            disabled={filters.page <= 1}
                            className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 hover:border-slate-800 hover:bg-slate-50"
                        >
                            ← Prev
                        </button>

                        <span className="border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-900">
                            Page {filters.page} of {meta.total_pages}
                        </span>

                        <button
                            type="button"
                            onClick={() => dispatch({ type: "SET_PAGE", page: filters.page + 1 })}
                            disabled={filters.page >= meta.total_pages}
                            className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 hover:border-slate-800 hover:bg-slate-50"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}

            {/* Details Modal Popup in EarnGrind Aesthetic */}
            <OfferDetailsModal
                offer={selectedOfferModal}
                onClose={() => setSelectedOfferModal(null)}
                onPin={handlePin}
                isPinned={Boolean(selectedOfferModal && pinned.some(p => p.id === selectedOfferModal.id))}
            />

            {/* Compare Drawer */}
            <CompareDrawer
                pinned={pinned}
                onRemove={(id) => setPinned((prev) => prev.filter((o) => o.id !== id))}
                onClear={() => setPinned([])}
            />
        </div>
    );
}
