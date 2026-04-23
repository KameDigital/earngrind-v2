import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export type OfferApiRow = {
  id: string;
  title: string;
  payout_usd: number;
  payout_type: string | null;
  category: string | null;
  provider_name: string | null;
  redirect_url: string | null;
  goal_text: string | null;
  game: {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
  } | null;
  platform: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    platform_kind: string | null;
  } | null;
};

type OffersApiResponse = {
  data: OfferApiRow[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
};

export type ComparisonTask = {
  id: string;
  sort_order: number;
  title: string;
  reward_amount: number;
  reward_display: string | null;
  task_type: string;
  time_limit_text: string | null;
};

export type GameComparisonOffer = {
  id: string;
  provider_name: string | null;
  platform_name: string | null;
  payout_usd: number;
  total_payout_usd: number;
  task_count: number;
  image_url: string | null;
  redirect_url: string;
  offer_url: string | null;
  status: string;
  goal_text: string | null;
  tasks: ComparisonTask[];
};

export type GameSeoData = {
  game: {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
    devices: string[] | null;
    category: string | null;
    description: string | null;
  };
  summary: {
    offer_count: number;
    max_payout_usd: number;
    avg_payout_usd: number;
    min_payout_usd: number;
  };
  offers: OfferApiRow[];
  comparison: {
    sort: string;
    offers: GameComparisonOffer[];
    summary: {
      provider_count: number;
      best_single_payout_usd: number;
      best_total_payout_usd: number;
    };
  };
  guides: Array<{
    id: string;
    title: string;
    slug: string;
    estimated_time: string | null;
    max_payout_usd: number | null;
    difficulty: string | null;
    tips: string[];
  }>;
};

export type SeoOfferRow = {
  id: string;
  title: string;
  gameName: string;
  gameSlug: string;
  providerName: string;
  platformName: string;
  payoutUsd: number;
  totalPayoutUsd: number;
  redirectUrl: string;
  goalText: string | null;
  tasks: ComparisonTask[];
};

type TopOfferOptions = {
  q?: string;
  page?: number;
  perPage?: number;
  minPayoutUsd?: number;
};

function buildOffersUrl({
  q,
  page = 1,
  perPage = 50,
  minPayoutUsd = 0,
}: TopOfferOptions) {
  const params = new URLSearchParams();
  params.set("sort", "payout_desc");
  params.set("page", String(page));
  params.set("per_page", String(perPage));
  if (q) params.set("q", q);
  if (minPayoutUsd > 0) params.set("min_payout", String(minPayoutUsd));
  return `${SITE_URL}/api/offers?${params.toString()}`;
}

export async function getTopOffers(options: TopOfferOptions = {}): Promise<OfferApiRow[]> {
  const res = await fetch(buildOffersUrl(options), {
    next: { revalidate: 1800, tags: ["seo", "offers"] },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as OffersApiResponse;
  return Array.isArray(json.data) ? json.data : [];
}

export async function getGameSeoData(slug: string): Promise<GameSeoData | null> {
  const res = await fetch(`${SITE_URL}/api/offers/game/${slug}`, {
    next: { revalidate: 1800, tags: [`seo-game-${slug}`] },
  });
  if (res.status === 404 || !res.ok) return null;
  return (await res.json()) as GameSeoData;
}

export function toSeoOfferRows(rows: OfferApiRow[]): SeoOfferRow[] {
  return rows
    .filter((row) => row.game && row.platform)
    .map((row) => ({
      id: row.id,
      title: row.title,
      gameName: row.game!.name,
      gameSlug: row.game!.slug,
      providerName: row.provider_name ?? "Unknown Provider",
      platformName: row.platform!.name,
      payoutUsd: Number(row.payout_usd ?? 0),
      totalPayoutUsd: Number(row.payout_usd ?? 0),
      redirectUrl: row.redirect_url ?? "#",
      goalText: row.goal_text ?? null,
      tasks: [],
    }));
}

export function mapComparisonToSeoRows(rows: GameComparisonOffer[], fallbackGame: { name: string; slug: string }): SeoOfferRow[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.goal_text?.trim() || `Complete tasks for ${fallbackGame.name}`,
    gameName: fallbackGame.name,
    gameSlug: fallbackGame.slug,
    providerName: row.provider_name ?? "Unknown Provider",
    platformName: row.platform_name ?? "Unknown Platform",
    payoutUsd: Number(row.payout_usd ?? 0),
    totalPayoutUsd: Number(row.total_payout_usd ?? row.payout_usd ?? 0),
    redirectUrl: row.redirect_url ?? "#",
    goalText: row.goal_text ?? null,
    tasks: Array.isArray(row.tasks) ? [...row.tasks].sort((a, b) => a.sort_order - b.sort_order) : [],
  }));
}

export function buildProviderComparison(rows: SeoOfferRow[]) {
  const byProvider = new Map<string, { offers: number; bestPayoutUsd: number; avgPayoutUsd: number; platforms: Set<string> }>();
  for (const row of rows) {
    const key = row.providerName || "Unknown Provider";
    const current = byProvider.get(key) ?? { offers: 0, bestPayoutUsd: 0, avgPayoutUsd: 0, platforms: new Set<string>() };
    current.offers += 1;
    current.bestPayoutUsd = Math.max(current.bestPayoutUsd, row.payoutUsd);
    current.avgPayoutUsd += row.payoutUsd;
    current.platforms.add(row.platformName || "Unknown Platform");
    byProvider.set(key, current);
  }

  return Array.from(byProvider.entries())
    .map(([providerName, stats]) => ({
      providerName,
      offers: stats.offers,
      bestPayoutUsd: stats.bestPayoutUsd,
      avgPayoutUsd: stats.offers > 0 ? stats.avgPayoutUsd / stats.offers : 0,
      platformCount: stats.platforms.size,
    }))
    .sort((a, b) => b.bestPayoutUsd - a.bestPayoutUsd);
}

export function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

export async function getStaticGameSlugs(limit = 120): Promise<string[]> {
  const offers = await getTopOffers({ perPage: limit, page: 1 });
  const slugs = new Set<string>();
  for (const offer of offers) {
    if (offer.game?.slug) slugs.add(offer.game.slug);
  }
  return Array.from(slugs);
}

export function buildSeoMetadata(input: {
  title: string;
  description: string;
  path: string;
  imagePath?: string;
}): Metadata {
  const image = input.imagePath ?? "/og-default.jpg";
  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: input.path,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: `${SITE_URL}${input.path}`,
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}
