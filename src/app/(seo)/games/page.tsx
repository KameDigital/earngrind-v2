import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import GamesIndexClient from "@/app/(seo)/games/GamesIndexClient";
import { getGamesIndexData } from "@/lib/games-index-data";
import { canonicalAlternates } from "@/lib/seo-metadata";
import { buildBreadcrumbList, buildCollectionPage, buildItemList, JsonLd } from "@/lib/seo-schema";

export const revalidate = 300;

const title = "GPT Game Hubs and Offer Guides";
const description =
  "Browse EarnGrind game hubs with payout snapshots, provider coverage, completion guide availability, and routes into full offer comparisons.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonicalAlternates("/games"),
  openGraph: {
    title,
    description,
    url: "https://earngrind.com/games",
    siteName: "EarnGrind",
    images: [{ url: "/og-earngrind.png", width: 1200, height: 630, alt: "EarnGrind game hubs and offer guides" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-earngrind.png"],
  },
};

export default async function GamesIndexPage() {
  const gamesIndex = await getGamesIndexData();
  const itemList = buildItemList(
    gamesIndex.games.slice(0, 20).map((game) => ({
      name: game.name,
      path: `/games/${game.slug}`,
      description: `${game.offerCount} tracked offers with a top payout of $${game.topPayout.toFixed(2)}.`,
    })),
  );
  const schemas = [
    buildCollectionPage({
      name: title,
      path: "/games",
      description,
      mainEntity: itemList,
    }),
    buildBreadcrumbList([
      { name: "Home", path: "/" },
      { name: "Games", path: "/games" },
    ]),
  ];

  return (
    <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
      <JsonLd data={schemas} />
      <Container className="space-y-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--text-tertiary)]">
          <Link href="/" className="hover:text-lime-700">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--brand-ink)]">Games</span>
        </nav>
        <header className="max-w-3xl">
          <p className="section-label mb-2">Games</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
            GPT game hubs and offer guides
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">
            Start with a game hub when you want payout snapshots, guide coverage, and provider breadth before opening the full comparison route.
          </p>
        </header>
        <GamesIndexClient
          games={gamesIndex.games}
          summary={gamesIndex.summary}
          variant="embedded"
          sectionId="games-list"
        />
      </Container>
    </main>
  );
}
