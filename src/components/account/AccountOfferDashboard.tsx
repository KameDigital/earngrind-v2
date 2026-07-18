"use client";
/* eslint-disable @next/next/no-img-element -- saved snapshots may use approved remote provider hosts. */

import Link from "next/link";
import { useState, useTransition } from "react";
import { removeFavorite, removeTracking } from "@/app/account/offer-actions";
import type { SavedOfferRecord } from "@/lib/account-offers";

type Props = { favorites: SavedOfferRecord[]; views: SavedOfferRecord[]; tracking: SavedOfferRecord[]; counts: { favorites: number; views: number; tracking: number } };

function usd(value?: number | null) { return typeof value === "number" && Number.isFinite(value) ? `$${value.toFixed(2)}` : "Payout unavailable"; }
function when(value?: string) { return value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value)) : ""; }

export default function AccountOfferDashboard({ favorites, views, tracking, counts }: Props) {
  return <div className="mt-8 space-y-8">
    <p className="border-l-2 border-lime-400 bg-lime-50 px-3 py-2 text-sm text-[var(--text-secondary)]">Your saved and recently viewed offers are private to your account.</p>
    <div className="grid gap-3 sm:grid-cols-3">
      <Metric label="Favorites" value={counts.favorites} /><Metric label="Recently viewed" value={counts.views} /><Metric label="Tracking" value={counts.tracking} />
    </div>
    <DashboardSection title="Favorite offers" description="Keep your strongest offer routes close at hand." empty="No favorites yet. Save an offer from the offers page to see it here." items={favorites} action="favorite" />
    <DashboardSection title="Recently viewed" description="The latest offers you deliberately opened." empty="No recent offer views yet. Open an offer route to build a private history." items={views} action="view" />
    <DashboardSection title="Tracked offers" description="Save offers here to monitor manually. Automated payout alerts are planned for a later update." empty="No tracked offers yet. Track an offer when you want to revisit it later." items={tracking} action="tracking" />
  </div>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="border border-[var(--border-default)] bg-white px-4 py-3"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{label}</p><p className="mt-1 text-2xl font-extrabold text-[var(--brand-ink)]">{value}</p></div>; }

function DashboardSection({ title, description, empty, items, action }: { title: string; description: string; empty: string; items: SavedOfferRecord[]; action: "favorite" | "view" | "tracking" }) {
  return <section aria-labelledby={`${action}-offers`}><div className="flex flex-wrap items-end justify-between gap-2"><div><h2 id={`${action}-offers`} className="text-xl font-extrabold text-[var(--brand-ink)]">{title}</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p></div><span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Private</span></div>
    {items.length ? <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <SavedOfferCard key={item.id} item={item} action={action} />)}</div> : <div className="mt-4 border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] px-5 py-8 text-sm text-[var(--text-secondary)]">{empty}</div>}
  </section>;
}

function SavedOfferCard({ item, action }: { item: SavedOfferRecord; action: "favorite" | "view" | "tracking" }) {
  const [pending, startTransition] = useTransition(); const [removed, setRemoved] = useState(false); const [error, setError] = useState("");
  if (removed) return null;
  const remove = () => { if (action === "view") return; startTransition(async () => { const result = action === "favorite" ? await removeFavorite(item) : await removeTracking(item); if (!result.ok) setError(result.error); else setRemoved(true); }); };
  const stamp = action === "view" ? item.lastViewedAt : action === "tracking" ? item.trackingStartedAt : item.createdAt;
  return <article className="flex min-w-0 flex-col border border-[var(--border-default)] bg-white p-4 shadow-[var(--shadow-card)]"><div className="flex gap-3"><Thumbnail item={item} /><div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{item.platformName || "Offer route"}</p><h3 className="mt-1 truncate font-extrabold text-[var(--brand-ink)]">{item.title}</h3><p className="mt-1 text-sm font-bold text-lime-700">{usd(item.payoutUsd)}</p></div></div><p className="mt-3 text-xs text-[var(--text-secondary)]">{action === "view" ? "Viewed" : action === "tracking" ? "Tracking since" : "Saved"} {when(stamp)}</p><div className="mt-4 flex flex-wrap gap-2"><Link href={item.offerPath} className="flex-1 border border-[var(--brand-ink)] px-3 py-2 text-center text-sm font-bold text-[var(--brand-ink)] hover:bg-[var(--brand-ink)] hover:text-white">Open offer</Link>{action !== "view" ? <button type="button" onClick={remove} disabled={pending} className="border border-[var(--border-default)] px-3 py-2 text-sm font-bold text-[var(--brand-ink)] disabled:opacity-60">{pending ? "Saving…" : action === "favorite" ? "Remove" : "Stop tracking"}</button> : null}</div>{error ? <p role="alert" className="mt-2 text-xs text-red-700">{error}</p> : null}</article>;
}

function Thumbnail({ item }: { item: SavedOfferRecord }) { const [broken, setBroken] = useState(false); return <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-[var(--border-default)] bg-[var(--surface-muted)] text-xs font-extrabold text-[var(--text-tertiary)]">{item.imageUrl && !broken ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={() => setBroken(true)} /> : item.title.slice(0, 2).toUpperCase()}</div>; }
