import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecentOutboundRecords, type CanonicalOutboundRecord } from "@/lib/outbound-reporting";

export const dynamic = "force-dynamic";
export const metadata = { title: "Outbound Analytics | Admin" };

const RECENT_RECORD_LIMIT = 100;
const GROUP_LIMIT = 5;

type MetricCardProps = {
    label: string;
    value: string | number;
    helper?: string;
    tone?: "default" | "warning";
};

type GroupRow = {
    label: string;
    count: number;
    payout: number | null;
};

type MissingAttributionSummary = {
    clickLocation: number;
    sourceContext: number;
    platformName: number;
    offerOrGameTitle: number;
    destinationUrl: number;
};

export default async function AdminOutboundPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile || !["admin", "editor"].includes(profile.role)) {
        redirect("/app/dashboard");
    }

    const records = await getRecentOutboundRecords({ limit: RECENT_RECORD_LIMIT, supabase });
    const typeCounts = records.reduce<Record<string, number>>((acc, record) => {
        acc[record.outbound_type] = (acc[record.outbound_type] ?? 0) + 1;
        return acc;
    }, {});
    const missing = summarizeMissingAttribution(records);
    const highestPayout = records.reduce((max, record) => {
        const payout = record.total_payout_usd ?? record.payout_usd;
        return typeof payout === "number" && Number.isFinite(payout) ? Math.max(max, payout) : max;
    }, 0);
    const sortedTimes = records
        .map((record) => record.created_at)
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => Date.parse(a) - Date.parse(b));
    const oldestLoaded = sortedTimes[0];
    const newestLoaded = sortedTimes[sortedTimes.length - 1];
    const warningItems = buildMissingWarnings(missing);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">Normalized tracking</p>
                    <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">Outbound analytics</h1>
                    <p className="mt-1 max-w-3xl text-sm text-gray-500">
                        Recent clicks from offer_clicks, site_offer_clicks, and platform_clicks using the normalized attribution fields captured by redirect tracking.
                    </p>
                    <p className="mt-1 text-xs font-medium text-gray-400">
                        Showing the last {records.length} loaded record{records.length !== 1 ? "s" : ""}. Newest: {formatDateTime(newestLoaded)}. Oldest: {formatDateTime(oldestLoaded)}.
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center shadow-sm">
                    <div className="text-2xl font-extrabold text-gray-900">{records.length}</div>
                    <div className="text-xs font-medium text-gray-500">records loaded</div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
                <InfoChip label={`${typeCounts.offer ?? 0} offer`} />
                <InfoChip label={`${typeCounts.site_offer ?? 0} site offer`} />
                <InfoChip label={`${typeCounts.platform ?? 0} platform`} />
                <InfoChip label="Source table shown per row" subtle />
            </div>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total records loaded" value={records.length} helper={`Last ${RECENT_RECORD_LIMIT} canonical outbound clicks`} />
                <MetricCard label="Offer clicks" value={typeCounts.offer ?? 0} helper="Legacy offer_clicks rows" />
                <MetricCard label="Site offer clicks" value={typeCounts.site_offer ?? 0} helper="Manual site_offer_clicks rows" />
                <MetricCard label="Platform clicks" value={typeCounts.platform ?? 0} helper="platform_clicks rows" />
                <MetricCard label="Missing location" value={missing.clickLocation} helper="Rows without click_location" tone={missing.clickLocation > 0 ? "warning" : "default"} />
                <MetricCard label="Missing source" value={missing.sourceContext} helper="Rows without source_context" tone={missing.sourceContext > 0 ? "warning" : "default"} />
                <MetricCard label="Missing destination" value={missing.destinationUrl} helper="Rows without destination_url" tone={missing.destinationUrl > 0 ? "warning" : "default"} />
                <MetricCard label="Highest payout seen" value={highestPayout > 0 ? formatMoney(highestPayout) : "-"} helper="Max total_payout_usd in loaded rows" />
            </section>

            {warningItems.length > 0 ? (
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-sm font-extrabold text-amber-900">Missing attribution cleanup</h2>
                            <p className="mt-1 max-w-3xl text-sm text-amber-800">
                                Some loaded outbound clicks are missing fields that make monetization reporting harder. Fix these at the CTA source before adding more dashboard logic.
                            </p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                            {warningItems.length} warning{warningItems.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                    <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                        {warningItems.map((item) => (
                            <div key={item.label} className="rounded-xl border border-amber-200 bg-white/70 px-3 py-2">
                                <div className="text-lg font-extrabold text-amber-900">{item.count}</div>
                                <div className="text-xs font-semibold text-amber-800">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            <section className="grid gap-4 xl:grid-cols-3">
                <GroupCard title="Top platforms" rows={groupRecords(records, (record) => record.platform_name, GROUP_LIMIT)} />
                <GroupCard title="Top providers" rows={groupRecords(records, (record) => record.provider_name, GROUP_LIMIT)} />
                <GroupCard title="Top games/offers" rows={groupRecords(records, offerOrGameLabel, GROUP_LIMIT)} />
                <GroupCard title="Top source contexts" rows={groupRecords(records, (record) => record.source_context, GROUP_LIMIT)} />
                <GroupCard title="Top click locations" rows={groupRecords(records, (record) => record.click_location, GROUP_LIMIT)} />
                <GroupCard title="Affiliate mode split" rows={groupRecords(records, (record) => record.affiliate_mode, GROUP_LIMIT)} />
            </section>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Canonical outbound stream</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Verify offer titles, game titles, payout attribution, click context, destination URLs, and which table produced each row.
                        </p>
                    </div>
                    <Link
                        href="/app/admin"
                        className="text-sm font-semibold text-gray-600 transition hover:text-gray-900"
                    >
                        Back to admin
                    </Link>
                </div>

                <div className="mt-5 overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-4 py-3 text-left">Time (ET)</th>
                                <th className="px-4 py-3 text-left">Source table</th>
                                <th className="px-4 py-3 text-left">Offer / Game</th>
                                <th className="px-4 py-3 text-left">Platform / Provider</th>
                                <th className="px-4 py-3 text-right">Payout</th>
                                <th className="px-4 py-3 text-left">Click context</th>
                                <th className="px-4 py-3 text-left">Destination</th>
                                <th className="px-4 py-3 text-left">Record IDs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.map((record, index) => (
                                <tr key={`${record.outbound_type}-${record.offer_id ?? record.platform_id ?? "row"}-${record.created_at ?? index}`}>
                                    <td className="px-4 py-3 text-xs text-gray-500">
                                        {formatDateTime(record.created_at)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                            {record.source_table ?? sourceTableForType(record.outbound_type)}
                                        </span>
                                        <div className="mt-1 text-[11px] text-gray-400">{record.outbound_type}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="min-w-[220px]">
                                            <div className="font-semibold text-gray-900">
                                                {record.offer_title ?? fallbackTitleForType(record.outbound_type)}
                                            </div>
                                            <div className="mt-0.5 text-xs text-gray-500">
                                                {record.game_title ?? "No game title"}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="min-w-[190px]">
                                            <div className="font-medium text-gray-800">
                                                {record.platform_name ?? "No platform"}
                                            </div>
                                            <div className="mt-0.5 text-xs text-gray-500">
                                                {record.provider_name ?? "No provider"}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                        <div>{formatMoney(record.total_payout_usd ?? record.payout_usd)}</div>
                                        {record.total_payout_usd != null && record.payout_usd != null && record.total_payout_usd !== record.payout_usd ? (
                                            <div className="text-[11px] font-normal text-gray-400">step {formatMoney(record.payout_usd)}</div>
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600">
                                        <div className="font-semibold text-gray-700">{record.click_location ?? "No location"}</div>
                                        <div className="mt-1 text-gray-400">{record.source_context ?? "No source context"}</div>
                                        {record.affiliate_mode ? <div className="mt-1 text-gray-400">affiliate: {record.affiliate_mode}</div> : null}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600">
                                        {record.destination_url ? (
                                            <span className="block max-w-[240px] truncate" title={record.destination_url}>
                                                {record.destination_url}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">No destination stored</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-[11px] text-gray-500">
                                        <div>offer: {record.offer_id ?? "-"}</div>
                                        <div>platform: {record.platform_id ?? "-"}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {records.length === 0 ? (
                        <div className="px-4 py-14 text-center">
                            <div className="text-sm font-semibold text-gray-700">No outbound records yet</div>
                            <p className="mt-1 text-xs text-gray-500">
                                Trigger an offer, site offer, or platform redirect, then refresh this page. This view reads only persisted click tables.
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, helper, tone = "default" }: MetricCardProps) {
    const warning = tone === "warning";
    return (
        <div className={`rounded-2xl border p-4 shadow-sm ${
            warning ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-white"
        }`}>
            <div className={`text-[11px] font-bold uppercase tracking-widest ${
                warning ? "text-amber-700" : "text-gray-400"
            }`}>
                {label}
            </div>
            <div className={`mt-2 text-2xl font-extrabold ${
                warning ? "text-amber-950" : "text-gray-900"
            }`}>
                {value}
            </div>
            {helper ? <div className={`mt-1 text-xs ${warning ? "text-amber-700" : "text-gray-500"}`}>{helper}</div> : null}
        </div>
    );
}

function GroupCard({ title, rows }: { title: string; rows: GroupRow[] }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-extrabold text-gray-900">{title}</h2>
                <span className="text-[11px] font-semibold text-gray-400">Top {GROUP_LIMIT}</span>
            </div>
            <div className="mt-3 divide-y divide-gray-100">
                {rows.length > 0 ? rows.map((row, index) => (
                    <div key={`${title}-${row.label}`} className="grid grid-cols-[1fr_auto] gap-3 py-2.5 text-sm">
                        <div className="min-w-0">
                            <div className="truncate font-semibold text-gray-900" title={row.label}>
                                {index + 1}. {row.label}
                            </div>
                            <div className="mt-0.5 text-xs text-gray-400">
                                Best payout {formatMoney(row.payout ?? undefined)}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-extrabold text-gray-900">{row.count}</div>
                            <div className="text-[11px] text-gray-400">clicks</div>
                        </div>
                    </div>
                )) : (
                    <div className="py-8 text-center text-sm font-semibold text-gray-500">
                        No data in loaded records.
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoChip({ label, subtle }: { label: string; subtle?: boolean }) {
    return (
        <span
            className={`rounded-full px-2.5 py-1 font-semibold ${
                subtle ? "bg-gray-100 text-gray-500" : "bg-gray-900 text-white"
            }`}
        >
            {label}
        </span>
    );
}

function formatMoney(value?: number | null) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "-";
    }

    return `$${value.toFixed(2)}`;
}

function formatDateTime(value?: string) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    }).format(date);
}

function sourceTableForType(type: string) {
    if (type === "site_offer") return "site_offer_clicks";
    if (type === "platform") return "platform_clicks";
    return "offer_clicks";
}

function fallbackTitleForType(type: string) {
    if (type === "platform") return "Platform click";
    if (type === "site_offer") return "Site offer click";
    return "Offer click";
}

function groupRecords(
    records: CanonicalOutboundRecord[],
    getKey: (record: CanonicalOutboundRecord) => string | null | undefined,
    limit: number,
): GroupRow[] {
    const groups = new Map<string, { count: number; payout: number | null }>();

    for (const record of records) {
        const key = normalizeGroupLabel(getKey(record));
        const payout = record.total_payout_usd ?? record.payout_usd ?? null;
        const current = groups.get(key) ?? { count: 0, payout: null };
        current.count += 1;
        if (typeof payout === "number" && Number.isFinite(payout)) {
            current.payout = Math.max(current.payout ?? 0, payout);
        }
        groups.set(key, current);
    }

    return Array.from(groups.entries())
        .map(([label, stats]) => ({ label, count: stats.count, payout: stats.payout }))
        .sort((a, b) => b.count - a.count || (b.payout ?? 0) - (a.payout ?? 0) || a.label.localeCompare(b.label))
        .slice(0, limit);
}

function normalizeGroupLabel(value: string | null | undefined) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : "Missing";
}

function offerOrGameLabel(record: CanonicalOutboundRecord) {
    if (record.game_title && record.offer_title && record.game_title !== record.offer_title) {
        return `${record.game_title} / ${record.offer_title}`;
    }
    return record.game_title ?? record.offer_title ?? fallbackTitleForType(record.outbound_type);
}

function summarizeMissingAttribution(records: CanonicalOutboundRecord[]): MissingAttributionSummary {
    return records.reduce<MissingAttributionSummary>((acc, record) => {
        if (!record.click_location) acc.clickLocation += 1;
        if (!record.source_context) acc.sourceContext += 1;
        if (!record.platform_name) acc.platformName += 1;
        if (!record.offer_title && !record.game_title) acc.offerOrGameTitle += 1;
        if (!record.destination_url) acc.destinationUrl += 1;
        return acc;
    }, {
        clickLocation: 0,
        sourceContext: 0,
        platformName: 0,
        offerOrGameTitle: 0,
        destinationUrl: 0,
    });
}

function buildMissingWarnings(missing: MissingAttributionSummary) {
    return [
        { label: "Missing click_location", count: missing.clickLocation },
        { label: "Missing source_context", count: missing.sourceContext },
        { label: "Missing platform_name", count: missing.platformName },
        { label: "Missing offer/game title", count: missing.offerOrGameTitle },
        { label: "Missing destination_url", count: missing.destinationUrl },
    ].filter((item) => item.count > 0);
}
