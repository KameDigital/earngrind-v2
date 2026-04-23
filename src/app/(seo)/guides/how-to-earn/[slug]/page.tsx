import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import FAQSection from "../../../components/FAQSection";
import OfferTable from "../../../components/OfferTable";
import ProviderComparison from "../../../components/ProviderComparison";
import {
  buildProviderComparison,
  buildSeoMetadata,
  formatMoney,
  getGameSeoData,
  getStaticGameSlugs,
  mapComparisonToSeoRows,
} from "../../../_lib/seo-data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getStaticGameSlugs(80);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getGameSeoData(params.slug);
  if (!data) {
    return buildSeoMetadata({
      title: "Guide Not Found | EarnGrind",
      description: "The guide you requested does not exist.",
      path: `/guides/how-to-earn/${params.slug}`,
    });
  }

  const maxPayout = data.comparison.summary.best_total_payout_usd || data.summary.max_payout_usd || 0;
  return buildSeoMetadata({
    title: `How to Earn with ${data.game.name} Offers - Up To ${formatMoney(maxPayout)}`,
    description: `Step-by-step ${data.game.name} guide with payout breakdown, provider comparison, and milestone tasks.`,
    path: `/guides/how-to-earn/${params.slug}`,
  });
}

export default async function GameGuidePage({ params }: { params: { slug: string } }) {
  const data = await getGameSeoData(params.slug);
  if (!data) notFound();

  const rows = mapComparisonToSeoRows(data.comparison.offers, { name: data.game.name, slug: data.game.slug }).sort(
    (a, b) => b.payoutUsd - a.payoutUsd,
  );
  const providerRows = buildProviderComparison(rows);
  const topOffer = rows[0];
  const milestones = topOffer?.tasks ?? [];

  const steps = [
    `Choose a provider with strong payout and clear milestone structure (current best: ${topOffer ? `${topOffer.providerName} on ${topOffer.platformName}` : "N/A"}).`,
    "Read every requirement before starting the offer, including device and region restrictions.",
    "Complete milestones in order and keep screenshots of progress where possible.",
    "Finish verification steps and monitor crediting windows before contacting support.",
  ];

  const faqItems = [
    {
      question: `How much can I earn from ${data.game.name}?`,
      answer: `Current max tracked payout is ${formatMoney(data.comparison.summary.best_total_payout_usd || data.summary.max_payout_usd || 0)}.`,
    },
    {
      question: "Which provider should I start with?",
      answer: topOffer
        ? `${topOffer.providerName} currently has the top payout at ${formatMoney(topOffer.payoutUsd)}.`
        : "Choose the provider with the highest payout and clearest milestone rules.",
    },
    {
      question: "Where can I compare alternative providers?",
      answer: "Use the provider comparison table below and cross-check payout values before clicking through.",
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
      <Container className="space-y-6">
        <header className="rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)]">
          <p className="section-label">Guide</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[var(--brand-ink)] tracking-tight">How To Earn With {data.game.name}</h1>
          <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">
            This guide combines payout data and milestone structure so you can complete {data.game.name} offers with fewer mistakes and better ROI.
          </p>
        </header>

        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Overview</h2>
          <p className="mt-3 text-[var(--text-secondary)]">
            {data.game.name} has {rows.length} active offer rows across {providerRows.length} providers. Max single payout is{" "}
            {formatMoney(data.comparison.summary.best_single_payout_usd || data.summary.max_payout_usd || 0)}, and the best
            total milestone path reaches {formatMoney(data.comparison.summary.best_total_payout_usd || data.summary.max_payout_usd || 0)}.
          </p>
        </section>

        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Payout Breakdown</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[var(--surface-muted)] p-3">
              <p className="text-xs uppercase text-[var(--text-tertiary)]">Offers</p>
              <p className="text-2xl font-extrabold text-[var(--brand-ink)]">{rows.length}</p>
            </div>
            <div className="rounded-xl bg-[var(--surface-muted)] p-3">
              <p className="text-xs uppercase text-[var(--text-tertiary)]">Best Single Payout</p>
              <p className="text-2xl font-extrabold text-[var(--brand-ink)]">
                {formatMoney(data.comparison.summary.best_single_payout_usd || data.summary.max_payout_usd || 0)}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--surface-muted)] p-3">
              <p className="text-xs uppercase text-[var(--text-tertiary)]">Best Total Payout</p>
              <p className="text-2xl font-extrabold text-[var(--brand-ink)]">
                {formatMoney(data.comparison.summary.best_total_payout_usd || data.summary.max_payout_usd || 0)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Step-by-Step Tips</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Milestones (Task List)</h2>
          {milestones.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--text-tertiary)]">No milestone task list is currently available for the top offer.</p>
          ) : (
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
              {milestones.map((task) => (
                <li key={task.id}>
                  {task.title}
                  {task.reward_amount > 0 ? ` (${formatMoney(task.reward_amount)})` : ""}
                </li>
              ))}
            </ol>
          )}
        </section>

        <OfferTable rows={rows} title="Provider Offer Table" showTasks compact />
        <ProviderComparison rows={providerRows} />

        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-xl font-extrabold text-[var(--brand-ink)]">Internal Links</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href={`/games/${data.game.slug}`}>
              {data.game.name} offer comparison
            </Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/best-gpt-sites">
              Best GPT Sites
            </Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/highest-paying-gpt-games">
              Highest Paying GPT Games
            </Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/guides/how-to-earn">
              More guides
            </Link>
          </div>
        </section>

        <FAQSection items={faqItems} />
      </Container>
    </main>
  );
}
