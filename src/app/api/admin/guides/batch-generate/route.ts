import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderMarkdown } from "@/app/guides/[slug]/markdownRenderer";
import {
  buildGuideDrafts,
  type GeneratedGuideDraft,
  type GuideType,
} from "@/lib/seo-guide-templates";
import { generateSeoKeywords } from "@/lib/seo-keyword-map";
import { analyzeGuideQuality } from "@/lib/guide-quality";
import { detectCannibalization } from "@/lib/keyword-cannibalization";
import {
  buildResearchReviewDraft,
  type ResearchReviewType,
} from "@/lib/research-review-generator";
import { calculateResearchConfidenceScore } from "@/lib/research-extractor";

const MAX_GUIDES = 100;

type BatchGenerateRequest = {
  action?: "preview" | "save";
  generatorMode?: "guide" | "research_review";
  targets?: ResearchBatchTarget[];
  batchName?: string;
  guideType?: GuideType;
  reviewType?: ResearchReviewType;
  targetName?: string;
  gameName?: string;
  platform?: string;
  platformName?: string;
  maxPayout?: string | number | null;
  numberOfGuides?: string | number | null;
  taskListRaw?: string;
  sourceUrls?: string[] | string;
  researchNotes?: string;
  useStoredResearch?: boolean;
  generateFromTaskList?: boolean;
  createMultipleLongTail?: boolean;
  aggressiveMode?: boolean;
  drafts?: SaveGuideDraft[];
};

type ResearchBatchTarget = {
  targetName: string;
  type?: "platform" | "game" | "offer" | "general" | "comparison";
  reviewType?: ResearchReviewType;
  opportunityScore?: number | null;
  opportunityLabel?: string | null;
  researchSourceCount?: number | null;
  highestPayout?: number | null;
};

type SaveGuideDraft = {
  selected?: boolean;
  title: string;
  slug: string;
  keywordTarget?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  excerpt?: string | null;
  bodyHtml: string;
  difficulty?: string | null;
  estimatedCompletionTime?: string | null;
  maxRewardAmount?: number | null;
  tips?: string[];
  checklistItems?: string[];
  internalLinkSuggestions?: unknown;
  parsedTasks?: unknown;
  guideType?: GuideType | string | null;
  variant?: string | null;
  batchName?: string | null;
  taskListRaw?: string | null;
  gameId?: string | null;
  platformName?: string | null;
  angleType?: string | null;
  keywordClusterId?: string | null;
  keywordIntent?: string | null;
  contentSimilarityScore?: number | null;
  needsVariation?: boolean | null;
  reviewType?: ResearchReviewType | string | null;
  researchSummary?: string | null;
  researchConfidenceScore?: number | null;
  sourceUrls?: string[] | null;
  claimsNeedingVerification?: string[] | null;
  pros?: string[] | null;
  cons?: string[] | null;
  reviewRating?: number | null;
  targetName?: string | null;
  opportunityScore?: number | null;
  opportunityLabel?: string | null;
  researchSourceCount?: number | null;
  highestPayout?: number | null;
  targetWarnings?: string[] | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseOptionalNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function clampGuideCount(value: string | number | null | undefined) {
  const parsed = parseOptionalNumber(value);
  if (!parsed) return 50;
  return Math.max(1, Math.min(MAX_GUIDES, Math.floor(parsed)));
}

function parseSourceUrls(value: string[] | string | undefined) {
  if (Array.isArray(value)) return value.map((url) => url.trim()).filter(Boolean);
  return (value ?? "").split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
}

function mapReviewTypeToGuideType(reviewType: ResearchReviewType): GuideType {
  if (reviewType === "platform" || reviewType === "offerwall") return "platform_review";
  if (reviewType === "comparison") return "offer_comparison";
  return "game_offer";
}

function reviewTypeFromTarget(target: ResearchBatchTarget | undefined, fallback: ResearchReviewType): ResearchReviewType {
  if (target?.reviewType) return target.reviewType;
  if (target?.type === "platform") return "platform";
  if (target?.type === "comparison") return "comparison";
  return fallback;
}

async function checkAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role)) return null;
  return user;
}

async function findGameId(supabase: ReturnType<typeof createClient>, gameName: string) {
  if (gameName.trim()) {
    const { data: exactGame, error: exactError } = await supabase
      .from("games")
      .select("id, name, slug")
      .ilike("name", gameName.trim())
      .maybeSingle();

    if (exactError) throw new Error(exactError.message);
    if (exactGame?.id) return exactGame;

    const { data: fuzzyGames, error: fuzzyError } = await supabase
      .from("games")
      .select("id, name, slug")
      .ilike("name", `%${gameName.trim()}%`)
      .limit(1);

    if (fuzzyError) throw new Error(fuzzyError.message);
    if (fuzzyGames?.[0]?.id) return fuzzyGames[0];
  }

  const { data: fallbackGame, error } = await supabase
    .from("games")
    .select("id, name, slug")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return fallbackGame;
}

async function makeUniqueSlug(
  supabase: ReturnType<typeof createClient>,
  base: string,
  reservedSlugs: Set<string>,
) {
  const cleanBase = slugify(base) || "generated-guide";
  let candidate = cleanBase;
  let index = 2;

  while (reservedSlugs.has(candidate)) {
    candidate = `${cleanBase}-${index}`;
    index += 1;
  }

  for (;;) {
    const { data, error } = await supabase
      .from("guides")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      reservedSlugs.add(candidate);
      return candidate;
    }

    candidate = `${cleanBase}-${index}`;
    index += 1;
  }
}

function expandDrafts({
  drafts,
  count,
  gameName,
  platformName,
}: {
  drafts: GeneratedGuideDraft[];
  count: number;
  gameName: string;
  platformName: string;
}) {
  if (drafts.length >= count) return drafts.slice(0, count);

  const keywords = generateSeoKeywords({
    gameName,
    platformName,
    tasks: drafts[0]?.parsedTasks ?? [],
  });
  const expanded = [...drafts];

  while (expanded.length < count) {
    const source = drafts[expanded.length % drafts.length] ?? drafts[0];
    const keyword = keywords[expanded.length % Math.max(1, keywords.length)] ?? `${source.title} guide`;
    const title = keyword
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    expanded.push({
      ...source,
      title,
      slugBase: slugify(title),
      keywordTarget: keyword,
      seoTitle: `${title} | EarnGrind`,
      seoDescription: `Draft guide targeting "${keyword}" with task, payout, tracking, and completion strategy notes.`,
    });
  }

  const usedKeywords = new Set<string>();
  return expanded.filter((draft) => {
    const key = draft.keywordTarget.toLowerCase().trim();
    if (usedKeywords.has(key)) return false;
    usedKeywords.add(key);
    return true;
  }).slice(0, count);
}

function formatPreviewDraft({
  draft,
  slug,
  batchName,
  guideType,
  gameId,
  gameName,
  platformName,
  taskListRaw,
}: {
  draft: GeneratedGuideDraft;
  slug: string;
  batchName: string;
  guideType: GuideType;
  gameId: string;
  gameName: string;
  platformName: string;
  taskListRaw: string;
}) {
  const bodyHtml = renderMarkdown(draft.bodyHtml);
  const quality = analyzeGuideQuality({
    bodyHtml,
    seoTitle: draft.seoTitle,
    seoDescription: draft.seoDescription,
    keywordTarget: draft.keywordTarget,
  });

  return {
    previewId: `${draft.variant}-${slug}`,
    selected: true,
    variant: draft.variant,
    title: draft.title,
    slug,
    keywordTarget: draft.keywordTarget,
    seoTitle: draft.seoTitle,
    seoDescription: draft.seoDescription,
    excerpt: draft.excerpt,
    bodyHtml,
    difficulty: draft.difficulty,
    estimatedCompletionTime: draft.estimatedCompletionTime,
    maxRewardAmount: draft.maxRewardAmount,
    tips: draft.tips,
    checklistItems: draft.checklistItems,
    internalLinkSuggestions: draft.internalLinkSuggestions,
    parsedTasks: draft.parsedTasks,
    guideType,
    batchName,
    taskListRaw,
    gameId,
    gameName,
    platformName,
    quality,
    angleType: draft.angleType,
    keywordClusterId: draft.keywordClusterId,
    keywordIntent: draft.keywordIntent,
    contentSimilarityScore: draft.contentSimilarityScore,
    needsVariation: draft.needsVariation,
  };
}

async function buildPreviewDrafts(supabase: ReturnType<typeof createClient>, body: BatchGenerateRequest) {
  const guideType = body.guideType ?? "game_offer";
  const batchName = body.batchName?.trim() || `Guide batch ${new Date().toISOString().slice(0, 10)}`;
  const gameNameInput = body.gameName?.trim() ?? "";
  const platformName = body.platform?.trim() ?? "";
  const maxPayout = parseOptionalNumber(body.maxPayout);
  const count = clampGuideCount(body.numberOfGuides);
  const taskListRaw = body.generateFromTaskList ? body.taskListRaw?.trim() ?? "" : "";

  const game = await findGameId(supabase, gameNameInput);
  if (!game?.id) {
    throw new Error("At least one game row is required before batch guides can be generated.");
  }

  const gameName = gameNameInput || game.name || "GPT Offer";
  const { data: recentGuides } = await supabase
    .from("guides")
    .select("id, title, body_md, keyword_target, keyword_cluster_id, keyword_intent")
    .order("updated_at", { ascending: false })
    .limit(20);
  const baseDrafts = buildGuideDrafts({
    guideType,
    gameName,
    platformName,
    maxPayout,
    rawTaskList: taskListRaw,
    createMultipleLongTail: Boolean(body.createMultipleLongTail),
    aggressiveMode: Boolean(body.aggressiveMode),
    existingBodies: (recentGuides ?? []).map((guide) => guide.body_md ?? ""),
  });
  const drafts = expandDrafts({ drafts: baseDrafts, count, gameName, platformName });
  const reservedSlugs = new Set<string>();
  const previews = [];

  for (const draft of drafts) {
    const slug = await makeUniqueSlug(supabase, draft.slugBase, reservedSlugs);
    previews.push(formatPreviewDraft({
      draft,
      slug,
      batchName,
      guideType,
      gameId: game.id,
      gameName,
      platformName,
      taskListRaw,
    }));
  }

  const cannibalizationIssues = detectCannibalization([
    ...(recentGuides ?? []).map((guide) => ({
      id: guide.id,
      title: guide.title,
      keyword_target: guide.keyword_target,
      keyword_cluster_id: guide.keyword_cluster_id,
      keyword_intent: guide.keyword_intent,
    })),
    ...previews.map((draft) => ({
      id: draft.previewId,
      title: draft.title,
      keywordTarget: draft.keywordTarget,
      keywordClusterId: draft.keywordClusterId,
      keywordIntent: draft.keywordIntent,
    })),
  ]);

  return {
    batchName,
    count: previews.length,
    game: { id: game.id, name: game.name, slug: game.slug },
    drafts: previews.map((draft) => ({
      ...draft,
      cannibalizationIssues: cannibalizationIssues.filter((issue) => issue.guideIds.includes(draft.previewId)),
    })),
    cannibalizationIssues,
  };
}

async function buildResearchPreviewDrafts(supabase: ReturnType<typeof createClient>, body: BatchGenerateRequest, batchTarget?: ResearchBatchTarget) {
  const reviewType = reviewTypeFromTarget(batchTarget, body.reviewType ?? "platform");
  const guideType = mapReviewTypeToGuideType(reviewType);
  const batchName = body.batchName?.trim() || `Research review batch ${new Date().toISOString().slice(0, 10)}`;
  const targetName = batchTarget?.targetName?.trim() || body.targetName?.trim() || body.gameName?.trim() || body.platformName?.trim() || body.platform?.trim() || "Research Review";
  const gameNameInput = body.gameName?.trim() || (reviewType === "game_offer" ? targetName : "");
  const platformName = body.platformName?.trim() || body.platform?.trim() || (reviewType !== "game_offer" ? targetName : "");
  const taskListRaw = body.taskListRaw?.trim() ?? "";
  const sourceUrls = parseSourceUrls(body.sourceUrls);
  const game = await findGameId(supabase, gameNameInput);

  if (!game?.id) {
    throw new Error("At least one game row is required before research reviews can be generated.");
  }

  const offerFilters = [
    targetName ? `title.ilike.%${targetName}%` : null,
    targetName ? `game_name.ilike.%${targetName}%` : null,
    platformName ? `platform_name.ilike.%${platformName}%` : null,
    platformName ? `provider_name.ilike.%${platformName}%` : null,
  ].filter(Boolean).join(",");

  const { data: offerRows } = offerFilters
    ? await supabase
      .from("unified_offers_view")
      .select("title, game_name, platform_name, provider_name, payout_usd, goal_text")
      .or(offerFilters)
      .order("payout_usd", { ascending: false })
      .limit(8)
    : { data: [] };

  const internalResearchNotes = (offerRows ?? []).map((offer) => {
    const payout = typeof offer.payout_usd === "number" ? `$${offer.payout_usd.toFixed(2)}` : "payout needs verification";
    return `EarnGrind data: ${offer.title ?? offer.game_name ?? targetName} on ${offer.platform_name ?? "unknown platform"} via ${offer.provider_name ?? "unknown provider"} shows ${payout}. ${offer.goal_text ?? ""}`.trim();
  }).join("\n");

  const researchTargets = Array.from(new Set([targetName, gameNameInput, platformName].map((value) => value.trim()).filter(Boolean)));
  const storedResearchFilter = researchTargets.map((value) => `target_name.ilike.%${value}%`).join(",");
  const { data: storedResearch } = body.useStoredResearch && storedResearchFilter
    ? await supabase
      .from("research_entries")
      .select("target_name, source_url, raw_text, extracted_data, tags")
      .or(storedResearchFilter)
      .order("updated_at", { ascending: false })
      .limit(20)
    : { data: [] };

  const storedResearchNotes = (storedResearch ?? []).map((entry) => {
    const extracted = entry.extracted_data as Record<string, unknown> | null;
    const complaints = Array.isArray(extracted?.complaints) ? extracted.complaints.slice(0, 3).join("; ") : "";
    const payouts = Array.isArray(extracted?.payoutMentions) ? extracted.payoutMentions.slice(0, 5).join(", ") : "";
    const requirements = Array.isArray(extracted?.requirements) ? extracted.requirements.slice(0, 3).join("; ") : "";
    return [
      `Stored research for ${entry.target_name}: ${entry.raw_text}`,
      payouts ? `Payout reality mentions: ${payouts}` : "",
      complaints ? `Common complaints: ${complaints}` : "",
      requirements ? `Requirements mentioned: ${requirements}` : "",
    ].filter(Boolean).join("\n");
  }).join("\n\n");

  const inferredMaxPayout = Math.max(0, ...(offerRows ?? []).map((offer) => typeof offer.payout_usd === "number" ? offer.payout_usd : 0));
  const maxPayout = parseOptionalNumber(body.maxPayout) ?? (inferredMaxPayout > 0 ? inferredMaxPayout : null);

  const draft = buildResearchReviewDraft({
    reviewType,
    targetName,
    platformName,
    gameName: gameNameInput || game.name || undefined,
    sourceUrls: Array.from(new Set([...sourceUrls, ...(storedResearch ?? []).map((entry) => entry.source_url).filter(Boolean) as string[]])),
    researchNotes: [body.researchNotes?.trim(), storedResearchNotes, internalResearchNotes].filter(Boolean).join("\n\n"),
    taskListRaw,
    maxPayout,
  });
  const storedResearchConfidence = calculateResearchConfidenceScore((storedResearch ?? []).map((entry) => ({ extracted_data: entry.extracted_data as never })));
  const researchConfidenceScore = Math.max(draft.researchConfidenceScore, storedResearchConfidence);

  const reservedSlugs = new Set<string>();
  const slug = await makeUniqueSlug(supabase, draft.slugBase, reservedSlugs);
  const bodyHtml = renderMarkdown(draft.bodyHtml);
  const quality = analyzeGuideQuality({
    bodyHtml,
    seoTitle: draft.seoTitle,
    seoDescription: draft.seoDescription,
    keywordTarget: draft.keywordTarget,
  });

  const { data: recentGuides } = await supabase
    .from("guides")
    .select("id, title, body_md, keyword_target, keyword_cluster_id, keyword_intent")
    .order("updated_at", { ascending: false })
    .limit(20);
  const { data: targetGuides } = await supabase
    .from("guides")
    .select("id, status")
    .or(`title.ilike.%${targetName}%,keyword_target.ilike.%${targetName}%,platform_name.ilike.%${targetName}%`)
    .limit(20);
  const publishedCount = (targetGuides ?? []).filter((guide) => guide.status === "published").length;
  const draftCount = (targetGuides ?? []).filter((guide) => guide.status === "draft" || guide.status === "needs_review").length;
  const targetWarnings = [
    ...(publishedCount > 0 ? [`${publishedCount} published guide/review already exists for this target.`] : []),
    ...(draftCount > 0 ? [`${draftCount} draft or needs-review guide already exists for this target.`] : []),
  ];

  const preview = {
    previewId: `research-${slug}`,
    selected: true,
    variant: "research_review",
    title: draft.title,
    slug,
    keywordTarget: draft.keywordTarget,
    seoTitle: draft.seoTitle,
    seoDescription: draft.seoDescription,
    excerpt: draft.excerpt,
    bodyHtml,
    difficulty: "Needs editor review",
    estimatedCompletionTime: "Needs editor review",
    maxRewardAmount: maxPayout,
    targetName,
    opportunityScore: batchTarget?.opportunityScore ?? null,
    opportunityLabel: batchTarget?.opportunityLabel ?? null,
    researchSourceCount: batchTarget?.researchSourceCount ?? storedResearch?.length ?? 0,
    highestPayout: batchTarget?.highestPayout ?? maxPayout,
    targetWarnings,
    tips: [],
    checklistItems: [],
    internalLinkSuggestions: [
      { label: "Compare highest-paying GPT offers", href: "/offers", type: "offers" },
      { label: "Browse game offer guides", href: "/guides", type: "guides" },
      ...(game?.slug ? [{ label: `${game.name} game page`, href: `/games/${game.slug}`, type: "game" }] : []),
      ...(platformName ? [{ label: `${platformName} review`, href: `/review/${slugify(platformName)}`, type: "review" }] : []),
    ],
    parsedTasks: [],
    guideType,
    batchName,
    taskListRaw,
    gameId: game.id,
    gameName: gameNameInput || game.name || targetName,
    platformName,
    quality,
    angleType: "warning-focused",
    keywordClusterId: slugify(targetName),
    keywordIntent: reviewType === "comparison" ? "comparison" : "roi",
    contentSimilarityScore: null,
    needsVariation: false,
    reviewType,
    researchSummary: `${draft.researchSummary}${storedResearch?.length ? ` Used ${storedResearch.length} stored research entries.` : ""}`,
    researchConfidenceScore,
    sourceUrls: draft.sourceUrls,
    claimsNeedingVerification: draft.claimsNeedingVerification,
    pros: draft.pros,
    cons: draft.cons,
    reviewRating: draft.rating,
  };

  const cannibalizationIssues = detectCannibalization([
    ...(recentGuides ?? []).map((guide) => ({
      id: guide.id,
      title: guide.title,
      keyword_target: guide.keyword_target,
      keyword_cluster_id: guide.keyword_cluster_id,
      keyword_intent: guide.keyword_intent,
    })),
    {
      id: preview.previewId,
      title: preview.title,
      keywordTarget: preview.keywordTarget,
      keywordClusterId: preview.keywordClusterId,
      keywordIntent: preview.keywordIntent,
    },
  ]);

  return {
    batchName,
    count: 1,
    game: { id: game.id, name: game.name, slug: game.slug },
    drafts: [{
      ...preview,
      cannibalizationIssues: cannibalizationIssues.filter((issue) => issue.guideIds.includes(preview.previewId)),
    }],
    cannibalizationIssues,
  };
}

async function buildResearchBatchPreviewDrafts(
  supabase: ReturnType<typeof createClient>,
  body: BatchGenerateRequest,
  targets: ResearchBatchTarget[],
) {
  const batchName = body.batchName?.trim() || `Research Batch - ${new Date().toISOString().slice(0, 10)}`;
  const groups = [];
  const drafts = [];
  const cannibalizationIssues = [];

  for (const target of targets) {
    const preview = await buildResearchPreviewDrafts(supabase, { ...body, batchName }, target);
    const groupDrafts = preview.drafts ?? [];
    drafts.push(...groupDrafts);
    cannibalizationIssues.push(...(preview.cannibalizationIssues ?? []));
    groups.push({
      targetName: target.targetName,
      type: target.type ?? "general",
      opportunityScore: target.opportunityScore ?? null,
      opportunityLabel: target.opportunityLabel ?? null,
      researchSourceCount: target.researchSourceCount ?? null,
      highestPayout: target.highestPayout ?? null,
      draftIds: groupDrafts.map((draft) => draft.previewId),
      warnings: Array.from(new Set(groupDrafts.flatMap((draft) => draft.targetWarnings ?? []))),
    });
  }

  return {
    batchName,
    count: drafts.length,
    groups,
    drafts,
    cannibalizationIssues,
  };
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const user = await checkAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as BatchGenerateRequest;
  const action = body.action ?? "preview";

  if (action === "preview") {
    try {
      const validTargets = (body.targets ?? []).filter((target) => target.targetName?.trim()).slice(0, MAX_GUIDES);
      const preview = body.generatorMode === "research_review" && validTargets.length > 0
        ? await buildResearchBatchPreviewDrafts(supabase, body, validTargets)
        : body.generatorMode === "research_review"
          ? await buildResearchPreviewDrafts(supabase, body)
          : await buildPreviewDrafts(supabase, body);
      return NextResponse.json(preview);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Preview generation failed." }, { status: 422 });
    }
  }

  const selectedDrafts = (body.drafts ?? []).filter((draft) => draft.selected !== false);
  if (selectedDrafts.length === 0) {
    return NextResponse.json({ error: "Select at least one guide to save." }, { status: 400 });
  }

  const reservedSlugs = new Set<string>();
  const rows = [];
  for (const draft of selectedDrafts.slice(0, MAX_GUIDES)) {
    const slug = await makeUniqueSlug(supabase, draft.slug, reservedSlugs);
    rows.push({
      title: draft.title,
      slug,
      game_id: draft.gameId,
      excerpt: draft.excerpt,
      body_md: renderMarkdown(draft.bodyHtml),
      difficulty: draft.difficulty,
      estimated_time: draft.estimatedCompletionTime,
      max_payout_usd: draft.maxRewardAmount,
      tips: Array.isArray(draft.tips) ? draft.tips : [],
      key_takeaways: [
        `Keyword target: ${draft.keywordTarget}`,
        draft.targetName ? `Research target: ${draft.targetName}` : null,
        typeof draft.opportunityScore === "number" ? `Opportunity score: ${draft.opportunityScore}` : null,
        draft.opportunityLabel ? `Opportunity label: ${draft.opportunityLabel}` : null,
      ].filter(Boolean).join("\n"),
      checklist_items: Array.isArray(draft.checklistItems) ? draft.checklistItems : [],
      layout_style: "classic",
      show_related_offers: true,
      show_related_guides: true,
      seo_title: draft.seoTitle,
      seo_description: draft.seoDescription,
      status: typeof draft.researchConfidenceScore === "number" && draft.researchConfidenceScore < 50 ? "needs_review" : "draft",
      platform_filter: "android",
      author_id: user.id,
      keyword_target: draft.keywordTarget,
      task_list_raw: draft.taskListRaw || null,
      parsed_tasks: draft.parsedTasks ?? [],
      internal_link_suggestions: draft.internalLinkSuggestions ?? [],
      batch_name: draft.batchName || body.batchName || null,
      guide_type: draft.guideType || body.guideType || "game_offer",
      platform_name: draft.platformName || body.platform || null,
      angle_type: draft.angleType || null,
      keyword_cluster_id: draft.keywordClusterId || null,
      keyword_intent: draft.keywordIntent || null,
      content_uniqueness_score: draft.contentSimilarityScore ?? null,
      needs_variation: Boolean(draft.needsVariation),
      review_type: draft.reviewType || null,
      research_summary: draft.researchSummary || null,
      research_confidence_score: draft.researchConfidenceScore ?? null,
      source_urls: Array.isArray(draft.sourceUrls) ? draft.sourceUrls : [],
      claims_needing_verification: Array.isArray(draft.claimsNeedingVerification) ? draft.claimsNeedingVerification : [],
      pros: Array.isArray(draft.pros) ? draft.pros : [],
      cons: Array.isArray(draft.cons) ? draft.cons : [],
      review_rating: draft.reviewRating ?? null,
    });
  }

  const { data, error } = await supabase
    .from("guides")
    .insert(rows)
    .select("id, title, slug, status, keyword_target, guide_type");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    batchName: body.batchName,
    count: data?.length ?? 0,
    guides: data ?? [],
  }, { status: 201 });
}
