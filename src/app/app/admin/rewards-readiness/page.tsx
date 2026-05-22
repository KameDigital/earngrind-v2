import { redirect } from "next/navigation";

import { AdminPageHeader, AdminPanel, AdminStatCard } from "@/components/admin/AdminUi";
import { requireAdminOrEditor } from "@/lib/admin-auth";
import { getCpaleadReadiness } from "@/lib/earn-provider-readiness";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rewards Readiness | EarnGrind Admin" };

type ProviderConfigRow = {
    id: string;
    provider_slug: string;
    status: string;
    secret_env_var: string | null;
    allowed_methods: string[] | null;
};

type EarnOfferRow = {
    id: string;
    title: string;
    slug: string;
    status: string;
};

type CountResult = {
    count: number | null;
    error: { message: string } | null;
};

const REQUIRED_ENV_VARS = [
    "CPALEAD_PUBLISHER_ID",
    "CPALEAD_WALL_ID",
    "CPALEAD_WALL_BASE_URL",
    "POSTBACK_PROVIDER_CPALEAD_SECRET",
    "NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED",
] as const;

export default async function RewardsReadinessPage() {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) redirect(auth.status === 401 ? "/login" : "/app/dashboard");

    const db = createAdminClient();
    const readiness = getCpaleadReadiness();
    const featureFlagValue = process.env.NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED?.trim() ?? "";

    const [
        partnerResult,
        configResult,
        offerResult,
        profilesResult,
        auditResult,
        supportResult,
        receiptsResult,
        failedReceiptsResult,
        supportTicketsResult,
    ] = await Promise.all([
        db.from("offer_partners").select("id,slug,status", { count: "exact" }).eq("slug", "cpalead").limit(1),
        db
            .from("offer_partner_postback_configs")
            .select("id,provider_slug,status,secret_env_var,allowed_methods")
            .eq("provider_slug", "cpalead")
            .maybeSingle(),
        db
            .from("earn_offers")
            .select("id,title,slug,status")
            .eq("slug", "cpalead-offerwall")
            .maybeSingle(),
        tableCount(db, "earn_user_profiles"),
        tableCount(db, "earn_admin_audit_events"),
        tableCount(db, "earn_reward_support_tickets"),
        db
            .from("postback_receipts")
            .select("id", { count: "exact", head: true })
            .gte("created_at", daysAgoIso(7)),
        db
            .from("postback_receipts")
            .select("id", { count: "exact", head: true })
            .gte("created_at", daysAgoIso(7))
            .not("failure_code", "is", null),
        db
            .from("earn_reward_support_tickets")
            .select("id", { count: "exact", head: true })
            .gte("created_at", daysAgoIso(7)),
    ]);

    const config = configResult.data as ProviderConfigRow | null;
    const offer = offerResult.data as EarnOfferRow | null;
    const providerConfigExists = Boolean(config);
    const providerConfigActive = config?.status === "active";
    const cpaleadAllowsGet = Boolean(config?.allowed_methods?.includes("GET"));
    const cpaleadOfferActive = offer?.status === "active";
    const cpaleadPartnerExists = (partnerResult.count ?? 0) > 0;
    const profileSystemReady = !profilesResult.error;
    const manualReviewReady = !auditResult.error;
    const supportTicketsReady = !supportResult.error;
    const requiredEnvStatuses = REQUIRED_ENV_VARS.map((name) => ({
        name,
        present: getEnvPresent(name),
        valueLabel: name === "NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED"
            ? featureFlagValue || "missing"
            : getEnvPresent(name) ? "set" : "missing",
    }));
    const envReady = requiredEnvStatuses.every((env) => env.present);
    const cpaleadReadyForInternalTesting = [
        envReady,
        cpaleadPartnerExists,
        providerConfigExists,
        providerConfigActive,
        cpaleadAllowsGet,
        cpaleadOfferActive,
        profileSystemReady,
        manualReviewReady,
        supportTicketsReady,
    ].every(Boolean);
    const finalStatus = cpaleadReadyForInternalTesting ? "Ready for internal testing" : "Not ready";

    return (
        <div className="space-y-6">
            <AdminPageHeader
                eyebrow="Tracked Rewards"
                title="Rewards readiness"
                description="Private beta launch checklist for EarnGrind rewards before CPAlead production traffic is enabled."
            />

            <div className="grid gap-3 md:grid-cols-3">
                <AdminStatCard
                    label="Internal status"
                    value={finalStatus}
                    tone={cpaleadReadyForInternalTesting ? "good" : "critical"}
                    description="Prerequisites for a controlled private beta test."
                />
                <AdminStatCard
                    label="CPAlead wall flag"
                    value={readiness.enabled ? "Enabled" : "Disabled"}
                    tone={readiness.enabled ? "warning" : "neutral"}
                    description="Feature flag only controls wall availability. It is not a secret."
                />
                <AdminStatCard
                    label="Public launch"
                    value="Blocked"
                    tone="critical"
                    description="No cashouts or withdrawals exist yet."
                />
            </div>

            <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
                CPAlead GET postbacks include password in the request URL. App payloads are redacted, but Vercel, proxy, or access logs may capture query strings before app redaction runs. Review hosting/proxy logs or ask CPAlead about POST/header/IP-only alternatives before real traffic.
            </section>

            <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                No cashouts, withdrawals, PayPal, Tremendous, automatic payouts, KYC, or tax collection are implemented. Rewards can be tracked and reviewed only.
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.7fr)]">
                <AdminPanel title="Checklist" description="Secrets are shown only as set/missing. Values are never printed.">
                    <div className="space-y-3">
                        {[
                            {
                                label: "CPAlead feature flag status",
                                ready: getEnvPresent("NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED"),
                                detail: `NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED=${featureFlagValue || "missing"}`,
                            },
                            {
                                label: "Required CPAlead env vars",
                                ready: envReady,
                                detail: readiness.missing.length ? `Missing: ${readiness.missing.join(", ")}` : "All required values are set",
                            },
                            {
                                label: "CPAlead partner exists",
                                ready: cpaleadPartnerExists,
                                detail: cpaleadPartnerExists ? "offer_partners slug cpalead found" : "Missing offer_partners slug cpalead",
                            },
                            {
                                label: "CPAlead provider config exists",
                                ready: providerConfigExists,
                                detail: providerConfigExists ? `Config ${config?.id}` : "Missing offer_partner_postback_configs row",
                            },
                            {
                                label: "CPAlead postback config active",
                                ready: providerConfigActive,
                                detail: config?.status ?? "missing",
                            },
                            {
                                label: "CPAlead allowed_methods includes GET",
                                ready: cpaleadAllowsGet,
                                detail: config?.allowed_methods?.join(", ") || "missing",
                            },
                            {
                                label: "CPAlead offer exists and is active",
                                ready: cpaleadOfferActive,
                                detail: offer ? `${offer.title} (${offer.status})` : "Missing cpalead-offerwall earn offer",
                            },
                            {
                                label: "Rewards terms/profile system exists",
                                ready: profileSystemReady,
                                detail: profilesResult.error?.message ?? "earn_user_profiles query succeeded",
                            },
                            {
                                label: "Manual review controls exist",
                                ready: manualReviewReady,
                                detail: auditResult.error?.message ?? "earn_admin_audit_events query succeeded",
                            },
                            {
                                label: "Reward support tickets table exists",
                                ready: supportTicketsReady,
                                detail: supportResult.error?.message ?? "earn_reward_support_tickets query succeeded",
                            },
                        ].map((item) => (
                            <ReadinessRow key={item.label} {...item} />
                        ))}
                    </div>
                </AdminPanel>

                <div className="space-y-6">
                    <AdminPanel title="Required env vars" description="Only presence is shown. Secret values are never rendered.">
                        <div className="space-y-2">
                            {requiredEnvStatuses.map((env) => (
                                <div key={env.name} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                                    <span className="font-mono text-xs font-semibold text-gray-700">{env.name}</span>
                                    <span className={`rounded-full border px-2 py-1 text-xs font-bold ${env.present ? "border-lime-200 bg-lime-50 text-lime-800" : "border-red-200 bg-red-50 text-red-800"}`}>
                                        {env.valueLabel}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </AdminPanel>

                    <AdminPanel title="Recent activity" description="Last 7 days. Failed postbacks do not create reward credits.">
                        <div className="grid gap-3">
                            <MetricRow label="Postback receipts" value={countLabel(receiptsResult)} />
                            <MetricRow label="Failed postbacks" value={countLabel(failedReceiptsResult)} />
                            <MetricRow label="Support tickets" value={countLabel(supportTicketsResult)} />
                        </div>
                    </AdminPanel>
                </div>
            </div>

            <AdminPanel title="Launch decision" description="Private beta readiness is not the same as public launch readiness.">
                <div className="grid gap-3 md:grid-cols-3">
                    <DecisionCard
                        title="Ready for internal testing"
                        active={cpaleadReadyForInternalTesting}
                        description="Use only for controlled admin/private beta checks while CPAlead risk is acknowledged."
                    />
                    <DecisionCard
                        title="Not ready"
                        active={!cpaleadReadyForInternalTesting}
                        description="Resolve missing env, provider config, offer, or table prerequisites before testing."
                    />
                    <DecisionCard
                        title="Blocked for public launch"
                        active
                        critical
                        description="Public rewards launch remains blocked by GET-password logging risk and missing cashout/withdrawal implementation."
                    />
                </div>
            </AdminPanel>
        </div>
    );
}

async function tableCount(db: ReturnType<typeof createAdminClient>, tableName: string): Promise<CountResult> {
    const { count, error } = await db
        .from(tableName)
        .select("*", { count: "exact", head: true });

    return {
        count,
        error: error ? { message: error.message } : null,
    };
}

function getEnvPresent(name: string) {
    return Boolean(process.env[name]?.trim());
}

function daysAgoIso(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
}

function countLabel(result: { count: number | null; error: { message: string } | null }) {
    if (result.error) return "Error";
    return String(result.count ?? 0);
}

function ReadinessRow({ label, ready, detail }: { label: string; ready: boolean; detail: string }) {
    return (
        <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <div className="font-bold text-gray-950">{label}</div>
                <div className="mt-1 text-xs font-semibold text-gray-500">{detail}</div>
            </div>
            <span className={`inline-flex w-fit rounded-full border px-2 py-1 text-xs font-bold ${ready ? "border-lime-200 bg-lime-50 text-lime-800" : "border-red-200 bg-red-50 text-red-800"}`}>
                {ready ? "Ready" : "Not ready"}
            </span>
        </div>
    );
}

function MetricRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <span className="text-sm font-bold text-gray-700">{label}</span>
            <span className="text-lg font-extrabold text-gray-950">{value}</span>
        </div>
    );
}

function DecisionCard({
    title,
    description,
    active,
    critical = false,
}: {
    title: string;
    description: string;
    active: boolean;
    critical?: boolean;
}) {
    const classes = active
        ? critical
            ? "border-red-200 bg-red-50 text-red-950"
            : "border-lime-200 bg-lime-50 text-lime-950"
        : "border-gray-200 bg-gray-50 text-gray-500";

    return (
        <div className={`rounded-xl border p-4 ${classes}`}>
            <div className="font-extrabold">{title}</div>
            <p className="mt-2 text-sm leading-relaxed">{description}</p>
        </div>
    );
}
