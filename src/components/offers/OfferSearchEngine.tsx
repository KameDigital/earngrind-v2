"use client";

import React, { useReducer, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";

// ---------------------------------------------------------------
// TYPES — mirrors /api/offers response exactly
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
    source: "ingested" | "manual";   // ← NEW
    title: string;
    image_url: string | null;
    payout_usd: number;
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
    goal_text: string | null;         // ← NEW (manual offers)
    provider_name: string | null;     // ← NEW (manual offers)
    game: OfferGame;
    platform: OfferPlatform;
    redirect_url: string | null;      // /go/:id for ingested, direct URL for manual
}

export interface OfferMeta {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

const isImageUrl = (url?: string | null) =>
    typeof url === "string" &&
    /\.(jpg|jpeg|png|webp|gif|avif|svg)(?:$|[?#])/i.test(url);

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
        return <div className="text-[var(--text-tertiary)] text-xs font-bold uppercase">{fallbackText}</div>;
    }

    return (
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

// ---------------------------------------------------------------
// FILTER STATE — maps 1:1 to /api/offers query params
// ---------------------------------------------------------------
interface FilterState {
    q: string;
    source: "" | "ingested" | "manual";
    platform_id: string; // ← NEW
    platform_kind: string;
    device: string;
    country: string;
    payout_type: string;
    is_new: boolean;
    is_hot: boolean;
    is_ath: boolean;
    is_boosted: boolean;
    min_payout: number;
    sort: "payout_desc" | "payout_asc" | "heat_desc" | "newest";
    page: number;
}

const defaultFilters: FilterState = {
    q: "",
    source: "",
    platform_id: "",
    platform_kind: "",
    device: "",
    country: "US",
    payout_type: "",
    is_new: false,
    is_hot: false,
    is_ath: false,
    is_boosted: false,
    min_payout: 0,
    sort: "payout_desc",
    page: 1,
};

type FilterAction =
    | { type: "SET"; key: keyof FilterState; value: FilterState[keyof FilterState] }
    | { type: "HYDRATE"; filters: FilterState }
    | { type: "RESET" }
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
            return { ...defaultFilters };
        default:
            return state;
    }
}

// ---------------------------------------------------------------
// HOOKS
// ---------------------------------------------------------------
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
    const sort = searchParams.get("sort");
    const source = searchParams.get("source");

    return {
        q: searchParams.get("q") ?? "",
        source: source === "ingested" || source === "manual" ? source : "",
        platform_id: searchParams.get("platform_id") ?? "",
        platform_kind: searchParams.get("platform_kind") ?? "",
        device: searchParams.get("device") ?? "",
        country: searchParams.get("country") ?? "US",
        payout_type: searchParams.get("payout_type") ?? "",
        is_new: searchParams.get("is_new") === "true",
        is_hot: searchParams.get("is_hot") === "true",
        is_ath: searchParams.get("is_ath") === "true",
        is_boosted: searchParams.get("is_boosted") === "true",
        min_payout: parseFloat(searchParams.get("min_payout") ?? "0") || 0,
        sort: sort === "payout_asc" || sort === "heat_desc" || sort === "newest" ? sort : "payout_desc",
        page: Number.isFinite(page) && page > 0 ? page : 1,
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
    if (filters.device) params.set("device", filters.device);
    if (filters.country && filters.country !== defaultFilters.country) params.set("country", filters.country);
    if (filters.payout_type) params.set("payout_type", filters.payout_type);
    if (filters.is_new) params.set("is_new", "true");
    if (filters.is_hot) params.set("is_hot", "true");
    if (filters.is_ath) params.set("is_ath", "true");
    if (filters.is_boosted) params.set("is_boosted", "true");
    if (filters.min_payout > 0) params.set("min_payout", String(filters.min_payout));
    if (filters.sort !== defaultFilters.sort) params.set("sort", filters.sort);
    if (filters.page > 1) params.set("page", String(filters.page));
    return params;
}

function buildQueryString(filters: FilterState, debouncedQ: string): string {
    const params = new URLSearchParams();
    if (debouncedQ) params.set("q", debouncedQ);
    if (filters.source) params.set("source", filters.source);
    if (filters.platform_id) params.set("platform_id", filters.platform_id);
    if (filters.platform_kind) params.set("platform_kind", filters.platform_kind);
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
    return params.toString();
}

// ---------------------------------------------------------------
// BADGE COMPONENT
// ---------------------------------------------------------------
interface BadgeProps {
    label: string;
    variant: "ath" | "new" | "hot" | "boosted" | "featured" | "best";
}

const badgeStyles: Record<BadgeProps["variant"], string> = {
    ath: "bg-[var(--brand-lime)] text-[var(--brand-ink)]",
    best: "bg-[var(--brand-ink)] text-[var(--brand-lime)]",
    new: "bg-blue-50 text-blue-700 border border-blue-200",
    hot: "bg-orange-100 text-orange-700 border border-orange-200",
    boosted: "bg-purple-50 text-purple-700 border border-purple-200",
    featured: "bg-amber-50 text-amber-700 border border-amber-200",
};

function Badge({ label, variant }: BadgeProps) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider leading-none ${badgeStyles[variant]}`}>
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
    return <span title={device} className="text-sm">{icons[device] ?? "📱"}</span>;
};

// ---------------------------------------------------------------
// OFFER ROW
// ---------------------------------------------------------------
interface OfferRowProps {
    offer: Offer;
    onPin: (offer: Offer) => void;
    isPinned: boolean;
    isBestPayout: boolean;
    ctaLocation: string;
    ctaSourceContext: string;
    extraRoutesCount?: number;
    extraSitesLabel?: string;
    onToggleExtraRoutes?: () => void;
    extraRoutesOpen?: boolean;
    compactVariant?: boolean;
}

function OfferRow({
    offer,
    onPin,
    isPinned,
    isBestPayout,
    ctaLocation,
    ctaSourceContext,
    extraRoutesCount = 0,
    extraSitesLabel,
    onToggleExtraRoutes,
    extraRoutesOpen = false,
    compactVariant = false,
}: OfferRowProps) {
    const gameName = offer.game?.name ?? offer.title ?? "Offer";
    const gameSlug = offer.game?.slug ?? null;
    const gameHref = gameSlug ? `/offers/${gameSlug}` : null;
    const platformName = offer.platform?.name ?? "Unknown platform";
    const providerName = offer.provider_name ?? platformName;
    const thumbnailUrl =
        offer.image_url ??
        (isImageUrl(offer.redirect_url) ? offer.redirect_url : null) ??
        offer.game?.thumbnail_url ??
        null;
    const routeSummary =
        offer.goal_text ||
        (gameHref
            ? `Open the offer route to compare payouts and details for ${gameName}.`
            : `Go directly to ${platformName} for this offer.`);

    return (
        <div
            className={`px-4 py-4 border-b border-[var(--border-default)] last:border-0 transition-colors group cursor-pointer ${
                isBestPayout
                    ? "bg-[var(--brand-lime)]/5 border-l-[3px] !border-l-[var(--brand-lime)]"
                    : "hover:bg-[var(--surface-muted)]"
            } ${compactVariant ? "bg-[var(--surface-muted)]/45" : ""}`}
            role="button"
            tabIndex={0}
        >
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-[var(--surface-muted)] border border-[var(--border-default)] flex items-center justify-center group-hover:border-lime-300 transition-colors">
                    <OfferThumbnail
                        src={thumbnailUrl}
                        alt={gameName}
                        fallbackText={gameName.substring(0, 2)}
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                            {offer.source === "manual" ? "Curated route" : "Live offer"}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="font-bold text-[var(--brand-ink)] group-hover:text-lime-700 transition-colors truncate text-sm">
                            {gameName}
                        </span>
                        {isBestPayout && <Badge label="TOP PAYOUT" variant="best" />}
                        {offer.source === "manual" && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider leading-none bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Curated
                            </span>
                        )}
                        {offer.is_ath && <Badge label="ATH" variant="ath" />}
                        {offer.is_new && <Badge label="NEW" variant="new" />}
                        {offer.is_hot && <Badge label="HOT" variant="hot" />}
                        {offer.is_boosted && <Badge label="BOOSTED" variant="boosted" />}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-[var(--brand-ink)]">
                            {offer.platform.logo_url && (
                                <Image src={offer.platform.logo_url} alt={platformName} width={12} height={12} className="w-3 h-3 rounded-sm object-cover" />
                            )}
                            {platformName}
                        </span>
                        <span className="text-[var(--border-strong)]">?</span>
                        <span>{providerName}</span>
                        <span className="text-[var(--border-strong)]">?</span>
                        <span className="flex items-center gap-0.5">
                            {offer.devices.map((device) => <DeviceIcon key={device} device={device} />)}
                        </span>
                        {offer.heat_score > 50 && <span className="text-orange-500 font-semibold">??</span>}
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">{routeSummary}</p>
                </div>

                <div className="flex-shrink-0 text-right ml-auto pl-2">
                    <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-0.5 font-semibold">
                        {isBestPayout ? "Best now" : "Up to"}
                    </div>
                    <div className={`text-xl sm:text-2xl font-extrabold leading-none ${isBestPayout ? 'text-[color:hsl(84,93%,25%)]' : 'text-[color:hsl(84,93%,30%)]'}`}>
                        ${offer.payout_usd.toFixed(2)}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={(e) => { e.stopPropagation(); onPin(offer); }}
                    title={isPinned ? "Remove from comparison" : "Add to comparison"}
                    aria-label={isPinned ? "Remove from comparison" : "Add to comparison"}
                    className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border text-sm font-bold transition-colors ${isPinned
                        ? "bg-[var(--brand-lime)] border-lime-300 text-[var(--brand-ink)]"
                        : "bg-white border-[var(--border-default)] text-[var(--text-tertiary)] hover:border-lime-300 hover:text-lime-700 hover:bg-[var(--brand-lime)]/10"
                    }`}
                >
                    {isPinned ? "?" : "+"}
                </button>

                {gameHref ? (
                    <Link
                        href={gameHref}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 sm:flex-none text-center px-3 py-2 bg-white border border-[var(--border-default)] hover:border-lime-300 hover:bg-[var(--brand-lime)]/10 text-[var(--brand-ink)] text-sm font-bold rounded-xl transition-all whitespace-nowrap"
                    >
                        View Route
                    </Link>
                ) : (
                    <span className="flex-1 sm:flex-none text-center px-3 py-2 bg-[var(--surface-muted)] text-[var(--text-tertiary)] text-sm font-semibold rounded-xl whitespace-nowrap border border-[var(--border-default)] cursor-not-allowed">
                        No Details
                    </span>
                )}

                {offer.redirect_url ? (
                    <TrackedOutboundLink
                        href={offer.redirect_url}
                        onClick={(e) => e.stopPropagation()}
                        eventLabel={offer.source === "manual" ? "manual-offer-cta" : "offer-search-cta"}
                        offerId={offer.id}
                        offerTitle={gameName}
                        gameTitle={gameName}
                        platformName={platformName}
                        providerName={offer.provider_name}
                        payoutUsd={offer.payout_usd}
                        location={ctaLocation}
                        sourceContext={ctaSourceContext}
                        className="flex-1 sm:flex-none text-center px-4 py-2 bg-[var(--brand-ink)] hover:bg-[var(--brand-ink)]/90 text-[var(--brand-lime)] text-sm font-extrabold rounded-xl transition-all whitespace-nowrap shadow-sm"
                    >
                        {offer.source === "manual" ? "Go to Site" : "Start Offer"}
                    </TrackedOutboundLink>
                ) : (
                    <span className="flex-1 sm:flex-none text-center px-4 py-2 bg-[var(--surface-muted)] text-[var(--text-tertiary)] text-sm font-semibold rounded-xl whitespace-nowrap border border-[var(--border-default)] cursor-not-allowed">
                        No Link
                    </span>
                )}
            </div>
            <div className="mt-2 text-[11px] text-[var(--text-tertiary)]">
                {gameHref
                    ? "View Route opens the detail path. Start Offer sends you to the payout platform."
                    : "Start Offer sends you directly to the payout platform."}
            </div>
            {extraRoutesCount > 0 && onToggleExtraRoutes ? (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[var(--border-default)] bg-white px-3 py-2">
                    <div className="min-w-0 text-xs text-[var(--text-secondary)]">
                        <span className="font-bold text-[var(--brand-ink)]">{extraRoutesCount} more site{extraRoutesCount !== 1 ? "s" : ""}</span>
                        {extraSitesLabel ? ` available: ${extraSitesLabel}` : "."}
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExtraRoutes();
                        }}
                        className="flex-shrink-0 rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-extrabold text-[var(--brand-ink)] hover:border-lime-400"
                    >
                        {extraRoutesOpen ? "Hide sites" : "Show sites"}
                    </button>
                </div>
            ) : null}
        </div>
    );
}

// ---------------------------------------------------------------
// SEARCH BAR
// ---------------------------------------------------------------
interface SearchBarProps {
    value: string;
    onChange: (v: string) => void;
}

function SearchBar({ value, onChange }: SearchBarProps) {
    return (
        <div className="relative group">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)] group-focus-within:text-lime-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                type="search"
                placeholder="Search games, platforms, categories..."
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl border border-[var(--border-default)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-lime)]/20 focus:border-lime-400 shadow-[var(--shadow-card)] text-[var(--brand-ink)] placeholder:text-[var(--text-tertiary)] text-base transition-all"
            />
        </div>
    );
}

// ---------------------------------------------------------------
// FILTER BAR
// ---------------------------------------------------------------
interface FilterBarProps {
    filters: FilterState;
    dispatch: React.Dispatch<FilterAction>;
    platforms: OfferPlatform[];
    selectedPlatformName?: string;
}

function FilterBar({ filters, dispatch, platforms, selectedPlatformName }: FilterBarProps) {
    const set = (key: keyof FilterState, value: FilterState[keyof FilterState]) =>
        dispatch({ type: "SET", key, value });

    const badgeFilters: { key: "is_new" | "is_hot" | "is_ath" | "is_boosted"; label: string; variant: BadgeProps["variant"] }[] = [
        { key: "is_new", label: "NEW", variant: "new" },
        { key: "is_hot", label: "HOT", variant: "hot" },
        { key: "is_ath", label: "ATH", variant: "ath" },
        { key: "is_boosted", label: "BOOSTED", variant: "boosted" },
    ];

    const selectClass = "px-3.5 py-2 rounded-xl border border-[var(--border-default)] text-sm font-semibold text-[var(--brand-ink)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-lime)]/30 focus:border-lime-400 hover:border-[var(--border-strong)] transition-colors shadow-[var(--shadow-card)] cursor-pointer appearance-none pr-8";

    return (
        <div className="flex flex-col gap-3">
            {/* Row 1: horizontally scrollable dropdowns on mobile */}
            <div className="flex gap-2 items-center overflow-x-auto pb-1 hide-scrollbar -mx-1 px-1">
                <div className="relative flex-shrink-0">
                    <select value={filters.sort} onChange={e => set("sort", e.target.value as FilterState["sort"])} className={selectClass}>
                        <option value="payout_desc">Highest Payout</option>
                        <option value="payout_asc">Lowest Payout</option>
                        <option value="heat_desc">Most Active</option>
                        <option value="newest">Newest Offers</option>
                    </select>
                    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>

                <div className="relative flex-shrink-0">
                    <select value={filters.source} onChange={e => set("source", e.target.value as FilterState["source"])} className={selectClass}>
                        <option value="">All Sources</option>
                        <option value="ingested">Automated</option>
                        <option value="manual">Curated</option>
                    </select>
                    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>

                <div className="relative flex-shrink-0">
                    <select
                        value={filters.platform_id}
                        onChange={e => {
                            set("platform_id", e.target.value);
                            if (e.target.value) {
                                set("platform_kind", "");
                            }
                        }}
                        className={selectClass}
                    >
                        <option value="">All Sites</option>
                        {selectedPlatformName && !platforms.find((platform) => platform.id === filters.platform_id) && filters.platform_id ? (
                            <option value={filters.platform_id}>{selectedPlatformName}</option>
                        ) : null}
                        {platforms.map((platform) => (
                            <option key={platform.id} value={platform.id}>
                                {platform.name}
                            </option>
                        ))}
                    </select>
                    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>

                <div className="relative flex-shrink-0">
                    <select value={filters.device} onChange={e => set("device", e.target.value)} className={selectClass}>
                        <option value="">All Devices</option>
                        <option value="ios">🍏 iOS</option>
                        <option value="android">🤖 Android</option>
                        <option value="pc">💻 PC</option>
                    </select>
                    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>

                {/* Country toggle */}
                <div className="flex-shrink-0 flex rounded-xl border border-[var(--border-default)] overflow-hidden text-sm shadow-[var(--shadow-card)] bg-[var(--surface-muted)] p-0.5 gap-0.5">
                    {(["US", "UK", ""] as const).map(c => (
                        <button
                            key={c || "global"}
                            onClick={() => set("country", c)}
                            className={`px-3 py-1.5 transition-all font-bold rounded-lg text-sm ${filters.country === c
                                ? "bg-white text-[var(--brand-ink)] shadow-sm"
                                : "text-[var(--text-secondary)] hover:text-[var(--brand-ink)] hover:bg-white/60"
                            }`}
                        >
                            {c || "Global"}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => dispatch({ type: "RESET" })}
                    className="flex-shrink-0 ml-auto px-3.5 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--brand-ink)] border border-[var(--border-default)] rounded-xl bg-white hover:border-[var(--border-strong)] transition-colors shadow-[var(--shadow-card)]"
                >
                    Clear
                </button>
            </div>

            {/* Row 2: badge filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-1 px-1">
                <span className="flex-shrink-0 text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center">Filter by:</span>
                {badgeFilters.map(({ key, label, variant }) => (
                    <button
                        key={key}
                        onClick={() => set(key, !filters[key])}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold uppercase tracking-wide transition-all ${filters[key]
                            ? `${badgeStyles[variant]} border-transparent shadow-sm scale-[1.02]`
                            : "bg-white border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--brand-ink)]"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------
// COMPARE DRAWER
// ---------------------------------------------------------------
interface CompareDrawerProps {
    pinned: Offer[];
    onRemove: (id: string) => void;
    onClear: () => void;
}

function CompareDrawer({ pinned, onRemove, onClear }: CompareDrawerProps) {
    if (pinned.length === 0) return null;
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[var(--border-default)] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.12)] p-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4">
                <div className="text-sm font-extrabold text-[var(--brand-ink)] whitespace-nowrap flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[var(--brand-lime)] text-[var(--brand-ink)] flex items-center justify-center text-xs font-extrabold">
                        {pinned.length}
                    </div>
                    Comparing
                </div>
                <div className="flex-1 flex gap-2 overflow-x-auto w-full pb-2 sm:pb-0 hide-scrollbar">
                    {pinned.map(offer => (
                        <div key={offer.id} className="flex-shrink-0 flex items-center gap-3 bg-[var(--surface-muted)] rounded-xl px-3 py-2 border border-[var(--border-default)] min-w-[200px] relative">
                            <div className="w-8 h-8 flex-shrink-0 overflow-hidden rounded-lg border border-[var(--border-default)] flex items-center justify-center bg-white">
                                <OfferThumbnail
                                    src={offer.image_url ?? (isImageUrl(offer.redirect_url) ? offer.redirect_url : null) ?? offer.game.thumbnail_url}
                                    alt={offer.game?.name ?? offer.title}
                                    fallbackText={(offer.game?.name ?? offer.title).substring(0, 2)}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                                <div className="text-xs font-bold text-[var(--brand-ink)] truncate">{offer.game?.name ?? offer.title}</div>
                                <div className="text-[11px] text-[var(--text-secondary)] font-medium truncate">{offer.platform?.name ?? "Unknown platform"} · <span className="text-[color:hsl(84,93%,30%)] font-extrabold">${offer.payout_usd.toFixed(2)}</span></div>
                            </div>
                            <button onClick={() => onRemove(offer.id)} className="absolute right-2 text-[var(--text-tertiary)] hover:text-red-500 text-lg leading-none p-1 transition-colors">×</button>
                        </div>
                    ))}
                    {pinned.length < 3 && (
                        <div className="flex-shrink-0 flex items-center justify-center bg-[var(--surface-muted)] border border-[var(--border-default)] border-dashed rounded-xl px-4 py-2 min-w-[180px] text-xs font-semibold text-[var(--text-tertiary)]">
                            + {3 - pinned.length} more
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                    <button onClick={onClear} className="px-3.5 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--brand-ink)] transition-colors">Clear</button>
                    <a
                        href={`/tools/compare?offers=${pinned.map(o => o.id).join(",")}`}
                        className="px-5 py-2.5 bg-[var(--brand-ink)] hover:bg-[var(--brand-ink)]/90 text-[var(--brand-lime)] text-sm font-extrabold rounded-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        Compare Now →
                    </a>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------
// OFFER TABLE (list + pagination)
// ---------------------------------------------------------------
interface OfferTableProps {
    offers: Offer[];
    meta: OfferMeta | null;
    loading: boolean;
    page: number;
    onPageChange: (page: number) => void;
    onPin: (offer: Offer) => void;
    pinned: Offer[];
}

function OfferTable({ offers, meta, loading, page, onPageChange, onPin, pinned }: OfferTableProps) {
    const ctaLocation = meta ? "offers-search-list" : "game-offers-list";
    const ctaSourceContext = meta ? "offers-search" : "game-offers";
    const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});
    const groupedOffers = React.useMemo(() => {
        const groups = new Map<string, Offer[]>();
        for (const offer of offers) {
            const key = offer.game?.id ?? offer.game?.slug ?? offer.title;
            const current = groups.get(key) ?? [];
            current.push(offer);
            groups.set(key, current);
        }
        return Array.from(groups.entries()).map(([key, rows]) => ({
            key,
            primary: rows[0],
            alternatives: rows.slice(1),
        }));
    }, [offers]);
    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-[var(--border-default)] overflow-hidden shadow-[var(--shadow-card)]">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-5 border-b border-[var(--border-default)] last:border-0 animate-pulse">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-[var(--surface-muted)] rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-[var(--surface-muted)] rounded w-1/3" />
                                <div className="h-3 bg-[var(--surface-muted)] rounded w-1/5" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full pt-3 sm:pt-0">
                            <div className="w-20 h-8 bg-[var(--surface-muted)] rounded" />
                            <div className="w-28 h-10 bg-[var(--surface-muted)] rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (offers.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-[var(--border-default)] p-16 text-center shadow-[var(--shadow-card)]">
                <div className="w-16 h-16 bg-[var(--surface-muted)] rounded-2xl flex items-center justify-center text-2xl mb-4 mx-auto">
                    🔍
                </div>
                <h3 className="text-lg font-bold text-[var(--brand-ink)] mb-2">No offers found</h3>
                <p className="text-[var(--text-secondary)] max-w-sm mx-auto text-sm leading-relaxed">Try adjusting your filters, clearing them, or using a different search term to find what you&apos;re looking for.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="bg-white rounded-2xl border border-[var(--border-default)] overflow-hidden shadow-[var(--shadow-card)]">
                {groupedOffers.map(({ key, primary, alternatives }) => {
                    const extraSitesLabel = Array.from(
                        new Set(alternatives.map((offer) => offer.platform?.name).filter(Boolean)),
                    ).slice(0, 3).join(", ");
                    const isOpen = !!openGroups[key];
                    return (
                        <div key={key} className="border-b border-[var(--border-default)] last:border-0">
                            <OfferRow
                                offer={primary}
                                onPin={onPin}
                                isPinned={pinned.some(p => p.id === primary.id)}
                                isBestPayout={true}
                                ctaLocation={ctaLocation}
                                ctaSourceContext={ctaSourceContext}
                                extraRoutesCount={alternatives.length}
                                extraSitesLabel={extraSitesLabel}
                                extraRoutesOpen={isOpen}
                                onToggleExtraRoutes={() =>
                                    setOpenGroups((current) => ({ ...current, [key]: !current[key] }))
                                }
                            />
                            {isOpen && alternatives.length > 0 ? (
                                <div className="border-t border-[var(--border-default)] bg-[var(--surface-muted)]/35">
                                    {alternatives.map((offer) => (
                                        <OfferRow
                                            key={offer.id}
                                            offer={offer}
                                            onPin={onPin}
                                            isPinned={pinned.some(p => p.id === offer.id)}
                                            isBestPayout={false}
                                            ctaLocation={ctaLocation}
                                            ctaSourceContext={ctaSourceContext}
                                            compactVariant
                                        />
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {meta && meta.total_pages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4 px-1">
                    <div className="text-sm font-semibold text-[var(--text-secondary)] bg-white px-3.5 py-1.5 rounded-xl border border-[var(--border-default)] shadow-[var(--shadow-card)]">
                        <span className="text-[var(--brand-ink)]">{((page - 1) * meta.per_page) + 1}–{Math.min(page * meta.per_page, meta.total)}</span>{" "}
                        of <span className="text-[var(--brand-ink)]">{meta.total.toLocaleString()}</span> offers
                    </div>
                    <div className="flex gap-1 bg-white rounded-xl shadow-[var(--shadow-card)] border border-[var(--border-default)] p-1">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 1}
                            className="px-4 py-1.5 rounded-lg text-sm font-bold disabled:text-[var(--text-tertiary)] text-[var(--brand-ink)] hover:bg-[var(--surface-muted)] transition-colors"
                        >
                            ← Previous
                        </button>
                        <div className="w-px bg-[var(--border-default)] my-1" />
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= meta.total_pages}
                            className="px-4 py-1.5 rounded-lg text-sm font-bold disabled:text-[var(--text-tertiary)] text-[var(--brand-ink)] hover:bg-[var(--surface-muted)] transition-colors"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------
// PAGE-LEVEL WIRING: OfferSearchEngine
// ---------------------------------------------------------------
interface OfferSearchEngineProps {
    initialGameSlug?: string; // for /offers/[game-slug] pages
}

export default function OfferSearchEngine({ initialGameSlug }: OfferSearchEngineProps) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [filters, dispatch] = useReducer(filterReducer, searchParams, buildFiltersFromSearchParams);
    const [offers, setOffers] = React.useState<Offer[]>([]);
    const [meta, setMeta] = React.useState<OfferMeta | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [pinned, setPinned] = React.useState<Offer[]>([]);
    const abortRef = useRef<AbortController | null>(null);

    const debouncedQ = useDebounce(filters.q, 300);
    const reviewPlatformName = searchParams.get("platform_name") ?? "";
    const isReviewScoped = searchParams.get("from_review") === "1" && !!filters.platform_id;
    const hasPlatformFilter = !!filters.platform_id;
    const searchParamsString = searchParams.toString();
    const visiblePlatforms = React.useMemo(() => {
        const byId = new Map<string, OfferPlatform>();
        for (const offer of offers) {
            if (offer.platform?.id && !byId.has(offer.platform.id)) {
                byId.set(offer.platform.id, offer.platform);
            }
        }
        return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [offers]);

    const fetchOffers = useCallback(async () => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setLoading(true);
        try {
            const qs = buildQueryString(filters, debouncedQ);
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
            if ((err as Error).name !== "AbortError") console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters, debouncedQ, initialGameSlug]);

    useEffect(() => { fetchOffers(); }, [fetchOffers]);

    useEffect(() => {
        const nextFilters = buildFiltersFromSearchParams(searchParams);
        if (serializeFilterState(nextFilters) !== serializeFilterState(filters)) {
            dispatch({ type: "HYDRATE", filters: nextFilters });
        }
    }, [searchParamsString]);

    useEffect(() => {
        if (initialGameSlug) return;

        const nextParams = buildShareableSearchParams(filters, {
            platformName: filters.platform_id ? reviewPlatformName : undefined,
            fromReview: filters.platform_id ? isReviewScoped : false,
        });
        const nextQuery = nextParams.toString();
        const currentQuery = searchParams.toString();

        if (nextQuery !== currentQuery) {
            router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
        }
    }, [filters, pathname, router, reviewPlatformName, isReviewScoped, initialGameSlug, searchParamsString]);

    const handlePin = (offer: Offer) => {
        setPinned(prev => {
            const exists = prev.find(p => p.id === offer.id);
            if (exists) return prev.filter(p => p.id !== offer.id);
            if (prev.length >= 3) return prev; // max 3
            return [...prev, offer];
        });
    };

    return (
        <div className="space-y-5">
            {hasPlatformFilter && !initialGameSlug && (
                <div className="rounded-2xl border border-lime-200 bg-[var(--brand-lime)]/10 p-4 text-sm shadow-[var(--shadow-card)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="font-extrabold text-[var(--brand-ink)]">
                                {reviewPlatformName ? `Showing offers for ${reviewPlatformName}` : "Showing platform-specific offers"}
                            </div>
                            <p className="mt-1 text-[var(--text-secondary)]">
                                {isReviewScoped
                                    ? "You came from a platform review, so this list is filtered to offers available on that platform."
                                    : "This list is filtered to one platform so you can compare a more relevant set of offers."}
                            </p>
                        </div>
                        <Link
                            href="/offers"
                            className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400"
                        >
                            Clear Platform Filter
                        </Link>
                    </div>
                </div>
            )}

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] space-y-5">
                <SearchBar value={filters.q} onChange={v => dispatch({ type: "SET", key: "q", value: v })} />
                <div className="h-px bg-[var(--border-default)]" />
                <FilterBar
                    filters={filters}
                    dispatch={dispatch}
                    platforms={visiblePlatforms}
                    selectedPlatformName={reviewPlatformName || undefined}
                />
            </div>

            <div className="flex items-start justify-between gap-4 px-1">
                <div>
                    <h2 className="text-xl font-extrabold text-[var(--brand-ink)] tracking-tight">
                        {initialGameSlug
                            ? "Available Offers"
                            : hasPlatformFilter && reviewPlatformName
                                ? `${reviewPlatformName} Offers`
                                : "All Offers"}
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                        {hasPlatformFilter && reviewPlatformName
                            ? `These are offers currently filtered to ${reviewPlatformName}. Compare routes here after using the review to decide the platform is worth your time.`
                            : "Offers are sorted to help you identify stronger payout opportunities quickly. Open a route for detail, or start the offer directly."}
                    </p>
                </div>
                {meta && !loading && (
                    <div className="text-sm font-bold text-[var(--text-secondary)] bg-[var(--surface-muted)] px-3 py-1 rounded-lg border border-[var(--border-default)] whitespace-nowrap">
                        {meta.total.toLocaleString()} results
                    </div>
                )}
            </div>

            <OfferTable
                offers={offers}
                meta={meta}
                loading={loading}
                page={filters.page}
                onPageChange={page => dispatch({ type: "SET_PAGE", page })}
                onPin={handlePin}
                pinned={pinned}
            />

            <CompareDrawer
                pinned={pinned}
                onRemove={id => setPinned(p => p.filter(o => o.id !== id))}
                onClear={() => setPinned([])}
            />
        </div>
    );
}

