import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site Offers | Admin" };

const STATUS_STYLES: Record<string, string> = {
    active:  "bg-green-100 text-green-800",
    expired: "bg-gray-100 text-gray-500",
    boosted: "bg-purple-100 text-purple-800",
    paused:  "bg-yellow-100 text-yellow-700",
};

export default async function AdminSiteOffersPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin","editor"].includes(profile.role)) redirect("/app/dashboard");

    const { data: siteOffers } = await supabase
        .from("site_offers")
        .select(`
            id, payout_usd, status, goal_text, updated_at,
            game:games(name, slug),
            site:platforms(name),
            provider:providers(name)
        `)
        .in("status", ["active","expired","boosted","paused"])
        .order("updated_at", { ascending: false })
        .limit(200);

    const rows = siteOffers ?? [];

    return (
        <div className="space-y-6">
            {/* ── Page header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Site Offers</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Source table: site_offers. Hand-curated offers that power the{" "}
                        <span className="font-medium text-gray-700">&ldquo;Compare GPT Sites&rdquo;</span>{" "}
                        section on game pages. You create and manage these directly.
                    </p>
                </div>
                <Link
                    href="/app/admin/site-offers/new"
                    className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition shadow-sm"
                >
                    + New Entry
                </Link>
            </div>

            {/* ── Context ── */}
            <div className="flex flex-wrap gap-2 text-xs">
                <InfoChip color="green"  label={`${rows.filter(o => o.status === "active").length} active`} />
                <InfoChip color="purple" label={`${rows.filter(o => o.status === "boosted").length} boosted`} />
                <InfoChip color="yellow" label={`${rows.filter(o => o.status === "paused").length} paused`} />
                <InfoChip color="gray"   label={`${rows.filter(o => o.status === "expired").length} expired`} />
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3 text-left">Game</th>
                            <th className="px-4 py-3 text-left">Site</th>
                            <th className="px-4 py-3 text-left">Provider</th>
                            <th className="px-4 py-3 text-right">Payout</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-left hidden lg:table-cell">Goal</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((so) => {
                            const game     = Array.isArray(so.game)     ? so.game[0]     : so.game;
                            const site     = Array.isArray(so.site)     ? so.site[0]     : so.site;
                            const provider = Array.isArray(so.provider) ? so.provider[0] : so.provider;
                            return (
                                <tr key={so.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-gray-900">
                                        {game?.slug ? (
                                            <Link href={`/offers/${game.slug}`} className="hover:text-blue-600 transition-colors" target="_blank">
                                                {game.name ?? "—"}
                                            </Link>
                                        ) : (game?.name ?? "—")}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-sm">{site?.name ?? "—"}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{provider?.name ?? "—"}</td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                                        ${Number(so.payout_usd).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[so.status] ?? "bg-gray-100 text-gray-500"}`}>
                                            {so.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[200px] hidden lg:table-cell">
                                        {so.goal_text ?? "—"}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={`/app/admin/site-offers/${so.id}/edit`}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-700 text-xs font-semibold rounded-lg transition-all"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {rows.length === 0 && (
                    <div className="py-16 text-center">
                        <div className="text-3xl mb-3">✏️</div>
                        <div className="text-sm font-semibold text-gray-600 mb-1">No site offers yet</div>
                        <p className="text-xs text-gray-400 mb-3">
                            Create curated offers that appear in the &ldquo;Compare GPT Sites&rdquo; section.
                        </p>
                        <Link
                            href="/app/admin/site-offers/new"
                            className="inline-flex items-center gap-1 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition"
                        >
                            + Add the first entry
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoChip({ color, label }: { color: "green"|"gray"|"purple"|"yellow"; label: string }) {
    const colors = {
        green:  "bg-green-100 text-green-700",
        gray:   "bg-gray-100 text-gray-500",
        purple: "bg-purple-100 text-purple-700",
        yellow: "bg-yellow-100 text-yellow-700",
    };
    return (
        <span className={`px-2.5 py-1 rounded-full font-semibold ${colors[color]}`}>{label}</span>
    );
}
