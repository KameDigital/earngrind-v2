"use client";

import React, { useReducer, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

// ---------------------------------------------------------------
// FILTER STATE — maps 1:1 to /api/offers query params
// ---------------------------------------------------------------
interface FilterState {
    q: string;
    source: "" | "ingested" | "manual"; // ← NEW
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
    | { type: "RESET" }
    | { type: "SET_PAGE"; page: number };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
    switch (action.type) {
        case "SET":
            return { ...state, [action.key]: action.value, page: 1 };
        case "SET_PAGE":
            return { ...state, page: action.page };
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

function buildQueryString(filters: FilterState, debouncedQ: string): string {
    const params = new URLSearchParams();
    if (debouncedQ) params.set("q", debouncedQ);
    if (filters.source) params.set("source", filters.source);
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
}

function OfferRow({ offer, onPin, isPinned, isBestPayout }: OfferRowProps) {
    const router = useRouter();
    const gameHref = `/offers/${offer.game.slug}`;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => router.push(gameHref)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(gameHref);
                }
            }}
            className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-[var(--border-default)] last:border-0 transition-colors group cursor-pointer ${isBestPayout ? 'bg-[var(--brand-lime)]/5 border-l-[3px] !border-l-[var(--brand-lime)]' : 'hover:bg-[var(--surface-muted)]'
                }`}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Game thumbnail — row click handles navigation */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-[var(--surface-muted)] border border-[var(--border-default)] flex items-center justify-center group-hover:border-lime-300 transition-colors">
                    {offer.game.thumbnail_url ? (
                        <Image src={offer.game.thumbnail_url} alt={offer.game.name} width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-[var(--text-tertiary)] text-xs font-bold uppercase">{offer.game.name.substring(0, 2)}</div>
                    )}
                </div>

                {/* Game info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-[var(--brand-ink)] group-hover:text-lime-700 transition-colors truncate text-sm">
                            {offer.game.name}
                        </span>
                        {isBestPayout && <Badge label="BEST PAYOUT" variant="best" />}
                        {offer.source === "manual" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider leading-none bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Curated
                            </span>
                        )}
                        {offer.is_ath && <Badge label="ATH" variant="ath" />}
                        {offer.is_new && <Badge label="NEW" variant="new" />}
                        {offer.is_hot && <Badge label="HOT" variant="hot" />}
                        {offer.is_boosted && <Badge label="BOOSTED" variant="boosted" />}
                        {offer.is_featured && <Badge label="Pick" variant="featured" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                        <span className="flex items-center gap-1 font-medium">
                            {offer.platform.logo_url && (
                                <Image src={offer.platform.logo_url} alt={offer.platform.name} width={12} height={12} className="w-3 h-3 rounded-sm object-cover" />
                            )}
                            {offer.platform.name}
                        </span>
                        {offer.source === "manual" && offer.provider_name && (
                            <>
                                <span className="text-[var(--border-strong)]">via</span>
                                <span className="font-medium text-indigo-600">{offer.provider_name}</span>
                            </>
                        )}
                        <span className="text-[var(--border-strong)]">·</span>
                        <span className="flex items-center gap-0.5">
                            {offer.devices.map(d => <DeviceIcon key={d} device={d} />)}
                        </span>
                        {offer.heat_score > 50 && (
                            <>
                                <span className="text-[var(--border-strong)]">·</span>
                                <span className="text-orange-500 font-semibold">🔥 {offer.heat_score}</span>
                            </>
                        )}
                    </div>
                    {/* Goal text for manual offers */}
                    {offer.source === "manual" && offer.goal_text && (
                        <p className="mt-1 text-xs text-[var(--text-tertiary)] italic line-clamp-1">{offer.goal_text}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-auto w-full border-t border-[var(--border-default)] sm:border-0 pt-3 sm:pt-0">
                {/* Payout — prominent */}
                <div className="flex-shrink-0 min-w-[72px] text-left sm:text-right">
                    <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-0.5 font-semibold">Up to</div>
                    <div className={`text-2xl font-extrabold leading-none ${isBestPayout ? 'text-[color:hsl(84,93%,25%)]' : 'text-[color:hsl(84,93%,30%)]'}`}>
                        ${offer.payout_usd.toFixed(2)}
                    </div>
                </div>

                {/* CTAs — stopPropagation so they don't trigger row click */}
                <div className="flex-shrink-0 flex items-center gap-2">
                    {/* Pin button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onPin(offer); }}
                        title={isPinned ? "Remove from comparison" : "Add to comparison"}
                        aria-label={isPinned ? "Remove from comparison" : "Add to comparison"}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl border text-sm font-bold transition-colors ${isPinned
                            ? "bg-[var(--brand-lime)] border-lime-300 text-[var(--brand-ink)]"
                            : "bg-white border-[var(--border-default)] text-[var(--text-tertiary)] hover:border-lime-300 hover:text-lime-700 hover:bg-[var(--brand-lime)]/10"
                            }`}
                    >
                        {isPinned ? "✓" : "+"}
                    </button>

                    {/* View Details — internal comparison page (secondary CTA) */}
                    <Link
                        href={gameHref}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3.5 py-2 bg-white border border-[var(--border-default)] hover:border-lime-300 hover:bg-[var(--brand-lime)]/10 text-[var(--brand-ink)] text-sm font-bold rounded-xl transition-all whitespace-nowrap"
                    >
                        View Details
                    </Link>

                    {/* Start Offer CTA — disabled if no URL (some manual offers lack one) */}
                    {offer.redirect_url ? (
                        <a
                            href={offer.redirect_url}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            onClick={(e) => e.stopPropagation()}
                            className="px-4 py-2 bg-[var(--brand-ink)] hover:bg-[var(--brand-ink)]/90 text-[var(--brand-lime)] text-sm font-extrabold rounded-xl transition-all hover:-translate-y-px active:translate-y-0 whitespace-nowrap shadow-sm"
                        >
                            {offer.source === "manual" ? "Go to Site" : "Start Offer"}
                        </a>
                    ) : (
                        <span className="px-4 py-2 bg-[var(--surface-muted)] text-[var(--text-tertiary)] text-sm font-semibold rounded-xl whitespace-nowrap border border-[var(--border-default)] cursor-not-allowed">
                            No Link
                        </span>
                    )}
                </div>
            </div>
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
}

function FilterBar({ filters, dispatch }: FilterBarProps) {
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
        <div className="flex flex-col gap-4">
            {/* Row 1: dropdowns */}
            <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                    <select value={filters.sort} onChange={e => set("sort", e.target.value as FilterState["sort"])} className={selectClass}>
                        <option value="payout_desc">Highest Payout</option>
                        <option value="payout_asc">Lowest Payout</option>
                        <option value="heat_desc">Most Active</option>
                        <option value="newest">Newest Offers</option>
                    </select>
                    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>

                <div className="relative">
                    <select value={filters.source} onChange={e => set("source", e.target.value as FilterState["source"])} className={selectClass}>
                        <option value="">All Sources</option>
                        <option value="ingested">Automated</option>
                        <option value="manual">Curated</option>
                    </select>
                    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>

                <div className="relative">
                    <select value={filters.platform_kind} onChange={e => set("platform_kind", e.target.value)} className={selectClass}>
                        <option value="">All Platforms</option>
                        <option value="gpt_site">GPT Sites</option>
                        <option value="offerwall">Offerwalls</option>
                        <option value="cashback">Cashback</option>
                    </select>
                    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>

                <div className="relative">
                    <select value={filters.device} onChange={e => set("device", e.target.value)} className={selectClass}>
                        <option value="">All Devices</option>
                        <option value="ios">🍏 iOS</option>
                        <option value="android">🤖 Android</option>
                        <option value="pc">💻 PC</option>
                    </select>
                    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>

                {/* Country toggle */}
                <div className="flex rounded-xl border border-[var(--border-default)] overflow-hidden text-sm shadow-[var(--shadow-card)] bg-[var(--surface-muted)] p-0.5 gap-0.5">
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

                <div className="flex-1" />
                <button
                    onClick={() => dispatch({ type: "RESET" })}
                    className="px-3.5 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--brand-ink)] border border-[var(--border-default)] rounded-xl bg-white hover:border-[var(--border-strong)] transition-colors shadow-[var(--shadow-card)]"
                >
                    Clear Filters
                </button>
            </div>

            {/* Row 2: badge filter pills */}
            <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] mr-1">Filter by:</span>
                {badgeFilters.map(({ key, label, variant }) => (
                    <button
                        key={key}
                        onClick={() => set(key, !filters[key])}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold uppercase tracking-wide transition-all ${filters[key]
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
                                {offer.game.thumbnail_url ? (
                                    <Image src={offer.game.thumbnail_url} alt="" width={32} height={32} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[10px] text-[var(--text-tertiary)] font-bold">{offer.game.name.substring(0, 2)}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                                <div className="text-xs font-bold text-[var(--brand-ink)] truncate">{offer.game.name}</div>
                                <div className="text-[11px] text-[var(--text-secondary)] font-medium truncate">{offer.platform.name} · <span className="text-[color:hsl(84,93%,30%)] font-extrabold">${offer.payout_usd.toFixed(2)}</span></div>
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
    // Compute best payout per game in current result set (API already sorted desc,
    // so the first occurrence of each game.id is the highest-payout offer for that game)
    const bestPayoutByGame = new Map<string, string>(); // game.id -> offer.id
    for (const offer of offers) {
        if (!bestPayoutByGame.has(offer.game.id)) {
            bestPayoutByGame.set(offer.game.id, offer.id);
        }
    }
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
                {offers.map(offer => {
                    // Best payout per game in current result set (API sorted desc, so first per game.id is best)
                    const isBestPayout = bestPayoutByGame.get(offer.game.id) === offer.id;
                    return (
                        <OfferRow
                            key={offer.id}
                            offer={offer}
                            onPin={onPin}
                            isPinned={pinned.some(p => p.id === offer.id)}
                            isBestPayout={isBestPayout}
                        />
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
    const [filters, dispatch] = useReducer(filterReducer, defaultFilters);
    const [offers, setOffers] = React.useState<Offer[]>([]);
    const [meta, setMeta] = React.useState<OfferMeta | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [pinned, setPinned] = React.useState<Offer[]>([]);
    const abortRef = useRef<AbortController | null>(null);

    const debouncedQ = useDebounce(filters.q, 300);

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
            setOffers(initialGameSlug ? json.offers : json.data);
            setMeta(initialGameSlug ? null : json.meta);
        } catch (err: unknown) {
            if ((err as Error).name !== "AbortError") console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters, debouncedQ, initialGameSlug]);

    useEffect(() => { fetchOffers(); }, [fetchOffers]);

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
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] space-y-5">
                <SearchBar value={filters.q} onChange={v => dispatch({ type: "SET", key: "q", value: v })} />
                <div className="h-px bg-[var(--border-default)]" />
                <FilterBar filters={filters} dispatch={dispatch} />
            </div>

            <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-extrabold text-[var(--brand-ink)] tracking-tight">
                    {initialGameSlug ? "Available Offers" : "All Offers"}
                </h2>
                {meta && !loading && (
                    <div className="text-sm font-bold text-[var(--text-secondary)] bg-[var(--surface-muted)] px-3 py-1 rounded-lg border border-[var(--border-default)]">
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
