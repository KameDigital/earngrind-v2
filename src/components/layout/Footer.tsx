import Link from "next/link";
import Container from "./Container";
import DiscordIcon from "@/components/icons/DiscordIcon";

const EXPLORE = [
    { href: "/offers", label: "All Offers" },
    { href: "/offers#games", label: "Games" },
    { href: "/guides", label: "Game Guides" },
    { href: "/guides/how-to-earn", label: "How-to-Earn Guides" },
    { href: "/best-gpt-sites", label: "Best GPT Sites" },
    { href: "/best-gpt-sites#platform-reviews", label: "Platform Reviews" },
    { href: "/blog", label: "Blog" },
];
const COMPANY = [
    { href: "/about",              label: "About" },
    { href: "/how-it-works",       label: "How It Works" },
    { href: "/legal/privacy",      label: "Privacy Policy" },
    { href: "/legal/terms",        label: "Terms of Service" },
    { href: "/legal/disclosure",   label: "Affiliate Disclosure" },
];

const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL?.trim() || null;

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-slate-800 bg-[var(--surface-dark)] text-slate-300">
            <Container>
                {/* Top grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-14">
                    {/* Brand column */}
                    <div className="col-span-2 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4 group w-fit">
                            <span className="h-2 w-2 rounded-none bg-[var(--brand-lime)]" />
                            <span className="text-lg font-bold tracking-tight text-white">
                                Earn<span className="text-[var(--brand-lime)]">Grind</span>
                            </span>
                        </Link>
                        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                            The smartest way to find, compare, and complete high-paying offerwall tasks — fully transparent, no bias.
                        </p>
                        {DISCORD_URL ? (
                            <a
                                href={DISCORD_URL}
                                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white transition-colors hover:text-[var(--brand-lime)]"
                                target="_blank"
                                rel="noreferrer"
                            >
                                <DiscordIcon className="ti ti-brand-discord h-4 w-4" />
                                Discord
                            </a>
                        ) : null}
                    </div>

                    {/* Explore */}
                    <div>
                        <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-500">Explore</h3>
                        <ul className="space-y-3">
                            {EXPLORE.map(({ href, label }) => (
                                <li key={href}>
                                    <Link href={href} className="text-sm text-slate-400 hover:text-white transition-colors">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-500">Company</h3>
                        <ul className="space-y-3">
                            {COMPANY.map(({ href, label }) => (
                                <li key={href}>
                                    <Link href={href} className="text-sm text-slate-400 hover:text-white transition-colors">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-slate-800 py-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <p className="text-xs text-slate-500">
                        © {year} EarnGrind. All rights reserved.
                    </p>
                    <p className="text-xs text-slate-500 text-center sm:text-right max-w-sm">
                        Some links are affiliate links — we may earn a commission at no cost to you.
                    </p>
                </div>
            </Container>
        </footer>
    );
}
