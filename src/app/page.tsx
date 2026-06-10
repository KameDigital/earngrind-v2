import type { Metadata } from "next";
import Link from "next/link";
import EmailCapture from "@/components/EmailCapture";
import FeaturedOfferRail, {
  type FeaturedOfferRailItem,
} from "@/components/home/FeaturedOfferRail";
import HomepageSectionHeader from "@/components/home/HomepageSectionHeader";
import TabbedOfferRail, { type OfferRailTab } from "@/components/home/TabbedOfferRail";
import EarnLabActivityRail from "@/components/offers/EarnLabActivityRail";
import { buildGainOfferDeepLink } from "@/lib/gain-deeplinks";
import {
  buildGoHref,
  formatMoney,
  gameKeyFromParts,
  getHomepageData,
} from "@/lib/homepage-data";
import { formatDataRefreshedLabel } from "@/lib/payout-freshness";
import { JsonLd, buildWebsiteSearchAction } from "@/lib/seo-schema";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "EarnGrind | GPT Offer Discovery, Game Guides, and Platform Research",
  description:
    "Use EarnGrind to discover GPT offer paths, compare live payout routes on /offers, browse game hubs, read completion guides, and research trusted GPT sites.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title:
      "EarnGrind | GPT Offer Discovery, Game Guides, and Platform Research",
    description:
      "Use EarnGrind to discover GPT offer paths, compare live payout routes on /offers, browse game hubs, read completion guides, and research trusted GPT sites.",
    url: "https://earngrind.com",
    siteName: "EarnGrind",
    images: [
      {
        url: "/og-earngrind.png",
        width: 1200,
        height: 630,
        alt: "EarnGrind GPT offer discovery, game guides, and platform research",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "EarnGrind | GPT Offer Discovery, Game Guides, and Platform Research",
    description:
      "Use EarnGrind to discover GPT offer paths, compare live payout routes on /offers, browse game hubs, read completion guides, and research trusted GPT sites.",
    images: ["/og-earngrind.png"],
  },
};

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group eg-card overflow-hidden rounded-lg p-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 select-none [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-bold leading-snug text-[var(--brand-ink)] sm:text-base">
          {question}
        </span>
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)] text-xs font-bold text-[var(--text-tertiary)] transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="-mt-1 px-6 pb-5 text-sm leading-relaxed text-[var(--text-secondary)]">
        {answer}
      </div>
    </details>
  );
}

const START_HERE_ITEMS = [
  {
    name: "Compare Offers",
    href: "/offers",
    badge: "Canonical search",
    desc: "Search, filter, sort, and compare live payout routes when you already know you want the full offer database.",
  },
  {
    name: "Browse Games",
    href: "/offers#games",
    badge: "Game discovery",
    desc: "Start with game hubs when you want payout snapshots, guide coverage, provider count, and related games.",
  },
  {
    name: "Best GPT Sites",
    href: "/best-gpt-sites",
    badge: "Platform intel",
    desc: "See which GPT sites are trusted, competitive on payout, and worth joining before you commit your time.",
  },
  {
    name: "Game Guides",
    href: "/guides",
    badge: "Completion help",
    desc: "Use proven walkthroughs to finish milestones faster, avoid mistakes, and reach payout checkpoints sooner.",
  },
  {
    name: "Platform Reviews",
    href: "/best-gpt-sites#platform-reviews",
    badge: "Trust checks",
    desc: "Research individual GPT sites before you join, then move into offers with clearer expectations.",
  },
] as const;

const PARTNER_LOGOS = [
  {
    name: "Swagbucks",
    image: "/images/guides/gpt-sites/swagbucks.png",
  },
  {
    name: "Freecash",
    image: "/images/guides/gpt-sites/freecash.svg",
  },
  {
    name: "Gain.gg",
    image: "/images/guides/gpt-sites/gain-gg.png",
  },
  {
    name: "InboxDollars",
    image: "/images/guides/gpt-sites/inboxdollars.png",
  },
  {
    name: "EarnLab",
    image: "/images/guides/gpt-sites/earnlab.png",
  },
] as const;

type FeaturedPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
};

async function getFeaturedPost(): Promise<FeaturedPost | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.slug || !data.title) return null;
  return data as FeaturedPost;
}

function formatPostDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function HomePage() {
  const {
    cashInStyleFeaturedOffers,
    earnLabFeaturedOffers,
    gainFeaturedOffers,
    gemsLootFeaturedOffers,
    guideHrefByGameKey,
    modalRoutesByGameKey,
  } = await getHomepageData();
  const featuredPost = await getFeaturedPost();
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL?.trim() || null;
  const websiteJsonLd = buildWebsiteSearchAction();

  const guideHrefForGame = (
    slug: string | null | undefined,
    fallbackKey?: string,
  ) => {
    if (!slug)
      return fallbackKey ? (guideHrefByGameKey[fallbackKey] ?? null) : null;
    return (
      guideHrefByGameKey[slug] ??
      (modalRoutesByGameKey[slug]?.length
        ? `/guides/how-to-earn/${slug}`
        : null)
    );
  };

  const earnLabOfferRail: FeaturedOfferRailItem[] = earnLabFeaturedOffers.map(
    (offer) => ({
      id: `offer-${offer.id}`,
      href: offer.game_slug ? `/games/${offer.game_slug}` : "/offers",
      title: offer.title?.trim() || offer.game_name || "Offer",
      badge: offer.badge,
      provider: offer.platform_name,
      platform: offer.provider_name,
      payout: formatMoney(offer.total_payout_usd ?? offer.payout_usd) ?? null,
      dataRefreshed: formatDataRefreshedLabel(offer.updated_at, new Date()),
      secondaryValue: offer.goal_text ? offer.goal_text : null,
      imageUrl: offer.image_url,
      preview: {
        title: offer.title?.trim() || offer.game_name || "Offer",
        description: `Compare available routes for ${offer.game_name ?? offer.title ?? "this offer"} before choosing where to start.`,
        imageUrl: offer.image_url,
        gameHref: offer.game_slug ? `/games/${offer.game_slug}` : "/offers",
        guideHref: guideHrefForGame(
          offer.game_slug,
          gameKeyFromParts(offer.game_slug, offer.game_name),
        ),
        routes: modalRoutesByGameKey[
          gameKeyFromParts(offer.game_slug, offer.game_name)
        ] ?? [
          {
            offerId: offer.id,
            href: buildGoHref(offer, "homepage_modal_single_route"),
            providerName: offer.provider_name,
            platformName: offer.platform_name,
            payout: formatMoney(offer.total_payout_usd ?? offer.payout_usd),
            payoutValue: offer.total_payout_usd ?? offer.payout_usd,
            taskCount: offer.goal_text ? 1 : 0,
            tasks: offer.goal_text
              ? [
                  {
                    title: offer.goal_text,
                    rewardDisplay: formatMoney(
                      offer.total_payout_usd ?? offer.payout_usd,
                    ),
                  },
                ]
              : [],
          },
        ],
      },
    }),
  );

  const gemsLootFeaturedOfferRail: FeaturedOfferRailItem[] =
    gemsLootFeaturedOffers.map((offer) => {
      const hasTrackedRoute = !offer.id.startsWith("gemsloot-featured-");
      const offerHref = hasTrackedRoute
        ? buildGoHref(offer, "homepage_gemsloot_featured_offer")
        : offer.fallback_href;
      const payout = formatMoney(offer.total_payout_usd ?? offer.payout_usd);
      const gameKey = gameKeyFromParts(offer.game_slug, offer.game_name);
      const importedRoute = modalRoutesByGameKey[gameKey]?.find(
        (route) => route.offerId === offer.id,
      );
      const exactTasks = offer.tasks.length
        ? offer.tasks
        : importedRoute?.tasks ?? [];
      const previewRoute = importedRoute
        ? {
            ...importedRoute,
            href: offerHref,
            taskCount: exactTasks.length,
            tasks: exactTasks,
          }
        : {
            offerId: offer.id,
            href: offerHref,
            providerName: offer.provider_name,
            platformName: offer.platform_name,
            payout,
            payoutValue: offer.total_payout_usd ?? offer.payout_usd,
            taskCount: exactTasks.length || (offer.goal_text ? 1 : 0),
            tasks: exactTasks.length
              ? exactTasks
              : offer.goal_text
              ? [
                  {
                    title: offer.goal_text,
                    rewardDisplay: payout,
                  },
                ]
              : [],
          };

      return {
        id: `gemsloot-featured-${offer.requested_offer_name}`,
        href: offerHref,
        title: offer.title?.trim() || offer.game_name || "GemsLoot offer",
        badge: offer.badge,
        provider: offer.platform_name,
        platform: offer.provider_name,
        payout,
        dataRefreshed: formatDataRefreshedLabel(offer.updated_at, new Date()),
        secondaryValue: offer.goal_text ? offer.goal_text : null,
        imageUrl: offer.image_url,
        preview: {
          title: offer.title?.trim() || offer.game_name || "GemsLoot offer",
          description: `Open the GemsLoot offer detail for ${
            offer.game_name ?? offer.title ?? offer.requested_offer_name
          } and verify the live requirements before starting.`,
          imageUrl: offer.image_url,
          gameHref: offer.game_slug
            ? `/games/${offer.game_slug}`
            : "/offers/gemsloot/us",
          guideHref: guideHrefForGame(
            offer.game_slug,
            gameKeyFromParts(offer.game_slug, offer.game_name),
          ),
          routes: [previewRoute],
        },
      };
    });

  const gainOfferRail: FeaturedOfferRailItem[] = gainFeaturedOffers.map(
    (offer) => {
      const gainHref =
        offer.trackingUrl ?? buildGainOfferDeepLink(offer.id) ?? offer.startUrl;

      return {
        id: `gain-featured-${offer.wall}-${offer.id}`,
        href: gainHref,
        title: offer.title,
        badge: "Gain featured",
        provider: "Gain.gg",
        platform: offer.providerName,
        payout: formatMoney(offer.totalPayout ?? offer.payout) ?? null,
        dataRefreshed: formatDataRefreshedLabel(null, new Date()),
        secondaryValue:
          offer.tasks.length > 0
            ? `${offer.tasks.length} milestones available`
            : (offer.shortDescription ?? null),
        imageUrl: offer.imageUrl,
        preview: {
          title: offer.title,
          description:
            offer.shortDescription ??
            `Preview the featured Gain.gg route for ${offer.title} before opening the full wall.`,
          imageUrl: offer.imageUrl,
          gameHref: "/offers/gain/us/native",
          guideHref: null,
          routes: [
            {
              offerId: offer.id,
              href: gainHref,
              providerName: offer.providerName,
              platformName: "Gain.gg",
              payout: formatMoney(offer.totalPayout ?? offer.payout),
              payoutValue: offer.totalPayout ?? offer.payout,
              taskCount: offer.tasks.length,
              tasks: offer.tasks.slice(0, 6).map((task) => ({
                title: task.title,
                rewardDisplay: task.rewardDisplay,
              })),
            },
          ],
        },
      };
    },
  );

  const cashInStyleOfferRail: FeaturedOfferRailItem[] =
    cashInStyleFeaturedOffers.map((offer) => ({
      id: `cashinstyle-featured-${offer.id}`,
      href: offer.game_slug ? `/games/${offer.game_slug}` : "/offers",
      title: offer.title?.trim() || offer.game_name || "Offer",
      badge: offer.badge,
      provider: offer.platform_name,
      platform: offer.provider_name,
      payout: formatMoney(offer.total_payout_usd ?? offer.payout_usd) ?? null,
      dataRefreshed: formatDataRefreshedLabel(offer.updated_at, new Date()),
      secondaryValue: offer.goal_text ? offer.goal_text : null,
      imageUrl: offer.image_url,
      preview: {
        title: offer.title?.trim() || offer.game_name || "Offer",
        description: `Preview the CashInStyle route for ${
          offer.game_name ?? offer.title ?? "this offer"
        } before starting.`,
        imageUrl: offer.image_url,
        gameHref: offer.game_slug ? `/games/${offer.game_slug}` : "/offers",
        guideHref: guideHrefForGame(
          offer.game_slug,
          gameKeyFromParts(offer.game_slug, offer.game_name),
        ),
        routes: modalRoutesByGameKey[
          gameKeyFromParts(offer.game_slug, offer.game_name)
        ] ?? [
          {
            offerId: offer.id,
            href: buildGoHref(offer, "homepage_cashinstyle_modal_single_route"),
            providerName: offer.provider_name,
            platformName: offer.platform_name,
            payout: formatMoney(offer.total_payout_usd ?? offer.payout_usd),
            payoutValue: offer.total_payout_usd ?? offer.payout_usd,
            taskCount: offer.goal_text ? 1 : 0,
            tasks: offer.goal_text
              ? [
                  {
                    title: offer.goal_text,
                    rewardDisplay: formatMoney(
                      offer.total_payout_usd ?? offer.payout_usd,
                    ),
                  },
                ]
              : [],
          },
        ],
      },
    }));

  const OFFER_RAIL_TABS: OfferRailTab[] = [
    {
      id: "earnlab",
      label: "EarnLab",
      description: "EarnLab game picks matched to active EarnGrind routes. Open a preview to compare milestones before clicking out.",
      items: earnLabOfferRail,
    },
    {
      id: "gain",
      label: "Gain.gg",
      description: "Current game offers from Gain.gg's native wall. Review milestones and payout before opening the Gain wall.",
      items: gainOfferRail,
    },
    {
      id: "cashinstyle",
      label: "CashInStyle",
      description: "Current CashInStyle game offers from EarnGrind's imported feed. Start buttons use the tracked CashInStyle deeplink flow.",
      items: cashInStyleOfferRail,
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--surface-muted)]">
      <JsonLd data={websiteJsonLd} />
      <EarnLabActivityRail />

      <section
        className="relative overflow-hidden px-4 pb-12 pt-12 sm:px-6 sm:pb-14 sm:pt-14 lg:px-8"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(7,9,12,0.93) 0%, rgba(7,9,12,0.78) 38%, rgba(7,9,12,0.54) 62%, rgba(7,9,12,0.78) 100%),
            linear-gradient(to bottom, rgba(7,9,12,0.62) 0%, rgba(7,9,12,0.18) 54%, rgba(7,9,12,0.9) 100%),
            url("/hero-home.png")
          `,
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      >
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-[760px] text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--brand-lime)]/35 bg-black/55 px-3 py-1.5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand-lime)]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-lime)]">
                Live payout discovery
              </span>
            </div>

            <h1 className="mb-4 max-w-[680px] text-4xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-6xl">
              Find the Highest-Paying Version of Any Mobile Game Offer
            </h1>

            <p className="mb-6 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
              Before you grind, check EarnGrind — we compare payouts across
              every major rewards site so you earn more for the same time.
            </p>

            <div className="mb-6 flex flex-wrap items-center justify-start gap-2.5">
              {[
                "Browse without signup",
                "Partner payouts stay ungated",
                "Compare before you click",
              ].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-white/25 bg-black/35 px-3 py-1.5 text-xs font-bold text-white/90"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mb-5 flex flex-wrap items-center justify-start gap-3">
              <Link
                href="/offers"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-lime)] px-6 py-3.5 text-sm font-extrabold text-[var(--brand-ink)] shadow-lg shadow-[var(--brand-lime)]/20 transition-all hover:-translate-y-px hover:bg-[color:hsl(84,93%,72%)] active:translate-y-0"
              >
                Compare Live Offers
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/offers#games"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-black/35 px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/15"
              >
                Browse Games
              </Link>
            </div>
            {discordUrl ? (
              <a
                href={discordUrl}
                className="inline-flex items-center gap-2 text-sm font-bold text-white/80 transition-colors hover:text-[var(--brand-lime)]"
                target="_blank"
                rel="noreferrer"
              >
                Join the community →
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border-default)] bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-center text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--text-tertiary)] sm:text-left">
            Tracks offers from:
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {PARTNER_LOGOS.map((partner) => (
              <div
                key={partner.name}
                className="flex h-16 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] px-4 transition hover:border-lime-300 hover:bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Partner logo strip needs CSS grayscale filters on plain img tags. */}
                <img
                  src={partner.image}
                  alt={`${partner.name} logo`}
                  className="max-h-9 max-w-[8rem] object-contain grayscale opacity-60 transition duration-200 hover:grayscale-0 hover:opacity-100"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border-default)] bg-[var(--surface-muted)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="section-label mb-3">Choose your path</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
              Choose the hub that matches your next step
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              EarnGrind keeps discovery, comparison, walkthroughs, and platform
              research separate so each page has a clear job.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {START_HERE_ITEMS.map((item, index) =>
              index === 0 ? (
                <Link
                  key={item.href}
                  className="group relative h-full min-h-[186px] overflow-hidden rounded-lg border border-[var(--border-default)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-lime-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400"
                  href="/offers"
                >
                  <div className="pointer-events-none absolute -bottom-10 -right-8 h-40 w-40 rounded-full bg-lime-100/60" />
                  <div className="pointer-events-none absolute -bottom-8 right-2 h-32 w-32 rounded-full bg-amber-50/70" />

                  <div
                    className="pointer-events-none absolute bottom-2 right-1 block h-28 w-28 drop-shadow-[0_10px_18px_rgba(15,23,42,0.16)] transition-transform duration-200 group-hover:scale-105"
                    aria-hidden="true"
                  >
                    <picture className="block h-full w-full">
                      <source
                        srcSet="/images/compare-offers-scale-transparent.webp"
                        type="image/webp"
                      />
                      <img
                        src="/images/compare-offers-scale-transparent.png"
                        alt=""
                        className="h-full w-full object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                  </div>

                  <span className="relative z-10 rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Canonical search
                  </span>

                  <h3 className="relative z-10 mt-4 max-w-[8.75rem] text-base font-extrabold text-[var(--brand-ink)]">
                    Compare Offers
                  </h3>

                  <p className="relative z-10 mt-2 max-w-[8.25rem] text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                    Compare live payout routes.
                  </p>
                </Link>
              ) : index === 1 ? (
                <Link
                  key={item.href}
                  className="group relative h-full min-h-[186px] overflow-hidden rounded-lg border border-[var(--border-default)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-lime-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400"
                  href="/offers#games"
                >
                  <div className="pointer-events-none absolute -bottom-10 -right-8 h-40 w-40 rounded-full bg-lime-100/60" />
                  <div className="pointer-events-none absolute -bottom-8 right-2 h-32 w-32 rounded-full bg-amber-50/70" />

                  <div
                    className="pointer-events-none absolute bottom-2 right-1 block h-20 w-20 drop-shadow-[0_10px_18px_rgba(15,23,42,0.16)] transition-transform duration-200 group-hover:scale-105"
                    aria-hidden="true"
                  >
                    <picture className="block h-full w-full">
                      <source
                        srcSet="/images/browse-games-phone-search-transparent.webp"
                        type="image/webp"
                      />
                      <img
                        src="/images/browse-games-phone-search-transparent.png"
                        alt=""
                        className="h-full w-full object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                  </div>

                  <span className="relative z-10 rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Game discovery
                  </span>

                  <h3 className="relative z-10 mt-4 max-w-[8.75rem] text-base font-extrabold text-[var(--brand-ink)]">
                    Browse Games
                  </h3>

                  <p className="relative z-10 mt-2 max-w-[8.75rem] text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                    Start with game hubs for payout snapshots, guide coverage,
                    and related games.
                  </p>
                </Link>
              ) : index === 2 ? (
                <Link
                  key={item.href}
                  className="group relative h-full min-h-[186px] overflow-hidden rounded-lg border border-[var(--border-default)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-lime-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400"
                  href="/best-gpt-sites"
                >
                  <div className="pointer-events-none absolute -bottom-10 -right-8 h-40 w-40 rounded-full bg-lime-100/60" />
                  <div className="pointer-events-none absolute -bottom-8 right-2 h-32 w-32 rounded-full bg-amber-50/70" />

                  <div
                    className="pointer-events-none absolute bottom-2 right-2 block h-24 w-24 drop-shadow-[0_10px_18px_rgba(15,23,42,0.16)] transition-transform duration-200 group-hover:scale-105"
                    aria-hidden="true"
                  >
                    <picture className="block h-full w-full">
                      <source
                        srcSet="/images/best-gpt-sites-trophy-transparent.webp"
                        type="image/webp"
                      />
                      <img
                        src="/images/best-gpt-sites-trophy-transparent.png"
                        alt=""
                        className="h-full w-full object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                  </div>

                  <span className="relative z-10 rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Platform intel
                  </span>

                  <h3 className="relative z-10 mt-4 max-w-[8.75rem] text-base font-extrabold text-[var(--brand-ink)]">
                    Best GPT Sites
                  </h3>

                  <p className="relative z-10 mt-2 max-w-[8rem] text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                    Find trusted GPT sites with competitive payouts.
                  </p>
                </Link>
              ) : index === 3 ? (
                <Link
                  key={item.href}
                  className="group relative h-full min-h-[186px] overflow-hidden rounded-lg border border-[var(--border-default)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-lime-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400"
                  href="/guides"
                >
                  <div className="pointer-events-none absolute -bottom-10 -right-8 h-40 w-40 rounded-full bg-lime-100/60" />
                  <div className="pointer-events-none absolute -bottom-8 right-2 h-32 w-32 rounded-full bg-amber-50/70" />

                  <div
                    className="pointer-events-none absolute bottom-2 -right-3 block h-20 w-32 drop-shadow-[0_10px_18px_rgba(15,23,42,0.16)] transition-transform duration-200 group-hover:scale-105"
                    aria-hidden="true"
                  >
                    <picture className="block h-full w-full">
                      <source
                        srcSet="/images/game-guides-route-transparent.webp"
                        type="image/webp"
                      />
                      <img
                        src="/images/game-guides-route-transparent.png"
                        alt=""
                        className="h-full w-full object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                  </div>

                  <span className="relative z-10 rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Completion help
                  </span>

                  <h3 className="relative z-10 mt-4 max-w-[8.75rem] text-base font-extrabold text-[var(--brand-ink)]">
                    Game Guides
                  </h3>

                  <p className="relative z-10 mt-2 max-w-[7.25rem] text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                    Finish milestones faster.
                  </p>
                </Link>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg border border-[var(--border-default)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-lime-300"
                >
                  <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    {item.badge}
                  </span>
                  <h3 className="mt-4 text-base font-extrabold text-[var(--brand-ink)]">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                    {item.desc}
                  </p>
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface-muted)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-12">
          <HomepageSectionHeader
            eyebrow="Games & Offers"
            title="Featured Games by Site"
            description="Compare featured game picks from each partner site, preview routes, and open a game page before starting."
          />
          <FeaturedOfferRail
            items={gemsLootFeaturedOfferRail}
            title="Featured Game Offers"
            description="Curated GemsLoot game offers. Open a preview, then start the exact GemsLoot offer detail modal through the tracked route when available."
          />
          <EmailCapture variant="inline" />
          <TabbedOfferRail tabs={OFFER_RAIL_TABS} />
        </div>
      </section>

      {featuredPost ? (
        <section className="bg-[var(--surface-muted)] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <article className="eg-card p-6 sm:p-7">
              <p className="section-label mb-3">Featured this week</p>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-[var(--brand-ink)]">
                    {featuredPost.title}
                  </h2>
                  {featuredPost.excerpt ? (
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
                      {featuredPost.excerpt}
                    </p>
                  ) : null}
                  {formatPostDate(featuredPost.published_at) ? (
                    <p className="mt-3 text-xs font-semibold text-[var(--text-tertiary)]">
                      {formatPostDate(featuredPost.published_at)}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="inline-flex items-center justify-center rounded-lg border border-[var(--border-default)] bg-white px-4 py-2.5 text-sm font-extrabold text-[var(--brand-ink)] transition hover:border-lime-300 hover:bg-[var(--brand-lime)]/10"
                >
                  Read more →
                </Link>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <section className="bg-[var(--surface-muted)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            <p className="section-label mb-3">FAQ</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--brand-ink)]">
              Common questions from beginners
            </h2>
          </div>

          <div className="space-y-3">
            <FaqItem
              question="Which platform is best for beginners?"
              answer="Start with the Best GPT Sites page. It compares beginner-friendly platforms by trust, payout options, and offer quality so you can pick a site before choosing a specific task."
            />
            <FaqItem
              question="How do I actually get paid?"
              answer="Choose an offer on EarnGrind, open the partner platform, complete the task under that platform's rules, then cash out through the platform's own payout system after approval."
            />
            <FaqItem
              question="What's the difference between EarnGrind and Swagbucks?"
              answer="Swagbucks is a rewards platform where you complete offers and cash out. EarnGrind is a comparison tool that helps you find which platform has the better payout before you start."
            />
            <FaqItem
              question="Is EarnGrind free to use?"
              answer="Yes. No account needed to browse EarnGrind. We show comparison data first; partner sites may ask you to create an account only after you click out to complete an offer."
            />
          </div>
        </div>
      </section>

      <section
        className="px-4 py-20 sm:px-6 lg:px-8"
        style={{
          background:
            "linear-gradient(160deg, #0d0d12 0%, #1a1a2e 50%, #0d0d12 100%)",
        }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Ready to earn your first dollar online?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-white/50">
            No account needed to browse. We just show you where the money is.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/offers"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-lime)] px-8 py-4 text-base font-extrabold text-[var(--brand-ink)] shadow-lg shadow-[var(--brand-lime)]/20 transition-all hover:-translate-y-px hover:bg-[color:hsl(84,93%,72%)]"
            >
              Browse Offers - It&apos;s Free
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <p className="mt-5 text-xs font-medium text-white/30">
            No sign-up required to browse EarnGrind. Partner platforms may
            require accounts for their own offers.
          </p>
        </div>
      </section>
    </main>
  );
}
