import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader, AdminPanel, AdminStatCard } from "@/components/admin/AdminUi";
import { requireAdminOrEditor } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Revenue Intelligence | Admin" };

type RevenueEventRow = {
    id: string;
    event_name: string;
    route_path: string;
    route_group: string;
    entity_type: string | null;
    entity_slug: string | null;
    guide_slug: string | null;
    game_slug: string | null;
    offer_id: string | null;
    platform_slug: string | null;
    provider_name: string | null;
    cta_location: string | null;
    source_context: string | null;
    target_url: string | null;
    outbound_click_table: string | null;
    outbound_click_id: string | null;
    conversion_event_id: string | null;
    occurred_at: string;
};

type GroupRow = {
    label: string;
    pageViews: number;
    impressions: number;
    ctaClicks: number;
    outboundClicks: number;
    conversions: number;
    ctr: number;
};

function daysAgo(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
}

function countWhere(rows: RevenueEventRow[], eventName: string) {
    return rows.filter((row) => row.event_name === eventName).length;
}

function formatPercent(value: number) {
    return `${(value * 100).toFixed(value > 0 && value < 0.01 ? 2 : 1)}%`;
}

function formatDate(value: string) {
    return new Date(value).toLocaleString("en-US", {
        timeZone: "America/New_York",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function groupBy(rows: RevenueEventRow[], getKey: (row: RevenueEventRow) => string | null | undefined): GroupRow[] {
    const groups = new Map<string, RevenueEventRow[]>();
    for (const row of rows) {
        const key = getKey(row)?.trim() || "Missing";
        groups.set(key, [...(groups.get(key) ?? []), row]);
    }

    return Array.from(groups.entries())
        .map(([label, groupRows]) => {
            const pageViews = countWhere(groupRows, "page_view");
            const impressions = countWhere(groupRows, "cta_impression");
            const ctaClicks = countWhere(groupRows, "cta_click");
            const outboundClicks = countWhere(groupRows, "outbound_click");
            const conversions = countWhere(groupRows, "conversion_postback");
            return {
                label,
                pageViews,
                impressions,
                ctaClicks,
                outboundClicks,
                conversions,
                ctr: impressions > 0 ? ctaClicks / impressions : pageViews > 0 ? ctaClicks / pageViews : 0,
            };
        })
        .sort((a, b) => b.ctaClicks - a.ctaClicks || b.outboundClicks - a.outboundClicks || b.pageViews - a.pageViews)
        .slice(0, 12);
}

export default async function RevenueIntelligencePage() {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) redirect(auth.status === 401 ? "/login" : "/app/dashboard");

    const supabase = createClient();
    const since = daysAgo(30);
    const { data, error } = await supabase
        .from("revenue_events")
        .select(`
            id,
            event_name,
            route_path,
            route_group,
            entity_type,
            entity_slug,
            guide_slug,
            game_slug,
            offer_id,
            platform_slug,
            provider_name,
            cta_location,
            source_context,
            target_url,
            outbound_click_table,
            outbound_click_id,
            conversion_event_id,
            occurred_at
        `)
        .gte("occurred_at", since)
        .order("occurred_at", { ascending: false })
        .limit(1000);

    if (error) {
        console.error("[admin/revenue-intelligence] query failed", error);
    }

    const rows = (data ?? []) as RevenueEventRow[];
    const pageViews = countWhere(rows, "page_view");
    const impressions = countWhere(rows, "cta_impression");
    const ctaClicks = countWhere(rows, "cta_click");
    const outboundClicks = countWhere(rows, "outbound_click");
    const conversions = countWhere(rows, "conversion_postback");
    const routeGroups = groupBy(rows, (row) => row.route_group);
    const ctaLocations = groupBy(rows, (row) => row.cta_location);
    const platformProvider = groupBy(rows, (row) => row.platform_slug ?? row.provider_name);

    return (
        <div className="space-y-6">
            <AdminPageHeader
                eyebrow="Revenue Intelligence"
                title="Revenue Intelligence Loop"
                description="One QA surface for page engagement, CTA activity, outbound clicks, and available conversion/postback events."
                actions={(
                    <>
                        <Link href="/app/admin/outbound" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-300">
                            Outbound analytics
                        </Link>
                        <Link href="/app/admin/conversions" className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800">
                            Conversions
                        </Link>
                    </>
                )}
            />

            {error ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    Revenue events could not be loaded. If this is a fresh environment, apply the revenue_events migration first.
                </p>
            ) : null}

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <AdminStatCard label="Page views" value={pageViews} description="Tracked public page views" />
                <AdminStatCard label="CTA impressions" value={impressions} description="Deduped in browser session" />
                <AdminStatCard label="CTA clicks" value={ctaClicks} description={`CTR ${impressions ? formatPercent(ctaClicks / impressions) : "0.0%"}`} />
                <AdminStatCard label="Outbound clicks" value={outboundClicks} description="Recorded by /go routes" />
                <AdminStatCard label="Conversions" value={conversions} description="Postback conversion hooks" tone={conversions > 0 ? "good" : "neutral"} />
            </section>

            <section className="grid gap-4 xl:grid-cols-3">
                <BreakdownTable title="CTR by route group" rows={routeGroups} primary="route" />
                <BreakdownTable title="CTR by CTA location" rows={ctaLocations} primary="location" />
                <BreakdownTable title="Provider/platform breakdown" rows={platformProvider} primary="provider" />
            </section>

            <AdminPanel
                title="Recent revenue events"
                description="Use this stream for QA after clicking public CTAs. It intentionally stores no raw IP address or full user agent."
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                        <thead className="text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                            <tr>
                                <th className="px-3 py-2">Time</th>
                                <th className="px-3 py-2">Event</th>
                                <th className="px-3 py-2">Route</th>
                                <th className="px-3 py-2">CTA / source</th>
                                <th className="px-3 py-2">Entity</th>
                                <th className="px-3 py-2">Target / link</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((row) => (
                                <tr key={row.id} className="align-top">
                                    <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-500">{formatDate(row.occurred_at)}</td>
                                    <td className="px-3 py-3">
                                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-700">{row.event_name}</span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="font-semibold text-gray-900">{row.route_group}</div>
                                        <div className="mt-1 max-w-xs truncate text-xs text-gray-500" title={row.route_path}>{row.route_path}</div>
                                    </td>
                                    <td className="px-3 py-3 text-xs text-gray-600">
                                        <div className="font-semibold">{row.cta_location ?? "-"}</div>
                                        <div className="mt-1 text-gray-400">{row.source_context ?? "-"}</div>
                                    </td>
                                    <td className="px-3 py-3 text-xs text-gray-600">
                                        <div>{row.entity_type ?? "-"}</div>
                                        <div className="mt-1 text-gray-400">{row.entity_slug ?? row.game_slug ?? row.guide_slug ?? row.offer_id ?? row.platform_slug ?? row.provider_name ?? "-"}</div>
                                    </td>
                                    <td className="px-3 py-3 text-xs text-gray-600">
                                        <div className="max-w-sm truncate" title={row.target_url ?? ""}>{row.target_url ?? "-"}</div>
                                        <div className="mt-1 text-gray-400">
                                            {row.outbound_click_table ?? "no click row"} {row.conversion_event_id ? `conversion ${row.conversion_event_id.slice(0, 8)}` : ""}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-3 py-10 text-center text-sm font-semibold text-gray-500">
                                        No revenue events yet. Visit a wired public page, click a tracked CTA, then refresh.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </AdminPanel>
        </div>
    );
}

function BreakdownTable({ title, rows, primary }: { title: string; rows: GroupRow[]; primary: string }) {
    return (
        <AdminPanel title={title}>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                        <tr>
                            <th className="px-2 py-2">{primary}</th>
                            <th className="px-2 py-2 text-right">Views</th>
                            <th className="px-2 py-2 text-right">Imp.</th>
                            <th className="px-2 py-2 text-right">Clicks</th>
                            <th className="px-2 py-2 text-right">Out</th>
                            <th className="px-2 py-2 text-right">CTR</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((row) => (
                            <tr key={`${title}-${row.label}`}>
                                <td className="max-w-[12rem] truncate px-2 py-2 font-semibold text-gray-900" title={row.label}>{row.label}</td>
                                <td className="px-2 py-2 text-right text-gray-600">{row.pageViews}</td>
                                <td className="px-2 py-2 text-right text-gray-600">{row.impressions}</td>
                                <td className="px-2 py-2 text-right font-bold text-gray-900">{row.ctaClicks}</td>
                                <td className="px-2 py-2 text-right text-gray-600">{row.outboundClicks}</td>
                                <td className="px-2 py-2 text-right font-bold text-gray-900">{formatPercent(row.ctr)}</td>
                            </tr>
                        ))}
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-2 py-8 text-center text-sm font-semibold text-gray-500">No data yet.</td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
        </AdminPanel>
    );
}
