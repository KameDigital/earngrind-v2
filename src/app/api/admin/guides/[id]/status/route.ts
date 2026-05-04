import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeGuideQuality } from "@/lib/guide-quality";
import { detectCannibalization } from "@/lib/keyword-cannibalization";

type StatusAction = "draft" | "needs_review" | "published";

async function checkAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role)) return null;
  return user;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const user = await checkAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: guide, error } = await supabase
    .from("guides")
    .select("id, body_md, seo_title, seo_description, keyword_target, payout_verified_at, tasks_verified_at, provider_terms_verified_at, last_offer_check_at")
    .eq("id", params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!guide) return NextResponse.json({ error: "Guide not found." }, { status: 404 });

  return NextResponse.json(analyzeGuideQuality({
    bodyHtml: guide.body_md,
    seoTitle: guide.seo_title,
    seoDescription: guide.seo_description,
    keywordTarget: guide.keyword_target,
    payoutVerifiedAt: guide.payout_verified_at,
    tasksVerifiedAt: guide.tasks_verified_at,
    providerTermsVerifiedAt: guide.provider_terms_verified_at,
    lastOfferCheckAt: guide.last_offer_check_at,
  }));
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const user = await checkAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as { status?: StatusAction; force?: boolean };
  const nextStatus = body.status;
  if (!nextStatus || !["draft", "needs_review", "published"].includes(nextStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const { data: guide, error: fetchError } = await supabase
    .from("guides")
    .select("id, status, published_at, body_md, seo_title, seo_description, keyword_target, payout_verified_at, tasks_verified_at, provider_terms_verified_at, last_offer_check_at")
    .eq("id", params.id)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!guide) return NextResponse.json({ error: "Guide not found." }, { status: 404 });

  const quality = analyzeGuideQuality({
    bodyHtml: guide.body_md,
    seoTitle: guide.seo_title,
    seoDescription: guide.seo_description,
    keywordTarget: guide.keyword_target,
    payoutVerifiedAt: guide.payout_verified_at,
    tasksVerifiedAt: guide.tasks_verified_at,
    providerTermsVerifiedAt: guide.provider_terms_verified_at,
    lastOfferCheckAt: guide.last_offer_check_at,
  });
  const { data: relatedGuides } = await supabase
    .from("guides")
    .select("id, title, keyword_target, keyword_cluster_id, keyword_intent")
    .neq("id", params.id)
    .limit(200);
  const cannibalization = detectCannibalization([
    {
      id: guide.id,
      keyword_target: guide.keyword_target,
    },
    ...(relatedGuides ?? []),
  ]).filter((issue) => issue.guideIds.includes(guide.id));
  const duplicateKeyword = cannibalization.some((issue) => issue.type === "duplicate_keyword");

  if (nextStatus === "published" && (quality.requiredErrors.length > 0 || duplicateKeyword) && !body.force) {
    return NextResponse.json({
      error: "Publish blocked by checklist.",
      quality,
      cannibalization,
    }, { status: 422 });
  }

  const { data, error } = await supabase
    .from("guides")
    .update({
      status: nextStatus,
      ...(nextStatus === "published" && !guide.published_at ? { published_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select("id, status, published_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ guide: data, quality, cannibalization });
}
