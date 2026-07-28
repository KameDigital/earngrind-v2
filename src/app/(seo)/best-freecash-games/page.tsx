import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import Container from "@/components/layout/Container";
import { buildBreadcrumbList, buildItemList, JsonLd } from "@/lib/seo-schema";
import FAQSection from "../components/FAQSection";
import OfferTable from "../components/OfferTable";
import ProviderComparison from "../components/ProviderComparison";
import { getBestPageData } from "../_lib/best-pages";
import { buildSeoMetadata, formatMoney } from "../_lib/seo-data";

export const revalidate = 3600;

const pathname = "/best-freecash-games";
const pageTitle = "Best Freecash Games and Offers (2026): Payouts, Easy Starts & Risks";
const pageDescription =
  "Compare the best Freecash games in 2026, including payout potential, tracking risks, Android/iPhone availability, and safer offer tips.";
const h1 = "Best Freecash Games and Offers (2026): Highest Payouts, Easiest Starts, and Tracking Risks";
const noFeedMessage =
  "EarnGrind does not currently have a live Freecash offer feed connected. This page is an editorial checklist and comparison guide.";

const config = {
  pathname,
  title: pageTitle,
  description: pageDescription,
  intro:
    "Freecash game offers can look attractive, but the real value depends on eligibility, tracking, device, country, milestone clarity, and whether spending is required.",
  platformFilter: "freecash",
};

export const metadata: Metadata = buildSeoMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pathname,
});

const sourceLinks = {
  freecashGames: "https://freecash.com/academy/en/discover/promo/app",
  googlePlay: "https://play.google.com/store/apps/details?id=com.freecash.app2",
  macRumors: "https://www.macrumors.com/2026/04/14/apple-pulls-freecash-app/",
};

const editorialExamples = [
  {
    game: "Monopoly GO",
    payout: "$680.06 advertised example",
    device: "Freecash page showed Apple",
    effort: "High",
    spending: "Medium/high",
    tracking: "Medium",
    bestFor: "Players who already like event-driven board builders and can stop if early milestones do not track.",
  },
  {
    game: "Royal Match",
    payout: "$390.17 advertised example",
    device: "Freecash page showed Apple and Android",
    effort: "Medium/high",
    spending: "Low/medium",
    tracking: "Medium",
    bestFor: "Puzzle players who can progress consistently without forcing purchases.",
  },
  {
    game: "RAID: Shadow Legends",
    payout: "$290.85 advertised example",
    device: "Freecash page showed Apple",
    effort: "High",
    spending: "Medium/high",
    tracking: "Medium/high",
    bestFor: "RPG players comfortable checking milestone terms before committing time or money.",
  },
];

const methodology = [
  "Payout potential after checking whether the headline number is realistic for a normal user.",
  "Time-to-first-credit, because early tracked milestones prove the install path is working.",
  "Milestone clarity, including whether the offer explains tasks, deadlines, and reward timing.",
  "Required spend and in-app purchase pressure before chasing later rewards.",
  "Tracking confidence from device consistency, app-store path, and support evidence quality.",
  "Country and device availability, since Freecash offers can differ by region and platform.",
  "Deadline realism for someone who is not treating the game like a full-time grind.",
];

const categoryAdvice = [
  {
    title: "Highest payout Freecash games",
    copy:
      "Treat the biggest advertised number as a ceiling, not a promise. Check whether the later milestones require aggressive play, purchases, or deadlines that are unrealistic for your schedule.",
  },
  {
    title: "Easiest starter Freecash games",
    copy:
      "Start with offers that have a quick first credit or a clear install-and-early-level path. A smaller tracked reward is more useful than a huge headline payout with vague requirements.",
  },
  {
    title: "Best no/low-spend Freecash offers",
    copy:
      "Prefer games where the first few rewards can be reached without buying packs. Avoid spending until tracking is confirmed whenever possible.",
  },
  {
    title: "Best strategy games on Freecash",
    copy:
      "Strategy and base-building offers can pay well, but they often depend on time gates, events, alliances, and paid boosts. Screenshot deadlines before installing.",
  },
  {
    title: "Offers to be cautious with",
    copy:
      "Be careful with offers that push deposits, cash competitions, unclear level wording, or late milestones that require spending more than you would normally spend.",
  },
];

const trackingChecklist = [
  "Confirm you are a new user for that game or app.",
  "Start only from the tracked Freecash offer path.",
  "Do not use a VPN, proxy, or emulator unless the terms explicitly allow it.",
  "Use one device consistently from install through completion.",
  "Screenshot the payout, deadline, tasks, device, country, and terms before installing.",
  "Allow app tracking or permissions where the offer terms require them.",
  "Check pending and credit timing before assuming a reward failed.",
  "Do not reinstall or switch app stores mid-offer.",
  "Contact support with screenshots if a completed milestone does not track.",
];

const faqItems = [
  {
    question: "What are the best Freecash games?",
    answer:
      "The best Freecash games are the ones with clear milestones, realistic deadlines, and early rewards that confirm tracking before you invest serious time. Freecash's own page has shown examples such as Monopoly GO, Royal Match, and RAID: Shadow Legends, but availability and payout values can change by country, device, and account.",
  },
  {
    question: "Does Freecash still work on Android?",
    answer:
      "Google Play currently shows a Freecash Android listing, but app-store availability can change. Verify the Google Play page directly before installing, and screenshot the offer terms before starting a game.",
  },
  {
    question: "Can iPhone users use Freecash?",
    answer:
      "iPhone availability may differ from Android and web access. MacRumors reported that Apple removed Freecash from the App Store in April 2026, so iPhone users should verify the current App Store or web path directly before starting an offer.",
  },
  {
    question: "Why do Freecash payouts vary?",
    answer:
      "Freecash payouts can vary by country, device, account eligibility, offerwall partner, campaign version, and timing. Do not assume another user's payout or an advertised example will match the offer shown in your account.",
  },
  {
    question: "Do Freecash games always track?",
    answer:
      "No offerwall game is guaranteed to track perfectly. Use the tracked offer link, avoid device or account changes, keep screenshots, and verify that early milestones pend before pushing into harder tasks.",
  },
  {
    question: "What should I do before spending money on a game offer?",
    answer:
      "Read every milestone, screenshot the requirements, confirm the first trackable steps credited, and compare the required spend against the realistic reward. If you would not spend that money without the offer, treat the risk as high.",
  },
  {
    question: "Are the highest-paying Freecash games always worth it?",
    answer:
      "Not always. The highest headline payouts often have the hardest milestones, longest deadlines, or strongest purchase pressure, so a lower-paying but clearer offer can be the better choice.",
  },
];

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="font-bold text-lime-700 underline-offset-4 hover:underline" href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function InternalButton({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand-ink)] px-4 py-2.5 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
          : "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] bg-white px-4 py-2.5 text-sm font-extrabold text-[var(--brand-ink)] transition-colors hover:border-lime-400 hover:bg-lime-50"
      }
    >
      {children}
      <ArrowRight aria-hidden className="h-4 w-4" />
    </Link>
  );
}

function SectionHeader({ label, title, copy }: { label: string; title: string; copy: string }) {
  return (
    <div>
      <p className="section-label">{label}</p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--brand-ink)]">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">{copy}</p>
    </div>
  );
}

export default async function BestFreecashGamesPage() {
  const { rows, providerRows } = await getBestPageData(config);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: h1,
    description: pageDescription,
    url: `https://earngrind.com${pathname}`,
    dateModified: "2026-05-27",
    author: { "@type": "Organization", name: "EarnGrind" },
    publisher: { "@type": "Organization", name: "EarnGrind" },
  };
  const schemas = [
    buildBreadcrumbList([
      { name: "Home", path: "/" },
      { name: "Best Freecash Games", path: pathname },
    ]),
    articleSchema,
    ...(rows.length > 0
      ? [
          buildItemList(
            rows.slice(0, 20).map((row) => ({
              name: `${row.gameName} on ${row.platformName}`,
              path: `/offers/${row.gameSlug}`,
              description: `${row.providerName} route with ${formatMoney(row.totalPayoutUsd)} total payout.`,
            })),
          ),
        ]
      : []),
  ];

  return (
    <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
      <JsonLd data={schemas} />
      <Container className="space-y-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--text-tertiary)]">
          <Link href="/" className="hover:text-lime-700">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--brand-ink)]">Best Freecash Games</span>
        </nav>
        <header className="rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)]">
          <div className="grid gap-6 lg:grid-cols-[1.45fr_0.85fr] lg:items-start">
            <div>
              <p className="section-label">Freecash editorial guide</p>
              <h1 className="mt-2 max-w-4xl text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] lg:text-4xl">
                {h1}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-[var(--text-secondary)]">
                Freecash can be useful for comparing paid game offers, but it is not guaranteed easy money. Use this page
                to judge offer fit, tracking risk, device availability, and spending pressure before you install.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <InternalButton href="/offers" primary>
                  Compare live EarnGrind offers
                </InternalButton>
                <InternalButton href="/best-gpt-sites">Best GPT sites</InternalButton>
                <InternalButton href="/highest-paying-gpt-games">Highest paying games</InternalButton>
                <InternalButton href="/best-gain-gg-offers">Gain.gg offers</InternalButton>
              </div>
              <p className="mt-4 text-xs font-semibold text-[var(--text-tertiary)]">Last reviewed May 27, 2026.</p>
            </div>

            <aside className="rounded-xl border border-lime-200 bg-lime-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-lime-700" aria-hidden />
                <div>
                  <p className="font-extrabold text-[var(--brand-ink)]">Status check before you start</p>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    <li>
                      <strong>Android:</strong> Google Play currently shows a Freecash Android listing. Verify it directly.
                    </li>
                    <li>
                      <strong>iPhone:</strong> MacRumors reported Apple removed Freecash from the App Store in April 2026.
                    </li>
                    <li>
                      <strong>Payouts:</strong> Country, device, account eligibility, and offer version can change the number.
                    </li>
                    <li>
                      <strong>Proof:</strong> Screenshot requirements before installing or spending.
                    </li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </header>

        {rows.length === 0 ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-[var(--shadow-card)]">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-amber-700" aria-hidden />
              <div>
                <h2 className="text-lg font-extrabold text-[var(--brand-ink)]">No live Freecash feed is connected</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{noFeedMessage}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  For live EarnGrind inventory, use <Link className="font-bold text-lime-700 hover:underline" href="/offers">all offers</Link>.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <SectionHeader
              label="Live EarnGrind Freecash feed"
              title="Current tracked Freecash rows"
              copy="These rows appear only when EarnGrind has a real Freecash platform/source connected. Verify the live offer terms before starting."
            />
            <OfferTable rows={rows} title="Live Freecash Offers" />
            <ProviderComparison rows={providerRows} />
          </section>
        )}

        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <SectionHeader
            label="Editorial examples"
            title="Best Freecash games to check first"
            copy="Freecash's own page has shown these game examples and payout figures. They are editorial references, not EarnGrind live payouts."
          />
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[860px] w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                  {["Game", "Advertised/current payout example", "Device", "Effort", "Spending risk", "Tracking risk", "Best for"].map((heading) => (
                    <th key={heading} className="border-b border-[var(--border-default)] px-3 py-2 font-extrabold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {editorialExamples.map((example) => (
                  <tr key={example.game} className="align-top">
                    <td className="border-b border-[var(--border-default)] px-3 py-3 font-extrabold text-[var(--brand-ink)]">{example.game}</td>
                    <td className="border-b border-[var(--border-default)] px-3 py-3">{example.payout}</td>
                    <td className="border-b border-[var(--border-default)] px-3 py-3">{example.device}</td>
                    <td className="border-b border-[var(--border-default)] px-3 py-3">{example.effort}</td>
                    <td className="border-b border-[var(--border-default)] px-3 py-3">{example.spending}</td>
                    <td className="border-b border-[var(--border-default)] px-3 py-3">{example.tracking}</td>
                    <td className="border-b border-[var(--border-default)] px-3 py-3 text-[var(--text-secondary)]">{example.bestFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--text-tertiary)]">
            Source: <ExternalLink href={sourceLinks.freecashGames}>Freecash games page</ExternalLink>. Availability and payouts can change; verify directly before starting.
          </p>
        </section>

        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <SectionHeader
            label="Ranking method"
            title="How we rank Freecash games"
            copy="The best offer is the one you can complete cleanly, not always the one with the biggest headline payout."
          />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {methodology.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-lime-700" aria-hidden />
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <SectionHeader
            label="Offer strategy"
            title="Which Freecash offers are worth your time?"
            copy="Use these categories to decide whether an offer fits your time, budget, and tracking risk."
          />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {categoryAdvice.map((item) => (
              <article key={item.title} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
                <h3 className="text-base font-extrabold text-[var(--brand-ink)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <SectionHeader
            label="Before install"
            title="Freecash tracking checklist before you install"
            copy="Most avoidable tracking problems happen before the first app open. Capture proof and keep the setup consistent."
          />
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {trackingChecklist.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-lime-700" aria-hidden />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <SectionHeader
            label="Trust and availability"
            title="Is Freecash worth it in 2026?"
            copy="Freecash can be worth testing if you already understand GPT and offerwall tracking. It should not be treated as guaranteed income."
          />
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
              <h3 className="font-extrabold text-[var(--brand-ink)]">Android status</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                Google Play currently shows the Freecash Android app live. Check the listing directly before installing:{" "}
                <ExternalLink href={sourceLinks.googlePlay}>Google Play Freecash listing</ExternalLink>.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
              <h3 className="font-extrabold text-[var(--brand-ink)]">iPhone context</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                MacRumors reported Apple removed Freecash from the App Store on April 14, 2026. Verify current iPhone availability directly:{" "}
                <ExternalLink href={sourceLinks.macRumors}>MacRumors coverage</ExternalLink>.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
              <h3 className="font-extrabold text-[var(--brand-ink)]">Spending risk</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                Do not treat advertised maximum payouts as guaranteed. Spending money to chase uncertain rewards is risky, especially when later milestones have strict deadlines.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-xl font-extrabold text-[var(--brand-ink)]">Related EarnGrind pages</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 font-bold hover:bg-[var(--surface-muted)]" href="/offers">All Offers</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 font-bold hover:bg-[var(--surface-muted)]" href="/best-gpt-sites">Best GPT Sites</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 font-bold hover:bg-[var(--surface-muted)]" href="/highest-paying-gpt-games">Highest Paying GPT Games</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 font-bold hover:bg-[var(--surface-muted)]" href="/best-gain-gg-offers">Best Gain.gg Offers</Link>
          </div>
        </section>

        <FAQSection items={faqItems} />
      </Container>
    </main>
  );
}
