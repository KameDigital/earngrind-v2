import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { analyzeGuideQuality } from "@/lib/guide-quality";
import { getGuideSitemapPriority } from "@/lib/indexing-readiness";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sitemap Preview | Admin" };

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSitemapPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

  const type = queryValue(searchParams?.type) ?? "guides";
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

  const [{ data: guides }, { count: draftCount }, { data: games }, { data: reviews }, { data: batches }] = await Promise.all([
    supabase
      .from("guides")
      .select("id, title, slug, status, updated_at, body_md, seo_title, seo_description, keyword_target, batch_name")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(500),
    supabase
      .from("guides")
      .select("id", { count: "exact", head: true })
      .in("status", ["draft", "needs_review"]),
    supabase
      .from("games")
      .select("id, name, slug, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500),
    supabase
      .from("reviews")
      .select("id, title, slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(300),
    supabase
      .from("guides")
      .select("batch_name, updated_at")
      .not("batch_name", "is", null)
      .order("updated_at", { ascending: false })
      .limit(300),
  ]);

  const guideRows = guides ?? [];
  const batchNames = Array.from(new Set((batches ?? []).map((row) => row.batch_name).filter(Boolean)));

  const tabs = [
    { value: "guides", label: "Guides" },
    { value: "games", label: "Games" },
    { value: "reviews", label: "Reviews" },
    { value: "batches", label: "Batches" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">SEO</p>
          <h1 className="mt-1 text-2xl font-extrabold text-gray-900">Sitemap Preview</h1>
          <p className="mt-2 text-sm text-gray-500">Validate crawlable guide URLs, priority, and freshness before submitting sitemap updates.</p>
        </div>
        <Link href="/sitemap.xml" target="_blank" className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white">Open sitemap.xml</Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Published Guides</div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900">{guideRows.length}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Draft / Needs Review</div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900">{draftCount ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Sitemap URL</div>
          <div className="mt-2 truncate text-sm font-bold text-lime-700">{baseUrl}/sitemap.xml</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/app/admin/seo/sitemap?type=${tab.value}`}
            className={`rounded-full px-4 py-2 text-sm font-bold ${type === tab.value ? "bg-lime-100 text-lime-900" : "border border-gray-200 bg-white text-gray-600"}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
              <tr>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Last Modified</th>
                <th className="px-4 py-3 text-center">SEO Score</th>
                <th className="px-4 py-3 text-center">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {type === "guides" ? guideRows.map((guide) => {
                const quality = analyzeGuideQuality({
                  bodyHtml: guide.body_md,
                  seoTitle: guide.seo_title,
                  seoDescription: guide.seo_description,
                  keywordTarget: guide.keyword_target,
                });
                const priority = getGuideSitemapPriority(quality.score);
                return (
                  <tr key={guide.id}>
                    <td className="px-4 py-3">
                      <Link href={`/guides/${guide.slug}`} target="_blank" className="font-bold text-gray-900 hover:text-lime-700">{baseUrl}/guides/{guide.slug}</Link>
                      <div className="text-xs text-gray-400">{guide.title}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{guide.updated_at ? new Date(guide.updated_at).toLocaleString() : "n/a"}</td>
                    <td className="px-4 py-3 text-center font-bold">{quality.score}</td>
                    <td className="px-4 py-3 text-center font-bold text-lime-700">{priority}</td>
                  </tr>
                );
              }) : null}
              {type === "games" ? (games ?? []).map((game) => (
                <tr key={game.id}>
                  <td className="px-4 py-3 font-bold text-gray-900">{baseUrl}/games/{game.slug}</td>
                  <td className="px-4 py-3 text-gray-600">{game.updated_at ? new Date(game.updated_at).toLocaleString() : "n/a"}</td>
                  <td className="px-4 py-3 text-center">n/a</td>
                  <td className="px-4 py-3 text-center font-bold text-lime-700">0.85</td>
                </tr>
              )) : null}
              {type === "reviews" ? (reviews ?? []).map((review) => (
                <tr key={review.id}>
                  <td className="px-4 py-3 font-bold text-gray-900">{baseUrl}/review/{review.slug}</td>
                  <td className="px-4 py-3 text-gray-600">{review.updated_at ? new Date(review.updated_at).toLocaleString() : "n/a"}</td>
                  <td className="px-4 py-3 text-center">n/a</td>
                  <td className="px-4 py-3 text-center font-bold text-lime-700">0.7</td>
                </tr>
              )) : null}
              {type === "batches" ? batchNames.map((batchName) => (
                <tr key={batchName}>
                  <td className="px-4 py-3">
                    <Link href={`/app/admin/guides/batches/${encodeURIComponent(batchName)}`} className="font-bold text-gray-900 hover:text-lime-700">{batchName}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">Grouped guide batch</td>
                  <td className="px-4 py-3 text-center">n/a</td>
                  <td className="px-4 py-3 text-center">n/a</td>
                </tr>
              )) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
