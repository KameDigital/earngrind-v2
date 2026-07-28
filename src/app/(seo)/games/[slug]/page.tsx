import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import { RevenuePageView } from "@/components/analytics/RevenueEventTracker";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import { getGameEditorialContent, type GameEditorialContent } from "@/lib/game-editorial-content";
import { isPublicPayoutEligible } from "@/lib/offer-quality";
import { getSiteUrl } from "@/lib/site-url";
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
import {
  buildSeoMetadata,
  formatMoney,
  getGameSeoData,
  getStaticGameSlugs,
  getTopOffers,
  mapComparisonToSeoRows,
} from "../../_lib/seo-data";

export const revalidate = 1800;

const SITE_URL = getSiteUrl().replace(/\/$/, "");
const MOCHI_FALL_GUIDE_PATH = "/guides/how-to-earn/mochi-fall-android";

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

function canonicalPathFromUrl(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  try {
    const url = new URL(value);
    return `${url.pathname}${url.search}`;
  } catch {
    return value.startsWith("/") ? value : fallback;
  }
}

function buildArticleJsonLd(content: GameEditorialContent) {
  const imageUrl = absoluteUrl(content.image ?? "/og-earngrind.png");

  return {
    "@context": "https://schema.org",
    "@type": content.schemaType || "Article",
    headline: content.title,
    description: content.description ?? content.metaDescription,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": content.canonical ?? absoluteUrl(gameHubPath(content.slug)),
    },
    author: {
      "@type": "Organization",
      name: "EarnGrind",
    },
    publisher: {
      "@type": "Organization",
      name: "EarnGrind",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.png"),
      },
    },
    datePublished: content.dateModified,
    dateModified: content.dateModified,
    image: [imageUrl],
    articleSection: "Game Offers",
    inLanguage: "en-US",
    keywords: [content.primaryKeyword, ...content.secondaryKeywords].filter(Boolean),
  };
}

export async function generateStaticParams() {
  const slugs = await getStaticGameSlugs(160);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getGameSeoData(params.slug);
  const editorialContent = await getGameEditorialContent(params.slug);
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

  const metadata = buildSeoMetadata({
    title: editorialContent?.seoTitle ?? buildGameHubSeoTitle(data.game.name),
    description: editorialContent?.metaDescription ?? buildGameHubSeoDescription(data.game.name),
    path: gameHubPath(data.game.slug),
    canonicalPath: canonicalPathFromUrl(editorialContent?.canonical, gameHubPath(data.game.slug)),
    imagePath: editorialContent?.image,
    indexable,
    type: editorialContent ? "article" : "website",
  });

  if (editorialContent?.seoTitle) {
    metadata.title = { absolute: editorialContent.seoTitle };
  }

  return metadata;
}

export default async function SeoGamePage({ params }: { params: { slug: string } }) {
  const data = await getGameSeoData(params.slug);
  if (!data) notFound();
  const editorialContent = await getGameEditorialContent(params.slug);

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
  const fallbackRelatedGames = [
    { name: "Highest-paying GPT games", href: "/highest-paying-gpt-games" },
    { name: "Best money-making games", href: "/best-money-making-games" },
    { name: "Best Freecash games", href: "/best-freecash-games" },
  ];
  const fallbackGuideLinks = [
    { name: "How-to-earn guide hub", href: "/guides/how-to-earn" },
    { name: "Game guide library", href: "/guides" },
    { name: "Best GPT site guides", href: "/guides/best-gpt-sites" },
  ];
  const relatedGameLinks =
    relatedGames.length > 0
      ? relatedGames.map((game) => ({ id: game.slug, name: game.name, href: `/games/${game.slug}` }))
      : fallbackRelatedGames.map((game) => ({ id: game.href, name: game.name, href: game.href }));
  const relatedGuideLinks =
    data.guides.length > 0
      ? data.guides.map((guide) => ({ id: guide.id, title: guide.title, href: `/guides/${guide.slug}` }))
      : fallbackGuideLinks.map((guide) => ({ id: guide.href, title: guide.name, href: guide.href }));
  const milestoneTasks = rows.flatMap((row) => row.tasks).slice(0, 6);

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
    ...(editorialContent ? [buildArticleJsonLd(editorialContent)] : []),
  ];

  return (
    <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
      <RevenuePageView
        routePath={gameHubPath(data.game.slug)}
        routeGroup="game"
        entityType="game"
        entityId={data.game.id}
        entitySlug={data.game.slug}
        gameId={data.game.id}
        gameSlug={data.game.slug}
        sourceContext="game_page"
      />
      <JsonLd data={schemas} />
      <Container className="space-y-6">
        <GameHeader
          heading={editorialContent?.title}
          gameName={data.game.name}
          maxPayoutUsd={data.comparison.summary.best_total_payout_usd || data.summary.max_payout_usd || 0}
          intro={editorialContent?.description ?? intro}
          offerCount={rows.length}
          providerCount={providerGroups.size}
          category={data.game.category}
          bestOffer={bestOffer ?? null}
        />

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div className="space-y-6">
            {editorialContent ? (
              <article className="rounded-none border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                {editorialContent.image ? (
                  <Image
                    src={editorialContent.image}
                    alt={editorialContent.imageAlt ?? editorialContent.title}
                    width={1400}
                    height={640}
                    className="mb-5 aspect-[16/7] w-full rounded-none border border-[var(--border-default)] object-cover"
                  />
                ) : null}
                <div
                  className="prose prose-slate max-w-none prose-headings:text-[var(--brand-ink)] prose-a:font-bold prose-a:text-lime-700 prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: editorialContent.html }}
                />
                <nav aria-label="Mochi Fall Android related links" className="mt-6 grid gap-2 border-t border-[var(--border-default)] pt-5 sm:grid-cols-2">
                  <Link className="rounded-none border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-bold text-[var(--brand-ink)] hover:border-lime-400" href="/offers/mochi-fall-android">
                    Compare Mochi Fall Android offers
                  </Link>
                  <Link className="rounded-none border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-bold text-[var(--brand-ink)] hover:border-lime-400" href={MOCHI_FALL_GUIDE_PATH}>
                    Read the Mochi Fall Android guide
                  </Link>
                  <Link className="rounded-none border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-bold text-[var(--brand-ink)] hover:border-lime-400" href="/best-gpt-sites">
                    Compare GPT platforms
                  </Link>
                  <Link className="rounded-none border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-bold text-[var(--brand-ink)] hover:border-lime-400" href="/highest-paying-gpt-games">
                    See highest-paying GPT games
                  </Link>
                  <Link className="rounded-none border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-bold text-[var(--brand-ink)] hover:border-lime-400" href="/offers">
                    Browse all offers
                  </Link>
                </nav>
              </article>
            ) : null}

            <section className="rounded-none border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
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
                    {primaryGuide || editorialContent ? "Guide available" : "Guide coming soon"}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {primaryGuide ? (
                      "Open the guide before starting if you want milestone order and completion tips."
                    ) : editorialContent ? (
                      <Link className="font-bold text-lime-700 underline" href={MOCHI_FALL_GUIDE_PATH}>
                        Read the step-by-step Mochi Fall Android guide before you start.
                      </Link>
                    ) : (
                      "Use the comparison table until a full guide is published."
                    )}
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

            <section className="rounded-none border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="section-label">Overview</p>
                  <h2 className="mt-2 text-xl font-extrabold text-[var(--brand-ink)]">{data.game.name} offer snapshot</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {data.game.description?.trim() || `${data.game.name} currently appears in EarnGrind payout data with ${rows.length} tracked route${rows.length === 1 ? "" : "s"} across ${providerGroups.size} provider${providerGroups.size === 1 ? "" : "s"}.`}
                  </p>
                </div>
                <div>
                  <p className="section-label">Best payout</p>
                  <h2 className="mt-2 text-xl font-extrabold text-[var(--brand-ink)]">
                    {bestOffer ? `${formatMoney(bestOffer.totalPayoutUsd)} total payout` : "Compare live payouts"}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {bestOffer
                      ? `${bestOffer.providerName} on ${bestOffer.platformName} is the current top visible route. Always verify the final payout and device rules on the provider page before starting.`
                      : "No eligible payout route is visible in the current feed, so use the broader offer hub to find active alternatives."}
                  </p>
                </div>
                <div>
                  <p className="section-label">Milestones</p>
                  <h2 className="mt-2 text-xl font-extrabold text-[var(--brand-ink)]">Task structure to check first</h2>
                  <ul className="mt-2 space-y-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {milestoneTasks.length > 0
                      ? milestoneTasks.map((task) => (
                          <li key={`${task.id}-${task.sort_order}`}>{task.title} {task.reward_display ? `- ${task.reward_display}` : ""}</li>
                        ))
                      : [
                          "Confirm install or signup tracking before pushing late milestones.",
                          "Screenshot payout, deadline, country, device, and task wording before starting.",
                          "Compare the full offer route when multiple providers list the same game.",
                        ].map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="section-label">Worth it</p>
                  <h2 className="mt-2 text-xl font-extrabold text-[var(--brand-ink)]">Use a stoplight decision</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    Green-light the route only if the early tasks track, the deadline fits your schedule, and any purchase requirement still leaves a payout margin. Slow down if the best route depends on late milestones or unclear provider wording.
                  </p>
                </div>
                <div>
                  <p className="section-label">Tracking tips</p>
                  <h2 className="mt-2 text-xl font-extrabold text-[var(--brand-ink)]">Protect the click path</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    Start from one tracked route, keep the same device, avoid VPN or account switching, and wait for early pending credit before spending meaningful time or money.
                  </p>
                </div>
                <div>
                  <p className="section-label">Crediting issues</p>
                  <h2 className="mt-2 text-xl font-extrabold text-[var(--brand-ink)]">Prepare support proof</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    If a milestone does not credit, gather screenshots of the offer terms, device, completion screen, account ID, and provider activity status before opening a support ticket.
                  </p>
                </div>
              </div>
            </section>

            <section id="all-provider-offers" className="space-y-3">
              <OfferTable rows={rows} title={`Compare ${data.game.name} routes`} showTasks compact showBestSummary={false} />
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20">
            <section className="rounded-none border border-lime-300 bg-lime-50 p-4 shadow-[var(--shadow-card)]">
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
                  className="mt-4 inline-flex w-full justify-center rounded-none bg-[var(--brand-ink)] px-4 py-3 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
                >
                  Start Highest Payout
                </TrackedOutboundLink>
              ) : (
                <Link
                  href="/offers"
                  className="mt-4 inline-flex w-full justify-center rounded-none bg-[var(--brand-ink)] px-4 py-3 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
                >
                  Browse Offers
                </Link>
              )}
              <div className="mt-3 space-y-1 text-[11px] leading-relaxed text-[var(--text-tertiary)]">
                <p>Payouts can change by provider, country, and device.</p>
                <p>Some outbound links may be affiliate links.</p>
              </div>
            </section>

            <section className="rounded-none border border-[var(--border-default)] bg-white p-4 shadow-[var(--shadow-card)]">
              <p className="section-label">Next links</p>
              <div className="mt-3 grid gap-2">
                <Link
                  href={offerRoutePath(data.game.slug)}
                  className="rounded-none border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-extrabold text-[var(--brand-ink)] hover:border-lime-400"
                >
                  Full route comparison
                </Link>
                <Link
                  href={primaryGuide ? `/guides/${primaryGuide.slug}` : editorialContent ? MOCHI_FALL_GUIDE_PATH : "/guides"}
                  className="rounded-none border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-extrabold text-[var(--brand-ink)] hover:border-lime-400"
                >
                  {primaryGuide || editorialContent ? "Open guide" : "Browse guides"}
                </Link>
                <Link
                  href={`/best-gpt-sites${bestOffer ? `?provider=${encodeURIComponent(bestOffer.providerName)}` : ""}`}
                  className="rounded-none border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-extrabold text-[var(--brand-ink)] hover:border-lime-400"
                >
                  Check provider trust
                </Link>
              </div>
            </section>
          </aside>
        </section>

        <section className="rounded-none border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Related links</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Use these links if you want a better payout route, a guide-first completion path, or more context before you commit to a provider.
          </p>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--brand-ink)]">Related Games</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {relatedGameLinks.map((game) => (
                  <li key={game.id}>
                    <Link className="text-[var(--text-secondary)] hover:text-lime-700 hover:underline" href={game.href}>
                      {game.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[var(--brand-ink)]">Related Guides</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {data.guides.length === 0 && editorialContent ? (
                  <li>
                    <Link className="text-[var(--text-secondary)] hover:text-lime-700 hover:underline" href={MOCHI_FALL_GUIDE_PATH}>
                      Mochi Fall Android guide
                    </Link>
                  </li>
                ) : null}
                {relatedGuideLinks.map((guide) => (
                  <li key={guide.id}>
                    <Link className="text-[var(--text-secondary)] hover:text-lime-700 hover:underline" href={guide.href}>
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
          <section className="rounded-none border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
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
                className="inline-flex rounded-none bg-[var(--brand-ink)] px-4 py-2 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
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
