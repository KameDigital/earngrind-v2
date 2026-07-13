import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/layout/Container";
import { STATIC_GUIDES } from "@/lib/static-guides";
import { pickPublicArtworkUrl } from "@/lib/public-image-url";
import { canonicalAlternates } from "@/lib/seo-metadata";
import { PUBLIC_GUIDE_TYPES, shouldShowOnGameGuidesIndex } from "@/lib/content-routing";

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

const GUIDE_HUB_LINKS = [
    {
        href: "/guides/how-to-earn",
        label: "How-to-earn guides",
        description: "Generated game pages with live payout breakdowns and milestone context.",
    },
    {
        href: "/guides/best-gpt-sites",
        label: "GPT site guides",
        description: "Platform-specific guides for trust checks, cashout rules, and first-route strategy.",
    },
    {
        href: "/best-gpt-sites",
        label: "Best GPT sites",
        description: "Ranked comparison hub for choosing a platform before starting a game offer.",
    },
    {
        href: "/best-gpt-sites#platform-reviews",
        label: "Platform reviews",
        description: "Review index for payout, UX, and trust summaries across rewards platforms.",
    },
];

const GUIDE_EXPLAINER_CARDS = [
    {
        title: "What these guides cover",
        description: "Each guide focuses on the actual offer path: required milestones, tracking risk, screenshots to keep, and the payout ceiling visible from current or researched routes.",
    },
    {
        title: "How payouts work",
        description: "GPT platforms and offerwalls set the reward, eligibility, and approval rules. EarnGrind compares those routes so you can choose the best platform before installing.",
    },
    {
        title: "Common mistakes",
        description: "Starting from the wrong country page, switching devices, skipping screenshot proof, missing timed milestones, or chasing a high payout with poor hourly value can all lower expected earnings.",
    },
];

const GUIDE_DECISION_CARDS = [
    {
        title: "Which offers are easiest?",
        description: "Easier offers usually have early milestones, lower level targets, clear tracking, and purchase dependency. Check each guide's difficulty, completion time, and no-spend notes before starting.",
    },
    {
        title: "Which offers pay the most?",
        description: "The highest headline payouts often require late-game progression or extreme playtimes. Compare them with the expected hourly value and the chance of finishing inside the deadline.",
    },
    {
        title: "Can you finish without spending?",
        description: "Some games are realistic no-spend routes, while others are only worth considering with a capped budget. Use the guide's task breakdown before committing time or money.",
    },
    {
        title: "Where should beginners start?",
        description: "Start with guides that show short deadlines, simple tasks, and multiple GPT site routes. Then compare alternatives in the offer search hub before clicking out.",
    },
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
    guide_type: string | null;
    games: GuideGame | null;
}

interface OfferArtworkRow {
    game_id: string | null;
    game_thumbnail: string | null;
    image_url: string | null;
}

interface StaticGuideGameRow {
    id: string;
    slug: string;
    thumbnail_url: string | null;
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
    easy:   "bg-lime-400 text-slate-950 border-lime-400",
    medium: "bg-amber-400 text-slate-950 border-amber-400",
    hard:   "bg-pink-500 text-white border-pink-500",
};

function DifficultyBadge({ difficulty }: { difficulty: string | null }) {
    if (!difficulty) return null;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] border ${DIFFICULTY_STYLES[difficulty] ?? "bg-slate-900 text-white border-slate-900"}`}>
            {difficulty}
        </span>
    );
}

function GuideArtwork({
    imageUrl,
    alt,
    initials,
}: {
    imageUrl?: string | null;
    alt: string;
    initials: string;
}) {
    return (
        <div className="relative aspect-[16/8.5] overflow-hidden bg-slate-950">
            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={alt}
                    fill
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                    unoptimized={isSvgUrl(imageUrl)}
                    className="object-cover transition duration-500 group-hover:scale-105"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(132,204,22,0.32),transparent_35%),linear-gradient(135deg,#020617,#111827)] text-3xl font-black tracking-[0.22em] text-white">
                    {initials}
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent" />
        </div>
    );
}

// ---------------------------------------------------------------
// GUIDE CARD
// ---------------------------------------------------------------
function GuideCard({ guide }: { guide: Guide }) {
    const gameImageUrl = getGameImageUrl(guide.games);
    const gameName = guide.games?.name ?? "Game guide";
    const initials = guide.games ? getInitials(guide.games.name) : "GG";

    return (
        <Link
            href={`/guides/${guide.slug}`}
            className="group flex min-h-full flex-col overflow-hidden border border-[var(--border-default)] bg-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-lime-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
        >
            <div className="relative">
                <GuideArtwork imageUrl={gameImageUrl} alt={gameName} initials={initials} />
                <div className="absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-2">
                    <span className="truncate bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                        {gameName}
                    </span>
                    <DifficultyBadge difficulty={guide.difficulty} />
                </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
                <h2 className="text-base font-black uppercase leading-tight tracking-[-0.03em] text-[var(--brand-ink)] transition-colors group-hover:text-lime-700">
                    {guide.title}
                </h2>

            {guide.excerpt && (
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {guide.excerpt}
                </p>
            )}

            <div className="mt-auto flex items-center gap-3 border-t border-[var(--border-default)] pt-3 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                {guide.estimated_time && (
                    <span>{guide.estimated_time}</span>
                )}
                {guide.max_payout_usd && (
                    <span className="ml-auto text-lime-700">
                        up to ${guide.max_payout_usd.toFixed(2)}
                    </span>
                )}
            </div>
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
    maxPayoutUsd,
}: {
    href: string;
    label: string;
    title: string;
    description: string;
    initials: string;
    imageUrl?: string | null;
    difficulty?: "easy" | "medium" | "hard" | null;
    estimatedTime?: string | null;
    maxPayoutUsd?: number | null;
}) {
    return (
        <Link
            href={href}
            className="group flex min-h-full flex-col overflow-hidden border border-[var(--border-default)] bg-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-lime-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
        >
            <div className="relative">
                <GuideArtwork imageUrl={imageUrl} alt={label} initials={initials} />
                <div className="absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-2">
                    <span className="truncate bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                        {label}
                    </span>
                    <DifficultyBadge difficulty={difficulty ?? null} />
                </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
                <h2 className="text-base font-black uppercase leading-tight tracking-[-0.03em] text-[var(--brand-ink)] transition-colors group-hover:text-lime-700">
                    {title}
                </h2>

            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                {description}
            </p>

            <div className="mt-auto flex items-center gap-3 border-t border-[var(--border-default)] pt-3 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                {estimatedTime && (
                    <span>{estimatedTime}</span>
                )}
                {maxPayoutUsd != null && (
                    <span className="ml-auto text-lime-700">
                        up to ${maxPayoutUsd.toFixed(2)}
                    </span>
                )}
            </div>
            </div>
        </Link>
    );
}

function PalmonGuideHub({ imageUrl }: { imageUrl: string | null }) {
    return (
        <section className="overflow-hidden border border-slate-800 bg-slate-950 p-5 text-white shadow-[0_22px_60px_rgba(2,6,23,0.24)] sm:col-span-2 sm:p-6 lg:col-span-3">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden border border-lime-400/30 bg-lime-400/10">
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
                            <div className="flex h-full w-full items-center justify-center text-lg font-extrabold text-lime-300">
                                PS
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">Featured guide cluster</p>
                        <h2 className="text-2xl font-black uppercase tracking-[-0.04em] text-white">
                            Palmon: Survival Guide Hub
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                            Best payouts, Camp 30 strategy, no-spend tips, tracking help, and current Palmon offer routes.
                        </p>
                    </div>
                </div>
                <Link
                    href={`/games/${PALMON_GAME_SLUG}`}
                    className="inline-flex w-full items-center justify-center bg-[var(--brand-lime)] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-950 transition hover:bg-lime-300 sm:w-auto"
                >
                    Compare current Palmon payouts →
                </Link>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {PALMON_GUIDE_LINKS.map((guide) => (
                    <Link
                        key={guide.href}
                        href={guide.href}
                        className="border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-bold text-slate-200 transition hover:border-lime-300 hover:bg-lime-400/10 hover:text-lime-200"
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
    const gameGuideStaticGuides = STATIC_GUIDES
        .filter((guide) => guide.contentType === "game_guide" || guide.contentType === "offer_guide")
        .sort((a, b) => b.lastModified.localeCompare(a.lastModified));
    const staticGuideGameSlugs = Array.from(new Set(
        gameGuideStaticGuides
            .map((guide) => guide.gameSlug ?? guide.slug)
            .filter(Boolean)
    ));

    const { data: guides, count } = await supabase
        .from("guides")
        .select("id, title, slug, excerpt, difficulty, estimated_time, max_payout_usd, published_at, guide_type, games(id, name, slug, thumbnail_url)", { count: "exact" })
        .eq("status", "published")
        .or(`guide_type.is.null,guide_type.in.(${PUBLIC_GUIDE_TYPES.join(",")})`)
        .order("published_at", { ascending: false })
        .range(from, to);

    const rawGuides = ((guides ?? []) as unknown as Guide[])
        .filter((guide) => shouldShowOnGameGuidesIndex({ title: guide.title, guideType: guide.guide_type }));
    const guideGameIds = Array.from(new Set(rawGuides.map((guide) => guide.games?.id).filter(Boolean))) as string[];

    const { data: staticGuideGames } = staticGuideGameSlugs.length > 0
        ? await supabase
            .from("games")
            .select("id, slug, thumbnail_url")
            .in("slug", staticGuideGameSlugs)
        : { data: [] };
    const staticGameBySlug = new Map(
        ((staticGuideGames ?? []) as StaticGuideGameRow[]).map((game) => [game.slug, game])
    );
    const allGuideGameIds = Array.from(new Set([
        ...guideGameIds,
        ...((staticGuideGames ?? []) as StaticGuideGameRow[]).map((game) => game.id),
    ]));

    const { data: offerArtworkRows } = allGuideGameIds.length > 0
        ? await supabase
            .from("unified_offers_view")
            .select("game_id, game_thumbnail, image_url")
            .in("game_id", allGuideGameIds)
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

    const staticGuideImageBySlug = new Map<string, string | null>();
    for (const guide of gameGuideStaticGuides) {
        const game = staticGameBySlug.get(guide.gameSlug ?? guide.slug);
        staticGuideImageBySlug.set(
            guide.slug,
            pickPublicArtworkUrl(
                guide.imageUrl,
                game?.thumbnail_url,
                game?.id ? gameArtworkById.get(game.id) : null
            )
        );
    }

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
    const totalCount = count ?? rawGuides.length;
    const displayedTotalCount = totalCount + gameGuideStaticGuides.length;

    return (
        <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-8">
            <Container>
                <div className="mb-8">
                    <nav className="mb-6 flex items-center gap-2 text-[11px] font-bold text-[var(--text-tertiary)]" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-[var(--brand-ink)]">Home</Link>
                        <span>/</span>
                        <span className="text-[var(--brand-ink)]">Guides</span>
                    </nav>
                    <p className="section-label mb-3">Game Guides</p>
                    <h1 className="max-w-4xl text-4xl font-black uppercase tracking-[-0.06em] text-[var(--brand-ink)] sm:text-5xl">
                        Game offer guides for GPT sites
                    </h1>
                    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                        Step-by-step completion guides for offerwall games on Freecash, Swagbucks, EarnLab, Gain.gg, and similar GPT sites. Use them to compare payout size, estimated time, difficulty, task deadlines, and whether a no-spend route looks realistic before starting.
                    </p>
                    {totalCount > 0 && (
                        <p className="mt-4 inline-flex bg-slate-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                            {displayedTotalCount} guide{displayedTotalCount !== 1 ? "s" : ""} available
                        </p>
                    )}
                </div>

                {page === 1 ? (
                    <section className="mb-8 space-y-8" aria-labelledby="guide-hubs-heading">
                        <div className="grid gap-4 md:grid-cols-3">
                            {GUIDE_EXPLAINER_CARDS.map((card) => (
                                <div key={card.title} className="border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
                                    <h2 className="text-sm font-black uppercase tracking-[-0.02em] text-[var(--brand-ink)]">{card.title}</h2>
                                    <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">{card.description}</p>
                                </div>
                            ))}
                        </div>

                        <div>
                            <p className="section-label mb-2">Guide hubs</p>
                            <h2 id="guide-hubs-heading" className="text-xl font-black uppercase tracking-[-0.04em] text-[var(--brand-ink)]">
                                Browse by guide type
                            </h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {GUIDE_HUB_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="border border-[var(--border-default)] bg-white p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-lime-300"
                                >
                                    <h3 className="text-sm font-black uppercase tracking-[-0.02em] text-[var(--brand-ink)]">{link.label}</h3>
                                    <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">{link.description}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                ) : null}

                {visibleGuides.length === 0 && !shouldShowPalmonHub && page !== 1 ? (
                    <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] p-16 text-center">
                        <div className="text-3xl mb-4">📖</div>
                        <h2 className="text-lg font-bold text-[var(--brand-ink)] mb-2">No guides published yet</h2>
                        <p className="text-[var(--text-tertiary)]">Check back soon — new guides are added weekly.</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-5">
                            <p className="section-label mb-2">Latest game guides</p>
                            <h2 className="text-xl font-black uppercase tracking-[-0.04em] text-[var(--brand-ink)]">
                                Step-by-step offer routes
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {page === 1 && gameGuideStaticGuides.map((guide) => (
                                <GuideIndexCard
                                    key={guide.slug}
                                    href={guide.href}
                                    label={guide.indexLabel ?? (guide.title.includes("World of Warships") ? "World of Warships" : "Offer Guide")}
                                    title={guide.title}
                                    description={guide.description}
                                    initials={guide.initials ?? (guide.title.includes("World of Warships") ? "WW" : "OG")}
                                    imageUrl={staticGuideImageBySlug.get(guide.slug) ?? null}
                                    difficulty={guide.difficulty ?? (guide.slug === "world-of-warships-torox-offer-guide" ? "easy" : null)}
                                    estimatedTime={guide.estimatedTime ?? (guide.slug === "world-of-warships-torox-offer-guide" ? "Same day for many users" : "Completion time varies")}
                                    maxPayoutUsd={guide.maxPayoutUsd ?? null}
                                />
                            ))}
                            {shouldShowPalmonHub && <PalmonGuideHub imageUrl={palmonHubImageUrl} />}
                            {visibleGuides.map((guide) => (
                                <GuideCard key={guide.id} guide={guide} />
                            ))}
                        </div>
                        {page === 1 && (
                            <section className="mt-12 border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)]" aria-labelledby="choosing-guide-heading">
                                <h2 id="choosing-guide-heading" className="text-2xl font-black uppercase tracking-[-0.05em] text-[var(--brand-ink)]">
                                    Choosing the right game offer
                                </h2>
                                <div className="mt-5 grid gap-5 md:grid-cols-2">
                                    {GUIDE_DECISION_CARDS.map((card) => (
                                        <div key={card.title}>
                                            <h3 className="text-sm font-black uppercase tracking-[-0.02em] text-[var(--brand-ink)]">{card.title}</h3>
                                            <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">{card.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
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