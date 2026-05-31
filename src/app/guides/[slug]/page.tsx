import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractSections } from "./markdownRenderer";
import GuideHeader from "./GuideHeader";
import GuideSidebar from "./GuideSidebar";
import GuideJsonLd from "./GuideJsonLd";
import GuideInternalLinks from "./GuideInternalLinks";
import ClassicLayout from "./layouts/ClassicLayout";
import StepsLayout  from "./layouts/StepsLayout";
import ProLayout    from "./layouts/ProLayout";
import ConversionLayout from "./layouts/ConversionLayout";
import ProConversionLayout from "./layouts/ProConversionLayout";
import GuidePerformanceTracker from "./GuidePerformanceTracker";
import GuideOfferCtaBlock from "./GuideOfferCtaBlock";
import { matchOffersToGuide, type GuideOfferMatch } from "@/lib/guide-offer-matcher";
import { summarizeGuideEvents, type GuideEventRow } from "@/lib/guide-event-stats";
import { absoluteUrl } from "@/lib/site-url";
import { evaluateIndexingReadiness } from "@/lib/indexing-readiness";
import { getDuplicateKeywordGuideIds, shouldIncludeGuideInSitemap } from "@/lib/sitemap-quality";
import { noindexFollowRobots, robotsForIndexability } from "@/lib/seo-metadata";
import { pickPublicArtworkUrl } from "@/lib/public-image-url";
import { seaOfConquestRoiGuideOverride } from "./seaOfConquestRoiGuide";

const GUIDE_SLUG_REDIRECTS: Record<string, string> = {
    "sea-of-conquest-offer-guide-best-path-flagship-level-30": "sea-of-conquest-flagship-level-30-guide",
};

const ZOMBIE_WAVES_TOROX_LEVEL_100_SLUG = "zombie-waves-offer-guide-level-100-torox-route";

const GUIDE_HERO_IMAGES: Record<string, string> = {
    [ZOMBIE_WAVES_TOROX_LEVEL_100_SLUG]: "/images/guides/zombie-waves-torox-level-100-hero.webp",
    "palmon-survival-offerwall-guide": "/images/guides/palmon-survival/palmon-guide-hero.jpg",
    "palmon-survival-camp-30-guide": "/images/guides/palmon-survival/palmon-late-game.jpg",
    "palmon-survival-no-spend": "/images/guides/palmon-survival/palmon-early-game.jpg",
    "palmon-survival-not-crediting": "/images/guides/palmon-survival/palmon-task-list-confirm.jpg",
};

const GUIDE_PREVIEW_IMAGES: Record<string, string> = {
    "palmon-survival-offerwall-guide": "/images/guides/palmon-survival/palmon-hero-image.jpg",
    "palmon-survival-camp-30-guide": "/images/guides/palmon-survival/palmon-late-game.jpg",
    "palmon-survival-no-spend": "/images/guides/palmon-survival/palmon-early-game.jpg",
    "palmon-survival-not-crediting": "/images/guides/palmon-survival/palmon-task-list-confirm.jpg",
};

// ---------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------
interface Guide {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    body_md: string | null;
    difficulty: string | null;
    estimated_time: string | null;
    max_payout_usd: number | null;
    tips: string[];
    video_url: string | null;
    video_summary?: string | null;
    video_transcript?: string | null;
    video_thumbnail_url?: string | null;
    video_upload_date?: string | null;
    key_takeaways: string | null;
    checklist_items: string[];
    layout_style: string;
    show_related_offers: boolean;
    show_related_guides: boolean;
    seo_title: string | null;
    seo_description: string | null;
    published_at: string | null;
    updated_at: string;
    game_id: string;
    platform_id: string | null;
    platform_filter: string | null;
    keyword_target: string | null;
    keyword_intent: string | null;
    guide_type: string | null;
    payout_verified_at: string | null;
    tasks_verified_at: string | null;
    provider_terms_verified_at: string | null;
    last_offer_check_at: string | null;
    primary_offer_id: string | null;
    disable_auto_offer_matching: boolean | null;
}

interface Game {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
}

// ---------------------------------------------------------------
// METADATA
// ---------------------------------------------------------------
export async function generateMetadata(
    { params }: { params: { slug: string } }
): Promise<Metadata> {
    const metadataSlug = GUIDE_SLUG_REDIRECTS[params.slug] ?? params.slug;
    const supabase = createClient();
    const { data: guide } = await supabase
        .from("guides")
        .select("id, title, slug, status, body_md, seo_title, seo_description, excerpt, max_payout_usd, keyword_target, keyword_cluster_id, keyword_intent, needs_variation, updated_at, published_at")
        .eq("slug", metadataSlug)
        .eq("status", "published")
        .maybeSingle();

    if (!guide) return { title: "Guide Not Found | EarnGrind", robots: noindexFollowRobots() };

    const { data: allGuides } = await supabase
        .from("guides")
        .select("id, title, slug, status, body_md, seo_title, seo_description, keyword_target, keyword_cluster_id, keyword_intent, needs_variation, updated_at, published_at")
        .eq("status", "published");

    const guideForMetadata = metadataSlug === "sea-of-conquest-flagship-level-30-guide"
        ? { ...guide, ...seaOfConquestRoiGuideOverride }
        : guide;
    const duplicateGuideIds = getDuplicateKeywordGuideIds(allGuides ?? []);
    const sitemapDecision = shouldIncludeGuideInSitemap(guide, duplicateGuideIds);
    const readiness = evaluateIndexingReadiness({
        guide: guideForMetadata,
        allGuides: allGuides ?? [],
        includedInSitemap: sitemapDecision.include,
    });
    const title = guideForMetadata.seo_title ?? guideForMetadata.title;
    const desc  = guideForMetadata.seo_description ?? guideForMetadata.excerpt ??
        `Compare ${guide.title} requirements, payout milestones, and completion tips before starting. Verify live terms because payouts and tasks can change.`;
    const canonical = absoluteUrl(`/guides/${metadataSlug}`);
    const imageUrl = GUIDE_PREVIEW_IMAGES[metadataSlug];
    const absoluteImageUrl = imageUrl ? absoluteUrl(imageUrl) : null;

    return {
        title,
        description: desc,
        alternates: {
            canonical,
        },
        robots: robotsForIndexability(readiness.ready),
        openGraph: {
            title,
            description: desc,
            url: canonical,
            ...(absoluteImageUrl ? { images: [{ url: absoluteImageUrl }] } : {}),
        },
        twitter: {
            card: absoluteImageUrl ? "summary_large_image" : "summary",
            title,
            description: desc,
            ...(absoluteImageUrl ? { images: [absoluteImageUrl] } : {}),
        },
    };
}

// ---------------------------------------------------------------
// DATA FETCH
// ---------------------------------------------------------------
async function fetchGuideData(slug: string) {
    const supabase = createClient();

    const { data: raw, error } = await supabase
        .from("guides")
        .select(`
            id, title, slug, excerpt, body_md, difficulty, estimated_time,
            max_payout_usd, tips, video_url, key_takeaways, checklist_items,
            layout_style, show_related_offers, show_related_guides,
            seo_title, seo_description, published_at, updated_at, game_id,
            platform_id, platform_filter, keyword_target, keyword_intent, guide_type,
            payout_verified_at, tasks_verified_at, provider_terms_verified_at, last_offer_check_at,
            primary_offer_id, disable_auto_offer_matching,
            game:games(id, name, slug, thumbnail_url)
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

    if (error || !raw) return null;

    const game = (Array.isArray(raw.game) ? raw.game[0] : raw.game) as Game | null;
    if (!game) return null;

    const guide = raw as unknown as Guide;

    const { data: relatedGuides } = await supabase
        .from("guides")
        .select("id, title, slug, difficulty, estimated_time")
        .eq("game_id", guide.game_id)
        .eq("status", "published")
        .neq("id", guide.id)
        .order("updated_at", { ascending: false })
        .limit(4);

    const [{ data: topOffers }, allOffersResult, { data: recentEvents }] = await Promise.all([
        supabase
            .from("unified_offers_view")
            .select("id, game_name, game_slug, platform_name, payout_usd")
            .eq("game_id", game.id)
            .order("payout_usd", { ascending: false })
            .limit(25),
        supabase
            .from("unified_offers_view")
            .select("id, source, title, payout_usd, total_payout_usd, status, devices, countries, category, offer_expires_at, updated_at, game_id, game_name, game_slug, game_thumbnail, image_url, platform_id, platform_name, platform_slug, provider_id, provider_name, goal_text, game_devices")
            .eq("game_id", game.id)
            .order("total_payout_usd", { ascending: false })
            .limit(250),
        supabase
            .from("guide_events")
            .select("guide_id, guide_slug, event_type, target_url, created_at")
            .eq("guide_id", guide.id)
            .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .limit(5000),
    ]);

    const guideEventStats = summarizeGuideEvents((recentEvents ?? []) as GuideEventRow[]);
    const matchedOffers: GuideOfferMatch[] = allOffersResult.error
        ? []
        : matchOffersToGuide({
            guide: { ...guide, game },
            offers: allOffersResult.data ?? [],
            guideEventStats,
        });
    const offerHeroImageUrl = pickPublicArtworkUrl(
        ...((allOffersResult.data ?? []) as Array<{ game_thumbnail?: string | null; image_url?: string | null }>)
            .flatMap((offer) => [offer.game_thumbnail, offer.image_url])
    );

    return {
        guide,
        game,
        relatedGuides: relatedGuides ?? [],
        relatedOffers: Array.from(
            (topOffers ?? []).reduce((offersByPlatform, offer) => {
                const platformName = (offer.platform_name as string | null) ?? "Unknown platform";
                const platformKey = platformName.trim().toLowerCase();
                const payoutUsd = Number(offer.payout_usd ?? 0);
                const existingOffer = offersByPlatform.get(platformKey);

                if (!existingOffer || payoutUsd > existingOffer.payout_usd) {
                    offersByPlatform.set(platformKey, {
                        id:            offer.id as string,
                        game_name:     offer.game_name as string,
                        game_slug:     offer.game_slug as string,
                        platform_name: platformName,
                        payout_usd:    payoutUsd,
                    });
                }

                return offersByPlatform;
            }, new Map<string, {
                id: string;
                game_name: string;
                game_slug: string;
                platform_name: string;
                payout_usd: number;
            }>()).values(),
        )
            .sort((a, b) => b.payout_usd - a.payout_usd)
            .slice(0, 4),
        matchedOffers,
        offerHeroImageUrl,
    };
}

// ---------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------
export default async function GuidePage({ params }: { params: { slug: string } }) {
    const redirectedSlug = GUIDE_SLUG_REDIRECTS[params.slug];
    if (redirectedSlug) redirect(`/guides/${redirectedSlug}`);

    const data = await fetchGuideData(params.slug);
    if (!data) notFound();

    let { guide } = data;
    const { game, relatedGuides, relatedOffers, matchedOffers, offerHeroImageUrl } = data;
    if (guide.slug === "sea-of-conquest-flagship-level-30-guide") {
        guide = {
            ...guide,
            ...seaOfConquestRoiGuideOverride,
        };
    }
    const layoutStyle = guide.layout_style ?? "classic";
    const hasMatchedOfferCtas = matchedOffers.length > 0;
    const showOfferCtaBlocks = !guide.disable_auto_offer_matching || hasMatchedOfferCtas;
    const layoutOwnsOfferCtas = layoutStyle === "pro_conversion";
    const showPageOfferCtaBlocks = showOfferCtaBlocks && !layoutOwnsOfferCtas;
    const heroImageUrl = pickPublicArtworkUrl(GUIDE_HERO_IMAGES[guide.slug], game.thumbnail_url, offerHeroImageUrl);
    const lastUpdatedText = `Last updated: ${new Date(guide.updated_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`;
    const payoutCheckedText = guide.payout_verified_at
        ? ` Payouts last checked: ${new Date(guide.payout_verified_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`
        : "";
    const freshnessText = `${lastUpdatedText}${payoutCheckedText} Offers, payouts, deadlines, and tasks can change by provider, device, region, and account history. Verify live terms before starting.`;
    const isZombieWavesGuide = guide.slug === ZOMBIE_WAVES_TOROX_LEVEL_100_SLUG;
    const bestMatchedOffer = matchedOffers[0] ?? null;
    const providerLabel = bestMatchedOffer?.provider ?? "Torox";
    const payoutLabel = guide.max_payout_usd != null
        ? `$${guide.max_payout_usd.toFixed(2)}`
        : bestMatchedOffer?.payout != null
            ? `$${bestMatchedOffer.payout.toFixed(2)}`
            : "Live offer";
    const guideShellClass = isZombieWavesGuide
        ? "min-h-screen bg-[linear-gradient(180deg,#020617_0,#07111f_620px,#f5f5f0_621px,#f5f5f0_100%)]"
        : "min-h-screen bg-[#f5f5f0]";
    const contentWrapClass = isZombieWavesGuide
        ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10"
        : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6";
    const contentGridClass = isZombieWavesGuide
        ? "lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8 items-start"
        : "lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 items-start";
    const sidebarClass = layoutStyle === "pro" || layoutStyle === "pro_conversion"
        ? isZombieWavesGuide
            ? "mt-8 lg:mt-0 lg:self-start lg:sticky lg:top-[88px]"
            : "mt-6 lg:mt-0 lg:self-start lg:sticky lg:top-[88px]"
        : isZombieWavesGuide
            ? "mt-8 lg:mt-0"
            : "mt-6 lg:mt-0";

    return (
        <div className={guideShellClass}>
            <GuidePerformanceTracker guideId={guide.id} guideSlug={guide.slug} />

            {/* JSON-LD structured data */}
            <GuideJsonLd
                guide={{
                    title:          guide.title,
                    slug:           guide.slug,
                    excerpt:        guide.excerpt,
                    difficulty:     guide.difficulty,
                    estimated_time: guide.estimated_time,
                    max_payout_usd: guide.max_payout_usd,
                    tips:           guide.tips ?? [],
                    published_at:   guide.published_at,
                    updated_at:     guide.updated_at,
                    guide_type:     guide.guide_type,
                    keyword_intent: guide.keyword_intent,
                    video_url:      guide.video_url,
                    video_summary:  guide.video_summary,
                    video_transcript: guide.video_transcript,
                    video_thumbnail_url: guide.video_thumbnail_url,
                    video_upload_date: guide.video_upload_date,
                }}
                gameName={game.name}
                gameSlug={game.slug}
                steps={extractSections(guide.body_md ?? "")}
                imageUrl={heroImageUrl}
            />

            {/* Shared 3-row header */}
            <GuideHeader
                guide={{
                    title:          guide.title,
                    slug:           guide.slug,
                    excerpt:        guide.excerpt,
                    difficulty:     guide.difficulty,
                    max_payout_usd: guide.max_payout_usd,
                    estimated_time: guide.estimated_time,
                    tips:           guide.tips ?? [],
                    layout_style:   layoutStyle,
                    updated_at:     guide.updated_at,
                    video_url:      guide.video_url,
                }}
                gameName={game.name}
                gameSlug={game.slug}
                heroImageUrl={heroImageUrl}
            />

            {isZombieWavesGuide ? (
                <section className="relative overflow-hidden bg-slate-950 px-4 pb-8 sm:px-6 lg:px-8">
                    <div className="absolute inset-x-0 top-0 h-px bg-cyan-200/20" />
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-[#f5f5f0]" />
                    <div className="relative mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="overflow-hidden rounded-2xl border border-cyan-200/20 bg-white/[0.07] text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
                            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                                <p className="text-[11px] font-extrabold uppercase tracking-widest text-lime-200">Route snapshot</p>
                                <p className="mt-1 text-sm leading-6 text-slate-200">
                                    Start with the live offer, confirm tracking, then follow the level route only if the current terms match this guide.
                                </p>
                            </div>
                            <dl className="grid divide-y divide-white/10 sm:grid-cols-4 sm:divide-x sm:divide-y-0 sm:divide-white/10">
                                {[
                                    ["Provider", providerLabel],
                                    ["Target", "Level 100"],
                                    ["Window", guide.estimated_time ?? "30 days"],
                                    ["Payout", payoutLabel],
                                ].map(([label, value]) => (
                                    <div key={label} className="px-5 py-4 sm:px-6">
                                        <dt className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-100/65">{label}</dt>
                                        <dd className="mt-1 text-base font-black text-white">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>

                        <div className="rounded-2xl border border-lime-200/25 bg-lime-200/[0.08] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.2)] backdrop-blur sm:p-6">
                            <p className="text-[11px] font-extrabold uppercase tracking-widest text-lime-200">Before you grind</p>
                            <p className="mt-3 text-sm leading-6 text-slate-100">{freshnessText}</p>
                            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-100">
                                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Verify terms first</span>
                                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Keep proof screenshots</span>
                                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Stop if tracking breaks</span>
                            </div>
                        </div>
                    </div>
                </section>
            ) : null}

            <div className={contentWrapClass}>
                <div className={contentGridClass}>

                    <main className={isZombieWavesGuide ? "min-w-0 space-y-7" : "min-w-0"}>
                        {/* Scoped prose styles — server-side inline, no CSS file needed */}
                        <style>{`
                            .prose-guide{color:#374151;font-size:.9375rem;line-height:1.7}
                            .prose-guide h1,.prose-guide h2,.prose-guide h3,.prose-guide h4{font-weight:800;color:#111827;margin-top:1.5em;margin-bottom:.5em;line-height:1.3}
                            .prose-guide h2{font-size:1.2rem}
                            .prose-guide h3{font-size:1.05rem}
                            .prose-guide p{margin-top:0;margin-bottom:.875em}
                            .prose-guide ul,.prose-guide ol{padding-left:1.25rem;margin-bottom:.875em}
                            .prose-guide li{margin-bottom:.35em}
                            .prose-guide strong{font-weight:700;color:#111827}
                            .prose-guide code{background:#f3f4f6;border:1px solid #e5e7eb;border-radius:4px;padding:1px 5px;font-size:.85em;font-family:monospace}
                            .prose-guide blockquote{border-left:3px solid #bef264;padding-left:1rem;color:#6b7280;font-style:italic;margin:1em 0}
                            .prose-guide hr{border:0;border-top:1px solid #e5e7eb;margin:1.5em 0}
                            .prose-guide a{color:#65a30d;text-decoration:underline}
                            .prose-guide table{width:100%;border-collapse:collapse;margin:1rem 0;overflow:hidden;border:1px solid #e5e7eb;border-radius:.75rem}
                            .prose-guide th,.prose-guide td{border:1px solid #e5e7eb;padding:.6rem;text-align:left;vertical-align:top}
                            .prose-guide th{background:#f9fafb;color:#111827;font-weight:800}
                            .prose-guide img{max-width:100%;height:auto;border-radius:.75rem;margin:1.25rem 0}
                            .prose-guide video{max-width:100%;height:auto;border-radius:.75rem;margin:0}
                            .prose-guide details{margin:1rem 0;border:1px solid #e5e7eb;border-radius:.75rem;background:#f9fafb;padding:.875rem}
                            .prose-guide summary{cursor:pointer;font-weight:800;color:#111827}
                            .prose-guide .guide-summary-box{margin:1rem 0;border:1px solid #d9f99d;border-radius:1rem;background:#f7fee7;padding:1rem}
                            .prose-guide .guide-summary-box ul{margin:0;padding-left:1.25rem}
                            .prose-guide .guide-summary-box li:last-child{margin-bottom:0}
                            .guide-table-wrap{width:100%;overflow-x:auto;margin:1rem 0}
                            .guide-table-wrap table{min-width:760px;margin:0}
                            .guide-video{margin:1.5rem 0}
                            .guide-video video{display:block;width:100%;height:auto;aspect-ratio:16/9;background:#111827;border-radius:.75rem;border:1px solid rgba(148,163,184,.25)}
                            .guide-image{margin:1.5rem 0}
                            .guide-image img{width:100%;height:auto;border-radius:.75rem;border:1px solid rgba(148,163,184,.25);margin:0}
                            .guide-image figcaption{margin-top:.5rem;font-size:.875rem;line-height:1.45;color:#64748b;text-align:center}
                        `}</style>

                        <div className={isZombieWavesGuide ? "mb-8" : "mb-6"}>
                            {!isZombieWavesGuide ? (
                                <div className="mb-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-semibold text-gray-600">
                                    {freshnessText}
                                </div>
                            ) : null}
                            {showPageOfferCtaBlocks ? (
                                <GuideOfferCtaBlock
                                    guideId={guide.id}
                                    guideSlug={guide.slug}
                                    offers={matchedOffers}
                                    placement={hasMatchedOfferCtas ? "top" : "fallback"}
                                    gameSlug={game.slug}
                                    gameName={game.name}
                                />
                            ) : null}
                        </div>

                        {layoutStyle === "pro_conversion" ? (
                            <ProConversionLayout
                                guide={{
                                    body_md:         guide.body_md,
                                    tips:            guide.tips ?? [],
                                    key_takeaways:   guide.key_takeaways,
                                    checklist_items: guide.checklist_items ?? [],
                                    max_payout_usd:  guide.max_payout_usd,
                                    difficulty:      guide.difficulty,
                                    estimated_time:  guide.estimated_time,
                                    video_url:       guide.video_url,
                                    video_summary:   guide.video_summary,
                                    video_transcript: guide.video_transcript,
                                }}
                                guideId={guide.id}
                                guideSlug={guide.slug}
                                gameSlug={game.slug}
                                gameName={game.name}
                                offers={matchedOffers}
                            />
                        ) : layoutStyle === "conversion" ? (
                            <ConversionLayout
                                guide={{
                                    body_md:         guide.body_md,
                                    tips:            guide.tips ?? [],
                                    key_takeaways:   guide.key_takeaways,
                                    checklist_items: guide.checklist_items ?? [],
                                    max_payout_usd:  guide.max_payout_usd,
                                    difficulty:      guide.difficulty,
                                    estimated_time:  guide.estimated_time,
                                }}
                                gameSlug={game.slug}
                                gameName={game.name}
                                showStaticCta={false}
                            />
                        ) : layoutStyle === "steps" ? (
                            <StepsLayout
                                guide={{ body_md: guide.body_md, tips: guide.tips ?? [], max_payout_usd: guide.max_payout_usd }}
                                gameSlug={game.slug}
                                gameName={game.name}
                                showStaticCta={false}
                            />
                        ) : layoutStyle === "pro" ? (
                            <ProLayout
                                guide={{
                                    body_md:         guide.body_md,
                                    tips:            guide.tips ?? [],
                                    key_takeaways:   guide.key_takeaways,
                                    checklist_items: guide.checklist_items ?? [],
                                    max_payout_usd:  guide.max_payout_usd,
                                    difficulty:      guide.difficulty,
                                    estimated_time:  guide.estimated_time,
                                    video_url:       guide.video_url,
                                    video_summary:   guide.video_summary,
                                    video_transcript: guide.video_transcript,
                                }}
                                gameSlug={game.slug}
                                gameName={game.name}
                                showStaticCta={false}
                            />
                        ) : (
                            <ClassicLayout
                                guide={{ body_md: guide.body_md, tips: guide.tips ?? [], game_id: guide.game_id, max_payout_usd: guide.max_payout_usd }}
                                gameSlug={game.slug}
                                gameName={game.name}
                                showStaticCta={false}
                            />
                        )}
                        {showPageOfferCtaBlocks ? (
                            <div className="mt-6">
                                <GuideOfferCtaBlock
                                    guideId={guide.id}
                                    guideSlug={guide.slug}
                                    offers={matchedOffers}
                                    placement={hasMatchedOfferCtas ? "mid" : "fallback"}
                                    gameSlug={game.slug}
                                    gameName={game.name}
                                />
                            </div>
                        ) : null}
                        <div className="mt-6">
                            <GuideInternalLinks
                                gameName={game.name}
                                gameSlug={game.slug}
                                relatedGuides={relatedGuides}
                            />
                        </div>
                        {showPageOfferCtaBlocks ? (
                            <div className="mt-6">
                                <GuideOfferCtaBlock
                                    guideId={guide.id}
                                    guideSlug={guide.slug}
                                    offers={matchedOffers}
                                    placement={hasMatchedOfferCtas ? "bottom" : "fallback"}
                                    gameSlug={game.slug}
                                    gameName={game.name}
                                />
                            </div>
                        ) : null}
                    </main>

                    <div className={sidebarClass}>
                        <GuideSidebar
                            guide={{
                                id:                  guide.id,
                                max_payout_usd:      guide.max_payout_usd,
                                difficulty:          guide.difficulty,
                                estimated_time:      guide.estimated_time,
                                tips:                guide.tips ?? [],
                                show_related_offers: guide.show_related_offers ?? true,
                                show_related_guides: guide.show_related_guides ?? true,
                            }}
                            gameName={game.name}
                            gameSlug={game.slug}
                            relatedGuides={relatedGuides}
                            relatedOffers={relatedOffers}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
}
