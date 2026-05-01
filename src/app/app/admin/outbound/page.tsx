import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecentOutboundRecords } from "@/lib/outbound-reporting";

export const dynamic = "force-dynamic";
export const metadata = { title: "Outbound Analytics | Admin" };

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

    const records = await getRecentOutboundRecords({ limit: 100, supabase });
    const typeCounts = records.reduce<Record<string, number>>((acc, record) => {
        acc[record.outbound_type] = (acc[record.outbound_type] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">Normalized tracking</p>
                    <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">Outbound analytics</h1>
                    <p className="mt-1 max-w-3xl text-sm text-gray-500">
                        Recent clicks from offer_clicks, site_offer_clicks, and platform_clicks using the normalized attribution fields captured by redirect tracking.
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
                                <th className="px-4 py-3 text-left">Time</th>
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

function formatMoney(value?: number) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "-";
    }

    return `$${value.toFixed(2)}`;
}

function formatDateTime(value?: string) {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
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
