import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/layout/Container";
import { STATIC_GUIDES } from "@/lib/static-guides";
import { pickPublicArtworkUrl } from "@/lib/public-image-url";
import { canonicalAlternates } from "@/lib/seo-metadata";
import { buildBreadcrumbList, buildCollectionPage, buildItemList, buildOrganization, JsonLd } from "@/lib/seo-schema";
import { PUBLIC_GUIDE_TYPES, shouldShowOnGameGuidesIndex } from "@/lib/content-routing";

export const metadata: Metadata = {
    title: "Game Offer Guides for Freecash, Swagbucks & GPT Sites",
    description: "Browse game offer guides with payout context, completion difficulty, timing, no-spend notes, and route comparisons for major GPT and rewards sites.",
    alternates: canonicalAlternates("/guides"),
    openGraph: {
        title: "Game Offer Guides for Freecash, Swagbucks & GPT Sites",
        description: "Browse game offer guides with payout context, completion difficulty, timing, no-spend notes, and route comparisons for major GPT and rewards sites.",
        url: "https://earngrind.com/guides",
        siteName: "EarnGrind",
        images: [
            {
                url: "/og-earngrind.png",
                width: 1200,
                height: 630,
                alt: "EarnGrind game offer guide hub",
            },
        ],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Game Offer Guides for Freecash, Swagbucks & GPT Sites",
        description: "Compare payout, timing, difficulty, and no-spend strategy before starting a game offer.",
        images: ["/og-earngrind.png"],
    },
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
                {maxPayoutUsd != null && (
                    <span className="ml-auto text-sm font-extrabold text-lime-600">
                        up to ${maxPayoutUsd.toFixed(2)}
                    </span>
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
    const itemList = buildItemList([
        ...gameGuideStaticGuides.slice(0, 12).map((guide) => ({
            name: guide.title,
            path: guide.href,
            description: guide.description,
        })),
        ...visibleGuides.slice(0, 12).map((guide) => ({
            name: guide.title,
            path: `/guides/${guide.slug}`,
            description: guide.excerpt,
        })),
    ]);
    const schemas = [
        buildOrganization("EarnGrind", "/"),
        buildBreadcrumbList([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
        ]),
        itemList,
        buildCollectionPage({
            name: "Game Offer Guides",
            path: "/guides",
            description: "Game offer guides with payout context, difficulty, timing, completion strategy, and partner route comparisons.",
            mainEntity: itemList,
        }),
    ];

    return (
        <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
            <JsonLd data={schemas} />
            <Container>
                <section className="mb-8 border border-slate-700 bg-[var(--brand-ink)] px-5 py-6 text-white shadow-[var(--shadow-card)] sm:px-7 sm:py-8">
                <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm font-semibold text-white/55">
                    <Link href="/" className="hover:text-[var(--brand-lime)]">Home</Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-white">Guides</span>
                </nav>
                <div>
                    <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--brand-lime)]">Game guide library</p>
                    <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                        Game offer guides for GPT sites
                    </h1>
                    <p className="max-w-3xl text-base leading-relaxed text-white/72 sm:text-lg">
                        Step-by-step completion guides for offerwall games on Freecash, Swagbucks, EarnLab, Gain.gg, and similar GPT sites.
                        Use them to compare payout size, estimated time, difficulty, task deadlines, and whether a no-spend route looks realistic before starting.
                    </p>
                    {totalCount > 0 && (
                        <p className="mt-3 text-sm text-white/55">
                            {displayedTotalCount} guide{displayedTotalCount !== 1 ? "s" : ""} available
                        </p>
                    )}
                </div>
                </section>

                <section className="mb-8 grid gap-4 text-sm leading-relaxed text-[var(--text-secondary)] md:grid-cols-3" aria-label="How to use these game offer guides">
                    <div className="border border-[var(--border-default)] bg-white p-4 shadow-[var(--shadow-card)]">
                        <h2 className="text-base font-extrabold text-[var(--brand-ink)]">What these guides cover</h2>
                        <p className="mt-2">
                            Each guide focuses on the actual offer path: required milestones, tracking risk, screenshots to keep, and the payout ceiling visible from current or researched routes.
                        </p>
                    </div>
                    <div className="border border-[var(--border-default)] bg-white p-4 shadow-[var(--shadow-card)]">
                        <h2 className="text-base font-extrabold text-[var(--brand-ink)]">How payouts work</h2>
                        <p className="mt-2">
                            GPT platforms and offerwalls set the reward, eligibility, and approval rules. EarnGrind compares those routes so you can choose the best platform before installing.
                        </p>
                    </div>
                    <div className="border border-[var(--border-default)] bg-white p-4 shadow-[var(--shadow-card)]">
                        <h2 className="text-base font-extrabold text-[var(--brand-ink)]">Common mistakes</h2>
                        <p className="mt-2">
                            Starting from the wrong country page, switching devices, skipping screenshot proof, missing timed milestones, or chasing a high payout with poor hourly value can all lower expected earnings.
                        </p>
                    </div>
                </section>

                {page === 1 ? (
                    <section className="mb-8" aria-labelledby="guide-hubs-heading">
                        <div className="mb-4">
                            <p className="section-label mb-2">Guide hubs</p>
                            <h2 id="guide-hubs-heading" className="text-2xl font-extrabold tracking-tight text-[var(--brand-ink)]">
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
                                    <h3 className="font-extrabold text-[var(--brand-ink)]">{link.label}</h3>
                                    <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">{link.description}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                ) : null}

                {visibleGuides.length === 0 && !shouldShowPalmonHub && page !== 1 ? (
                    <div className="border border-[var(--border-default)] bg-white p-16 text-center shadow-[var(--shadow-card)]">
                        <div className="text-3xl mb-4">📖</div>
                        <h2 className="text-lg font-bold text-[var(--brand-ink)] mb-2">No guides published yet</h2>
                        <p className="text-[var(--text-tertiary)]">Check back soon — new guides are added weekly.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                        <Pagination
                            page={page}
                            totalCount={totalCount}
                            pageSize={PAGE_SIZE}
                            basePath="/guides"
                        />
                        <section className="mt-12 border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)]" aria-labelledby="guide-faq-heading">
                            <h2 id="guide-faq-heading" className="text-2xl font-extrabold tracking-tight text-[var(--brand-ink)]">
                                Choosing the right game offer
                            </h2>
                            <div className="mt-5 grid gap-5 text-sm leading-relaxed text-[var(--text-secondary)] md:grid-cols-2">
                                <div>
                                    <h3 className="font-extrabold text-[var(--brand-ink)]">Which offers are easiest?</h3>
                                    <p className="mt-2">
                                        Easier offers usually have early milestones, lower level targets, clear tracking, and no purchase dependency. Check each guide&apos;s difficulty, completion time, and no-spend notes before starting.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-[var(--brand-ink)]">Which offers pay the most?</h3>
                                    <p className="mt-2">
                                        The highest headline payouts often require late-game progression or purchases. Compare them with the expected hourly value and the chance of finishing inside the deadline.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-[var(--brand-ink)]">Can you finish without spending?</h3>
                                    <p className="mt-2">
                                        Some games are realistic no-spend routes, while others are only worth considering with a capped budget. Use the guide&apos;s task breakdown before committing time or money.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-[var(--brand-ink)]">Where should beginners start?</h3>
                                    <p className="mt-2">
                                        Start with guides that show short deadlines, simple tasks, and multiple GPT site routes. Then compare alternatives in the offer search hub before clicking out.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </Container>
        </main>
    );
}
