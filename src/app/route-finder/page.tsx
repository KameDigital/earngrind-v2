import type { Metadata } from "next";
import Link from "next/link";
import { canonicalAlternates } from "@/lib/seo-metadata";
import { fetchPublicOffers } from "@/lib/public-offer-search";
import { getOfferReality, offerRouteScore, type OfferIntelligenceInput } from "@/lib/offer-intelligence";

export const revalidate = 300;
export const metadata: Metadata = { title: "Best Offer Routes | EarnGrind", description: "Choose a provider route using payout, freshness, and requirement clarity—not payout alone.", alternates: canonicalAlternates("/route-finder") };

export default async function RouteFinderPage() {
  const { data } = await fetchPublicOffers({ sort: "payout_desc", perPage: 50 });
  const topByGame = new Map<string, typeof data[number]>();
  for (const offer of data) { const key = offer.game?.slug ?? offer.id; const current = topByGame.get(key); if (!current || offerRouteScore(offer as OfferIntelligenceInput) > offerRouteScore(current as OfferIntelligenceInput)) topByGame.set(key, offer); }
  const routes = Array.from(topByGame.values()).sort((a, b) => offerRouteScore(b as OfferIntelligenceInput) - offerRouteScore(a as OfferIntelligenceInput)).slice(0, 20);
  return <main className="bg-[var(--background)]"><section className="mx-auto max-w-6xl px-4 py-12 sm:px-6"><p className="section-label">Decision tool</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--brand-ink)]">Best Route Finder</h1><p className="mt-4 max-w-3xl leading-relaxed text-[var(--text-secondary)]">One recommended route per game, selected from the available listings by Reality Index first and visible total payout second. Open the comparison before starting—provider availability can change.</p><div className="mt-8 grid gap-3">{routes.map((offer) => { const reality = getOfferReality(offer as OfferIntelligenceInput); const payout = Number(offer.total_payout_usd ?? offer.payout_usd ?? 0); return <article key={offer.id} className="eg-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-extrabold text-[var(--brand-ink)]">{offer.game?.name ?? offer.title}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">Recommended: {offer.platform?.name ?? offer.provider_name ?? "provider route"} · {offer.goal_text ?? "Check the current task list"}</p></div><div className="flex items-center gap-4"><span className="text-sm font-bold">Up to ${payout.toFixed(2)}</span><span className="text-xs font-bold uppercase tracking-wide text-lime-700">Reality {reality.score}</span><Link href={offer.game?.slug ? `/offers/${offer.game.slug}` : "/offers"} className="rounded-none bg-[var(--brand-ink)] px-3 py-2 text-sm font-bold text-[var(--brand-lime)]">Compare</Link></div></article>; })}</div></section></main>;
}
