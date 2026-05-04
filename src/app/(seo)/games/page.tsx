import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import { createClient } from "@/lib/supabase/server";
import GamesIndexClient, { type GamesIndexItem } from "./GamesIndexClient";

export const metadata: Metadata = {
  title: "Games",
  description:
    "Browse tracked offerwall games, compare top payouts, and jump directly into game pages with guides and provider comparisons.",
  alternates: {
    canonical: "/games",
  },
  openGraph: {
    title: "Games",
    description:
      "Browse tracked offerwall games, compare top payouts, and jump directly into game pages with guides and provider comparisons.",
    url: "/games",
  },
};

type GameRow = {
  game_id: string | null;
  game_name: string | null;
  game_slug: string | null;
  game_thumbnail: string | null;
  payout_usd: number | null;
  total_payout_usd: number | null;
  provider_name: string | null;
  platform_name: string | null;
  category: string | null;
  updated_at: string | null;
};

async function getGamesIndexData() {
  const supabase = createClient();

  const [{ data: offerRows }, { data: guideRows }] = await Promise.all([
    supabase
      .from("unified_offers_view")
      .select("game_id, game_name, game_slug, game_thumbnail, payout_usd, total_payout_usd, provider_name, platform_name, category, updated_at")
      .order("total_payout_usd", { ascending: false })
      .limit(250),
    supabase
      .from("guides")
      .select("game_id")
      .eq("status", "published"),
  ]);

  const guideCounts = new Map<string, number>();
  for (const row of guideRows ?? []) {
    const gameId = row.game_id as string | null;
    if (!gameId) continue;
    guideCounts.set(gameId, (guideCounts.get(gameId) ?? 0) + 1);
  }

  const gamesById = new Map<string, GamesIndexItem & { providerSet: Set<string>; platformSet: Set<string> }>();

  for (const row of ((offerRows ?? []) as GameRow[]).filter((item) => item.game_id && item.game_slug)) {
    const id = row.game_id!;
    const payout = Number(row.total_payout_usd ?? row.payout_usd ?? 0);
    const current = gamesById.get(id);

    if (!current) {
      gamesById.set(id, {
        id,
        slug: row.game_slug!,
        name: row.game_name ?? "Unknown Game",
        thumbnailUrl: row.game_thumbnail,
        topPayout: payout,
        guideCount: guideCounts.get(id) ?? 0,
        offerCount: 1,
        bestProvider: row.provider_name ?? "Unknown Provider",
        bestPlatform: row.platform_name ?? "Unknown Platform",
        category: row.category ?? "General",
        updatedAt: row.updated_at,
        providerCount: row.provider_name ? 1 : 0,
        platformCount: row.platform_name ? 1 : 0,
        providerSet: new Set(row.provider_name ? [row.provider_name] : []),
        platformSet: new Set(row.platform_name ? [row.platform_name] : []),
      });
      continue;
    }

    current.offerCount += 1;
    if (row.provider_name) current.providerSet.add(row.provider_name);
    if (row.platform_name) current.platformSet.add(row.platform_name);
    current.providerCount = current.providerSet.size;
    current.platformCount = current.platformSet.size;
    if (payout > current.topPayout) {
      current.topPayout = payout;
      current.bestProvider = row.provider_name ?? current.bestProvider;
      current.bestPlatform = row.platform_name ?? current.bestPlatform;
      current.thumbnailUrl = row.game_thumbnail ?? current.thumbnailUrl;
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
      topPayout: game.topPayout,
      guideCount: game.guideCount,
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
    },
  };
}

export default async function GamesIndexPage() {
  const { games, summary } = await getGamesIndexData();

  return (
    <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-8 sm:pt-10">
      <Container>
        <GamesIndexClient games={games} summary={summary} />
      </Container>
    </main>
  );
}
