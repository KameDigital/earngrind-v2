import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { buildSeoMetadata, formatMoney, getTopOffers } from "../../_lib/seo-data";

export const revalidate = 3600;

export const metadata: Metadata = buildSeoMetadata({
  title: "GPT Offer Guides by Game",
  description: "Browse game-specific GPT earning guides with payout breakdowns and milestone strategy.",
  path: "/guides/how-to-earn",
});

export default async function HowToEarnGuidesIndexPage() {
  const offers = await getTopOffers({ perPage: 120, minPayoutUsd: 1 });
  const games = offers
    .filter((offer) => offer.game)
    .reduce<Array<{ slug: string; name: string; bestPayoutUsd: number; offers: number }>>((acc, offer) => {
      const game = offer.game!;
      const existing = acc.find((row) => row.slug === game.slug);
      if (existing) {
        existing.offers += 1;
        existing.bestPayoutUsd = Math.max(existing.bestPayoutUsd, offer.payout_usd);
      } else {
        acc.push({
          slug: game.slug,
          name: game.name,
          bestPayoutUsd: offer.payout_usd,
          offers: 1,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.bestPayoutUsd - a.bestPayoutUsd)
    .slice(0, 36);

  return (
    <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
      <Container className="space-y-6">
        <header className="rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)]">
          <p className="section-label">Guides</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--brand-ink)]">How To Earn: Game Guides</h1>
          <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">
            Open a game guide to see payout breakdowns, milestone lists, and practical completion tips based on live offer data.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Link
              key={game.slug}
              href={`/guides/how-to-earn/${game.slug}`}
              className="rounded-2xl border border-[var(--border-default)] bg-white p-4 shadow-[var(--shadow-card)] hover:border-lime-400 hover:bg-lime-50"
            >
              <h2 className="text-lg font-extrabold text-[var(--brand-ink)]">{game.name}</h2>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">{game.offers} tracked offer rows</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-secondary)]">
                Best payout: <span className="text-[var(--brand-ink)]">{formatMoney(game.bestPayoutUsd)}</span>
              </p>
            </Link>
          ))}
        </section>
      </Container>
    </main>
  );
}
