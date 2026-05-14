"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";

const NAV_LINKS = [
    { href: "/offers", label: "Offers" },
    { href: "/games", label: "Games" },
    { href: "/guides", label: "Guides" },
    { href: "/best-gpt-sites", label: "Best GPT Sites" },
    { href: "/reviews", label: "Platforms" },
    { href: "/blog", label: "Blog" },
];

export default function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    return (
        <header
            className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[var(--border-default)]"
            style={{ boxShadow: "0 1px 0 0 var(--border-default)" }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center h-16 gap-8">

                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex-shrink-0 flex items-center gap-1.5 group"
                        aria-label="EarnGrind home"
                    >
                        <span
                            className="w-2.5 h-2.5 rounded-full bg-[var(--brand-lime)] ring-2 ring-[var(--brand-lime)]/30 group-hover:scale-110 transition-transform"
                            aria-hidden="true"
                        />
                        <span className="text-[var(--brand-ink)] font-extrabold text-lg tracking-tight leading-none">
                            Earn<span className="text-[color:hsl(84,93%,36%)]">Grind</span>
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
                        {NAV_LINKS.map(({ href, label }) => {
                            const active = pathname === href || pathname.startsWith(href + "/");
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`
                                        relative px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors
                                        ${active
                                            ? "text-[var(--brand-ink)] bg-[var(--surface-muted)]"
                                            : "text-[var(--text-secondary)] hover:text-[var(--brand-ink)] hover:bg-[var(--surface-muted)]"
                                        }
                                    `}
                                >
                                    {label}
                                    {active && (
                                        <span
                                            className="absolute bottom-0 left-3.5 right-3.5 h-0.5 rounded-full bg-[var(--brand-lime)]"
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
                    <div className="hidden lg:flex items-center gap-2">
                        <Link
                            href="/offers"
                            aria-label="Search offers"
                            className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:text-[var(--brand-ink)] hover:bg-[var(--surface-muted)] transition-colors"
                        >
                            <Search size={17} />
                        </Link>
                        <Link
                            href="/offers"
                            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--brand-ink)] text-white text-sm font-bold rounded-xl hover:bg-[var(--brand-ink)]/90 transition-all hover:-translate-y-px active:translate-y-0 shadow-sm"
                        >
                            Find Offers
                            <span aria-hidden="true" className="text-[var(--brand-lime)]">-&gt;</span>
                        </Link>
                    </div>

                    {/* Mobile controls */}
                    <div className="lg:hidden flex items-center gap-2">
                        <Link
                            href="/offers"
                            className="px-3.5 py-1.5 bg-[var(--brand-ink)] text-white text-xs font-bold rounded-lg"
                        >
                            Find Offers
                        </Link>
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label={mobileOpen ? "Close menu" : "Open menu"}
                            className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] transition-colors"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="lg:hidden border-t border-[var(--border-default)] bg-white">
                    <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
                        {NAV_LINKS.map(({ href, label }) => {
                            const active = pathname === href || pathname.startsWith(href + "/");
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${active
                                        ? "bg-[var(--surface-muted)] text-[var(--brand-ink)]"
                                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--brand-ink)]"
                                        }`}
                                >
                                    {label}
                                    {active && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-lime)]" />
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
