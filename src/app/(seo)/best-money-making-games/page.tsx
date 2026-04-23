import type { Metadata } from "next";
import BestOffersPageTemplate from "../components/BestOffersPageTemplate";
import { getBestPageData, getBestPageMetadata } from "../_lib/best-pages";

export const revalidate = 3600;

const config = {
  pathname: "/best-money-making-games",
  title: "Best Money-Making Games",
  description: "Find the best money-making games based on highest current GPT payouts.",
  intro:
    "These game offers prioritize practical earning potential. Rankings focus on high payouts and strong provider coverage so you can maximize ROI per session.",
  minPayoutUsd: 5,
};

export const metadata: Metadata = getBestPageMetadata(config);

export default async function BestMoneyMakingGamesPage() {
  const { rows, providerRows } = await getBestPageData(config);
  return (
    <BestOffersPageTemplate
      label="Earning Potential"
      title="Best Money-Making Games"
      intro={config.intro}
      rows={rows}
      providerRows={providerRows}
    />
  );
}
