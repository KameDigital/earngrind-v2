import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { analyzeGuideQuality } from "@/lib/guide-quality";
import ContentQueueClient, { type ContentQueueRow } from "./ContentQueueClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content Queue | Admin" };

function opportunityScoreFromText(value: string | null | undefined) {
  const match = String(value ?? "").match(/Opportunity score:\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

function hasFaq(bodyHtml: string | null | undefined) {
  return /<h2\b[^>]*>\s*faq\s*<\/h2>|<h[23]\b[^>]*>\s*faq\b/i.test(bodyHtml ?? "");
}

export default async function ContentQueuePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

  const { data: guides } = await supabase
    .from("guides")
    .select("id, title, slug, status, body_md, seo_title, seo_description, keyword_target, batch_name, key_takeaways, planned_publish_date, publish_priority, content_status, assigned_to, editor_notes, needs_variation")
    .order("publish_priority", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(500);

  const rows: ContentQueueRow[] = (guides ?? []).map((guide) => {
    const quality = analyzeGuideQuality({
      bodyHtml: guide.body_md,
      seoTitle: guide.seo_title,
      seoDescription: guide.seo_description,
      keywordTarget: guide.keyword_target,
    });
    return {
      id: guide.id,
      title: guide.title,
      slug: guide.slug,
      status: guide.status,
      contentStatus: guide.content_status ?? guide.status ?? "draft",
      keywordTarget: guide.keyword_target,
      batchName: guide.batch_name,
      opportunityScore: opportunityScoreFromText(guide.key_takeaways),
      seoScore: quality.score,
      internalLinkCount: quality.internalLinkCount,
      hasFaq: hasFaq(guide.body_md),
      plannedPublishDate: guide.planned_publish_date,
      publishPriority: guide.publish_priority,
      assignedTo: guide.assigned_to,
      editorNotes: guide.editor_notes,
      needsVariation: guide.needs_variation,
    };
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">Publishing Pipeline</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">Content Queue</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
          Organize generated drafts into an editing, scheduling, and publishing workflow with guardrails before anything goes live.
        </p>
      </section>
      <ContentQueueClient initialRows={rows} />
    </div>
  );
}
