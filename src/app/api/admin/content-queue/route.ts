import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeGuideQuality } from "@/lib/guide-quality";
import { detectCannibalization } from "@/lib/keyword-cannibalization";

type QueueAction = "bulk_update" | "mark_needs_edit" | "mark_ready" | "schedule" | "publish" | "auto_prioritize";

const CONTENT_STATUSES = new Set(["draft", "needs_edit", "ready_to_publish", "scheduled", "published"]);

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role)) return { supabase, user: null };
  return { supabase, user };
}

function parseDate(value: unknown) {
  const raw = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function parseIntOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(100, Math.round(parsed))) : null;
}

function opportunityScoreFromText(value: string | null | undefined) {
  const match = String(value ?? "").match(/Opportunity score:\s*(\d+)/i);
  return match ? Number(match[1]) : 0;
}

async function readyGuardrails(supabase: ReturnType<typeof createClient>, guideIds: string[]) {
  const { data: guides, error } = await supabase
    .from("guides")
    .select("id, body_md, seo_title, seo_description, keyword_target, keyword_cluster_id, keyword_intent, needs_variation")
    .in("id", guideIds);

  if (error) throw new Error(error.message);

  const { data: allGuides } = await supabase
    .from("guides")
    .select("id, title, keyword_target, keyword_cluster_id, keyword_intent")
    .limit(2000);

  const issues = detectCannibalization(allGuides ?? []);
  return (guides ?? []).map((guide) => {
    const quality = analyzeGuideQuality({
      bodyHtml: guide.body_md,
      seoTitle: guide.seo_title,
      seoDescription: guide.seo_description,
      keywordTarget: guide.keyword_target,
    });
    const duplicateBlocker = issues.some((issue) => issue.severity === "block" && issue.guideIds.includes(guide.id));
    const fixes = [
      ...(quality.score < 80 ? [`SEO score is ${quality.score}; needs 80+.`] : []),
      ...(quality.internalLinkCount < 2 ? ["At least 2 internal links are required."] : []),
      ...(quality.requiredErrors.some((item) => /FAQ/i.test(item)) ? ["FAQ section is required."] : []),
      ...(duplicateBlocker ? ["Duplicate keyword blocker detected."] : []),
      ...(guide.needs_variation ? ["Guide is marked needs_variation."] : []),
    ];
    return { guideId: guide.id, ok: fixes.length === 0, fixes };
  });
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const action = String(body.action ?? "") as QueueAction;
  const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean).slice(0, 200) : [];

  if (action === "auto_prioritize") {
    const { data: guides, error } = await supabase
      .from("guides")
      .select("id, body_md, seo_title, seo_description, keyword_target, key_takeaways, max_payout_usd, needs_variation, status")
      .neq("status", "published")
      .limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const ranked = (guides ?? []).map((guide) => {
      const quality = analyzeGuideQuality({
        bodyHtml: guide.body_md,
        seoTitle: guide.seo_title,
        seoDescription: guide.seo_description,
        keywordTarget: guide.keyword_target,
      });
      const opportunity = opportunityScoreFromText(guide.key_takeaways);
      const payoutScore = Math.min(20, Math.floor((Number(guide.max_payout_usd ?? 0) / 100) * 5));
      const variationPenalty = guide.needs_variation ? 25 : 0;
      return {
        id: guide.id,
        rankScore: opportunity + quality.score + payoutScore - variationPenalty,
      };
    }).sort((a, b) => b.rankScore - a.rankScore);

    for (let index = 0; index < ranked.length; index++) {
      await supabase.from("guides").update({ publish_priority: index + 1, content_status: "draft" }).eq("id", ranked[index].id);
    }
    return NextResponse.json({ updated: ranked.length });
  }

  if (ids.length === 0) return NextResponse.json({ error: "Select at least one guide." }, { status: 400 });

  if (action === "mark_ready") {
    const checks = await readyGuardrails(supabase, ids);
    const failed = checks.filter((check) => !check.ok);
    if (failed.length > 0) {
      await supabase.from("guides").update({ content_status: "needs_edit" }).in("id", failed.map((item) => item.guideId));
      return NextResponse.json({ error: "Some guides failed publishing guardrails.", checks }, { status: 422 });
    }
    const { error } = await supabase.from("guides").update({ content_status: "ready_to_publish" }).in("id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ updated: ids.length, checks });
  }

  if (action === "publish") {
    const checks = await readyGuardrails(supabase, ids);
    const failed = checks.filter((check) => !check.ok);
    if (failed.length > 0) return NextResponse.json({ error: "Publish blocked by guardrails.", checks }, { status: 422 });
    const { error } = await supabase
      .from("guides")
      .update({ content_status: "published", status: "published", published_at: new Date().toISOString() })
      .in("id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ updated: ids.length, checks });
  }

  const update: Record<string, unknown> = {};
  if (action === "mark_needs_edit") update.content_status = "needs_edit";
  if (action === "schedule") {
    const date = parseDate(body.plannedPublishDate);
    if (!date) return NextResponse.json({ error: "A valid planned publish date is required." }, { status: 422 });
    update.planned_publish_date = date;
    update.content_status = "scheduled";
  }
  if (action === "bulk_update") {
    const priority = parseIntOrNull(body.publishPriority);
    const date = parseDate(body.plannedPublishDate);
    const status = String(body.contentStatus ?? "");
    if (priority !== null) update.publish_priority = priority;
    if (date) update.planned_publish_date = date;
    if (CONTENT_STATUSES.has(status)) update.content_status = status;
    if (body.assignedTo !== undefined) update.assigned_to = String(body.assignedTo ?? "").trim() || null;
    if (body.editorNotes !== undefined) update.editor_notes = String(body.editorNotes ?? "").trim() || null;
  }

  if (Object.keys(update).length === 0) return NextResponse.json({ error: "No update fields provided." }, { status: 422 });
  const { error } = await supabase.from("guides").update(update).in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: ids.length });
}
