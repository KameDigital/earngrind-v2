import type { Metadata } from "next";
import BestOffersPageTemplate from "../components/BestOffersPageTemplate";
import { getBestPageData, getBestPageMetadata } from "../_lib/best-pages";

export const revalidate = 3600;

const config = {
  pathname: "/best-freecash-games",
  title: "Best Freecash Games and Offers",
  description: "Top Freecash game offers ranked by payout and provider coverage.",
  intro:
    "Freecash offers can vary by provider and campaign. This page surfaces the strongest Freecash opportunities by payout so you can prioritize quickly.",
  platformFilter: "freecash",
};

export const metadata: Metadata = getBestPageMetadata(config);

export default async function BestFreecashGamesPage() {
  const { rows, providerRows } = await getBestPageData(config);
  return (
    <BestOffersPageTemplate
      label="Freecash Focus"
      pathname={config.pathname}
      title="Best Freecash Games"
      intro={config.intro}
      rows={rows}
      providerRows={providerRows}
    />
  );
}
