import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { analyzeContentDecay, type ContentDecayGuideInput, type ContentDecayMetricInput } from "@/lib/content-decay";
import { emptyGuideEventSummary, summarizeEventsByGuide, type GuideEventRow } from "@/lib/guide-event-stats";
import { analyzeGuideQuality, countInternalLinks } from "@/lib/guide-quality";
import {
  getGuideOptimizationRecommendations,
  type GuideOptimizationRecommendation,
} from "@/lib/guide-optimization-recommendations";
import { calculateResearchOpportunityScore } from "@/lib/research-opportunity-score";
import { summarizeSearchConsoleMetrics, type GuideSearchConsoleMetric } from "@/lib/search-console-import";
import {
  mineSearchConsoleQueryOpportunities,
  type SearchConsoleOpportunityRow,
} from "@/lib/search-console-opportunities";
import { analyzeSeoDescription, analyzeSeoTitle } from "@/lib/seo-metadata-tools";
import { findSerpRefreshCandidates, type SerpRefreshGuideInput, type SerpRefreshMetricInput } from "@/lib/serp-refresh-candidates";

export const dynamic = "force-dynamic";
export const metadata = { title: "SEO Action Plan | Admin" };

type Priority = "high" | "medium" | "low";
type Category = "refresh" | "new_guide" | "conversion" | "internal_links" | "queue" | "metadata" | "research";

type ActionPlanItem = {
  id: string;
  priority: Priority;
  score: number;
  reason: string;
  target: string;
  sourceSystem: string;
  recommendedAction: string;
  href: string;
  cta: string;
  category: Category;
  quickWin?: boolean;
};

type GuideRow = {
  id: string;
  title: string;
  slug: string;
  status: string | null;
  content_status: string | null;
  body_md: string | null;
  seo_title: string | null;
  seo_description: string | null;
  keyword_target: string | null;
  keyword_cluster_id: string | null;
  guide_type: string | null;
  batch_name: string | null;
  key_takeaways: string | null;
  max_payout_usd: number | null;
  needs_variation: boolean | null;
  internal_link_suggestions: unknown;
  updated_at: string | null;
  published_at: string | null;
};

type ResearchEntry = {
  target_name: string;
  type: string | null;
  extracted_data: unknown;
};

type OfferRow = {
  title: string | null;
  game_name: string | null;
  platform_name: string | null;
  provider_name: string | null;
  payout_usd: number | null;
};

function priorityRank(priority: Priority) {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
}

function priorityFromScore(score: number): Priority {
  if (score >= 80) return "high";
  if (score >= 55) return "medium";
  return "low";
}

function priorityScore(priority: GuideOptimizationRecommendation["priority"]) {
  if (priority === "high") return 86;
  if (priority === "medium") return 66;
  return 38;
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function hasArrayData(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function actionKey(item: ActionPlanItem) {
  return `${item.sourceSystem}:${item.category}:${item.target}:${item.recommendedAction}`;
}

function uniqueAndRank(actions: ActionPlanItem[]) {
  const map = new Map<string, ActionPlanItem>();
  for (const action of actions) {
    const key = actionKey(action);
    const existing = map.get(key);
    if (!existing || action.score > existing.score) map.set(key, action);
  }
  return Array.from(map.values())
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || b.score - a.score || a.target.localeCompare(b.target))
    .slice(0, 80);
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</div>
      <div className="mt-2 text-3xl font-extrabold text-gray-900">{value}</div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const className = priority === "high"
    ? "border-red-100 bg-red-50 text-red-700"
    : priority === "medium"
      ? "border-amber-100 bg-amber-50 text-amber-800"
      : "border-gray-100 bg-gray-50 text-gray-600";

  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold capitalize ${className}`}>{priority}</span>;
}

function sourceHref(source: string) {
  if (source === "Content Queue") return "/app/admin/content-queue";
  if (source === "Guide Optimization") return "/app/admin/guides/optimization";
  if (source === "Search Console Opportunities") return "/app/admin/seo/query-opportunities";
  if (source === "SERP Refresh") return "/app/admin/seo/serp-refresh";
  if (source === "Content Decay") return "/app/admin/seo/content-decay";
  if (source === "Research Opportunities") return "/app/admin/research/opportunities";
  if (source === "Guide Analytics") return "/app/admin/guides/analytics";
  if (source === "Internal Link Manager") return "/app/admin/guides/internal-links";
  return "/app/admin/seo/action-plan";
}

export default async function SeoActionPlanPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

  const [guidesRes, metricsRes, eventsRes, researchRes, offersRes, gamesRes, platformsRes] = await Promise.all([
    supabase
      .from("guides")
      .select("id, title, slug, status, content_status, body_md, seo_title, seo_description, keyword_target, keyword_cluster_id, guide_type, batch_name, key_takeaways, max_payout_usd, needs_variation, internal_link_suggestions, updated_at, published_at")
      .order("updated_at", { ascending: false })
      .limit(1200),
    supabase
      .from("guide_search_console_metrics")
      .select("id, guide_id, page_url, query, clicks, impressions, ctr, position, date_start, date_end, created_at")
      .order("impressions", { ascending: false })
      .limit(30000),
    supabase
      .from("guide_events")
      .select("guide_id, guide_slug, event_type, target_url, metadata, created_at")
      .gte("created_at", daysAgo(30))
      .limit(20000),
    supabase.from("research_entries").select("target_name, type, extracted_data").limit(1000),
    supabase.from("unified_offers_view").select("title, game_name, platform_name, provider_name, payout_usd").order("payout_usd", { ascending: false }).limit(1000),
    supabase.from("games").select("name").limit(500),
    supabase.from("platforms").select("name").limit(500),
  ]);

  const guides = (guidesRes.data ?? []) as GuideRow[];
  const metrics = (metricsRes.data ?? []).map((metric) => ({
    id: metric.id,
    guide_id: metric.guide_id,
    page_url: metric.page_url,
    query: metric.query,
    clicks: Number(metric.clicks ?? 0),
    impressions: Number(metric.impressions ?? 0),
    ctr: Number(metric.ctr ?? 0),
    position: Number(metric.position ?? 0),
    date_start: metric.date_start,
    date_end: metric.date_end,
    created_at: metric.created_at,
  }));
  const events = (eventsRes.data ?? []) as GuideEventRow[];
  const statsByGuide = summarizeEventsByGuide(events);
  const metricsByGuide = new Map<string, GuideSearchConsoleMetric[]>();
  for (const metric of metrics) {
    if (!metric.guide_id) continue;
    if (!metricsByGuide.has(metric.guide_id)) metricsByGuide.set(metric.guide_id, []);
    metricsByGuide.get(metric.guide_id)?.push({
      query: metric.query,
      clicks: metric.clicks,
      impressions: metric.impressions,
      ctr: metric.ctr,
      position: metric.position,
    });
  }

  const actions: ActionPlanItem[] = [];

  for (const guide of guides) {
    const quality = analyzeGuideQuality({
      bodyHtml: guide.body_md,
      seoTitle: guide.seo_title,
      seoDescription: guide.seo_description,
      keywordTarget: guide.keyword_target,
    });
    const stats = statsByGuide.get(guide.id) ?? statsByGuide.get(guide.slug) ?? emptyGuideEventSummary();
    const searchConsole = summarizeSearchConsoleMetrics(metricsByGuide.get(guide.id) ?? [], guide.keyword_target);
    const titleAnalysis = analyzeSeoTitle(guide.seo_title ?? guide.title, guide.keyword_target);
    const descriptionAnalysis = analyzeSeoDescription(guide.seo_description ?? "", guide.keyword_target);
    const recommendations = getGuideOptimizationRecommendations({
      status: guide.status,
      contentStatus: guide.content_status,
      updatedAt: guide.updated_at,
      publishedAt: guide.published_at,
      needsVariation: guide.needs_variation,
      keywordClusterId: guide.keyword_cluster_id,
      seoTitleScore: titleAnalysis.score,
      seoDescriptionScore: descriptionAnalysis.score,
      searchConsole,
      quality,
      stats,
    });

    for (const recommendation of recommendations.slice(0, 2)) {
      const isMetadata = recommendation.type === "improve_seo_metadata" || recommendation.type === "high_impressions_low_ctr";
      const isConversion = recommendation.type === "low_ctr" || recommendation.type === "high_views_no_clicks" || recommendation.type === "needs_cta";
      const isLinks = recommendation.type === "needs_internal_links";
      const isQueue = recommendation.type === "republish_candidate";
      actions.push({
        id: `optimization-${guide.id}-${recommendation.type}`,
        priority: recommendation.priority,
        score: priorityScore(recommendation.priority) + Math.min(10, Math.floor((stats.views + searchConsole.impressions) / 100)),
        reason: recommendation.description,
        target: guide.title,
        sourceSystem: "Guide Optimization",
        recommendedAction: recommendation.suggestedAction,
        href: isMetadata
          ? `/app/admin/guides/${guide.id}/edit#seo-preview-testing`
          : isLinks
            ? "/app/admin/guides/internal-links"
            : isQueue
              ? "/app/admin/content-queue"
              : `/app/admin/guides/${guide.id}/edit`,
        cta: isMetadata ? "Open SEO panel" : isLinks ? "Fix links" : isQueue ? "Open queue" : "Open guide",
        category: isConversion ? "conversion" : isMetadata ? "metadata" : isLinks ? "internal_links" : isQueue ? "queue" : "refresh",
        quickWin: isMetadata || isLinks || isQueue,
      });
    }

    const suggestions = Array.isArray(guide.internal_link_suggestions) ? guide.internal_link_suggestions : [];
    if (countInternalLinks(guide.body_md) < 2 || suggestions.length > 0) {
      actions.push({
        id: `links-${guide.id}`,
        priority: countInternalLinks(guide.body_md) === 0 ? "high" : "medium",
        score: countInternalLinks(guide.body_md) === 0 ? 82 : 62,
        reason: suggestions.length > 0
          ? "Stored internal link suggestions are waiting for review."
          : "This guide has fewer than two internal links.",
        target: guide.title,
        sourceSystem: "Internal Link Manager",
        recommendedAction: "Add relevant internal links or approve stored link suggestions.",
        href: "/app/admin/guides/internal-links",
        cta: "Open link manager",
        category: "internal_links",
        quickWin: true,
      });
    }

    if ((guide.content_status === "draft" || guide.content_status === "needs_edit") && quality.score >= 85) {
      actions.push({
        id: `queue-${guide.id}`,
        priority: quality.score >= 92 ? "high" : "medium",
        score: quality.score,
        reason: `SEO quality score is ${quality.score}; this draft may be close to ready after final fact checks.`,
        target: guide.title,
        sourceSystem: "Content Queue",
        recommendedAction: "Review guardrails and move this draft toward ready_to_publish.",
        href: "/app/admin/content-queue",
        cta: "Open queue",
        category: "queue",
        quickWin: true,
      });
    }
  }

  const searchRows = metrics.map((metric) => {
    const guide = guides.find((item) => item.id === metric.guide_id);
    return {
      id: metric.id,
      guide_id: metric.guide_id,
      page_url: metric.page_url,
      query: metric.query,
      clicks: metric.clicks,
      impressions: metric.impressions,
      ctr: metric.ctr,
      position: metric.position,
      guide: guide ? {
        id: guide.id,
        title: guide.title,
        slug: guide.slug,
        keyword_target: guide.keyword_target,
        max_payout_usd: guide.max_payout_usd,
      } : null,
    };
  }) satisfies SearchConsoleOpportunityRow[];
  const existingKeywords = guides.map((guide) => guide.keyword_target).filter((value): value is string => Boolean(value));
  const queryOpportunities = mineSearchConsoleQueryOpportunities(searchRows, existingKeywords).slice(0, 20);
  for (const opportunity of queryOpportunities) {
    const category: Category = opportunity.type === "new_guide" || opportunity.type === "supporting_cluster" ? "new_guide" : opportunity.type === "ctr_improvement" ? "metadata" : "refresh";
    actions.push({
      id: `query-${opportunity.id}`,
      priority: opportunity.priorityLabel === "Highest Priority" || opportunity.priorityLabel === "Strong" ? "high" : opportunity.priorityLabel === "Medium" ? "medium" : "low",
      score: opportunity.priorityScore,
      reason: `${opportunity.impressions} impressions, ${opportunity.clicks} clicks, ${(opportunity.ctr * 100).toFixed(2)}% CTR, avg position ${opportunity.position.toFixed(1)}.`,
      target: opportunity.guideTitle ?? opportunity.query,
      sourceSystem: "Search Console Opportunities",
      recommendedAction: opportunity.suggestedAction,
      href: "/app/admin/seo/query-opportunities",
      cta: "Open opportunities",
      category,
      quickWin: opportunity.type === "ctr_improvement" || opportunity.type === "add_section",
    });
  }

  const eventEngagement = Array.from(statsByGuide.entries())
    .filter(([guideId]) => guides.some((guide) => guide.id === guideId))
    .map(([guideId, stats]) => ({
      guideId,
      views: stats.views,
      offerClicks: stats.offerClicks,
      platformClicks: stats.platformClicks,
    }));
  const serpCandidates = findSerpRefreshCandidates({
    guides: guides.map((guide) => ({
      id: guide.id,
      title: guide.title,
      slug: guide.slug,
      keyword_target: guide.keyword_target,
      body_md: guide.body_md,
      seo_title: guide.seo_title,
      seo_description: guide.seo_description,
      updated_at: guide.updated_at,
      published_at: guide.published_at,
    })) satisfies SerpRefreshGuideInput[],
    metrics: metrics.map((metric) => ({
      id: metric.id,
      guide_id: metric.guide_id,
      page_url: metric.page_url,
      query: metric.query,
      clicks: metric.clicks,
      impressions: metric.impressions,
      ctr: metric.ctr,
      position: metric.position,
    })) satisfies SerpRefreshMetricInput[],
    engagement: eventEngagement,
  }).slice(0, 20);
  for (const candidate of serpCandidates) {
    actions.push({
      id: `serp-${candidate.guideId}`,
      priority: candidate.priority,
      score: candidate.priorityScore,
      reason: candidate.reason,
      target: candidate.title,
      sourceSystem: "SERP Refresh",
      recommendedAction: candidate.refreshPlan.recommendation === "create_supporting_guide"
        ? "Create a supporting guide or refresh the current page based on query intent."
        : "Refresh the current page using the generated SERP plan.",
      href: "/app/admin/seo/serp-refresh",
      cta: "Open refresh workflow",
      category: "refresh",
      quickWin: candidate.isQuickWin,
    });
  }

  const contentDecayRows = analyzeContentDecay({
    guides: guides
      .filter((guide) => guide.status === "published")
      .map((guide) => ({
        id: guide.id,
        title: guide.title,
        slug: guide.slug,
        keyword_target: guide.keyword_target,
        guide_type: guide.guide_type,
        batch_name: guide.batch_name,
        keyword_cluster_id: guide.keyword_cluster_id,
        updated_at: guide.updated_at,
        published_at: guide.published_at,
      })) satisfies ContentDecayGuideInput[],
    metrics: metrics.map((metric) => ({
      guide_id: metric.guide_id,
      clicks: metric.clicks,
      impressions: metric.impressions,
      ctr: metric.ctr,
      position: metric.position,
      date_start: metric.date_start,
      date_end: metric.date_end,
      created_at: metric.created_at,
    })) satisfies ContentDecayMetricInput[],
  }).filter((row) => row.decayLevel === "severe" || row.decayLevel === "moderate").slice(0, 20);
  for (const row of contentDecayRows) {
    actions.push({
      id: `decay-${row.guideId}`,
      priority: row.decayLevel === "severe" ? "high" : "medium",
      score: row.decayScore,
      reason: row.reasons[0] ?? "Published guide shows content decay signals.",
      target: row.title,
      sourceSystem: "Content Decay",
      recommendedAction: row.suggestedAction,
      href: "/app/admin/seo/content-decay",
      cta: "Open decay monitor",
      category: "refresh",
    });
  }

  for (const [guideKey, stats] of Array.from(statsByGuide.entries()).slice(0, 200)) {
    const guide = guides.find((item) => item.id === guideKey || item.slug === guideKey);
    if (!guide || stats.views < 50 || stats.offerClicks + stats.platformClicks > 0) continue;
    actions.push({
      id: `analytics-${guide.id}`,
      priority: stats.views >= 100 ? "high" : "medium",
      score: Math.min(95, 65 + Math.floor(stats.views / 10)),
      reason: `${stats.views} guide views in the last 30 days, but no offer or platform clicks.`,
      target: guide.title,
      sourceSystem: "Guide Analytics",
      recommendedAction: "Fix the offer CTA, make the safest next click clearer, and review above-the-fold conversion blocks.",
      href: "/app/admin/guides/analytics",
      cta: "Open analytics",
      category: "conversion",
    });
  }

  const researchEntries = (researchRes.data ?? []) as ResearchEntry[];
  const offers = (offersRes.data ?? []) as OfferRow[];
  const targets = new Map<string, {
    targetName: string;
    type: "game" | "platform" | "offer";
    researchSourceCount: number;
    highestPayout: number | null;
    publishedGuideCount: number;
    hasPayoutData: boolean;
    hasComplaintsOrRisks: boolean;
  }>();
  function ensureTarget(targetName: string, type: "game" | "platform" | "offer") {
    const clean = targetName.trim();
    if (!clean) return null;
    const key = `${type}:${normalize(clean)}`;
    if (!targets.has(key)) {
      targets.set(key, {
        targetName: clean,
        type,
        researchSourceCount: 0,
        highestPayout: null,
        publishedGuideCount: 0,
        hasPayoutData: false,
        hasComplaintsOrRisks: false,
      });
    }
    return targets.get(key) ?? null;
  }
  for (const game of gamesRes.data ?? []) ensureTarget(game.name, "game");
  for (const platform of platformsRes.data ?? []) ensureTarget(platform.name, "platform");
  for (const offer of offers) {
    const payout = typeof offer.payout_usd === "number" ? offer.payout_usd : null;
    for (const target of [
      ensureTarget(offer.game_name ?? offer.title ?? "", "game"),
      ensureTarget(offer.platform_name ?? offer.provider_name ?? "", "platform"),
      ensureTarget(offer.title ?? offer.game_name ?? "", "offer"),
    ]) {
      if (!target || payout === null) continue;
      target.highestPayout = Math.max(target.highestPayout ?? 0, payout);
    }
  }
  for (const entry of researchEntries) {
    const type = entry.type === "platform" ? "platform" : entry.type === "offer" ? "offer" : "game";
    const target = ensureTarget(entry.target_name, type);
    if (!target) continue;
    const extracted = entry.extracted_data as Record<string, unknown> | null;
    target.researchSourceCount += 1;
    target.hasPayoutData = target.hasPayoutData || hasArrayData(extracted?.payoutMentions);
    target.hasComplaintsOrRisks = target.hasComplaintsOrRisks || hasArrayData(extracted?.complaints) || hasArrayData(extracted?.risks);
  }
  for (const guide of guides) {
    if (guide.status !== "published") continue;
    const guideText = [guide.title, guide.keyword_target].map(normalize).join(" ");
    for (const target of Array.from(targets.values())) {
      const targetName = normalize(target.targetName);
      if (targetName && (guideText.includes(targetName) || targetName.includes(guideText))) target.publishedGuideCount += 1;
    }
  }
  for (const target of Array.from(targets.values()).slice(0, 500)) {
    const score = calculateResearchOpportunityScore({
      hasStoredResearch: target.researchSourceCount > 0,
      researchSourceCount: target.researchSourceCount,
      hasPayoutData: target.hasPayoutData || (target.highestPayout ?? 0) > 0,
      hasComplaintsOrRisks: target.hasComplaintsOrRisks,
      hasPublishedReview: target.publishedGuideCount > 0,
      highestPayout: target.highestPayout,
      hasKeywordIntent: true,
    });
    if (score.score < 75 && !(target.researchSourceCount === 0 && target.publishedGuideCount === 0 && (target.highestPayout ?? 0) >= 100)) continue;
    actions.push({
      id: `research-${target.type}-${target.targetName}`,
      priority: score.score >= 90 ? "high" : "medium",
      score: score.score,
      reason: score.reasons.join(", ") || "Research opportunity detected.",
      target: target.targetName,
      sourceSystem: "Research Opportunities",
      recommendedAction: target.researchSourceCount === 0 ? "Research this high-payout target before creating content." : "Use stored research to generate or improve the relevant guide/review.",
      href: `/app/admin/research/opportunities`,
      cta: "Open research queue",
      category: target.publishedGuideCount === 0 ? "new_guide" : "research",
    });
  }

  const rankedActions = uniqueAndRank(actions);
  const summary = {
    highPriority: rankedActions.filter((action) => action.priority === "high").length,
    quickWins: rankedActions.filter((action) => action.quickWin).length,
    contentRefreshes: rankedActions.filter((action) => action.category === "refresh" || action.category === "metadata").length,
    newGuideOpportunities: rankedActions.filter((action) => action.category === "new_guide").length,
    conversionFixes: rankedActions.filter((action) => action.category === "conversion").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">SEO</p>
          <h1 className="mt-1 text-2xl font-extrabold text-gray-900">Auto SEO Action Plan</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-500">
            A prioritized command layer that points admins to the right existing SEO workflow instead of duplicating each dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/admin/seo/search-console-import" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">
            Import GSC CSV
          </Link>
          <Link href="/app/admin/content-queue" className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white">
            Content Queue
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <SummaryCard label="High priority actions" value={summary.highPriority} />
        <SummaryCard label="Quick wins" value={summary.quickWins} />
        <SummaryCard label="Content refreshes" value={summary.contentRefreshes} />
        <SummaryCard label="New guide opportunities" value={summary.newGuideOpportunities} />
        <SummaryCard label="Conversion fixes" value={summary.conversionFixes} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">
          Ranked next actions
        </div>
        <div className="divide-y divide-gray-100">
          {rankedActions.map((action, index) => (
            <div key={action.id} className="grid gap-4 p-4 hover:bg-gray-50 lg:grid-cols-[64px_1fr_220px] lg:items-center">
              <div className="flex items-center gap-3 lg:block">
                <div className="text-xl font-extrabold text-gray-300">#{index + 1}</div>
                <div className="mt-0 lg:mt-2"><PriorityBadge priority={action.priority} /></div>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-extrabold text-gray-900">{action.recommendedAction}</h2>
                  <Link href={sourceHref(action.sourceSystem)} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600 hover:bg-gray-200">
                    {action.sourceSystem}
                  </Link>
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-700">{action.target}</div>
                <p className="mt-2 max-w-4xl text-sm leading-relaxed text-gray-500">{action.reason}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-gray-400 ring-1 ring-gray-100">Score {action.score}</span>
                <Link href={action.href} className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white hover:bg-gray-800">
                  {action.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
        {rankedActions.length === 0 ? (
          <div className="p-10 text-center text-sm font-semibold text-gray-500">
            No action-plan items found yet. Import Search Console data or add guide analytics/research inputs to populate recommendations.
          </div>
        ) : null}
      </div>
    </div>
  );
}
