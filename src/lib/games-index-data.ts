import { isPublicPayoutEligible, normalizeTotalPayout } from "@/lib/offer-quality";
import { normalizeProviderDisplayName } from "@/lib/provider-normalization";
import { cleanPublicImageUrl, pickPublicArtworkUrl } from "@/lib/public-image-url";
import { createClient } from "@/lib/supabase/server";

export type GamesIndexItem = {
  id: string;
  slug: string;
  name: string;
  thumbnailUrl: string | null;
  gameThumbnailUrl?: string | null;
  offerImageUrl?: string | null;
  platformLogoUrl?: string | null;
  providerLogoUrl?: string | null;
  topPayout: number;
  guideCount: number;
  guideSlug?: string | null;
  offerCount: number;
  bestProvider: string;
  bestPlatform: string;
  category: string;
  updatedAt: string | null;
  providerCount: number;
  platformCount: number;
};

export type GamesIndexSummary = {
  totalGames: number;
  highestPayout: number;
  guidesAvailable: number;
  trackedOffers: number;
  providersTracked: number;
};

type GameRow = {
  game_id: string | null;
  game_name: string | null;
  game_slug: string | null;
  game_thumbnail: string | null;
  image_url: string | null;
  platform_logo: string | null;
  payout_usd: number | null;
  total_payout_usd: number | null;
  provider_name: string | null;
  platform_name: string | null;
  category: string | null;
  updated_at: string | null;
};

type ProviderRow = {
  name: string | null;
  logo_url: string | null;
};

type AggregatedGame = GamesIndexItem & {
  providerSet: Set<string>;
  platformSet: Set<string>;
  bestImagePayout: number;
};

export async function getGamesIndexData() {
  const supabase = createClient();

  const [{ data: offerRows }, { data: guideRows }, { data: providerRows }] = await Promise.all([
    supabase
      .from("unified_offers_view")
      .select("game_id, game_name, game_slug, game_thumbnail, image_url, platform_logo, payout_usd, total_payout_usd, provider_name, platform_name, category, updated_at")
      .order("total_payout_usd", { ascending: false })
      .limit(250),
    supabase
      .from("guides")
      .select("game_id, slug")
      .eq("status", "published"),
    supabase
      .from("providers")
      .select("name, logo_url")
      .eq("is_active", true),
  ]);

  const providerLogos = new Map(
    ((providerRows ?? []) as ProviderRow[])
      .map((row) => [row.name, cleanPublicImageUrl(row.logo_url)] as const)
      .filter((entry): entry is [string, string] => Boolean(entry[0] && entry[1])),
  );
  const guideCounts = new Map<string, number>();
  const guideSlugs = new Map<string, string>();
  for (const row of guideRows ?? []) {
    const gameId = row.game_id as string | null;
    if (!gameId) continue;
    guideCounts.set(gameId, (guideCounts.get(gameId) ?? 0) + 1);
    if (!guideSlugs.has(gameId) && row.slug) guideSlugs.set(gameId, row.slug as string);
  }

  const gamesById = new Map<string, AggregatedGame>();
  const allProviders = new Set<string>();

  for (const row of ((offerRows ?? []) as GameRow[]).filter((item) => item.game_id && item.game_slug)) {
    const id = row.game_id!;
    const payoutUsd = Number(row.payout_usd ?? 0);
    const payout = normalizeTotalPayout(payoutUsd, Number(row.total_payout_usd ?? payoutUsd));
    if (!isPublicPayoutEligible(payoutUsd, payout)) continue;
    const current = gamesById.get(id);
    const gameThumbnailUrl = pickPublicArtworkUrl(row.game_thumbnail);
    const offerImageUrl = pickPublicArtworkUrl(row.image_url);
    const platformLogoUrl = cleanPublicImageUrl(row.platform_logo);
    const providerLogoUrl = row.provider_name ? providerLogos.get(row.provider_name) ?? null : null;
    const resolvedThumbnailUrl = pickPublicArtworkUrl(gameThumbnailUrl, offerImageUrl);
    const providerName = row.provider_name ? normalizeProviderDisplayName(row.provider_name) : null;
    if (providerName) allProviders.add(providerName);

    if (!current) {
      gamesById.set(id, {
        id,
        slug: row.game_slug!,
        name: row.game_name ?? "Unknown Game",
        thumbnailUrl: resolvedThumbnailUrl,
        gameThumbnailUrl,
        offerImageUrl,
        platformLogoUrl,
        providerLogoUrl,
        topPayout: payout,
        guideCount: guideCounts.get(id) ?? 0,
        guideSlug: guideSlugs.get(id) ?? null,
        offerCount: 1,
        bestProvider: providerName ?? "Unknown Provider",
        bestPlatform: row.platform_name ?? "Unknown Platform",
        category: row.category ?? "General",
        updatedAt: row.updated_at,
        providerCount: row.provider_name ? 1 : 0,
        platformCount: row.platform_name ? 1 : 0,
        providerSet: new Set(providerName ? [providerName] : []),
        platformSet: new Set(row.platform_name ? [row.platform_name] : []),
        bestImagePayout: resolvedThumbnailUrl ? payout : 0,
      });
      continue;
    }

    current.offerCount += 1;
    if (providerName) current.providerSet.add(providerName);
    if (row.platform_name) current.platformSet.add(row.platform_name);
    current.providerCount = current.providerSet.size;
    current.platformCount = current.platformSet.size;
    if (!current.gameThumbnailUrl && gameThumbnailUrl) current.gameThumbnailUrl = gameThumbnailUrl;
    if ((!current.offerImageUrl || payout > current.bestImagePayout) && offerImageUrl) current.offerImageUrl = offerImageUrl;
    if (!current.platformLogoUrl && platformLogoUrl) current.platformLogoUrl = platformLogoUrl;
    if (!current.providerLogoUrl && providerLogoUrl) current.providerLogoUrl = providerLogoUrl;
    current.thumbnailUrl =
      current.gameThumbnailUrl ??
      current.offerImageUrl ??
      current.thumbnailUrl;
    if (offerImageUrl && payout >= current.bestImagePayout) current.bestImagePayout = payout;
    if (payout > current.topPayout) {
      current.topPayout = payout;
      current.bestProvider = providerName ?? current.bestProvider;
      current.bestPlatform = row.platform_name ?? current.bestPlatform;
      current.providerLogoUrl = providerLogoUrl ?? current.providerLogoUrl;
      current.platformLogoUrl = platformLogoUrl ?? current.platformLogoUrl;
      current.category = row.category ?? current.category;
      current.updatedAt = row.updated_at ?? current.updatedAt;
    }
  }

  const games = Array.from(gamesById.values())
    .map((game) => ({
      id: game.id,
      slug: game.slug,
      name: game.name,
      thumbnailUrl: game.thumbnailUrl,
      gameThumbnailUrl: game.gameThumbnailUrl,
      offerImageUrl: game.offerImageUrl,
      platformLogoUrl: game.platformLogoUrl,
      providerLogoUrl: game.providerLogoUrl,
      topPayout: game.topPayout,
      guideCount: game.guideCount,
      guideSlug: game.guideSlug,
      offerCount: game.offerCount,
      bestProvider: game.bestProvider,
      bestPlatform: game.bestPlatform,
      category: game.category,
      updatedAt: game.updatedAt,
      providerCount: game.providerCount,
      platformCount: game.platformCount,
    }))
    .sort((a, b) => b.topPayout - a.topPayout || b.guideCount - a.guideCount || a.name.localeCompare(b.name))
    .slice(0, 60);

  return {
    games,
    summary: {
      totalGames: games.length,
      highestPayout: games[0]?.topPayout ?? 0,
      guidesAvailable: games.filter((game) => game.guideCount > 0).length,
      trackedOffers: games.reduce((sum, game) => sum + game.offerCount, 0),
      providersTracked: allProviders.size,
    },
  };
}
