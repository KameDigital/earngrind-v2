import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { createClient } from "@/lib/supabase/server";
import { buildBreadcrumbList, buildItemList, JsonLd } from "@/lib/seo-schema";
import FAQSection from "../components/FAQSection";
import OfferTable from "../components/OfferTable";
import ProviderComparison from "../components/ProviderComparison";
import { formatMoney } from "../_lib/seo-data";
import { getBestPageData, getBestPageMetadata } from "../_lib/best-pages";
import { GPT_AFFILIATE_PLATFORMS, buildTrackedPlatformHref } from "@/lib/gpt-affiliate-platforms";

export const revalidate = 3600;

const config = {
  pathname: "/best-gpt-sites",
  title: "Compare the Best GPT Sites | EarnGrind",
  description: "Compare GPT sites by live payouts, trust signals, and current offer value so you can choose the best place to start.",
  intro:
    "Compare GPT sites by current payout strength, review coverage, and live offer value. Use this page to decide which platforms are worth joining before you start an offer.",
};

type ReviewSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  rating_overall: number | null;
  rating_payout: number | null;
  rating_trust: number | null;
  platforms: {
    name: string;
    slug: string;
  } | null;
};

type ReviewQueryRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  rating_overall: number | null;
  rating_payout: number | null;
  rating_trust: number | null;
  platforms: Array<{
    name: string;
    slug: string;
  }> | {
    name: string;
    slug: string;
  } | null;
};

export const metadata: Metadata = getBestPageMetadata(config);

async function getRelevantReviews(platformNames: string[]): Promise<ReviewSummary[]> {
  if (platformNames.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      slug,
      title,
      excerpt,
      rating_overall,
      rating_payout,
      rating_trust,
      platforms:platform_id ( name, slug )
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error || !data) return [];

  const platformSet = new Set(platformNames.map((name) => name.toLowerCase()));
  return (data as ReviewQueryRow[]).map((review) => {
    const platform = Array.isArray(review.platforms) ? review.platforms[0] ?? null : review.platforms;
    return {
      ...review,
      platforms: platform,
    };
  }).filter((review) => {
    const name = review.platforms?.name;
    return name ? platformSet.has(name.toLowerCase()) : false;
  });
}

export default async function BestGptSitesPage() {
  const { rows, providerRows } = await getBestPageData(config);
  const best = rows[0] ?? null;
  const reviews = await getRelevantReviews(Array.from(new Set(rows.map((row) => row.platformName).filter(Boolean))));
  const featuredReviews = reviews.slice(0, 3);
  const primaryPlatforms = GPT_AFFILIATE_PLATFORMS.filter((platform) => platform.priority === "primary");
  const secondaryPlatforms = GPT_AFFILIATE_PLATFORMS.filter((platform) => platform.priority === "secondary");
  const heroPlatform =
    primaryPlatforms.find((platform) => best?.platformName?.toLowerCase().includes(platform.name.toLowerCase())) ??
    primaryPlatforms[0] ??
    null;
  const bestReview = best
    ? reviews.find((review) => review.platforms?.name?.toLowerCase() === best.platformName.toLowerCase()) ?? null
    : null;

  const faqItems = [
    {
      question: "What makes a GPT site worth joining?",
      answer: "Start with payout strength, then check review coverage, trust signals, and whether the site consistently shows strong live offers for the games you want.",
    },
    {
      question: "Should I read a review before clicking into offers?",
      answer: "If you are new to a platform, yes. Reviews help you sanity-check payout quality, trust, and user experience before you commit time to that site.",
    },
    {
      question: "Does the best site stay the same?",
      answer: "No. Offer values move, so the best route can change. Use this page to compare current payout strength before you choose where to start.",
    },
  ];
  const schemas = [
    buildBreadcrumbList([
      { name: "Home", path: "/" },
      { name: "Best GPT Sites", path: config.pathname },
    ]),
    buildItemList(
      rows.slice(0, 20).map((row) => ({
        name: `${row.platformName} via ${row.providerName}`,
        path: `/offers/${row.gameSlug}`,
        description: `${formatMoney(row.totalPayoutUsd)} total payout route for ${row.gameName}.`,
      })),
    ),
  ];

  return (
    <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
      <JsonLd data={schemas} />
      <Container className="space-y-6">
        <header className="rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)]">
          <p className="section-label">Best GPT Sites</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--brand-ink)]">
            Compare the best GPT sites before you join
          </h1>
          <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">{config.intro}</p>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Best current site</p>
              <p className="mt-1 text-lg font-extrabold text-[var(--brand-ink)]">{best?.platformName ?? "No site yet"}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Top payout now</p>
              <p className="mt-1 text-lg font-extrabold text-[var(--brand-ink)]">{formatMoney(best?.payoutUsd ?? 0)}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Reviewed platforms</p>
              <p className="mt-1 text-lg font-extrabold text-[var(--brand-ink)]">{reviews.length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Offers compared</p>
              <p className="mt-1 text-lg font-extrabold text-[var(--brand-ink)]">{rows.length}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <article className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Choose where to start</p>
              <h2 className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">
                {best ? `${best.platformName} is leading right now` : "No leading site yet"}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {best
                  ? `${best.providerName} currently shows the strongest visible payout on ${best.platformName}. Start there if your goal is the highest route first.`
                  : "Check back later for live payout comparisons."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {heroPlatform ? (
                  <Link
                    href={buildTrackedPlatformHref(heroPlatform, "best_gpt_sites_hero_primary")}
                    prefetch={false}
                    className="inline-flex rounded-xl bg-[var(--brand-ink)] px-4 py-2 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
                  >
                    Start with the top GPT site
                  </Link>
                ) : null}
                <Link href="#best-site-offers" className="inline-flex rounded-xl bg-[var(--brand-ink)] px-4 py-2 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px">
                  Compare Live Offers
                </Link>
                <Link href="/guides/best-gpt-sites-to-make-money" className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400">
                  Read Full GPT Guide
                </Link>
                {bestReview ? (
                  <Link href={`/review/${bestReview.slug}`} className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400">
                    Read {best.platformName} Review
                  </Link>
                ) : null}
              </div>
            </article>

            <article className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Trust check</p>
              <h2 className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">Use review pages before you commit</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Reviews help you judge payout quality, trust, and user experience before you spend hours inside the wrong GPT site.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/reviews" className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400">
                  Browse Platform Reviews
                </Link>
                <Link href="/offers" className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400">
                  Browse All Offers
                </Link>
              </div>
            </article>

            <article className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Go deeper</p>
              <h2 className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">Use guides when you want the best route and the fastest finish</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                After you pick a site, use game guides to decide whether the payout is worth the effort and how to complete milestones with less waste.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/guides" className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400">
                  Explore Game Guides
                </Link>
                <Link href="/highest-paying-gpt-games" className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400">
                  See Top Games
                </Link>
              </div>
            </article>
          </div>
        </header>

        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-label">Start here</p>
              <h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-ink)]">Recommended GPT sites</h2>
              <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">
                These buttons use EarnGrind tracked outbound routes. We may earn a commission, but you should still verify payout freshness, device fit, and country eligibility before starting.
              </p>
            </div>
            <Link href="/guides/best-gpt-sites-to-make-money" className="inline-flex rounded-xl border border-[var(--border-default)] px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] hover:border-lime-400">
              Read comparison guide
            </Link>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {primaryPlatforms.map((platform) => (
              <article key={platform.id} className="rounded-xl border border-lime-200 bg-lime-50/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-lime-700">{platform.bestFor}</p>
                <h3 className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">{platform.name}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{platform.rewardNote}</p>
                <p className="mt-2 text-xs font-semibold text-[var(--text-tertiary)]">{platform.trustNote}</p>
                <Link
                  href={buildTrackedPlatformHref(platform, "best_gpt_sites_primary_card")}
                  prefetch={false}
                  className="mt-4 inline-flex rounded-xl bg-[var(--brand-ink)] px-4 py-2 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
                >
                  {platform.cta}
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {secondaryPlatforms.map((platform) => (
              <article key={platform.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{platform.bestFor}</p>
                <h3 className="mt-2 font-extrabold text-[var(--brand-ink)]">{platform.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">{platform.rewardNote}</p>
                {platform.disclosure ? <p className="mt-2 text-xs font-bold text-lime-700">{platform.disclosure}</p> : null}
                <Link
                  href={buildTrackedPlatformHref(platform, "best_gpt_sites_secondary_card")}
                  prefetch={false}
                  className="mt-3 inline-flex rounded-lg border border-[var(--border-default)] bg-white px-3 py-1.5 text-xs font-extrabold text-[var(--brand-ink)] hover:border-lime-400"
                >
                  {platform.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        {featuredReviews.length > 0 ? (
          <section className="space-y-3 rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
            <div>
              <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Trusted platform reviews</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Read these first if you want trust and payout context before you choose which GPT site deserves your time.
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {featuredReviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
                    {review.platforms?.name ?? "Platform"} review
                  </p>
                  <h3 className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">{review.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-tertiary)]">
                    {review.rating_overall != null ? <span>Overall {review.rating_overall.toFixed(1)}/5</span> : null}
                    {review.rating_payout != null ? <span>Payout {review.rating_payout.toFixed(1)}/5</span> : null}
                    {review.rating_trust != null ? <span>Trust {review.rating_trust.toFixed(1)}/5</span> : null}
                  </div>
                  {review.excerpt ? <p className="mt-2 text-sm text-[var(--text-secondary)]">{review.excerpt}</p> : null}
                  <Link href={`/review/${review.slug}`} className="mt-4 inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400">
                    Read Review
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section id="best-site-offers" className="space-y-3">
          <div className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Compare live payouts by GPT site</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Use this table to compare which GPT sites currently pay the most for strong game and offer routes. If a site looks promising, read its review before committing.
            </p>
          </div>
          <OfferTable rows={rows} title="Top GPT Site Routes" />
        </section>

        <section className="space-y-3">
          <div className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Provider comparison</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Compare which offer providers are surfacing the strongest site payouts right now, then use the route table above to choose your entry point.
            </p>
          </div>
          <ProviderComparison rows={providerRows} />
        </section>

        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Keep exploring</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Use these pages if you want to go deeper into platform trust, live offers, or game-level payout decisions before you start.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/reviews">Platform Reviews</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/offers">All Offers</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/guides">Game Guides</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/highest-paying-gpt-games">Highest Paying GPT Games</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/best-money-making-games">Best Money-Making Games</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/best-freecash-games">Best Freecash Games</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/best-gain-gg-offers">Best Gain.gg Offers</Link>
          </div>
        </section>

        <FAQSection items={faqItems} />
      </Container>
    </main>
  );
}
