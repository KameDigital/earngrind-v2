import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractSections } from "./markdownRenderer";
import GuideHeader from "./GuideHeader";
import GuideSidebar from "./GuideSidebar";
import GuideJsonLd from "./GuideJsonLd";
import ClassicLayout from "./layouts/ClassicLayout";
import StepsLayout  from "./layouts/StepsLayout";
import ProLayout    from "./layouts/ProLayout";
import GuidePerformanceTracker from "./GuidePerformanceTracker";

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
    const supabase = createClient();
    const { data: guide } = await supabase
        .from("guides")
        .select("title, seo_title, seo_description, excerpt, max_payout_usd")
        .eq("slug", params.slug)
        .eq("status", "published")
        .maybeSingle();

    if (!guide) return { title: "Guide Not Found | EarnGrind" };

    const title = guide.seo_title ?? guide.title;
    const desc  = guide.seo_description ?? guide.excerpt ??
        `Complete guide for ${guide.title}. Earn up to $${guide.max_payout_usd?.toFixed(2) ?? "?"}.`;

    return {
        title,
        description: desc,
        alternates: {
            canonical: `/guides/${params.slug}`,
        },
        openGraph: {
            title,
            description: desc,
            url: `/guides/${params.slug}`,
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

    const { data: topOffers } = await supabase
        .from("unified_offers_view")
        .select("id, game_name, game_slug, platform_name, payout_usd")
        .eq("game_id", game.id)
        .order("payout_usd", { ascending: false })
        .limit(4);

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
    };
}

// ---------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------
export default async function GuidePage({ params }: { params: { slug: string } }) {
    const data = await fetchGuideData(params.slug);
    if (!data) notFound();

    const { guide, game, relatedGuides, relatedOffers } = data;
    const layoutStyle = guide.layout_style ?? "classic";

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
                            .prose-guide .guide-summary-box{margin:1rem 0;border:1px solid #d9f99d;border-radius:1rem;background:#f7fee7;padding:1rem}
                            .prose-guide .guide-summary-box ul{margin:0;padding-left:1.25rem}
                            .prose-guide .guide-summary-box li:last-child{margin-bottom:0}
                        `}</style>

                        {layoutStyle === "steps" ? (
                            <StepsLayout
                                guide={{ body_md: guide.body_md, tips: guide.tips ?? [], max_payout_usd: guide.max_payout_usd }}
                                gameSlug={game.slug}
                                gameName={game.name}
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
                                }}
                                gameSlug={game.slug}
                                gameName={game.name}
                            />
                        ) : (
                            <ClassicLayout
                                guide={{ body_md: guide.body_md, tips: guide.tips ?? [], game_id: guide.game_id, max_payout_usd: guide.max_payout_usd }}
                                gameSlug={game.slug}
                                gameName={game.name}
                            />
                        )}
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
