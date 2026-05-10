import "server-only";

import type { RailPreviewRoute, RailPreviewTask } from "@/components/home/GamePreviewModal";
import { getGainGalleryOffers, type GainGalleryOffer } from "@/lib/gain-gallery";
import { isPublicPayoutEligible, normalizeTotalPayout } from "@/lib/offer-quality";
import { normalizeProviderDisplayName } from "@/lib/provider-normalization";
import { supabase as publicSupabase } from "@/lib/supabase/public";

const FEATURED_GAME_NAMES = [
  "Sea of Conquest: Pirate",
  "Raid: Shadow Legends",
  "Game of Thrones",
  "Frost & Flame: King",
  "Zombie Waves",
  "World of Warships",
  "The Grand Mafia",
  "Lords Mobile",
  "Rise of Kingdoms",
  "Infinite Lagrange",
  "Wood Block Challenge",
  "2248 - Merge Tile",
  "Hexa Merge: Tile Sort",
  "Palmon: Survival",
  "MU: Dark Epoch",
  "Woodoku Blast",
  "Merge Paradise: Match",
  "Hero Wars: Alliance",
] as const;

const FEATURED_EARNLAB_TASK_GROUPS = [
  ["DesignVille: Merge & Design", "DesignVille"],
  ["Rise of Kingdoms: Lost Crusade", "Rise of Kingdoms"],
  ["Palmon: Survival", "Palmon"],
  ["Crazy Fox"],
  ["Call of Dragons"],
  ["Woodoku Blast"],
] as const;

const FEATURED_CASHINSTYLE_TASK_GROUPS = [
  ["Zombie Waves"],
  ["Monopoly GO", "Monopoly Go"],
  ["Bingo Blitz"],
  ["Coin Master"],
  ["Raid: Shadow Legends", "Raid Shadow Legends"],
  ["Merge Gardens"],
] as const;

const OFFER_SELECT =
  "id, source, title, game_id, game_name, game_slug, game_thumbnail, image_url, provider_name, platform_name, platform_logo, payout_usd, total_payout_usd, goal_text";

const GUIDE_SELECT =
  "id, title, slug, excerpt, difficulty, estimated_time, max_payout_usd, published_at, games(id, name, slug, thumbnail_url)";

export type OfferRow = {
  id: string;
  source: string | null;
  title: string | null;
  game_id: string | null;
  game_name: string | null;
  game_slug: string | null;
  game_thumbnail: string | null;
  image_url?: string | null;
  provider_name: string | null;
  platform_name: string | null;
  platform_logo?: string | null;
  payout_usd: number | null;
  total_payout_usd?: number | null;
  goal_text: string | null;
};

export type GuideRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  difficulty: string | null;
  estimated_time: string | null;
  max_payout_usd: number | null;
  published_at: string | null;
  games: {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
  } | null;
};

type RawGuideRow = Omit<GuideRow, "games"> & {
  games: GuideRow["games"] | GuideRow["games"][];
};

type FeaturedGame = {
  id: string | null;
  slug: string;
  name: string;
  thumbnail: string | null;
  provider: string | null;
};

type GameRow = {
  id: string;
  name: string;
  slug: string | null;
  thumbnail_url: string | null;
};

type SiteOfferTaskRow = {
  site_offer_id: string;
  title: string | null;
  reward_amount: number | null;
  reward_display: string | null;
  time_limit_text: string | null;
  sort_order: number | null;
};

type RelatedGuideRow = {
  slug: string;
  game_id: string | null;
};

export type HomepageRailOffer = OfferRow & {
  badge: string;
  image_url: string | null;
};

export type HomepageData = {
  featuredGames: FeaturedGame[];
  earnLabFeaturedOffers: HomepageRailOffer[];
  cashInStyleFeaturedOffers: HomepageRailOffer[];
  gainFeaturedOffers: GainGalleryOffer[];
  modalRoutesByGameKey: Record<string, RailPreviewRoute[]>;
  guideHrefByGameKey: Record<string, string>;
  popularGuides: GuideRow[];
  stats: {
    liveOfferCount: number;
    guideCount: number;
    topPayout: number | null;
  };
  audit: {
    rawOfferRows: number;
    uniqueOfferIds: number;
    modalTaskOfferIds: number;
    manualTaskRows: number;
    relatedGuideRows: number;
  };
};

export function formatMoney(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return `$${value.toFixed(2)}`;
}

export function gameKeyFromParts(slug: string | null | undefined, name: string | null | undefined) {
  return slug || (name ? safeSlug(name) : "");
}

export function buildGoHref(row: OfferRow, clickLocation: string) {
  const params = new URLSearchParams();
  params.set("click_location", clickLocation);
  params.set("source_context", "homepage_rail_modal");
  if (row.title) params.set("offer_title", row.title);
  if (row.game_name) params.set("game_title", row.game_name);
  if (row.platform_name) params.set("platform_name", row.platform_name);
  if (row.provider_name) params.set("provider_name", row.provider_name);
  const payoutValue = row.total_payout_usd ?? row.payout_usd;
  if (typeof payoutValue === "number") params.set("payout_usd", String(payoutValue));
  return `/go/${row.id}?${params.toString()}`;
}

function normalizeName(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function safeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFeaturedGameAliases(name: string) {
  const aliases: Record<string, string[]> = {
    "Sea of Conquest: Pirate": ["Sea of Conquest", "Sea of Conquest Pirate"],
    "Raid: Shadow Legends": ["Raid Shadow Legends"],
    "Game of Thrones": ["Game of Thrones"],
    "Frost & Flame: King": ["Frost & Flame", "Frost and Flame", "Frost Flame"],
    "Zombie Waves": ["Zombie Waves"],
    "World of Warships": ["World of Warships"],
    "The Grand Mafia": ["Grand Mafia"],
    "Lords Mobile": ["Lords Mobile"],
    "Rise of Kingdoms": ["Rise of Kingdoms"],
    "Infinite Lagrange": ["Infinite Lagrange"],
    "Wood Block Challenge": ["Wood Block Challenge"],
    "2248 - Merge Tile": ["2248", "2248 Merge Tile"],
    "Hexa Merge: Tile Sort": ["Hexa Merge", "Tile Sort"],
    "Palmon: Survival": ["Palmon", "Palmon Survival"],
    "MU: Dark Epoch": ["MU Dark Epoch", "Dark Epoch"],
    "Woodoku Blast": ["Woodoku Blast", "Woodoku"],
    "Merge Paradise: Match": ["Merge Paradise"],
    "Hero Wars: Alliance": ["Hero Wars", "Hero Wars Alliance"],
  };

  return [name, ...(aliases[name] ?? [])];
}

function buildHomepageIlikeFilters(groups: readonly (readonly string[])[], fields: string[]) {
  return groups
    .flatMap((group) =>
      group.flatMap((alias) =>
        fields.map((field) => `${field}.ilike.%${alias}%`),
      ),
    )
    .join(",");
}

function matchesAliasGroup(candidate: string | null | undefined, aliases: readonly string[]) {
  const normalizedCandidate = normalizeName(candidate);
  if (!normalizedCandidate) return false;

  return aliases.some((alias) => {
    const normalizedAlias = normalizeName(alias);
    return (
      normalizedCandidate.includes(normalizedAlias) ||
      normalizedAlias.includes(normalizedCandidate)
    );
  });
}

function matchesFeaturedName(candidate: string | null | undefined, targetName: string) {
  const normalizedCandidate = normalizeName(candidate);
  if (!normalizedCandidate) return false;

  return getFeaturedGameAliases(targetName).some((alias) => {
    const normalizedAlias = normalizeName(alias);
    return (
      normalizedCandidate.includes(normalizedAlias) ||
      normalizedAlias.includes(normalizedCandidate)
    );
  });
}

function normalizePublicOfferRows(rows: OfferRow[]) {
  return rows
    .map((row) => {
      const payoutUsd = Number(row.payout_usd ?? 0);
      const totalPayoutUsd = normalizeTotalPayout(payoutUsd, Number(row.total_payout_usd ?? payoutUsd));
      return {
        ...row,
        provider_name: normalizeProviderDisplayName(row.provider_name),
        payout_usd: payoutUsd,
        total_payout_usd: totalPayoutUsd,
      };
    })
    .filter((row) => isPublicPayoutEligible(row.payout_usd, row.total_payout_usd));
}

function normalizeGuides(rows: RawGuideRow[] | null | undefined): GuideRow[] {
  return (rows ?? []).map((row) => ({
    ...row,
    games: Array.isArray(row.games) ? row.games[0] ?? null : row.games,
  }));
}

// Base offer rows: high-payout cards shown or used as rail fallback.
async function loadBaseOfferRows() {
  return publicSupabase
    .from("unified_offers_view")
    .select(OFFER_SELECT)
    .order("total_payout_usd", { ascending: false })
    .limit(24);
}

// Featured game candidates: broad matching set used to enrich featured game/page previews.
async function loadFeaturedGameCandidates() {
  const featuredOfferFilters = buildHomepageIlikeFilters(
    FEATURED_GAME_NAMES.map((name) => getFeaturedGameAliases(name)),
    ["game_name", "title"],
  );

  return publicSupabase
    .from("unified_offers_view")
    .select(OFFER_SELECT)
    .or(featuredOfferFilters)
    .order("total_payout_usd", { ascending: false })
    .limit(200);
}

// EarnLab candidates: curated task groups for the visible EarnLab rail.
async function loadEarnLabCandidates() {
  const featuredEarnLabTaskFilters = buildHomepageIlikeFilters(
    FEATURED_EARNLAB_TASK_GROUPS,
    ["game_name", "title"],
  );

  return publicSupabase
    .from("unified_offers_view")
    .select(OFFER_SELECT)
    .eq("platform_name", "EarnLab")
    .or(featuredEarnLabTaskFilters)
    .order("total_payout_usd", { ascending: false })
    .limit(120);
}

// CashInStyle candidates: visible homepage rail for imported CashInStyle offers.
async function loadCashInStyleCandidates() {
  const featuredCashInStyleTaskFilters = buildHomepageIlikeFilters(
    FEATURED_CASHINSTYLE_TASK_GROUPS,
    ["game_name", "title"],
  );

  return publicSupabase
    .from("unified_offers_view")
    .select(OFFER_SELECT)
    .eq("platform_name", "CashInStyle")
    .or(featuredCashInStyleTaskFilters)
    .order("total_payout_usd", { ascending: false })
    .limit(120);
}

async function loadPopularGuides() {
  return publicSupabase
    .from("guides")
    .select(GUIDE_SELECT)
    .eq("status", "published")
    .order("max_payout_usd", { ascending: false })
    .limit(6);
}

async function loadFeaturedGames() {
  return publicSupabase
    .from("games")
    .select("id, name, slug, thumbnail_url")
    .in("name", [...FEATURED_GAME_NAMES]);
}

// Gain featured data: getGainGalleryOffers already uses Next fetch revalidation.
async function loadGainFeaturedData() {
  return getGainGalleryOffers("native", { country: "US", limit: 24 }).catch((error) => {
    console.error("[homepage] failed to load Gain featured offers", error);
    return null;
  });
}

async function loadManualTasks(offerIds: string[]) {
  return offerIds.length
    ? publicSupabase
        .from("site_offer_tasks")
        .select("site_offer_id, title, reward_amount, reward_display, time_limit_text, sort_order")
        .in("site_offer_id", offerIds)
        .order("sort_order", { ascending: true })
    : Promise.resolve({ data: [] as SiteOfferTaskRow[] });
}

async function loadRelatedGuides(gameIds: string[]) {
  return gameIds.length
    ? publicSupabase
        .from("guides")
        .select("slug, game_id")
        .eq("status", "published")
        .in("game_id", gameIds)
        .order("updated_at", { ascending: false })
    : Promise.resolve({ data: [] as RelatedGuideRow[] });
}

function buildManualTaskMap(tasks: SiteOfferTaskRow[]) {
  const manualTaskMap = new Map<string, RailPreviewTask[]>();
  tasks.forEach((task) => {
    const existing = manualTaskMap.get(task.site_offer_id) ?? [];
    existing.push({
      title: task.title ?? "Offer milestone",
      rewardDisplay: task.reward_display ?? formatMoney(task.reward_amount),
      timeLimitText: task.time_limit_text,
      sortOrder: task.sort_order,
    });
    manualTaskMap.set(task.site_offer_id, existing);
  });
  return manualTaskMap;
}

function buildRelatedGuideMap(guides: RelatedGuideRow[]) {
  const guideHrefByGameId = new Map<string, string>();
  guides.forEach((guide) => {
    if (guide.game_id && !guideHrefByGameId.has(guide.game_id)) {
      guideHrefByGameId.set(guide.game_id, `/guides/${guide.slug}`);
    }
  });
  return guideHrefByGameId;
}

function buildFeaturedGames({
  featuredGameRows,
  featuredGameOfferRows,
  allOfferRows,
}: {
  featuredGameRows: GameRow[];
  featuredGameOfferRows: OfferRow[];
  allOfferRows: OfferRow[];
}) {
  const bestImageByGameSlug = new Map(
    allOfferRows
      .filter((row) => row.game_slug)
      .map((row) => [
        row.game_slug!,
        row.image_url ?? row.game_thumbnail ?? row.platform_logo ?? null,
      ]),
  );

  return FEATURED_GAME_NAMES.map((gameName): FeaturedGame => {
    const matchingGame =
      featuredGameRows.find((game) => matchesFeaturedName(game.name, gameName)) ?? null;
    const matchingOffer =
      featuredGameOfferRows.find(
        (row) =>
          matchesFeaturedName(row.game_name, gameName) ||
          matchesFeaturedName(row.title, gameName),
      ) ?? null;
    const derivedSlug =
      matchingGame?.slug ??
      matchingOffer?.game_slug ??
      safeSlug(gameName);

    return {
      id: matchingGame?.id ?? matchingOffer?.game_id ?? null,
      slug: derivedSlug,
      name: matchingGame?.name ?? matchingOffer?.game_name ?? gameName,
      thumbnail:
        matchingGame?.thumbnail_url ??
        (matchingOffer?.game_slug
          ? bestImageByGameSlug.get(matchingOffer.game_slug) ?? null
          : null) ??
        matchingOffer?.image_url ??
        matchingOffer?.game_thumbnail ??
        null,
      provider:
        matchingOffer?.platform_name ??
        matchingOffer?.provider_name ??
        "Game Page",
    };
  });
}

function buildEarnLabFeaturedOffers({
  featuredEarnLabTaskRows,
  allOfferRows,
}: {
  featuredEarnLabTaskRows: OfferRow[];
  allOfferRows: OfferRow[];
}) {
  const homepageOfferCardRows = allOfferRows
    .map((row) => ({
      ...row,
      image_url:
        row.image_url ??
        row.game_thumbnail ??
        row.platform_logo ??
        null,
    }))
    .filter((row) => row.game_slug || row.game_name);

  const earnLabFeaturedOfferRows: OfferRow[] = FEATURED_EARNLAB_TASK_GROUPS
    .map((aliases) =>
      featuredEarnLabTaskRows
        .filter((row) => {
          if (row.platform_name !== "EarnLab") return false;
          return (
            matchesAliasGroup(row.title, aliases) ||
            matchesAliasGroup(row.game_name, aliases)
          );
        })
        .sort(
          (a, b) =>
            (b.total_payout_usd ?? b.payout_usd ?? 0) -
            (a.total_payout_usd ?? a.payout_usd ?? 0),
        )[0] ?? null,
    )
    .filter(Boolean) as OfferRow[];

  const earnLabPrimaryOffers = earnLabFeaturedOfferRows
    .map((row) => ({
      ...row,
      badge: "EarnLab featured",
      image_url:
        row.image_url ??
        row.game_thumbnail ??
        row.platform_logo ??
        null,
    }));

  const fallbackHighestOffers = Array.from(
    new Map(
      homepageOfferCardRows.map((row) => [
        row.game_slug ?? row.game_name ?? row.id,
        {
          ...row,
          badge: "Live offer",
          image_url:
            row.image_url ??
            row.game_thumbnail ??
            row.platform_logo ??
            null,
        },
      ]),
    ).values(),
  );

  return [
    ...earnLabPrimaryOffers,
    ...fallbackHighestOffers.filter(
      (row) => !earnLabPrimaryOffers.some((featured) => featured.id === row.id),
    ),
  ].slice(0, 6);
}

function buildCashInStyleFeaturedOffers({
  featuredCashInStyleTaskRows,
}: {
  featuredCashInStyleTaskRows: OfferRow[];
}) {
  const cashInStyleFeaturedOfferRows: OfferRow[] = FEATURED_CASHINSTYLE_TASK_GROUPS
    .map((aliases) =>
      featuredCashInStyleTaskRows
        .filter((row) => {
          if (row.platform_name !== "CashInStyle") return false;
          return (
            matchesAliasGroup(row.title, aliases) ||
            matchesAliasGroup(row.game_name, aliases)
          );
        })
        .sort((a, b) => (b.total_payout_usd ?? b.payout_usd ?? 0) - (a.total_payout_usd ?? a.payout_usd ?? 0))[0] ?? null,
    )
    .filter(Boolean) as OfferRow[];

  const primaryOffers = cashInStyleFeaturedOfferRows.length
    ? cashInStyleFeaturedOfferRows
    : featuredCashInStyleTaskRows;

  return primaryOffers
    .map((row) => ({
      ...row,
      badge: "CashInStyle featured",
      image_url:
        row.image_url ??
        row.game_thumbnail ??
        row.platform_logo ??
        null,
    }))
    .slice(0, 6);
}

function getModalRouteRows({
  allOfferRows,
  featuredGames,
  visibleRailOffers,
}: {
  allOfferRows: OfferRow[];
  featuredGames: FeaturedGame[];
  visibleRailOffers: HomepageRailOffer[];
}) {
  const visibleGameKeys = new Set(
    visibleRailOffers
      .map((offer) => gameKeyFromParts(offer.game_slug, offer.game_name))
      .filter(Boolean),
  );
  const visibleFeaturedGames = featuredGames.filter((game) => visibleGameKeys.has(game.slug));

  return allOfferRows.filter((row) => {
    const rowKey = gameKeyFromParts(row.game_slug, row.game_name);
    if (visibleGameKeys.has(rowKey)) return true;

    return visibleFeaturedGames.some(
      (game) =>
        row.game_slug === game.slug ||
        matchesFeaturedName(row.game_name, game.name) ||
        matchesFeaturedName(row.title, game.name),
    );
  });
}

function buildModalRoutes({
  modalRouteRows,
  featuredGames,
  manualTaskMap,
}: {
  modalRouteRows: OfferRow[];
  featuredGames: FeaturedGame[];
  manualTaskMap: Map<string, RailPreviewTask[]>;
}) {
  function tasksForOffer(row: OfferRow): RailPreviewTask[] {
    const manualTasks = manualTaskMap.get(row.id);
    if (manualTasks?.length) return manualTasks;
    if (row.goal_text) {
      return [{ title: row.goal_text, rewardDisplay: formatMoney(row.total_payout_usd ?? row.payout_usd) }];
    }
    return [{ title: "Review the live offer requirements on the provider before starting.", rewardDisplay: formatMoney(row.total_payout_usd ?? row.payout_usd) }];
  }

  const modalRoutesByGameKey = modalRouteRows.reduce<Record<string, RailPreviewRoute[]>>((acc, row) => {
    const key = gameKeyFromParts(row.game_slug, row.game_name);
    if (!key) return acc;
    const tasks = tasksForOffer(row);
    acc[key] = acc[key] ?? [];
    acc[key].push({
      offerId: row.id,
      href: buildGoHref(row, "homepage_modal_platform_choice"),
      providerName: row.provider_name,
      platformName: row.platform_name,
      payout: formatMoney(row.total_payout_usd ?? row.payout_usd),
      payoutValue: row.total_payout_usd ?? row.payout_usd,
      taskCount: tasks.length,
      tasks,
    });
    acc[key].sort((a, b) => (b.payoutValue ?? 0) - (a.payoutValue ?? 0));
    return acc;
  }, {});

  featuredGames.forEach((game) => {
    const matchingRouteRows = modalRouteRows.filter(
      (row) =>
        row.game_slug === game.slug ||
        matchesFeaturedName(row.game_name, game.name) ||
        matchesFeaturedName(row.title, game.name),
    );

    if (matchingRouteRows.length === 0) return;

    const routesById = new Map<string, RailPreviewRoute>();
    for (const existingRoute of modalRoutesByGameKey[game.slug] ?? []) {
      routesById.set(existingRoute.offerId, existingRoute);
    }
    for (const row of matchingRouteRows) {
      const rowKey = gameKeyFromParts(row.game_slug, row.game_name);
      for (const route of modalRoutesByGameKey[rowKey] ?? []) {
        routesById.set(route.offerId, route);
      }
    }

    modalRoutesByGameKey[game.slug] = Array.from(routesById.values()).sort(
      (a, b) => (b.payoutValue ?? 0) - (a.payoutValue ?? 0),
    );
  });

  return modalRoutesByGameKey;
}

function buildGuideHrefByGameKey({
  allOfferRows,
  featuredGames,
  guideHrefByGameId,
}: {
  allOfferRows: OfferRow[];
  featuredGames: FeaturedGame[];
  guideHrefByGameId: Map<string, string>;
}) {
  const guideHrefByGameKey = allOfferRows.reduce<Record<string, string>>((acc, row) => {
    const key = gameKeyFromParts(row.game_slug, row.game_name);
    const guideHref = row.game_id ? guideHrefByGameId.get(row.game_id) : null;
    if (key && guideHref && !acc[key]) acc[key] = guideHref;
    return acc;
  }, {});

  featuredGames.forEach((game) => {
    const directGuideHref = game.id ? guideHrefByGameId.get(game.id) : null;
    if (directGuideHref && !guideHrefByGameKey[game.slug]) {
      guideHrefByGameKey[game.slug] = directGuideHref;
      return;
    }

    const matchingOfferWithGuide = allOfferRows.find(
      (row) =>
        row.game_id &&
        guideHrefByGameId.has(row.game_id) &&
        (row.game_slug === game.slug ||
          matchesFeaturedName(row.game_name, game.name) ||
          matchesFeaturedName(row.title, game.name)),
    );
    if (matchingOfferWithGuide?.game_id && !guideHrefByGameKey[game.slug]) {
      guideHrefByGameKey[game.slug] = guideHrefByGameId.get(matchingOfferWithGuide.game_id) ?? "";
    }
  });

  return guideHrefByGameKey;
}

export async function getHomepageData(): Promise<HomepageData> {
  const [
    offersResult,
    popularGuidesResult,
    featuredGamesResult,
    featuredGameOffersResult,
    featuredEarnLabTasksResult,
    featuredCashInStyleTasksResult,
    gainFeaturedOffersResult,
  ] = await Promise.all([
    loadBaseOfferRows(),
    loadPopularGuides(),
    loadFeaturedGames(),
    loadFeaturedGameCandidates(),
    loadEarnLabCandidates(),
    loadCashInStyleCandidates(),
    loadGainFeaturedData(),
  ]);

  const offerRows = normalizePublicOfferRows((offersResult.data ?? []) as OfferRow[]);
  const featuredGameOfferRows = normalizePublicOfferRows((featuredGameOffersResult.data ?? []) as OfferRow[]);
  const featuredEarnLabTaskRows = normalizePublicOfferRows((featuredEarnLabTasksResult.data ?? []) as OfferRow[]);
  const featuredCashInStyleTaskRows = normalizePublicOfferRows(
    (featuredCashInStyleTasksResult.data ?? []) as OfferRow[],
  );

  const allOfferRows = Array.from(
    new Map(
      [
        ...offerRows,
        ...featuredGameOfferRows,
        ...featuredEarnLabTaskRows,
        ...featuredCashInStyleTaskRows,
      ].map((row) => [row.id, row]),
    ).values(),
  );

  const featuredGames = buildFeaturedGames({
    featuredGameRows: (featuredGamesResult.data ?? []) as GameRow[],
    featuredGameOfferRows,
    allOfferRows,
  });

  const earnLabFeaturedOffers = buildEarnLabFeaturedOffers({
    featuredEarnLabTaskRows,
    allOfferRows,
  });
  const cashInStyleFeaturedOffers = buildCashInStyleFeaturedOffers({
    featuredCashInStyleTaskRows,
  });

  const modalRouteRows = getModalRouteRows({
    allOfferRows,
    featuredGames,
    visibleRailOffers: [...earnLabFeaturedOffers, ...cashInStyleFeaturedOffers],
  });
  const modalOfferIds = Array.from(new Set(modalRouteRows.map((row) => row.id)));
  const modalGameIds = Array.from(new Set(modalRouteRows.map((row) => row.game_id).filter(Boolean))) as string[];

  const [manualOfferTasksResult, relatedGuidesResult] = await Promise.all([
    loadManualTasks(modalOfferIds),
    loadRelatedGuides(modalGameIds),
  ]);

  const manualTasks = (manualOfferTasksResult.data ?? []) as SiteOfferTaskRow[];
  const relatedGuides = (relatedGuidesResult.data ?? []) as RelatedGuideRow[];
  const manualTaskMap = buildManualTaskMap(manualTasks);
  const guideHrefByGameId = buildRelatedGuideMap(relatedGuides);

  const modalRoutesByGameKey = buildModalRoutes({
    modalRouteRows,
    featuredGames,
    manualTaskMap,
  });

  const guideHrefByGameKey = buildGuideHrefByGameKey({
    allOfferRows,
    featuredGames,
    guideHrefByGameId,
  });

  const gainFeaturedOffers = (gainFeaturedOffersResult?.offers ?? [])
    .filter((offer) => offer.wall === "native")
    .slice(0, 10);

  const popularGuides = normalizeGuides((popularGuidesResult.data ?? []) as RawGuideRow[]);
  const uniqueGuideIds = new Set(popularGuides.map((guide) => guide.id));

  return {
    featuredGames,
    earnLabFeaturedOffers,
    cashInStyleFeaturedOffers,
    gainFeaturedOffers,
    modalRoutesByGameKey,
    guideHrefByGameKey,
    popularGuides,
    stats: {
      liveOfferCount: offerRows.length,
      guideCount: uniqueGuideIds.size,
      topPayout: offerRows[0]?.total_payout_usd ?? offerRows[0]?.payout_usd ?? null,
    },
    audit: {
      rawOfferRows:
        offerRows.length +
        featuredGameOfferRows.length +
        featuredEarnLabTaskRows.length +
        featuredCashInStyleTaskRows.length,
      uniqueOfferIds: allOfferRows.length,
      modalTaskOfferIds: modalOfferIds.length,
      manualTaskRows: manualTasks.length,
      relatedGuideRows: relatedGuides.length,
    },
  };
}
