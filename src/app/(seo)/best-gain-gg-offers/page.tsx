import type { Metadata } from "next";
import BestOffersPageTemplate from "../components/BestOffersPageTemplate";
import { getBestPageData, getBestPageMetadata } from "../_lib/best-pages";

export const revalidate = 3600;

const config = {
  pathname: "/best-gain-gg-offers",
  title: "Best Gain.gg Offers",
  description: "Top Gain.gg offers sorted by payout with provider-level comparison.",
  intro:
    "Gain.gg campaigns are ranked here by normalized payout, with side-by-side provider comparison to identify the best route for each game.",
  platformFilter: "gain",
};

export const metadata: Metadata = getBestPageMetadata(config);

export default async function BestGainOffersPage() {
  const { rows, providerRows } = await getBestPageData(config);
  return (
    <BestOffersPageTemplate
      label="Gain.gg Focus"
      title="Best Gain.gg Offers"
      intro={config.intro}
      rows={rows}
      providerRows={providerRows}
    />
  );
}
