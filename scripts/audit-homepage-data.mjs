import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnvFile(".env.local");
loadEnvFile(".env.production");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
];

const FEATURED_EARNLAB_TASK_GROUPS = [
  ["DesignVille: Merge & Design", "DesignVille"],
  ["Rise of Kingdoms: Lost Crusade", "Rise of Kingdoms"],
  ["Palmon: Survival", "Palmon"],
  ["Crazy Fox"],
  ["Call of Dragons"],
  ["Woodoku Blast"],
];

const OFFER_SELECT = "id, source, title, game_id, game_name, game_slug, game_thumbnail, image_url, provider_name, platform_name, platform_logo, payout_usd, total_payout_usd, goal_text";

const featuredOfferFilters = buildHomepageIlikeFilters(
  FEATURED_GAME_NAMES.map((name) => getFeaturedGameAliases(name)),
  ["game_name", "title"],
);
const featuredEarnLabTaskFilters = buildHomepageIlikeFilters(
  FEATURED_EARNLAB_TASK_GROUPS,
  ["game_name", "title"],
);

const startedAt = Date.now();
const [
  offersResult,
  featuredGameOffersResult,
  featuredEarnLabTasksResult,
  featuredGamesResult,
  popularGuidesResult,
] = await Promise.all([
  supabase
    .from("unified_offers_view")
    .select(OFFER_SELECT)
    .order("total_payout_usd", { ascending: false })
    .limit(24),
  supabase
    .from("unified_offers_view")
    .select(OFFER_SELECT)
    .or(featuredOfferFilters)
    .order("total_payout_usd", { ascending: false })
    .limit(200),
  supabase
    .from("unified_offers_view")
    .select(OFFER_SELECT)
    .eq("platform_name", "EarnLab")
    .or(featuredEarnLabTaskFilters)
    .order("total_payout_usd", { ascending: false })
    .limit(120),
  supabase
    .from("games")
    .select("id, name, slug, thumbnail_url")
    .in("name", FEATURED_GAME_NAMES),
  supabase
    .from("guides")
    .select("id, title, slug, excerpt, difficulty, estimated_time, max_payout_usd, published_at, games(id, name, slug, thumbnail_url)")
    .eq("status", "published")
    .order("max_payout_usd", { ascending: false })
    .limit(6),
]);

for (const [name, result] of [
  ["homepage offers", offersResult],
  ["featured game offers", featuredGameOffersResult],
  ["EarnLab featured rows", featuredEarnLabTasksResult],
  ["featured games", featuredGamesResult],
  ["popular guides", popularGuidesResult],
]) {
  if (result.error) {
    console.error(`Failed to fetch ${name}: ${result.error.message}`);
    process.exit(1);
  }
}

const homepageOffers = offersResult.data ?? [];
const featuredGameOffers = featuredGameOffersResult.data ?? [];
const earnLabFeaturedRows = featuredEarnLabTasksResult.data ?? [];
const allRawOffers = [...homepageOffers, ...featuredGameOffers, ...earnLabFeaturedRows];
const uniqueOfferIds = new Set(allRawOffers.map((offer) => offer.id).filter(Boolean));
const duplicateOfferIds = allRawOffers.length - uniqueOfferIds.size;
const normalizedHomepageOffers = normalizePublicOfferRows(homepageOffers);
const normalizedFeaturedGameOffers = normalizePublicOfferRows(featuredGameOffers);
const normalizedEarnLabRows = normalizePublicOfferRows(earnLabFeaturedRows);
const allEligibleOfferRows = Array.from(
  new Map(
    [...normalizedHomepageOffers, ...normalizedFeaturedGameOffers, ...normalizedEarnLabRows].map((offer) => [offer.id, offer]),
  ).values(),
);
const featuredGames = buildFeaturedGames(featuredGamesResult.data ?? [], normalizedFeaturedGameOffers, allEligibleOfferRows);
const visibleRailOffers = buildEarnLabFeaturedOffers(normalizedEarnLabRows, allEligibleOfferRows);
const modalRouteRows = getModalRouteRows(allEligibleOfferRows, featuredGames, visibleRailOffers);
const currentTaskOfferIds = Array.from(new Set(modalRouteRows.map((offer) => offer.id).filter(Boolean)));
const gameIds = Array.from(new Set(modalRouteRows.map((offer) => offer.game_id).filter(Boolean)));

const [previousManualTasksResult, currentManualTasksResult, relatedGuidesResult, gainStatus] = await Promise.all([
  uniqueOfferIds.size
    ? supabase
        .from("site_offer_tasks")
        .select("site_offer_id, title, reward_amount, reward_display, time_limit_text, sort_order")
        .in("site_offer_id", Array.from(uniqueOfferIds))
        .order("sort_order", { ascending: true })
    : Promise.resolve({ data: [] }),
  currentTaskOfferIds.length
    ? supabase
        .from("site_offer_tasks")
        .select("site_offer_id, title, reward_amount, reward_display, time_limit_text, sort_order")
        .in("site_offer_id", currentTaskOfferIds)
        .order("sort_order", { ascending: true })
    : Promise.resolve({ data: [] }),
  gameIds.length
    ? supabase
        .from("guides")
        .select("slug, game_id")
        .eq("status", "published")
        .in("game_id", gameIds)
        .order("updated_at", { ascending: false })
    : Promise.resolve({ data: [] }),
  checkGainNativeStatus(),
]);

for (const [name, result] of [
  ["previous manual tasks", previousManualTasksResult],
  ["current manual tasks", currentManualTasksResult],
  ["related guides", relatedGuidesResult],
]) {
  if (result.error) {
    console.error(`Failed to fetch ${name}: ${result.error.message}`);
    process.exit(1);
  }
}

const previousManualTaskRows = previousManualTasksResult.data ?? [];
const manualTaskRows = currentManualTasksResult.data ?? [];
const relatedGuideRows = relatedGuidesResult.data ?? [];
const elapsedMs = Date.now() - startedAt;
const warnings = [];

if (featuredGameOffers.length >= 150) warnings.push("featured game offer query returns a large candidate set");
if (earnLabFeaturedRows.length >= 80) warnings.push("EarnLab candidate query returns a large candidate set");
if (manualTaskRows.length >= 500) warnings.push("manual task preload is large for initial homepage HTML");
if (duplicateOfferIds >= 25) warnings.push("offer candidate sets have notable duplicate IDs");
if (gainStatus.ok === false) warnings.push(`Gain native provider check failed: ${gainStatus.message}`);

console.log("Homepage Data Audit");
console.log(`Elapsed ms: ${elapsedMs}`);
console.log(`Homepage offer rows fetched: ${homepageOffers.length}`);
console.log(`Featured offer rows fetched: ${featuredGameOffers.length}`);
console.log(`EarnLab task candidate rows fetched: ${earnLabFeaturedRows.length}`);
console.log(`Featured games fetched: ${(featuredGamesResult.data ?? []).length}`);
console.log(`Popular guides fetched: ${(popularGuidesResult.data ?? []).length}`);
console.log(`Combined raw offer rows: ${allRawOffers.length}`);
console.log(`Unique offer IDs after dedupe: ${uniqueOfferIds.size}`);
console.log(`Estimated duplicated offer IDs: ${duplicateOfferIds}`);
console.log(`Eligible offer IDs after homepage filtering: ${allEligibleOfferRows.length}`);
console.log(`Visible rail offers prepared: ${visibleRailOffers.length}`);
console.log(`Modal route offer IDs needing task preload: ${currentTaskOfferIds.length}`);
console.log(`Manual task rows fetched previously: ${previousManualTaskRows.length}`);
console.log(`Manual task rows fetched currently: ${manualTaskRows.length}`);
console.log(`Manual task row reduction: ${Math.max(0, previousManualTaskRows.length - manualTaskRows.length)}`);
console.log(`Related guide rows fetched: ${relatedGuideRows.length}`);
console.log(`Related game IDs checked: ${gameIds.length}`);
console.log(`Gain native provider call: ${gainStatus.ok ? "ok" : "failed"} (${gainStatus.message})`);
console.log(`Gain native upstream rows: ${gainStatus.upstreamRows ?? "unknown"}`);
console.log("Warnings:");
if (warnings.length === 0) {
  console.log("  none");
} else {
  for (const warning of warnings) console.log(`  - ${warning}`);
}

function getFeaturedGameAliases(name) {
  const aliases = {
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

function normalizePublicOfferRows(rows) {
  return rows
    .map((row) => {
      const payoutUsd = Number(row.payout_usd ?? 0);
      const totalPayoutUsd = normalizeTotalPayout(payoutUsd, Number(row.total_payout_usd ?? payoutUsd));
      return {
        ...row,
        payout_usd: payoutUsd,
        total_payout_usd: totalPayoutUsd,
      };
    })
    .filter((row) => isPublicPayoutEligible(row.payout_usd, row.total_payout_usd));
}

function isPublicPayoutEligible(payoutUsd, totalPayoutUsd) {
  const threshold = Number(process.env.MIN_PUBLIC_OFFER_PAYOUT_USD ?? process.env.NEXT_PUBLIC_MIN_PUBLIC_OFFER_PAYOUT_USD ?? 0.05);
  const minPayout = Number.isFinite(threshold) && threshold >= 0 ? threshold : 0.05;
  return payoutUsd >= minPayout && totalPayoutUsd >= minPayout;
}

function normalizeTotalPayout(payoutUsd, totalPayoutUsd) {
  if (!Number.isFinite(payoutUsd)) return Number.isFinite(Number(totalPayoutUsd)) ? Number(totalPayoutUsd) : 0;
  const total = Number(totalPayoutUsd);
  if (!Number.isFinite(total)) return payoutUsd;
  return total < payoutUsd ? payoutUsd : total;
}

function buildHomepageIlikeFilters(groups, fields) {
  return groups
    .flatMap((group) =>
      group.flatMap((alias) =>
        fields.map((field) => `${field}.ilike.%${alias}%`),
      ),
    )
    .join(",");
}

function normalizeName(value) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function safeSlug(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function gameKeyFromParts(slug, name) {
  return slug || (name ? safeSlug(name) : "");
}

function matchesAliasGroup(candidate, aliases) {
  const normalizedCandidate = normalizeName(candidate);
  if (!normalizedCandidate) return false;

  return aliases.some((alias) => {
    const normalizedAlias = normalizeName(alias);
    return normalizedCandidate.includes(normalizedAlias) || normalizedAlias.includes(normalizedCandidate);
  });
}

function matchesFeaturedName(candidate, targetName) {
  const normalizedCandidate = normalizeName(candidate);
  if (!normalizedCandidate) return false;

  return getFeaturedGameAliases(targetName).some((alias) => {
    const normalizedAlias = normalizeName(alias);
    return normalizedCandidate.includes(normalizedAlias) || normalizedAlias.includes(normalizedCandidate);
  });
}

function buildFeaturedGames(featuredGameRows, featuredGameOfferRows, allOfferRows) {
  const bestImageByGameSlug = new Map(
    allOfferRows
      .filter((row) => row.game_slug)
      .map((row) => [
        row.game_slug,
        row.image_url ?? row.game_thumbnail ?? row.platform_logo ?? null,
      ]),
  );

  return FEATURED_GAME_NAMES.map((gameName) => {
    const matchingGame = featuredGameRows.find((game) => matchesFeaturedName(game.name, gameName)) ?? null;
    const matchingOffer =
      featuredGameOfferRows.find(
        (row) => matchesFeaturedName(row.game_name, gameName) || matchesFeaturedName(row.title, gameName),
      ) ?? null;
    const derivedSlug = matchingGame?.slug ?? matchingOffer?.game_slug ?? safeSlug(gameName);

    return {
      id: matchingGame?.id ?? matchingOffer?.game_id ?? null,
      slug: derivedSlug,
      name: matchingGame?.name ?? matchingOffer?.game_name ?? gameName,
      thumbnail:
        matchingGame?.thumbnail_url ??
        (matchingOffer?.game_slug ? bestImageByGameSlug.get(matchingOffer.game_slug) ?? null : null) ??
        matchingOffer?.image_url ??
        matchingOffer?.game_thumbnail ??
        null,
      provider: matchingOffer?.platform_name ?? matchingOffer?.provider_name ?? "Game Page",
    };
  });
}

function buildEarnLabFeaturedOffers(featuredEarnLabTaskRows, allOfferRows) {
  const homepageOfferCardRows = allOfferRows
    .map((row) => ({
      ...row,
      image_url: row.image_url ?? row.game_thumbnail ?? row.platform_logo ?? null,
    }))
    .filter((row) => row.game_slug || row.game_name);

  const earnLabFeaturedOfferRows = FEATURED_EARNLAB_TASK_GROUPS
    .map((aliases) =>
      featuredEarnLabTaskRows
        .filter((row) => {
          if (row.platform_name !== "EarnLab") return false;
          return matchesAliasGroup(row.title, aliases) || matchesAliasGroup(row.game_name, aliases);
        })
        .sort((a, b) => (b.total_payout_usd ?? b.payout_usd ?? 0) - (a.total_payout_usd ?? a.payout_usd ?? 0))[0] ?? null,
    )
    .filter(Boolean);

  const earnLabPrimaryOffers = earnLabFeaturedOfferRows.map((row) => ({
    ...row,
    badge: "EarnLab featured",
    image_url: row.image_url ?? row.game_thumbnail ?? row.platform_logo ?? null,
  }));

  const fallbackHighestOffers = Array.from(
    new Map(
      homepageOfferCardRows.map((row) => [
        row.game_slug ?? row.game_name ?? row.id,
        {
          ...row,
          badge: "Live offer",
          image_url: row.image_url ?? row.game_thumbnail ?? row.platform_logo ?? null,
        },
      ]),
    ).values(),
  );

  return [
    ...earnLabPrimaryOffers,
    ...fallbackHighestOffers.filter((row) => !earnLabPrimaryOffers.some((featured) => featured.id === row.id)),
  ].slice(0, 6);
}

function getModalRouteRows(allOfferRows, featuredGames, visibleRailOffers) {
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

async function checkGainNativeStatus() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const url = new URL(process.env.GAIN_API_URL?.trim() || "https://gain.gg/api/v2/offers");
  url.searchParams.set("limit", "24");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        accept: "application/json, text/plain, */*",
        referer: "https://gain.gg/earn",
        "user-agent": process.env.GAIN_API_USER_AGENT?.trim() ||
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      return { ok: false, message: `status ${response.status}` };
    }
    const payload = await response.json();
    const upstreamRows = [
      ...(Array.isArray(payload?.data?.featuredOffers) ? payload.data.featuredOffers : []),
      ...(Array.isArray(payload?.data?.offers) ? payload.data.offers : []),
    ].length;
    return { ok: true, message: `status ${response.status}`, upstreamRows };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}
