import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminPageHeader, AdminPanel, AdminStatCard } from "@/components/admin/AdminUi";
import { requireAdminOrEditor } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createManualCpaleadCreditAction, updateRewardSupportTicketAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reward Support | EarnGrind Admin" };

type RewardSupportAdminPageProps = {
    searchParams?: { updated?: string; error?: string };
};

type TicketRow = {
    id: string;
    user_id: string;
    offer_click_id: string | null;
    click_id: string | null;
    conversion_event_id: string | null;
    provider_slug: string | null;
    offer_title: string | null;
    issue_type: string;
    message: string;
    proof_url: string | null;
    status: string;
    admin_status: string;
    admin_notes: string[] | null;
    created_at: string;
    updated_at: string;
};

const TICKET_STATUSES = ["open", "waiting_on_user", "under_review", "resolved", "rejected", "closed"] as const;
const ADMIN_STATUSES = ["unreviewed", "reviewed", "escalated"] as const;

export default async function RewardSupportAdminPage({ searchParams }: RewardSupportAdminPageProps) {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) redirect(auth.status === 401 ? "/login" : "/app/dashboard");

    const db = createAdminClient();
    const [{ data, error }, usersResult] = await Promise.all([
        db
            .from("earn_reward_support_tickets")
            .select(`
                id,
                user_id,
                offer_click_id,
                click_id,
                conversion_event_id,
                provider_slug,
                offer_title,
                issue_type,
                message,
                proof_url,
                status,
                admin_status,
                admin_notes,
                created_at,
                updated_at
            `)
            .order("created_at", { ascending: false })
            .limit(100),
        db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    if (error) {
        console.error("[admin/reward-support] query failed", {
            message: error.message,
        });
    }
    if (usersResult.error) {
        console.error("[admin/reward-support] auth user lookup failed", {
            message: usersResult.error.message,
        });
    }

    const rows = (data ?? []) as TicketRow[];
    const emailByUserId = new Map((usersResult.data?.users ?? []).map((user) => [user.id, user.email ?? null]));
    const openCount = rows.filter((row) => ["open", "waiting_on_user", "under_review"].includes(row.status)).length;
    const unreviewedCount = rows.filter((row) => row.admin_status === "unreviewed").length;
    const escalatedCount = rows.filter((row) => row.admin_status === "escalated").length;
    const resolvedCount = rows.filter((row) => row.status === "resolved").length;

    return (
        <div className="space-y-6">
            <AdminPageHeader
                eyebrow="Tracked Rewards"
                title="Reward support"
                description="Review user-submitted reward support tickets. These controls do not create credits, payouts, cashouts, or withdrawal states."
            />

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                Support tickets are an admin review workflow. Manual CPAlead credits must be verified in the CPAlead dashboard first, use the stored click reward snapshot, and do not create payouts or cashouts.
            </div>

            {searchParams?.updated ? (
                <p className="rounded-xl border border-lime-200 bg-lime-50 px-4 py-3 text-sm font-semibold text-lime-800">
                    Admin action was saved and audited.
                </p>
            ) : null}

            {searchParams?.error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                    Unable to save support ticket update.
                </p>
            ) : null}

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AdminStatCard label="Open Queue" value={openCount} tone={openCount > 0 ? "warning" : "neutral"} />
                <AdminStatCard label="Unreviewed" value={unreviewedCount} tone={unreviewedCount > 0 ? "warning" : "neutral"} />
                <AdminStatCard label="Escalated" value={escalatedCount} tone={escalatedCount > 0 ? "critical" : "neutral"} />
                <AdminStatCard label="Resolved" value={resolvedCount} tone={resolvedCount > 0 ? "good" : "neutral"} />
            </section>

            <AdminPanel
                title="Manual CPAlead credit"
                description="Use only after verifying the CPAlead completion in the publisher dashboard. The reward amount comes from the original EarnGrind click snapshot."
            >
                <form action={createManualCpaleadCreditAction} className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_minmax(260px,1.4fr)_auto] lg:items-end">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        EarnGrind click/subid
                        <input
                            name="click_id"
                            required
                            className="mt-1 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-gray-800"
                            placeholder="click_id from CPAlead subid"
                        />
                    </label>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        CPAlead lead/reference
                        <input
                            name="external_reference"
                            required
                            maxLength={200}
                            className="mt-1 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-gray-800"
                            placeholder="lead_id or verified reference"
                        />
                    </label>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        Required admin reason
                        <input
                            name="admin_reason"
                            required
                            maxLength={200}
                            className="mt-1 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-gray-800"
                            placeholder="Verified in CPAlead dashboard"
                        />
                    </label>
                    <button
                        type="submit"
                        className="h-11 rounded-lg bg-gray-950 px-4 text-sm font-bold text-white hover:bg-gray-800"
                    >
                        Credit click
                    </button>
                </form>
                <p className="mt-3 text-xs font-semibold text-amber-700">
                    Duplicate CPAlead lead/reference values are blocked by provider + external transaction uniqueness. Manual credit creates conversion and ledger rows only, never payout/cashout rows.
                </p>
            </AdminPanel>

            <AdminPanel title="Support tickets" description="Update ticket workflow status and admin notes. Use conversions and reward ledger pages for status or ledger decisions.">
                {error ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                        Failed to load reward support tickets.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                                <tr>
                                    <th className="px-3 py-2">Ticket</th>
                                    <th className="px-3 py-2">User</th>
                                    <th className="px-3 py-2">Claim</th>
                                    <th className="px-3 py-2">References</th>
                                    <th className="px-3 py-2">Admin controls</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((row) => (
                                    <tr key={row.id} className="align-top">
                                        <td className="px-3 py-3">
                                            {statusBadge(row.status)}
                                            {adminBadge(row.admin_status)}
                                            <div className="mt-2 font-semibold capitalize text-gray-800">{humanize(row.issue_type)}</div>
                                            <div className="mt-1 text-xs text-gray-500">Created: {formatDate(row.created_at)}</div>
                                            <div className="text-xs text-gray-500">Updated: {formatDate(row.updated_at)}</div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="font-mono text-xs text-gray-500">{row.user_id}</div>
                                            <div className="mt-1 text-xs text-gray-600">{emailByUserId.get(row.user_id) ?? "Email unavailable"}</div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="font-bold text-gray-950">{row.offer_title ?? "No linked offer"}</div>
                                            <div className="mt-1 text-xs text-gray-500">{row.provider_slug ?? "provider unknown"}</div>
                                            <p className="mt-3 max-w-md whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{row.message}</p>
                                            {row.proof_url ? (
                                                <a
                                                    href={row.proof_url}
                                                    rel="noreferrer"
                                                    target="_blank"
                                                    className="mt-2 inline-flex text-xs font-bold text-gray-950 underline"
                                                >
                                                    View proof URL
                                                </a>
                                            ) : null}
                                            {row.admin_notes?.length ? (
                                                <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs font-semibold text-gray-600">
                                                    {row.admin_notes.join(", ")}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="space-y-2 text-xs text-gray-500">
                                                <div>
                                                    <span className="font-bold text-gray-700">Ticket</span>
                                                    <div className="break-all font-mono">{row.id}</div>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-700">Click</span>
                                                    <div className="break-all font-mono">{row.click_id ?? row.offer_click_id ?? "-"}</div>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-700">Conversion</span>
                                                    <div className="break-all font-mono">{row.conversion_event_id ?? "-"}</div>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <Link href="/app/admin/conversions" className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-gray-300">
                                                    Conversions
                                                </Link>
                                                <Link href="/app/admin/rewards" className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-gray-300">
                                                    Rewards
                                                </Link>
                                            </div>
                                            {row.click_id && row.provider_slug === "cpalead" && !row.conversion_event_id ? (
                                                <form action={createManualCpaleadCreditAction} className="mt-3 grid gap-2 rounded-xl border border-lime-100 bg-lime-50 p-3">
                                                    <input type="hidden" name="support_ticket_id" value={row.id} />
                                                    <input type="hidden" name="click_id" value={row.click_id} />
                                                    <label className="text-xs font-bold uppercase tracking-widest text-lime-700">
                                                        CPAlead lead/reference
                                                        <input
                                                            name="external_reference"
                                                            required
                                                            maxLength={200}
                                                            className="mt-1 h-10 w-full rounded-lg border border-lime-200 bg-white px-2 text-sm font-semibold normal-case tracking-normal text-gray-800"
                                                            placeholder="Verified CPAlead lead_id"
                                                        />
                                                    </label>
                                                    <label className="text-xs font-bold uppercase tracking-widest text-lime-700">
                                                        Credit reason
                                                        <textarea
                                                            name="admin_reason"
                                                            required
                                                            rows={2}
                                                            maxLength={200}
                                                            className="mt-1 w-full rounded-lg border border-lime-200 bg-white px-2 py-2 text-sm font-medium normal-case tracking-normal text-gray-700"
                                                            placeholder="Verified in CPAlead dashboard"
                                                        />
                                                    </label>
                                                    <button
                                                        type="submit"
                                                        className="rounded-lg bg-lime-700 px-3 py-2 text-sm font-bold text-white hover:bg-lime-800"
                                                    >
                                                        Credit this ticket
                                                    </button>
                                                    <p className="text-xs font-semibold text-lime-800">
                                                        Uses stored click reward amount. No payout or cashout action is created.
                                                    </p>
                                                </form>
                                            ) : null}
                                        </td>
                                        <td className="px-3 py-3">
                                            <form action={updateRewardSupportTicketAction} className="grid min-w-72 gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
                                                <input type="hidden" name="ticket_id" value={row.id} />
                                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                                    Status
                                                    <select
                                                        name="status"
                                                        defaultValue={row.status}
                                                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm font-semibold normal-case tracking-normal text-gray-800"
                                                    >
                                                        {TICKET_STATUSES.map((status) => (
                                                            <option key={status} value={status}>{status}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                                    Admin status
                                                    <select
                                                        name="admin_status"
                                                        defaultValue={row.admin_status}
                                                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm font-semibold normal-case tracking-normal text-gray-800"
                                                    >
                                                        {ADMIN_STATUSES.map((status) => (
                                                            <option key={status} value={status}>{status}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                                    Add admin note
                                                    <textarea
                                                        name="admin_note"
                                                        rows={3}
                                                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm font-medium normal-case tracking-normal text-gray-700"
                                                        placeholder="Internal note for support history"
                                                    />
                                                </label>
                                                <button
                                                    type="submit"
                                                    name="ticket_id"
                                                    value={row.id}
                                                    className="rounded-lg bg-gray-950 px-3 py-2 text-sm font-bold text-white hover:bg-gray-800"
                                                >
                                                    Save support review
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                                {rows.length === 0 ? (
                                    <tr>
                                        <td className="px-3 py-6 text-gray-500" colSpan={5}>No reward support tickets yet.</td>
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

function humanize(value: string) {
    return value.replace(/_/g, " ");
}

function statusBadge(status: string) {
    const classes = status === "resolved"
        ? "border-lime-200 bg-lime-50 text-lime-800"
        : status === "rejected" || status === "closed"
            ? "border-gray-200 bg-gray-50 text-gray-700"
            : "border-amber-200 bg-amber-50 text-amber-800";

    return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold capitalize ${classes}`}>{humanize(status)}</span>;
}

function adminBadge(status: string) {
    const classes = status === "escalated"
        ? "ml-2 border-red-200 bg-red-50 text-red-800"
        : status === "reviewed"
            ? "ml-2 border-lime-200 bg-lime-50 text-lime-800"
            : "ml-2 border-gray-200 bg-gray-50 text-gray-700";

    return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold capitalize ${classes}`}>{humanize(status)}</span>;
}

function formatDate(value: string | null) {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
