import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, Search, SlidersHorizontal } from "lucide-react";
import Container from "@/components/layout/Container";
import { RevenuePageView } from "@/components/analytics/RevenueEventTracker";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import Card from "@/components/ui/Card";
import RatingPill from "@/components/ui/RatingPill";
import { buildBreadcrumbList, buildItemList, JsonLd } from "@/lib/seo-schema";
import { getBestPageData, getBestPageMetadata } from "../_lib/best-pages";
import { GPT_AFFILIATE_PLATFORMS, buildTrackedPlatformHref } from "@/lib/gpt-affiliate-platforms";
import { GPT_SITE_GUIDES } from "@/lib/gpt-site-guides";
import { getSiteUrl } from "@/lib/site-url";
import { STATIC_GUIDES } from "@/lib/static-guides";

export const revalidate = 3600;

const config = {
  pathname: "/best-gpt-sites",
  title: "Compare the Best GPT Sites",
  description: "Compare GPT sites by live payouts, trust signals, and current offer value so you can choose the best place to start.",
  intro:
    "Compare GPT sites by current payout strength, review coverage, and live offer value. Use this page to decide which platforms are worth joining before you start an offer.",
};

export const metadata: Metadata = getBestPageMetadata(config);

type PlatformCard = (typeof GPT_AFFILIATE_PLATFORMS)[number];
type GptGuide = (typeof GPT_SITE_GUIDES)[number];

function PlatformTrackedLink({
  platform,
  location,
  className,
  children,
}: {
  platform: PlatformCard;
  location: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <TrackedOutboundLink
      href={buildTrackedPlatformHref(platform, location)}
      eventLabel={`best_gpt_sites_${platform.slug}_${location}`}
      platformName={platform.name}
      location={location}
      sourceContext="best_gpt_sites_monetization"
      target="_self"
      className={className}
    >
      {children}
    </TrackedOutboundLink>
  );
}

interface ReviewPlatform {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  platform_kind: string;
}

interface ReviewSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  rating_overall: number | null;
  rating_payout: number | null;
  rating_ux: number | null;
  rating_trust: number | null;
  platforms: ReviewPlatform | null;
}

const BASE_URL = getSiteUrl();

const anchorLinks = [
  { href: "#best-sites", label: "Best Sites" },
  { href: "#platform-reviews", label: "Reviews" },
  { href: "#site-guides", label: "Site Guides" },
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

function getPublishedPlatformGuide(platform: PlatformCard, guides: GptGuide[]) {
  return guides.find((guide) => guide.platformSlug === platform.slug || guide.slug === platform.slug) ?? null;
}

function getPlatformImage(platform: PlatformCard) {
  return getPlatformGuide(platform)?.screenshot ?? `/images/guides/gpt-sites/${platform.slug}.png`;
}

async function getReviews(): Promise<ReviewSummary[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/reviews`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

function ratingLabel(review: ReviewSummary) {
  if ((review.rating_trust ?? 0) >= 4) return "Strong trust signal";
  if ((review.rating_payout ?? 0) >= 4) return "Strong payout signal";
  return "Read review before starting";
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

function ReferralCtaRail({ platforms }: { platforms: PlatformCard[] }) {
  if (platforms.length === 0) return null;

  return (
    <div className="mt-5 grid gap-2 sm:grid-cols-3">
      {platforms.slice(0, 3).map((platform) => (
        <PlatformTrackedLink
          key={platform.id}
          platform={platform}
          location="best_gpt_sites_hero_referral_rail"
          className="group flex min-h-[86px] flex-col justify-between rounded-xl border border-lime-200 bg-lime-50 px-4 py-3 text-left transition hover:-translate-y-px hover:border-lime-400 hover:bg-lime-100"
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-lime-800">
            Tracked referral
          </span>
          <span className="mt-1 flex items-center justify-between gap-3 text-sm font-extrabold text-[var(--brand-ink)]">
            {platform.cta}
            <ArrowRight className="h-4 w-4 flex-none transition group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
          <span className="mt-1 text-xs font-semibold leading-relaxed text-[var(--text-secondary)]">
            {platform.bestFor}
          </span>
        </PlatformTrackedLink>
      ))}
    </div>
  );
}

function StickyReferralBar({ platform }: { platform: PlatformCard | null }) {
  if (!platform) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-lime-200 bg-white/95 px-4 py-3 shadow-[0_-8px_28px_rgba(15,23,42,0.08)] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-lime-700">Ready to start?</p>
          <p className="truncate text-sm font-extrabold text-[var(--brand-ink)]">
            Join {platform.name} with EarnGrind tracking
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-none">
          <Link
            href="#best-sites"
            className="inline-flex items-center justify-center rounded-xl border border-[var(--border-default)] bg-white px-3 py-2 text-xs font-extrabold text-[var(--brand-ink)] transition hover:border-lime-300"
          >
            Compare first
          </Link>
          <PlatformTrackedLink
            platform={platform}
            location="best_gpt_sites_sticky_signup"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-ink)] px-3 py-2 text-xs font-extrabold text-[var(--brand-lime)] transition hover:-translate-y-px"
          >
            {platform.cta}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </PlatformTrackedLink>
        </div>
      </div>
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
        <PlatformTrackedLink
          platform={platform}
          location={featured ? "best_gpt_sites_primary_card" : "best_gpt_sites_secondary_card"}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-ink)] px-4 py-3 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
        >
          {platform.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </PlatformTrackedLink>
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

function PlatformReviewCard({ review }: { review: ReviewSummary }) {
  const platform = review.platforms;

  return (
    <Card className="flex flex-col gap-4 transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {platform?.logo_url ? (
            <Image
              src={platform.logo_url}
              alt={platform.name}
              width={36}
              height={36}
              className="h-9 w-9 flex-shrink-0 rounded-lg border border-[var(--border-default)] object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)]">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)]">
                {platform?.name.substring(0, 2) ?? "PR"}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <h3 className="truncate font-extrabold text-[var(--brand-ink)]">
              {platform?.name ?? review.title}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Platform review
            </p>
          </div>
        </div>
        {review.rating_overall != null ? <RatingPill rating={review.rating_overall} /> : null}
      </div>

      <div className="flex-1">
        <p className="text-sm font-bold text-[var(--brand-ink)]">{ratingLabel(review)}</p>
        {review.excerpt ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            {review.excerpt}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-2 border-y border-[var(--border-default)] py-3 text-center text-xs">
        <div>
          <p className="font-bold text-[var(--brand-ink)]">{review.rating_payout?.toFixed(1) ?? "?"}</p>
          <p className="text-[var(--text-tertiary)]">Payout</p>
        </div>
        <div>
          <p className="font-bold text-[var(--brand-ink)]">{review.rating_ux?.toFixed(1) ?? "?"}</p>
          <p className="text-[var(--text-tertiary)]">UX</p>
        </div>
        <div>
          <p className="font-bold text-[var(--brand-ink)]">{review.rating_trust?.toFixed(1) ?? "?"}</p>
          <p className="text-[var(--text-tertiary)]">Trust</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href={`/review/${review.slug}`} className="font-bold text-lime-600 hover:text-lime-700">
          Read full review
        </Link>
        {platform ? (
          <Link href={`/offers?q=${encodeURIComponent(platform.name)}`} className="font-semibold text-[var(--text-secondary)] hover:text-[var(--brand-ink)]">
            View offers
          </Link>
        ) : null}
      </div>
    </Card>
  );
}

function StaticPlatformReviewCard({ guide }: { guide: (typeof STATIC_GUIDES)[number] }) {
  return (
    <Card className="flex flex-col gap-4 transition-transform hover:-translate-y-0.5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Platform review</p>
        <h3 className="mt-1 font-extrabold text-[var(--brand-ink)]">{guide.title}</h3>
      </div>
      <p className="flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">{guide.description}</p>
      <Link href={guide.href} className="font-bold text-lime-600 hover:text-lime-700">
        {guide.ctaLabel}
      </Link>
    </Card>
  );
}

function ComparisonTable({ platforms, guides }: { platforms: PlatformCard[]; guides: GptGuide[] }) {
  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
      <SectionHeader
        eyebrow="Quick comparison"
        title="Best GPT sites quick comparison"
        copy="Compare the core site fit before you jump into live offers. Cashout details and reward options can change, so verify the current terms on each platform before starting."
      />
      <div className="overflow-x-auto rounded-xl border border-[var(--border-default)]">
        <table className="min-w-[980px] w-full border-collapse bg-white text-left text-sm">
          <thead className="bg-[var(--surface-muted)] text-xs font-extrabold uppercase tracking-wide text-[var(--text-tertiary)]">
            <tr>
              <th className="px-4 py-3">Site</th>
              <th className="px-4 py-3">Best for</th>
              <th className="px-4 py-3">Cashout / payout style</th>
              <th className="px-4 py-3">Rewards</th>
              <th className="px-4 py-3">Good fit</th>
              <th className="px-4 py-3">Start</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-default)]">
            {platforms.map((platform) => {
              const guide = getPublishedPlatformGuide(platform, guides);
              const cashout = guide ? `${guide.minimumCashout} / ${guide.payoutStyle}` : platform.rewardNote;
              const rewards = guide?.rewardOptions ?? platform.rewardNote;
              const fit = guide?.accountFit ?? platform.trustNote;

              return (
                <tr key={platform.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="font-extrabold text-[var(--brand-ink)]">{platform.name}</div>
                    <div className="mt-1 text-xs font-bold text-lime-700">{platformLabels[platform.slug] ?? platform.bestFor}</div>
                  </td>
                  <td className="px-4 py-4 text-[var(--text-secondary)]">{guide?.bestFor ?? platform.bestFor}</td>
                  <td className="px-4 py-4 text-[var(--text-secondary)]">{cashout}</td>
                  <td className="px-4 py-4 text-[var(--text-secondary)]">{rewards}</td>
                  <td className="px-4 py-4 text-[var(--text-secondary)]">{fit}</td>
                  <td className="px-4 py-4">
                    <PlatformTrackedLink
                      platform={platform}
                      location="best_gpt_sites_comparison_table"
                      className="inline-flex whitespace-nowrap rounded-xl bg-[var(--brand-ink)] px-3 py-2 text-xs font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
                    >
                      {platform.cta}
                    </PlatformTrackedLink>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function BestGptSitesPage() {
  const [{ rows }, reviews] = await Promise.all([
    getBestPageData(config),
    getReviews(),
  ]);
  const primaryPlatforms = GPT_AFFILIATE_PLATFORMS.filter((platform) => platform.priority === "primary");
  const secondaryPlatforms = GPT_AFFILIATE_PLATFORMS.filter((platform) => platform.priority === "secondary");
  const recommendedPlatforms = [...primaryPlatforms, ...secondaryPlatforms];
  const publishedGuides = GPT_SITE_GUIDES.filter((guide) => guide.status !== "draft");
  const staticPlatformReviews = STATIC_GUIDES.filter((guide) => guide.contentType === "platform_review");
  const reviewCount = reviews.length + staticPlatformReviews.length;
  const topReviewed = [...reviews]
    .filter((review) => review.rating_overall != null)
    .sort((a, b) => (b.rating_overall ?? 0) - (a.rating_overall ?? 0))[0] ?? null;
  const heroPlatform = primaryPlatforms[0] ?? null;

  const schemas = [
    buildBreadcrumbList([
      { name: "Home", path: "/" },
      { name: "Best GPT Sites", path: config.pathname },
    ]),
    buildItemList(
      recommendedPlatforms.map((platform) => {
        const guide = getPublishedPlatformGuide(platform, publishedGuides);
        return {
          name: platform.name,
          path: guide ? `/guides/best-gpt-sites/${guide.slug}` : `${config.pathname}#best-sites`,
          description: `${platform.bestFor}. ${platform.rewardNote}`,
        };
      }),
    ),
  ];

  return (
    <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
      <RevenuePageView routePath="/best-gpt-sites" routeGroup="best_gpt_sites" sourceContext="best_gpt_sites" />
      <JsonLd data={schemas} />
      <StickyReferralBar platform={heroPlatform} />
      <Container className="space-y-8">
        <section className="overflow-hidden border border-slate-700 bg-[var(--brand-ink)] p-6 text-white shadow-[var(--shadow-card)]">
          <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm font-semibold text-white/55" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[var(--brand-lime)]">Home</Link>
            <span>/</span>
            <span className="text-white">Best GPT Sites</span>
          </nav>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--brand-lime)]">Platform comparison</p>
              <h1 className="mt-2 max-w-4xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Compare the best GPT sites before you join
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/72">
                EarnGrind compares payout quality, trust signals, live offer inventory, and redemption fit so you can pick a GPT site before committing time to a task.
              </p>
              <ReferralCtaRail platforms={primaryPlatforms} />
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/offers"
                  className="inline-flex items-center justify-center gap-2 bg-[var(--brand-lime)] px-4 py-3 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:bg-[#9aeb42]"
                >
                  Find GPT offers <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/guides/best-gpt-sites"
                  className="inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 px-4 py-3 text-sm font-extrabold text-white transition-all hover:-translate-y-px hover:border-white/45"
                >
                  Read site guides
                </Link>
                {heroPlatform ? (
                  <PlatformTrackedLink
                    platform={heroPlatform}
                    location="best_gpt_sites_hero_primary"
                    className="inline-flex items-center justify-center gap-2 border border-[var(--brand-lime)]/35 bg-[var(--brand-lime)]/10 px-4 py-3 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
                  >
                    Start with {heroPlatform.name}
                  </PlatformTrackedLink>
                ) : null}
              </div>
            </div>
            <TrustBox />
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <StatCard
              label="Best beginner pick"
              value={heroPlatform?.name ?? "Review first"}
              detail="A simple cash-first starting point before comparing higher-upside live routes."
            />
            <StatCard
              label="Total live offers"
              value={String(rows.length)}
              detail="Dynamic offers can vary by provider, country, account, and device."
            />
            <StatCard
              label="Reviewed platforms"
              value={String(Math.max(reviewCount, recommendedPlatforms.length))}
              detail={topReviewed?.platforms?.name ? `Top reviewed: ${topReviewed.platforms.name}.` : "Curated GPT platforms with guide, trust, and payout context."}
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

        <ComparisonTable platforms={recommendedPlatforms} guides={publishedGuides} />

        <section id="best-sites" className="space-y-5 scroll-mt-24">
          <SectionHeader
            eyebrow="Start here"
            title="Recommended GPT sites"
            copy="These tracked outbound links may earn EarnGrind a commission. Use them after checking payout freshness, country eligibility, and reward fit."
            action={
              <Link href="#platform-reviews" className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] hover:border-lime-400">
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

        <section id="platform-reviews" className="space-y-5 scroll-mt-24">
          <SectionHeader
            eyebrow="Platform reviews"
            title="Individual GPT site ratings and trust summaries"
            copy="Use these cards when you want a review-level look at payout quality, UX, and trust before choosing a recommended GPT site or live offer route."
          />
          {reviewCount === 0 ? (
            <div className="rounded-2xl border border-[var(--border-default)] bg-white p-12 text-center shadow-[var(--shadow-card)] sm:p-16">
              <h2 className="mb-2 text-lg font-bold text-[var(--brand-ink)]">No platform reviews yet</h2>
              <p className="text-[var(--text-tertiary)]">Check back soon. Platform reviews are added as they are published.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {staticPlatformReviews.map((guide) => (
                <StaticPlatformReviewCard key={guide.slug} guide={guide} />
              ))}
              {reviews.map((review) => (
                <PlatformReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
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

        <section className="space-y-4">
          <SectionHeader
            eyebrow="More routes"
            title="Keep comparing high-intent offer pages"
            copy="Use these focused pages when you want to compare live payout routes before joining a platform or starting a game offer."
          />
          <div className="flex flex-wrap gap-2 text-sm">
            <Link className="rounded-lg border border-[var(--border-default)] bg-white px-3 py-1.5 font-bold text-[var(--brand-ink)] hover:border-lime-300 hover:bg-lime-50" href="/best-freecash-games">Best Freecash Games</Link>
            <Link className="rounded-lg border border-[var(--border-default)] bg-white px-3 py-1.5 font-bold text-[var(--brand-ink)] hover:border-lime-300 hover:bg-lime-50" href="/best-gain-gg-offers">Best Gain.gg Offers</Link>
            <Link className="rounded-lg border border-[var(--border-default)] bg-white px-3 py-1.5 font-bold text-[var(--brand-ink)] hover:border-lime-300 hover:bg-lime-50" href="/highest-paying-gpt-games">Highest Paying GPT Games</Link>
            <Link className="rounded-lg border border-[var(--border-default)] bg-white px-3 py-1.5 font-bold text-[var(--brand-ink)] hover:border-lime-300 hover:bg-lime-50" href="/offers">All Live Offers</Link>
          </div>
        </section>

      </Container>
    </main>
  );
}
