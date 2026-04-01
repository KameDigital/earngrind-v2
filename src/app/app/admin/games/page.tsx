import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic"; // always re-fetch — game list must be fresh
export const metadata = { title: "Games | Admin" };

const DEVICE_LABELS: Record<string, string> = {
    ios: "🍏 iOS", android: "🤖 Android", pc: "💻 PC", web: "🌐 Web",
};

export default async function AdminGamesPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin","editor"].includes(profile.role)) redirect("/app/dashboard");

    const { data: games } = await supabase
        .from("games")
        .select("id, name, slug, category, devices")
        .order("name");

    const rows = games ?? [];

    return (
        <div className="space-y-6">
            {/* ── Page header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Game Catalog</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Games are the base entity. Every offer and guide is linked to a game.
                        Create a game before adding ingested or manual offers.
                    </p>
                </div>
                <Link
                    href="/app/admin/games/new"
                    className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition shadow-sm"
                >
                    + New Game
                </Link>
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {rows.length} game{rows.length !== 1 ? "s" : ""} in catalog
                    </span>
                    <Link href="/app/admin/site-offers" className="text-xs text-blue-600 hover:underline font-medium">
                        → View Manual Offers
                    </Link>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Slug</th>
                            <th className="px-4 py-3 text-left">Category</th>
                            <th className="px-4 py-3 text-left">Devices</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((g) => (
                            <tr key={g.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-4 py-3 font-semibold text-gray-900">
                                    <Link href={`/offers/${g.slug}`} className="hover:text-blue-600 transition-colors" target="_blank">
                                        {g.name}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{g.slug}</td>
                                <td className="px-4 py-3">
                                    {g.category ? (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{g.category}</span>
                                    ) : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500">
                                    {(g.devices ?? []).map((d: string) => DEVICE_LABELS[d] ?? d).join("  ") || <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href={`/app/admin/games/${g.id}/edit`}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-700 text-xs font-semibold rounded-lg transition-all"
                                    >
                                        Edit
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {rows.length === 0 && (
                    <div className="py-16 text-center">
                        <div className="text-3xl mb-3">🎮</div>
                        <div className="text-sm font-semibold text-gray-600 mb-1">No games yet</div>
                        <Link href="/app/admin/games/new" className="text-xs text-blue-600 hover:underline">
                            Add your first game →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
