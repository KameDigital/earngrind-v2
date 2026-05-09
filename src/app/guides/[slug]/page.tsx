import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractSections } from "./markdownRenderer";
import GuideHeader from "./GuideHeader";
import GuideSidebar from "./GuideSidebar";
import GuideJsonLd from "./GuideJsonLd";
import ClassicLayout from "./layouts/ClassicLayout";
import StepsLayout  from "./layouts/StepsLayout";
import ProLayout    from "./layouts/ProLayout";
import GuidePerformanceTracker from "./GuidePerformanceTracker";
import GuideOfferCtaBlock from "./GuideOfferCtaBlock";
import { matchOffersToGuide, type GuideOfferMatch } from "@/lib/guide-offer-matcher";
import { summarizeGuideEvents, type GuideEventRow } from "@/lib/guide-event-stats";
import { absoluteUrl } from "@/lib/site-url";
import { evaluateIndexingReadiness } from "@/lib/indexing-readiness";
import { getDuplicateKeywordGuideIds, shouldIncludeGuideInSitemap } from "@/lib/sitemap-quality";
import { noindexFollowRobots, robotsForIndexability } from "@/lib/seo-metadata";
import { seaOfConquestRoiGuideOverride } from "./seaOfConquestRoiGuide";

const GUIDE_SLUG_REDIRECTS: Record<string, string> = {
    "sea-of-conquest-offer-guide-best-path-flagship-level-30": "sea-of-conquest-flagship-level-30-guide",
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
            game:games(id, name, slug)
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
            .limit(4),
        supabase
            .from("unified_offers_view")
            .select("id, source, title, payout_usd, total_payout_usd, status, devices, countries, category, offer_expires_at, updated_at, game_id, game_name, game_slug, platform_id, platform_name, platform_slug, provider_id, provider_name, goal_text, game_devices")
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

    return {
        guide,
        game,
        relatedGuides: relatedGuides ?? [],
        relatedOffers: (topOffers ?? []).map(o => ({
            id:            o.id as string,
            game_name:     o.game_name as string,
            game_slug:     o.game_slug as string,
            platform_name: o.platform_name as string,
            payout_usd:    o.payout_usd as number,
        })),
        matchedOffers,
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
    const { game, relatedGuides, relatedOffers, matchedOffers } = data;
    if (guide.slug === "sea-of-conquest-flagship-level-30-guide") {
        guide = {
            ...guide,
            ...seaOfConquestRoiGuideOverride,
        };
    }
    const layoutStyle = guide.layout_style ?? "classic";
    const hasMatchedOfferCtas = matchedOffers.length > 0;
    const lastCheckedSource = guide.last_offer_check_at ?? guide.payout_verified_at ?? guide.tasks_verified_at ?? guide.provider_terms_verified_at;
    const lastCheckedText = lastCheckedSource
        ? `Last checked: ${new Date(lastCheckedSource).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. Offers and payouts can change. Verify live terms before starting.`
        : "Offers, payouts, deadlines, and tasks can change by provider, device, region, and account history. Verify live terms before starting.";

    return (
        <div className="min-h-screen bg-[#f5f5f0]">
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
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 items-start">

                    <main className="min-w-0">
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

                        <div className="mb-6">
                            <div className="mb-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-semibold text-gray-600">
                                {lastCheckedText}
                            </div>
                            <GuideOfferCtaBlock
                                guideId={guide.id}
                                guideSlug={guide.slug}
                                offers={matchedOffers}
                                placement={hasMatchedOfferCtas ? "top" : "fallback"}
                            />
                        </div>

                        {layoutStyle === "steps" ? (
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
                        <div className="mt-6">
                            <GuideOfferCtaBlock
                                guideId={guide.id}
                                guideSlug={guide.slug}
                                offers={matchedOffers}
                                placement={hasMatchedOfferCtas ? "bottom" : "fallback"}
                            />
                        </div>
                    </main>

                    <div className={layoutStyle === "pro" ? "mt-6 lg:mt-0 lg:self-start lg:sticky lg:top-[88px]" : "mt-6 lg:mt-0"}>
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
