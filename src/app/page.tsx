import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HomepageSectionHeader from "@/components/home/HomepageSectionHeader";
import HomepageLinkCard from "@/components/home/HomepageLinkCard";
import FeaturedOfferRail, { type FeaturedOfferRailItem } from "@/components/home/FeaturedOfferRail";

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
    url: "/",
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

type OfferRow = {
  id: string;
  source: string | null;
  title: string | null;
  game_id: string | null;
  game_name: string | null;
  game_slug: string | null;
  game_thumbnail: string | null;
  image_url?: string | null;
  provider_name: string | null;
  platform_name: string | null;
  platform_logo?: string | null;
  payout_usd: number | null;
  goal_text: string | null;
};

type GuideRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  difficulty: string | null;
  estimated_time: string | null;
  max_payout_usd: number | null;
  published_at: string | null;
  games: {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
  } | null;
};

type RawGuideRow = Omit<GuideRow, "games"> & {
  games: GuideRow["games"] | GuideRow["games"][];
};

type ReviewRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  rating_overall: number | null;
  platforms:
    | {
        name: string;
        slug: string;
      }
    | {
        name: string;
        slug: string;
      }[]
    | null;
};

type FeaturedGame = {
  slug: string;
  name: string;
  thumbnail: string | null;
  topPayout: number;
  provider: string;
};

type HomepageRailOffer = OfferRow & {
  badge: string;
  image_url: string | null;
};

type HomepageData = {
  featuredGames: FeaturedGame[];
  highestPayingOffers: HomepageRailOffer[];
  popularGuides: GuideRow[];
  stats: {
    liveOfferCount: number;
    guideCount: number;
    topPayout: number | null;
  };
};

function formatMoney(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return `$${value.toFixed(2)}`;
}

async function getHomepageData(): Promise<HomepageData> {
  const supabase = createClient();
  const guideSelect =
    "id, title, slug, excerpt, difficulty, estimated_time, max_payout_usd, published_at, games(id, name, slug, thumbnail_url)";

  const [offersResult, popularGuidesResult] = await Promise.all([
    supabase
      .from("unified_offers_view")
      .select("id, source, title, game_id, game_name, game_slug, game_thumbnail, provider_name, platform_name, platform_logo, payout_usd, goal_text")
      .order("payout_usd", { ascending: false })
      .limit(24),
    supabase
      .from("guides")
      .select(guideSelect)
      .eq("status", "published")
      .order("max_payout_usd", { ascending: false })
      .limit(6),
  ]);

  const offerRows = (offersResult.data ?? []) as OfferRow[];
  const manualOfferIds = offerRows
    .filter((row) => row.source === "manual")
    .map((row) => row.id);

  const { data: manualOfferImages } = manualOfferIds.length
    ? await supabase
        .from("site_offers")
        .select("id, image_url")
        .in("id", manualOfferIds)
    : { data: [] as Array<{ id: string; image_url: string | null }> };

  const manualOfferImageMap = new Map(
    (manualOfferImages ?? []).map((row) => [row.id, row.image_url ?? null]),
  );

  const enrichedOfferRows = offerRows.map((row) => ({
    ...row,
    image_url:
      row.source === "manual"
        ? manualOfferImageMap.get(row.id) ?? null
        : null,
  }));

  const bestImageByGameSlug = new Map(
    enrichedOfferRows
      .filter((row) => row.game_slug)
      .map((row) => [
        row.game_slug!,
        row.image_url ?? row.game_thumbnail ?? row.platform_logo ?? null,
      ]),
  );

  const featuredGames: FeaturedGame[] = Array.from(
    new Map(
      enrichedOfferRows
        .filter((row) => row.game_slug)
        .map((row) => [
          row.game_slug!,
          {
            slug: row.game_slug!,
            name: row.game_name ?? "Unknown Game",
            thumbnail:
              bestImageByGameSlug.get(row.game_slug!) ??
              row.game_thumbnail,
            topPayout: row.payout_usd ?? 0,
            provider: row.provider_name ?? "Unknown Provider",
          },
        ]),
    ).values(),
  ).slice(0, 6);

  const highestPayingOffers: HomepageData["highestPayingOffers"] = Array.from(
    new Map(
      enrichedOfferRows
        .map((row) => ({
          ...row,
          image_url:
            row.image_url ??
            row.game_thumbnail ??
            row.platform_logo ??
            null,
        }))
        .filter((row) => row.game_slug || row.game_name)
        .map((row) => [
          row.game_slug ?? row.game_name ?? row.id,
          {
            ...row,
            badge: "Live offer",
            image_url:
              row.game_thumbnail ??
              row.platform_logo ??
              null,
          },
        ]),
    ).values(),
  ).slice(0, 6);

  const normalizeGuides = (rows: RawGuideRow[] | null | undefined): GuideRow[] =>
    (rows ?? []).map((row) => ({
      ...row,
      games: Array.isArray(row.games) ? row.games[0] ?? null : row.games,
    }));

  const uniqueGuideIds = new Set(
    normalizeGuides((popularGuidesResult.data ?? []) as RawGuideRow[])
      .map((guide) => guide.id),
  );

  return {
    featuredGames,
    highestPayingOffers,
    popularGuides: normalizeGuides((popularGuidesResult.data ?? []) as RawGuideRow[]),
    stats: {
      liveOfferCount: offerRows.length,
      guideCount: uniqueGuideIds.size,
      topPayout: offerRows[0]?.payout_usd ?? null,
    },
  };
}

export default async function HomePage() {
  const { featuredGames, highestPayingOffers, popularGuides, stats } =
    await getHomepageData();
  const compactOfferRail: FeaturedOfferRailItem[] = [
    ...featuredGames.map((game) => ({
      id: `game-${game.slug}`,
      href: `/games/${game.slug}`,
      title: game.name,
      badge: "Game page",
      provider: game.provider,
      payout: formatMoney(game.topPayout) ?? null,
      imageUrl: game.thumbnail,
    })),
    ...highestPayingOffers.map((offer) => ({
      id: `offer-${offer.id}`,
      href: offer.game_slug ? `/games/${offer.game_slug}` : "/offers",
      title: offer.title?.trim() || offer.game_name || "Offer",
      badge: offer.badge,
      provider: offer.platform_name,
      platform: offer.provider_name,
      payout: formatMoney(offer.payout_usd) ?? null,
      secondaryValue: offer.goal_text ? offer.goal_text : null,
      imageUrl: offer.image_url,
    })),
  ];

  return (
    <main className="min-h-screen">
      <section
        className="relative overflow-hidden pt-14 pb-14 sm:pt-16 sm:pb-16 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, rgba(10,12,10,0.88) 0%, rgba(10,12,10,0.65) 50%, rgba(10,12,10,0.85) 100%),
            url("/hero-home.png")
          `,
          backgroundSize: "cover",
          backgroundPosition: "center half",
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
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--brand-lime)]/30 bg-[var(--brand-lime)]/10 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-lime)] animate-pulse" />
              <span className="text-[var(--brand-lime)] text-[11px] font-bold uppercase tracking-wider">
                Updated Daily
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-[1.05] tracking-tight mb-4">
              Find the <span className="text-[var(--brand-lime)]">highest-paying GPT offers</span> and finish them faster
            </h1>

            <p className="text-base sm:text-lg text-white/55 leading-relaxed mb-8 max-w-2xl mx-auto">
              EarnGrind helps you compare real payouts, choose trustworthy GPT sites, and use game guides to reach milestones faster. Start with the best current route instead of guessing.
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
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Curated sections</div>
                <div className="mt-1 text-xl font-extrabold text-white">2</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-left backdrop-blur-sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Top payout now</div>
                <div className="mt-1 text-xl font-extrabold text-[var(--brand-lime)]">{formatMoney(stats.topPayout) ?? "—"}</div>
              </div>
            </div>

            <div className="mb-8 flex flex-wrap items-center justify-center gap-2.5">
              {["Compare live payouts", "Choose trusted platforms", "Complete milestones faster"].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-bold text-white/80"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/offers"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[var(--brand-lime)] text-[var(--brand-ink)] font-extrabold text-sm rounded-xl hover:bg-[color:hsl(84,93%,72%)] transition-all hover:-translate-y-px active:translate-y-0 shadow-lg shadow-[var(--brand-lime)]/20"
              >
                Find High-Paying Offers
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/guides"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 text-white font-bold text-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all"
              >
                Use Guides to Finish Faster
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
              Learn the system, then take the highest-signal path into offers and guides
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)] max-w-2xl">
              If you are new, start with trust and payout discovery. If you already know the platform, jump straight into live offers or a guide built to get you through milestones faster.
            </p>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="grid items-start gap-12 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  What Is EarnGrind?
                </div>
                <h2 className="mt-5 max-w-2xl text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-[2.9rem] sm:leading-[0.96]">
                  Your shortcut to the{" "}
                  <span className="text-[color:hsl(84,93%,36%)]">best-paying GPT offers</span>
                </h2>
                <div className="mt-5 max-w-xl space-y-4 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                  <p>
                    GPT sites pay real money for game installs, offer milestones, signups, and surveys. The problem is that payouts differ by platform and change constantly.
                  </p>
                  <p>
                    EarnGrind compares those live offers, publishes game pages, and connects you to detailed guides so you can choose better routes before you start.
                  </p>
                  <p>
                    The homepage now links directly into the highest-value games, latest guides, and core SEO hubs that support your next click.
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
                New visitors should start with <span className="font-bold text-[var(--brand-ink)]">Best GPT Sites</span>. If you already trust the platform, go straight to <span className="font-bold text-[var(--brand-ink)]">Offers</span> for payout discovery or <span className="font-bold text-[var(--brand-ink)]">Guides</span> for faster completion.
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
              title="Featured Games and Highest Paying GPT Offers"
              description="Jump into top game pages first, then compare the highest-value live offers feeding those routes."
            />
              <FeaturedOfferRail
                items={compactOfferRail}
                title="Top Offers"
                description="Compact live routes and game pages in one rail so users can scan images, payout, and click into the strongest path faster."
              />
          </div>
        </div>
      </section>

      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <HomepageSectionHeader
            eyebrow="Guides"
            title="Game Guides and Latest Guides"
            description="Browse established high-value guides first, then review the newest published walkthroughs feeding internal links into games and offers."
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
