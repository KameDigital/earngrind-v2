import type { Metadata } from "next";
import BestOffersPageTemplate from "../components/BestOffersPageTemplate";
import { getBestPageData, getBestPageMetadata } from "../_lib/best-pages";

export const revalidate = 3600;

const config = {
  pathname: "/highest-paying-gpt-games",
  title: "Highest Paying GPT Games",
  description: "Track the highest paying GPT game offers across all providers.",
  intro:
    "These are the highest-paying game offers currently available across the tracked GPT ecosystem. Rankings are sorted by normalized payout USD.",
  minPayoutUsd: 3,
};

export const metadata: Metadata = getBestPageMetadata(config);

export default async function HighestPayingGptGamesPage() {
  const { rows, providerRows } = await getBestPageData(config);
  return (
    <BestOffersPageTemplate
      label="Highest Paying Games"
      title="Highest Paying GPT Games"
      intro={config.intro}
      rows={rows}
      providerRows={providerRows}
    />
  );
}
