import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { summarizeEventsByGuide, type GuideEventRow } from "@/lib/guide-event-stats";
import {
    findSerpRefreshCandidates,
    summarizeSerpRefreshCandidates,
    type SerpRefreshCandidate,
    type SerpRefreshGuideInput,
    type SerpRefreshMetricInput,
    type SerpRefreshPriority,
} from "@/lib/serp-refresh-candidates";
import SerpRefreshActions from "./SerpRefreshActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "SERP Refresh | Admin" };

const PRIORITY_STYLES: Record<SerpRefreshPriority, string> = {
    high: "bg-red-50 text-red-700 border-red-100",
    medium: "bg-amber-50 text-amber-800 border-amber-100",
    low: "bg-gray-50 text-gray-600 border-gray-100",
};

function daysAgo(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
}

function formatCtr(value: number) {
    return `${(value * 100).toFixed(2)}%`;
}

function SummaryCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</div>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{value}</div>
        </div>
    );
}

function PriorityBadge({ priority }: { priority: SerpRefreshPriority }) {
    return (
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold capitalize ${PRIORITY_STYLES[priority]}`}>
            {priority}
        </span>
    );
}

function RefreshPlan({ candidate }: { candidate: SerpRefreshCandidate }) {
    const plan = candidate.refreshPlan;
    return (
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Refresh Plan</div>
            <div className="mt-3 grid gap-3 text-xs text-gray-600 lg:grid-cols-2">
                <div>
                    <div className="font-bold text-gray-900">Current issue</div>
                    <p className="mt-1">{plan.currentIssue}</p>
                </div>
                <div>
                    <div className="font-bold text-gray-900">Queries to target</div>
                    <p className="mt-1">{plan.queriesToTarget.join(", ") || "No query data available."}</p>
                </div>
                <div>
                    <div className="font-bold text-gray-900">Suggested title/meta change</div>
                    <p className="mt-1">{plan.suggestedTitleMetaChange}</p>
                </div>
                <div>
                    <div className="font-bold text-gray-900">Suggested H2 to add</div>
                    <p className="mt-1">{plan.suggestedH2ToAdd}</p>
                </div>
                <div>
                    <div className="font-bold text-gray-900">Suggested internal links</div>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                        {plan.suggestedInternalLinks.map((link) => <li key={link}>{link}</li>)}
                    </ul>
                </div>
                <div>
                    <div className="font-bold text-gray-900">CTA improvement suggestion</div>
                    <p className="mt-1">{plan.ctaImprovementSuggestion}</p>
                    <div className="mt-2 font-bold text-gray-900">Decision</div>
                    <p className="mt-1">
                        {plan.recommendation === "create_supporting_guide" ? "Create supporting guide" : "Update current page"}
                    </p>
                </div>
            </div>
        </div>
    );
}

function CandidateCard({ candidate }: { candidate: SerpRefreshCandidate }) {
    const topQuery = candidate.topQueries[0];

    return (
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/app/admin/guides/${candidate.guideId}/edit`} className="text-lg font-extrabold text-gray-900 hover:underline">
                            {candidate.title}
                        </Link>
                        <PriorityBadge priority={candidate.priority} />
                    </div>
                    <div className="mt-1 text-xs font-semibold text-gray-500">
                        Current keyword: {candidate.currentKeyword ?? "n/a"}
                    </div>
                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-5">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Top query</div>
                            <div className="mt-1 font-bold text-gray-900">{topQuery?.query ?? "n/a"}</div>
                        </div>
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Impressions</div>
                            <div className="mt-1 font-bold text-gray-900">{topQuery?.impressions ?? candidate.impressions}</div>
                        </div>
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">CTR</div>
                            <div className="mt-1 font-bold text-gray-900">{formatCtr(topQuery?.ctr ?? candidate.ctr)}</div>
                        </div>
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Position</div>
                            <div className="mt-1 font-bold text-gray-900">{(topQuery?.position ?? candidate.averagePosition).toFixed(1)}</div>
                        </div>
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Priority</div>
                            <div className="mt-1 font-bold text-gray-900">{candidate.priorityScore}</div>
                        </div>
                    </div>
                </div>
                <div className="xl:max-w-[520px]">
                    <SerpRefreshActions candidate={candidate} />
                </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Refresh reason</div>
                    <p className="mt-1 text-sm text-gray-600">{candidate.reason}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {candidate.reasons.map((reason) => (
                            <span key={reason} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600">
                                {reason}
                            </span>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Suggested updates</div>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-gray-600">
                        {candidate.suggestedUpdates.map((update) => <li key={update}>{update}</li>)}
                    </ul>
                </div>
            </div>

            <RefreshPlan candidate={candidate} />
        </article>
    );
}

export default async function SerpRefreshPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

    const [{ data: guides }, { data: metrics }, { data: events }] = await Promise.all([
        supabase
            .from("guides")
            .select("id, title, slug, keyword_target, body_md, seo_title, seo_description, status, content_status, updated_at, published_at")
            .order("updated_at", { ascending: false })
            .limit(1000),
        supabase
            .from("guide_search_console_metrics")
            .select("id, guide_id, page_url, query, clicks, impressions, ctr, position")
            .not("guide_id", "is", null)
            .order("impressions", { ascending: false })
            .limit(20000),
        supabase
            .from("guide_events")
            .select("guide_id, guide_slug, event_type, target_url, created_at")
            .gte("created_at", daysAgo(30))
            .limit(20000),
    ]);

    const guideRows = (guides ?? []) as SerpRefreshGuideInput[];
    const metricRows = (metrics ?? []).map((metric) => ({
        id: metric.id,
        guide_id: metric.guide_id,
        page_url: metric.page_url,
        query: metric.query,
        clicks: Number(metric.clicks ?? 0),
        impressions: Number(metric.impressions ?? 0),
        ctr: Number(metric.ctr ?? 0),
        position: Number(metric.position ?? 0),
    })) satisfies SerpRefreshMetricInput[];
    const statsByGuide = summarizeEventsByGuide((events ?? []) as GuideEventRow[]);
    const engagement = Array.from(statsByGuide.entries())
        .filter(([guideId]) => guideRows.some((guide) => guide.id === guideId))
        .map(([guideId, stats]) => ({
            guideId,
            views: stats.views,
            offerClicks: stats.offerClicks,
            platformClicks: stats.platformClicks,
        }));
    const candidates = findSerpRefreshCandidates({
        guides: guideRows,
        metrics: metricRows,
        engagement,
    });
    const summary = summarizeSerpRefreshCandidates(candidates);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">SEO</p>
                    <h1 className="mt-1 text-2xl font-extrabold text-gray-900">SERP Refresh</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Prioritize updates to existing guide pages that already earn Search Console impressions.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href="/app/admin/seo/search-console-import" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">
                        Import GSC CSV
                    </Link>
                    <Link href="/app/admin/seo/query-opportunities" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">
                        Query Opportunities
                    </Link>
                    <Link href="/app/admin/content-queue" className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white">
                        Content Queue
                    </Link>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-5">
                <SummaryCard label="Refresh candidates" value={summary.totalRefreshCandidates} />
                <SummaryCard label="High priority" value={summary.highPriorityCount} />
                <SummaryCard label="Quick wins" value={summary.quickWinsCount} />
                <SummaryCard label="High impressions / low CTR" value={summary.highImpressionsLowCtrCount} />
                <SummaryCard label="Striking distance" value={summary.strikingDistanceCount} />
            </div>

            <div className="space-y-4">
                {candidates.map((candidate) => <CandidateCard key={candidate.guideId} candidate={candidate} />)}
                {candidates.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm font-semibold text-gray-500 shadow-sm">
                        No refresh candidates yet. Import Search Console page/query rows for existing guides, then return here.
                    </div>
                ) : null}
            </div>
        </div>
    );
}
