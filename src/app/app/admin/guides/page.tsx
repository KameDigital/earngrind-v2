import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import GuideAdminActions from "./GuideAdminActions";
import { analyzeGuideQuality } from "@/lib/guide-quality";

export const dynamic = "force-dynamic";
export const metadata = { title: "Guides | Admin" };

const STATUS_STYLES: Record<string, string> = {
    draft: "bg-gray-100 text-gray-500",
    needs_review: "bg-amber-100 text-amber-800",
    published: "bg-green-100 text-green-800",
};

const GUIDE_TYPE_LABELS: Record<string, string> = {
    game_offer: "Game Offer Guide",
    platform_review: "Platform Review",
    offer_comparison: "Offer Comparison",
    payout_guide: "Payout Guide",
};

function queryValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function FilterInput({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
            <input name={name} defaultValue={defaultValue ?? ""} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        </label>
    );
}

export default async function AdminGuidesPage({
    searchParams,
}: {
    searchParams?: Record<string, string | string[] | undefined>;
}) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

    const statusFilter = queryValue(searchParams?.status);
    const guideTypeFilter = queryValue(searchParams?.guide_type);
    const batchFilter = queryValue(searchParams?.batch_name);
    const keywordFilter = queryValue(searchParams?.keyword);
    const gameFilter = queryValue(searchParams?.game);
    const platformFilter = queryValue(searchParams?.platform);
    const clusterFilter = queryValue(searchParams?.cluster);

    let query = supabase
        .from("guides")
        .select("id, title, slug, status, difficulty, estimated_time, updated_at, published_at, body_md, seo_title, seo_description, keyword_target, guide_type, batch_name, platform_name, keyword_cluster_id, keyword_intent, angle_type, needs_variation, internal_link_suggestions, game:games(name, slug)")
        .order("updated_at", { ascending: false })
        .limit(300);

    if (statusFilter) query = query.eq("status", statusFilter);
    if (guideTypeFilter) query = query.eq("guide_type", guideTypeFilter);
    if (batchFilter) query = query.ilike("batch_name", `%${batchFilter}%`);
    if (keywordFilter) query = query.ilike("keyword_target", `%${keywordFilter}%`);
    if (platformFilter) query = query.ilike("platform_name", `%${platformFilter}%`);
    if (clusterFilter) query = query.eq("keyword_cluster_id", clusterFilter);

    const { data: guides } = await query;

    const rows = (guides ?? []).filter((guide) => {
        if (!gameFilter) return true;
        const game = Array.isArray(guide.game) ? guide.game[0] : guide.game;
        return game?.name?.toLowerCase().includes(gameFilter.toLowerCase());
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">CMS</p>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Guides</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Review drafts, check SEO quality, connect internal links, and publish only when ready.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href="/app/admin/guides/internal-links" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:border-gray-300 transition shadow-sm">
                        Internal Links
                    </Link>
                    <Link href="/app/admin/guides/batch-generate" className="inline-flex items-center gap-2 px-4 py-2.5 bg-lime-100 text-lime-900 text-sm font-semibold rounded-xl hover:bg-lime-200 transition shadow-sm">
                        Generate Guides
                    </Link>
                    <Link href="/app/admin/guides/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition shadow-sm">
                        + New Guide
                    </Link>
                </div>
            </div>

            <form className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
                    <label className="block">
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Status</span>
                        <select name="status" defaultValue={statusFilter ?? ""} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                            <option value="">All</option>
                            <option value="draft">Draft</option>
                            <option value="needs_review">Needs Review</option>
                            <option value="published">Published</option>
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Guide Type</span>
                        <select name="guide_type" defaultValue={guideTypeFilter ?? ""} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                            <option value="">All</option>
                            {Object.entries(GUIDE_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </label>
                    <FilterInput name="batch_name" label="Batch Name" defaultValue={batchFilter} />
                    <FilterInput name="keyword" label="Keyword Target" defaultValue={keywordFilter} />
                    <FilterInput name="game" label="Game" defaultValue={gameFilter} />
                    <FilterInput name="platform" label="Platform" defaultValue={platformFilter} />
                    <FilterInput name="cluster" label="Cluster" defaultValue={clusterFilter} />
                </div>
                <div className="mt-3 flex gap-2">
                    <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white">Filter</button>
                    <Link href="/app/admin/guides" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700">Clear</Link>
                </div>
            </form>

            <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-700">{rows.filter(g => g.status === "published").length} published</span>
                <span className="px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-700">{rows.filter(g => g.status === "needs_review").length} needs review</span>
                <span className="px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-500">{rows.filter(g => g.status === "draft").length} draft</span>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 text-left">Title</th>
                                <th className="px-4 py-3 text-left">Keyword</th>
                                <th className="px-4 py-3 text-left">Type</th>
                                <th className="px-4 py-3 text-left">Batch</th>
                                <th className="px-4 py-3 text-left">Cluster</th>
                                <th className="px-4 py-3 text-left">Intent</th>
                                <th className="px-4 py-3 text-center">SEO</th>
                                <th className="px-4 py-3 text-center">Links</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Updated</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((guide) => {
                                const game = Array.isArray(guide.game) ? guide.game[0] : guide.game;
                                const quality = analyzeGuideQuality({
                                    bodyHtml: guide.body_md,
                                    seoTitle: guide.seo_title,
                                    seoDescription: guide.seo_description,
                                    keywordTarget: guide.keyword_target,
                                });
                                const updatedDate = guide.updated_at ? new Date(guide.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "n/a";
                                return (
                                    <tr key={guide.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 min-w-[220px]">
                                            <div className="font-semibold text-gray-900 leading-snug">{guide.title}</div>
                                            <div className="text-xs text-gray-400 font-mono mt-0.5">{guide.slug}</div>
                                            {game?.name ? <div className="mt-1 text-xs text-gray-500">{game.name}</div> : null}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 min-w-[180px]">{guide.keyword_target ?? "n/a"}</td>
                                        <td className="px-4 py-3 text-gray-500">{GUIDE_TYPE_LABELS[guide.guide_type ?? ""] ?? guide.guide_type ?? "n/a"}</td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {guide.batch_name ? <Link href={`/app/admin/guides/batches/${encodeURIComponent(guide.batch_name)}`} className="hover:text-gray-900 underline">{guide.batch_name}</Link> : "n/a"}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {guide.keyword_cluster_id ? <Link href={`/app/admin/guides?cluster=${encodeURIComponent(guide.keyword_cluster_id)}`} className="hover:text-gray-900 underline">{guide.keyword_cluster_id}</Link> : "n/a"}
                                            {guide.needs_variation ? <div className="mt-1 text-[11px] font-bold text-orange-600">needs variation</div> : null}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{guide.keyword_intent ?? "n/a"}{guide.angle_type ? <div className="text-[11px] text-gray-400">{guide.angle_type}</div> : null}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`rounded-full px-2 py-1 text-xs font-bold ${quality.score >= 80 ? "bg-green-100 text-green-800" : quality.score >= 60 ? "bg-amber-100 text-amber-800" : "bg-red-50 text-red-700"}`}>{quality.score}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-600">{quality.internalLinkCount}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[guide.status] ?? "bg-gray-100 text-gray-500"}`}>{guide.status}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-xs text-gray-400">{updatedDate}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex flex-wrap items-center justify-end gap-2">
                                                <Link href={`/app/admin/guides/${guide.id}/edit`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-700 text-xs font-semibold rounded-lg transition-all">Edit</Link>
                                                <Link href={`/guides/${guide.slug}`} target="_blank" className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-700 text-xs font-semibold rounded-lg transition-all">Preview</Link>
                                                <GuideAdminActions guideId={guide.id} status={guide.status} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {rows.length === 0 ? <div className="py-16 text-center text-sm font-semibold text-gray-500">No guides match these filters.</div> : null}
            </div>
        </div>
    );
}
