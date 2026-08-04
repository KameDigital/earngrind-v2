export type OfferIntelligenceInput = {
  id: string;
  payout_usd: number;
  total_payout_usd?: number | null;
  updated_at?: string | null;
  goal_text?: string | null;
  devices?: string[] | null;
  countries?: string[] | null;
};

export type OfferReality = { score: number; label: "Strong" | "Review" | "Stale"; reasons: string[] };

function ageInDays(value?: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? Math.max(0, Math.floor((Date.now() - time) / 86_400_000)) : null;
}

export function getOfferReality(offer: OfferIntelligenceInput): OfferReality {
  const age = ageInDays(offer.updated_at);
  let score = 0;
  const reasons: string[] = [];
  if (age !== null && age <= 7) { score += 38; reasons.push("checked within 7 days"); }
  else if (age !== null && age <= 30) { score += 28; reasons.push("checked within 30 days"); }
  else if (age !== null && age <= 60) { score += 14; reasons.push("needs a freshness check"); }
  else reasons.push("freshness needs checking");
  if (Number(offer.total_payout_usd ?? offer.payout_usd) > 0) { score += 22; reasons.push("payout is visible"); }
  if (offer.goal_text?.trim()) { score += 18; reasons.push("requirement text is visible"); }
  if ((offer.devices?.length ?? 0) > 0) { score += 11; reasons.push("device fit is stated"); }
  if ((offer.countries?.length ?? 0) > 0) { score += 11; reasons.push("country availability is stated"); }
  return { score, label: score >= 75 ? "Strong" : score >= 50 ? "Review" : "Stale", reasons };
}

export function offerRouteScore(offer: OfferIntelligenceInput) {
  return getOfferReality(offer).score * 100 + Math.min(99, Number(offer.total_payout_usd ?? offer.payout_usd ?? 0) || 0);
}
