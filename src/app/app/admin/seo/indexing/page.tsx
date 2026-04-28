import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { evaluateIndexingReadiness } from "@/lib/indexing-readiness";
import GuideAdminActions from "../../guides/GuideAdminActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Indexing Readiness | Admin" };

export default async function AdminIndexingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

  const { data: guides } = await supabase
    .from("guides")
    .select("id, title, slug, status, updated_at, published_at, body_md, seo_title, seo_description, keyword_target, keyword_cluster_id, keyword_intent, needs_variation")
    .order("updated_at", { ascending: false })
    .limit(500);

  const allGuides = guides ?? [];
  const publishedGuides = allGuides.filter((guide) => guide.status === "published");
  const rows = publishedGuides.map((guide) => ({
    guide,
    readiness: evaluateIndexingReadiness({
      guide,
      allGuides,
      includedInSitemap: guide.status === "published",
    }),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">SEO</p>
          <h1 className="mt-1 text-2xl font-extrabold text-gray-900">Indexing Readiness</h1>
          <p className="mt-2 text-sm text-gray-500">Audit published guides before requesting indexing or submitting sitemap updates.</p>
        </div>
        <Link href="/app/admin/seo/sitemap" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">Sitemap Preview</Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Published Guides</div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900">{publishedGuides.length}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Ready</div>
          <div className="mt-2 text-3xl font-extrabold text-lime-700">{rows.filter((row) => row.readiness.ready).length}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Blocked</div>
          <div className="mt-2 text-3xl font-extrabold text-red-600">{rows.filter((row) => !row.readiness.ready).length}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
              <tr>
                <th className="px-4 py-3">Guide</th>
                <th className="px-4 py-3">Keyword</th>
                <th className="px-4 py-3">Cluster</th>
                <th className="px-4 py-3">Intent</th>
                <th className="px-4 py-3 text-center">SEO</th>
                <th className="px-4 py-3 text-center">Readiness</th>
                <th className="px-4 py-3">Blockers / Warnings</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(({ guide, readiness }) => (
                <tr key={guide.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 min-w-[220px]">
                    <div className="font-bold text-gray-900">{guide.title}</div>
                    <div className="font-mono text-xs text-gray-400">{guide.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 min-w-[180px]">{guide.keyword_target ?? "n/a"}</td>
                  <td className="px-4 py-3 text-gray-500">{guide.keyword_cluster_id ?? "n/a"}</td>
                  <td className="px-4 py-3 text-gray-500">{guide.keyword_intent ?? "n/a"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${readiness.score >= 80 ? "bg-green-100 text-green-800" : readiness.score >= 60 ? "bg-amber-100 text-amber-800" : "bg-red-50 text-red-700"}`}>{readiness.score}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${readiness.ready ? "bg-green-100 text-green-800" : "bg-red-50 text-red-700"}`}>
                      {readiness.ready ? "Ready" : "Blocked"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 min-w-[260px]">
                    {readiness.blockers.length > 0 ? <div className="font-semibold text-red-600">{readiness.blockers.join(" ")}</div> : null}
                    {readiness.warnings.length > 0 ? <div className="mt-1 text-amber-700">{readiness.warnings.slice(0, 3).join(" ")}</div> : null}
                    {readiness.blockers.length === 0 && readiness.warnings.length === 0 ? "No issues detected." : null}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link href={`/app/admin/guides/${guide.id}/edit`} className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-900 hover:text-white">Edit</Link>
                      <Link href={`/guides/${guide.slug}`} target="_blank" className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-900 hover:text-white">Public</Link>
                      <GuideAdminActions guideId={guide.id} status={guide.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? <div className="p-10 text-center text-sm font-semibold text-gray-500">No published guides found.</div> : null}
      </div>
    </div>
  );
}
