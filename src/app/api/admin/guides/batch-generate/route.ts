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

const MAX_GUIDES = 100;

type BatchGenerateRequest = {
  action?: "preview" | "save";
  batchName?: string;
  guideType?: GuideType;
  gameName?: string;
  platform?: string;
  maxPayout?: string | number | null;
  numberOfGuides?: string | number | null;
  taskListRaw?: string;
  generateFromTaskList?: boolean;
  createMultipleLongTail?: boolean;
  aggressiveMode?: boolean;
  drafts?: SaveGuideDraft[];
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

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const user = await checkAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as BatchGenerateRequest;
  const action = body.action ?? "preview";

  if (action === "preview") {
    try {
      const preview = await buildPreviewDrafts(supabase, body);
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
      key_takeaways: `Keyword target: ${draft.keywordTarget}`,
      checklist_items: Array.isArray(draft.checklistItems) ? draft.checklistItems : [],
      layout_style: "classic",
      show_related_offers: true,
      show_related_guides: true,
      seo_title: draft.seoTitle,
      seo_description: draft.seoDescription,
      status: "draft",
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
