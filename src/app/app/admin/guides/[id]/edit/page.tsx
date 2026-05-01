import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import GuideEditForm from "./GuideEditForm";
import GuideAdminActions from "../../GuideAdminActions";
import { detectCannibalization } from "@/lib/keyword-cannibalization";
import { formatPercent, summarizeGuideEvents, type GuideEventRow } from "@/lib/guide-event-stats";
import { analyzeGuideQuality } from "@/lib/guide-quality";
import {
    getGuideOptimizationRecommendations,
    type GuideOptimizationRecommendation,
} from "@/lib/guide-optimization-recommendations";
import FixGuideButton from "../../FixGuideButton";
import SeoMetadataTestingPanel from "../../SeoMetadataTestingPanel";
import { analyzeSeoDescription, analyzeSeoTitle } from "@/lib/seo-metadata-tools";
import { summarizeSearchConsoleMetrics, type GuideSearchConsoleMetric } from "@/lib/search-console-import";
import { matchOffersToGuide } from "@/lib/guide-offer-matcher";

export const metadata = { title: "Edit Guide | Admin" };

function daysAgo(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
}

function AnalyticsStat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</div>
            <div className="mt-1 text-lg font-extrabold text-gray-900">{value}</div>
        </div>
    );
}

function metadataValue(event: GuideEventRow, key: string) {
    const value = event.metadata?.[key];
    return typeof value === "string" ? value : null;
}

const RECOMMENDATION_STYLES: Record<GuideOptimizationRecommendation["priority"], string> = {
    high: "border-red-100 bg-red-50 text-red-800",
    medium: "border-amber-100 bg-amber-50 text-amber-900",
    low: "border-gray-100 bg-gray-50 text-gray-700",
};

export default async function EditGuidePage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

    const { data: guide } = await supabase.from("guides").select("*").eq("id", params.id).single();

    if (!guide) notFound();

    const { data: game } = await supabase
        .from("games")
        .select("id, name, slug")
        .eq("id", guide.game_id)
        .maybeSingle();
    const { data: relatedGuides } = await supabase
        .from("guides")
        .select("id, title, keyword_target, keyword_cluster_id, keyword_intent")
        .neq("id", guide.id)
        .limit(200);
    const cannibalization = detectCannibalization([
        {
            id: guide.id,
            title: guide.title,
            keyword_target: guide.keyword_target,
            keyword_cluster_id: guide.keyword_cluster_id,
            keyword_intent: guide.keyword_intent,
        },
        ...(relatedGuides ?? []),
    ]).filter((issue) => issue.guideIds.includes(guide.id));

    const { data: recentEvents } = await supabase
        .from("guide_events")
        .select("guide_id, guide_slug, event_type, target_url, metadata, created_at")
        .eq("guide_id", guide.id)
        .gte("created_at", daysAgo(30))
        .order("created_at", { ascending: false })
        .limit(5000);
    const { data: searchConsoleRows } = await supabase
        .from("guide_search_console_metrics")
        .select("query, clicks, impressions, ctr, position, date_start, date_end")
        .eq("guide_id", guide.id)
        .order("impressions", { ascending: false })
        .limit(50);
    const events30 = (recentEvents ?? []) as GuideEventRow[];
    const events7 = events30.filter((event) => new Date(event.created_at).getTime() >= new Date(daysAgo(7)).getTime());
    const stats30 = summarizeGuideEvents(events30);
    const stats7 = summarizeGuideEvents(events7);
    const lowCtaWarning = stats30.views >= 100 && stats30.ctaCtr < 0.02;
    const guideQuality = analyzeGuideQuality({
        bodyHtml: guide.body_md,
        seoTitle: guide.seo_title,
        seoDescription: guide.seo_description,
        keywordTarget: guide.keyword_target,
    });
    const duplicateTitles = (relatedGuides ?? []).map((relatedGuide) => relatedGuide.title).filter(Boolean);
    const titleAnalysis = analyzeSeoTitle(guide.seo_title ?? guide.title, guide.keyword_target, duplicateTitles);
    const descriptionAnalysis = analyzeSeoDescription(guide.seo_description ?? "", guide.keyword_target);
    const searchConsoleMetrics: GuideSearchConsoleMetric[] = (searchConsoleRows ?? []).map((metric) => ({
        query: metric.query,
        clicks: Number(metric.clicks ?? 0),
        impressions: Number(metric.impressions ?? 0),
        ctr: Number(metric.ctr ?? 0),
        position: Number(metric.position ?? 0),
    }));
    const searchConsole = summarizeSearchConsoleMetrics(searchConsoleMetrics, guide.keyword_target);
    const allOffersResult = await supabase
        .from("unified_offers_view")
        .select("id, source, title, payout_usd, total_payout_usd, status, devices, countries, category, offer_expires_at, updated_at, game_id, game_name, game_slug, platform_id, platform_name, platform_slug, provider_id, provider_name, goal_text, game_devices")
        .order("total_payout_usd", { ascending: false })
        .limit(500);
    const matchedOffers = allOffersResult.error
        ? []
        : matchOffersToGuide({
            guide: { ...guide, game },
            offers: allOffersResult.data ?? [],
            guideEventStats: stats30,
        });
    const availableOffers = (allOffersResult.data ?? []).map((offer) => ({
        id: String(offer.id),
        title: String(offer.title ?? offer.goal_text ?? offer.game_name ?? "Offer"),
        platform: typeof offer.platform_name === "string" ? offer.platform_name : null,
        provider: typeof offer.provider_name === "string" ? offer.provider_name : null,
        payout: Number.isFinite(Number(offer.total_payout_usd ?? offer.payout_usd))
            ? Number(offer.total_payout_usd ?? offer.payout_usd)
            : null,
    }));
    const ctaEvents = events30.filter((event) => event.event_type === "cta_click" || event.event_type === "offer_click" || event.event_type === "platform_click");
    const placementCounts = ctaEvents.reduce<Record<string, number>>((acc, event) => {
        const placement = metadataValue(event, "placement") ?? "unknown";
        acc[placement] = (acc[placement] ?? 0) + 1;
        return acc;
    }, {});
    const topOfferClicks = ctaEvents.reduce<Record<string, number>>((acc, event) => {
        const offerId = metadataValue(event, "offer_id");
        if (!offerId) return acc;
        acc[offerId] = (acc[offerId] ?? 0) + 1;
        return acc;
    }, {});
    const topClickedOfferId = Object.entries(topOfferClicks).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const fallbackClicks = ctaEvents.filter((event) => metadataValue(event, "placement") === "fallback").length;
    const matchedOfferCtr = stats30.views > 0
        ? ctaEvents.filter((event) => metadataValue(event, "cta_variant_id") || metadataValue(event, "cta_variant")?.startsWith("guide_offer_matcher")).length / stats30.views
        : 0;
    const bestCtaVariant = [...stats30.ctaVariantPerformance].sort((a, b) => b.ctaCtr - a.ctaCtr || b.ctaClicks - a.ctaClicks)[0] ?? null;
    const worstCtaVariant = [...stats30.ctaVariantPerformance].filter((variant) => variant.ctaClicks > 0).sort((a, b) => a.ctaCtr - b.ctaCtr || b.ctaClicks - a.ctaClicks)[0] ?? null;
    const sortedMatchedByPayout = [...matchedOffers].sort((a, b) => (b.payout ?? 0) - (a.payout ?? 0));
    const highestPayoutOffer = sortedMatchedByPayout[0] ?? null;
    const lowerPayoutOfferGettingMoreClicks = Boolean(highestPayoutOffer && Object.entries(topOfferClicks).some(([offerId, clicks]) => {
        const offer = matchedOffers.find((item) => item.id === offerId);
        if (!offer || offer.id === highestPayoutOffer.id) return false;
        return (offer.payout ?? 0) < (highestPayoutOffer.payout ?? 0) && clicks > (topOfferClicks[highestPayoutOffer.id] ?? 0);
    }));
    const optimizationRecommendations = getGuideOptimizationRecommendations({
        status: guide.status,
        contentStatus: guide.content_status,
        updatedAt: guide.updated_at,
        publishedAt: guide.published_at,
        needsVariation: guide.needs_variation,
        keywordClusterId: guide.keyword_cluster_id,
        seoTitleScore: titleAnalysis.score,
        seoDescriptionScore: descriptionAnalysis.score,
        searchConsole,
        quality: guideQuality,
        stats: stats30,
        autoMatchedOfferCount: matchedOffers.length,
        lowerPayoutOfferGettingMoreClicks,
    });

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <Link href="/app/admin/guides" className="hover:text-gray-700 transition-colors">Guides</Link>
                    <span>/</span>
                    <span className="text-gray-600 font-medium truncate max-w-[200px]">{guide.title}</span>
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Edit Guide</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Status: <span className={`font-semibold ${guide.status === "published" ? "text-green-700" : "text-gray-500"}`}>{guide.status}</span>
                    {guide.published_at && (
                        <> • Published {new Date(guide.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
                    )}
                </p>
                <div className="mt-3">
                    <GuideAdminActions guideId={guide.id} status={guide.status} />
                </div>
            </div>
            {cannibalization.length > 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <div className="font-extrabold">Keyword cannibalization warning</div>
                    <p className="mt-1">This guide overlaps with {cannibalization.length} existing keyword/cluster signals. Consider merging, changing focus, or converting a weak draft into a subsection.</p>
                    <ul className="mt-2 list-disc pl-5">
                        {cannibalization.map((issue, index) => (
                            <li key={`${issue.type}-${index}`}>
                                <span className={issue.severity === "block" ? "font-bold text-red-700" : "font-bold text-amber-800"}>
                                    {issue.severity === "block" ? "Duplicate keyword" : issue.type === "similar_keyword" ? "Similar keyword" : "Same cluster overlap"}:
                                </span>{" "}
                                {issue.message}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Performance</p>
                        <h2 className="mt-1 text-lg font-extrabold text-gray-900">Guide Analytics</h2>
                        <p className="mt-1 text-sm text-gray-500">Last 30 days of privacy-safe guide events.</p>
                    </div>
                    <Link href={`/app/admin/guides/analytics?status=${encodeURIComponent(guide.status ?? "")}`} className="text-sm font-bold text-lime-700 hover:underline">
                        View all analytics
                    </Link>
                </div>
                {lowCtaWarning ? (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <strong>CTA optimization flag:</strong> Guide has traffic but low CTA clicks. Consider improving offer block, intro, or CTA placement.
                    </div>
                ) : null}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <AnalyticsStat label="Views 7d" value={stats7.views} />
                    <AnalyticsStat label="Views 30d" value={stats30.views} />
                    <AnalyticsStat label="CTA Clicks" value={stats30.ctaClicks} />
                    <AnalyticsStat label="Offer Clicks" value={stats30.offerClicks + stats30.platformClicks} />
                    <AnalyticsStat label="CTR" value={formatPercent(stats30.actionCtr)} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <AnalyticsStat label="Matched Offer CTR" value={formatPercent(matchedOfferCtr)} />
                    <AnalyticsStat label="Top CTA Placement" value={Object.entries(placementCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "n/a"} />
                    <AnalyticsStat label="Top Clicked Offer" value={matchedOffers.find((offer) => offer.id === topClickedOfferId)?.platform ?? topClickedOfferId ?? "n/a"} />
                    <AnalyticsStat label="Fallback CTA Clicks" value={fallbackClicks} />
                    <AnalyticsStat label="Matched Offers" value={matchedOffers.length} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <AnalyticsStat label="Best CTA Variant" value={bestCtaVariant ? `${bestCtaVariant.label} (${formatPercent(bestCtaVariant.ctaCtr)})` : "n/a"} />
                    <AnalyticsStat label="Worst CTA Variant" value={worstCtaVariant ? `${worstCtaVariant.label} (${formatPercent(worstCtaVariant.ctaCtr)})` : "n/a"} />
                    <AnalyticsStat label="Top Placement CTR" value={stats30.ctaPlacementPerformance[0] ? `${stats30.ctaPlacementPerformance[0].label} ${formatPercent(stats30.ctaPlacementPerformance[0].ctaCtr)}` : "n/a"} />
                    <AnalyticsStat label="CTA Offer Routes" value={stats30.ctaOfferPerformance.length} />
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">CTA variant performance</div>
                        {stats30.ctaVariantPerformance.length > 0 ? (
                            <div className="mt-2 divide-y divide-gray-100 rounded-xl border border-gray-200">
                                {stats30.ctaVariantPerformance.slice(0, 6).map((variant) => (
                                    <div key={variant.id} className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 text-sm">
                                        <span className="min-w-0 truncate font-semibold text-gray-800">{variant.label}</span>
                                        <span className="font-bold text-gray-900">{formatPercent(variant.ctaCtr)}</span>
                                        <span className="text-xs font-semibold text-gray-500">{variant.ctaClicks} clicks</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-2 text-sm text-gray-500">No CTA variant clicks recorded yet.</p>
                        )}
                    </div>
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Placement performance</div>
                        {stats30.ctaPlacementPerformance.length > 0 ? (
                            <div className="mt-2 divide-y divide-gray-100 rounded-xl border border-gray-200">
                                {stats30.ctaPlacementPerformance.slice(0, 6).map((placement) => (
                                    <div key={placement.id} className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 text-sm">
                                        <span className="min-w-0 truncate font-semibold text-gray-800">{placement.label}</span>
                                        <span className="font-bold text-gray-900">{formatPercent(placement.ctaCtr)}</span>
                                        <span className="text-xs font-semibold text-gray-500">{placement.offerClicks} offer clicks</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-2 text-sm text-gray-500">No placement clicks recorded yet.</p>
                        )}
                    </div>
                </div>
                <div className="mt-4">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Top clicked links</div>
                    {stats30.topLinks.length > 0 ? (
                        <div className="mt-2 divide-y divide-gray-100 rounded-xl border border-gray-200">
                            {stats30.topLinks.slice(0, 5).map((link) => (
                                <div key={link.targetUrl} className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
                                    <span className="truncate text-gray-700">{link.targetUrl}</span>
                                    <span className="shrink-0 font-bold text-gray-900">{link.clicks}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-2 text-sm text-gray-500">No clicked links recorded yet.</p>
                    )}
                </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Optimization</p>
                        <h2 className="mt-1 text-lg font-extrabold text-gray-900">Optimization Recommendations</h2>
                        <p className="mt-1 text-sm text-gray-500">Actionable fixes based on analytics, SEO quality, and content metadata.</p>
                    </div>
                    <Link href="/app/admin/guides/optimization" className="text-sm font-bold text-lime-700 hover:underline">
                        View optimization dashboard
                    </Link>
                </div>
                {optimizationRecommendations.length > 0 ? (
                    <div className="mt-4 grid gap-3">
                        {optimizationRecommendations.map((recommendation) => (
                            <div key={recommendation.type} className={`rounded-xl border p-3 text-sm ${RECOMMENDATION_STYLES[recommendation.priority]}`}>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest">
                                        {recommendation.priority}
                                    </span>
                                    <span className="font-extrabold">{recommendation.title}</span>
                                </div>
                                <p className="mt-2">{recommendation.description}</p>
                                <p className="mt-1 font-semibold">Suggested fix: {recommendation.suggestedAction}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {recommendation.type === "needs_internal_links" ? (
                                        <FixGuideButton guideId={guide.id} fixType="add_internal_links" className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-gray-800 shadow-sm">
                                            Add internal links
                                        </FixGuideButton>
                                    ) : null}
                                    {recommendation.type === "needs_variation" ? (
                                        <FixGuideButton guideId={guide.id} fixType="regenerate_variation" className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-gray-800 shadow-sm">
                                            Regenerate variation draft
                                        </FixGuideButton>
                                    ) : null}
                                    {recommendation.type === "update_opportunity" ? (
                                        <FixGuideButton guideId={guide.id} fixType="move_to_queue" className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-gray-800 shadow-sm">
                                            Move to content queue
                                        </FixGuideButton>
                                    ) : null}
                                    {(recommendation.type === "low_ctr" || recommendation.type === "needs_cta" || recommendation.type === "high_views_no_clicks") ? (
                                        <FixGuideButton guideId={guide.id} fixType="add_cta_section" className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-gray-800 shadow-sm">
                                            Add CTA
                                        </FixGuideButton>
                                    ) : null}
                                    {recommendation.type === "missing_faq" ? (
                                        <FixGuideButton guideId={guide.id} fixType="add_faq_section" className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-gray-800 shadow-sm">
                                            Add FAQ
                                        </FixGuideButton>
                                    ) : null}
                                    {recommendation.type === "thin_content" ? (
                                        <FixGuideButton guideId={guide.id} fixType="expand_thin_content" className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-gray-800 shadow-sm">
                                            Add expansion prompts
                                        </FixGuideButton>
                                    ) : null}
                                    {recommendation.type === "improve_seo_metadata" ? (
                                        <a href="#seo-preview-testing" className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-gray-800 shadow-sm">
                                            Open SEO testing panel
                                        </a>
                                    ) : null}
                                    {recommendation.type === "high_impressions_low_ctr" ? (
                                        <a href="#seo-preview-testing" className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-gray-800 shadow-sm">
                                            Improve title/meta
                                        </a>
                                    ) : null}
                                    {(recommendation.type === "striking_distance" || recommendation.type === "query_mismatch") ? (
                                        <a href="#body" className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-gray-800 shadow-sm">
                                            Add query section
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 rounded-xl border border-green-100 bg-green-50 p-3 text-sm font-semibold text-green-800">
                        No major optimization issues detected from current data.
                    </div>
                )}
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Search Console</p>
                        <h2 className="mt-1 text-lg font-extrabold text-gray-900">Imported Query Performance</h2>
                        <p className="mt-1 text-sm text-gray-500">Manual GSC imports connected to this guide.</p>
                    </div>
                    <Link href="/app/admin/seo/search-console" className="text-sm font-bold text-lime-700 hover:underline">
                        View Search Console report
                    </Link>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <AnalyticsStat label="GSC Impressions" value={searchConsole.impressions} />
                    <AnalyticsStat label="GSC Clicks" value={searchConsole.clicks} />
                    <AnalyticsStat label="GSC CTR" value={`${(searchConsole.ctr * 100).toFixed(2)}%`} />
                    <AnalyticsStat label="Avg Position" value={searchConsole.avgPosition ? searchConsole.avgPosition.toFixed(1) : "n/a"} />
                </div>
                {searchConsole.topQueries.length > 0 ? (
                    <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                <tr>
                                    <th className="px-3 py-2">Query</th>
                                    <th className="px-3 py-2 text-center">Impressions</th>
                                    <th className="px-3 py-2 text-center">Clicks</th>
                                    <th className="px-3 py-2 text-center">CTR</th>
                                    <th className="px-3 py-2 text-center">Position</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {searchConsole.topQueries.slice(0, 6).map((metric) => (
                                    <tr key={metric.query}>
                                        <td className="px-3 py-2 font-semibold text-gray-800">{metric.query}</td>
                                        <td className="px-3 py-2 text-center">{metric.impressions}</td>
                                        <td className="px-3 py-2 text-center">{metric.clicks}</td>
                                        <td className="px-3 py-2 text-center">{(metric.ctr * 100).toFixed(2)}%</td>
                                        <td className="px-3 py-2 text-center">{metric.position.toFixed(1)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="mt-4 text-sm text-gray-500">No Search Console rows imported for this guide yet.</p>
                )}
                {searchConsole.mismatchQueries.length > 0 ? (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <strong>Query mismatch:</strong> Imported impressions include queries that do not contain the current keyword target. Consider adding a support section or creating a separate guide for: {searchConsole.mismatchQueries.slice(0, 3).join(", ")}.
                    </div>
                ) : null}
            </div>
            <SeoMetadataTestingPanel
                guideId={guide.id}
                guideTitle={guide.title}
                slug={guide.slug}
                seoTitle={guide.seo_title}
                seoDescription={guide.seo_description}
                keywordTarget={guide.keyword_target}
                maxPayoutUsd={guide.max_payout_usd}
                duplicateTitles={duplicateTitles}
            />
            <GuideEditForm
                guide={guide}
                initialGame={game ? { id: game.id, name: game.name, slug: game.slug } : null}
                availableOffers={availableOffers}
                matchedOffers={matchedOffers.map((offer) => ({
                    id: offer.id,
                    title: offer.title,
                    platform: offer.platform,
                    provider: offer.provider,
                    payout: offer.payout,
                    matchReason: offer.matchReason,
                    score: offer.score,
                }))}
            />
        </div>
    );
}
