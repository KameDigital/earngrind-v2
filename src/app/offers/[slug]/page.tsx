import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { buildBreadcrumbList, buildItemList, JsonLd } from '@/lib/seo-schema';
import type { Offer } from '@/components/offers/OfferSearchEngine';
import TrackedOutboundLink from '@/components/offers/TrackedOutboundLink';
import ProviderLogo from '@/components/providers/ProviderLogo';
import SiteOffersComparison, { type SiteOffer } from './SiteOffersComparison';
import { formatPayoutFreshness } from '@/lib/payout-freshness';
import { absoluteUrl, getSiteUrl } from '@/lib/site-url';
import { robotsForIndexability, noindexFollowRobots } from '@/lib/seo-metadata';
import { EarnLabCountryOffersPage } from '@/components/offers/EarnLabCountryOffersPage';
import { getEarnLabCountryName, isSupportedEarnLabCountry, normalizeEarnLabCountryCode } from '@/lib/earnlab-gallery';
import { pickPublicArtworkUrl } from '@/lib/public-image-url';

// ---------------------------------------------------------------
// TYPES — mirrors /api/offers/game/[slug] response
// ---------------------------------------------------------------
interface GameData {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
    devices: string[] | null;
    category: string | null;
    description: string | null;
}

interface PayoutSummary {
    offer_count: number;
    max_payout_usd: number;
    avg_payout_usd: number;
    min_payout_usd: number;
}

interface GuideTeaserData {
    id: string;
    title: string;
    slug: string;
    estimated_time: string | null;
    max_payout_usd: number | null;
    difficulty: string | null;
    tips: string[];
    body_md: string | null;
}

interface ComparisonTask {
    id: string;
    sort_order: number;
    title: string;
    reward_amount: number;
    reward_display: string | null;
    task_type: string;
    time_limit_text: string | null;
}

interface ComparisonOfferRow {
    id: string;
    provider_name: string | null;
    platform_name: string | null;
    payout_usd: number;
    total_payout_usd: number;
    task_count: number;
    image_url: string | null;
    redirect_url: string;
    offer_url: string | null;
    status: string;
    goal_text: string | null;
    updated_at: string | null;
    tasks: ComparisonTask[];
}

interface ComparisonSummary {
    provider_count: number;
    best_single_payout_usd: number;
    best_total_payout_usd: number;
}

interface GamePageData {
    game: GameData;
    summary: PayoutSummary;
    offers: Offer[];
    comparison: {
        sort: string;
        offers: ComparisonOfferRow[];
        summary: ComparisonSummary;
    };
    guides: GuideTeaserData[];
    guide: GuideTeaserData | null; // legacy compat
}

interface RelatedReview {
    id: string;
    slug: string;
    title: string;
    platform_id: string | null;
    platforms: {
        name: string;
    } | {
        name: string;
    }[] | null;
}

// ---------------------------------------------------------------
// DATA FETCHER (Server Component)
// ---------------------------------------------------------------
const BASE_URL = getSiteUrl();

async function getGameData(slug: string): Promise<GamePageData | null> {
    try {
        const res = await fetch(`${BASE_URL}/api/offers/game/${slug}`, {
            next: { revalidate: 120 },
        });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Failed to fetch game data: ${res.status}`);
        return res.json();
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------
// METADATA
// ---------------------------------------------------------------
export async function generateMetadata(
    { params }: { params: { slug: string } }
): Promise<Metadata> {
    const countryCode = normalizeEarnLabCountryCode(params.slug);
    if (countryCode && isSupportedEarnLabCountry(countryCode)) {
        const countryName = getEarnLabCountryName(countryCode);
        const canonical = absoluteUrl(`/offers/${countryCode.toLowerCase()}`);
        return {
            title: `Best EarnLab Offers in ${countryName} | EarnGrind`,
            description: `Browse the best EarnLab tasks and game offers available in ${countryName}. Compare rewards, requirements, and start high-paying offers.`,
            alternates: {
                canonical,
            },
            robots: robotsForIndexability(true),
            openGraph: {
                title: `Best EarnLab Offers in ${countryName} | EarnGrind`,
                description: `Compare EarnLab rewards, task requirements, and available app offers for ${countryName}.`,
                url: canonical,
            },
        };
    }

    const data = await getGameData(params.slug);
    if (!data) {
        return {
            title: 'Game Not Found | EarnGrind',
            robots: noindexFollowRobots(),
        };
    }
    const { game, summary } = data;
    const canonical = absoluteUrl(`/offers/${params.slug}`);
    const indexable = summary.offer_count > 0;
    return {
        title: `${game.name} Offers: Payouts and Provider Routes | EarnGrind`,
        description: `Compare ${summary.offer_count} ${game.name} offer${summary.offer_count !== 1 ? 's' : ''} across platforms. Max payout: $${summary.max_payout_usd.toFixed(2)}. ${game.description ?? ''}`.trim(),
        alternates: {
            canonical,
        },
        robots: robotsForIndexability(indexable),
        openGraph: {
            title: `${game.name} Offers | EarnGrind`,
            description: `Compare current ${game.name} payouts and routes across GPT platforms before clicking out.`,
            url: canonical,
        },
    };
}

// ---------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------
const DEVICE_LABELS: Record<string, string> = {
    ios: '🍏 iOS', android: '🤖 Android', pc: '💻 PC', web: '🌐 Web',
};

const isImageUrl = (url?: string | null) =>
    typeof url === "string" &&
    /\.(jpg|jpeg|png|webp|gif|avif|svg)(?:$|[?#])/i.test(url);

// ---------------------------------------------------------------
// DIFFICULTY BADGE COLORS
// ---------------------------------------------------------------
const DIFFICULTY_STYLES: Record<string, string> = {
    easy:   "bg-green-100 text-green-700 border-green-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    hard:   "bg-red-100 text-red-700 border-red-200",
};

// ---------------------------------------------------------------
// GUIDES SECTION (multi-guide cards)
// ---------------------------------------------------------------
function GuidesSection({ guides }: { guides: GuideTeaserData[] }) {
    if (guides.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-extrabold text-[var(--brand-ink)] tracking-tight">
                    📖 Completion Guides
                </h2>
                <span className="text-xs font-bold text-[var(--text-tertiary)] bg-white border border-[var(--border-default)] px-2.5 py-1 rounded-lg shadow-[var(--shadow-card)]">
                    {guides.length} guide{guides.length !== 1 ? 's' : ''}
                </span>
            </div>

            {guides.map((guide) => {
                const tipCount = (guide.tips ?? []).length;
                // Extract a 1–2 sentence snippet from the body if available
                const snippet = guide.body_md
                    ? guide.body_md.replace(/^#+\s+.+$/gm, '').replace(/[*_`#\[\]]/g, '').trim().slice(0, 140)
                    : null;

                return (
                    <Link
                        key={guide.id}
                        href={`/guides/${guide.slug}`}
                        className="group block bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] overflow-hidden hover:border-[var(--brand-lime)] hover:shadow-md transition-all"
                    >
                        {/* Top strip */}
                        <div className="bg-[var(--brand-lime)]/10 border-b border-[var(--brand-lime)]/20 px-5 py-3 flex items-center justify-between gap-3">
                            <div className="text-xs font-extrabold uppercase tracking-wider text-[color:hsl(84,93%,30%)]">
                                📖 Strategy Guide
                            </div>
                            <div className="flex items-center gap-2">
                                {guide.difficulty && (
                                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${DIFFICULTY_STYLES[guide.difficulty] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                        {guide.difficulty}
                                    </span>
                                )}
                                {guide.max_payout_usd && (
                                    <span className="text-[10px] font-extrabold text-[color:hsl(84,93%,25%)] bg-[var(--brand-lime)]/20 border border-[var(--brand-lime)]/30 px-2 py-0.5 rounded">
                                        Up to ${guide.max_payout_usd.toFixed(2)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-5 py-4 flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-[var(--brand-ink)] group-hover:text-lime-700 transition-colors leading-snug mb-1">
                                    {guide.title}
                                </div>
                                {snippet && (
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                                        {snippet}{snippet.length === 140 ? '…' : ''}
                                    </p>
                                )}
                                <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-tertiary)]">
                                    {guide.estimated_time && (
                                        <span>⏱ {guide.estimated_time}</span>
                                    )}
                                    {tipCount > 0 && (
                                        <span>💡 {tipCount} tip{tipCount !== 1 ? 's' : ''}</span>
                                    )}
                                </div>
                            </div>

                            <span className="flex-shrink-0 px-4 py-2 bg-[var(--brand-ink)] group-hover:bg-[var(--brand-ink)]/90 text-[var(--brand-lime)] text-sm font-extrabold rounded-xl transition-colors whitespace-nowrap self-center">
                                View Guide →
                            </span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

// ---------------------------------------------------------------
// LEGACY single-guide teaser (kept for GuideTeaser usage if needed)
// ---------------------------------------------------------------
function GuideTeaser({ guide }: { guide: GuideTeaserData }) {
    return (
        <div className="bg-[var(--brand-lime)]/10 border border-[var(--brand-lime)]/30 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[color:hsl(84,93%,30%)] mb-1">📖 Strategy Guide</div>
                <div className="font-semibold text-[var(--brand-ink)]">{guide.title}</div>
                {guide.estimated_time && (
                    <div className="text-sm text-[var(--text-secondary)] mt-0.5">⏱ Est. {guide.estimated_time}</div>
                )}
            </div>
            <Link
                href={`/guides/${guide.slug}`}
                className="flex-shrink-0 px-4 py-2 bg-[var(--brand-ink)] hover:bg-[var(--brand-ink)]/90 text-[var(--brand-lime)] text-sm font-extrabold rounded-xl transition-colors whitespace-nowrap"
            >
                View Guide →
            </Link>
        </div>
    );
}

// ---------------------------------------------------------------
// PLATFORM COMPARISON SUMMARY CARD
// ---------------------------------------------------------------
function ComparisonSummaryCard({ offers }: { offers: Offer[] }) {
    if (offers.length === 0) return null;

    const best = offers[0];
    const second = offers[1] ?? null;
    const spread = second ? best.payout_usd - second.payout_usd : null;
    const platformCount = new Set(offers.map(o => o.platform.id)).size;

    return (
        <div className="bg-[var(--brand-ink)] rounded-2xl p-5 sm:p-6 text-white">
            <div className="text-xs font-extrabold uppercase tracking-widest text-[var(--brand-lime)] mb-4">
                Platform Comparison
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                {/* Best platform block */}
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">
                        Best Platform
                    </div>
                    <div className="flex items-center gap-3">
                        {best.platform.logo_url ? (
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 border border-white/20 flex-shrink-0">
                                <Image
                                    src={best.platform.logo_url}
                                    alt={best.platform.name}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-white/60 uppercase">{best.platform.name.substring(0, 2)}</span>
                            </div>
                        )}
                        <div>
                            <div className="font-extrabold text-white text-base leading-tight">{best.platform.name}</div>
                            <div className="text-[var(--brand-lime)] font-extrabold text-2xl leading-tight">
                                ${best.payout_usd.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 sm:gap-6 flex-wrap">
                    <div className="text-center">
                        <div className="text-2xl font-extrabold text-white leading-none">{platformCount}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-0.5">
                            Platform{platformCount !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {spread !== null && spread > 0 && (
                        <div className="text-center">
                            <div className="text-2xl font-extrabold text-[var(--brand-lime)] leading-none">+${spread.toFixed(2)}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-0.5">vs Next Best</div>
                        </div>
                    )}

                    {spread !== null && (
                        <div className="text-center">
                            <div className="text-2xl font-extrabold text-white leading-none">${second!.payout_usd.toFixed(2)}</div>
                            <div className="text-xs font-bold text-white/40 mt-0.5 truncate max-w-[80px]">{second!.platform.name}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Payout bar visualization */}
            {offers.length > 1 && (
                <div className="mt-5 space-y-2">
                    {offers.map((o, i) => {
                        const pct = best.payout_usd > 0 ? (o.payout_usd / best.payout_usd) * 100 : 0;
                        return (
                            <div key={o.id} className="flex items-center gap-3">
                                <div className="text-xs font-semibold text-white/60 w-20 truncate flex-shrink-0">
                                    {o.platform.name}
                                </div>
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${i === 0 ? 'bg-[var(--brand-lime)]' : 'bg-white/30'}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <div className={`text-xs font-extrabold flex-shrink-0 w-14 text-right ${i === 0 ? 'text-[var(--brand-lime)]' : 'text-white/60'}`}>
                                    ${o.payout_usd.toFixed(2)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function ComparisonStatsBar({
    providerCount,
    offerRowCount,
    bestSinglePayoutUsd,
    bestTotalPayoutUsd,
}: {
    providerCount: number;
    offerRowCount: number;
    bestSinglePayoutUsd: number;
    bestTotalPayoutUsd: number;
}) {
    return (
        <div className="border-t border-[var(--border-default)] px-5 sm:px-6 py-4 bg-[var(--surface-muted)]/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Sites" value={String(providerCount)} />
                <StatCard label="Best Single" value={bestSinglePayoutUsd > 0 ? `$${bestSinglePayoutUsd.toFixed(2)}` : '—'} />
                <StatCard label="Best Total" value={bestTotalPayoutUsd > 0 ? `$${bestTotalPayoutUsd.toFixed(2)}` : '—'} accent />
                <StatCard label="Offer Rows" value={String(offerRowCount)} />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------
// COMPARISON TABLE ROW
// ---------------------------------------------------------------
function ComparisonRow({ offer, isBest, rank }: { offer: Offer; isBest: boolean; rank: number }) {
    const providerLabel = offer.provider_name ?? offer.platform.name;
    const routeSummary =
        offer.goal_text ??
        `Open ${offer.platform.name} to view the current payout route for ${offer.game?.name ?? offer.title}.`;

    return (
        <div className={`
            relative flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-4
            border-b border-[var(--border-default)] last:border-0
            transition-colors
            ${isBest
                ? 'bg-[var(--brand-lime)]/5 border-l-[3px] !border-l-[var(--brand-lime)]'
                : 'hover:bg-[var(--surface-muted)]'
            }
        `}>
            {/* Rank number */}
            <div className={`hidden sm:flex flex-shrink-0 w-6 h-6 rounded-full items-center justify-center text-[10px] font-extrabold
                ${isBest
                    ? 'bg-[var(--brand-lime)] text-[var(--brand-ink)]'
                    : 'bg-[var(--surface-muted)] text-[var(--text-tertiary)]'
                }`}>
                {rank}
            </div>

            {/* Platform info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-[var(--surface-muted)] border border-[var(--border-default)] flex items-center justify-center">
                    {offer.platform.logo_url ? (
                        <Image
                            src={offer.platform.logo_url}
                            alt={offer.platform.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-[10px] font-extrabold text-[var(--text-tertiary)] uppercase">
                            {offer.platform.name.substring(0, 2)}
                        </span>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-bold text-[var(--brand-ink)] text-sm">{offer.platform.name}</span>
                        {isBest && (
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[var(--brand-lime)] text-[var(--brand-ink)]">
                                BEST ROUTE
                            </span>
                        )}
                        {offer.is_ath && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--brand-lime)]/30 text-[color:hsl(84,93%,25%)]">ATH</span>}
                        {offer.is_new && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">NEW</span>}
                        {offer.is_hot && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">HOT</span>}
                        {offer.is_boosted && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">BOOSTED</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--text-tertiary)]">
                        <ProviderLogo name={providerLabel} compact className="h-8" />
                        <span className="font-semibold">{providerLabel}</span>
                        <span>?</span>
                        {offer.devices.map((device) => (
                            <span key={device} title={device}>{DEVICE_LABELS[device]?.split(' ')[0] ?? '??'}</span>
                        ))}
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">
                        {routeSummary}
                    </p>
                </div>
            </div>

            {/* Payout + CTA */}
            <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-[var(--border-default)] sm:border-0 pt-3 sm:pt-0">
                <div className="text-right">
                    <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                        {isBest ? 'Best now' : 'Current payout'}
                    </div>
                    <div className={`text-xl font-extrabold leading-tight ${isBest ? 'text-[color:hsl(84,93%,25%)]' : 'text-[var(--brand-ink)]'}`}>
                        ${offer.payout_usd.toFixed(2)}
                    </div>
                </div>
                <TrackedOutboundLink
                    href={offer.redirect_url ?? "#"}
                    eventLabel="platform-comparison-cta"
                    offerId={offer.id}
                    offerTitle={offer.game?.name ?? offer.title}
                    gameTitle={offer.game?.name ?? undefined}
                    platformName={offer.platform?.name}
                    providerName={offer.provider_name}
                    payoutUsd={offer.payout_usd}
                    location="platform-comparison"
                    sourceContext="offer-detail"
                    className={`px-4 py-2 text-sm font-extrabold rounded-xl transition-all hover:-translate-y-px active:translate-y-0 whitespace-nowrap ${isBest
                            ? 'bg-[var(--brand-ink)] text-[var(--brand-lime)] shadow-sm'
                            : 'bg-[var(--surface-muted)] text-[var(--brand-ink)] border border-[var(--border-default)] hover:border-lime-300 hover:bg-[var(--brand-lime)]/10'
                        }`}
                >
                    {isBest ? 'Start Best Payout' : 'Start Offer'}
                </TrackedOutboundLink>
            </div>
            <div className="mt-2 text-[11px] text-[var(--text-tertiary)] sm:pl-9">
                Payouts can change by device, country, and provider rules. Some outbound links may be affiliate links.
            </div>
        </div>
    );
}

// ---------------------------------------------------------------
// STAT CARD
// ---------------------------------------------------------------
function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className={`flex flex-col items-center justify-center rounded-2xl border px-4 py-4 min-w-0 ${accent
                ? 'bg-[var(--brand-lime)]/10 border-[var(--brand-lime)]/30'
                : 'bg-white border-[var(--border-default)] shadow-[var(--shadow-card)]'
            }`}>
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">{label}</div>
            <div className={`text-xl font-extrabold ${accent ? 'text-[color:hsl(84,93%,25%)]' : 'text-[var(--brand-ink)]'}`}>{value}</div>
        </div>
    );
}

// ---------------------------------------------------------------
// SITE OFFERS DATA FETCH (server-component)
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------
export default async function GameOffersPage({
    params,
    searchParams,
}: {
    params: { slug: string };
    searchParams?: { sort?: string };
}) {
    const countryCode = normalizeEarnLabCountryCode(params.slug);
    if (countryCode && isSupportedEarnLabCountry(countryCode)) {
        return <EarnLabCountryOffersPage countryCode={countryCode} sort={searchParams?.sort} />;
    }

    const data = await getGameData(params.slug);

    if (!data) notFound();

    const { game, summary, offers, guides, comparison } = data;
    const supabase = createClient();
    const siteOfferRows: SiteOffer[] = comparison.offers.map((row) => ({
        id: row.id,
        payout_usd: row.payout_usd,
        total_payout_usd: row.total_payout_usd,
        goal_text: row.goal_text,
        offer_url: row.offer_url,
        status: row.status,
        updated_at: row.updated_at,
        site: row.platform_name ? { name: row.platform_name } : null,
        provider: row.provider_name ? { name: row.provider_name } : null,
        tasks: row.tasks,
    }));

    // Sort by payout desc (API should already do this, but ensure)
    const sortedOffers = [...offers].sort((a, b) => b.payout_usd - a.payout_usd);
    const bestOffer = sortedOffers[0] ?? null;
    const primaryGuide = guides[0] ?? null;
    const relatedPlatformIds = Array.from(new Set(sortedOffers.map((offer) => offer.platform?.id).filter(Boolean)));
    const { data: rawReviews } = relatedPlatformIds.length > 0
        ? await supabase
            .from("reviews")
            .select("id, slug, title, platform_id, platforms:platform_id(name)")
            .eq("status", "published")
            .in("platform_id", relatedPlatformIds)
            .limit(4)
        : { data: [] as RelatedReview[] };
    const relatedReviews = ((rawReviews ?? []) as RelatedReview[]).map((review) => ({
        ...review,
        platforms: Array.isArray(review.platforms) ? review.platforms[0] ?? null : review.platforms,
    }));
    const bestReview =
        (bestOffer ? relatedReviews.find((review) => review.platform_id === bestOffer.platform?.id) : null) ??
        relatedReviews[0] ??
        null;

    const heroImageUrl = pickPublicArtworkUrl(
        game.thumbnail_url,
        sortedOffers.find((offer) => offer.image_url)?.image_url ?? null,
        comparison.offers.find((offer) => offer.image_url)?.image_url ?? null,
    );
    const schemas = [
        buildBreadcrumbList([
            { name: "Home", path: "/" },
            { name: "Offers", path: "/offers" },
            { name: game.name, path: `/offers/${game.slug}` },
        ]),
        buildItemList(
            comparison.offers.slice(0, 20).map((offer) => ({
                name: `${offer.provider_name ?? "Provider"} on ${offer.platform_name ?? "Platform"}`,
                path: `/offers/${game.slug}`,
                description: `${offer.total_payout_usd > 0 ? `$${offer.total_payout_usd.toFixed(2)}` : `$${offer.payout_usd.toFixed(2)}`} total payout for ${game.name}.`,
            })),
        ),
    ];

    return (
        <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
            <JsonLd data={schemas} />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* ── Breadcrumb ── */}
                <nav className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] font-medium" aria-label="Breadcrumb">
                    <Link href="/offers" className="hover:text-lime-700 transition-colors">Offers</Link>
                    <span>/</span>
                    <span className="text-[var(--text-secondary)] truncate">{game.name}</span>
                </nav>

                {/* ── Game Hero ── */}
                <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] overflow-hidden">
                    <div className="flex flex-col sm:flex-row gap-5 p-5 sm:p-6">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[var(--surface-muted)] border border-[var(--border-default)] flex items-center justify-center">
                            {heroImageUrl ? (
                                <img
                                    src={heroImageUrl}
                                    alt={game.name}
                                    className="w-full h-full object-cover"
                                    loading="eager"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <span className="text-2xl font-black text-[var(--text-tertiary)]">
                                    {game.name.substring(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>

                        {/* Game info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start gap-2 mb-2">
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--brand-ink)] tracking-tight">
                                    {game.name}
                                </h1>
                                {game.category && (
                                    <span className="mt-1 px-2.5 py-0.5 bg-[var(--surface-muted)] text-[var(--text-secondary)] text-xs font-semibold rounded-full border border-[var(--border-default)]">
                                        {game.category}
                                    </span>
                                )}
                            </div>

                            {game.description && (
                                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-3 max-w-2xl">
                                    {game.description}
                                </p>
                            )}

                            {game.devices && game.devices.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {game.devices.map((d: string) => (
                                        <span key={d} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] bg-[var(--surface-muted)] border border-[var(--border-default)] rounded-lg px-2.5 py-1">
                                            {DEVICE_LABELS[d] ?? d}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4 flex flex-wrap gap-2">
                                {bestOffer && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-lime)]/30 bg-[var(--brand-lime)]/10 px-3 py-1.5 text-xs font-bold text-[color:hsl(84,93%,25%)]">
                                        Best route now: {bestOffer.platform.name} at ${bestOffer.payout_usd.toFixed(2)}
                                    </span>
                                )}
                                {primaryGuide && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)]">
                                        Guide available
                                    </span>
                                )}
                                {bestReview && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)]">
                                        Reviewed platform
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3">
                                {bestOffer?.redirect_url && (
                                    <TrackedOutboundLink
                                        href={bestOffer.redirect_url}
                                        eventLabel="offer-detail-best-route-cta"
                                        offerId={bestOffer.id}
                                        offerTitle={game.name}
                                        gameTitle={game.name}
                                        platformName={bestOffer.platform?.name}
                                        providerName={bestOffer.provider_name}
                                        payoutUsd={bestOffer.payout_usd}
                                        location="offer-detail-hero"
                                        sourceContext="offer-detail"
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--brand-ink)] hover:bg-[var(--brand-ink)]/90 text-[var(--brand-lime)] text-sm font-extrabold rounded-xl transition-all hover:-translate-y-px"
                                    >
                                        Start Best Payout
                                    </TrackedOutboundLink>
                                )}
                                {primaryGuide && (
                                    <Link
                                        href={`/guides/${primaryGuide.slug}`}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--brand-lime)]/10 border border-[var(--brand-lime)]/20 hover:bg-[var(--brand-lime)]/15 text-[color:hsl(84,93%,25%)] text-sm font-extrabold rounded-xl transition-colors"
                                    >
                                        Use Guide First
                                    </Link>
                                )}
                                <Link
                                    href={`/games/${game.slug}`}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[var(--border-default)] hover:border-lime-300 hover:bg-[var(--brand-lime)]/10 text-[var(--brand-ink)] text-sm font-bold rounded-xl transition-colors"
                                >
                                    View Game Page
                                </Link>
                                {bestReview && (
                                    <Link
                                        href={`/review/${bestReview.slug}`}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[var(--border-default)] hover:border-lime-300 hover:bg-[var(--brand-lime)]/10 text-[var(--brand-ink)] text-sm font-bold rounded-xl transition-colors"
                                    >
                                        Read Platform Review
                                    </Link>
                                )}
                            </div>

                            <p className="mt-3 text-xs text-[var(--text-tertiary)] leading-relaxed max-w-2xl">
                                {bestOffer ? `${formatPayoutFreshness(bestOffer.updated_at)}. ` : ""}Start Best Payout sends you through EarnGrind tracking to the payout platform. Payouts can vary by device, country, and provider rules. Some links may be affiliate links.
                            </p>
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div className="border-t border-[var(--border-default)] px-5 sm:px-6 py-4 bg-[var(--surface-muted)]/50">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatCard label="Routes" value={String(comparison.offers.length)} />
                            <StatCard label="Best Route" value={comparison.summary.best_total_payout_usd > 0 ? `$${comparison.summary.best_total_payout_usd.toFixed(2)}` : "-"} accent />
                            <StatCard label="Average" value={summary.avg_payout_usd > 0 ? `$${summary.avg_payout_usd.toFixed(2)}` : "-"} />
                            <StatCard label="Guides" value={String(guides.length)} />
                        </div>
                    </div>
                </div>

                {/* ── Guides Section ── */}
                <GuidesSection guides={guides ?? []} />

                {/* ── GPT Site Comparison (site_offers) ── */}
                {siteOfferRows.length > 0 && (
                    <SiteOffersComparison rows={siteOfferRows} />
                )}

                {/* ── Comparison Engine ── */}
                {sortedOffers.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] p-16 text-center">
                        <div className="w-16 h-16 bg-[var(--surface-muted)] rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                            🔍
                        </div>
                        <h3 className="text-lg font-bold text-[var(--brand-ink)] mb-2">No active offers</h3>
                        <p className="text-[var(--text-secondary)] max-w-sm mx-auto">
                            There are no active offers for {game.name} right now. Check back soon or{' '}
                            <Link href="/offers" className="text-lime-700 hover:underline font-semibold">
                                browse all offers
                            </Link>.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Platform Comparison Summary Card */}
                        {bestOffer && <ComparisonSummaryCard offers={sortedOffers} />}

                        {/* Comparison Table */}
                        <div>
                            <div className="flex items-center justify-between px-1 mb-3 gap-4">
                                <div>
                                    <h2 className="text-lg font-extrabold text-[var(--brand-ink)] tracking-tight">
                                        Compare Platforms
                                    </h2>
                                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                                        Check the payout spread, choose the strongest route, then click outbound only after you know which platform gives you the best return.
                                    </p>
                                </div>
                                <div className="text-sm font-bold text-[var(--text-secondary)] bg-white border border-[var(--border-default)] px-2.5 py-1 rounded-lg shadow-[var(--shadow-card)] whitespace-nowrap">
                                    {sortedOffers.length} platform{sortedOffers.length !== 1 ? "s" : ""}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] overflow-hidden">
                                {/* Table header (desktop only) */}
                                <div className="hidden sm:grid grid-cols-[28px_1fr_auto] gap-3 items-center px-5 py-2.5 bg-[var(--surface-muted)] border-b border-[var(--border-default)]">
                                    <div />
                                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-tertiary)]">Platform</div>
                                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-tertiary)] text-right pr-2">Payout &amp; Action</div>
                                </div>

                                {sortedOffers.map((offer, i) => (
                                    <ComparisonRow
                                        key={offer.id}
                                        offer={offer}
                                        isBest={i === 0}
                                        rank={i + 1}
                                    />
                                ))}
                            </div>

                            {/* Single offer note */}
                            {sortedOffers.length === 1 && (
                                <p className="text-xs text-[var(--text-tertiary)] text-center mt-3">
                                    Only one platform currently offers this game. Check back as more are added.
                                </p>
                            )}
                        </div>
                    </>
                )}

                {bestOffer?.redirect_url && (
                    <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
                                    Best available route
                                </div>
                                <h2 className="text-xl font-extrabold text-[var(--brand-ink)]">
                                    Start the best available payout
                                </h2>
                                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                                    {bestOffer.platform.name} is currently showing ${bestOffer.payout_usd.toFixed(2)} for {game.name}.
                                </p>
                            </div>
                            <TrackedOutboundLink
                                href={bestOffer.redirect_url}
                                eventLabel="offer-detail-bottom-recap-cta"
                                offerId={bestOffer.id}
                                offerTitle={game.name}
                                gameTitle={game.name}
                                platformName={bestOffer.platform?.name}
                                providerName={bestOffer.provider_name}
                                payoutUsd={bestOffer.payout_usd}
                                location="offer_detail_bottom_recap"
                                sourceContext="offer_detail"
                                className="inline-flex justify-center rounded-xl bg-[var(--brand-ink)] px-4 py-2.5 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
                            >
                                Start the best available payout
                            </TrackedOutboundLink>
                        </div>
                    </div>
                )}

                {/* ── Back link ── */}
                <div className="px-1">
                    <Link
                        href="/offers"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-lime-700 transition-colors"
                    >
                        ← Back to all offers
                    </Link>
                </div>

            </div>
        </main>
    );
}
