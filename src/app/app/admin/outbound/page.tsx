import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecentOutboundRecords } from "@/lib/outbound-reporting";

export const dynamic = "force-dynamic";
export const metadata = { title: "Outbound Inspection | Admin" };

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
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">Internal inspection</p>
                    <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">Recent outbound records</h1>
                    <p className="mt-1 max-w-3xl text-sm text-gray-500">
                        Lightweight validation view for the canonical outbound reporting layer. This page shows the most recent persisted outbound records using the shared business vocabulary.
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
                <InfoChip label={`${typeCounts.platform ?? 0} platform`} subtle />
                <InfoChip label="Platform redirects are log-only for now" subtle />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Canonical record stream</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            High-signal fields only. Use this to verify naming, page context, and payout attribution before building any heavier reporting surface.
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
                                <th className="px-4 py-3 text-left">Type</th>
                                <th className="px-4 py-3 text-left">Offer / Game</th>
                                <th className="px-4 py-3 text-left">Platform / Provider</th>
                                <th className="px-4 py-3 text-right">Payout</th>
                                <th className="px-4 py-3 text-left">Location</th>
                                <th className="px-4 py-3 text-left">Source</th>
                                <th className="px-4 py-3 text-left">Affiliate mode</th>
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
                                            {record.outbound_type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="min-w-[220px]">
                                            <div className="font-semibold text-gray-900">
                                                {record.offer_title ?? "—"}
                                            </div>
                                            <div className="mt-0.5 text-xs text-gray-500">
                                                {record.game_title ?? "No game title"}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="min-w-[190px]">
                                            <div className="font-medium text-gray-800">
                                                {record.platform_name ?? "—"}
                                            </div>
                                            <div className="mt-0.5 text-xs text-gray-500">
                                                {record.provider_name ?? "No provider"}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                        {formatMoney(record.payout_usd)}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600">
                                        {record.click_location ?? "—"}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600">
                                        {record.source_context ?? "—"}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600">
                                        {record.affiliate_mode ?? "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {records.length === 0 ? (
                        <div className="px-4 py-14 text-center">
                            <div className="text-sm font-semibold text-gray-700">No outbound records yet</div>
                            <p className="mt-1 text-xs text-gray-500">
                                Trigger a few offer or site-offer redirects, then refresh this page.
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
        return "—";
    }

    return `$${value.toFixed(2)}`;
}

function formatDateTime(value?: string) {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
