import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
    analyzeContentDecay,
    summarizeContentDecay,
    type ContentDecayGuideInput,
    type ContentDecayLevel,
    type ContentDecayMetricInput,
    type ContentDecayResult,
} from "@/lib/content-decay";
import ContentDecayActions from "./ContentDecayActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content Decay | Admin" };

type SearchParams = Record<string, string | string[] | undefined>;

const DECAY_STYLES: Record<ContentDecayLevel, string> = {
    none: "bg-gray-50 text-gray-600 border-gray-100",
    mild: "bg-blue-50 text-blue-700 border-blue-100",
    moderate: "bg-amber-50 text-amber-800 border-amber-100",
    severe: "bg-red-50 text-red-700 border-red-100",
};

function queryValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function formatCtr(value: number) {
    return `${(value * 100).toFixed(2)}%`;
}

function formatChange(value: number | null, suffix = "%") {
    if (value === null) return "n/a";
    const display = suffix === "%" || suffix === "pp" ? (value * 100).toFixed(1) : value.toFixed(1);
    return `${value > 0 ? "+" : ""}${display}${suffix}`;
}

function SummaryCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</div>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{value}</div>
        </div>
    );
}

function FilterInput({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
            <input name={name} defaultValue={defaultValue ?? ""} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        </label>
    );
}

function DecayBadge({ level }: { level: ContentDecayLevel }) {
    return (
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold capitalize ${DECAY_STYLES[level]}`}>
            {level}
        </span>
    );
}

export default async function ContentDecayPage({ searchParams }: { searchParams?: SearchParams }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

    const severityFilter = queryValue(searchParams?.severity);
    const guideTypeFilter = queryValue(searchParams?.guide_type);
    const batchFilter = queryValue(searchParams?.batch);
    const clusterFilter = queryValue(searchParams?.cluster);

    let guidesQuery = supabase
        .from("guides")
        .select("id, title, slug, keyword_target, guide_type, batch_name, keyword_cluster_id, updated_at, published_at, status")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(2000);

    if (guideTypeFilter) guidesQuery = guidesQuery.eq("guide_type", guideTypeFilter);
    if (batchFilter) guidesQuery = guidesQuery.ilike("batch_name", `%${batchFilter}%`);
    if (clusterFilter) guidesQuery = guidesQuery.eq("keyword_cluster_id", clusterFilter);

    const [{ data: guides }, { data: metrics }] = await Promise.all([
        guidesQuery,
        supabase
            .from("guide_search_console_metrics")
            .select("guide_id, clicks, impressions, ctr, position, date_start, date_end, created_at")
            .not("guide_id", "is", null)
            .limit(50000),
    ]);

    const guideRows = (guides ?? []) as ContentDecayGuideInput[];
    const guideIds = new Set(guideRows.map((guide) => guide.id));
    const metricRows = (metrics ?? [])
        .filter((metric) => metric.guide_id && guideIds.has(metric.guide_id))
        .map((metric) => ({
            guide_id: metric.guide_id,
            clicks: Number(metric.clicks ?? 0),
            impressions: Number(metric.impressions ?? 0),
            ctr: Number(metric.ctr ?? 0),
            position: Number(metric.position ?? 0),
            date_start: metric.date_start,
            date_end: metric.date_end,
            created_at: metric.created_at,
        })) satisfies ContentDecayMetricInput[];

    const allRows = analyzeContentDecay({ guides: guideRows, metrics: metricRows });
    const summary = summarizeContentDecay(allRows);
    const rows = allRows.filter((row) => {
        if (severityFilter === "severe") return row.decayLevel === "severe";
        if (severityFilter === "moderate_plus") return row.decayLevel === "severe" || row.decayLevel === "moderate";
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">SEO</p>
                    <h1 className="mt-1 text-2xl font-extrabold text-gray-900">Content Decay</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Compare the latest imported Search Console period against the previous period for published guides.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href="/app/admin/seo/search-console-import" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">
                        Import GSC CSV
                    </Link>
                    <Link href="/app/admin/content-queue" className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white">
                        Content Queue
                    </Link>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-5">
                <SummaryCard label="Monitored guides" value={summary.totalMonitoredGuides} />
                <SummaryCard label="Severe decay" value={summary.severeDecayCount} />
                <SummaryCard label="Moderate decay" value={summary.moderateDecayCount} />
                <SummaryCard label="Overdue updates" value={summary.overdueUpdateCount} />
                <SummaryCard label="Position loss" value={summary.positionLossCount} />
            </div>

            <form className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                    <label className="block">
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Decay</span>
                        <select name="severity" defaultValue={severityFilter ?? ""} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                            <option value="">All</option>
                            <option value="severe">Severe only</option>
                            <option value="moderate_plus">Moderate+</option>
                        </select>
                    </label>
                    <FilterInput name="guide_type" label="Guide type" defaultValue={guideTypeFilter} />
                    <FilterInput name="batch" label="Batch" defaultValue={batchFilter} />
                    <FilterInput name="cluster" label="Cluster" defaultValue={clusterFilter} />
                    <div className="flex items-end gap-2 xl:col-span-2">
                        <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white">Filter</button>
                        <Link href="/app/admin/seo/content-decay" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700">Clear</Link>
                    </div>
                </div>
            </form>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Guide</th>
                                <th className="px-4 py-3">Keyword</th>
                                <th className="px-4 py-3 text-center">Previous Clicks / Impr.</th>
                                <th className="px-4 py-3 text-center">Current Clicks / Impr.</th>
                                <th className="px-4 py-3 text-center">CTR Change</th>
                                <th className="px-4 py-3 text-center">Position Change</th>
                                <th className="px-4 py-3">Decay</th>
                                <th className="px-4 py-3">Suggested Action</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((row) => (
                                <tr key={row.guideId} className="hover:bg-gray-50">
                                    <td className="min-w-[260px] px-4 py-3">
                                        <Link href={`/app/admin/guides/${row.guideId}/edit`} className="font-bold text-gray-900 hover:underline">{row.title}</Link>
                                        <div className="mt-0.5 text-xs text-gray-500">
                                            {row.guideType ?? "guide"} {row.batchName ? `- ${row.batchName}` : ""}
                                        </div>
                                        <div className="mt-1 text-[11px] text-gray-400">
                                            Updated {row.daysSinceUpdated ?? "n/a"} days ago
                                        </div>
                                    </td>
                                    <td className="min-w-[180px] px-4 py-3 text-xs font-semibold text-gray-600">{row.keywordTarget ?? "n/a"}</td>
                                    <td className="px-4 py-3 text-center font-bold text-gray-900">
                                        {row.previous ? `${row.previous.clicks} / ${row.previous.impressions}` : "n/a"}
                                        <div className="mt-1 text-[11px] font-semibold text-gray-400">{row.previous ? formatCtr(row.previous.ctr) : ""}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold text-gray-900">
                                        {row.current ? `${row.current.clicks} / ${row.current.impressions}` : "n/a"}
                                        <div className="mt-1 text-[11px] font-semibold text-gray-400">{row.current ? formatCtr(row.current.ctr) : ""}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold text-gray-900">{formatChange(row.ctrChange, "pp")}</td>
                                    <td className={`px-4 py-3 text-center font-bold ${row.hasPositionLoss ? "text-red-700" : "text-gray-900"}`}>{formatChange(row.positionChange, "")}</td>
                                    <td className="px-4 py-3">
                                        <DecayBadge level={row.decayLevel} />
                                        <div className="mt-1 text-[11px] text-gray-400">Score {row.decayScore}</div>
                                        {row.reasons.length > 0 ? (
                                            <div className="mt-2 max-w-[260px] text-xs text-gray-500">{row.reasons.slice(0, 2).join(" ")}</div>
                                        ) : null}
                                    </td>
                                    <td className="min-w-[260px] px-4 py-3 text-xs text-gray-600">{row.suggestedAction}</td>
                                    <td className="min-w-[180px] px-4 py-3">
                                        <ContentDecayActions row={row} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {rows.length === 0 ? (
                    <div className="p-10 text-center text-sm font-semibold text-gray-500">
                        No guides match these content decay filters.
                    </div>
                ) : null}
            </div>
        </div>
    );
}
