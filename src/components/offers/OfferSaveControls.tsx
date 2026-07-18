"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { addFavorite, addTracking, removeFavorite, removeTracking } from "@/app/account/offer-actions";
import type { SavedOfferInput } from "@/lib/account-offers";

export default function OfferSaveControls({ offer }: { offer: SavedOfferInput }) {
  const router = useRouter(); const pathname = usePathname(); const [pending, startTransition] = useTransition(); const [favorite, setFavorite] = useState(false); const [tracking, setTracking] = useState(false); const [error, setError] = useState("");
  const change = (kind: "favorite" | "tracking") => startTransition(async () => { const enabled = kind === "favorite" ? favorite : tracking; const result = kind === "favorite" ? enabled ? await removeFavorite(offer) : await addFavorite(offer) : enabled ? await removeTracking(offer) : await addTracking(offer); if (!result.ok) { if (result.error.includes("sign in")) router.push(`/login?next=${encodeURIComponent(pathname)}`); else setError(result.error); return; } if (kind === "favorite") setFavorite(!enabled); else setTracking(!enabled); });
  return <div className="flex flex-wrap items-center gap-2" onClick={(event) => event.stopPropagation()}><button type="button" disabled={pending} onClick={() => change("favorite")} aria-pressed={favorite} className={`border px-3 py-2 text-sm font-bold disabled:opacity-60 ${favorite ? "border-lime-400 bg-lime-50 text-lime-800" : "border-[var(--border-default)] bg-white text-[var(--brand-ink)]"}`}>{favorite ? "Favorited" : "Favorite"}</button><button type="button" disabled={pending} onClick={() => change("tracking")} aria-pressed={tracking} className={`border px-3 py-2 text-sm font-bold disabled:opacity-60 ${tracking ? "border-lime-400 bg-lime-50 text-lime-800" : "border-[var(--border-default)] bg-white text-[var(--brand-ink)]"}`}>{tracking ? "Tracking" : "Track"}</button>{error ? <span role="alert" className="text-xs text-red-700">{error}</span> : null}</div>;
}
