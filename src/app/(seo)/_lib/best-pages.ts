import type { Metadata } from "next";
import { buildProviderComparison, buildSeoMetadata, getTopOffers, toSeoOfferRows, type SeoOfferRow } from "./seo-data";

export type BestPageConfig = {
  pathname: string;
  title: string;
  description: string;
  intro: string;
  minPayoutUsd?: number;
  providerFilter?: string;
  platformFilter?: string;
};

function includesInsensitive(value: string | null | undefined, pattern: string): boolean {
  if (!value) return false;
  return value.toLowerCase().includes(pattern.toLowerCase());
}

export async function getBestPageData(config: BestPageConfig): Promise<{
  rows: SeoOfferRow[];
  providerRows: ReturnType<typeof buildProviderComparison>;
}> {
  const raw = await getTopOffers({
    perPage: 120,
    minPayoutUsd: config.minPayoutUsd ?? 0,
  });

  const filtered = raw.filter((row) => {
    if (config.providerFilter && !includesInsensitive(row.provider_name, config.providerFilter)) return false;
    if (config.platformFilter && !includesInsensitive(row.platform?.name, config.platformFilter)) return false;
    return true;
  });

  const rows = toSeoOfferRows(filtered).sort((a, b) => b.payoutUsd - a.payoutUsd).slice(0, 20);
  const providerRows = buildProviderComparison(rows);
  return { rows, providerRows };
}

export function getBestPageMetadata(config: BestPageConfig): Metadata {
  return buildSeoMetadata({
    title: config.title,
    description: config.description,
    path: config.pathname,
  });
}
