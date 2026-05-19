import { EARN_REWARDS_BETA_WARNING, formatCents } from "@/lib/earn-rewards";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Earn Wallet | EarnGrind" };

type LedgerRow = {
    id: string;
    status: string;
    amount_cents: number;
    currency: string;
    available_at: string | null;
    created_at: string;
    offer: { title: string; slug: string } | { title: string; slug: string }[] | null;
};

export default async function EarnWalletPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data, error } = await supabase
        .from("user_reward_ledger")
        .select(`
            id,
            status,
            amount_cents,
            currency,
            available_at,
            created_at,
            offer:earn_offers(title, slug)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error("[earn/wallet] query failed", error);
    }

    const rows = (data ?? []) as LedgerRow[];
    const totals = {
        pending: totalFor(rows, "pending"),
        approved: totalFor(rows, "approved"),
        reversed: totalFor(rows, "reversed"),
        paid: totalFor(rows, "paid"),
    };

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl space-y-6">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-gray-400">EarnGrind Rewards</p>
                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">Earn wallet</h1>
                    <p className="mt-2 text-sm text-gray-600">Signed in as {user.email}</p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                    {EARN_REWARDS_BETA_WARNING}
                </div>

                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <WalletTotal label="Pending" value={totals.pending} tone="warning" />
                    <WalletTotal label="Available" value={totals.approved} tone="good" />
                    <WalletTotal label="Reversed" value={totals.reversed} tone="critical" />
                    <WalletTotal label="Paid" value={totals.paid} tone="neutral" />
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                        <h2 className="text-base font-extrabold text-gray-950">Recent rewards</h2>
                        <p className="mt-1 text-sm text-gray-500">Provider-confirmed reward ledger rows for your account.</p>
                    </div>
                    <div className="p-4 sm:p-5">
                        {error ? (
                            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                                Failed to load wallet rows.
                            </p>
                        ) : rows.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                                No tracked reward rows yet.
                            </p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {rows.map((row) => {
                                    const offer = Array.isArray(row.offer) ? row.offer[0] : row.offer;
                                    return (
                                        <div key={row.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-bold text-gray-950">{offer?.title ?? "Tracked offer"}</span>
                                                    {statusBadge(row.status)}
                                                </div>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Ledger row {row.id.slice(0, 8)} - {formatDate(row.created_at)}
                                                </p>
                                                {row.status === "pending" && row.available_at ? (
                                                    <p className="mt-1 text-xs font-semibold text-amber-700">Estimated available {formatDate(row.available_at)}</p>
                                                ) : null}
                                            </div>
                                            <div className="text-lg font-extrabold text-gray-950">{formatCents(row.amount_cents, row.currency)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

function WalletTotal({ label, value, tone }: { label: string; value: number; tone: "neutral" | "good" | "warning" | "critical" }) {
    const toneClass = {
        neutral: "border-gray-200 bg-white",
        good: "border-lime-200 bg-lime-50",
        warning: "border-amber-200 bg-amber-50",
        critical: "border-red-200 bg-red-50",
    }[tone];

    return (
        <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-950">{formatCents(value)}</p>
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

function totalFor(rows: LedgerRow[], status: string): number {
    return rows
        .filter((row) => row.status === status)
        .reduce((sum, row) => sum + Number(row.amount_cents ?? 0), 0);
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}
