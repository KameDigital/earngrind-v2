import { AdminButtonLink, AdminPageHeader, AdminStatCard } from "@/components/admin/AdminUi";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import EarnLabGalleryImportPanel from "./EarnLabGalleryImportPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site Offers | Admin" };

const STATUS_STYLES: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    expired: "bg-gray-100 text-gray-500",
    boosted: "bg-purple-100 text-purple-800",
    paused: "bg-yellow-100 text-yellow-700",
};

export default async function AdminSiteOffersPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

    const { data: siteOffers } = await supabase
        .from("site_offers")
        .select(`
            id, payout_usd, status, goal_text, updated_at,
            game:games(name, slug),
            site:platforms(name),
            provider:providers(name)
        `)
        .in("status", ["active", "expired", "boosted", "paused"])
        .order("updated_at", { ascending: false })
        .limit(200);

    const rows = siteOffers ?? [];

    return (
        <div className="space-y-6">
            <AdminPageHeader
                eyebrow="Offers"
                title="Manual Offers"
                description="Curated site_offers records that power comparison routes on game and guide pages."
                actions={<AdminButtonLink href="/app/admin/site-offers/new" variant="primary">New entry</AdminButtonLink>}
            />

            <EarnLabGalleryImportPanel />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AdminStatCard label="Active" value={rows.filter((offer) => offer.status === "active").length} tone="good" />
                <AdminStatCard label="Boosted" value={rows.filter((offer) => offer.status === "boosted").length} />
                <AdminStatCard label="Paused" value={rows.filter((offer) => offer.status === "paused").length} tone="warning" />
                <AdminStatCard label="Expired" value={rows.filter((offer) => offer.status === "expired").length} />
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-100 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-4 py-3 text-left">Game</th>
                                <th className="px-4 py-3 text-left">Site</th>
                                <th className="px-4 py-3 text-left">Provider</th>
                                <th className="px-4 py-3 text-right">Payout</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="hidden px-4 py-3 text-left lg:table-cell">Goal</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((offer) => {
                                const game = Array.isArray(offer.game) ? offer.game[0] : offer.game;
                                const site = Array.isArray(offer.site) ? offer.site[0] : offer.site;
                                const provider = Array.isArray(offer.provider) ? offer.provider[0] : offer.provider;

                                return (
                                    <tr key={offer.id} className="transition-colors hover:bg-gray-50">
                                        <td className="min-w-[180px] px-4 py-3 font-semibold text-gray-900">
                                            {game?.slug ? (
                                                <Link href={`/offers/${game.slug}`} className="hover:text-blue-600" target="_blank">
                                                    {game.name ?? "-"}
                                                </Link>
                                            ) : (game?.name ?? "-")}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{site?.name ?? "-"}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{provider?.name ?? "-"}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                                            ${Number(offer.payout_usd ?? 0).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[offer.status] ?? "bg-gray-100 text-gray-500"}`}>
                                                {offer.status}
                                            </span>
                                        </td>
                                        <td className="hidden max-w-[240px] truncate px-4 py-3 text-xs text-gray-400 lg:table-cell">
                                            {offer.goal_text ?? "-"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/app/admin/site-offers/${offer.id}/edit`}
                                                className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-900 hover:text-white"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {rows.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="text-sm font-semibold text-gray-600">No manual offers yet</div>
                        <p className="mb-3 mt-1 text-xs text-gray-400">
                            Create curated offers that appear in comparison sections.
                        </p>
                        <AdminButtonLink href="/app/admin/site-offers/new" variant="primary">Add the first entry</AdminButtonLink>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
