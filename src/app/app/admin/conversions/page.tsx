import { AdminPageHeader, AdminPanel, AdminStatCard } from "@/components/admin/AdminUi";
import { formatCents } from "@/lib/earn-rewards";
import { requireAdminOrEditor } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conversions | EarnGrind Admin" };

type ConversionRow = {
    id: string;
    click_id: string;
    external_transaction_id: string;
    status: string;
    provider_status: string | null;
    review_status: string;
    review_reasons: string[] | null;
    gross_revenue_cents: number;
    user_reward_cents: number;
    currency: string;
    user_id: string | null;
    source_ip: string | null;
    raw_payload: unknown;
    created_at: string;
    offer: { title: string; slug: string } | { title: string; slug: string }[] | null;
    partner: { name: string; slug: string } | { name: string; slug: string }[] | null;
    provider_config: { provider_slug: string; signature_algorithm: string; secret_type: string } | { provider_slug: string; signature_algorithm: string; secret_type: string }[] | null;
    receipt: { id: string; failure_code: string | null; signature_valid: boolean; replay_key: string | null; source_ip: string | null } | { id: string; failure_code: string | null; signature_valid: boolean; replay_key: string | null; source_ip: string | null }[] | null;
};

export default async function ConversionsAdminPage() {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) redirect(auth.status === 401 ? "/login" : "/app/dashboard");

    const db = createAdminClient();
    const { data, error } = await db
        .from("conversion_events")
        .select(`
            id,
            click_id,
            external_transaction_id,
            status,
            provider_status,
            review_status,
            review_reasons,
            gross_revenue_cents,
            user_reward_cents,
            currency,
            user_id,
            source_ip,
            raw_payload,
            created_at,
            offer:earn_offers(title, slug),
            partner:offer_partners(name, slug),
            provider_config:offer_partner_postback_configs!conversion_events_provider_config_id_fkey(provider_slug, signature_algorithm, secret_type),
            receipt:postback_receipts!conversion_events_postback_receipt_id_fkey(id, failure_code, signature_valid, replay_key, source_ip)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("[admin/conversions] query failed", error);
    }

    const rows = (data ?? []) as ConversionRow[];
    const pending = rows.filter((row) => row.status === "pending").length;
    const approved = rows.filter((row) => row.status === "approved").length;
    const rejectedOrReversed = rows.filter((row) => row.status === "rejected" || row.status === "reversed").length;

    return (
        <div className="space-y-6">
            <AdminPageHeader
                eyebrow="Tracked Rewards"
                title="Conversions"
                description="Recent test postback conversion events for EarnGrind tracked offers."
            />

            <section className="grid gap-3 sm:grid-cols-3">
                <AdminStatCard label="Pending" value={pending} tone={pending > 0 ? "warning" : "neutral"} />
                <AdminStatCard label="Approved" value={approved} tone={approved > 0 ? "good" : "neutral"} />
                <AdminStatCard label="Rejected/reversed" value={rejectedOrReversed} tone={rejectedOrReversed > 0 ? "critical" : "neutral"} />
            </section>

            <AdminPanel title="Recent conversion events" description="Events are idempotent by partner and external transaction id.">
                {error ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                        Failed to load conversion events.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                                <tr>
                                    <th className="px-3 py-2">Conversion</th>
                                    <th className="px-3 py-2">Offer</th>
                                    <th className="px-3 py-2">Partner</th>
                                    <th className="px-3 py-2">User</th>
                                    <th className="px-3 py-2">Amounts</th>
                                    <th className="px-3 py-2">Raw payload</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((row) => {
                                    const offer = Array.isArray(row.offer) ? row.offer[0] : row.offer;
                                    const partner = Array.isArray(row.partner) ? row.partner[0] : row.partner;
                                    const providerConfig = Array.isArray(row.provider_config) ? row.provider_config[0] : row.provider_config;
                                    const receipt = Array.isArray(row.receipt) ? row.receipt[0] : row.receipt;
                                    return (
                                        <tr key={row.id} className="align-top">
                                            <td className="px-3 py-3">
                                                {statusBadge(row.status)}
                                                {reviewBadge(row.review_status)}
                                                <div className="mt-2 font-mono text-xs text-gray-500">{row.click_id}</div>
                                                <div className="mt-1 text-xs text-gray-500">{row.external_transaction_id}</div>
                                                <div className="mt-1 text-xs text-gray-400">{formatDate(row.created_at)}</div>
                                                {row.provider_status ? (
                                                    <div className="mt-1 text-xs text-gray-500">Provider: {row.provider_status}</div>
                                                ) : null}
                                                {row.review_reasons?.length ? (
                                                    <div className="mt-2 max-w-xs text-xs font-semibold text-amber-700">
                                                        {row.review_reasons.join(", ")}
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="font-bold text-gray-950">{offer?.title ?? "Unknown offer"}</div>
                                                <div className="mt-1 text-xs text-gray-500">{offer?.slug ?? ""}</div>
                                            </td>
                                            <td className="px-3 py-3 text-gray-600">
                                                <div>{partner?.name ?? "Unknown"}</div>
                                                <div className="mt-1 font-mono text-xs text-gray-500">{providerConfig?.provider_slug ?? "test/manual"}</div>
                                                <div className="mt-1 text-xs text-gray-500">{providerConfig ? `${providerConfig.secret_type} / ${providerConfig.signature_algorithm}` : ""}</div>
                                            </td>
                                            <td className="px-3 py-3 font-mono text-xs text-gray-500">{row.user_id ?? "Anonymous"}</td>
                                            <td className="px-3 py-3">
                                                <div className="font-semibold text-gray-800">Gross: {formatCents(row.gross_revenue_cents, row.currency)}</div>
                                                <div className="mt-1 font-semibold text-gray-800">Reward: {formatCents(row.user_reward_cents, row.currency)}</div>
                                            </td>
                                            <td className="px-3 py-3">
                                                {receipt ? (
                                                    <div className="mb-2 rounded-lg border border-gray-100 bg-gray-50 p-2 text-xs text-gray-600">
                                                        <div>Receipt: <span className="font-mono">{receipt.id.slice(0, 8)}</span></div>
                                                        <div>Signature: {receipt.signature_valid ? "valid" : "invalid"}</div>
                                                        <div>Failure: {receipt.failure_code ?? "-"}</div>
                                                        <div>IP: {receipt.source_ip ?? row.source_ip ?? "-"}</div>
                                                        <div>Replay key: {receipt.replay_key ? receipt.replay_key.slice(0, 36) : "-"}</div>
                                                    </div>
                                                ) : null}
                                                <pre className="max-w-sm overflow-hidden rounded-lg bg-gray-50 p-2 text-xs leading-relaxed text-gray-600">
                                                    {payloadPreview(row.raw_payload)}
                                                </pre>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {rows.length === 0 ? (
                                    <tr>
                                        <td className="px-3 py-6 text-gray-500" colSpan={6}>No conversion events yet.</td>
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
            : "border-red-200 bg-red-50 text-red-800";

    return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold capitalize ${classes}`}>{status}</span>;
}

function reviewBadge(status: string) {
    if (!status || status === "clean") return null;
    const classes = status === "flagged"
        ? "ml-2 border-amber-200 bg-amber-50 text-amber-800"
        : "ml-2 border-gray-200 bg-gray-50 text-gray-700";

    return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold capitalize ${classes}`}>{status}</span>;
}

function payloadPreview(payload: unknown): string {
    const value = JSON.stringify(payload ?? {}, null, 2);
    return value.length > 360 ? `${value.slice(0, 360)}...` : value;
}

function formatDate(value: string) {
    return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
