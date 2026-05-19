import { AdminPageHeader, AdminPanel, AdminStatCard } from "@/components/admin/AdminUi";
import { formatCents } from "@/lib/earn-rewards";
import { requireAdminOrEditor } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reward Ledger | EarnGrind Admin" };

type LedgerRow = {
    id: string;
    user_id: string;
    status: string;
    amount_cents: number;
    currency: string;
    available_at: string | null;
    paid_at: string | null;
    reversed_at: string | null;
    created_at: string;
    offer: { title: string; slug: string } | { title: string; slug: string }[] | null;
    partner: { name: string; slug: string } | { name: string; slug: string }[] | null;
    conversion: { external_transaction_id: string; click_id: string; provider_status: string | null; review_status: string } | { external_transaction_id: string; click_id: string; provider_status: string | null; review_status: string }[] | null;
};

const STATUSES = ["pending", "approved", "rejected", "reversed", "paid"] as const;

export default async function RewardsAdminPage() {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) redirect(auth.status === 401 ? "/login" : "/app/dashboard");

    const db = createAdminClient();
    const { data, error } = await db
        .from("user_reward_ledger")
        .select(`
            id,
            user_id,
            status,
            amount_cents,
            currency,
            available_at,
            paid_at,
            reversed_at,
            created_at,
            offer:earn_offers(title, slug),
            partner:offer_partners(name, slug),
            conversion:conversion_events(external_transaction_id, click_id, provider_status, review_status)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("[admin/rewards] query failed", error);
    }

    const rows = (data ?? []) as LedgerRow[];
    const totals = Object.fromEntries(
        STATUSES.map((status) => [
            status,
            rows
                .filter((row) => row.status === status)
                .reduce((sum, row) => sum + Number(row.amount_cents ?? 0), 0),
        ]),
    ) as Record<typeof STATUSES[number], number>;

    return (
        <div className="space-y-6">
            <AdminPageHeader
                eyebrow="Tracked Rewards"
                title="Reward ledger"
                description="Read-only ledger rows created from test conversion postbacks."
            />

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <AdminStatCard label="Pending" value={formatCents(totals.pending)} tone={totals.pending > 0 ? "warning" : "neutral"} />
                <AdminStatCard label="Available" value={formatCents(totals.approved)} tone={totals.approved > 0 ? "good" : "neutral"} />
                <AdminStatCard label="Rejected" value={formatCents(totals.rejected)} />
                <AdminStatCard label="Reversed" value={formatCents(totals.reversed)} tone={totals.reversed > 0 ? "critical" : "neutral"} />
                <AdminStatCard label="Paid" value={formatCents(totals.paid)} />
            </section>

            <AdminPanel title="Recent ledger rows" description="No payout or withdrawal flow exists in Phase 1.">
                {error ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                        Failed to load reward ledger rows.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                                <tr>
                                    <th className="px-3 py-2">Reward</th>
                                    <th className="px-3 py-2">User</th>
                                    <th className="px-3 py-2">Offer</th>
                                    <th className="px-3 py-2">Partner</th>
                                    <th className="px-3 py-2">Conversion</th>
                                    <th className="px-3 py-2">Dates</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((row) => {
                                    const offer = Array.isArray(row.offer) ? row.offer[0] : row.offer;
                                    const partner = Array.isArray(row.partner) ? row.partner[0] : row.partner;
                                    const conversion = Array.isArray(row.conversion) ? row.conversion[0] : row.conversion;
                                    return (
                                        <tr key={row.id} className="align-top">
                                            <td className="px-3 py-3">
                                                {statusBadge(row.status)}
                                                <div className="mt-2 font-bold text-gray-950">{formatCents(row.amount_cents, row.currency)}</div>
                                            </td>
                                            <td className="px-3 py-3 font-mono text-xs text-gray-500">{row.user_id}</td>
                                            <td className="px-3 py-3">
                                                <div className="font-bold text-gray-950">{offer?.title ?? "Unknown offer"}</div>
                                                <div className="mt-1 text-xs text-gray-500">{offer?.slug ?? ""}</div>
                                            </td>
                                            <td className="px-3 py-3 text-gray-600">{partner?.name ?? "Unknown"}</td>
                                            <td className="px-3 py-3">
                                                <div className="font-mono text-xs text-gray-500">{conversion?.click_id ?? ""}</div>
                                                <div className="mt-1 text-xs text-gray-500">{conversion?.external_transaction_id ?? ""}</div>
                                                {conversion?.provider_status ? (
                                                    <div className="mt-1 text-xs text-gray-500">Provider: {conversion.provider_status}</div>
                                                ) : null}
                                                {conversion?.review_status && conversion.review_status !== "clean" ? (
                                                    <div className="mt-1 text-xs font-semibold text-amber-700">Review: {conversion.review_status}</div>
                                                ) : null}
                                            </td>
                                            <td className="px-3 py-3 text-xs leading-relaxed text-gray-500">
                                                <div>Created: {formatDate(row.created_at)}</div>
                                                <div>Available: {formatDate(row.available_at)}</div>
                                                <div>Reversed: {formatDate(row.reversed_at)}</div>
                                                <div>Paid: {formatDate(row.paid_at)}</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {rows.length === 0 ? (
                                    <tr>
                                        <td className="px-3 py-6 text-gray-500" colSpan={6}>No reward ledger rows yet.</td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                )}
            </AdminPanel>
        </div>
    );
}

function statusBadge(status: string) {
    const classes = status === "approved"
        ? "border-lime-200 bg-lime-50 text-lime-800"
        : status === "pending"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : status === "paid"
                ? "border-blue-200 bg-blue-50 text-blue-800"
                : "border-red-200 bg-red-50 text-red-800";

    return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold capitalize ${classes}`}>{status}</span>;
}

function formatDate(value: string | null) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}
