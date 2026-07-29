"use client";

import { useState } from "react";

type PartnerLogoProps = {
  name: string;
  slug?: string;
  domain?: string;
  logoUrl?: string | null;
  className?: string;
};

const PARTNER_DOMAINS: Record<string, string> = {
  kashkick: "kashkick.com",
  swagbucks: "swagbucks.com",
  inboxdollars: "inboxdollars.com",
  mypoints: "mypoints.com",
  prizerebel: "prizerebel.com",
  scrambly: "scrambly.io",
  "gain-gg": "gain.gg",
  gemsloot: "gemsloot.com",
  earnlab: "earnlab.com",
};

const BRAND_FALLBACKS: Record<string, string> = {
  kashkick: "bg-emerald-600 text-white",
  swagbucks: "bg-sky-600 text-white",
  inboxdollars: "bg-rose-600 text-white",
  mypoints: "bg-orange-500 text-white",
  prizerebel: "bg-indigo-600 text-white",
  scrambly: "bg-violet-600 text-white",
  "gain-gg": "bg-cyan-700 text-white",
  gemsloot: "bg-amber-500 text-slate-950",
  earnlab: "bg-lime-400 text-slate-950",
};

export default function PartnerLogo({ name, slug, domain, logoUrl, className = "" }: PartnerLogoProps) {
  const [failed, setFailed] = useState(false);
  const resolvedDomain = domain ?? (slug ? PARTNER_DOMAINS[slug] : undefined);
  const source = logoUrl?.trim() || (resolvedDomain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(resolvedDomain)}&sz=128` : null);
  const fallbackClass = BRAND_FALLBACKS[slug ?? ""] ?? "bg-slate-950 text-lime-300";

  if (!source || failed) {
    return <span aria-label={`${name} logo`} className={`grid place-items-center rounded-md text-sm font-black ${fallbackClass} ${className}`}>{name.slice(0, 1)}</span>;
  }

  return <span className={`grid place-items-center overflow-hidden rounded-md bg-white ring-1 ring-slate-200 ${className}`}>
    {/* eslint-disable-next-line @next/next/no-img-element -- Partner favicons are remote and dynamically resolved. */}
    <img src={source} alt="" onError={() => setFailed(true)} className="h-full w-full object-contain p-1" referrerPolicy="no-referrer" />
  </span>;
}
