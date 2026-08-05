import type { Metadata } from "next";
import Link from "next/link";
import { canonicalAlternates } from "@/lib/seo-metadata";
import { fetchPublicOffers } from "@/lib/public-offer-search";
import { getOfferReality, type OfferIntelligenceInput } from "@/lib/offer-intelligence";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Offer Reality Index | EarnGrind",
  description: "Check how current, explicit, and usable an offer listing is before starting it.",
  robots: { index: false, follow: true },
  alternates: canonicalAlternates("/offer-reality-index"),
};

export default async function OfferRealityIndexPage() {
  const { data } = await fetchPublicOffers({ sort: "newest", perPage: 50 });
  const ranked = data.map((offer) => ({ offer, reality: getOfferReality(offer as OfferIntelligenceInput) }))
    .sort((a, b) => b.reality.score - a.reality.score).slice(0, 20);
  return <main className="bg-[var(--background)]"><section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <p className="section-label">Decision tool</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--brand-ink)]">Offer Reality Index</h1>
    <p className="mt-4 max-w-3xl leading-relaxed text-[var(--text-secondary)]">A transparent 0–100 signal for listing quality—not a promise of completion. It rewards recent checks, visible payout, clear requirements, and stated device and country fit.</p>
    <div className="mt-8 grid gap-3 md:grid-cols-3"><div className="eg-card p-4"><strong>Freshness</strong><p className="mt-1 text-sm text-[var(--text-secondary)]">Recent source updates carry the most weight.</p></div><div className="eg-card p-4"><strong>Clarity</strong><p className="mt-1 text-sm text-[var(--text-secondary)]">Visible payout and task language reduce ambiguity.</p></div><div className="eg-card p-4"><strong>Fit</strong><p className="mt-1 text-sm text-[var(--text-secondary)]">Country and device fields help rule out mismatches.</p></div></div>
    <div className="mt-8 space-y-3">{ranked.map(({ offer, reality }) => <article key={offer.id} className="eg-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-extrabold text-[var(--brand-ink)]">{offer.game?.name ?? offer.title}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">{offer.platform?.name ?? offer.provider_name ?? "Provider unavailable"} · {reality.reasons.join(" · ")}</p></div><div className="flex items-center gap-3"><span className="text-2xl font-extrabold text-[var(--brand-ink)]">{reality.score}</span><span className="text-xs font-bold uppercase tracking-wide text-lime-700">{reality.label}</span><Link href={offer.game?.slug ? `/offers/${offer.game.slug}` : "/offers"} className="rounded-none border border-[var(--border-default)] px-3 py-2 text-sm font-bold">Inspect route</Link></div></article>)}</div>
  </section></main>;
}
