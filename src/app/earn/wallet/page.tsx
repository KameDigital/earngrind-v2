import { EARN_REWARDS_BETA_WARNING, formatCents } from "@/lib/earn-rewards";
import { acceptRewardsTerms, getOrCreateEarnUserProfile } from "@/lib/earn-user-profile";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Link from "next/link";
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

const REWARDS_TERMS_COPY = "EarnGrind rewards are in beta. Rewards are only credited after provider confirmation and may pend, reject, reverse, or require manual review.";

async function acceptRewardsTermsAction() {
    "use server";

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    await acceptRewardsTerms(user.id);
    revalidatePath("/earn/wallet");
    revalidatePath("/earn/walls/cpalead");
}

export default async function EarnWalletPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const earnProfile = await getOrCreateEarnUserProfile(user.id);
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
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-gray-400">EarnGrind Rewards</p>
                            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">Earn wallet</h1>
                            <p className="mt-2 text-sm text-gray-600">Signed in as {user.email}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <ProfileBadge label="Rewards" value={earnProfile.reward_status} />
                                <ProfileBadge label="Review" value={earnProfile.review_status} />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/earn"
                                className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800"
                            >
                                Open EarnGrind Rewards
                            </Link>
                            <Link
                                href="/earn/support"
                                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-300"
                            >
                                Missing a reward?
                            </Link>
                        </div>
                    </div>
                </section>

                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                    {EARN_REWARDS_BETA_WARNING}
                </div>

                {earnProfile.reward_status !== "active" ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                        Your EarnGrind rewards profile is {earnProfile.reward_status}. Earning may be restricted while this status is active.
                    </div>
                ) : null}

                {!earnProfile.accepted_rewards_terms_at ? (
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600">Required before earning</p>
                                <h2 className="mt-1 text-xl font-extrabold text-gray-950">Accept beta rewards terms</h2>
                                <p className="mt-2 max-w-3xl text-sm font-semibold text-gray-700">
                                    {REWARDS_TERMS_COPY}
                                </p>
                                <p className="mt-2 text-sm text-gray-500">
                                    CPAlead and other reward walls stay locked until these terms are accepted.
                                </p>
                            </div>
                            <form action={acceptRewardsTermsAction}>
                                <button
                                    type="submit"
                                    className="inline-flex w-full items-center justify-center rounded-lg bg-gray-950 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-gray-800 sm:w-auto"
                                >
                                    Accept rewards terms
                                </button>
                            </form>
                        </div>
                    </section>
                ) : (
                    <div className="rounded-xl border border-lime-200 bg-lime-50 px-4 py-3 text-sm font-semibold text-lime-800">
                        Rewards terms accepted {formatDate(earnProfile.accepted_rewards_terms_at)}.
                    </div>
                )}

                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <WalletTotal label="Pending" value={totals.pending} tone="warning" />
                    <WalletTotal label="Available" value={totals.approved} tone="good" />
                    <WalletTotal label="Reversed" value={totals.reversed} tone="critical" />
                    <WalletTotal label="Paid" value={totals.paid} tone="neutral" />
                </section>

                <section className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <h2 className="text-base font-extrabold text-gray-950">Missing a reward?</h2>
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">
                            Open a support ticket with the related tracked click. Support can review provider-confirmed activity, but it does not create credits automatically.
                        </p>
                        <Link
                            href="/earn/support"
                            className="mt-4 inline-flex rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-800 hover:border-gray-300"
                        >
                            Open a support ticket
                        </Link>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <h2 className="text-base font-extrabold text-gray-950">EarnGrind Rewards hub</h2>
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">
                            Check wall availability, profile gates, rewards terms, and support links from one place.
                        </p>
                        <Link
                            href="/earn"
                            className="mt-4 inline-flex rounded-lg bg-gray-950 px-3 py-2 text-sm font-bold text-white hover:bg-gray-800"
                        >
                            Open EarnGrind Rewards
                        </Link>
                    </div>
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

function ProfileBadge({ label, value }: { label: string; value: string }) {
    const classes = value === "active" || value === "clean" || value === "cleared"
        ? "border-lime-200 bg-lime-50 text-lime-800"
        : value === "limited" || value === "flagged" || value === "under_review"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-red-200 bg-red-50 text-red-800";

    return (
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${classes}`}>
            {label}: {value.replaceAll("_", " ")}
        </span>
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
