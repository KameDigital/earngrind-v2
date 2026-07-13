import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import EmailCapture from "@/components/EmailCapture";
import FeaturedOfferRail, {
  type FeaturedOfferRailItem,
} from "@/components/home/FeaturedOfferRail";
import HomepageSectionHeader from "@/components/home/HomepageSectionHeader";
import TabbedOfferRail, { type OfferRailTab } from "@/components/home/TabbedOfferRail";
import EarnLabActivityRail from "@/components/offers/EarnLabActivityRail";
import OfferSearchEngine from "@/components/offers/OfferSearchEngine";
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

const HERO_SITE_TAGS = ["Freecash", "Gemsloot", "Gain.gg", "EarnLab", "KashKick", "Swagbucks"] as const;

const TRACKED_BROKERS = [
  { name: "Torox", status: "Active tracking", desc: "High-volume mobile and CPA offer paths." },
  { name: "AdGate Media", status: "Active tracking", desc: "Survey, app install, and rewarded action offers." },
  { name: "EarnLab", status: "Imported routes", desc: "Regional game and mobile app payout routes." },
  { name: "RevU", status: "Platform routes", desc: "Survey and app routes inside partner platforms." },
  { name: "Lootably", status: "Platform routes", desc: "Offerwall inventory used across rewards platforms." },
] as const;

const PARTNER_SITE_ROWS = [
  { name: "Freecash", rating: "4.9/5", href: "/review/freecash-review" },
  { name: "Gain.gg", rating: "4.8/5", href: "/review/gain-gg-review" },
  { name: "ySense", rating: "4.6/5", href: "/best-gpt-sites#platform-reviews" },
  { name: "Swagbucks", rating: "4.6/5", href: "/review/swagbucks-review" },
  { name: "Reward XP", rating: "4.5/5", href: "/best-gpt-sites#platform-reviews" },
  { name: "EarnLab", rating: "4.3/5", href: "/best-gpt-sites#platform-reviews" },
  { name: "Lootup", rating: "4.2/5", href: "/best-gpt-sites#platform-reviews" },
] as const;

const HOME_LINK_GROUPS = [
  {
    title: "Popular game offer categories",
    links: [
      { href: "/best-gain-gg-offers", label: "Gain.gg offers" },
      { href: "/best-freecash-games", label: "Best Freecash games" },
      { href: "/highest-paying-gpt-games", label: "Highest-paying GPT games" },
      { href: "/best-money-making-games", label: "Money-making games" },
    ],
  },
  {
    title: "Offerwall providers",
    links: [
      { href: "/offers/gain/us/torox", label: "Torox offers" },
      { href: "/offers/gain/us/adgate", label: "AdGate Media" },
      { href: "/offers/gain/us/revu", label: "RevU offers" },
      { href: "/offers/gain/us/lootably", label: "Lootably offers" },
    ],
  },
  {
    title: "EarnLab countries",
    links: [
      { href: "/offers/us", label: "United States offers" },
      { href: "/offers/gb", label: "United Kingdom offers" },
      { href: "/offers/ca", label: "Canada offers" },
      { href: "/offers/au", label: "Australia offers" },
    ],
  },
  {
    title: "Popular hubs",
    links: [
      { href: "/guides/how-to-earn", label: "How-to-earn guides" },
      { href: "/guides/woodoku-blast", label: "Woodoku Blast guide" },
      { href: "/best-gpt-sites", label: "Best GPT sites" },
      { href: "/review/swagbucks-review", label: "Swagbucks review" },
    ],
  },
] as const;

function buildHomepageOfferQueryString(countryCode: string) {
  const params = new URLSearchParams();
  params.set("country", countryCode);
  params.set("sort", "payout_desc");
  params.set("page", "1");
  params.set("per_page", "12");
  return params.toString();
}

function formatPostDate(_value: string | null) {
  return null;
}

export default async function HomePage() {
  const initialOfferQueryString = buildHomepageOfferQueryString("US");
  const {
    cashInStyleFeaturedOffers,
    earnLabFeaturedOffers,
    gainFeaturedOffers,
    gemsLootFeaturedOffers,
    guideHrefByGameKey,
    modalRoutesByGameKey,
  } = await getHomepageData();
  const featuredPost: any = null;
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
        className="relative flex min-h-[430px] items-center overflow-hidden border-b border-black/20 px-4 py-16 sm:px-6 lg:min-h-[500px] lg:px-8"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgba(4,8,18,0.14) 0%, rgba(5,9,20,0.34) 42%, rgba(3,7,18,0.62) 100%),
            linear-gradient(90deg, rgba(3,7,18,0.58) 0%, rgba(3,7,18,0.28) 28%, rgba(3,7,18,0.16) 50%, rgba(3,7,18,0.32) 72%, rgba(3,7,18,0.62) 100%),
            url("/hero-home.png")
          `,
          backgroundPosition: "center 24%",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      >
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-slate-950/55 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--brand-lime)] backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-lime)]" aria-hidden="true" />
            Direct GPT offer affiliate links
          </p>
          <h1 className="text-[clamp(3.25rem,8vw,6rem)] font-black leading-[0.84] text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.65)]">
            Earn<span className="text-[var(--brand-lime)]">Grind</span>
          </h1>

          <p className="mt-5 max-w-2xl text-balance text-sm font-semibold leading-relaxed text-white/80 drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)] sm:text-base">
            Find the best Get Paid To offer platforms where you can earn rewards by playing games on Mobile and Desktop or Completing Surveys, and much more. All tested and reviewed for you by a seasoned Grinder with Weekly updates on the best and highest rewarded offers to save you time and fill your pockets!
          </p>

          <Link
            href="/offers"
            className="mt-6 inline-flex items-center justify-center rounded-sm bg-[var(--brand-lime)] px-5 py-2.5 text-xs font-extrabold text-[var(--brand-ink)] shadow-[0_12px_40px_rgba(130,223,22,0.2)] transition hover:bg-[#9aeb42]"
          >
            Browse verified offers <span aria-hidden="true" className="ml-2">&rarr;</span>
          </Link>

          <div className="mt-8">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/35">
              Offers tracked from
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {HERO_SITE_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="border border-white/10 bg-slate-950/35 px-3 py-1.5 text-[11px] font-bold text-white/65 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {discordUrl ? (
            <a
              href={discordUrl}
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white/80 transition-colors hover:text-[var(--brand-lime)]"
              target="_blank"
              rel="noreferrer"
            >
              Join the community →
            </a>
          ) : null}
        </div>
      </section>

      <section className="border-b border-[var(--border-default)] bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <p className="section-label mb-3">Choose your path</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-3xl">
              Choose the hub that matches your next step
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              EarnGrind keeps discovery, comparison, walkthroughs, and platform
              research separate so each page has a clear job.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {START_HERE_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group border border-[var(--border-default)] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-lime-300 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400"
              >
                <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  {item.badge}
                </span>
                <h3 className="mt-3 text-sm font-extrabold text-[var(--brand-ink)]">
                  {item.name}
                </h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                  {item.desc}
                </p>
              </Link>
            ))}
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

      <section className="border-y border-[var(--border-default)] bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 max-w-4xl">
            <p className="section-label mb-2">Full offer browser</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-3xl">
              Search offers by payout, site, source, device, &amp; country
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              Compare GPT offer payouts, filter games and tasks by device, and discover the highest-paying route before opening a partner site.
            </p>
          </div>
          <Suspense fallback={null}>
            <OfferSearchEngine
              initialQueryString={initialOfferQueryString}
            />
          </Suspense>
        </div>
      </section>

      <section className="bg-[var(--surface-muted)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div>
            <p className="section-label mb-2">Tracked offerwall brokers</p>
            <h2 className="text-xl font-extrabold tracking-tight text-[var(--brand-ink)]">
              The offer walls EarnGrind watches for payout changes
            </h2>
            <div className="mt-5 space-y-3">
              {TRACKED_BROKERS.map((broker) => (
                <div key={broker.name} className="border border-[var(--border-default)] bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-extrabold text-[var(--brand-ink)]">{broker.name}</h3>
                    <span className="bg-lime-50 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-lime-700">
                      {broker.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{broker.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="section-label mb-2">Best paying GPT partner sites</p>
            <h2 className="text-xl font-extrabold tracking-tight text-[var(--brand-ink)]">
              Sites to compare before you start an offer
            </h2>
            <div className="mt-5 space-y-3">
              {PARTNER_SITE_ROWS.map((site) => (
                <Link
                  key={site.name}
                  href={site.href}
                  className="flex items-center justify-between gap-4 border border-[var(--border-default)] bg-white p-4 text-sm shadow-sm transition hover:border-lime-300 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
                >
                  <span>
                    <span className="block font-extrabold text-[var(--brand-ink)]">{site.name}</span>
                    <span className="mt-0.5 block text-xs font-semibold text-[var(--text-tertiary)]">{site.rating}</span>
                  </span>
                  <span className="border border-[var(--border-default)] px-3 py-1.5 text-xs font-extrabold text-[var(--brand-ink)]">
                    Visit platform
                  </span>
                </Link>
              ))}
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
            <p className="section-label mb-3">Knowledgebase</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--brand-ink)]">
              GPT Industry FAQ &amp; SEO Knowledgebase
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

      <section className="border-t border-[var(--border-default)] bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                {group.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--brand-ink)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section
        className="hidden px-4 py-20 sm:px-6 lg:px-8"
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
