import { NextRequest, NextResponse } from "next/server";
import { renderMarkdown } from "@/app/guides/[slug]/markdownRenderer";
import { createClient } from "@/lib/supabase/server";
import { analyzeGuideQuality } from "@/lib/guide-quality";

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function checkAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role)) return null;
  return user;
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const user = await checkAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const bodyMd = typeof payload.body_md === "string" ? payload.body_md : "";
  const slug = normalize(payload.slug);
  const title = normalize(payload.title);
  const keyword = normalize(payload.keyword_target);
  const seoTitle = normalize(payload.seo_title);
  const quality = analyzeGuideQuality({
    bodyHtml: bodyMd ? renderMarkdown(bodyMd) : "",
    seoTitle: typeof payload.seo_title === "string" ? payload.seo_title : null,
    seoDescription: typeof payload.seo_description === "string" ? payload.seo_description : null,
    keywordTarget: typeof payload.keyword_target === "string" ? payload.keyword_target : null,
    payoutVerifiedAt: typeof payload.payout_verified_at === "string" ? payload.payout_verified_at : null,
    tasksVerifiedAt: typeof payload.tasks_verified_at === "string" ? payload.tasks_verified_at : null,
    providerTermsVerifiedAt: typeof payload.provider_terms_verified_at === "string" ? payload.provider_terms_verified_at : null,
    lastOfferCheckAt: typeof payload.last_offer_check_at === "string" ? payload.last_offer_check_at : null,
  });

  const conflictWarnings: string[] = [];
  if (slug || keyword || title || seoTitle) {
    const [{ data: games }, { data: reviews }, { data: posts }] = await Promise.all([
      supabase.from("games").select("name, slug").limit(500),
      supabase.from("reviews").select("title, slug").eq("status", "published").limit(300),
      supabase.from("blog_posts").select("title, slug").eq("status", "published").limit(300),
    ]);
    const candidates = [
      ...(games ?? []).flatMap((game) => [
        { label: `/offers/${game.slug}`, slug: normalize(game.slug), title: normalize(game.name) },
        { label: `/games/${game.slug}`, slug: normalize(game.slug), title: normalize(game.name) },
        { label: `/guides/how-to-earn/${game.slug}`, slug: normalize(game.slug), title: normalize(game.name) },
      ]),
      ...(reviews ?? []).map((review) => ({ label: `/review/${review.slug}`, slug: normalize(review.slug), title: normalize(review.title) })),
      ...(posts ?? []).map((post) => ({ label: `/blog/${post.slug}`, slug: normalize(post.slug), title: normalize(post.title) })),
    ];
    const conflict = candidates.find((candidate) =>
      (slug && candidate.slug === slug)
      || (keyword && (candidate.title === keyword || candidate.slug === keyword.replace(/\s+/g, "-")))
      || (seoTitle && candidate.title && seoTitle.includes(candidate.title))
      || (title && candidate.title && title.includes(candidate.title))
    );
    if (conflict) {
      conflictWarnings.push(`This topic may overlap with existing public URL ${conflict.label}. Use a differentiated intent or canonical strategy.`);
    }
  }
  const optionalWarnings = [...quality.optionalWarnings, ...conflictWarnings];

  return NextResponse.json({
    quality: {
      ...quality,
      optionalWarnings,
      warnings: optionalWarnings,
    },
  });
}
