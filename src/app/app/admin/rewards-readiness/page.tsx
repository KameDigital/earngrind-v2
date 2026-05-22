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
    secret_type: string;
    secret_env_var: string | null;
    allowed_methods: string[] | null;
    allowed_ip_ranges: string[] | null;
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
    "NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED",
] as const;

export default async function RewardsReadinessPage() {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) redirect(auth.status === 401 ? "/login" : "/app/dashboard");

    const db = createAdminClient();
    const readiness = getCpaleadReadiness();
    const featureFlagValue = process.env.NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED?.trim() ?? "";
    const privateBetaFlagValue = process.env.EARN_REWARDS_PRIVATE_BETA_ENABLED?.trim() ?? "";

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
            .select("id,provider_slug,status,secret_type,secret_env_var,allowed_methods,allowed_ip_ranges")
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
    const cpaleadAutomaticPostbacksDisabled = config?.status === "paused" && !config?.allowed_methods?.includes("GET");
    const cpaleadManualPostbackSafe = config?.secret_type === "none" && !config?.secret_env_var;
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
    const missingRequiredEnv = requiredEnvStatuses.filter((env) => !env.present).map((env) => env.name);
    const providerEnvReady = readiness.missing.length === 0
        && getEnvPresent("NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED");
    const privateBetaReady = readiness.privateBetaEnabled && readiness.privateBetaEmailCount > 0;
    const wallAccessReady = readiness.publicEnabled || privateBetaReady;
    const cpaleadReadyForInternalTesting = [
        providerEnvReady,
        wallAccessReady,
        cpaleadPartnerExists,
        providerConfigExists,
        cpaleadAutomaticPostbacksDisabled,
        cpaleadManualPostbackSafe,
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
                    label="CPAlead public flag"
                    value={readiness.publicEnabled ? "Enabled" : "Disabled"}
                    tone={readiness.publicEnabled ? "warning" : "neutral"}
                    description="Public flag remains off until public launch is intentional."
                />
                <AdminStatCard
                    label="Private beta"
                    value={readiness.privateBetaEnabled ? `${readiness.privateBetaEmailCount} allowed` : "Disabled"}
                    tone={privateBetaReady ? "good" : "neutral"}
                    description="Allowlist count only. Email values are not rendered."
                />
                <AdminStatCard
                    label="Public launch"
                    value="Blocked"
                    tone="critical"
                    description="No cashouts or withdrawals exist yet."
                />
            </div>

            <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
                CPAlead is in manual-credit mode. Do not save CPAlead macro query parameters against earngrind.com; verify completions in CPAlead, then credit users from the support queue or click lookup.
            </section>

            <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                No cashouts, withdrawals, PayPal, Tremendous, automatic payouts, KYC, or tax collection are implemented. Rewards can be tracked and reviewed only.
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.7fr)]">
                <AdminPanel title="Checklist" description="Secrets are shown only as set/missing. Values are never printed.">
                    <div className="space-y-3">
                        {[
                            {
                                label: "CPAlead public feature flag status",
                                ready: getEnvPresent("NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED"),
                                detail: `NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED=${featureFlagValue || "missing"}`,
                            },
                            {
                                label: "CPAlead private beta flag status",
                                ready: getEnvPresent("EARN_REWARDS_PRIVATE_BETA_ENABLED"),
                                detail: `EARN_REWARDS_PRIVATE_BETA_ENABLED=${privateBetaFlagValue || "missing"}`,
                            },
                            {
                                label: "CPAlead private beta allowlist configured",
                                ready: readiness.privateBetaEmailCount > 0,
                                detail: `${readiness.privateBetaEmailCount} email${readiness.privateBetaEmailCount === 1 ? "" : "s"} allowlisted`,
                            },
                            {
                                label: "CPAlead wall access mode",
                                ready: wallAccessReady,
                                detail: readiness.publicEnabled
                                    ? "Public beta enabled"
                                    : privateBetaReady
                                        ? "Private beta can be tested by allowlisted accounts"
                                        : "No public or private beta access configured",
                            },
                            {
                                label: "Required CPAlead env vars",
                                ready: providerEnvReady,
                                detail: missingRequiredEnv.length ? `Missing: ${missingRequiredEnv.join(", ")}` : "All required values are set",
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
                                label: "CPAlead automatic postbacks disabled",
                                ready: cpaleadAutomaticPostbacksDisabled,
                                detail: config?.status ?? "missing",
                            },
                            {
                                label: "CPAlead direct GET disabled",
                                ready: Boolean(config && !config.allowed_methods?.includes("GET")),
                                detail: config?.allowed_methods?.join(", ") || "missing",
                            },
                            {
                                label: "CPAlead postback config stores no secret",
                                ready: cpaleadManualPostbackSafe,
                                detail: cpaleadManualPostbackSafe
                                    ? "secret_type none, no secret env var"
                                    : `secret_type ${config?.secret_type ?? "missing"} with ${config?.secret_env_var ? "secret env var set" : "no secret env var"}`,
                            },
                            {
                                label: "Manual credit workflow available",
                                ready: manualReviewReady && supportTicketsReady,
                                detail: manualReviewReady && supportTicketsReady
                                    ? "Admin audit and support ticket systems are available"
                                    : "Missing admin audit or support ticket table",
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

                    <AdminPanel title="Recent activity" description="Last 7 days. CPAlead rewards are credited manually, not from automatic postbacks.">
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
                        description="Resolve missing env, manual-credit config, offer, or table prerequisites before testing."
                    />
                    <DecisionCard
                        title="Blocked for public launch"
                        active
                        critical
                        description="Public rewards launch remains blocked until manual credit operations are proven in production and cashouts/withdrawals are implemented."
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
