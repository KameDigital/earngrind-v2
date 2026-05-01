import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
    mineSearchConsoleQueryOpportunities,
    type QueryOpportunityType,
    type SearchConsoleOpportunityRow,
    type SearchConsoleQueryOpportunity,
} from "@/lib/search-console-opportunities";
import QueryOpportunityActions from "./QueryOpportunityActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Query Opportunities | Admin" };

const GROUPS: Array<{ type: QueryOpportunityType; title: string; description: string }> = [
    { type: "new_guide", title: "New Guide Ideas", description: "Queries with impressions/rankings but no close guide keyword match." },
    { type: "add_section", title: "Add Section Ideas", description: "Queries that can strengthen an already-ranking guide." },
    { type: "ctr_improvement", title: "CTR Fixes", description: "High-impression queries with low click-through near the top 10." },
    { type: "supporting_cluster", title: "Supporting Cluster Ideas", description: "Related query groups that may justify supporting guides." },
];

function formatCtr(value: number) {
    return `${(value * 100).toFixed(2)}%`;
}

function PriorityBadge({ label }: { label: SearchConsoleQueryOpportunity["priorityLabel"] }) {
    const className = label === "Highest Priority"
        ? "bg-red-50 text-red-700 border-red-100"
        : label === "Strong"
            ? "bg-amber-50 text-amber-800 border-amber-100"
            : label === "Medium"
                ? "bg-blue-50 text-blue-700 border-blue-100"
                : "bg-gray-50 text-gray-600 border-gray-100";
    return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${className}`}>{label}</span>;
}

function OpportunityTable({ opportunities }: { opportunities: SearchConsoleQueryOpportunity[] }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Query</th>
                            <th className="px-4 py-3">Page</th>
                            <th className="px-4 py-3 text-center">Impr.</th>
                            <th className="px-4 py-3 text-center">Clicks</th>
                            <th className="px-4 py-3 text-center">CTR</th>
                            <th className="px-4 py-3 text-center">Position</th>
                            <th className="px-4 py-3">Suggested Action</th>
                            <th className="px-4 py-3">Priority</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {opportunities.map((opportunity) => (
                            <tr key={opportunity.id} className="hover:bg-gray-50">
                                <td className="min-w-[220px] px-4 py-3">
                                    <div className="font-bold text-gray-900">{opportunity.query}</div>
                                    {opportunity.relatedQueries?.length ? (
                                        <div className="mt-1 text-xs text-gray-500">{opportunity.relatedQueries.join(", ")}</div>
                                    ) : null}
                                </td>
                                <td className="min-w-[220px] px-4 py-3">
                                    {opportunity.guideId ? (
                                        <Link href={`/app/admin/guides/${opportunity.guideId}/edit`} className="font-semibold text-gray-800 hover:underline">
                                            {opportunity.guideTitle ?? "Existing guide"}
                                        </Link>
                                    ) : (
                                        <span className="font-semibold text-gray-500">No matched guide</span>
                                    )}
                                    <div className="mt-0.5 truncate text-xs text-gray-400">{opportunity.pageUrl}</div>
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-gray-900">{opportunity.impressions}</td>
                                <td className="px-4 py-3 text-center font-bold text-gray-900">{opportunity.clicks}</td>
                                <td className="px-4 py-3 text-center font-bold text-gray-900">{formatCtr(opportunity.ctr)}</td>
                                <td className="px-4 py-3 text-center font-bold text-gray-900">{opportunity.position.toFixed(1)}</td>
                                <td className="min-w-[260px] px-4 py-3 text-xs text-gray-600">{opportunity.suggestedAction}</td>
                                <td className="px-4 py-3">
                                    <PriorityBadge label={opportunity.priorityLabel} />
                                    <div className="mt-1 text-[11px] text-gray-400">Score {opportunity.priorityScore}</div>
                                </td>
                                <td className="min-w-[260px] px-4 py-3">
                                    <QueryOpportunityActions
                                        query={opportunity.query}
                                        pageUrl={opportunity.pageUrl}
                                        guideId={opportunity.guideId}
                                        opportunityType={opportunity.type}
                                        impressions={opportunity.impressions}
                                        clicks={opportunity.clicks}
                                        position={opportunity.position}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {opportunities.length === 0 ? <div className="p-8 text-center text-sm font-semibold text-gray-500">No opportunities in this group yet.</div> : null}
        </div>
    );
}

export default async function QueryOpportunitiesPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

    const [{ data: metrics }, { data: guides }] = await Promise.all([
        supabase
            .from("guide_search_console_metrics")
            .select("id, guide_id, page_url, query, clicks, impressions, ctr, position, guide:guides(id, title, slug, keyword_target, max_payout_usd)")
            .order("impressions", { ascending: false })
            .limit(2000),
        supabase
            .from("guides")
            .select("keyword_target")
            .not("keyword_target", "is", null)
            .limit(5000),
    ]);

    const rows = (metrics ?? []).map((metric) => ({
        id: metric.id,
        guide_id: metric.guide_id,
        page_url: metric.page_url,
        query: metric.query,
        clicks: Number(metric.clicks ?? 0),
        impressions: Number(metric.impressions ?? 0),
        ctr: Number(metric.ctr ?? 0),
        position: Number(metric.position ?? 0),
        guide: Array.isArray(metric.guide) ? metric.guide[0] : metric.guide,
    })) satisfies SearchConsoleOpportunityRow[];
    const keywords = (guides ?? []).map((guide) => guide.keyword_target).filter((value): value is string => Boolean(value));
    const opportunities = mineSearchConsoleQueryOpportunities(rows, keywords);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">SEO</p>
                    <h1 className="mt-1 text-2xl font-extrabold text-gray-900">Query Opportunities</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Mine imported Search Console queries for new guide ideas, missing sections, CTR fixes, and supporting clusters.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href="/app/admin/seo/search-console-import" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">
                        Import GSC CSV
                    </Link>
                    <Link href="/app/admin/seo/search-console" className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white">
                        Search Console Report
                    </Link>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
                {GROUPS.map((group) => {
                    const count = opportunities.filter((opportunity) => opportunity.type === group.type).length;
                    return (
                        <div key={group.type} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-400">{group.title}</div>
                            <div className="mt-2 text-3xl font-extrabold text-gray-900">{count}</div>
                        </div>
                    );
                })}
            </div>

            {GROUPS.map((group) => (
                <section key={group.type} className="space-y-3">
                    <div>
                        <h2 className="text-xl font-extrabold text-gray-900">{group.title}</h2>
                        <p className="mt-1 text-sm text-gray-500">{group.description}</p>
                    </div>
                    <OpportunityTable opportunities={opportunities.filter((opportunity) => opportunity.type === group.type)} />
                </section>
            ))}
        </div>
    );
}
