import { AdminPageHeader, AdminPanel, AdminStatCard } from "@/components/admin/AdminUi";
import { formatCents } from "@/lib/earn-rewards";
import { requireAdminOrEditor } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { reverseLedgerRewardAction, updateLedgerReviewAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reward Ledger | EarnGrind Admin" };

type LedgerRow = {
    id: string;
    user_id: string;
    status: string;
    review_status: string;
    review_reasons: string[] | null;
    amount_cents: number;
    currency: string;
    available_at: string | null;
    paid_at: string | null;
    reversed_at: string | null;
    created_at: string;
    updated_at: string;
    offer: { title: string; slug: string } | { title: string; slug: string }[] | null;
    partner: { name: string; slug: string } | { name: string; slug: string }[] | null;
    conversion: {
        id: string;
        external_transaction_id: string;
        click_id: string;
        provider_status: string | null;
        review_status: string;
        review_reasons: string[] | null;
        provider_config: { provider_slug: string } | { provider_slug: string }[] | null;
    } | {
        id: string;
        external_transaction_id: string;
        click_id: string;
        provider_status: string | null;
        review_status: string;
        review_reasons: string[] | null;
        provider_config: { provider_slug: string } | { provider_slug: string }[] | null;
    }[] | null;
};

const STATUSES = ["pending", "approved", "rejected", "reversed", "paid"] as const;

type RewardsAdminPageProps = {
    searchParams?: { updated?: string; error?: string };
};

export default async function RewardsAdminPage({ searchParams }: RewardsAdminPageProps) {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) redirect(auth.status === 401 ? "/login" : "/app/dashboard");

    const db = createAdminClient();
    const [{ data, error }, usersResult] = await Promise.all([
        db
            .from("user_reward_ledger")
            .select(`
                id,
                user_id,
                status,
                review_status,
                review_reasons,
                amount_cents,
                currency,
                available_at,
                paid_at,
                reversed_at,
                created_at,
                updated_at,
                offer:earn_offers(title, slug),
                partner:offer_partners(name, slug),
                conversion:conversion_events(
                    id,
                    external_transaction_id,
                    click_id,
                    provider_status,
                    review_status,
                    review_reasons,
                    provider_config:offer_partner_postback_configs(provider_slug)
                )
            `)
            .order("created_at", { ascending: false })
            .limit(100),
        db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    if (error) {
        console.error("[admin/rewards] query failed", error);
    }
    if (usersResult.error) {
        console.error("[admin/rewards] auth user lookup failed", {
            message: usersResult.error.message,
        });
    }

    const rows = (data ?? []) as LedgerRow[];
    const emailByUserId = new Map((usersResult.data?.users ?? []).map((user) => [user.id, user.email ?? null]));
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
                description="Reward ledger review controls for unpaid reward safety. No payout, withdrawal, or cashout actions exist."
            />

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                Reversed rewards are not payable. Manual reversal is limited to unpaid rewards. No payout, withdrawal, or cashout actions exist.
            </div>

            {searchParams?.updated ? (
                <p className="rounded-xl border border-lime-200 bg-lime-50 px-4 py-3 text-sm font-semibold text-lime-800">
                    Reward ledger admin action was saved and audited.
                </p>
            ) : null}

            {searchParams?.error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                    Unable to save reward ledger action. Paid rewards cannot be reversed here.
                </p>
            ) : null}

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <AdminStatCard label="Pending" value={formatCents(totals.pending)} tone={totals.pending > 0 ? "warning" : "neutral"} />
                <AdminStatCard label="Available" value={formatCents(totals.approved)} tone={totals.approved > 0 ? "good" : "neutral"} />
                <AdminStatCard label="Rejected" value={formatCents(totals.rejected)} />
                <AdminStatCard label="Reversed" value={formatCents(totals.reversed)} tone={totals.reversed > 0 ? "critical" : "neutral"} />
                <AdminStatCard label="Paid" value={formatCents(totals.paid)} />
            </section>

            <AdminPanel title="Recent ledger rows" description="Ledger status reflects provider-confirmed reward state. Ledger review controls are admin-only and do not create payouts.">
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
                                    <th className="px-3 py-2">Review controls</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((row) => {
                                    const offer = Array.isArray(row.offer) ? row.offer[0] : row.offer;
                                    const partner = Array.isArray(row.partner) ? row.partner[0] : row.partner;
                                    const conversion = Array.isArray(row.conversion) ? row.conversion[0] : row.conversion;
                                    const providerConfig = conversion
                                        ? Array.isArray(conversion.provider_config) ? conversion.provider_config[0] : conversion.provider_config
                                        : null;
                                    return (
                                        <tr key={row.id} className="align-top">
                                            <td className="px-3 py-3">
                                                {statusBadge(row.status)}
                                                {reviewBadge(row.review_status)}
                                                <div className="mt-2 font-bold text-gray-950">{formatCents(row.amount_cents, row.currency)}</div>
                                                {row.review_reasons?.length ? (
                                                    <div className="mt-2 max-w-xs text-xs font-semibold text-amber-700">
                                                        {row.review_reasons.join(", ")}
                                                    </div>
                                                ) : null}
                                                {row.status === "reversed" ? (
                                                    <div className="mt-2 text-xs font-semibold text-red-700">Not payable</div>
                                                ) : null}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="font-mono text-xs text-gray-500">{row.user_id}</div>
                                                <div className="mt-1 text-xs text-gray-600">{emailByUserId.get(row.user_id) ?? "Email unavailable"}</div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="font-bold text-gray-950">{offer?.title ?? "Unknown offer"}</div>
                                                <div className="mt-1 text-xs text-gray-500">{offer?.slug ?? ""}</div>
                                            </td>
                                            <td className="px-3 py-3 text-gray-600">
                                                <div>{partner?.name ?? "Unknown"}</div>
                                                <div className="mt-1 font-mono text-xs text-gray-500">{providerConfig?.provider_slug ?? partner?.slug ?? "-"}</div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="mb-1 font-mono text-xs text-gray-500">{conversion?.id ?? "Missing conversion"}</div>
                                                <div className="font-mono text-xs text-gray-500">{conversion?.click_id ?? ""}</div>
                                                <div className="mt-1 text-xs text-gray-500">{conversion?.external_transaction_id ?? ""}</div>
                                                {conversion?.provider_status ? (
                                                    <div className="mt-1 text-xs text-gray-500">Provider: {conversion.provider_status}</div>
                                                ) : null}
                                                {conversion?.review_status && conversion.review_status !== "clean" ? (
                                                    <div className="mt-1 text-xs font-semibold text-amber-700">Review: {conversion.review_status}</div>
                                                ) : null}
                                                {conversion?.review_reasons?.length ? (
                                                    <div className="mt-1 max-w-xs text-xs font-semibold text-amber-700">
                                                        {conversion.review_reasons.join(", ")}
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td className="px-3 py-3 text-xs leading-relaxed text-gray-500">
                                                <div>Created: {formatDate(row.created_at)}</div>
                                                <div>Updated: {formatDate(row.updated_at)}</div>
                                                <div>Available: {formatDate(row.available_at)}</div>
                                                <div>Reversed: {formatDate(row.reversed_at)}</div>
                                                <div>Paid: {formatDate(row.paid_at)}</div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <form action={updateLedgerReviewAction} className="grid min-w-72 gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
                                                    <input type="hidden" name="ledger_id" value={row.id} />
                                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                                        Review status
                                                        <select
                                                            name="review_status"
                                                            defaultValue={row.review_status}
                                                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm font-semibold normal-case tracking-normal text-gray-800"
                                                        >
                                                            <option value="clean">clean</option>
                                                            <option value="flagged">flagged</option>
                                                            <option value="ignored">ignored</option>
                                                            <option value="reviewed">reviewed</option>
                                                        </select>
                                                    </label>
                                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                                        Admin reasons
                                                        <textarea
                                                            name="review_reasons"
                                                            defaultValue={(row.review_reasons ?? []).join("\n")}
                                                            rows={3}
                                                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm font-medium normal-case tracking-normal text-gray-700"
                                                            placeholder="One reason per line"
                                                        />
                                                    </label>
                                                    <button
                                                        type="submit"
                                                        name="ledger_id"
                                                        value={row.id}
                                                        className="rounded-lg bg-gray-950 px-3 py-2 text-sm font-bold text-white hover:bg-gray-800"
                                                    >
                                                        Save ledger review
                                                    </button>
                                                </form>
                                                <form action={reverseLedgerRewardAction} className="mt-3 grid min-w-72 gap-2 rounded-xl border border-red-100 bg-red-50 p-3">
                                                    <input type="hidden" name="ledger_id" value={row.id} />
                                                    <label className="text-xs font-bold uppercase tracking-widest text-red-500">
                                                        Reversal reason
                                                        <textarea
                                                            name="admin_reason"
                                                            rows={2}
                                                            className="mt-1 w-full rounded-lg border border-red-200 bg-white px-2 py-2 text-sm font-medium normal-case tracking-normal text-gray-700"
                                                            placeholder="Required context for audit trail"
                                                        />
                                                    </label>
                                                    <button
                                                        type="submit"
                                                        name="ledger_id"
                                                        value={row.id}
                                                        disabled={row.status === "paid"}
                                                        className="rounded-lg bg-red-700 px-3 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                                                    >
                                                        Reverse unpaid reward
                                                    </button>
                                                    <p className="text-xs font-semibold text-red-700">
                                                        Warning: only unpaid rewards can be reversed. This updates linked conversion review state and does not create cashout actions.
                                                    </p>
                                                </form>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {rows.length === 0 ? (
                                    <tr>
                                        <td className="px-3 py-6 text-gray-500" colSpan={7}>No reward ledger rows yet.</td>
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

function reviewBadge(status: string) {
    if (!status || status === "clean") return null;
    const classes = status === "flagged"
        ? "ml-2 border-amber-200 bg-amber-50 text-amber-800"
        : "ml-2 border-gray-200 bg-gray-50 text-gray-700";

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
