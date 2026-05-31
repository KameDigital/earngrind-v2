import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import { isPublicPayoutEligible } from "@/lib/offer-quality";
import {
  buildGameHubSeoDescription,
  buildGameHubSeoTitle,
  gameHubPath,
  offerRoutePath,
} from "@/lib/route-intent-policy";
import { buildBreadcrumbList, buildItemList, JsonLd } from "@/lib/seo-schema";
import FAQSection from "../../components/FAQSection";
import GameHeader from "../../components/GameHeader";
import OfferTable from "../../components/OfferTable";
import ProviderComparison from "../../components/ProviderComparison";
import {
  buildProviderComparison,
  buildSeoMetadata,
  formatMoney,
  getGameSeoData,
  getStaticGameSlugs,
  getTopOffers,
  mapComparisonToSeoRows,
} from "../../_lib/seo-data";

export const revalidate = 1800;

export async function generateStaticParams() {
  const slugs = await getStaticGameSlugs(160);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getGameSeoData(params.slug);
  if (!data) {
    return buildSeoMetadata({
      title: "Game Offers Not Found | EarnGrind",
      description: "The requested game page could not be found.",
      path: gameHubPath(params.slug),
      indexable: false,
    });
  }
  const rows = mapComparisonToSeoRows(data.comparison.offers, {
    name: data.game.name,
    slug: data.game.slug,
    thumbnailUrl: data.game.thumbnail_url,
  });
  const hasEligibleOffer = rows.some((row) => isPublicPayoutEligible(row.payoutUsd, row.totalPayoutUsd));
  const indexable =
    hasEligibleOffer ||
    data.guides.length > 0 ||
    (data.game.description?.trim().length ?? 0) >= 80;

  return buildSeoMetadata({
    title: buildGameHubSeoTitle(data.game.name),
    description: buildGameHubSeoDescription(data.game.name),
    path: gameHubPath(data.game.slug),
    indexable,
  });
}

export default async function SeoGamePage({ params }: { params: { slug: string } }) {
  const data = await getGameSeoData(params.slug);
  if (!data) notFound();

  const rows = mapComparisonToSeoRows(data.comparison.offers, {
    name: data.game.name,
    slug: data.game.slug,
    thumbnailUrl: data.game.thumbnail_url,
  }).sort((a, b) => b.payoutUsd - a.payoutUsd);

  const bestOffer = rows[0];
  const bestEligibleOffer = rows.find((row) => isPublicPayoutEligible(row.payoutUsd, row.totalPayoutUsd));
  const primaryGuide = data.guides[0] ?? null;
  const providerGroups = rows.reduce((acc, row) => {
    const key = row.providerName || "Unknown Provider";
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key)!.push(row);
    return acc;
  }, new Map<string, typeof rows>());
  const providerRows = buildProviderComparison(rows);

  const relatedSeed = await getTopOffers({
    q: data.game.category ?? data.game.name,
    perPage: 100,
  });
  const relatedGames = relatedSeed
    .filter((offer) => offer.game && offer.game.slug !== data.game.slug)
    .filter((offer) => {
      if (!data.game.category) return true;
      return offer.category?.toLowerCase() === data.game.category.toLowerCase();
    })
    .reduce<Array<{ slug: string; name: string }>>((acc, offer) => {
      const game = offer.game!;
      if (!acc.find((row) => row.slug === game.slug)) {
        acc.push({ slug: game.slug, name: game.name });
      }
      return acc;
    }, [])
    .slice(0, 8);

  const faqItems = [
    {
      question: `What is the highest payout for ${data.game.name}?`,
      answer: `The current highest tracked payout is ${formatMoney(bestOffer?.payoutUsd ?? 0)}. This value updates as providers change their offers.`,
    },
    {
      question: "How are providers ranked on this page?",
      answer: "Providers are ranked by normalized payout in USD, then by total payout when milestone ladders are available.",
    },
    {
      question: "Do all providers have the same task list?",
      answer: "No. Task milestones can differ by provider and platform. Always read the task list before starting.",
    },
  ];

  const intro = `Use this game hub to understand ${data.game.name}, check guide coverage, see the strongest payout snapshot, and move into the full route comparison when you are ready to compare every provider.`;
  const schemas = [
    buildBreadcrumbList([
      { name: "Home", path: "/" },
      { name: "Games", path: "/games" },
      { name: data.game.name, path: gameHubPath(data.game.slug) },
    ]),
    buildItemList(
      rows.slice(0, 20).map((row) => ({
        name: `${row.providerName} on ${row.platformName}`,
        path: offerRoutePath(data.game.slug),
        description: `${formatMoney(row.totalPayoutUsd)} total payout for ${data.game.name}.`,
      })),
    ),
  ];

  return (
    <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
      <JsonLd data={schemas} />
      <Container className="space-y-6">
        <GameHeader
          gameName={data.game.name}
          maxPayoutUsd={data.comparison.summary.best_total_payout_usd || data.summary.max_payout_usd || 0}
          intro={intro}
          offerCount={rows.length}
          providerCount={providerGroups.size}
          category={data.game.category}
          bestOffer={bestOffer ?? null}
        />

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div className="space-y-6">
            <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="section-label">Best route</p>
                  <h2 className="mt-2 text-xl font-extrabold text-[var(--brand-ink)]">
                    {bestOffer ? `${bestOffer.platformName} via ${bestOffer.providerName}` : "No active route"}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {bestOffer
                      ? `${formatMoney(bestOffer.totalPayoutUsd)} is the strongest visible route for ${data.game.name}.`
                      : "Check back later for tracked routes."}
                  </p>
                </div>
                <div>
                  <p className="section-label">Guide support</p>
                  <h2 className="mt-2 text-xl font-extrabold text-[var(--brand-ink)]">
                    {primaryGuide ? "Guide available" : "Guide coming soon"}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {primaryGuide
                      ? "Open the guide before starting if you want milestone order and completion tips."
                      : "Use the comparison table until a full guide is published."}
                  </p>
                </div>
                <div>
                  <p className="section-label">Compare first</p>
                  <h2 className="mt-2 text-xl font-extrabold text-[var(--brand-ink)]">
                    {rows.length} tracked route{rows.length !== 1 ? "s" : ""}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Sort by payout, route length, and provider before clicking out.
                  </p>
                </div>
              </div>
            </section>

            <section id="all-provider-offers" className="space-y-3">
              <div className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
                <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Compare all available routes</h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Use this table to check payout spread, provider context, and task ladders before choosing a route.
                </p>
              </div>
              <OfferTable rows={rows} showTasks compact showBestSummary={false} />
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20">
            <section className="rounded-2xl border border-lime-300 bg-lime-50 p-4 shadow-[var(--shadow-card)]">
              <p className="text-xs font-extrabold uppercase tracking-wide text-lime-800">Recommended action</p>
              <h2 className="mt-2 text-xl font-extrabold text-[var(--brand-ink)]">
                {bestOffer ? "Start the highest payout" : "Compare latest payouts"}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {bestOffer ? `${formatMoney(bestOffer.totalPayoutUsd)} on ${bestOffer.platformName}.` : "No tracked offer is available right now."}
              </p>
              {bestOffer ? (
                <TrackedOutboundLink
                  href={bestOffer.redirectUrl}
                  eventLabel="game-page-sticky-best-route"
                  offerId={bestOffer.id}
                  offerTitle={bestOffer.title}
                  gameTitle={data.game.name}
                  platformName={bestOffer.platformName}
                  providerName={bestOffer.providerName}
                  payoutUsd={bestOffer.totalPayoutUsd}
                  location="game-page-sticky-best-route"
                  sourceContext="game-page"
                  className="mt-4 inline-flex w-full justify-center rounded-xl bg-[var(--brand-ink)] px-4 py-3 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
                >
                  Start Highest Payout
                </TrackedOutboundLink>
              ) : (
                <Link
                  href="/offers"
                  className="mt-4 inline-flex w-full justify-center rounded-xl bg-[var(--brand-ink)] px-4 py-3 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
                >
                  Browse Offers
                </Link>
              )}
              <div className="mt-3 space-y-1 text-[11px] leading-relaxed text-[var(--text-tertiary)]">
                <p>Payouts can change by provider, country, and device.</p>
                <p>Some outbound links may be affiliate links.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border-default)] bg-white p-4 shadow-[var(--shadow-card)]">
              <p className="section-label">Next links</p>
              <div className="mt-3 grid gap-2">
                <Link
                  href={offerRoutePath(data.game.slug)}
                  className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-extrabold text-[var(--brand-ink)] hover:border-lime-400"
                >
                  Full route comparison
                </Link>
                <Link
                  href={primaryGuide ? `/guides/${primaryGuide.slug}` : "/guides"}
                  className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-extrabold text-[var(--brand-ink)] hover:border-lime-400"
                >
                  {primaryGuide ? "Open guide" : "Browse guides"}
                </Link>
                <Link
                  href={`/best-gpt-sites${bestOffer ? `?provider=${encodeURIComponent(bestOffer.providerName)}` : ""}`}
                  className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-extrabold text-[var(--brand-ink)] hover:border-lime-400"
                >
                  Check provider trust
                </Link>
              </div>
            </section>
          </aside>
        </section>

        <section className="space-y-3">
          <div className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Provider Snapshot</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Use this provider-level view to spot who is consistently paying more before you drop into the full route list.
            </p>
          </div>
          <ProviderComparison rows={providerRows} />
        </section>

        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Keep Exploring</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Use these links if you want a better payout route, a guide-first completion path, or more context before you commit to a provider.
          </p>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--brand-ink)]">Related Games</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {relatedGames.length === 0 ? <li className="text-[var(--text-tertiary)]">No related games found.</li> : null}
                {relatedGames.map((game) => (
                  <li key={game.slug}>
                    <Link className="text-[var(--text-secondary)] hover:text-lime-700 hover:underline" href={`/games/${game.slug}`}>
                      {game.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[var(--brand-ink)]">Related Guides</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {data.guides.length === 0 ? <li className="text-[var(--text-tertiary)]">No guides published yet.</li> : null}
                {data.guides.map((guide) => (
                  <li key={guide.id}>
                    <Link className="text-[var(--text-secondary)] hover:text-lime-700 hover:underline" href={`/guides/${guide.slug}`}>
                      {guide.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[var(--brand-ink)]">Other Providers</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {Array.from(providerGroups.keys()).slice(0, 8).map((provider) => (
                  <li key={provider}>
                    <Link
                      className="text-[var(--text-secondary)] hover:text-lime-700 hover:underline"
                      href={`/best-gpt-sites?provider=${encodeURIComponent(provider)}`}
                    >
                      {provider} offers
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {bestEligibleOffer ? (
          <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="section-label">Best available route</p>
                <h2 className="mt-2 text-xl font-extrabold text-[var(--brand-ink)]">
                  Start highest payout for {data.game.name}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {bestEligibleOffer.providerName} on {bestEligibleOffer.platformName} is currently showing {formatMoney(bestEligibleOffer.totalPayoutUsd)}.
                </p>
              </div>
              <TrackedOutboundLink
                href={bestEligibleOffer.redirectUrl}
                eventLabel="game-bottom-recap-cta"
                offerId={bestEligibleOffer.id}
                offerTitle={bestEligibleOffer.title}
                gameTitle={data.game.name}
                platformName={bestEligibleOffer.platformName}
                providerName={bestEligibleOffer.providerName}
                payoutUsd={bestEligibleOffer.totalPayoutUsd}
                location="game_bottom_recap"
                sourceContext="game_page"
                className="inline-flex rounded-xl bg-[var(--brand-ink)] px-4 py-2 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
              >
                Start highest payout
              </TrackedOutboundLink>
            </div>
          </section>
        ) : null}

        <FAQSection items={faqItems} />
      </Container>
    </main>
  );
}
