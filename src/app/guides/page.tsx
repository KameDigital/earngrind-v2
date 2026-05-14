import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/layout/Container";
import { STATIC_GUIDES } from "@/lib/static-guides";
import { pickPublicArtworkUrl } from "@/lib/public-image-url";
import { canonicalAlternates } from "@/lib/seo-metadata";
import { GPT_SITE_GUIDES } from "@/lib/gpt-site-guides";

export const metadata: Metadata = {
    title: "Game Guides — Maximize Your Offerwall Earnings | EarnGrind",
    description: "Step-by-step guides for the most popular offerwall game tasks. Learn the fastest routes to max payout on Coin Master, Bingo Blitz, and more.",
    alternates: canonicalAlternates("/guides"),
};

const PAGE_SIZE = 18;

const PALMON_GAME_ID = "0044a577-5e22-4af3-9aac-054ccd4c0cb0";
const PALMON_GAME_SLUG = "palmon-survival";
const PALMON_HUB_IMAGE_URL = "/images/guides/palmon-survival/palmon-hero-image.jpg";
const PALMON_GUIDE_SLUGS = new Set([
    "palmon-survival-offerwall-guide",
    "palmon-survival-camp-30-guide",
    "palmon-survival-no-spend",
    "palmon-survival-not-crediting",
]);

const PALMON_GUIDE_LINKS = [
    { href: "/guides/palmon-survival-offerwall-guide", label: "Full Offerwall Guide" },
    { href: "/guides/palmon-survival-camp-30-guide", label: "Camp 30 Guide" },
    { href: "/guides/palmon-survival-no-spend", label: "No-Spend Guide" },
    { href: "/guides/palmon-survival-not-crediting", label: "Not Crediting Guide" },
];

// ---------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------
interface GuideGame {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
    fallback_image_url?: string | null;
}

interface Guide {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    difficulty: "easy" | "medium" | "hard" | null;
    estimated_time: string | null;
    max_payout_usd: number | null;
    published_at: string | null;
    games: GuideGame | null;
}

interface OfferArtworkRow {
    game_id: string | null;
    game_thumbnail: string | null;
    image_url: string | null;
}

function isSvgUrl(url: string) {
    return /\.svg(?:$|[?#])/i.test(url);
}

function getInitials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || name.substring(0, 2).toUpperCase();
}

function getGameImageUrl(game: GuideGame | null) {
    return pickPublicArtworkUrl(game?.thumbnail_url, game?.fallback_image_url);
}

// ---------------------------------------------------------------
// DIFFICULTY BADGE
// ---------------------------------------------------------------
const DIFFICULTY_STYLES: Record<string, string> = {
    easy:   "bg-green-50 text-green-700 border-green-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    hard:   "bg-red-50 text-red-700 border-red-200",
};

function DifficultyBadge({ difficulty }: { difficulty: string | null }) {
    if (!difficulty) return null;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${DIFFICULTY_STYLES[difficulty] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
            {difficulty}
        </span>
    );
}

// ---------------------------------------------------------------
// GUIDE CARD
// ---------------------------------------------------------------
function GuideCard({ guide }: { guide: Guide }) {
    const gameImageUrl = getGameImageUrl(guide.games);

    return (
        <Link
            href={`/guides/${guide.slug}`}
            className="group eg-card flex flex-col p-5 hover:-translate-y-0.5"
        >
            {guide.games && (
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--surface-muted)] border border-[var(--border-default)] flex-shrink-0 flex items-center justify-center">
                        {gameImageUrl ? (
                            <Image
                                src={gameImageUrl}
                                alt={guide.games.name}
                                width={40}
                                height={40}
                                unoptimized={isSvgUrl(gameImageUrl)}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-xs font-bold text-[var(--text-tertiary)]">{getInitials(guide.games.name)}</span>
                        )}
                    </div>
                    <span className="section-label">{guide.games.name}</span>
                </div>
            )}

            <h2 className="font-bold text-[var(--brand-ink)] group-hover:text-lime-700 transition-colors leading-snug mb-2 flex-1">
                {guide.title}
            </h2>

            {guide.excerpt && (
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-2">
                    {guide.excerpt}
                </p>
            )}

            <div className="flex items-center gap-2 flex-wrap mt-auto pt-3 border-t border-[var(--border-default)]">
                <DifficultyBadge difficulty={guide.difficulty} />
                {guide.estimated_time && (
                    <span className="text-xs text-[var(--text-tertiary)] font-medium">⏱ {guide.estimated_time}</span>
                )}
                {guide.max_payout_usd && (
                    <span className="ml-auto text-sm font-extrabold text-lime-600">
                        up to ${guide.max_payout_usd.toFixed(2)}
                    </span>
                )}
            </div>
        </Link>
    );
}

function GuideIndexCard({
    href,
    label,
    title,
    description,
    initials,
    imageUrl,
    difficulty,
    estimatedTime,
}: {
    href: string;
    label: string;
    title: string;
    description: string;
    initials: string;
    imageUrl?: string | null;
    difficulty?: "easy" | "medium" | "hard" | null;
    estimatedTime?: string | null;
}) {
    return (
        <Link
            href={href}
            className="group eg-card flex flex-col p-5 hover:-translate-y-0.5"
        >
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)]">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={label}
                            width={40}
                            height={40}
                            unoptimized={isSvgUrl(imageUrl)}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="text-xs font-bold text-[var(--text-tertiary)]">{initials}</span>
                    )}
                </div>
                <span className="section-label">{label}</span>
            </div>

            <h2 className="mb-2 flex-1 font-bold leading-snug text-[var(--brand-ink)] transition-colors group-hover:text-lime-700">
                {title}
            </h2>

            <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                {description}
            </p>

            <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[var(--border-default)] pt-3">
                <DifficultyBadge difficulty={difficulty ?? null} />
                {estimatedTime && (
                    <span className="text-xs font-medium text-[var(--text-tertiary)]">â± {estimatedTime}</span>
                )}
            </div>
        </Link>
    );
}

function PalmonGuideHub({ imageUrl }: { imageUrl: string | null }) {
    return (
        <section className="eg-card overflow-hidden p-5 sm:col-span-2 sm:p-6 lg:col-span-3">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-lime-200 bg-lime-50">
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt="Palmon: Survival"
                                width={80}
                                height={80}
                                unoptimized={isSvgUrl(imageUrl)}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg font-extrabold text-lime-700">
                                PS
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="section-label mb-2">Featured guide cluster</p>
                        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--brand-ink)]">
                            Palmon: Survival Guide Hub
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                            Best payouts, Camp 30 strategy, no-spend tips, tracking help, and current Palmon offer routes.
                        </p>
                    </div>
                </div>
                <Link
                    href={`/games/${PALMON_GAME_SLUG}`}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--brand-ink)] px-4 py-3 text-sm font-extrabold text-[var(--brand-lime)] sm:w-auto"
                >
                    Compare current Palmon payouts →
                </Link>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {PALMON_GUIDE_LINKS.map((guide) => (
                    <Link
                        key={guide.href}
                        href={guide.href}
                        className="rounded-xl border border-[var(--border-default)] bg-white px-4 py-3 text-sm font-bold text-[var(--brand-ink)] transition hover:border-lime-300 hover:bg-lime-50"
                    >
                        {guide.label}
                    </Link>
                ))}
            </div>
        </section>
    );
}

// ---------------------------------------------------------------
// PAGINATION CONTROLS
// ---------------------------------------------------------------
function Pagination({ page, totalCount, pageSize, basePath }: {
    page: number;
    totalCount: number;
    pageSize: number;
    basePath: string;
}) {
    const totalPages = Math.ceil(totalCount / pageSize);
    if (totalPages <= 1) return null;

    const pageUrl = (p: number) => p === 1 ? basePath : `${basePath}?page=${p}`;

    return (
        <nav className="flex items-center justify-center gap-1 mt-10" aria-label="Pagination">
            {page > 1 && (
                <Link href={pageUrl(page - 1)} className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all">
                    ← Prev
                </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Link
                    key={p}
                    href={pageUrl(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                        p === page
                            ? "bg-[var(--brand-ink)] text-white shadow"
                            : "text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200"
                    }`}
                >
                    {p}
                </Link>
            ))}
            {page < totalPages && (
                <Link href={pageUrl(page + 1)} className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all">
                    Next →
                </Link>
            )}
        </nav>
    );
}

// ---------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------
export default async function GuidesPage({
    searchParams,
}: {
    searchParams: { page?: string };
}) {
    const supabase  = createClient();
    const page      = Math.max(1, parseInt(searchParams.page ?? "1") || 1);
    const from      = (page - 1) * PAGE_SIZE;
    const to        = from + PAGE_SIZE - 1;

    const { data: guides, count } = await supabase
        .from("guides")
        .select("id, title, slug, excerpt, difficulty, estimated_time, max_payout_usd, published_at, games(id, name, slug, thumbnail_url)", { count: "exact" })
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(from, to);

    const rawGuides = (guides ?? []) as unknown as Guide[];
    const guideGameIds = Array.from(new Set(rawGuides.map((guide) => guide.games?.id).filter(Boolean))) as string[];

    const { data: offerArtworkRows } = guideGameIds.length > 0
        ? await supabase
            .from("unified_offers_view")
            .select("game_id, game_thumbnail, image_url")
            .in("game_id", guideGameIds)
            .order("total_payout_usd", { ascending: false })
            .limit(250)
        : { data: [] };

    const gameArtworkById = new Map<string, string>();
    for (const row of (offerArtworkRows ?? []) as OfferArtworkRow[]) {
        if (!row.game_id || gameArtworkById.has(row.game_id)) continue;

        const imageUrl = pickPublicArtworkUrl(row.game_thumbnail, row.image_url);
        if (imageUrl) {
            gameArtworkById.set(row.game_id, imageUrl);
        }
    }

    const enrichedGuides = rawGuides.map((guide) => ({
        ...guide,
        games: guide.games
            ? {
                ...guide.games,
                fallback_image_url: gameArtworkById.get(guide.games.id) ?? null,
            }
            : null,
    }));

    const shouldShowPalmonHub = page === 1 && enrichedGuides.some((guide) => PALMON_GUIDE_SLUGS.has(guide.slug));
    const visibleGuides = shouldShowPalmonHub
        ? enrichedGuides.filter((guide) => !PALMON_GUIDE_SLUGS.has(guide.slug))
        : enrichedGuides;
    const palmonHubImageUrl =
        pickPublicArtworkUrl(PALMON_HUB_IMAGE_URL) ??
        gameArtworkById.get(PALMON_GAME_ID) ??
        enrichedGuides
            .filter((guide) => PALMON_GUIDE_SLUGS.has(guide.slug))
            .map((guide) => getGameImageUrl(guide.games))
            .find(Boolean) ??
        null;
    const totalCount = count ?? 0;
    const displayedTotalCount = totalCount + STATIC_GUIDES.length + 1;

    return (
        <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
            <Container>
                <div className="mb-10">
                    <p className="section-label mb-3">Game Guides</p>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--brand-ink)] tracking-tight mb-3">
                        Game Guides
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                        Step-by-step completion guides for the best-paying offerwall games.
                        Every guide covers the fastest path to maximum payout.
                    </p>
                    {totalCount > 0 && (
                        <p className="text-sm text-[var(--text-tertiary)] mt-2">
                            {displayedTotalCount} guide{displayedTotalCount !== 1 ? "s" : ""} available
                        </p>
                    )}
                </div>

                {visibleGuides.length === 0 && !shouldShowPalmonHub && page !== 1 ? (
                    <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] p-16 text-center">
                        <div className="text-3xl mb-4">📖</div>
                        <h2 className="text-lg font-bold text-[var(--brand-ink)] mb-2">No guides published yet</h2>
                        <p className="text-[var(--text-tertiary)]">Check back soon — new guides are added weekly.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {page === 1 && (
                                <GuideIndexCard
                                    href="/guides/best-gpt-sites"
                                    label="GPT Sites"
                                    title="Best GPT Sites to Make Money in 2026: Top Reward Sites Compared"
                                    description={`Compare ${GPT_SITE_GUIDES.length} GPT sites with researched strategy, screenshots, payout notes, and safety checks before choosing where to start.`}
                                    initials="GS"
                                    imageUrl="/images/guides/gpt-sites/gain-gg.png"
                                    estimatedTime="10-20 minutes to compare"
                                />
                            )}
                            {page === 1 && STATIC_GUIDES.map((guide) => (
                                <GuideIndexCard
                                    key={guide.slug}
                                    href={guide.href}
                                    label={guide.title.includes("World of Warships") ? "World of Warships" : "FanDuel Casino"}
                                    title={guide.title}
                                    description={guide.description}
                                    initials={guide.title.includes("World of Warships") ? "WW" : "FC"}
                                    imageUrl={guide.slug === "fanduel-casino-review-bonus" ? "/images/guides/fanduel-casino/fanduel-casino-bonus-review-hero.png" : null}
                                    difficulty={guide.slug === "world-of-warships-torox-offer-guide" ? "easy" : null}
                                    estimatedTime={guide.slug === "world-of-warships-torox-offer-guide" ? "Same day for many users" : "15-25 minutes to evaluate"}
                                />
                            ))}
                            {shouldShowPalmonHub && <PalmonGuideHub imageUrl={palmonHubImageUrl} />}
                            {visibleGuides.map((guide) => (
                                <GuideCard key={guide.id} guide={guide} />
                            ))}
                        </div>
                        <Pagination
                            page={page}
                            totalCount={totalCount}
                            pageSize={PAGE_SIZE}
                            basePath="/guides"
                        />
                    </>
                )}
            </Container>
        </main>
    );
}
