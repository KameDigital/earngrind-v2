import Link from "next/link";
import Container from "./Container";

const EXPLORE = [
    { href: "/offers", label: "All Offers" },
    { href: "/games", label: "Games" },
    { href: "/guides", label: "Game Guides" },
    { href: "/platforms", label: "Platform Reviews" },
    { href: "/blog", label: "Blog" },
];
const COMPANY = [
    { href: "/about",              label: "About" },
    { href: "/how-it-works",       label: "How It Works" },
    { href: "/legal/privacy",      label: "Privacy Policy" },
    { href: "/legal/terms",        label: "Terms of Service" },
    { href: "/legal/disclosure",   label: "Affiliate Disclosure" },
];


export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-[var(--border-default)] bg-[var(--surface-muted)]">
            <Container>
                {/* Top grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-14">
                    {/* Brand column */}
                    <div className="col-span-2 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4 group w-fit">
                            <span className="w-2 h-2 rounded-full bg-[var(--brand-lime)]" />
                            <span className="text-lg font-bold tracking-tight text-[var(--brand-ink)]">
                                Earn<span className="text-lime-500">Grind</span>
                            </span>
                        </Link>
                        <p className="text-sm text-[var(--text-tertiary)] max-w-xs leading-relaxed">
                            The smartest way to find, compare, and complete high-paying offerwall tasks — fully transparent, no bias.
                        </p>
                    </div>

                    {/* Explore */}
                    <div>
                        <h3 className="section-label mb-5">Explore</h3>
                        <ul className="space-y-3">
                            {EXPLORE.map(({ href, label }) => (
                                <li key={href}>
                                    <Link href={href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-ink)] transition-colors">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="section-label mb-5">Company</h3>
                        <ul className="space-y-3">
                            {COMPANY.map(({ href, label }) => (
                                <li key={href}>
                                    <Link href={href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-ink)] transition-colors">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-[var(--border-default)] py-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <p className="text-xs text-[var(--text-tertiary)]">
                        © {year} EarnGrind. All rights reserved.
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] text-center sm:text-right max-w-sm">
                        Some links are affiliate links — we may earn a commission at no cost to you.
                    </p>
                </div>
            </Container>
        </footer>
    );
}
