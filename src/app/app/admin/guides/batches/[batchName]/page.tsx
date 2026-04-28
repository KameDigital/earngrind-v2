import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { analyzeGuideQuality } from "@/lib/guide-quality";
import { evaluateIndexingReadiness } from "@/lib/indexing-readiness";
import GuideAdminActions from "../../GuideAdminActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Guide Batch | Admin" };

export default async function GuideBatchPage({ params }: { params: { batchName: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

  const batchName = decodeURIComponent(params.batchName);
  const { data: guides } = await supabase
    .from("guides")
    .select("id, title, slug, status, updated_at, published_at, body_md, seo_title, seo_description, keyword_target, guide_type, batch_name, keyword_cluster_id, keyword_intent, needs_variation")
    .eq("batch_name", batchName)
    .order("updated_at", { ascending: false });

  const rows = guides ?? [];
  const readinessRows = rows.map((guide) => ({
    guide,
    readiness: evaluateIndexingReadiness({
      guide,
      allGuides: rows,
      includedInSitemap: guide.status === "published",
    }),
  }));
  const readyCount = readinessRows.filter((row) => row.readiness.ready).length;
  const needsInternalLinks = readinessRows.filter((row) => row.readiness.blockers.some((blocker) => blocker.includes("internal links"))).length;
  const needsVariation = readinessRows.filter((row) => row.guide.needs_variation).length;
  const duplicateKeywordBlocked = readinessRows.filter((row) => row.readiness.blockers.some((blocker) => blocker.includes("Duplicate keyword"))).length;
  const missingSeoMetadata = readinessRows.filter((row) => row.readiness.blockers.some((blocker) => blocker.includes("SEO title") || blocker.includes("SEO description"))).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Generated Batch</p>
          <h1 className="mt-1 text-2xl font-extrabold text-gray-900">{batchName}</h1>
          <p className="mt-2 text-sm text-gray-500">{rows.length} guides in this batch.</p>
        </div>
        <Link href="/app/admin/guides" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">Back to guides</Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Indexing Readiness</p>
            <h2 className="mt-1 text-lg font-extrabold text-gray-900">Batch indexing checks</h2>
          </div>
          <Link href="/app/admin/seo/indexing" className="text-sm font-bold text-lime-700 hover:text-lime-800">Open indexing dashboard</Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          <div className="rounded-xl bg-green-50 p-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-green-700">Ready</div>
            <div className="mt-1 text-2xl font-extrabold text-green-800">{readyCount}</div>
          </div>
          <div className="rounded-xl bg-amber-50 p-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-amber-700">Needs Links</div>
            <div className="mt-1 text-2xl font-extrabold text-amber-800">{needsInternalLinks}</div>
          </div>
          <div className="rounded-xl bg-orange-50 p-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-orange-700">Needs Variation</div>
            <div className="mt-1 text-2xl font-extrabold text-orange-800">{needsVariation}</div>
          </div>
          <div className="rounded-xl bg-red-50 p-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-red-700">Duplicate Blocked</div>
            <div className="mt-1 text-2xl font-extrabold text-red-800">{duplicateKeywordBlocked}</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Missing SEO</div>
            <div className="mt-1 text-2xl font-extrabold text-gray-900">{missingSeoMetadata}</div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
              <tr>
                <th className="px-4 py-3">Guide</th>
                <th className="px-4 py-3">Keyword</th>
                <th className="px-4 py-3 text-center">Score</th>
                <th className="px-4 py-3">Missing Required Items</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((guide) => {
                const quality = analyzeGuideQuality({
                  bodyHtml: guide.body_md,
                  seoTitle: guide.seo_title,
                  seoDescription: guide.seo_description,
                  keywordTarget: guide.keyword_target,
                });
                return (
                  <tr key={guide.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{guide.title}</div>
                      <div className="font-mono text-xs text-gray-400">{guide.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{guide.keyword_target ?? "n/a"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${quality.score >= 80 ? "bg-green-100 text-green-800" : quality.score >= 60 ? "bg-amber-100 text-amber-800" : "bg-red-50 text-red-700"}`}>{quality.score}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {quality.requiredErrors.length > 0 ? quality.requiredErrors.join(" ") : "Required checks pass"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">{guide.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/app/admin/guides/${guide.id}/edit`} className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white">Edit</Link>
                        <GuideAdminActions guideId={guide.id} status={guide.status} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? <div className="p-10 text-center text-sm font-semibold text-gray-500">No guides found for this batch.</div> : null}
      </div>
    </div>
  );
}
