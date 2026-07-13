import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { buildSeoMetadata, formatMoney, getTopOffers } from "../../_lib/seo-data";

export const revalidate = 3600;

export const metadata: Metadata = buildSeoMetadata({
  title: "GPT Offer Guides by Game",
  description: "Browse game-specific GPT earning guides with payout breakdowns and milestone strategy.",
  path: "/guides/how-to-earn",
});

type RankedGame = {
  slug: string;
  name: string;
  bestPayoutUsd: number;
  averagePayoutUsd: number;
  offers: number;
  platforms: string[];
  providers: string[];
  sampleGoal: string | null;
};

const QUICK_FILTERS = ["All", "Highest payout", "Beginner route", "Mobile", "Multi-site", "No-spend check"];

const TRUST_NOTES = [
  {
    title: "Pick the best route first",
    description: "Compare the strongest payout, platform count, and provider spread before opening a game-specific guide.",
  },
  {
    title: "Watch the deadline",
    description: "Higher payouts often mean longer progression, purchase pressure, or a narrow completion window.",
  },
  {
    title: "Capture milestone proof",
    description: "Keep screenshots of install, level milestones, purchases, and support tickets in case tracking fails.",
  },
];

const CHECKLIST_STEPS = [
  {
    title: "1. Check payout multiples",
    description: "Before downloading a game, compare whether another platform has the same offer at a meaningfully higher reward.",
  },
  {
    title: "2. Know the task chain",
    description: "Read the guide before starting. Late-game milestones can change the real hourly value even when the headline payout is high.",
  },
  {
    title: "3. Preserve tracking proof",
    description: "Screenshots, timestamps, and support-ready notes make it easier to recover missing credit without guessing later.",
  },
];

function difficultyFor(game: RankedGame) {
  if (game.bestPayoutUsd >= 300) return "Hard";
  if (game.bestPayoutUsd >= 100) return "Medium";
  return "Easy";
}

function timeEstimateFor(game: RankedGame) {
  if (game.bestPayoutUsd >= 300) return "14-30 days";
  if (game.bestPayoutUsd >= 100) return "7-21 days";
  return "Same week";
}

function GuideButton({ href, children, dark = false }: { href: string; children: string; dark?: boolean }) {
  return (
    <Link
      href={href}
      className={dark
        ? "inline-flex items-center justify-center bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-lime-500 hover:text-slate-950"
        : "inline-flex items-center justify-center border border-[var(--border-default)] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-950 transition hover:border-lime-400 hover:bg-lime-50"}
    >
      {children}
    </Link>
  );
}

function RankedTable({ games }: { games: RankedGame[] }) {
  return (
    <section className="overflow-hidden bg-slate-950 text-white shadow-[0_22px_55px_rgba(2,6,23,0.22)]" aria-labelledby="ranked-table-heading">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <h2 id="ranked-table-heading" className="text-xs font-black uppercase tracking-[0.18em] text-lime-300">
          At-a-glance game guide overview
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Live offer data
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-left text-xs">
          <thead className="bg-slate-900 text-[10px] uppercase tracking-[0.16em] text-slate-400">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Game</th>
              <th className="px-4 py-3">Offers</th>
              <th className="px-4 py-3">Best payout</th>
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3">Est. time</th>
              <th className="px-4 py-3">Route</th>
            </tr>
          </thead>
          <tbody>
            {games.slice(0, 12).map((game, index) => (
              <tr key={game.slug} className="border-t border-slate-800 odd:bg-slate-950 even:bg-slate-900/55">
                <td className="px-4 py-3 font-black text-lime-300">#{index + 1}</td>
                <td className="px-4 py-3">
                  <Link href={`/guides/how-to-earn/${game.slug}`} className="font-black uppercase tracking-[-0.02em] text-white hover:text-lime-300">
                    {game.name}
                  </Link>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {game.platforms.slice(0, 2).join(" / ") || "Tracked platforms"}
                  </p>
                </td>
                <td className="px-4 py-3 font-bold text-slate-300">{game.offers}</td>
                <td className="px-4 py-3 font-black text-white">{formatMoney(game.bestPayoutUsd)}</td>
                <td className="px-4 py-3">
                  <span className="bg-lime-400 px-2 py-1 text-[10px] font-black uppercase text-slate-950">
                    {difficultyFor(game)}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-emerald-300">{timeEstimateFor(game)}</td>
                <td className="px-4 py-3">
                  <GuideButton href={`/guides/how-to-earn/${game.slug}`}>Open guide</GuideButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GameGuideCard({ game, rank }: { game: RankedGame; rank: number }) {
  const difficulty = difficultyFor(game);
  const isHard = difficulty === "Hard";
  const isMedium = difficulty === "Medium";
  const tone = isHard
    ? "from-rose-50 via-white to-pink-50 border-rose-100"
    : isMedium
      ? "from-amber-50 via-white to-lime-50 border-amber-100"
      : "from-emerald-50 via-white to-cyan-50 border-emerald-100";

  return (
    <article className={`border bg-gradient-to-br ${tone} p-5 shadow-[var(--shadow-card)]`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-lime-300">
              #{rank}
            </span>
            <span className="border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              {difficulty}
            </span>
            <span className="border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              {game.offers} offers
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-[-0.05em] text-slate-950">
            {game.name}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
            {game.sampleGoal || `Compare current ${game.name} routes, payout ceilings, milestone strategy, and realistic completion risk before starting.`}
          </p>
        </div>
        <div className="grid min-w-[220px] grid-cols-3 gap-2 text-center">
          <div className="border border-slate-200 bg-white px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Best payout</p>
            <p className="mt-1 text-sm font-black text-slate-950">{formatMoney(game.bestPayoutUsd)}</p>
          </div>
          <div className="border border-slate-200 bg-white px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Average</p>
            <p className="mt-1 text-sm font-black text-slate-950">{formatMoney(game.averagePayoutUsd)}</p>
          </div>
          <div className="border border-slate-200 bg-white px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Estimate</p>
            <p className="mt-1 text-sm font-black text-slate-950">{timeEstimateFor(game)}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Route signals</h3>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[var(--text-secondary)]">
            <li>Best live payout: <strong className="text-slate-950">{formatMoney(game.bestPayoutUsd)}</strong></li>
            <li>Tracked across {game.platforms.length || 1} platform{game.platforms.length === 1 ? "" : "s"} and {game.providers.length || 1} provider{game.providers.length === 1 ? "" : "s"}.</li>
            <li>Use the guide to compare milestones before opening a partner route.</li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">Watchouts</h3>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[var(--text-secondary)]">
            <li>Confirm country and device eligibility before install.</li>
            <li>Keep screenshots at every major milestone and purchase step.</li>
            <li>Higher payouts can require longer sessions or late-game progression.</li>
          </ul>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
        {game.platforms.slice(0, 4).map((platform) => (
          <span key={platform} className="border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">
            {platform}
          </span>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          <GuideButton href={`/guides/how-to-earn/${game.slug}`}>Strategy guide</GuideButton>
          <GuideButton href={`/games/${game.slug}`}>Offers</GuideButton>
          <GuideButton href={`/guides/how-to-earn/${game.slug}`} dark>Open guide</GuideButton>
        </div>
      </div>
    </article>
  );
}

export default async function HowToEarnGuidesIndexPage() {
  const offers = await getTopOffers({ perPage: 120, minPayoutUsd: 1 });
  const games = offers
    .filter((offer) => offer.game)
    .reduce<RankedGame[]>((acc, offer) => {
      const game = offer.game!;
      const existing = acc.find((row) => row.slug === game.slug);
      const platformName = offer.platform?.name?.trim();
      const providerName = offer.provider_name?.trim();
      if (existing) {
        existing.offers += 1;
        existing.bestPayoutUsd = Math.max(existing.bestPayoutUsd, offer.payout_usd);
        existing.averagePayoutUsd += offer.payout_usd;
        if (platformName && !existing.platforms.includes(platformName)) existing.platforms.push(platformName);
        if (providerName && !existing.providers.includes(providerName)) existing.providers.push(providerName);
        if (!existing.sampleGoal && offer.goal_text) existing.sampleGoal = offer.goal_text;
      } else {
        acc.push({
          slug: game.slug,
          name: game.name,
          bestPayoutUsd: offer.payout_usd,
          averagePayoutUsd: offer.payout_usd,
          offers: 1,
          platforms: platformName ? [platformName] : [],
          providers: providerName ? [providerName] : [],
          sampleGoal: offer.goal_text ?? null,
        });
      }
      return acc;
    }, [])
    .map((game) => ({
      ...game,
      averagePayoutUsd: game.offers > 0 ? game.averagePayoutUsd / game.offers : game.averagePayoutUsd,
    }))
    .sort((a, b) => b.bestPayoutUsd - a.bestPayoutUsd)
    .slice(0, 24);

  const topGame = games[0] ?? null;
  const totalOffers = games.reduce((sum, game) => sum + game.offers, 0);

  return (
    <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-8">
      <Container className="space-y-7">
        <header>
          <nav className="mb-6 flex items-center gap-2 text-[11px] font-bold text-[var(--text-tertiary)]" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[var(--brand-ink)]">Home</Link>
            <span>/</span>
            <Link href="/guides" className="hover:text-[var(--brand-ink)]">Guides</Link>
            <span>/</span>
            <span className="text-[var(--brand-ink)]">How to earn</span>
          </nav>
          <p className="section-label">Estimated earning paths</p>
          <h1 className="mt-2 max-w-5xl text-4xl font-black uppercase tracking-[-0.06em] text-[var(--brand-ink)] sm:text-5xl">
            Top GPT game offer guides ranked by live payout
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            Not all reward games are created equal. Compare the strongest game routes by payout ceiling, offer count, provider spread, and completion risk before you install.
          </p>
        </header>

        {games.length > 0 && <RankedTable games={games} />}

        <section className="grid gap-4 border border-[var(--border-default)] bg-white p-4 shadow-[var(--shadow-card)] md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map((filter, index) => (
              <span
                key={filter}
                className={index === 0
                  ? "bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white"
                  : "border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-secondary)]"}
              >
                {filter}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="border border-[var(--border-default)] px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Games</p>
              <p className="text-sm font-black text-[var(--brand-ink)]">{games.length}</p>
            </div>
            <div className="border border-[var(--border-default)] px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Offers</p>
              <p className="text-sm font-black text-[var(--brand-ink)]">{totalOffers}</p>
            </div>
            <div className="border border-[var(--border-default)] px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Top payout</p>
              <p className="text-sm font-black text-[var(--brand-ink)]">{topGame ? formatMoney(topGame.bestPayoutUsd) : "$0.00"}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {TRUST_NOTES.map((note) => (
            <div key={note.title} className="border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-sm font-black uppercase tracking-[-0.02em] text-[var(--brand-ink)]">{note.title}</h2>
              <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">{note.description}</p>
            </div>
          ))}
        </section>

        <section className="space-y-5" aria-labelledby="ranked-guides-heading">
          <div>
            <p className="section-label">Ranked guides</p>
            <h2 id="ranked-guides-heading" className="mt-2 text-2xl font-black uppercase tracking-[-0.05em] text-[var(--brand-ink)]">
              Game routes to compare before starting
            </h2>
          </div>
          <div className="space-y-5">
            {games.map((game, index) => (
              <GameGuideCard key={game.slug} game={game} rank={index + 1} />
            ))}
          </div>
        </section>

        <section className="bg-slate-950 p-6 text-white shadow-[0_22px_55px_rgba(2,6,23,0.2)]" aria-labelledby="checklist-heading">
          <h2 id="checklist-heading" className="text-lg font-black uppercase tracking-[-0.03em] text-lime-300">
            GPT game guide evaluation checklist
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {CHECKLIST_STEPS.map((step) => (
              <div key={step.title}>
                <h3 className="text-sm font-black text-white">{step.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}