import Link from "next/link";

import { formatCents } from "@/lib/earn-rewards";
import { getCpaleadReadiness } from "@/lib/earn-provider-readiness";
import { getOrCreateEarnUserProfile, type EarnUserProfile } from "@/lib/earn-user-profile";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "EarnGrind Rewards Beta | EarnGrind" };

type LedgerRow = {
    status: string;
    amount_cents: number;
};

const REWARDS_BETA_COPY =
    "EarnGrind Rewards is in beta. Rewards are credited only after provider confirmation and may pend, reject, reverse, or require manual review.";

export default async function EarnHubPage() {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    let profile: EarnUserProfile | null = null;
    let rows: LedgerRow[] = [];
    if (user) {
        profile = await getOrCreateEarnUserProfile(user.id);
        const { data } = await supabase
            .from("user_reward_ledger")
            .select("status,amount_cents")
            .eq("user_id", user.id)
            .limit(500);

        rows = (data ?? []) as LedgerRow[];
    }

    const cpaleadReadiness = getCpaleadReadiness();
    const termsAccepted = Boolean(profile?.accepted_rewards_terms_at);
    const activeProfile = profile?.reward_status === "active";
    const cpaleadAvailable = Boolean(user && profile && activeProfile && termsAccepted && cpaleadReadiness.enabled && cpaleadReadiness.missing.length === 0);
    const cpaleadReasons = [
        !user ? "Login is required for tracked rewards." : null,
        user && !activeProfile ? `Rewards profile is ${profile?.reward_status ?? "not ready"}.` : null,
        user && profile && !termsAccepted ? "Rewards terms must be accepted in your wallet." : null,
        !cpaleadReadiness.enabled ? "CPAlead wall is disabled for private beta readiness." : null,
        cpaleadReadiness.missing.length ? "CPAlead setup is not fully configured." : null,
    ].filter(Boolean) as string[];

    const totals = {
        pending: totalFor(rows, "pending"),
        approved: totalFor(rows, "approved"),
        reversed: totalFor(rows, "reversed"),
        paid: totalFor(rows, "paid"),
    };

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-950 text-white shadow-sm">
                    <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-lime-300">EarnGrind Rewards Beta</p>
                            <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">
                                Track rewards inside EarnGrind when beta walls are available.
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
                                Compare GPT offers across partner platforms, or use EarnGrind Rewards Beta for tracked offerwalls that credit your EarnGrind wallet after provider confirmation.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                {user ? (
                                    <>
                                        <Link href="/earn/wallet" className="rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-extrabold text-gray-950 hover:bg-lime-200">
                                            Open wallet
                                        </Link>
                                        <Link href="/earn/support" className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10">
                                            Reward support
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login?next=/earn" className="rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-extrabold text-gray-950 hover:bg-lime-200">
                                            Login or sign up
                                        </Link>
                                        <Link href="/offers" className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10">
                                            Browse offers
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                            <div className="grid grid-cols-2 gap-3">
                                <WalletMetric label="Pending" value={totals.pending} />
                                <WalletMetric label="Available" value={totals.approved} />
                                <WalletMetric label="Reversed" value={totals.reversed} />
                                <WalletMetric label="Paid" value={totals.paid} />
                            </div>
                            {!user ? (
                                <p className="mt-4 text-xs font-semibold text-white/55">
                                    No sign-up is required to browse. Login is required for EarnGrind Rewards.
                                </p>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                    {REWARDS_BETA_COPY}
                </section>
                <section className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800">
                    Cashouts are not available yet.
                </section>

                <section className="grid gap-6 lg:grid-cols-3">
                    <InfoCard title="Reward profile" description="Your profile controls whether earning walls can be opened.">
                        {profile ? (
                            <div className="flex flex-wrap gap-2">
                                <StatusBadge label="Rewards" value={profile.reward_status} />
                                <StatusBadge label="Review" value={profile.review_status} />
                            </div>
                        ) : (
                            <p className="text-sm font-semibold text-gray-600">Login to create your rewards profile.</p>
                        )}
                    </InfoCard>

                    <InfoCard title="Rewards terms" description="Terms must be accepted before tracked walls can open.">
                        {profile?.accepted_rewards_terms_at ? (
                            <StatusBadge label="Terms" value="accepted" />
                        ) : user ? (
                            <Link href="/earn/wallet" className="inline-flex rounded-lg bg-gray-950 px-3 py-2 text-sm font-bold text-white hover:bg-gray-800">
                                Accept in wallet
                            </Link>
                        ) : (
                            <p className="text-sm font-semibold text-gray-600">Login to review terms.</p>
                        )}
                    </InfoCard>

                    <InfoCard title="Missing reward support" description="Support tickets help admins review tracked clicks. They do not create credits automatically.">
                        <Link href={user ? "/earn/support" : "/login?next=/earn/support"} className="inline-flex rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-800 hover:border-gray-300">
                            Open support
                        </Link>
                    </InfoCard>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Offerwall</p>
                            <h2 className="mt-1 text-xl font-extrabold text-gray-950">CPAlead Offerwall</h2>
                            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
                                CPAlead sessions use an EarnGrind click id as the provider subid. The wall stays private until the feature flag, terms, profile, and setup checks pass.
                            </p>
                        </div>
                        {cpaleadAvailable ? (
                            <Link href="/earn/walls/cpalead" className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800">
                                Open CPAlead wall
                            </Link>
                        ) : (
                            <span className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-600">Unavailable</span>
                        )}
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <Gate label="Logged in" ok={Boolean(user)} />
                        <Gate label="Active profile" ok={Boolean(activeProfile)} />
                        <Gate label="Terms accepted" ok={termsAccepted} />
                        <Gate label="Feature flag" ok={cpaleadReadiness.enabled} />
                        <Gate label="Provider setup" ok={cpaleadReadiness.missing.length === 0} />
                    </div>
                    {cpaleadReasons.length ? (
                        <ul className="mt-4 space-y-1 text-sm font-semibold text-amber-800">
                            {cpaleadReasons.map((reason) => <li key={reason}>{reason}</li>)}
                        </ul>
                    ) : null}
                </section>
            </div>
        </main>
    );
}

function totalFor(rows: LedgerRow[], status: string) {
    return rows
        .filter((row) => row.status === status)
        .reduce((sum, row) => sum + Number(row.amount_cents ?? 0), 0);
}

function WalletMetric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/8 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">{label}</p>
            <p className="mt-2 text-2xl font-extrabold text-white">{formatCents(value)}</p>
        </div>
    );
}

function InfoCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-extrabold text-gray-950">{title}</h2>
            <p className="mt-2 min-h-10 text-sm leading-relaxed text-gray-600">{description}</p>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function StatusBadge({ label, value }: { label: string; value: string }) {
    const clean = value.replaceAll("_", " ");
    const good = ["active", "clean", "cleared", "accepted"].includes(value);
    const warning = ["limited", "flagged", "under_review"].includes(value);
    const classes = good
        ? "border-lime-200 bg-lime-50 text-lime-800"
        : warning
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-red-200 bg-red-50 text-red-800";

    return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${classes}`}>{label}: {clean}</span>;
}

function Gate({ label, ok }: { label: string; ok: boolean }) {
    return (
        <div className={`rounded-xl border px-3 py-3 ${ok ? "border-lime-200 bg-lime-50" : "border-gray-200 bg-gray-50"}`}>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">{label}</div>
            <div className={`mt-1 text-sm font-extrabold ${ok ? "text-lime-800" : "text-gray-600"}`}>{ok ? "Pass" : "Blocked"}</div>
        </div>
    );
}
