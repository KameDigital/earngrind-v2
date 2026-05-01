import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
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
      path: `/games/${params.slug}`,
    });
  }
  const maxPayout = data.comparison.summary.best_total_payout_usd || data.summary.max_payout_usd || 0;
  return buildSeoMetadata({
    title: `Best ${data.game.name} Offers - Earn Up To ${formatMoney(maxPayout)}`,
    description: `Compare ${data.game.name} offers by provider, payout, and task milestones. Track top payout opportunities in one place.`,
    path: `/games/${params.slug}`,
  });
}

export default async function SeoGamePage({ params }: { params: { slug: string } }) {
  const data = await getGameSeoData(params.slug);
  if (!data) notFound();

  const rows = mapComparisonToSeoRows(data.comparison.offers, {
    name: data.game.name,
    slug: data.game.slug,
  }).sort((a, b) => b.payoutUsd - a.payoutUsd);

  const bestOffer = rows[0];
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

  const intro = `Use this page to compare ${data.game.name} payouts across ${providerGroups.size} providers, spot the best current route, and decide whether to use a guide before you click out.`;
  const schemas = [
    buildBreadcrumbList([
      { name: "Home", path: "/" },
      { name: "Games", path: "/games" },
      { name: data.game.name, path: `/games/${data.game.slug}` },
    ]),
    buildItemList(
      rows.slice(0, 20).map((row) => ({
        name: `${row.providerName} on ${row.platformName}`,
        path: `/offers/${data.game.slug}`,
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
        />

        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="section-label">Next Step</p>
              <h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-ink)]">Use this page as your route hub</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Check the strongest payout first, compare the rest of the route table, then use a guide if you want a faster completion path before starting the tracked offer.
              </p>
            </div>
            <div className="grid gap-2 text-xs text-[var(--text-tertiary)] sm:grid-cols-3 lg:w-[34rem]">
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
                <div className="font-bold uppercase tracking-wide text-[var(--brand-ink)]">Best route</div>
                <div className="mt-1 text-[var(--text-secondary)]">
                  {bestOffer ? `${bestOffer.providerName} on ${bestOffer.platformName}` : "No active route available"}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
                <div className="font-bold uppercase tracking-wide text-[var(--brand-ink)]">Guide support</div>
                <div className="mt-1 text-[var(--text-secondary)]">
                  {primaryGuide ? "Guide available before you start" : "No published guide yet"}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
                <div className="font-bold uppercase tracking-wide text-[var(--brand-ink)]">Compare next</div>
                <div className="mt-1 text-[var(--text-secondary)]">Review every route before clicking out</div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <article className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Best current route</p>
              <h3 className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">
                {bestOffer ? `${formatMoney(bestOffer.payoutUsd)} via ${bestOffer.providerName}` : "No active route"}
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {bestOffer
                  ? `${bestOffer.platformName} is the strongest tracked route right now. Start there if you want the highest visible payout first.`
                  : "Check back later for tracked routes."}
              </p>
              {bestOffer ? (
                <>
                  <TrackedOutboundLink
                    href={bestOffer.redirectUrl}
                    eventLabel="game-page-best-route"
                    offerId={bestOffer.id}
                    offerTitle={bestOffer.title}
                    gameTitle={data.game.name}
                    platformName={bestOffer.platformName}
                    providerName={bestOffer.providerName}
                    payoutUsd={bestOffer.payoutUsd}
                    location="game-page-best-route"
                    sourceContext="game-page"
                    className="mt-4 inline-flex rounded-xl bg-[var(--brand-ink)] px-4 py-2 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
                  >
                    Start Best Payout
                  </TrackedOutboundLink>
                  <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-tertiary)]">
                    Payouts can change by provider, country, and device. Some outbound links may be affiliate links.
                  </p>
                </>
              ) : null}
            </article>

            <article className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Guide first</p>
              <h3 className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">
                {primaryGuide ? primaryGuide.title : `No ${data.game.name} guide yet`}
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {primaryGuide
                  ? "Use the guide if you want milestone order, timing help, and fewer wasted clicks before you start an offer."
                  : "When a guide is available, it will show the fastest completion path and milestone order here."}
              </p>
              <Link
                href={primaryGuide ? `/guides/${primaryGuide.slug}` : "/guides"}
                className="mt-4 inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400"
              >
                {primaryGuide ? "Use Guide First" : "Check Guide Hub"}
              </Link>
            </article>

            <article className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Compare routes</p>
              <h3 className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">See every payout before you click out</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Review provider spreads, top payouts, and task ladders first if you want the strongest value instead of the first route you find.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="#all-provider-offers"
                  className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400"
                >
                  Compare All Routes
                </Link>
                <Link
                  href={`/best-gpt-sites${bestOffer ? `?provider=${encodeURIComponent(bestOffer.providerName)}` : ""}`}
                  className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400"
                >
                  Check Provider Trust
                </Link>
              </div>
            </article>
          </div>
        </section>

        {bestOffer ? (
          <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Best Offer Right Now</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {bestOffer.providerName} on {bestOffer.platformName} is currently leading with{" "}
              <span className="font-extrabold text-[var(--brand-ink)]">{formatMoney(bestOffer.payoutUsd)}</span>.
            </p>
            {bestOffer.tasks.length > 0 ? (
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                {bestOffer.tasks.slice(0, 5).map((task) => (
                  <li key={task.id}>
                    {task.title}
                    {task.reward_amount > 0 ? ` (${formatMoney(task.reward_amount)})` : ""}
                  </li>
                ))}
              </ol>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="#all-provider-offers"
                className="inline-flex rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400"
              >
                Compare Routes First
              </Link>
              {primaryGuide ? (
                <Link
                  href={`/guides/${primaryGuide.slug}`}
                  className="inline-flex rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400"
                >
                  Open Guide
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}

        <section id="all-provider-offers" className="space-y-3">
          <div className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Compare All Available Routes</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              This is the main comparison table for {data.game.name}. Use it to check payout spread, provider context, and task ladders before you pick the route worth starting.
            </p>
          </div>
          <OfferTable rows={rows} showTasks compact />
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

        <FAQSection items={faqItems} />
      </Container>
    </main>
  );
}
