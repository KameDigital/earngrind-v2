import type { Metadata } from "next";
import Link from "next/link";
import EmailCapture from "@/components/EmailCapture";
import FeaturedOfferRail, {
  type FeaturedOfferRailItem,
} from "@/components/home/FeaturedOfferRail";
import HomepageSectionHeader from "@/components/home/HomepageSectionHeader";
import TabbedOfferRail, { type OfferRailTab } from "@/components/home/TabbedOfferRail";
import EarnLabActivityRail from "@/components/offers/EarnLabActivityRail";
import { RevenuePageView } from "@/components/analytics/RevenueEventTracker";
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

function buildGainFeaturedGoHref(params: {
  offerId: string;
  offerTitle: string;
  providerName?: string | null;
  payoutUsd?: number | null;
  destinationUrl: string;
  clickLocation: string;
}) {
  const searchParams = new URLSearchParams({
    click_location: params.clickLocation,
    source_context: "homepage_rail_modal",
    platform_name: "Gain.gg",
    offer_title: params.offerTitle,
    destination_url: params.destinationUrl,
  });

  if (params.providerName) searchParams.set("provider_name", params.providerName);
  if (typeof params.payoutUsd === "number") searchParams.set("payout_usd", String(params.payoutUsd));
  searchParams.set("gain_offer_id", params.offerId);

  return `/go/platform/gain-gg?${searchParams.toString()}`;
}

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
      const gainDestinationUrl =
        offer.trackingUrl ?? buildGainOfferDeepLink(offer.id) ?? offer.startUrl;
      const gainCardHref = buildGainFeaturedGoHref({
        offerId: offer.id,
        offerTitle: offer.title,
        providerName: offer.providerName,
        payoutUsd: offer.totalPayout ?? offer.payout,
        destinationUrl: gainDestinationUrl,
        clickLocation: "homepage_gain_featured_offer",
      });
      const gainModalHref = buildGainFeaturedGoHref({
        offerId: offer.id,
        offerTitle: offer.title,
        providerName: offer.providerName,
        payoutUsd: offer.totalPayout ?? offer.payout,
        destinationUrl: gainDestinationUrl,
        clickLocation: "homepage_gain_modal_single_route",
      });

      return {
        id: `gain-featured-${offer.wall}-${offer.id}`,
        href: gainCardHref,
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
              href: gainModalHref,
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
      <RevenuePageView routePath="/" routeGroup="homepage" sourceContext="homepage" />
      <JsonLd data={websiteJsonLd} />
      <EarnLabActivityRail />

      <section
        className="eg-visual-frame px-4 py-10 sm:px-6 lg:px-8 lg:py-16"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 36%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.48) 46%, rgba(0,0,0,0.28) 100%),
            linear-gradient(90deg, rgba(5,8,13,0.12) 0%, rgba(5,8,13,0.42) 32%, rgba(5,8,13,0.56) 50%, rgba(5,8,13,0.38) 68%, rgba(5,8,13,0.12) 100%),
            url("/hero-home.png")
          `,
          backgroundPosition: "center 24%",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      >
        <div className="relative z-10 mx-auto grid w-full max-w-[1440px] gap-8 lg:grid-cols-[minmax(0,0.96fr)_minmax(520px,1.04fr)] lg:items-center">
          <div className="max-w-3xl">
          <p className="eg-kicker mb-5">
            GPT offer comparison command center
          </p>
          <h1 className="text-balance text-[clamp(3.4rem,8vw,8.8rem)] font-black leading-[0.82] tracking-[-0.085em] text-white">
            Stop guessing where a game pays best.
          </h1>

          <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/72 sm:text-xl">
            EarnGrind compares real offer routes, provider payouts, game guides, and platform trust signals before you click into a rewards site.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/offers" className="inline-flex min-h-14 items-center justify-center bg-[var(--brand-lime)] px-7 py-4 text-sm font-black uppercase tracking-[0.12em] text-slate-950 shadow-[0_0_34px_rgba(156,255,36,0.24)] transition hover:-translate-y-px hover:bg-lime-200">
              Open comparison console <span aria-hidden="true" className="ml-2">&rarr;</span>
            </Link>
            <Link href="/guides" className="inline-flex min-h-14 items-center justify-center border border-white/15 bg-white/8 px-7 py-4 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:border-lime-300/40 hover:text-[var(--brand-lime)]">
              Read route guides
            </Link>
          </div>

          {discordUrl ? (
            <a
              href={discordUrl}
              className="mt-5 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-white/45 transition-colors hover:text-[var(--brand-lime)]"
              target="_blank"
              rel="noreferrer"
            >
              Join the community →
            </a>
          ) : null}
          </div>

          <div className="eg-terminal relative grid gap-4 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-lime)]">Live route scanner</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-white">Offer discovery terminal</h2>
              </div>
              <div className="hidden border border-lime-300/30 bg-lime-300/10 px-3 py-2 text-right sm:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/45">Mode</p>
                <p className="text-sm font-black text-[var(--brand-lime)]">Compare</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {(earnLabOfferRail.length ? earnLabOfferRail : gemsLootFeaturedOfferRail).slice(0, 3).map((offer, index) => (
                <Link key={offer.id} href={offer.href} className="group border border-white/10 bg-white/[0.06] p-3 transition hover:-translate-y-1 hover:border-lime-300/40 hover:bg-white/[0.09]">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Route {String(index + 1).padStart(2, "0")}</span>
                    <span className="bg-[var(--brand-lime)] px-2 py-0.5 text-[10px] font-black text-slate-950">{offer.payout ?? "Live"}</span>
                  </div>
                  <h3 className="line-clamp-2 min-h-10 text-sm font-black leading-tight text-white group-hover:text-[var(--brand-lime)]">{offer.title}</h3>
                  <p className="mt-3 truncate text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">
                    {[offer.provider, offer.platform].filter(Boolean).join(" / ") || "Offer route"}
                  </p>
                </Link>
              ))}
            </div>

            <div className="grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Use case</p>
                <p className="mt-1 text-sm font-bold text-white">Compare payout spread</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Data</p>
                <p className="mt-1 text-sm font-bold text-white">Real routes and reviews</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Next step</p>
                <Link href="/offers" className="mt-1 inline-flex text-sm font-black text-[var(--brand-lime)]">Search offers →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="border-y border-slate-950/10 bg-[#e9efe8] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <p className="mb-4 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 sm:text-left">
            Tracks offers from:
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {PARTNER_LOGOS.map((partner) => (
              <div
                key={partner.name}
                className="flex h-20 items-center justify-center border border-slate-950/10 bg-white/75 px-4 shadow-[0_16px_40px_rgba(7,11,18,0.06)] transition hover:-translate-y-0.5 hover:border-lime-300 hover:bg-white"
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

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-10 grid gap-5 lg:grid-cols-[0.75fr_1fr] lg:items-end">
            <div>
            <p className="eg-kicker mb-3">Choose your path</p>
            <h2 className="text-4xl font-black tracking-[-0.06em] text-[var(--brand-ink)] sm:text-6xl">
              Pick the correct earning workflow.
            </h2>
            </div>
            <p className="max-w-3xl text-base font-semibold leading-8 text-[var(--text-secondary)] lg:justify-self-end">
              EarnGrind keeps discovery, comparison, walkthroughs, and platform
              research separate so each page has a clear job.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {START_HERE_ITEMS.map((item, index) =>
              index === 0 ? (
                <Link
                  key={item.href}
                  className="eg-market-card group min-h-[260px] p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400 lg:col-span-2"
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

                  <span className="relative z-10 bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--brand-lime)]">
                    Canonical search
                  </span>

                  <h3 className="relative z-10 mt-6 max-w-[13rem] text-3xl font-black leading-none tracking-[-0.04em] text-[var(--brand-ink)]">
                    Compare Offers
                  </h3>

                  <p className="relative z-10 mt-3 max-w-[13rem] text-sm font-semibold leading-relaxed text-[var(--text-secondary)]">
                    Compare live payout routes.
                  </p>
                </Link>
              ) : index === 1 ? (
                <Link
                  key={item.href}
                  className="eg-market-card group min-h-[260px] p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400"
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

                  <span className="relative z-10 bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--brand-lime)]">
                    Game discovery
                  </span>

                  <h3 className="relative z-10 mt-6 max-w-[10rem] text-2xl font-black leading-none tracking-[-0.04em] text-[var(--brand-ink)]">
                    Browse Games
                  </h3>

                  <p className="relative z-10 mt-3 max-w-[10rem] text-sm font-semibold leading-relaxed text-[var(--text-secondary)]">
                    Start with game hubs for payout snapshots, guide coverage,
                    and related games.
                  </p>
                </Link>
              ) : index === 2 ? (
                <Link
                  key={item.href}
                  className="eg-market-card group min-h-[260px] p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400"
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

                  <span className="relative z-10 bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--brand-lime)]">
                    Platform intel
                  </span>

                  <h3 className="relative z-10 mt-6 max-w-[10rem] text-2xl font-black leading-none tracking-[-0.04em] text-[var(--brand-ink)]">
                    Best GPT Sites
                  </h3>

                  <p className="relative z-10 mt-3 max-w-[10rem] text-sm font-semibold leading-relaxed text-[var(--text-secondary)]">
                    Find trusted GPT sites with competitive payouts.
                  </p>
                </Link>
              ) : index === 3 ? (
                <Link
                  key={item.href}
                  className="eg-market-card group min-h-[260px] p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400"
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

                  <span className="relative z-10 bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--brand-lime)]">
                    Completion help
                  </span>

                  <h3 className="relative z-10 mt-6 max-w-[10rem] text-2xl font-black leading-none tracking-[-0.04em] text-[var(--brand-ink)]">
                    Game Guides
                  </h3>

                  <p className="relative z-10 mt-3 max-w-[10rem] text-sm font-semibold leading-relaxed text-[var(--text-secondary)]">
                    Finish milestones faster.
                  </p>
                </Link>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="eg-market-card min-h-[260px] p-5"
                >
                  <span className="bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--brand-lime)]">
                    {item.badge}
                  </span>
                  <h3 className="mt-6 text-2xl font-black leading-none tracking-[-0.04em] text-[var(--brand-ink)]">
                    {item.name}
                  </h3>
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-[var(--text-secondary)]">
                    {item.desc}
                  </p>
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#070b12] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px] space-y-12">
          <div className="grid gap-5 lg:grid-cols-[0.7fr_1fr] lg:items-end">
            <div>
              <p className="eg-kicker mb-3">Games & Offers</p>
              <h2 className="text-4xl font-black tracking-[-0.06em] text-white sm:text-6xl">
                Marketplace-style game cards with real payout routes.
              </h2>
            </div>
            <p className="max-w-3xl text-base font-semibold leading-8 text-white/60 lg:justify-self-end">
              Featured rails now sit inside a darker comparison workspace, matching the reference terminal rhythm while preserving live imported offers and tracked start paths.
            </p>
          </div>
          <HomepageSectionHeader
            eyebrow="Games & Offers"
            title="Featured Games by Site"
            description="Compare featured game picks from each partner site, preview routes, and open a game page before starting."
          />
          <div className="border border-white/10 bg-white/[0.04] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-6">
            <FeaturedOfferRail
              items={gemsLootFeaturedOfferRail}
              title="Featured Game Offers"
              description="Curated GemsLoot game offers. Open a preview, then start the exact GemsLoot offer detail modal through the tracked route when available."
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
            <EmailCapture variant="inline" />
            <div className="border border-white/10 bg-white/[0.04] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-6">
              <TabbedOfferRail tabs={OFFER_RAIL_TABS} />
            </div>
          </div>
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
