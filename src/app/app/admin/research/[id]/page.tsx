import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResearchEntryDetail from "./ResearchEntryDetail";

export const dynamic = "force-dynamic";
export const metadata = { title: "Research Entry | Admin" };

export default async function ResearchEntryPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

  const { data: entry } = await supabase
    .from("research_entries")
    .select("id, type, target_name, source_type, source_url, image_url, raw_text, extracted_data, tags, created_at, updated_at")
    .eq("id", params.id)
    .maybeSingle();

  if (!entry) notFound();

  const { data: relatedGuides } = await supabase
    .from("guides")
    .select("id, title, slug, status, keyword_target")
    .or(`title.ilike.%${entry.target_name}%,keyword_target.ilike.%${entry.target_name}%,platform_name.ilike.%${entry.target_name}%`)
    .order("updated_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">Research Locker</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">{entry.target_name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/app/admin/guides/batch-generate?mode=research_review&target=${encodeURIComponent(entry.target_name)}&type=${encodeURIComponent(entry.type)}&useStoredResearch=1`} className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800">
            Generate Review From This Research
          </Link>
          <Link href="/app/admin/research" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-300">
            Back to research
          </Link>
        </div>
      </div>

      <ResearchEntryDetail entry={entry} />

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-gray-900">Related Guides</h2>
        <div className="mt-3 divide-y divide-gray-100">
          {(relatedGuides ?? []).map((guide) => (
            <div key={guide.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div>
                <div className="font-bold text-gray-900">{guide.title}</div>
                <div className="text-xs text-gray-400">{guide.keyword_target ?? guide.slug} | {guide.status}</div>
              </div>
              <Link href={`/app/admin/guides/${guide.id}/edit`} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50">Edit</Link>
            </div>
          ))}
          {relatedGuides?.length ? null : <div className="py-6 text-sm font-semibold text-gray-500">No related guides found yet.</div>}
        </div>
      </section>
    </div>
  );
}
