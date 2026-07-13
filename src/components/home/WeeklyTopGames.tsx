/* eslint-disable @next/next/no-img-element -- Imported offer thumbnails use volatile third-party hosts. */
"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import type { HomepageFeaturedOffer } from "@/lib/homepage-featured";

function deviceLabel(device: string) {
  return device === "ios" ? "iPhone" : device === "android" ? "Android" : device.toUpperCase();
}

export default function WeeklyTopGames({ initialOffers }: { initialOffers: HomepageFeaturedOffer[] }) {
  const [query, setQuery] = useState("");
  const [device, setDevice] = useState("");
  const [country, setCountry] = useState("");
  const [platform, setPlatform] = useState("");
  const filters = useMemo(() => ({
    devices: Array.from(new Set(initialOffers.flatMap((offer) => offer.devices))),
    countries: Array.from(new Set(initialOffers.flatMap((offer) => offer.countries))).sort(),
    platforms: Array.from(new Set(initialOffers.map((offer) => offer.platform.name))).sort(),
  }), [initialOffers]);
  const visible = useMemo(() => initialOffers.filter((offer) => {
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [offer.title, offer.game.name, offer.platform.name, offer.provider_name ?? ""].some((value) => value.toLowerCase().includes(needle));
    return matchesQuery && (!device || offer.devices.includes(device as never)) && (!country || offer.countries.includes(country)) && (!platform || offer.platform.name === platform);
  }), [initialOffers, query, device, country, platform]);

  return <div className="space-y-5">
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
      <label className="relative block"><span className="sr-only">Search this week&apos;s featured games</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--text-tertiary)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full border border-[var(--border-default)] bg-white py-2.5 pl-9 pr-3 text-sm text-[var(--brand-ink)] outline-none transition focus:border-lime-500 focus:ring-2 focus:ring-lime-100" placeholder="Search this week’s featured games" /></label>
      <div className="flex flex-wrap gap-2">{filters.devices.length > 0 && <select aria-label="Filter featured games by device" value={device} onChange={(event) => setDevice(event.target.value)} className="border border-[var(--border-default)] bg-white px-3 py-2 text-xs font-bold text-[var(--brand-ink)]"><option value="">Any device</option>{filters.devices.map((value) => <option key={value} value={value}>{deviceLabel(value)}</option>)}</select>}{filters.countries.length > 0 && <select aria-label="Filter featured games by country" value={country} onChange={(event) => setCountry(event.target.value)} className="border border-[var(--border-default)] bg-white px-3 py-2 text-xs font-bold text-[var(--brand-ink)]"><option value="">Any country</option>{filters.countries.map((value) => <option key={value} value={value}>{value}</option>)}</select>}{filters.platforms.length > 1 && <select aria-label="Filter featured games by GPT site" value={platform} onChange={(event) => setPlatform(event.target.value)} className="border border-[var(--border-default)] bg-white px-3 py-2 text-xs font-bold text-[var(--brand-ink)]"><option value="">Any GPT site</option>{filters.platforms.map((value) => <option key={value} value={value}>{value}</option>)}</select>}</div>
    </div>
    {visible.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{visible.map((offer) => <article key={offer.featured.id} className="group flex min-w-0 flex-col border border-[var(--border-default)] bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-lime-300 hover:shadow-lg"><div className="relative aspect-[16/9] overflow-hidden bg-[var(--surface-muted)]">{offer.image_url ? <>{/* eslint-disable-next-line @next/next/no-img-element -- Imported offer thumbnails are external and volatile. */}<img src={offer.image_url} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /></> : <div className="flex h-full items-center justify-center text-xs font-extrabold uppercase tracking-widest text-[var(--text-tertiary)]">{offer.game.name}</div>}{(offer.featured.badge || offer.is_new || offer.is_hot) && <span className="absolute left-3 top-3 bg-lime-300 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-lime-950">{offer.featured.badge || (offer.is_new ? "New this week" : "Trending")}</span>}</div><div className="flex flex-1 flex-col p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{offer.platform.name}{offer.provider_name ? ` · ${offer.provider_name}` : ""}</p><h3 className="mt-1 line-clamp-2 text-base font-extrabold leading-tight text-[var(--brand-ink)]">{offer.game.name || offer.title}</h3>{offer.goal_text && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">{offer.goal_text}</p>}{offer.featured.lock_summary && <p className="mt-2 border-l-2 border-amber-400 bg-amber-50 px-2 py-1 text-[11px] leading-relaxed text-amber-950">{offer.featured.lock_summary}</p>}<div className="mt-4 flex items-end justify-between gap-3"><span><span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Up to</span><strong className="text-lg text-[var(--brand-ink)]">${offer.total_payout_usd.toFixed(2)}</strong></span>{offer.redirect_url && <TrackedOutboundLink href={offer.redirect_url} offerId={offer.id} offerTitle={offer.title} gameTitle={offer.game.name} platformName={offer.platform.name} providerName={offer.provider_name} payoutUsd={offer.total_payout_usd} eventLabel="weekly_top_games_start" location="homepage_weekly_top_games" sourceContext="homepage_featured" className="border border-[var(--brand-ink)] px-3 py-2 text-xs font-extrabold text-[var(--brand-ink)] transition hover:bg-[var(--brand-ink)] hover:text-white">Compare</TrackedOutboundLink>}</div></div></article>)}</div> : <div className="border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] px-4 py-10 text-center text-sm text-[var(--text-secondary)]">No weekly picks match those filters. Try clearing a filter.</div>}
  </div>;
}
