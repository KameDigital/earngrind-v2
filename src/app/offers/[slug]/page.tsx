import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Offer } from '@/components/offers/OfferSearchEngine';
import SiteOffersComparison, { type SiteOffer } from './SiteOffersComparison';

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

interface GamePageData {
    game: GameData;
    summary: PayoutSummary;
    offers: Offer[];
    guides: GuideTeaserData[];
    guide: GuideTeaserData | null; // legacy compat
}

// ---------------------------------------------------------------
// DATA FETCHER (Server Component)
// ---------------------------------------------------------------
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

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
    const data = await getGameData(params.slug);
    if (!data) return { title: 'Game Not Found | EarnGrind' };
    const { game, summary } = data;
    return {
        title: `${game.name} Offers — Earn up to $${summary.max_payout_usd.toFixed(2)} | EarnGrind`,
        description: `Compare ${summary.offer_count} ${game.name} offer${summary.offer_count !== 1 ? 's' : ''} across platforms. Max payout: $${summary.max_payout_usd.toFixed(2)}. ${game.description ?? ''}`.trim(),
    };
}

// ---------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------
const DEVICE_LABELS: Record<string, string> = {
    ios: '🍏 iOS', android: '🤖 Android', pc: '💻 PC', web: '🌐 Web',
};

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

// ---------------------------------------------------------------
// COMPARISON TABLE ROW
// ---------------------------------------------------------------
function ComparisonRow({ offer, isBest, rank }: { offer: Offer; isBest: boolean; rank: number }) {
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
                                BEST PAYOUT
                            </span>
                        )}
                        {offer.is_ath && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--brand-lime)]/30 text-[color:hsl(84,93%,25%)]">ATH</span>}
                        {offer.is_new && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">NEW</span>}
                        {offer.is_hot && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">HOT</span>}
                        {offer.is_boosted && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">BOOSTED</span>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                        {offer.devices.map(d => (
                            <span key={d} title={d}>{DEVICE_LABELS[d]?.split(' ')[0] ?? '📱'}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Payout + CTA */}
            <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-[var(--border-default)] sm:border-0 pt-3 sm:pt-0">
                <div className="text-right">
                    <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Up to</div>
                    <div className={`text-xl font-extrabold leading-tight ${isBest ? 'text-[color:hsl(84,93%,25%)]' : 'text-[var(--brand-ink)]'}`}>
                        ${offer.payout_usd.toFixed(2)}
                    </div>
                </div>
                <a
                    href={offer.redirect_url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className={`px-4 py-2 text-sm font-extrabold rounded-xl transition-all hover:-translate-y-px active:translate-y-0 whitespace-nowrap ${isBest
                            ? 'bg-[var(--brand-ink)] text-[var(--brand-lime)] shadow-sm'
                            : 'bg-[var(--surface-muted)] text-[var(--brand-ink)] border border-[var(--border-default)] hover:border-lime-300 hover:bg-[var(--brand-lime)]/10'
                        }`}
                >
                    {isBest ? 'Start (Best)' : 'Start Offer'}
                </a>
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
async function getSiteOffers(gameId: string): Promise<SiteOffer[]> {
    const supabase = createClient();
    const { data } = await supabase
        .from('site_offers')
        .select(`
            id, payout_usd, goal_text, offer_url, status,
            site:platforms(name),
            provider:providers(name),
            tasks:site_offer_tasks(
                id, sort_order, title, reward_amount, reward_display, task_type, time_limit_text
            )
        `)
        .eq('game_id', gameId)
        .eq('status', 'active')
        .order('payout_usd', { ascending: false })
        .limit(20);
    if (!data) return [];
    return data.map((r) => ({
        ...r,
        site:     Array.isArray(r.site)     ? r.site[0]     ?? null : r.site,
        provider: Array.isArray(r.provider) ? r.provider[0] ?? null : r.provider,
        tasks:    Array.isArray(r.tasks)
                  ? [...r.tasks].sort((a, b) => a.sort_order - b.sort_order)
                  : [],
    })) as SiteOffer[];
}

// ---------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------
export default async function GameOffersPage({ params }: { params: { slug: string } }) {
    const data = await getGameData(params.slug);

    if (!data) notFound();

    const { game, summary, offers, guides } = data;

    // Fetch site-specific offer comparison rows in parallel
    const siteOfferRows = await getSiteOffers(game.id);

    // Sort by payout desc (API should already do this, but ensure)
    const sortedOffers = [...offers].sort((a, b) => b.payout_usd - a.payout_usd);
    const bestOffer = sortedOffers[0] ?? null;

    return (
        <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
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
                            {game.thumbnail_url ? (
                                <Image
                                    src={game.thumbnail_url}
                                    alt={game.name}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                    priority
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
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div className="border-t border-[var(--border-default)] px-5 sm:px-6 py-4 bg-[var(--surface-muted)]/50">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatCard label="Platforms" value={String(summary.offer_count)} />
                            <StatCard label="Best Payout" value={`$${summary.max_payout_usd.toFixed(2)}`} accent />
                            <StatCard label="Avg Payout" value={summary.avg_payout_usd > 0 ? `$${summary.avg_payout_usd.toFixed(2)}` : '—'} />
                            <StatCard label="Min Payout" value={summary.min_payout_usd > 0 ? `$${summary.min_payout_usd.toFixed(2)}` : '—'} />
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
                            <div className="flex items-center justify-between px-1 mb-3">
                                <h2 className="text-lg font-extrabold text-[var(--brand-ink)] tracking-tight">
                                    Compare Platforms
                                </h2>
                                <div className="text-sm font-bold text-[var(--text-secondary)] bg-white border border-[var(--border-default)] px-2.5 py-1 rounded-lg shadow-[var(--shadow-card)]">
                                    {sortedOffers.length} platform{sortedOffers.length !== 1 ? 's' : ''}
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
