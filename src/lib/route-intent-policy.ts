export const ROUTE_INTENT_POLICY = {
  home: "Homepage introduces EarnGrind discovery and routes users into the right hub.",
  offers: "Offer routes are the canonical payout comparison and search experience.",
  games: "Game hubs explain what to play, summarize guide coverage, and point to full route comparison.",
  guides: "Guides target completion strategy, task walkthroughs, and offer readiness.",
  platforms: "Platform pages target GPT site trust, reviews, and account-fit research.",
} as const;

export function gameHubPath(slug: string) {
  return `/games/${slug}`;
}

export function offerRoutePath(slug: string) {
  return `/offers/${slug}`;
}

export function buildGameHubSeoTitle(gameName: string, year = new Date().getFullYear()) {
  return `${gameName} Offer Hub: Guides, Payout Snapshot, and Routes (${year})`;
}

export function buildGameHubSeoDescription(gameName: string) {
  return `Use the ${gameName} game hub to review payout signals, guide coverage, related games, and the best next step before opening the full route comparison.`;
}

export function buildOfferRouteSeoTitle(gameName: string) {
  return `${gameName} Payout Routes: Compare Offers and Providers`;
}

export function buildOfferRouteSeoDescription(input: {
  gameName: string;
  offerCount: number;
  maxPayoutUsd: number;
  fallbackDescription?: string | null;
}) {
  const offerLabel = `${input.offerCount} ${input.gameName} offer${input.offerCount === 1 ? "" : "s"}`;
  const payoutLabel = input.maxPayoutUsd > 0 ? ` Max payout: $${input.maxPayoutUsd.toFixed(2)}.` : "";
  const fallback = input.fallbackDescription ? ` ${input.fallbackDescription}` : "";
  return `Compare ${offerLabel} by payout route, provider, platform, and task requirements before clicking out.${payoutLabel}${fallback}`.trim();
}
