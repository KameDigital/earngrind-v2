"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { logout } from "@/app/login/actions";
import DiscordIcon from "@/components/icons/DiscordIcon";

const NAV_LINKS = [
    { href: "/offers", label: "Offers & Games", activePrefixes: ["/games"] },
    { href: "/find-offers", label: "Find Offers" },
    { href: "/guides", label: "Guides", excludePrefixes: ["/guides/best-gpt-sites", "/guides/fanduel-casino-review-bonus"] },
    { href: "/best-gpt-sites", label: "Best GPT Sites", activePrefixes: ["/guides/best-gpt-sites", "/review", "/reviews", "/platforms", "/guides/fanduel-casino-review-bonus"] },
    { href: "/blog", label: "Blog" },
];
const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL?.trim() || null;

function isActive(pathname: string, link: typeof NAV_LINKS[number]) {
    if (link.activePrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return true;
    if (link.excludePrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return false;
    return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export default function HeaderClient({ account }: { account: { label: string } | null }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const accountLinks = account ? [{ href: "/account", label: account.label }, { href: "/account/settings", label: "Settings" }] : [{ href: "/login", label: "Log in" }, { href: "/signup", label: "Create account" }];
    return <header className="sticky top-0 z-50 border-b border-[var(--border-default)] bg-white/95 backdrop-blur-md"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex h-12 items-center gap-4 lg:gap-8"><Link href="/" className="flex shrink-0 items-center gap-1.5" aria-label="EarnGrind home"><span className="h-2 w-2 bg-[var(--brand-lime)] ring-2 ring-[var(--brand-lime)]/30" /><span className="text-sm font-extrabold tracking-tight text-[var(--brand-ink)]">Earn<span className="text-[color:hsl(84,93%,36%)]">Grind</span></span></Link><nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">{NAV_LINKS.map((link) => <Link key={link.href} href={link.href} className={`px-3.5 py-2 text-xs font-semibold ${isActive(pathname, link) ? "bg-[var(--surface-muted)] text-[var(--brand-ink)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--brand-ink)]"}`}>{link.label}</Link>)}</nav><div className="flex-1" /><div className="hidden items-center gap-2 lg:flex">{DISCORD_URL ? <a href={DISCORD_URL} aria-label="Join EarnGrind on Discord" className="p-2 text-[var(--text-secondary)]" target="_blank" rel="noreferrer"><DiscordIcon className="h-[17px] w-[17px]" /></a> : null}<Link href="/offers" aria-label="Search offers" className="p-2 text-[var(--text-secondary)]"><Search size={17} /></Link>{accountLinks.map((link, index) => <Link key={link.href} href={link.href} className={index === 1 || (!account && index === 1) ? "bg-[var(--brand-ink)] px-3 py-2 text-xs font-bold text-white" : "px-2 py-2 text-xs font-bold text-[var(--brand-ink)]"}>{link.label}</Link>)}{account ? <form action={logout}><button className="px-2 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--brand-ink)]">Log out</button></form> : null}</div><div className="flex items-center gap-2 lg:hidden"><Link href={account ? "/account" : "/login"} className="bg-[var(--brand-ink)] px-3 py-1.5 text-xs font-bold text-white">{account ? "Account" : "Log in"}</Link><button onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} aria-controls="mobile-navigation" className="p-2 text-[var(--text-secondary)]">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button></div></div></div>{mobileOpen ? <div id="mobile-navigation" className="border-t border-[var(--border-default)] bg-white lg:hidden"><nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3" aria-label="Mobile navigation">{[...NAV_LINKS, ...accountLinks].map((link) => <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={`px-4 py-3 text-sm font-semibold ${isActive(pathname, link as typeof NAV_LINKS[number]) ? "bg-[var(--surface-muted)] text-[var(--brand-ink)]" : "text-[var(--text-secondary)]"}`}>{link.label}</Link>)}{account ? <form action={logout}><button className="w-full px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">Log out</button></form> : null}</nav></div> : null}</header>;
}
