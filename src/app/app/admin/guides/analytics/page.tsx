import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
    emptyGuideEventSummary,
    formatPercent,
    summarizeGuideEvents,
    summarizeEventsByGuide,
    type GuideEventRow,
    type GuideEventSummary,
} from "@/lib/guide-event-stats";

export const dynamic = "force-dynamic";
export const metadata = { title: "Guide Analytics | Admin" };

type SearchParams = Record<string, string | string[] | undefined>;

type GuideRow = {
    id: string;
    title: string;
    slug: string;
    status: string;
    guide_type: string | null;
    batch_name: string | null;
    keyword_target: string | null;
    keyword_cluster_id: string | null;
    updated_at: string | null;
};

const GUIDE_TYPE_LABELS: Record<string, string> = {
    game_offer: "Game Offer Guide",
    platform_review: "Platform Review",
    offer_comparison: "Offer Comparison",
    payout_guide: "Payout Guide",
};

function queryValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function daysAgo(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
}

function parseDate(value: string | undefined, fallback: string) {
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

function FilterInput({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
            <input name={name} defaultValue={defaultValue ?? ""} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        </label>
    );
}

function MetricCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</div>
            <div className="mt-2 text-2xl font-extrabold text-gray-900">{value}</div>
            {helper ? <div className="mt-1 text-xs text-gray-500">{helper}</div> : null}
        </div>
    );
}

function GuideList({
    title,
    rows,
    metric,
}: {
    title: string;
    rows: Array<{ guide: GuideRow; stats: GuideEventSummary }>;
    metric: (stats: GuideEventSummary) => string | number;
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-extrabold text-gray-900">{title}</h2>
            </div>
            <div className="divide-y divide-gray-100">
                {rows.length > 0 ? rows.map(({ guide, stats }) => (
                    <div key={guide.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                        <div className="min-w-0">
                            <Link href={`/app/admin/guides/${guide.id}/edit`} className="font-bold text-gray-900 hover:underline">
                                {guide.title}
                            </Link>
                            <div className="mt-0.5 truncate text-xs text-gray-500">{guide.keyword_target ?? guide.slug}</div>
                        </div>
                        <div className="shrink-0 text-right">
                            <div className="font-extrabold text-gray-900">{metric(stats)}</div>
                            <div className="text-[11px] text-gray-400">{stats.views} views</div>
                        </div>
                    </div>
                )) : (
                    <div className="px-4 py-8 text-center text-sm font-semibold text-gray-500">No matching data yet.</div>
                )}
            </div>
        </div>
    );
}

export default async function GuideAnalyticsPage({ searchParams }: { searchParams?: SearchParams }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

    const fromDate = parseDate(queryValue(searchParams?.from), daysAgo(30));
    const toDate = parseDate(queryValue(searchParams?.to), new Date().toISOString().slice(0, 10));
    const statusFilter = queryValue(searchParams?.status);
    const guideTypeFilter = queryValue(searchParams?.guide_type);
    const batchFilter = queryValue(searchParams?.batch_name);
    const clusterFilter = queryValue(searchParams?.keyword_cluster_id);

    let guidesQuery = supabase
        .from("guides")
        .select("id, title, slug, status, guide_type, batch_name, keyword_target, keyword_cluster_id, updated_at")
        .order("updated_at", { ascending: false })
        .limit(1000);

    if (statusFilter) guidesQuery = guidesQuery.eq("status", statusFilter);
    if (guideTypeFilter) guidesQuery = guidesQuery.eq("guide_type", guideTypeFilter);
    if (batchFilter) guidesQuery = guidesQuery.ilike("batch_name", `%${batchFilter}%`);
    if (clusterFilter) guidesQuery = guidesQuery.eq("keyword_cluster_id", clusterFilter);

    const { data: guides } = await guidesQuery;
    const guideRows = (guides ?? []) as GuideRow[];
    const guideIds = guideRows.map((guide) => guide.id);

    const { data: events } = guideIds.length > 0
        ? await supabase
            .from("guide_events")
            .select("guide_id, guide_slug, event_type, target_url, metadata, created_at")
            .in("guide_id", guideIds)
            .gte("created_at", `${fromDate}T00:00:00.000Z`)
            .lte("created_at", `${toDate}T23:59:59.999Z`)
            .limit(20000)
        : { data: [] };

    const eventRows = (events ?? []) as GuideEventRow[];
    const statsByGuide = summarizeEventsByGuide(eventRows);
    const overallStats = summarizeGuideEvents(eventRows);
    const rows = guideRows.map((guide) => ({
        guide,
        stats: statsByGuide.get(guide.id) ?? statsByGuide.get(guide.slug) ?? emptyGuideEventSummary(),
    }));

    const totals = rows.reduce((acc, row) => ({
        views: acc.views + row.stats.views,
        ctaClicks: acc.ctaClicks + row.stats.ctaClicks,
        offerClicks: acc.offerClicks + row.stats.offerClicks,
        platformClicks: acc.platformClicks + row.stats.platformClicks,
    }), { views: 0, ctaClicks: 0, offerClicks: 0, platformClicks: 0 });
    const totalClicks = totals.ctaClicks + totals.offerClicks + totals.platformClicks;
    const overallCtr = totals.views > 0 ? totalClicks / totals.views : 0;

    const topByViews = [...rows].sort((a, b) => b.stats.views - a.stats.views).filter((row) => row.stats.views > 0).slice(0, 8);
    const topByCta = [...rows].sort((a, b) => b.stats.ctaClicks - a.stats.ctaClicks).filter((row) => row.stats.ctaClicks > 0).slice(0, 8);
    const topByOffer = [...rows].sort((a, b) => (b.stats.offerClicks + b.stats.platformClicks) - (a.stats.offerClicks + a.stats.platformClicks)).filter((row) => row.stats.offerClicks + row.stats.platformClicks > 0).slice(0, 8);
    const underperforming = rows.filter((row) => row.stats.views >= 100 && row.stats.ctaCtr < 0.02).sort((a, b) => b.stats.views - a.stats.views);
    const viewsNoClicks = rows.filter((row) => row.stats.views > 0 && row.stats.clickCount === 0).sort((a, b) => b.stats.views - a.stats.views).slice(0, 20);
    const bottomBeatsTop = rows.filter((row) => {
        const top = row.stats.ctaPlacementPerformance.find((placement) => placement.id === "top");
        const bottom = row.stats.ctaPlacementPerformance.find((placement) => placement.id === "bottom");
        return top && bottom && bottom.ctaCtr > top.ctaCtr && bottom.ctaClicks >= top.ctaClicks + 1;
    }).sort((a, b) => {
        const aBottom = a.stats.ctaPlacementPerformance.find((placement) => placement.id === "bottom")?.ctaCtr ?? 0;
        const bBottom = b.stats.ctaPlacementPerformance.find((placement) => placement.id === "bottom")?.ctaCtr ?? 0;
        return bBottom - aBottom;
    }).slice(0, 10);
    const fallbackOften = rows.filter((row) => {
        const fallback = row.stats.ctaPlacementPerformance.find((placement) => placement.id === "fallback");
        const total = row.stats.ctaPlacementPerformance.reduce((sum, placement) => sum + placement.ctaClicks, 0);
        return fallback && fallback.ctaClicks >= 3 && fallback.ctaClicks / Math.max(total, 1) >= 0.25;
    }).sort((a, b) => {
        const aFallback = a.stats.ctaPlacementPerformance.find((placement) => placement.id === "fallback")?.ctaClicks ?? 0;
        const bFallback = b.stats.ctaPlacementPerformance.find((placement) => placement.id === "fallback")?.ctaClicks ?? 0;
        return bFallback - aFallback;
    }).slice(0, 10);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-400">Guide performance</p>
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Guide Analytics</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Track guide views, CTAs, outbound clicks, and internal link clicks without storing personal user data.
                    </p>
                </div>
                <Link href="/app/admin/guides" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:border-gray-300">
                    Back to Guides
                </Link>
            </div>

            <form className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
                    <FilterInput name="from" label="From" defaultValue={fromDate} />
                    <FilterInput name="to" label="To" defaultValue={toDate} />
                    <label className="block">
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Status</span>
                        <select name="status" defaultValue={statusFilter ?? ""} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                            <option value="">All</option>
                            <option value="draft">Draft</option>
                            <option value="needs_review">Needs Review</option>
                            <option value="published">Published</option>
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Guide Type</span>
                        <select name="guide_type" defaultValue={guideTypeFilter ?? ""} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                            <option value="">All</option>
                            {Object.entries(GUIDE_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </label>
                    <FilterInput name="batch_name" label="Batch" defaultValue={batchFilter} />
                    <FilterInput name="keyword_cluster_id" label="Cluster" defaultValue={clusterFilter} />
                    <div className="flex items-end gap-2">
                        <button className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white">Filter</button>
                        <Link href="/app/admin/guides/analytics" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700">Clear</Link>
                    </div>
                </div>
            </form>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <MetricCard label="Views" value={totals.views} helper={`${fromDate} to ${toDate}`} />
                <MetricCard label="CTA Clicks" value={totals.ctaClicks} />
                <MetricCard label="Offer Clicks" value={totals.offerClicks} helper={`${totals.platformClicks} platform clicks`} />
                <MetricCard label="CTR" value={formatPercent(overallCtr)} helper="CTA + outbound / views" />
                <MetricCard label="Low CTA Flags" value={underperforming.length} helper="100+ views and under 2% CTA CTR" />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <GuideList title="Top Guides by Views" rows={topByViews} metric={(stats) => stats.views} />
                <GuideList title="Top Guides by CTA Clicks" rows={topByCta} metric={(stats) => stats.ctaClicks} />
                <GuideList title="Top Guides by Offer Clicks" rows={topByOffer} metric={(stats) => stats.offerClicks + stats.platformClicks} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-4 py-3">
                        <h2 className="text-sm font-extrabold text-gray-900">Top CTA Variants Overall</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {overallStats.ctaVariantPerformance.length > 0 ? overallStats.ctaVariantPerformance.slice(0, 8).map((variant) => (
                            <div key={variant.id} className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 text-sm">
                                <span className="min-w-0 truncate font-bold text-gray-900">{variant.label}</span>
                                <span className="font-extrabold text-gray-900">{formatPercent(variant.ctaCtr)}</span>
                                <span className="text-xs font-semibold text-gray-500">{variant.ctaClicks} clicks</span>
                            </div>
                        )) : (
                            <div className="px-4 py-8 text-center text-sm font-semibold text-gray-500">No CTA variant data yet.</div>
                        )}
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-4 py-3">
                        <h2 className="text-sm font-extrabold text-gray-900">Top Placements Overall</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {overallStats.ctaPlacementPerformance.length > 0 ? overallStats.ctaPlacementPerformance.slice(0, 8).map((placement) => (
                            <div key={placement.id} className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 text-sm">
                                <span className="min-w-0 truncate font-bold text-gray-900">{placement.label}</span>
                                <span className="font-extrabold text-gray-900">{formatPercent(placement.ctaCtr)}</span>
                                <span className="text-xs font-semibold text-gray-500">{placement.offerClicks} offer clicks</span>
                            </div>
                        )) : (
                            <div className="px-4 py-8 text-center text-sm font-semibold text-gray-500">No placement data yet.</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <GuideList title="Underperforming Guides" rows={underperforming} metric={(stats) => formatPercent(stats.ctaCtr)} />
                <GuideList title="Views But No Clicks" rows={viewsNoClicks} metric={(stats) => stats.views} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <GuideList title="Bottom CTA Beats Top CTA" rows={bottomBeatsTop} metric={(stats) => {
                    const top = stats.ctaPlacementPerformance.find((placement) => placement.id === "top")?.ctaCtr ?? 0;
                    const bottom = stats.ctaPlacementPerformance.find((placement) => placement.id === "bottom")?.ctaCtr ?? 0;
                    return `${formatPercent(bottom)} vs ${formatPercent(top)}`;
                }} />
                <GuideList title="Fallback CTA Used Often" rows={fallbackOften} metric={(stats) => {
                    const fallback = stats.ctaPlacementPerformance.find((placement) => placement.id === "fallback")?.ctaClicks ?? 0;
                    return fallback;
                }} />
            </div>
        </div>
    );
}
