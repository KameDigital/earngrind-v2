import Link from "next/link";
import Container from "@/components/layout/Container";
import { buildBreadcrumbList, buildItemList, JsonLd } from "@/lib/seo-schema";
import FAQSection from "./FAQSection";
import OfferTable from "./OfferTable";
import ProviderComparison from "./ProviderComparison";
import { formatMoney, type SeoOfferRow } from "../_lib/seo-data";

type BestOffersPageTemplateProps = {
  label: string;
  pathname: string;
  title: string;
  intro: string;
  rows: SeoOfferRow[];
  providerRows: Array<{
    providerName: string;
    offers: number;
    bestPayoutUsd: number;
    avgPayoutUsd: number;
    platformCount: number;
  }>;
};

export default function BestOffersPageTemplate({
  label,
  pathname,
  title,
  intro,
  rows,
  providerRows,
}: BestOffersPageTemplateProps) {
  const best = rows[0];
  const faqItems = [
    {
      question: "How are these offers ranked?",
      answer: "Offers are ranked by normalized payout in USD using the latest values from the offer feed.",
    },
    {
      question: "How often does this page update?",
      answer: "This page is regenerated periodically and reflects new payouts as provider data changes.",
    },
    {
      question: "Do payouts vary by region or device?",
      answer: "Yes. Final payouts can vary based on geo, platform, and eligibility rules on each provider.",
    },
  ];
  const schemas = [
    buildBreadcrumbList([
      { name: "Home", path: "/" },
      { name: title, path: pathname },
    ]),
    buildItemList(
      rows.slice(0, 20).map((row) => ({
        name: `${row.gameName} on ${row.platformName}`,
        path: `/offers/${row.gameSlug}`,
        description: `${row.providerName} route with ${formatMoney(row.totalPayoutUsd)} total payout.`,
      })),
    ),
  ];

  return (
    <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
      <JsonLd data={schemas} />
      <Container className="space-y-6">
        <header className="rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)]">
          <p className="section-label">{label}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--brand-ink)]">{title}</h1>
          <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">{intro}</p>
          {best ? (
            <p className="mt-3 text-sm font-semibold text-[var(--text-secondary)]">
              Current top payout: <span className="text-[var(--brand-ink)]">{formatMoney(best.payoutUsd)}</span> on {best.platformName} ({best.providerName}).
            </p>
          ) : null}
        </header>

        <OfferTable rows={rows} title="Top 20 Offers" />
        <ProviderComparison rows={providerRows} />

        <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-xl font-extrabold text-[var(--brand-ink)]">Related SEO Pages</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/best-gpt-sites">Best GPT Sites</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/highest-paying-gpt-games">Highest Paying GPT Games</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/best-money-making-games">Best Money-Making Games</Link>
            <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/guides/how-to-earn">Offer Guides</Link>
          </div>
        </section>

        <FAQSection items={faqItems} />
      </Container>
    </main>
  );
}
