"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";
import DiscordIcon from "@/components/icons/DiscordIcon";

const NAV_LINKS = [
    { href: "/offers", label: "Offers & Games", activePrefixes: ["/games"] },
    { href: "/find-offers", label: "Find Offers" },
    { href: "/guides", label: "Guides", excludePrefixes: ["/guides/best-gpt-sites", "/guides/fanduel-casino-review-bonus"] },
    { href: "/best-gpt-sites", label: "Best GPT Sites", activePrefixes: ["/guides/best-gpt-sites", "/review", "/reviews", "/platforms", "/guides/fanduel-casino-review-bonus"] },
    // TODO: Re-enable when onboarding flow, terms display, and status dashboard are complete.
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
        <header
            className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[var(--border-default)]"
            style={{ boxShadow: "0 1px 0 0 var(--border-default)" }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-14 items-center gap-4 xl:gap-8">

                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex-shrink-0 flex items-center gap-1.5 group"
                        aria-label="EarnGrind home"
                    >
                        <span
                            className="h-2 w-2 rounded-none bg-[var(--brand-lime)] ring-2 ring-[var(--brand-lime)]/30 group-hover:scale-110 transition-transform"
                            aria-hidden="true"
                        />
                        <span className="text-[var(--brand-ink)] font-extrabold text-sm tracking-tight leading-none">
                            Earn<span className="text-[color:hsl(84,93%,36%)]">Grind</span>
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden xl:flex items-center gap-1" aria-label="Main navigation">
                        {NAV_LINKS.map(({ href, label, activePrefixes, excludePrefixes }) => {
                            const active = isActivePath(pathname, { href, activePrefixes, excludePrefixes });
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`
                                        relative rounded-none px-3.5 py-2 text-xs font-semibold transition-colors
                                        ${active
                                            ? "text-[var(--brand-ink)] bg-[var(--surface-muted)]"
                                            : "text-[var(--text-secondary)] hover:text-[var(--brand-ink)] hover:bg-[var(--surface-muted)]"
                                        }
                                    `}
                                >
                                    {label}
                                    {active && (
                                        <span
                                            className="absolute bottom-0 left-3.5 right-3.5 h-0.5 rounded-none bg-[var(--brand-lime)]"
                                            aria-hidden="true"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Right side */}
                    <div className="hidden xl:flex items-center gap-2">
                        {DISCORD_URL ? (
                            <a
                                href={DISCORD_URL}
                                aria-label="Join EarnGrind on Discord"
                                className="flex h-8 w-8 items-center justify-center rounded-none text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--brand-ink)]"
                                target="_blank"
                                rel="noreferrer"
                            >
                                <DiscordIcon className="ti ti-brand-discord h-[17px] w-[17px]" />
                            </a>
                        ) : null}
                        <Link
                            href="/offers"
                            aria-label="Search offers"
                            className="flex h-8 w-8 items-center justify-center rounded-none text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--brand-ink)]"
                        >
                            <Search size={17} />
                        </Link>
                        <Link
                            href="/find-offers"
                            className="flex items-center gap-1.5 rounded-none bg-[var(--brand-ink)] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-[var(--brand-ink)]/90 active:translate-y-0"
                        >
                            Find Offers
                            <span aria-hidden="true" className="text-[var(--brand-lime)]">→</span>
                        </Link>
                    </div>

                    {/* Mobile controls */}
                    <div className="xl:hidden flex items-center gap-2">
                        {DISCORD_URL ? (
                            <a
                                href={DISCORD_URL}
                                aria-label="Join EarnGrind on Discord"
                                className="flex h-9 w-9 items-center justify-center rounded-none text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--brand-ink)]"
                                target="_blank"
                                rel="noreferrer"
                            >
                                <DiscordIcon className="ti ti-brand-discord h-[17px] w-[17px]" />
                            </a>
                        ) : null}
                        <Link
                            href="/find-offers"
                            className="rounded-none bg-[var(--brand-ink)] px-3.5 py-1.5 text-xs font-bold text-white"
                        >
                            Find Offers
                        </Link>
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label={mobileOpen ? "Close menu" : "Open menu"}
                            aria-expanded={mobileOpen}
                            aria-controls="mobile-navigation"
                            className="flex h-9 w-9 items-center justify-center rounded-none text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)]"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div id="mobile-navigation" className="xl:hidden border-t border-[var(--border-default)] bg-white">
                    <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1" aria-label="Mobile navigation">
                        {NAV_LINKS.map(({ href, label, activePrefixes, excludePrefixes }) => {
                            const active = isActivePath(pathname, { href, activePrefixes, excludePrefixes });
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center justify-between rounded-none px-4 py-3 text-sm font-semibold transition-colors ${active
                                        ? "bg-[var(--surface-muted)] text-[var(--brand-ink)]"
                                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--brand-ink)]"
                                        }`}
                                >
                                    {label}
                                    {active && (
                                        <span className="h-1.5 w-1.5 rounded-none bg-[var(--brand-lime)]" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </header>
    );
}
