import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { createClient } from "@/lib/supabase/server";

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
};

async function getGamesIndexData() {
  const supabase = createClient();

  const [{ data: offerRows }, { data: guideRows }] = await Promise.all([
    supabase
      .from("unified_offers_view")
      .select("game_id, game_name, game_slug, game_thumbnail, payout_usd")
      .order("payout_usd", { ascending: false })
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

  const games = Array.from(
    new Map(
      ((offerRows ?? []) as GameRow[])
        .filter((row) => row.game_id && row.game_slug)
        .map((row) => [
          row.game_id!,
          {
            id: row.game_id!,
            slug: row.game_slug!,
            name: row.game_name ?? "Unknown Game",
            topPayout: Number(row.payout_usd ?? 0),
            guideCount: guideCounts.get(row.game_id!) ?? 0,
          },
        ]),
    ).values(),
  )
    .sort((a, b) => b.topPayout - a.topPayout || b.guideCount - a.guideCount || a.name.localeCompare(b.name))
    .slice(0, 60);

  return games;
}

export default async function GamesIndexPage() {
  const games = await getGamesIndexData();

  return (
    <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
      <Container>
        <div className="mb-10">
          <p className="section-label mb-3">Games</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--brand-ink)] tracking-tight mb-3">
            Offerwall Games
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-3xl leading-relaxed">
            Browse tracked games, compare the highest current payouts, and open each game page for provider comparisons, offer ladders, and guide links.
          </p>
        </div>

        {games.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-default)] bg-white p-12 text-center shadow-[var(--shadow-card)]">
            <h2 className="text-xl font-bold text-[var(--brand-ink)]">No games available</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              No tracked games are available yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.slug}`}
                className="group rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-[var(--brand-lime)]/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                      Game Page
                    </div>
                    <h2 className="mt-2 text-lg font-extrabold text-[var(--brand-ink)] group-hover:text-[color:hsl(84,93%,36%)] transition-colors">
                      {game.name}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      Top payout: <span className="font-bold text-[var(--brand-ink)]">${game.topPayout.toFixed(2)}</span>
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      {game.guideCount} published guide{game.guideCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-[var(--brand-ink)] transition-transform group-hover:translate-x-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
