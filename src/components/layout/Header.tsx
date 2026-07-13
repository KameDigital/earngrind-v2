"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import DiscordIcon from "@/components/icons/DiscordIcon";

const NAV_LINKS = [
  { href: "/offers", label: "Offers & Games", activePrefixes: ["/games"] },
  { href: "/find-offers", label: "Find Offers" },
  { href: "/guides", label: "Guides", excludePrefixes: ["/guides/best-gpt-sites", "/guides/fanduel-casino-review-bonus"] },
  { href: "/best-gpt-sites", label: "Best GPT Sites", activePrefixes: ["/guides/best-gpt-sites", "/review", "/reviews", "/platforms", "/guides/fanduel-casino-review-bonus"] },
  { href: "/blog", label: "Blog" },
];

const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL?.trim() || null;

function isActivePath(
  pathname: string,
  link: {
    href: string;
    activePrefixes?: string[];
    excludePrefixes?: string[];
  },
) {
  if (link.activePrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  if (link.excludePrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false;
  }
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070b12]/95 text-white shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4 xl:gap-8">
          <Link href="/" className="group flex flex-shrink-0 items-center gap-3" aria-label="EarnGrind home">
            <span
              className="grid h-9 w-9 place-items-center border border-lime-300/35 bg-lime-300/15 text-sm font-black text-[var(--brand-lime)] shadow-[0_0_24px_rgba(156,255,36,0.22)] transition-transform group-hover:scale-105"
              aria-hidden="true"
            >
              EG
            </span>
            <span className="leading-none">
              <span className="block text-base font-black tracking-[-0.04em] text-white">
                Earn<span className="text-[var(--brand-lime)]">Grind</span>
              </span>
              <span className="mt-1 hidden text-[9px] font-black uppercase tracking-[0.2em] text-white/35 sm:block">
                Offer intelligence
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Main navigation">
            {NAV_LINKS.map(({ href, label, activePrefixes, excludePrefixes }) => {
              const active = isActivePath(pathname, { href, activePrefixes, excludePrefixes });
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative border px-3.5 py-2 text-xs font-black uppercase tracking-[0.12em] transition-colors ${
                    active
                      ? "border-lime-300/40 bg-lime-300/15 text-[var(--brand-lime)]"
                      : "border-transparent text-white/62 hover:border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {label}
                  {active ? (
                    <span className="absolute -bottom-px left-3.5 right-3.5 h-0.5 bg-[var(--brand-lime)]" aria-hidden="true" />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />

          <div className="hidden items-center gap-2 xl:flex">
            {DISCORD_URL ? (
              <a
                href={DISCORD_URL}
                aria-label="Join EarnGrind on Discord"
                className="flex h-9 w-9 items-center justify-center border border-white/10 text-white/60 transition-colors hover:border-lime-300/40 hover:text-[var(--brand-lime)]"
                target="_blank"
                rel="noreferrer"
              >
                <DiscordIcon className="ti ti-brand-discord h-[17px] w-[17px]" />
              </a>
            ) : null}
            <Link
              href="/offers"
              aria-label="Search offers"
              className="flex h-9 w-9 items-center justify-center border border-white/10 text-white/60 transition-colors hover:border-lime-300/40 hover:text-[var(--brand-lime)]"
            >
              <Search size={17} />
            </Link>
            <Link
              href="/find-offers"
              className="flex items-center gap-1.5 bg-[var(--brand-lime)] px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-slate-950 shadow-[0_0_28px_rgba(156,255,36,0.22)] transition-all hover:-translate-y-px hover:bg-lime-200 active:translate-y-0"
            >
              Find Offers <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 xl:hidden">
            {DISCORD_URL ? (
              <a
                href={DISCORD_URL}
                aria-label="Join EarnGrind on Discord"
                className="flex h-9 w-9 items-center justify-center border border-white/10 text-white/70 transition-colors hover:border-lime-300/40 hover:text-[var(--brand-lime)]"
                target="_blank"
                rel="noreferrer"
              >
                <DiscordIcon className="ti ti-brand-discord h-[17px] w-[17px]" />
              </a>
            ) : null}
            <Link href="/find-offers" className="bg-[var(--brand-lime)] px-3.5 py-2 text-xs font-black text-slate-950">
              Find Offers
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              className="flex h-9 w-9 items-center justify-center border border-white/10 text-white transition-colors hover:border-lime-300/40"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div id="mobile-navigation" className="border-t border-white/10 bg-[#090f19] xl:hidden">
          <nav className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-4" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ href, label, activePrefixes, excludePrefixes }) => {
              const active = isActivePath(pathname, { href, activePrefixes, excludePrefixes });
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between border px-4 py-3 text-sm font-black uppercase tracking-[0.12em] transition-colors ${
                    active
                      ? "border-lime-300/40 bg-lime-300/15 text-[var(--brand-lime)]"
                      : "border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {label}
                  {active ? <span className="h-1.5 w-1.5 bg-[var(--brand-lime)]" /> : null}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
