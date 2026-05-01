import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Legacy Offers | Admin" };

const STATUS_STYLES: Record<string, string> = {
    active:  "bg-green-100 text-green-800",
    expired: "bg-gray-100 text-gray-500",
    boosted: "bg-purple-100 text-purple-800",
    paused:  "bg-yellow-100 text-yellow-700",
};

export default async function AdminOffersPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin","editor"].includes(profile.role)) redirect("/app/dashboard");

    const { data: offers } = await supabase
        .from("offers")
        .select(`
            id, payout_usd, status, is_featured, is_boosted, updated_at,
            game:games(name, slug),
            platform:platforms(name, slug)
        `)
        .in("status", ["active","expired","boosted","paused"])
        .order("updated_at", { ascending: false })
        .limit(200);

    const rows = offers ?? [];

    return (
        <div className="space-y-6">
            {/* ── Page header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Legacy Offers</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Source table: offers. Pipeline-managed legacy rows used for redirect resolution and unified_offers_view.
                        You can edit payout, status, and flags — but not create new rows.
                    </p>
                </div>
                <div className="flex-shrink-0 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm text-center min-w-[100px]">
                    <div className="text-2xl font-extrabold text-gray-900">{rows.length}</div>
                    <div className="text-xs font-medium text-gray-500 mt-0.5">offers loaded</div>
                </div>
            </div>

            {/* ── Context chip ── */}
            <div className="flex flex-wrap gap-2 text-xs">
                <InfoChip color="green"  label={`${rows.filter(o => o.status === "active").length} active`} />
                <InfoChip color="purple" label={`${rows.filter(o => o.status === "boosted").length} boosted`} />
                <InfoChip color="yellow" label={`${rows.filter(o => o.status === "paused").length} paused`} />
                <InfoChip color="gray"   label={`${rows.filter(o => o.status === "expired").length} expired`} />
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3 text-left">Game</th>
                            <th className="px-4 py-3 text-left">Platform</th>
                            <th className="px-4 py-3 text-right">Payout</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Flags</th>
                            <th className="px-4 py-3 text-right">Updated</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((offer) => {
                            const game     = Array.isArray(offer.game)     ? offer.game[0]     : offer.game;
                            const platform = Array.isArray(offer.platform) ? offer.platform[0] : offer.platform;
                            return (
                                <tr key={offer.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-4 py-3 font-semibold text-gray-900">
                                        {game?.slug ? (
                                            <Link href={`/offers/${game.slug}`} className="hover:text-blue-600 transition-colors" target="_blank">
                                                {game.name ?? "—"}
                                            </Link>
                                        ) : (game?.name ?? "—")}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{platform?.name ?? "—"}</td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                                        ${Number(offer.payout_usd).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[offer.status] ?? "bg-gray-100 text-gray-500"}`}>
                                            {offer.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm space-x-1">
                                        {offer.is_featured && <span title="Featured">⭐</span>}
                                        {offer.is_boosted  && <span title="Boosted">🚀</span>}
                                        {!offer.is_featured && !offer.is_boosted && <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-400 text-xs">
                                        {new Date(offer.updated_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={`/app/admin/offers/${offer.id}/edit`}
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
                        <div className="text-3xl mb-3">📥</div>
                        <div className="text-sm font-semibold text-gray-600 mb-1">No legacy offers found</div>
                        <p className="text-xs text-gray-400">Offers will appear here once the ingestion pipeline runs.</p>
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
