export type FinderDevice = "ios" | "android" | "desktop";
export type FinderOfferType = "most-completed" | "highest-payout" | "quick-tasks";

export type FinderOffer = {
  id: string;
  title?: string | null;
  payout_usd?: number | string | null;
  total_payout_usd?: number | string | null;
  completion_count?: number | string | null;
  devices?: string[] | null;
  countries?: string[] | null;
  category?: string | null;
  goal_text?: string | null;
  is_hot?: boolean | null;
  is_new?: boolean | null;
  is_boosted?: boolean | null;
  heat_score?: number | string | null;
  platform?: {
    name?: string | null;
    slug?: string | null;
    platform_kind?: string | null;
  } | null;
  provider_name?: string | null;
  game?: {
    name?: string | null;
  } | null;
};

export const FINDER_COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
];

export const FINDER_DEVICE_OPTIONS: Array<{ value: FinderDevice; label: string; offerDevices: string[] }> = [
  { value: "ios", label: "iOS", offerDevices: ["ios"] },
  { value: "android", label: "Android", offerDevices: ["android"] },
  { value: "desktop", label: "Desktop", offerDevices: ["pc", "web"] },
];

export const FINDER_OFFER_TYPE_OPTIONS: Array<{
  value: FinderOfferType;
  label: string;
  description: string;
}> = [
  { value: "most-completed", label: "Most completed", description: "Prioritize offers with stronger completion or popularity signals." },
  { value: "highest-payout", label: "Highest payout", description: "Rank by the strongest visible reward." },
  { value: "quick-tasks", label: "Quick Tasks", description: "Lower-friction offers that are easier to start." },
];

export function getFinderPayout(offer: FinderOffer) {
  return Number(offer.total_payout_usd ?? offer.payout_usd ?? 0) || 0;
}

function getFinderCompletionSignal(offer: FinderOffer) {
  const completionCount = Number(offer.completion_count);
  const hasRealCompletionCount = offer.completion_count !== null &&
    offer.completion_count !== undefined &&
    Number.isFinite(completionCount);
  if (hasRealCompletionCount) {
    return 1_000_000 + Math.max(0, completionCount) + Math.min(1, getFinderPayout(offer) / 100000);
  }

  const heatScore = Number(offer.heat_score ?? 0) || 0;
  return heatScore
    + (offer.is_hot ? 18 : 0)
    + (offer.is_boosted ? 8 : 0)
    + (offer.is_new ? 4 : 0);
}

export function offerMatchesFinderCountry(offer: FinderOffer, country: string) {
  const countries = offer.countries ?? [];
  return countries.length === 0 || countries.includes(country);
}

export function offerMatchesFinderDevice(offer: FinderOffer, device: FinderDevice) {
  const devices = offer.devices ?? [];
  const allowedDevices = FINDER_DEVICE_OPTIONS.find((option) => option.value === device)?.offerDevices ?? [];
  return devices.length === 0 || devices.some((offerDevice) => allowedDevices.includes(offerDevice));
}

function finderOfferText(offer: FinderOffer) {
  return [
    offer.title,
    offer.game?.name,
    offer.category,
    offer.goal_text,
    offer.platform?.name,
    offer.platform?.slug,
    offer.platform?.platform_kind,
    offer.provider_name,
  ].filter(Boolean).join(" ").toLowerCase();
}

export function offerMatchesFinderType(offer: FinderOffer, offerType: FinderOfferType) {
  const text = finderOfferText(offer);
  const payout = getFinderPayout(offer);

  if (offerType === "most-completed") return true;
  if (offerType === "highest-payout") return true;
  if (offerType === "quick-tasks") {
    return payout <= 35 || /\b(install|register|signup|survey|quiz|watch|video|play for|minutes?)\b/.test(text);
  }
  return true;
}

export function scoreFinderOffer(offer: FinderOffer, offerType: FinderOfferType) {
  const payout = getFinderPayout(offer);
  const heatScore = Number(offer.heat_score ?? 0) || 0;
  const text = finderOfferText(offer);

  if (offerType === "most-completed") {
    return getFinderCompletionSignal(offer);
  }

  const payoutScore = offerType === "quick-tasks"
    ? 80 - Math.min(60, payout / 2)
    : Math.min(90, payout / 50);
  const typeScore = offerMatchesFinderType(offer, offerType) ? 45 : 0;
  const simpleStartScore = /\b(install|register|signup|play for|minutes?)\b/.test(text) ? 8 : 0;

  return payoutScore
    + typeScore
    + simpleStartScore
    + Math.min(10, heatScore / 10)
    + (offer.is_hot ? 6 : 0)
    + (offer.is_new ? 4 : 0)
    + (offer.is_boosted ? 4 : 0);
}

export function getPersonalizedOfferResults<T extends FinderOffer>(
  offers: T[],
  filters: {
    country: string;
    device: FinderDevice;
    offerType: FinderOfferType;
    limit?: number;
  },
) {
  return offers
    .filter((offer) => offerMatchesFinderCountry(offer, filters.country))
    .filter((offer) => offerMatchesFinderDevice(offer, filters.device))
    .filter((offer) => offerMatchesFinderType(offer, filters.offerType))
    .sort((a, b) => {
      const scoreDelta = scoreFinderOffer(b, filters.offerType) - scoreFinderOffer(a, filters.offerType);
      if (scoreDelta !== 0) return scoreDelta;
      return getFinderPayout(b) - getFinderPayout(a);
    })
    .slice(0, filters.limit ?? 5);
}
