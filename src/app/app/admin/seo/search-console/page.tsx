import Link from "next/link";
import { redirect } from "next/navigation";
import { GOOGLE_SEARCH_CONSOLE_PROVIDER, getGoogleSearchConsoleEnvStatus } from "@/lib/google-search-console";
import { createClient } from "@/lib/supabase/server";
import SearchConsoleSyncPanel from "./SearchConsoleSyncPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search Console Report | Admin" };

type SearchParams = Record<string, string | string[] | undefined>;

function queryValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function parseNumber(value: string | undefined) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function formatCtr(value: number | null | undefined) {
    return `${(Number(value ?? 0) * 100).toFixed(2)}%`;
}

function FilterInput({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
            <input name={name} defaultValue={defaultValue ?? ""} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        </label>
    );
}

export default async function SearchConsoleReportPage({ searchParams }: { searchParams?: SearchParams }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");
    const isAdmin = profile.role === "admin";
    const envStatus = getGoogleSearchConsoleEnvStatus();
    const connectedMessage = queryValue(searchParams?.gsc_connected) === "1" ? "Google Search Console connected." : undefined;
    const oauthError = queryValue(searchParams?.gsc_error);

    let searchConsoleConnected = false;
    if (isAdmin) {
        const { data: token } = await supabase
            .from("admin_integration_tokens")
            .select("id")
            .eq("provider", GOOGLE_SEARCH_CONSOLE_PROVIDER)
            .maybeSingle();
        searchConsoleConnected = Boolean(token?.id);
    }

    const guideFilter = queryValue(searchParams?.guide);
    const queryFilter = queryValue(searchParams?.query);
    const positionMin = parseNumber(queryValue(searchParams?.position_min));
    const positionMax = parseNumber(queryValue(searchParams?.position_max));
    const lowCtr = queryValue(searchParams?.low_ctr) === "1";
    const highImpressions = queryValue(searchParams?.high_impressions) === "1";

    let metricsQuery = supabase
        .from("guide_search_console_metrics")
        .select("id, guide_id, page_url, query, clicks, impressions, ctr, position, date_start, date_end, created_at, guide:guides(id, title, slug, keyword_target)")
        .order("impressions", { ascending: false })
        .limit(500);

    if (queryFilter) metricsQuery = metricsQuery.ilike("query", `%${queryFilter}%`);
    if (positionMin !== null) metricsQuery = metricsQuery.gte("position", positionMin);
    if (positionMax !== null) metricsQuery = metricsQuery.lte("position", positionMax);
    if (lowCtr) metricsQuery = metricsQuery.lt("ctr", 0.02);
    if (highImpressions) metricsQuery = metricsQuery.gte("impressions", 100);

    const { data } = await metricsQuery;
    const rows = (data ?? []).filter((row) => {
        if (!guideFilter) return true;
        const guide = Array.isArray(row.guide) ? row.guide[0] : row.guide;
        return guide?.title?.toLowerCase().includes(guideFilter.toLowerCase())
            || guide?.slug?.toLowerCase().includes(guideFilter.toLowerCase())
            || row.page_url.toLowerCase().includes(guideFilter.toLowerCase());
    });

    const totals = rows.reduce((acc, row) => ({
        clicks: acc.clicks + Number(row.clicks ?? 0),
        impressions: acc.impressions + Number(row.impressions ?? 0),
    }), { clicks: 0, impressions: 0 });
    const avgCtr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">SEO</p>
                    <h1 className="mt-1 text-2xl font-extrabold text-gray-900">Search Console Report</h1>
                    <p className="mt-2 text-sm text-gray-500">Review imported guide query data and spot CTR/ranking opportunities.</p>
                </div>
                <Link href="/app/admin/seo/search-console-import" className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white">
                    Import CSV
                </Link>
            </div>

            <SearchConsoleSyncPanel
                connected={searchConsoleConnected}
                envReady={envStatus.ready}
                missingEnv={envStatus.missing}
                isAdmin={isAdmin}
                message={connectedMessage}
                error={oauthError}
            />

            <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Rows</div>
                    <div className="mt-2 text-3xl font-extrabold text-gray-900">{rows.length}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Impressions</div>
                    <div className="mt-2 text-3xl font-extrabold text-gray-900">{totals.impressions}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400">CTR</div>
                    <div className="mt-2 text-3xl font-extrabold text-lime-700">{formatCtr(avgCtr)}</div>
                </div>
            </div>

            <form className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
                    <FilterInput name="guide" label="Guide" defaultValue={guideFilter} />
                    <FilterInput name="query" label="Query" defaultValue={queryFilter} />
                    <FilterInput name="position_min" label="Position Min" defaultValue={queryValue(searchParams?.position_min)} />
                    <FilterInput name="position_max" label="Position Max" defaultValue={queryValue(searchParams?.position_max)} />
                    <label className="flex items-end gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">
                        <input type="checkbox" name="low_ctr" value="1" defaultChecked={lowCtr} /> Low CTR
                    </label>
                    <label className="flex items-end gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">
                        <input type="checkbox" name="high_impressions" value="1" defaultChecked={highImpressions} /> High impressions
                    </label>
                    <div className="flex items-end gap-2">
                        <button className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white">Filter</button>
                        <Link href="/app/admin/seo/search-console" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700">Clear</Link>
                    </div>
                </div>
            </form>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Guide / Page</th>
                                <th className="px-4 py-3">Query</th>
                                <th className="px-4 py-3 text-center">Clicks</th>
                                <th className="px-4 py-3 text-center">Impressions</th>
                                <th className="px-4 py-3 text-center">CTR</th>
                                <th className="px-4 py-3 text-center">Position</th>
                                <th className="px-4 py-3">Date Range</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((row) => {
                                const guide = Array.isArray(row.guide) ? row.guide[0] : row.guide;
                                return (
                                    <tr key={row.id} className="hover:bg-gray-50">
                                        <td className="min-w-[240px] px-4 py-3">
                                            {guide ? (
                                                <Link href={`/app/admin/guides/${guide.id}/edit`} className="font-bold text-gray-900 hover:underline">{guide.title}</Link>
                                            ) : (
                                                <div className="font-bold text-gray-500">Unmatched page</div>
                                            )}
                                            <div className="mt-0.5 truncate text-xs text-gray-400">{row.page_url}</div>
                                        </td>
                                        <td className="min-w-[220px] px-4 py-3 font-semibold text-gray-700">{row.query}</td>
                                        <td className="px-4 py-3 text-center font-bold text-gray-900">{row.clicks}</td>
                                        <td className="px-4 py-3 text-center font-bold text-gray-900">{row.impressions}</td>
                                        <td className="px-4 py-3 text-center font-bold text-gray-900">{formatCtr(Number(row.ctr ?? 0))}</td>
                                        <td className="px-4 py-3 text-center font-bold text-gray-900">{Number(row.position ?? 0).toFixed(1)}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{row.date_start ?? "n/a"} to {row.date_end ?? "n/a"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {rows.length === 0 ? <div className="p-10 text-center text-sm font-semibold text-gray-500">No imported Search Console rows match these filters.</div> : null}
            </div>
        </div>
    );
}
