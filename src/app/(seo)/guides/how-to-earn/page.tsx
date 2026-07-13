import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { buildSeoMetadata, formatMoney, getTopOffers } from "../../_lib/seo-data";
import { buildBreadcrumbList, buildCollectionPage, buildItemList, buildOrganization, JsonLd } from "@/lib/seo-schema";

export const revalidate = 3600;

export const metadata: Metadata = buildSeoMetadata({
  title: "How to Earn from Game Offers on GPT Sites",
  description: "Browse live game offer guides with payout ranges, milestone strategy, tracked offer counts, and comparison routes for GPT reward platforms.",
  path: "/guides/how-to-earn",
  type: "website",
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
  const itemList = buildItemList(games.slice(0, 24).map((game) => ({
    name: `${game.name} earning guide`,
    path: `/guides/how-to-earn/${game.slug}`,
    description: `${game.offers} tracked offer rows with best payout around ${formatMoney(game.bestPayoutUsd)}.`,
  })));
  const schemas = [
    buildOrganization("EarnGrind", "/"),
    buildBreadcrumbList([
      { name: "Home", path: "/" },
      { name: "Guides", path: "/guides" },
      { name: "How to Earn", path: "/guides/how-to-earn" },
    ]),
    itemList,
    buildCollectionPage({
      name: "How to Earn from Game Offers",
      path: "/guides/how-to-earn",
      description: "Live game offer guide collection for comparing payout ceilings, tracked routes, and milestone strategy before starting a GPT offer.",
      mainEntity: itemList,
    }),
  ];

  return (
    <main className="min-h-screen bg-[#e9efe8] pb-24">
      <JsonLd data={schemas} />
      <section className="eg-visual-frame px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="relative z-10 mx-auto max-w-[1440px]">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white/55">
            <Link href="/" className="hover:text-white">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/guides" className="hover:text-white">Guides</Link>
            <span aria-hidden="true">/</span>
            <span className="text-white">How to Earn</span>
          </nav>
          <header className="mt-10 max-w-5xl">
            <p className="eg-kicker mb-4">Game offer learning hub</p>
            <h1 className="text-5xl font-black leading-[0.92] tracking-[-0.07em] text-white sm:text-7xl">
              How to earn from game offers on GPT sites
            </h1>
            <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-white/68">
            Open a game guide to see payout breakdowns, milestone lists, tracked offer counts, and practical completion tips based on live offer data.
            </p>
          </header>
        </div>
      </section>

      <Container className="-mt-8 space-y-8">
        <section className="grid gap-4 text-sm leading-relaxed text-[var(--text-secondary)] md:grid-cols-3" aria-label="Game offer guide context">
          <div className="eg-market-card p-5">
            <h2 className="text-base font-extrabold text-[var(--brand-ink)]">What these guides are</h2>
            <p className="mt-2">
              These pages group live offer data by game so you can compare payout ceilings, available route count, and the likely task style before installing.
            </p>
          </div>
          <div className="eg-market-card p-5">
            <h2 className="text-base font-extrabold text-[var(--brand-ink)]">How payouts work</h2>
            <p className="mt-2">
              Rewards depend on the GPT site, offerwall, country, device, and milestone rules. Always start from the chosen platform and keep proof of install and task completion.
            </p>
          </div>
          <div className="eg-market-card p-5">
            <h2 className="text-base font-extrabold text-[var(--brand-ink)]">Which offers to compare first</h2>
            <p className="mt-2">
              Prioritize games with multiple tracked rows, early milestone rewards, clear deadlines, and a payout that still makes sense after expected time or optional spend.
            </p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Link
              key={game.slug}
              href={`/guides/how-to-earn/${game.slug}`}
              className="eg-market-card p-5 hover:border-lime-400 hover:bg-lime-50"
            >
              <h2 className="text-lg font-extrabold text-[var(--brand-ink)]">{game.name}</h2>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">{game.offers} tracked offer rows</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-secondary)]">
                Best payout: <span className="text-[var(--brand-ink)]">{formatMoney(game.bestPayoutUsd)}</span>
              </p>
            </Link>
          ))}
        </section>

        <section className="border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)]" aria-labelledby="how-to-earn-faq-heading">
          <h2 id="how-to-earn-faq-heading" className="text-2xl font-extrabold tracking-tight text-[var(--brand-ink)]">
            Game offer questions to answer before starting
          </h2>
          <div className="mt-5 grid gap-5 text-sm leading-relaxed text-[var(--text-secondary)] md:grid-cols-2">
            <div>
              <h3 className="font-extrabold text-[var(--brand-ink)]">How much does the offer pay?</h3>
              <p className="mt-2">Use the best-payout value as a starting point, then confirm the exact reward on the GPT site before installing.</p>
            </div>
            <div>
              <h3 className="font-extrabold text-[var(--brand-ink)]">Is it worth doing?</h3>
              <p className="mt-2">Compare reward size against task length, deadline pressure, purchase requirements, and the odds of tracking cleanly.</p>
            </div>
            <div>
              <h3 className="font-extrabold text-[var(--brand-ink)]">Can you finish without spending?</h3>
              <p className="mt-2">Look for early rewards, low-level targets, and guides that call out no-spend feasibility before committing to a long route.</p>
            </div>
            <div>
              <h3 className="font-extrabold text-[var(--brand-ink)]">What is the fastest strategy?</h3>
              <p className="mt-2">The fastest route is usually the one with clear milestones, focused resource use, and screenshots saved before every high-value claim.</p>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
