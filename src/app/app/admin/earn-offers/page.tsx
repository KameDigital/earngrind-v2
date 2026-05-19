import { AdminPageHeader, AdminPanel, AdminStatCard } from "@/components/admin/AdminUi";
import { EARN_REWARDS_BETA_WARNING, formatCents, formatList } from "@/lib/earn-rewards";
import { requireAdminOrEditor } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Earn Offers | EarnGrind Admin" };

type PartnerRow = {
    id: string;
    slug: string;
    name: string;
    status: string;
    created_at: string;
    postback_configs: { provider_slug: string; status: string; secret_type: string; signature_algorithm: string }[] | null;
};

type EarnOfferRow = {
    id: string;
    partner_id: string;
    title: string;
    slug: string;
    status: string;
    countries: string[] | null;
    devices: string[] | null;
    vertical: string | null;
    payout_cents: number;
    user_reward_cents: number;
    currency: string;
    incentive_allowed: boolean;
    reward_allowed: boolean;
    pending_days: number;
    partner: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

export default async function EarnOffersAdminPage() {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) redirect(auth.status === 401 ? "/login" : "/app/dashboard");

    const db = createAdminClient();
    const [partnersRes, offersRes] = await Promise.all([
        db
            .from("offer_partners")
            .select(`
                id,
                slug,
                name,
                status,
                created_at,
                postback_configs:offer_partner_postback_configs(provider_slug, status, secret_type, signature_algorithm)
            `)
            .order("created_at", { ascending: false }),
        db
            .from("earn_offers")
            .select(`
                id,
                partner_id,
                title,
                slug,
                status,
                countries,
                devices,
                vertical,
                payout_cents,
                user_reward_cents,
                currency,
                incentive_allowed,
                reward_allowed,
                pending_days,
                partner:offer_partners(name, slug)
            `)
            .order("created_at", { ascending: false }),
    ]);

    const partners = (partnersRes.data ?? []) as PartnerRow[];
    const offers = (offersRes.data ?? []) as EarnOfferRow[];
    const activeOffers = offers.filter((offer) => offer.status === "active").length;
    const rewardableOffers = offers.filter((offer) => offer.reward_allowed && Number(offer.user_reward_cents) > 0).length;

    return (
        <div className="space-y-6">
            <AdminPageHeader
                eyebrow="Tracked Rewards"
                title="Earn offers"
                description="Read-only Phase 1 inventory for EarnGrind-owned tracked reward offers."
            />

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                {EARN_REWARDS_BETA_WARNING}
            </div>

            <section className="grid gap-3 sm:grid-cols-3">
                <AdminStatCard label="Partners" value={partners.length} description="Tracked offer partners configured." />
                <AdminStatCard label="Active offers" value={activeOffers} tone={activeOffers > 0 ? "good" : "neutral"} description="Offers available to redirect." />
                <AdminStatCard label="Rewardable" value={rewardableOffers} description="Offers requiring login before redirect." />
            </section>

            <AdminPanel title="Partners" description="Partner records backing tracked offer URLs and postback events.">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                        <thead className="text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                            <tr>
                                <th className="px-3 py-2">Partner</th>
                                <th className="px-3 py-2">Slug</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Postbacks</th>
                                <th className="px-3 py-2">ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {partners.map((partner) => (
                                <tr key={partner.id}>
                                    <td className="px-3 py-3 font-bold text-gray-950">{partner.name}</td>
                                    <td className="px-3 py-3 text-gray-600">{partner.slug}</td>
                                    <td className="px-3 py-3">{statusBadge(partner.status)}</td>
                                    <td className="px-3 py-3 text-xs text-gray-600">
                                        {partner.postback_configs?.length ? (
                                            <div className="space-y-1">
                                                {partner.postback_configs.map((config) => (
                                                    <div key={config.provider_slug}>
                                                        <span className="font-mono">{config.provider_slug}</span>
                                                        <span className="ml-2">{config.status}</span>
                                                        <span className="ml-2 text-gray-400">{config.secret_type}/{config.signature_algorithm}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : "Not configured"}
                                    </td>
                                    <td className="px-3 py-3 font-mono text-xs text-gray-500">{partner.id}</td>
                                </tr>
                            ))}
                            {partners.length === 0 ? (
                                <tr>
                                    <td className="px-3 py-6 text-gray-500" colSpan={5}>No partners seeded yet.</td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </AdminPanel>

            <AdminPanel title="Earn offers" description="Copy an active offer ID to test /go/earn/[offerId].">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                        <thead className="text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                            <tr>
                                <th className="px-3 py-2">Offer</th>
                                <th className="px-3 py-2">Partner</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Payout</th>
                                <th className="px-3 py-2">User reward</th>
                                <th className="px-3 py-2">Eligibility</th>
                                <th className="px-3 py-2">Flags</th>
                                <th className="px-3 py-2">ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {offers.map((offer) => {
                                const partner = Array.isArray(offer.partner) ? offer.partner[0] : offer.partner;
                                return (
                                    <tr key={offer.id} className="align-top">
                                        <td className="px-3 py-3">
                                            <div className="font-bold text-gray-950">{offer.title}</div>
                                            <div className="mt-1 text-xs text-gray-500">{offer.slug}</div>
                                            {offer.vertical ? <div className="mt-1 text-xs text-gray-400">{offer.vertical}</div> : null}
                                        </td>
                                        <td className="px-3 py-3 text-gray-600">{partner?.name ?? "Unknown"}</td>
                                        <td className="px-3 py-3">{statusBadge(offer.status)}</td>
                                        <td className="px-3 py-3 font-semibold text-gray-800">{formatCents(offer.payout_cents, offer.currency)}</td>
                                        <td className="px-3 py-3 font-semibold text-gray-800">{formatCents(offer.user_reward_cents, offer.currency)}</td>
                                        <td className="px-3 py-3 text-xs leading-relaxed text-gray-600">
                                            <div>Countries: {formatList(offer.countries)}</div>
                                            <div>Devices: {formatList(offer.devices)}</div>
                                            <div>Pending: {offer.pending_days} days</div>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-gray-600">
                                            <div>Incentive: {offer.incentive_allowed ? "Yes" : "No"}</div>
                                            <div>Reward: {offer.reward_allowed ? "Yes" : "No"}</div>
                                        </td>
                                        <td className="px-3 py-3 font-mono text-xs text-gray-500">{offer.id}</td>
                                    </tr>
                                );
                            })}
                            {offers.length === 0 ? (
                                <tr>
                                    <td className="px-3 py-6 text-gray-500" colSpan={8}>No earn offers seeded yet.</td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </AdminPanel>
        </div>
    );
}

function statusBadge(status: string) {
    const classes = status === "active"
        ? "border-lime-200 bg-lime-50 text-lime-800"
        : status === "paused"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : status === "archived"
                ? "border-gray-200 bg-gray-50 text-gray-600"
                : "border-blue-200 bg-blue-50 text-blue-800";

    return (
        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold capitalize ${classes}`}>
            {status}
        </span>
    );
}
