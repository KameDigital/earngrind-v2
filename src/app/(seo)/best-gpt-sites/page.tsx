import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, BookOpen, CheckCircle2, Search, ShieldCheck, SlidersHorizontal, Trophy } from "lucide-react";
import Container from "@/components/layout/Container";
import { createClient } from "@/lib/supabase/server";
import { buildBreadcrumbList, buildItemList, JsonLd } from "@/lib/seo-schema";
import FAQSection from "../components/FAQSection";
import OfferTable from "../components/OfferTable";
import ProviderComparison from "../components/ProviderComparison";
import { formatMoney } from "../_lib/seo-data";
import { getBestPageData, getBestPageMetadata } from "../_lib/best-pages";
import { GPT_AFFILIATE_PLATFORMS, buildTrackedPlatformHref } from "@/lib/gpt-affiliate-platforms";
import { GPT_SITE_GUIDES } from "@/lib/gpt-site-guides";

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

type PlatformCard = (typeof GPT_AFFILIATE_PLATFORMS)[number];
type GptGuide = (typeof GPT_SITE_GUIDES)[number];

const anchorLinks = [
  { href: "#best-sites", label: "Best Sites" },
  { href: "#site-guides", label: "Site Guides" },
  { href: "#live-payouts", label: "Live Offers" },
  { href: "#provider-comparison", label: "Provider Comparison" },
  { href: "#faq", label: "FAQ" },
];

const platformLabels: Record<string, string> = {
  kashkick: "Beginner friendly",
  swagbucks: "Best overall",
  inboxdollars: "Cash rewards",
  mypoints: "Shopping rewards",
  prizerebel: "Survey backup",
  scrambly: "App discovery",
  "gain-gg": "High payout potential",
  gemsloot: "Gaming offers",
  earnlab: "Gamified GPT",
};

function getPlatformGuide(platform: PlatformCard) {
  return GPT_SITE_GUIDES.find((guide) => guide.platformSlug === platform.slug || guide.slug === platform.slug) ?? null;
}

function getPlatformImage(platform: PlatformCard) {
  return getPlatformGuide(platform)?.screenshot ?? `/images/guides/gpt-sites/${platform.slug}.png`;
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-[var(--brand-ink)]">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{detail}</p>
    </div>
  );
}

function TrustBox() {
  const items = [
    [Search, "Research-backed", "Platform notes, guides, and review context in one place."],
    [BadgeDollarSign, "Payout-aware", "Live route data keeps payout strength visible before you join."],
    [SlidersHorizontal, "Offer-driven", "Filters and provider sections help you move from ranking to action."],
  ] as const;

  return (
    <div className="grid gap-3 rounded-xl border border-lime-200 bg-lime-50 p-4">
      {items.map(([Icon, title, copy]) => (
        <div key={title} className="flex gap-3">
          <Icon className="mt-0.5 h-5 w-5 flex-none text-lime-700" aria-hidden="true" />
          <div>
            <p className="font-extrabold text-[var(--brand-ink)]">{title}</p>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{copy}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="section-label">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--brand-ink)]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">{copy}</p>
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}

function PlatformImage({ platform, priority = false }: { platform: PlatformCard; priority?: boolean }) {
  const image = getPlatformImage(platform);

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)]">
      <Image
        src={image}
        alt={`${platform.name} GPT site preview`}
        fill
        priority={priority}
        sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
        <p className="text-sm font-extrabold text-white">{platform.name}</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
          {platformLabels[platform.slug] ?? platform.bestFor}
        </p>
      </div>
    </div>
  );
}

function RecommendedPlatformCard({
  platform,
  featured = false,
  priority = false,
}: {
  platform: PlatformCard;
  featured?: boolean;
  priority?: boolean;
}) {
  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 ${
        featured ? "border-lime-300 ring-1 ring-lime-100" : "border-[var(--border-default)] hover:border-lime-300"
      }`}
    >
      <PlatformImage platform={platform} priority={priority} />
      <div className="flex flex-1 flex-col pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-lime-200 bg-lime-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-lime-800">
            {platformLabels[platform.slug] ?? platform.bestFor}
          </span>
          {featured ? (
            <span className="rounded-full bg-[var(--brand-ink)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[var(--brand-lime)]">
              Top pick
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-xl font-extrabold text-[var(--brand-ink)]">{platform.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{platform.rewardNote}</p>
        <p className="mt-2 text-xs font-semibold leading-relaxed text-[var(--text-tertiary)]">{platform.trustNote}</p>
        {platform.disclosure ? <p className="mt-2 text-xs font-bold text-lime-700">{platform.disclosure}</p> : null}
        <Link
          href={buildTrackedPlatformHref(platform, featured ? "best_gpt_sites_primary_card" : "best_gpt_sites_secondary_card")}
          prefetch={false}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-ink)] px-4 py-3 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
        >
          {platform.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function GptGuideCard({ guide }: { guide: GptGuide }) {
  return (
    <Link
      href={`/guides/best-gpt-sites/${guide.slug}`}
      className="group overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-lime-300"
    >
      <div className="relative aspect-[16/10] bg-[var(--surface-muted)]">
        <Image
          src={guide.screenshot}
          alt={`${guide.name} website screenshot`}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <p className="text-xs font-extrabold uppercase tracking-wide text-lime-700">{guide.bestFor}</p>
        <h3 className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">{guide.name} Guide</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">{guide.description}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--brand-ink)]">
          Read guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

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
  const recommendedPlatforms = [...primaryPlatforms, ...secondaryPlatforms];
  const publishedGuides = GPT_SITE_GUIDES.filter((guide) => guide.status !== "draft");
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
      <Container className="space-y-8">
        <section className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)]">
          <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--text-tertiary)]" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[var(--brand-ink)]">Home</Link>
            <span>/</span>
            <span className="text-[var(--brand-ink)]">Best GPT Sites</span>
          </nav>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="section-label">Best GPT Sites</p>
              <h1 className="mt-2 max-w-4xl text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
                Compare the best GPT sites before you join
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">
                EarnGrind compares payout quality, trust signals, live offer inventory, and redemption fit so you can pick a GPT site before committing time to a task.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="#live-payouts"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-ink)] px-4 py-3 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
                >
                  Find GPT offers <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/guides/best-gpt-sites"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] bg-white px-4 py-3 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400"
                >
                  Read site guides
                </Link>
                {heroPlatform ? (
                  <Link
                    href={buildTrackedPlatformHref(heroPlatform, "best_gpt_sites_hero_primary")}
                    prefetch={false}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-lime-300 bg-lime-50 px-4 py-3 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px"
                  >
                    Start with {heroPlatform.name}
                  </Link>
                ) : null}
              </div>
            </div>
            <TrustBox />
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <StatCard
              label="Recommended top pick"
              value={heroPlatform?.name ?? "Review first"}
              detail={best ? `${best.providerName} currently leads visible route value below.` : "Use the cards below to choose a starting point."}
            />
            <StatCard
              label="Total live offers"
              value={String(rows.length)}
              detail="Dynamic offers can vary by provider, country, account, and device."
            />
            <StatCard
              label="Reviewed platforms"
              value={String(recommendedPlatforms.length)}
              detail="Curated GPT platforms with guide, trust, and payout context."
            />
            <StatCard
              label="Guides available"
              value={String(publishedGuides.length)}
              detail="Research-backed site guides with screenshots and strategy."
            />
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Best GPT sites page sections">
            {anchorLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-extrabold text-[var(--brand-ink)] hover:border-lime-300 hover:bg-lime-50"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <section id="best-sites" className="space-y-5 scroll-mt-24">
          <SectionHeader
            eyebrow="Start here"
            title="Recommended GPT sites"
            copy="These tracked outbound links may earn EarnGrind a commission. Use them after checking payout freshness, country eligibility, and reward fit."
            action={
              <Link href="/platforms" className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] hover:border-lime-400">
                Browse Platform Reviews
              </Link>
            }
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {primaryPlatforms.map((platform, index) => (
              <RecommendedPlatformCard key={platform.id} platform={platform} featured={index === 0} priority={index === 0} />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {secondaryPlatforms.map((platform) => (
              <RecommendedPlatformCard key={platform.id} platform={platform} />
            ))}
          </div>
        </section>

        <section id="site-guides" className="space-y-5 scroll-mt-24">
          <SectionHeader
            eyebrow="Research guides"
            title="Read the guide for each GPT site"
            copy="Each guide includes a browser screenshot, payout notes, source links, strategy, and tracking checks before you commit to a platform."
            action={
              <Link href="/guides/best-gpt-sites" className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] hover:border-lime-400">
                View all GPT guides
              </Link>
            }
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {publishedGuides.map((guide) => (
              <GptGuideCard key={guide.slug} guide={guide} />
            ))}
          </div>
        </section>

        {featuredReviews.length > 0 ? (
          <section className="space-y-4 rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
            <SectionHeader
              eyebrow="Trust context"
              title="Trusted platform reviews"
              copy="Read these first if you want trust and payout context before you choose which GPT site deserves your time."
            />
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
                  {review.excerpt ? <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{review.excerpt}</p> : null}
                  <Link href={`/review/${review.slug}`} className="mt-4 inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400">
                    Read Review
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section id="live-payouts" className="space-y-4 scroll-mt-24">
          <div className="rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-center">
              <div>
                <p className="section-label">Compare live payouts</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--brand-ink)]">Top GPT site routes and live offers</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
                  Offer values are dynamic and can vary by provider, country, device, account history, and task terms. Start with the strongest visible routes, then expand provider sections when you need more depth.
                </p>
              </div>
              <div className="grid gap-2 rounded-xl border border-lime-200 bg-lime-50 p-4 text-sm">
                <div className="flex items-center gap-2 font-extrabold text-[var(--brand-ink)]">
                  <Trophy className="h-4 w-4 text-lime-700" aria-hidden="true" />
                  Top offers stay visible first
                </div>
                <div className="flex items-center gap-2 font-extrabold text-[var(--brand-ink)]">
                  <CheckCircle2 className="h-4 w-4 text-lime-700" aria-hidden="true" />
                  Provider groups stay collapsible
                </div>
                <div className="flex items-center gap-2 font-extrabold text-[var(--brand-ink)]">
                  <ShieldCheck className="h-4 w-4 text-lime-700" aria-hidden="true" />
                  Tracking links are preserved
                </div>
              </div>
            </div>
          </div>
          <OfferTable rows={rows} title="Top GPT Site Routes" />
        </section>

        <section id="provider-comparison" className="space-y-4 scroll-mt-24">
          <div className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
            <SectionHeader
              eyebrow="Provider comparison"
              title="Compare the offer providers behind each route"
              copy="Use this snapshot to see which providers surface strong GPT payouts, then use the live route table above to choose your entry point."
            />
          </div>
          <ProviderComparison rows={providerRows} />
        </section>

        <section id="faq" className="scroll-mt-24">
          <FAQSection items={faqItems} />
        </section>

        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-start gap-3">
            <BookOpen className="mt-1 h-5 w-5 flex-none text-lime-700" aria-hidden="true" />
            <div>
              <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Keep exploring</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Use these pages if you want to go deeper into platform trust, live offers, or game-level payout decisions before you start.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/platforms">Platform Reviews</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/offers">All Offers</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/guides">Game Guides</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/highest-paying-gpt-games">Highest Paying GPT Games</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/best-money-making-games">Best Money-Making Games</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/best-freecash-games">Best Freecash Games</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/best-gain-gg-offers">Best Gain.gg Offers</Link>
          </div>
        </section>
      </Container>
    </main>
  );
}
