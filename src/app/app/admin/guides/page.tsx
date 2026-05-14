import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import GuideAdminActions from "./GuideAdminActions";
import { analyzeGuideQuality } from "@/lib/guide-quality";
import { analyzeGuideBodyHealth, type GuideBodyHealth } from "@/lib/guide-body-health";
import { STATIC_GUIDES } from "@/lib/static-guides";

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

function statusHref(status?: string) {
    return status ? `/app/admin/guides?status=${encodeURIComponent(status)}` : "/app/admin/guides";
}

function staticGuideSourcePath(href: string) {
    return `src/app${href}/page.tsx`;
}

function HealthBadges({ quality, bodyHealth, guide }: { quality: ReturnType<typeof analyzeGuideQuality>; bodyHealth: GuideBodyHealth; guide: { needs_variation: boolean | null; seo_title: string | null; seo_description: string | null } }) {
    const badges: Array<{ label: string; className: string }> = [];
    if (bodyHealth.hasMixedMarkdownHtml) badges.push({ label: "Mixed body", className: "bg-red-50 text-red-700 ring-red-100" });
    if (bodyHealth.hasBody && bodyHealth.headingCount === 0) badges.push({ label: "No sections", className: "bg-red-50 text-red-700 ring-red-100" });
    if (quality.score < 60) badges.push({ label: "Low SEO", className: "bg-red-50 text-red-700 ring-red-100" });
    if (quality.internalLinkCount < 2) badges.push({ label: "Needs links", className: "bg-amber-50 text-amber-800 ring-amber-100" });
    if (!guide.seo_title || !guide.seo_description) badges.push({ label: "Missing meta", className: "bg-blue-50 text-blue-700 ring-blue-100" });
    if (guide.needs_variation) badges.push({ label: "Needs variation", className: "bg-orange-50 text-orange-700 ring-orange-100" });
    if (badges.length === 0) badges.push({ label: "Healthy", className: "bg-green-50 text-green-700 ring-green-100" });

    return (
        <div className="mt-2 flex flex-wrap gap-1.5">
            {badges.slice(0, 3).map((badge) => (
                <span key={badge.label} className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${badge.className}`}>
                    {badge.label}
                </span>
            ))}
        </div>
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
    const cmsGuideSlugs = new Set(rows.map((guide) => guide.slug).filter(Boolean));

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

            <div className="flex flex-wrap gap-2">
                {[
                    { label: "All", value: "" },
                    { label: "Drafts", value: "draft" },
                    { label: "Needs Review", value: "needs_review" },
                    { label: "Published", value: "published" },
                ].map((tab) => {
                    const active = (statusFilter ?? "") === tab.value;
                    return (
                        <Link
                            key={tab.label}
                            href={statusHref(tab.value || undefined)}
                            className={`rounded-xl px-3 py-2 text-sm font-bold transition ${active ? "bg-gray-950 text-white" : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300"}`}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="grid gap-3 p-3 lg:hidden">
                    {rows.map((guide) => {
                        const game = Array.isArray(guide.game) ? guide.game[0] : guide.game;
                        const quality = analyzeGuideQuality({
                            bodyHtml: guide.body_md,
                            seoTitle: guide.seo_title,
                            seoDescription: guide.seo_description,
                            keywordTarget: guide.keyword_target,
                        });
                        const bodyHealth = analyzeGuideBodyHealth(guide.body_md);
                        return (
                            <div key={guide.id} className="rounded-xl border border-gray-200 bg-white p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="font-bold text-gray-950">{guide.title}</div>
                                        <div className="mt-1 truncate font-mono text-xs text-gray-400">{guide.slug}</div>
                                        {game?.name ? <div className="mt-1 text-xs text-gray-500">{game.name}</div> : null}
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[guide.status] ?? "bg-gray-100 text-gray-500"}`}>{guide.status}</span>
                                </div>
                                <HealthBadges quality={quality} bodyHealth={bodyHealth} guide={guide} />
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    <div><span className="font-bold text-gray-400">Keyword:</span> {guide.keyword_target ?? "n/a"}</div>
                                    <div><span className="font-bold text-gray-400">SEO:</span> {quality.score}</div>
                                    <div><span className="font-bold text-gray-400">Links:</span> {quality.internalLinkCount}</div>
                                    <div><span className="font-bold text-gray-400">Type:</span> {GUIDE_TYPE_LABELS[guide.guide_type ?? ""] ?? guide.guide_type ?? "n/a"}</div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Link href={`/app/admin/guides/${guide.id}/edit`} className="rounded-lg bg-gray-950 px-3 py-2 text-xs font-bold text-white">Edit</Link>
                                    <Link href={`/guides/${guide.slug}`} target="_blank" className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700">Preview</Link>
                                    <GuideAdminActions guideId={guide.id} status={guide.status} />
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full text-sm">
                        <thead className="sticky top-14 z-10 bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
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
                                const bodyHealth = analyzeGuideBodyHealth(guide.body_md);
                                const updatedDate = guide.updated_at ? new Date(guide.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "n/a";
                                return (
                                    <tr key={guide.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 min-w-[220px]">
                                            <div className="font-semibold text-gray-900 leading-snug">{guide.title}</div>
                                            <div className="text-xs text-gray-400 font-mono mt-0.5">{guide.slug}</div>
                                            {game?.name ? <div className="mt-1 text-xs text-gray-500">{game.name}</div> : null}
                                            <HealthBadges quality={quality} bodyHealth={bodyHealth} guide={guide} />
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

            <section className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Static / Code-backed</p>
                        <h2 className="mt-1 text-xl font-extrabold text-gray-950">Code-backed guides</h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-cyan-950/75">
                            These guides are rendered from code and are not editable in the CMS. To edit them, update the corresponding TSX/static guide files.
                        </p>
                    </div>
                    <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-cyan-800 ring-1 ring-cyan-100">
                        {STATIC_GUIDES.length} static guide{STATIC_GUIDES.length === 1 ? "" : "s"}
                    </span>
                </div>

                <div className="mt-4 grid gap-3">
                    {STATIC_GUIDES.map((guide) => {
                        const hasDuplicateCmsSlug = cmsGuideSlugs.has(guide.slug);
                        return (
                            <article key={guide.slug} className="rounded-xl border border-cyan-100 bg-white p-4 shadow-sm">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-base font-extrabold text-gray-950">{guide.title}</h3>
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-700">Static / Code-backed</span>
                                            {hasDuplicateCmsSlug ? (
                                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                                                    Slug also exists in CMS
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="mt-2 grid gap-1 text-xs text-gray-500 sm:grid-cols-2 lg:grid-cols-4">
                                            <div>
                                                <span className="font-bold text-gray-400">Slug:</span>{" "}
                                                <span className="font-mono">{guide.slug}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-400">Type:</span>{" "}
                                                {guide.eyebrow}
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-400">URL:</span>{" "}
                                                <span className="font-mono">{guide.href}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-400">Source:</span>{" "}
                                                <span className="font-mono">{staticGuideSourcePath(guide.href)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link
                                        href={guide.href}
                                        target="_blank"
                                        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-gray-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-gray-800"
                                    >
                                        View
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
