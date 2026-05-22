import Link from "next/link";
import { redirect } from "next/navigation";

import { formatCents } from "@/lib/earn-rewards";
import { createClient } from "@/lib/supabase/server";
import { createRewardSupportTicketAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reward Support | EarnGrind" };

type SupportPageProps = {
    searchParams?: { created?: string; error?: string };
};

type ClickRow = {
    id: string;
    click_id: string | null;
    offer_title: string | null;
    provider_name: string | null;
    clicked_at: string;
    earn_offer: { title: string | null } | { title: string | null }[] | null;
    partner: { slug: string | null; name: string | null } | { slug: string | null; name: string | null }[] | null;
};

type LedgerRow = {
    id: string;
    conversion_event_id: string;
    offer_click_id: string | null;
    status: string;
    amount_cents: number;
    currency: string;
    created_at: string;
};

type TicketRow = {
    id: string;
    issue_type: string;
    offer_title: string | null;
    provider_slug: string | null;
    click_id: string | null;
    status: string;
    admin_status: string;
    admin_notes: string[] | null;
    created_at: string;
    updated_at: string;
};

export default async function RewardSupportPage({ searchParams }: SupportPageProps) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const [{ data: clicks }, { data: ledgerRows }, { data: tickets }] = await Promise.all([
        supabase
            .from("offer_clicks")
            .select(`
                id,
                click_id,
                offer_title,
                provider_name,
                clicked_at,
                earn_offer:earn_offers(title),
                partner:offer_partners(slug, name)
            `)
            .eq("user_id", user.id)
            .not("click_id", "is", null)
            .order("clicked_at", { ascending: false })
            .limit(25),
        supabase
            .from("user_reward_ledger")
            .select("id,conversion_event_id,offer_click_id,status,amount_cents,currency,created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(25),
        supabase
            .from("earn_reward_support_tickets")
            .select("id,issue_type,offer_title,provider_slug,click_id,status,admin_status,admin_notes,created_at,updated_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(25),
    ]);

    const clickRows = (clicks ?? []) as ClickRow[];
    const ledgerByClickId = new Map<string, LedgerRow>();
    for (const row of (ledgerRows ?? []) as LedgerRow[]) {
        if (row.offer_click_id && !ledgerByClickId.has(row.offer_click_id)) {
            ledgerByClickId.set(row.offer_click_id, row);
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">Rewards beta</p>
                    <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">Reward support</h1>
                            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
                                Use support when a tracked offer is missing, credited for the wrong amount, rejected, or reversed unexpectedly. Tickets help admins review provider-confirmed activity and do not create credits automatically.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/earn"
                                className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800"
                            >
                                Rewards hub
                            </Link>
                            <Link
                                href="/earn/wallet"
                                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-gray-300 hover:text-gray-950"
                            >
                                Wallet
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                    Rewards are credited only after provider confirmation. Some offers may pend, reject, reverse, or require manual review.
                </section>

                {searchParams?.created ? (
                    <p className="rounded-xl border border-lime-200 bg-lime-50 px-4 py-3 text-sm font-semibold text-lime-800">
                        Support ticket submitted. Admin review can confirm status, but it cannot create automatic credits or cashouts.
                    </p>
                ) : null}

                {searchParams?.error ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                        Unable to submit that ticket. Check the selected click, message length, and proof URL.
                    </p>
                ) : null}

                <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
                    <form action={createRewardSupportTicketAction} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-extrabold text-gray-950">Open a support ticket</h2>
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">
                            Pick the closest recent click if one exists. Include the completion time, what the provider showed, and any proof link you have.
                        </p>
                        <div className="mt-5 grid gap-4">
                            <label className="text-sm font-bold text-gray-700">
                                Issue type
                                <select
                                    name="issue_type"
                                    required
                                    className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100"
                                >
                                    <option value="missing_reward">Missing reward</option>
                                    <option value="wrong_amount">Wrong amount</option>
                                    <option value="rejected_offer">Rejected offer</option>
                                    <option value="reversed_reward">Reversed reward</option>
                                    <option value="other">Other</option>
                                </select>
                            </label>

                            <label className="text-sm font-bold text-gray-700">
                                Related started offer
                                <select
                                    name="offer_click_id"
                                    className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100"
                                >
                                    <option value="">No specific click</option>
                                    {clickRows.map((click) => {
                                        const offer = normalizeOne(click.earn_offer);
                                        const partner = normalizeOne(click.partner);
                                        const title = click.offer_title ?? offer?.title ?? "Tracked offer";
                                        const provider = partner?.slug ?? click.provider_name ?? "provider";
                                        return (
                                            <option key={click.id} value={click.id}>
                                                {title} - {provider} - {formatDate(click.clicked_at)}
                                            </option>
                                        );
                                    })}
                                </select>
                            </label>

                            <label className="text-sm font-bold text-gray-700">
                                What happened?
                                <textarea
                                    name="message"
                                    required
                                    minLength={10}
                                    maxLength={3000}
                                    rows={6}
                                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-medium text-gray-800 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100"
                                    placeholder="Include the offer name, approximate completion time, and anything the provider showed after completion."
                                />
                            </label>

                            <label className="text-sm font-bold text-gray-700">
                                Proof URL, optional
                                <input
                                    name="proof_url"
                                    type="url"
                                    maxLength={500}
                                    className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100"
                                    placeholder="https://..."
                                />
                            </label>

                            <button
                                type="submit"
                                className="rounded-xl bg-gray-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
                            >
                                Submit for review
                            </button>
                            <p className="text-xs font-semibold text-gray-500">
                                Submitting a ticket never creates a reward credit, payout, or cashout.
                            </p>
                        </div>
                    </form>

                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-extrabold text-gray-950">Recent started offers</h2>
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">
                            These are recent EarnGrind-tracked clicks. Provider confirmation may arrive later or may be rejected/reversed.
                        </p>
                        <div className="mt-4 space-y-3">
                            {clickRows.slice(0, 8).map((click) => {
                                const offer = normalizeOne(click.earn_offer);
                                const partner = normalizeOne(click.partner);
                                const ledger = ledgerByClickId.get(click.id);
                                return (
                                    <div key={click.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                        <div className="font-bold text-gray-950">{click.offer_title ?? offer?.title ?? "Tracked offer"}</div>
                                        <div className="mt-1 text-xs text-gray-500">{partner?.slug ?? click.provider_name ?? "provider"} - {formatDate(click.clicked_at)}</div>
                                        <div className="mt-2 break-all font-mono text-xs text-gray-500">{click.click_id}</div>
                                        {ledger ? (
                                            <div className="mt-2 text-xs font-semibold text-gray-700">
                                                Reward: {ledger.status} - {formatCents(ledger.amount_cents, ledger.currency)}
                                            </div>
                                        ) : (
                                            <div className="mt-2 text-xs font-semibold text-amber-700">No confirmed reward event yet</div>
                                        )}
                                    </div>
                                );
                            })}
                            {clickRows.length === 0 ? (
                                <p className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
                                    No tracked reward clicks yet.
                                </p>
                            ) : null}
                        </div>
                    </section>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-extrabold text-gray-950">Your support tickets</h2>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                                <tr>
                                    <th className="px-3 py-2">Issue</th>
                                    <th className="px-3 py-2">Offer</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2">Admin notes</th>
                                    <th className="px-3 py-2">Updated</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {((tickets ?? []) as TicketRow[]).map((ticket) => (
                                    <tr key={ticket.id}>
                                        <td className="px-3 py-3 font-semibold text-gray-800">{humanize(ticket.issue_type)}</td>
                                        <td className="px-3 py-3">
                                            <div className="font-bold text-gray-950">{ticket.offer_title ?? "No linked offer"}</div>
                                            <div className="mt-1 text-xs text-gray-500">{ticket.provider_slug ?? "provider unknown"}</div>
                                            {ticket.click_id ? <div className="mt-1 break-all font-mono text-xs text-gray-400">{ticket.click_id}</div> : null}
                                        </td>
                                        <td className="px-3 py-3">
                                            {statusBadge(ticket.status)}
                                            <div className="mt-2 text-xs font-semibold text-gray-500">Admin: {ticket.admin_status}</div>
                                        </td>
                                        <td className="px-3 py-3 max-w-sm text-xs font-semibold text-gray-600">
                                            {ticket.admin_notes?.length ? ticket.admin_notes.join(", ") : "No admin notes yet"}
                                        </td>
                                        <td className="px-3 py-3 text-xs text-gray-500">{formatDate(ticket.updated_at)}</td>
                                    </tr>
                                ))}
                                {(tickets ?? []).length === 0 ? (
                                    <tr>
                                        <td className="px-3 py-6 text-gray-500" colSpan={5}>No support tickets yet.</td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}

function normalizeOne<T>(value: T | T[] | null) {
    return Array.isArray(value) ? value[0] ?? null : value;
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
