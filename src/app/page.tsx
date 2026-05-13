import type { Metadata } from "next";
import Link from "next/link";
import HomepageSectionHeader from "@/components/home/HomepageSectionHeader";
import HomepageLinkCard from "@/components/home/HomepageLinkCard";
import FeaturedOfferRail, { type FeaturedOfferRailItem } from "@/components/home/FeaturedOfferRail";
import EarnLabActivityRail from "@/components/offers/EarnLabActivityRail";
import { buildGainOfferDeepLink } from "@/lib/gain-deeplinks";
import { buildGoHref, formatMoney, gameKeyFromParts, getHomepageData } from "@/lib/homepage-data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Highest Paying GPT Offers, Game Guides, and Best GPT Sites",
  description:
    "Compare the highest paying GPT offers, browse game guides, and discover the best GPT sites with SEO-friendly internal links across offers, games, and guides.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Highest Paying GPT Offers, Game Guides, and Best GPT Sites",
    description:
      "Compare the highest paying GPT offers, browse game guides, and discover the best GPT sites with SEO-friendly internal links across offers, games, and guides.",
    url: "https://earngrind.com",
    siteName: "EarnGrind",
    images: [
      {
        url: "/og-earngrind.png",
        width: 1200,
        height: 630,
        alt: "Highest Paying GPT Offers, Game Guides, and Best GPT Sites",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Highest Paying GPT Offers, Game Guides, and Best GPT Sites",
    description:
      "Compare the highest paying GPT offers, browse game guides, and discover the best GPT sites with SEO-friendly internal links across offers, games, and guides.",
    images: ["/og-earngrind.png"],
  },
};

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group eg-card p-0 overflow-hidden">
      <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
        <span className="font-bold text-[var(--brand-ink)] text-sm sm:text-base leading-snug">
          {question}
        </span>
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--surface-muted)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-tertiary)] text-xs font-bold transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="px-6 pb-5 -mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">
        {answer}
      </div>
    </details>
  );
}

const START_HERE_ITEMS = [
  {
    name: "Best GPT Sites",
    href: "/best-gpt-sites",
    badge: "Platform intel",
    desc: "See which GPT sites are trusted, competitive on payout, and worth joining before you commit your time.",
  },
  {
    name: "Highest Paying GPT Offers",
    href: "/offers",
    badge: "Live payouts",
    desc: "Find the best-paying live tasks first so you stop wasting clicks on low-value offers.",
  },
  {
    name: "Game Guides",
    href: "/guides",
    badge: "Completion help",
    desc: "Use proven walkthroughs to finish milestones faster, avoid mistakes, and reach payout checkpoints sooner.",
  },
] as const;

const HOW_IT_WORKS_STEPS = [
  {
    step: "1",
    title: "Pick an offer",
    desc: "Browse live GPT offers, game pages, and guides to find the best current route for your device and time budget.",
  },
  {
    step: "2",
    title: "Follow the guide",
    desc: "Use the linked game page or guide to understand milestones, payout structure, and the fastest path to completion.",
  },
  {
    step: "3",
    title: "Get paid",
    desc: "Click through to the payout platform, complete the tracked tasks, and cash out through the provider directly.",
  },
] as const;

export default async function HomePage() {
  const {
    cashInStyleFeaturedOffers,
    earnLabFeaturedOffers,
    gainFeaturedOffers,
    modalRoutesByGameKey,
    guideHrefByGameKey,
    popularGuides,
    stats,
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
            tasks: offer.goal_text ? [{ title: offer.goal_text, rewardDisplay: formatMoney(offer.total_payout_usd ?? offer.payout_usd) }] : [],
          },
        ],
      },
    }));
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
  return (
    <main className="min-h-screen">
      <EarnLabActivityRail />

      <section
        className="relative overflow-hidden pt-14 pb-14 sm:pt-16 sm:pb-16 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, rgba(10,12,10,0.88) 0%, rgba(10,12,10,0.65) 50%, rgba(10,12,10,0.85) 100%),
            url("/hero-home.png")
          `,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(190,242,100,0.07) 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-3xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--brand-lime)]/30 bg-[var(--brand-lime)]/10 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-lime)] animate-pulse" />
              <span className="text-[var(--brand-lime)] text-[11px] font-bold uppercase tracking-wider">
                Live payout discovery
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-[1.05] tracking-tight mb-4">
              Compare GPT offers before you start
            </h1>

            <p className="text-base sm:text-lg text-white/55 leading-relaxed mb-8 max-w-2xl">
              Find current game and survey payouts, check platform trust, and use guides before you click out to a GPT site.
            </p>

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-left backdrop-blur-sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Live offers</div>
                <div className="mt-1 text-xl font-extrabold text-white">{stats.liveOfferCount}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-left backdrop-blur-sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Guides loaded</div>
                <div className="mt-1 text-xl font-extrabold text-white">{stats.guideCount}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-left backdrop-blur-sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Trust hubs</div>
                <div className="mt-1 text-xl font-extrabold text-white">Reviews</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-left backdrop-blur-sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Top payout now</div>
                <div className="mt-1 text-xl font-extrabold text-[var(--brand-lime)]">{formatMoney(stats.topPayout) ?? "—"}</div>
              </div>
            </div>

            <div className="mb-8 flex flex-wrap items-center justify-start gap-2.5">
              {["Compare live payouts", "Choose trusted platforms", "Complete milestones faster"].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-bold text-white/80"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-start gap-3">
              <Link
                href="/offers"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[var(--brand-lime)] text-[var(--brand-ink)] font-extrabold text-sm rounded-xl hover:bg-[color:hsl(84,93%,72%)] transition-all hover:-translate-y-px active:translate-y-0 shadow-lg shadow-[var(--brand-lime)]/20"
              >
                Compare Offers
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/guides"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 text-white font-bold text-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all"
              >
                Browse Guides
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-white py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #0d0d12 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          <div className="mb-8 max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-tertiary)] mb-3">
              Start Smart
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--brand-ink)] leading-tight">
              Start with the path that matches what you need
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)] max-w-2xl">
              New users should check platform trust first. Returning users can jump straight into live offer comparisons or game guides.
            </p>
          </div>

          <div className="max-w-5xl">
            <div className="grid items-start gap-12 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  What EarnGrind does
                </div>
                <h2 className="mt-5 max-w-2xl text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-[2.9rem] sm:leading-[0.96]">
                  A cleaner way to compare{" "}
                  <span className="text-[color:hsl(84,93%,36%)]">GPT payouts and platforms</span>
                </h2>
                <div className="mt-5 max-w-xl space-y-4 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                  <p>
                    GPT sites pay real money for game installs, offer milestones, signups, and surveys. The problem is that payouts differ by platform and change constantly.
                  </p>
                  <p>
                    EarnGrind compares those live offers, publishes game pages, and connects you to detailed guides so you can choose better routes before you start.
                  </p>
                  <p>
                    Use the homepage to move from platform trust to live payouts to guide support without guessing which page matters.
                  </p>
                </div>
              </div>

              <div className="min-w-0">
                <div className="mb-4 flex justify-end lg:mb-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    How It Works
                  </div>
                </div>
                <div className="space-y-4">
                  {HOW_IT_WORKS_STEPS.map((s, index) => (
                    <div key={s.step} className="grid gap-2 border-b border-[var(--border-default)] pb-4 last:border-b-0 last:pb-0">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                        Step {index + 1}
                      </div>
                      <h3 className="text-base font-extrabold text-[var(--brand-ink)]">{s.title}</h3>
                      <p className="max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-[var(--border-default)] bg-white px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Best first click</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                New visitors should start with <Link href="/best-gpt-sites" className="font-bold text-[var(--brand-ink)] underline decoration-lime-400 underline-offset-4">Best GPT Sites</Link>, then read the <Link href="/guides/best-gpt-sites-to-make-money" className="font-bold text-[var(--brand-ink)] underline decoration-lime-400 underline-offset-4">full GPT site guide</Link>. If you already trust the platform, go straight to <span className="font-bold text-[var(--brand-ink)]">Offers</span> for payout discovery or <span className="font-bold text-[var(--brand-ink)]">Guides</span> for faster completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface-muted)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div>
            <HomepageSectionHeader
              eyebrow="Games & Offers"
              title="Live Offers and Featured Games"
              description="Use this section to scan strong payouts, preview routes, and open a game page before starting."
            />
              <FeaturedOfferRail
                items={earnLabOfferRail}
                title="Featured EarnLab tasks"
                description="EarnLab-curated tasks matched to active offers on EarnGrind. Open a preview to compare milestones before clicking out."
              />
              <div className="mt-10">
                <FeaturedOfferRail
                  items={gainOfferRail}
                  title="Featured Gain.gg tasks"
                  description="Current featured tasks from Gain.gg's native wall. Review milestones and payout before opening the Gain wall."
                />
              </div>
              <div className="mt-10">
                <FeaturedOfferRail
                  items={cashInStyleOfferRail}
                  title="Featured CashInStyle tasks"
                  description="Current CashInStyle offers from EarnGrind's imported feed. Start buttons use the tracked CashInStyle deeplink flow."
                />
              </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-5xl">
          <HomepageSectionHeader
            eyebrow="Guides"
            title="Guides for completing offers"
            description="Use walkthroughs to understand milestones, time commitment, and payout checkpoints before starting."
          />
          <div>
            <div className="mb-4">
              <h3 className="text-2xl font-extrabold text-[var(--brand-ink)] tracking-tight">Game Guides</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl">
                Published walkthroughs that support milestone completion, payout optimization, and better internal linking into games and offers.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {popularGuides.slice(0, 2).map((guide) => (
                <HomepageLinkCard
                  key={guide.id}
                  href={`/guides/${guide.slug}`}
                  title={guide.title}
                  subtitle={guide.games?.name ? `${guide.games.name} guide` : "Guide"}
                  meta={guide.excerpt || guide.estimated_time || "Step-by-step guide for a high-value game offer."}
                  value={formatMoney(guide.max_payout_usd)}
                />
              ))}
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface-muted)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="section-label mb-3">FAQ</p>
            <h2 className="text-3xl font-extrabold text-[var(--brand-ink)] tracking-tight">
              Common questions from beginners
            </h2>
          </div>

          <div className="space-y-3">
            <FaqItem
              question="Is this actually real? Can I really earn money?"
              answer="Yes. The websites we list pay real money to millions of users. EarnGrind does not pay you directly. It helps you find the highest paying offers, game pages, and guides."
            />
            <FaqItem
              question="How much can I earn?"
              answer="It depends on the offers you choose. Simple tasks may pay a few dollars, while high-value game milestones can pay significantly more. Use the highest paying GPT offers and guide sections to prioritize better routes."
            />
            <FaqItem
              question="Do I need to pay anything to start?"
              answer="No. EarnGrind is free to use, and the linked GPT sites are free to join. Avoid anything that asks for upfront payment."
            />
            <FaqItem
              question="Why are there so many internal pages?"
              answer="Game pages, comparison pages, and guides serve different search intents. Linking them together helps users discover the right route faster and helps search engines understand site structure."
            />
          </div>
        </div>
      </section>

      <section
        className="py-20 px-4 sm:px-6 lg:px-8"
        style={{
          background: "linear-gradient(160deg, #0d0d12 0%, #1a1a2e 50%, #0d0d12 100%)",
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            Ready to earn your first dollar online?
          </h2>
          <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
            Start with the highest paying GPT offers, then use game guides to finish faster.
          </p>
          <Link
            href="/offers"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--brand-lime)] text-[var(--brand-ink)] font-extrabold text-base rounded-xl hover:bg-[color:hsl(84,93%,72%)] transition-all hover:-translate-y-px shadow-lg shadow-[var(--brand-lime)]/20"
          >
            Browse Offers - It&apos;s Free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <p className="mt-5 text-xs text-white/30 font-medium">
            No sign-up required. No credit card. No catch.
          </p>
        </div>
      </section>
    </main>
  );
}
