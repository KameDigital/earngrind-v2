import { createHash } from "crypto";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminOrEditor } from "@/lib/admin-auth";
import { buildCpaleadWallUrl, getCpaleadWallEnv } from "@/lib/cpalead";
import { EARN_REWARDS_BETA_WARNING } from "@/lib/earn-rewards";
import { EarnUserProfileAccessError, markRewardActivity, requireActiveEarnUserProfile } from "@/lib/earn-user-profile";
import { getCpaleadReadiness } from "@/lib/earn-provider-readiness";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "CPAlead Offerwall | EarnGrind" };

type CpaleadOfferRow = {
    id: string;
    partner_id: string;
    title: string;
    payout_cents: number;
    user_reward_cents: number;
    currency: string;
    incentive_allowed: boolean;
    reward_allowed: boolean;
    partner: { id: string; status: string } | { id: string; status: string }[] | null;
};

function getPartner(offer: CpaleadOfferRow): { id: string; status: string } | null {
    if (Array.isArray(offer.partner)) return offer.partner[0] ?? null;
    return offer.partner ?? null;
}

function getIpHash(): string | null {
    const headerStore = headers();
    const forwardedFor = headerStore.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || headerStore.get("x-real-ip")?.trim() || "";
    return ip ? createHash("sha256").update(ip).digest("hex") : null;
}

function getClientHints(): Record<string, string> {
    const headerStore = headers();
    return Object.fromEntries(
        [
            "sec-ch-ua",
            "sec-ch-ua-mobile",
            "sec-ch-ua-platform",
            "sec-ch-ua-platform-version",
            "sec-ch-ua-model",
        ]
            .map((header) => [header, headerStore.get(header)] as const)
            .filter(([, value]) => Boolean(value)),
    ) as Record<string, string>;
}

export default async function CpaleadWallPage() {
    const publicEntryEnabled = process.env.NEXT_PUBLIC_EARN_REWARDS_ENTRY_ENABLED === "true";
    const adminAuth = publicEntryEnabled ? null : await requireAdminOrEditor();
    if (adminAuth && !adminAuth.ok) redirect("/offers");

    const supabase = adminAuth?.ok ? adminAuth.supabase : createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?next=/earn/walls/cpalead");

    let earnProfileIssue: string | null = null;
    let termsIssue: string | null = null;
    try {
        const earnProfile = await requireActiveEarnUserProfile(user.id);
        if (!earnProfile.accepted_rewards_terms_at) {
            termsIssue = "Accept beta rewards terms in your wallet before opening CPAlead.";
        }
    } catch (error) {
        if (error instanceof EarnUserProfileAccessError) {
            earnProfileIssue = error.code === "limited"
                ? "Your rewards profile is limited. CPAlead wall access is paused until review clears."
                : `Your rewards profile is ${error.code}. CPAlead wall access is blocked.`;
        } else {
            console.error("[earn/walls/cpalead] failed to verify rewards profile", {
                userId: user.id,
                message: error instanceof Error ? error.message : "unknown_error",
            });
            earnProfileIssue = "Could not verify your rewards profile. CPAlead wall access is paused.";
        }
    }

    const readiness = getCpaleadReadiness(user.email);
    const env = getCpaleadWallEnv();
    const { data: offer, error: offerError } = await supabase
        .from("earn_offers")
        .select(`
            id,
            partner_id,
            title,
            payout_cents,
            user_reward_cents,
            currency,
            incentive_allowed,
            reward_allowed,
            partner:offer_partners(id, status)
        `)
        .eq("slug", "cpalead-offerwall")
        .eq("status", "active")
        .maybeSingle<CpaleadOfferRow>();

    if (offerError) {
        console.error("[earn/walls/cpalead] failed to load CPAlead offer", offerError);
    }

    const partner = offer ? getPartner(offer) : null;
    const betaAccessIssue = readiness.accessMode === "disabled"
        ? readiness.privateBetaEnabled
            ? "CPAlead private beta access is closed for this account."
            : "CPAlead wall is disabled for beta readiness. Public traffic remains off."
        : null;
    const setupIssues = [
        betaAccessIssue,
        ...readiness.missing.map((name) => `Missing ${name}`),
        offerError ? "CPAlead offer lookup failed" : null,
        !offer ? "Seed the cpalead-offerwall earn offer" : null,
        offer && partner?.status !== "active" ? "CPAlead partner is not active" : null,
        earnProfileIssue,
        termsIssue,
    ].filter(Boolean) as string[];
    const gateStates = [
        { label: "Logged in", ok: Boolean(user), detail: user.email ?? "Signed in" },
        { label: "Active profile", ok: !earnProfileIssue, detail: earnProfileIssue ?? "Rewards profile active" },
        { label: "Terms accepted", ok: !termsIssue, detail: termsIssue ?? "Rewards terms accepted" },
        {
            label: "Beta access",
            ok: readiness.accessMode !== "disabled",
            detail: readiness.accessMode === "public"
                ? "Public beta enabled"
                : readiness.accessMode === "private"
                    ? "Private beta access"
                    : readiness.privateBetaEnabled
                        ? "Private beta allowlist required"
                        : "Public and private beta disabled",
        },
        { label: "Provider env configured", ok: readiness.missing.length === 0, detail: readiness.missing.length ? `Missing ${readiness.missing.join(", ")}` : "Required env present" },
    ];

    let wallUrl: string | null = null;
    let clickId: string | null = null;
    let clickError: string | null = null;

    if (setupIssues.length === 0 && env.wallBaseUrl && env.wallId && offer) {
        clickId = crypto.randomUUID();
        wallUrl = buildCpaleadWallUrl(env.wallBaseUrl, env.wallId, clickId);

        const { error } = await supabase.from("offer_clicks").insert({
            click_id: clickId,
            earn_offer_id: offer.id,
            offer_partner_id: offer.partner_id,
            offer_title: offer.title,
            platform_name: "CPAlead",
            provider_name: "CPAlead",
            destination_url: wallUrl,
            affiliate_mode: "earn-offerwall",
            click_location: "earn/walls/cpalead",
            source_context: "cpalead-wall",
            gross_payout_cents: Number(offer.payout_cents ?? 0),
            user_reward_cents: Number(offer.user_reward_cents ?? 0),
            currency: offer.currency,
            incentive_allowed: offer.incentive_allowed,
            reward_allowed: offer.reward_allowed,
            user_id: user.id,
            ip_hash: getIpHash(),
            user_agent: headers().get("user-agent"),
            client_hints: getClientHints(),
        });

        if (error) {
            console.error("[earn/walls/cpalead] failed to create offer click", {
                offerId: offer.id,
                message: error.message,
            });
            clickError = "Could not create the CPAlead tracking click. Try again after checking the offer_clicks insert policy.";
            wallUrl = null;
            clickId = null;
        } else {
            try {
                await markRewardActivity(user.id);
            } catch {
                clickError = "Could not update your rewards profile activity. Try again before opening the wall.";
                wallUrl = null;
                clickId = null;
            }
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-gray-400">EarnGrind Rewards</p>
                    <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-gray-950">CPAlead offerwall</h1>
                            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
                                CPAlead Offerwall is tracked by EarnGrind. Each eligible session creates an EarnGrind click id and sends it to CPAlead as the provider subid.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href="/earn" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-300">
                                Rewards hub
                            </Link>
                            <Link href="/earn/wallet" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-300">
                                Wallet
                            </Link>
                            <Link href="/earn/support" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-300">
                                Support
                            </Link>
                        </div>
                    </div>
                </section>

                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                    {EARN_REWARDS_BETA_WARNING}
                </div>

                <section className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Provider</p>
                        <h2 className="mt-2 text-xl font-extrabold text-gray-950">CPAlead Offerwall</h2>
                        <div className="mt-4 space-y-2 text-sm font-semibold text-gray-700">
                            <div>Tracked by EarnGrind</div>
                            <div>Subid/click tracking active when gates pass</div>
                            {readiness.accessMode === "private" ? <div>Private beta access enabled for your account</div> : null}
                            <div>No cashouts are available yet</div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-base font-extrabold text-gray-950">Access gates</h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            {gateStates.map((gate) => (
                                <GateCard key={gate.label} {...gate} />
                            ))}
                        </div>
                    </div>
                </section>

                {setupIssues.length > 0 || clickError ? (
                    <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
                        <h2 className="text-base font-extrabold text-gray-950">
                            {readiness.accessMode === "disabled" ? "CPAlead private beta closed" : termsIssue ? "Rewards terms required" : "CPAlead setup needed"}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            The hosted wall is not opened and no click is created until the beta flag, provider setup, rewards profile, and rewards terms checks all pass.
                        </p>
                        <ul className="mt-4 space-y-2 text-sm font-semibold text-red-800">
                            {setupIssues.map((issue) => (
                                <li key={issue}>{issue}</li>
                            ))}
                            {clickError ? <li>{clickError}</li> : null}
                        </ul>
                        {termsIssue ? (
                            <Link
                                href="/earn/wallet"
                                className="mt-4 inline-flex items-center justify-center rounded-lg bg-gray-950 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800"
                            >
                                Go to wallet
                            </Link>
                        ) : null}
                        {!termsIssue ? (
                            <Link
                                href="/earn"
                                className="mt-4 inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:border-gray-300"
                            >
                                Back to rewards hub
                            </Link>
                        ) : null}
                    </section>
                ) : null}

                {wallUrl && clickId ? (
                    <section className="space-y-4">
                        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-base font-extrabold text-gray-950">Tracked CPAlead session</h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        CPAlead receives this EarnGrind click id as <span className="font-mono">subid</span>.
                                    </p>
                                    <p className="mt-2 break-all font-mono text-xs text-gray-500">{clickId}</p>
                                </div>
                                <a
                                    href={wallUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center rounded-lg bg-gray-950 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800"
                                >
                                    Open Offerwall
                                </a>
                            </div>
                        </div>

                        <iframe
                            title="CPAlead offerwall"
                            src={wallUrl}
                            className="h-[760px] w-full rounded-2xl border border-gray-200 bg-white shadow-sm"
                            loading="lazy"
                        />
                    </section>
                ) : null}
            </div>
        </main>
    );
}

function GateCard({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
    return (
        <div className={`rounded-xl border px-3 py-3 ${ok ? "border-lime-200 bg-lime-50" : "border-amber-200 bg-amber-50"}`}>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">{label}</div>
            <div className={`mt-1 text-sm font-extrabold ${ok ? "text-lime-800" : "text-amber-800"}`}>{ok ? "Pass" : "Blocked"}</div>
            <div className="mt-2 text-xs font-semibold text-gray-600">{detail}</div>
        </div>
    );
}
