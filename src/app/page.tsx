import type { Metadata } from "next";
import Link from "next/link";
import FeaturedOfferRail, { type FeaturedOfferRailItem } from "@/components/home/FeaturedOfferRail";
import HomepageSectionHeader from "@/components/home/HomepageSectionHeader";
import EarnLabActivityRail from "@/components/offers/EarnLabActivityRail";
import { buildGainOfferDeepLink } from "@/lib/gain-deeplinks";
import { buildGoHref, formatMoney, gameKeyFromParts, getHomepageData } from "@/lib/homepage-data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "EarnGrind | GPT Offer Discovery, Game Guides, and Platform Research",
  description:
    "Use EarnGrind to discover GPT offer paths, compare live payout routes on /offers, browse game hubs, read completion guides, and research trusted GPT sites.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "EarnGrind | GPT Offer Discovery, Game Guides, and Platform Research",
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
    title: "EarnGrind | GPT Offer Discovery, Game Guides, and Platform Research",
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

export default async function HomePage() {
  const {
    cashInStyleFeaturedOffers,
    earnLabFeaturedOffers,
    gainFeaturedOffers,
    guideHrefByGameKey,
    modalRoutesByGameKey,
  } = await getHomepageData();

  const guideHrefForGame = (slug: string | null | undefined, fallbackKey?: string) => {
    if (!slug) return fallbackKey ? guideHrefByGameKey[fallbackKey] ?? null : null;
    return guideHrefByGameKey[slug] ?? (modalRoutesByGameKey[slug]?.length ? `/guides/how-to-earn/${slug}` : null);
  };

  const earnLabOfferRail: FeaturedOfferRailItem[] = earnLabFeaturedOffers.map((offer) => ({
    id: `offer-${offer.id}`,
    href: offer.game_slug ? `/games/${offer.game_slug}` : "/offers",
    title: offer.title?.trim() || offer.game_name || "Offer",
    badge: offer.badge,
    provider: offer.platform_name,
    platform: offer.provider_name,
    payout: formatMoney(offer.total_payout_usd ?? offer.payout_usd) ?? null,
    secondaryValue: offer.goal_text ? offer.goal_text : null,
    imageUrl: offer.image_url,
    preview: {
      title: offer.title?.trim() || offer.game_name || "Offer",
      description: `Compare available routes for ${offer.game_name ?? offer.title ?? "this offer"} before choosing where to start.`,
      imageUrl: offer.image_url,
      gameHref: offer.game_slug ? `/games/${offer.game_slug}` : "/offers",
      guideHref: guideHrefForGame(offer.game_slug, gameKeyFromParts(offer.game_slug, offer.game_name)),
      routes: modalRoutesByGameKey[gameKeyFromParts(offer.game_slug, offer.game_name)] ?? [
        {
          offerId: offer.id,
          href: buildGoHref(offer, "homepage_modal_single_route"),
          providerName: offer.provider_name,
          platformName: offer.platform_name,
          payout: formatMoney(offer.total_payout_usd ?? offer.payout_usd),
          payoutValue: offer.total_payout_usd ?? offer.payout_usd,
          taskCount: offer.goal_text ? 1 : 0,
          tasks: offer.goal_text
            ? [{ title: offer.goal_text, rewardDisplay: formatMoney(offer.total_payout_usd ?? offer.payout_usd) }]
            : [],
        },
      ],
    },
  }));

  const gainOfferRail: FeaturedOfferRailItem[] = gainFeaturedOffers.map((offer) => {
    const gainHref = offer.trackingUrl ?? buildGainOfferDeepLink(offer.id) ?? offer.startUrl;

    return {
      id: `gain-featured-${offer.wall}-${offer.id}`,
      href: gainHref,
      title: offer.title,
      badge: "Gain featured",
      provider: "Gain.gg",
      platform: offer.providerName,
      payout: formatMoney(offer.totalPayout ?? offer.payout) ?? null,
      secondaryValue:
        offer.tasks.length > 0
          ? `${offer.tasks.length} milestones available`
          : offer.shortDescription ?? null,
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
  });

  const cashInStyleOfferRail: FeaturedOfferRailItem[] = cashInStyleFeaturedOffers.map((offer) => ({
    id: `cashinstyle-featured-${offer.id}`,
    href: offer.game_slug ? `/games/${offer.game_slug}` : "/offers",
    title: offer.title?.trim() || offer.game_name || "Offer",
    badge: offer.badge,
    provider: offer.platform_name,
    platform: offer.provider_name,
    payout: formatMoney(offer.total_payout_usd ?? offer.payout_usd) ?? null,
    secondaryValue: offer.goal_text ? offer.goal_text : null,
    imageUrl: offer.image_url,
    preview: {
      title: offer.title?.trim() || offer.game_name || "Offer",
      description: `Preview the CashInStyle route for ${
        offer.game_name ?? offer.title ?? "this offer"
      } before starting.`,
      imageUrl: offer.image_url,
      gameHref: offer.game_slug ? `/games/${offer.game_slug}` : "/offers",
      guideHref: guideHrefForGame(offer.game_slug, gameKeyFromParts(offer.game_slug, offer.game_name)),
      routes: modalRoutesByGameKey[gameKeyFromParts(offer.game_slug, offer.game_name)] ?? [
        {
          offerId: offer.id,
          href: buildGoHref(offer, "homepage_cashinstyle_modal_single_route"),
          providerName: offer.provider_name,
          platformName: offer.platform_name,
          payout: formatMoney(offer.total_payout_usd ?? offer.payout_usd),
          payoutValue: offer.total_payout_usd ?? offer.payout_usd,
          taskCount: offer.goal_text ? 1 : 0,
          tasks: offer.goal_text
            ? [{ title: offer.goal_text, rewardDisplay: formatMoney(offer.total_payout_usd ?? offer.payout_usd) }]
            : [],
        },
      ],
    },
  }));

  return (
    <main className="min-h-screen bg-[var(--surface-muted)]">
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
              EarnGrind GPT Offer Discovery
            </h1>

            <p className="mb-6 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
              Find the right path before you click: compare live routes in Offers, browse game hubs, read completion guides, and research GPT sites by trust.
            </p>

            <div className="mb-6 flex flex-wrap items-center justify-start gap-2.5">
              {["Browse without signup", "Partner payouts stay ungated", "Compare before you click"].map((item) => (
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
                <span aria-hidden="true">-&gt;</span>
              </Link>
              <Link
                href="/best-gpt-sites"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-black/35 px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/15"
              >
                Best GPT Sites
              </Link>
              <Link
                href="/offers#games"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-black/35 px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/15"
              >
                Browse Games
              </Link>
            </div>

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
              EarnGrind keeps discovery, comparison, walkthroughs, and platform research separate so each page has a clear job.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {START_HERE_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-[var(--border-default)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-lime-300"
              >
                <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  {item.badge}
                </span>
                <h3 className="mt-4 text-base font-extrabold text-[var(--brand-ink)]">{item.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">{item.desc}</p>
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
            items={earnLabOfferRail}
            title="Featured EarnLab games"
            description="EarnLab game picks matched to active EarnGrind routes. Open a preview to compare milestones before clicking out."
          />
          <FeaturedOfferRail
            items={gainOfferRail}
            title="Featured Gain.gg games"
            description="Current game offers from Gain.gg's native wall. Review milestones and payout before opening the Gain wall."
          />
          <FeaturedOfferRail
            items={cashInStyleOfferRail}
            title="Featured CashInStyle games"
            description="Current CashInStyle game offers from EarnGrind's imported feed. Start buttons use the tracked CashInStyle deeplink flow."
          />
        </div>
      </section>

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
              question="Is this actually real? Can I really earn money?"
              answer="Yes. EarnGrind helps you compare offers from partner GPT sites. When you click out to a partner platform, that partner owns the offer completion, approval, and payout process."
            />
            <FaqItem
              question="How much can I earn?"
              answer="It depends on the offers you choose. Simple tasks may pay a few dollars, while high-value game milestones can pay significantly more. Use the highest paying GPT offers and guide sections to prioritize better routes."
            />
            <FaqItem
              question="Do I need to pay anything to start?"
              answer="No. No signup is required to browse offers, guides, and GPT comparisons. Some partner platforms may require their own account before you can complete offers there."
            />
            <FaqItem
              question="Why are there so many internal pages?"
              answer="Game pages, comparison pages, and guides serve different search intents. Linking them together helps users discover the right route faster and helps search engines understand site structure."
            />
          </div>
        </div>
      </section>

      <section
        className="px-4 py-20 sm:px-6 lg:px-8"
        style={{
          background: "linear-gradient(160deg, #0d0d12 0%, #1a1a2e 50%, #0d0d12 100%)",
        }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Ready to earn your first dollar online?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-white/50">
            Start with discovery, move into the offer comparison page when you need filters, and verify partner terms before you click out.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/offers"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-lime)] px-8 py-4 text-base font-extrabold text-[var(--brand-ink)] shadow-lg shadow-[var(--brand-lime)]/20 transition-all hover:-translate-y-px hover:bg-[color:hsl(84,93%,72%)]"
            >
              Browse Offers - It&apos;s Free
              <span aria-hidden="true">-&gt;</span>
            </Link>
          </div>

          <p className="mt-5 text-xs font-medium text-white/30">
            No sign-up required to browse EarnGrind. Partner platforms may require accounts for their own offers.
          </p>
        </div>
      </section>
    </main>
  );
}
