import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Guides | Admin" };

const STATUS_STYLES: Record<string, string> = {
    draft:     "bg-gray-100 text-gray-500",
    published: "bg-green-100 text-green-800",
};

export default async function AdminGuidesPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

    const { data: guides } = await supabase
        .from("guides")
        .select("id, title, slug, status, difficulty, estimated_time, updated_at, published_at, game:games(name, slug)")
        .order("updated_at", { ascending: false })
        .limit(200);

    const rows = guides ?? [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">CMS</p>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Guides</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Step-by-step completion guides linked to specific games. Published guides appear on game pages.
                    </p>
                </div>
                <Link
                    href="/app/admin/guides/new"
                    className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition shadow-sm"
                >
                    + New Guide
                </Link>
            </div>

            {/* Stats chips */}
            <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-700">
                    {rows.filter(g => g.status === "published").length} published
                </span>
                <span className="px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-500">
                    {rows.filter(g => g.status === "draft").length} draft
                </span>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3 text-left">Title</th>
                            <th className="px-4 py-3 text-left hidden md:table-cell">Game</th>
                            <th className="px-4 py-3 text-left hidden lg:table-cell">Difficulty</th>
                            <th className="px-4 py-3 text-left hidden lg:table-cell">Time</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right hidden md:table-cell">Updated</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((guide) => {
                            const game = Array.isArray(guide.game) ? guide.game[0] : guide.game;
                            const updatedDate = guide.updated_at
                                ? new Date(guide.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                : "—";
                            return (
                                <tr key={guide.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-gray-900 leading-snug">{guide.title}</div>
                                        <div className="text-xs text-gray-400 font-mono mt-0.5">{guide.slug}</div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        {game?.slug ? (
                                            <Link href={`/offers/${game.slug}`} className="text-gray-700 hover:text-blue-600 transition-colors text-sm" target="_blank">
                                                {game.name}
                                            </Link>
                                        ) : <span className="text-gray-400">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs capitalize hidden lg:table-cell">
                                        {guide.difficulty ?? "—"}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                                        {guide.estimated_time ?? "—"}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[guide.status] ?? "bg-gray-100 text-gray-500"}`}>
                                            {guide.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-xs text-gray-400 hidden md:table-cell">
                                        {updatedDate}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={`/app/admin/guides/${guide.id}/edit`}
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
                        <div className="text-3xl mb-3">📖</div>
                        <div className="text-sm font-semibold text-gray-600 mb-1">No guides yet</div>
                        <p className="text-xs text-gray-400 mb-4">
                            Create your first guide to help users complete offerwall tasks.
                        </p>
                        <Link
                            href="/app/admin/guides/new"
                            className="inline-flex items-center gap-1 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition"
                        >
                            + Write the first guide
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
