import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { analyzeGuideQuality } from "@/lib/guide-quality";
import { formatPercent, summarizeEventsByGuide, type GuideEventRow } from "@/lib/guide-event-stats";
import {
    getGuideOptimizationRecommendations,
    type GuideOptimizationRecommendation,
    type GuideOptimizationRecommendationType,
} from "@/lib/guide-optimization-recommendations";
import FixGuideButton, { type GuideFixType } from "../FixGuideButton";
import { analyzeSeoDescription, analyzeSeoTitle } from "@/lib/seo-metadata-tools";
import { summarizeSearchConsoleMetrics, type GuideSearchConsoleMetric } from "@/lib/search-console-import";

export const dynamic = "force-dynamic";
export const metadata = { title: "Guide Optimization | Admin" };

type SearchParams = Record<string, string | string[] | undefined>;

type GuideRow = {
    id: string;
    title: string;
    slug: string;
    status: string | null;
    content_status: string | null;
    batch_name: string | null;
    keyword_target: string | null;
    keyword_cluster_id: string | null;
    body_md: string | null;
    seo_title: string | null;
    seo_description: string | null;
    needs_variation: boolean | null;
    published_at: string | null;
    updated_at: string | null;
};

const PRIORITY_STYLES = {
    high: "bg-red-50 text-red-700 border-red-100",
    medium: "bg-amber-50 text-amber-800 border-amber-100",
    low: "bg-gray-50 text-gray-600 border-gray-100",
} as const;

function queryValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function daysAgo(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
}

function priorityRank(priority: GuideOptimizationRecommendation["priority"]) {
    if (priority === "high") return 0;
    if (priority === "medium") return 1;
    return 2;
}

function FilterInput({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
            <input name={name} defaultValue={defaultValue ?? ""} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        </label>
    );
}

function RecommendationBadges({ recommendations }: { recommendations: GuideOptimizationRecommendation[] }) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {recommendations.slice(0, 3).map((recommendation) => (
                <span
                    key={recommendation.type}
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${PRIORITY_STYLES[recommendation.priority]}`}
                    title={recommendation.description}
                >
                    {recommendation.title}
                </span>
            ))}
            {recommendations.length > 3 ? (
                <span className="rounded-full border border-gray-100 bg-gray-50 px-2 py-0.5 text-[11px] font-bold text-gray-500">
                    +{recommendations.length - 3}
                </span>
            ) : null}
        </div>
    );
}

function fixTypesForRecommendations(recommendations: GuideOptimizationRecommendation[]) {
    const fixes = new Set<GuideFixType>();
    for (const recommendation of recommendations) {
        if (recommendation.type === "needs_internal_links") fixes.add("add_internal_links");
        if (recommendation.type === "needs_cta" || recommendation.type === "low_ctr" || recommendation.type === "high_views_no_clicks") fixes.add("add_cta_section");
        if (recommendation.type === "missing_faq") fixes.add("add_faq_section");
        if (recommendation.type === "thin_content") fixes.add("expand_thin_content");
        if (recommendation.type === "needs_variation") fixes.add("regenerate_variation");
        if (recommendation.type === "update_opportunity" || recommendation.type === "republish_candidate") fixes.add("move_to_queue");
    }
    return Array.from(fixes);
}

export default async function GuideOptimizationPage({ searchParams }: { searchParams?: SearchParams }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

    const priorityFilter = queryValue(searchParams?.priority);
    const typeFilter = queryValue(searchParams?.type) as GuideOptimizationRecommendationType | undefined;
    const statusFilter = queryValue(searchParams?.status);
    const batchFilter = queryValue(searchParams?.batch_name);
    const clusterFilter = queryValue(searchParams?.cluster);

    let guidesQuery = supabase
        .from("guides")
        .select("id, title, slug, status, content_status, batch_name, keyword_target, keyword_cluster_id, body_md, seo_title, seo_description, needs_variation, published_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(1000);

    if (statusFilter) guidesQuery = guidesQuery.eq("status", statusFilter);
    if (batchFilter) guidesQuery = guidesQuery.ilike("batch_name", `%${batchFilter}%`);
    if (clusterFilter) guidesQuery = guidesQuery.eq("keyword_cluster_id", clusterFilter);

    const { data: guides } = await guidesQuery;
    const guideRows = (guides ?? []) as GuideRow[];
    const guideIds = guideRows.map((guide) => guide.id);
    const { data: events } = guideIds.length > 0
        ? await supabase
            .from("guide_events")
            .select("guide_id, guide_slug, event_type, target_url, created_at")
            .in("guide_id", guideIds)
            .gte("created_at", daysAgo(30))
            .limit(20000)
        : { data: [] };
    const { data: searchConsoleRows } = guideIds.length > 0
        ? await supabase
            .from("guide_search_console_metrics")
            .select("guide_id, query, clicks, impressions, ctr, position")
            .in("guide_id", guideIds)
            .limit(20000)
        : { data: [] };

    const statsByGuide = summarizeEventsByGuide((events ?? []) as GuideEventRow[]);
    const gscByGuide = new Map<string, GuideSearchConsoleMetric[]>();
    for (const metric of searchConsoleRows ?? []) {
        if (!metric.guide_id) continue;
        if (!gscByGuide.has(metric.guide_id)) gscByGuide.set(metric.guide_id, []);
        gscByGuide.get(metric.guide_id)?.push({
            query: metric.query,
            clicks: Number(metric.clicks ?? 0),
            impressions: Number(metric.impressions ?? 0),
            ctr: Number(metric.ctr ?? 0),
            position: Number(metric.position ?? 0),
        });
    }
    const rows = guideRows.map((guide) => {
        const quality = analyzeGuideQuality({
            bodyHtml: guide.body_md,
            seoTitle: guide.seo_title,
            seoDescription: guide.seo_description,
            keywordTarget: guide.keyword_target,
        });
        const stats = statsByGuide.get(guide.id) ?? statsByGuide.get(guide.slug) ?? {
            views: 0,
            ctaClicks: 0,
            offerClicks: 0,
            platformClicks: 0,
            internalLinkClicks: 0,
            clickCount: 0,
            ctaCtr: 0,
            actionCtr: 0,
            topLinks: [],
        };
        const titleAnalysis = analyzeSeoTitle(guide.seo_title ?? guide.title, guide.keyword_target);
        const descriptionAnalysis = analyzeSeoDescription(guide.seo_description ?? "", guide.keyword_target);
        const searchConsole = summarizeSearchConsoleMetrics(gscByGuide.get(guide.id) ?? [], guide.keyword_target);
        const recommendations = getGuideOptimizationRecommendations({
            status: guide.status,
            contentStatus: guide.content_status,
            updatedAt: guide.updated_at,
            publishedAt: guide.published_at,
            needsVariation: guide.needs_variation,
            keywordClusterId: guide.keyword_cluster_id,
            seoTitleScore: titleAnalysis.score,
            seoDescriptionScore: descriptionAnalysis.score,
            searchConsole,
            quality,
            stats,
        });
        const topPriority = recommendations[0]?.priority ?? "low";
        return { guide, quality, stats, recommendations, topPriority, searchConsole };
    }).filter((row) => row.recommendations.length > 0)
        .filter((row) => !priorityFilter || row.recommendations.some((recommendation) => recommendation.priority === priorityFilter))
        .filter((row) => !typeFilter || row.recommendations.some((recommendation) => recommendation.type === typeFilter))
        .sort((a, b) => {
            const priorityDiff = priorityRank(a.topPriority) - priorityRank(b.topPriority);
            return priorityDiff || b.stats.views - a.stats.views;
        });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-400">Guide optimization</p>
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Optimization Recommendations</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Prioritize guide updates using traffic, clicks, SEO quality, and content metadata.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href="/app/admin/guides/analytics" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:border-gray-300">
                        View Analytics
                    </Link>
                    <Link href="/app/admin/content-queue" className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-gray-800">
                        Content Queue
                    </Link>
                </div>
            </div>

            <form className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                    <label className="block">
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Priority</span>
                        <select name="priority" defaultValue={priorityFilter ?? ""} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                            <option value="">All</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Recommendation</span>
                        <select name="type" defaultValue={typeFilter ?? ""} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                            <option value="">All</option>
                            <option value="low_ctr">Low CTR</option>
                            <option value="high_views_no_clicks">Views, no clicks</option>
                            <option value="needs_internal_links">Needs internal links</option>
                            <option value="needs_cta">Needs CTA</option>
                            <option value="needs_variation">Needs variation</option>
                            <option value="thin_content">Thin content</option>
                            <option value="missing_faq">Missing FAQ</option>
                            <option value="improve_seo_metadata">Improve SEO metadata</option>
                            <option value="high_impressions_low_ctr">High impressions, low CTR</option>
                            <option value="striking_distance">Striking distance</option>
                            <option value="query_mismatch">Query mismatch</option>
                            <option value="update_opportunity">Update opportunity</option>
                            <option value="republish_candidate">Strong draft</option>
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Status</span>
                        <select name="status" defaultValue={statusFilter ?? ""} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                            <option value="">All</option>
                            <option value="draft">Draft</option>
                            <option value="needs_review">Needs Review</option>
                            <option value="published">Published</option>
                        </select>
                    </label>
                    <FilterInput name="batch_name" label="Batch" defaultValue={batchFilter} />
                    <FilterInput name="cluster" label="Cluster" defaultValue={clusterFilter} />
                    <div className="flex items-end gap-2">
                        <button className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white">Filter</button>
                        <Link href="/app/admin/guides/optimization" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700">Clear</Link>
                    </div>
                </div>
            </form>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-100 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-4 py-3 text-left">Guide</th>
                                <th className="px-4 py-3 text-center">Views</th>
                                <th className="px-4 py-3 text-center">CTA CTR</th>
                                <th className="px-4 py-3 text-center">Offer Clicks</th>
                                <th className="px-4 py-3 text-center">SEO</th>
                                <th className="px-4 py-3 text-left">Recommendations</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map(({ guide, quality, stats, recommendations, topPriority, searchConsole }) => (
                                <tr key={guide.id} className="hover:bg-gray-50">
                                    <td className="min-w-[260px] px-4 py-3">
                                        <div className="font-bold text-gray-900">{guide.title}</div>
                                        <div className="mt-0.5 text-xs text-gray-500">{guide.keyword_target ?? guide.slug}</div>
                                        {searchConsole.impressions > 0 ? (
                                            <div className="mt-1 text-[11px] font-semibold text-blue-700">
                                                GSC: {searchConsole.impressions} impressions, {(searchConsole.ctr * 100).toFixed(2)}% CTR, avg pos {searchConsole.avgPosition.toFixed(1)}
                                            </div>
                                        ) : null}
                                        <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-bold">
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{guide.status ?? "unknown"}</span>
                                            <span className={`rounded-full border px-2 py-0.5 ${PRIORITY_STYLES[topPriority]}`}>{topPriority}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold text-gray-900">{stats.views}</td>
                                    <td className="px-4 py-3 text-center font-bold text-gray-900">{formatPercent(stats.ctaCtr)}</td>
                                    <td className="px-4 py-3 text-center font-bold text-gray-900">{stats.offerClicks + stats.platformClicks}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${quality.score >= 80 ? "bg-green-100 text-green-800" : quality.score >= 60 ? "bg-amber-100 text-amber-800" : "bg-red-50 text-red-700"}`}>
                                            {quality.score}
                                        </span>
                                    </td>
                                    <td className="min-w-[280px] px-4 py-3">
                                        <RecommendationBadges recommendations={recommendations} />
                                        <p className="mt-2 text-xs text-gray-500">{recommendations[0]?.suggestedAction}</p>
                                    </td>
                                    <td className="min-w-[240px] px-4 py-3">
                                        <div className="flex flex-wrap gap-2">
                                            <Link href={`/app/admin/guides/${guide.id}/edit`} className="rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-bold text-white">Edit</Link>
                                            {recommendations.some((recommendation) => recommendation.type === "improve_seo_metadata" || recommendation.type === "high_impressions_low_ctr") ? (
                                                <Link href={`/app/admin/guides/${guide.id}/edit#seo-preview-testing`} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">SEO Test</Link>
                                            ) : null}
                                            {recommendations.some((recommendation) => recommendation.type === "striking_distance" || recommendation.type === "query_mismatch") ? (
                                                <Link href={`/app/admin/guides/${guide.id}/edit`} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">Add Query Section</Link>
                                            ) : null}
                                            <Link href={`/app/admin/guides/analytics?status=${encodeURIComponent(guide.status ?? "")}`} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">Analytics</Link>
                                            {fixTypesForRecommendations(recommendations).map((fixType) => (
                                                <FixGuideButton key={fixType} guideId={guide.id} fixType={fixType} />
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {rows.length === 0 ? (
                    <div className="py-16 text-center text-sm font-semibold text-gray-500">No optimization recommendations match these filters.</div>
                ) : null}
            </div>
        </div>
    );
}
