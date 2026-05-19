"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    BarChart3,
    BookOpenText,
    Boxes,
    ClipboardList,
    Compass,
    DollarSign,
    FileText,
    Gamepad2,
    Home,
    LayoutDashboard,
    LibraryBig,
    Link2,
    Microscope,
    MousePointerClick,
    Search,
    Sparkles,
    TrendingDown,
    Upload,
    Users,
    WalletCards,
} from "lucide-react";

type AdminLink = {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
};

type AdminSection = {
    label: string;
    links: AdminLink[];
};

const BASE_LINKS: AdminLink[] = [
    { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/account", label: "Account", icon: Home },
];

const ADMIN_SECTIONS: AdminSection[] = [
    {
        label: "Command",
        links: [
            { href: "/app/admin", label: "Admin Home", icon: Home },
            { href: "/app/admin/monetization", label: "Monetization", icon: DollarSign },
            { href: "/app/admin/seo/action-plan", label: "SEO Action Plan", icon: Compass },
            { href: "/app/admin/content-queue", label: "Content Queue", icon: ClipboardList },
        ],
    },
    {
        label: "Content",
        links: [
            { href: "/app/admin/guides", label: "Guides", icon: BookOpenText },
            { href: "/app/admin/guides/batch-generate", label: "Batch Generate", icon: Sparkles },
            { href: "/app/admin/guides/analytics", label: "Guide Analytics", icon: BarChart3 },
            { href: "/app/admin/guides/optimization", label: "Guide Optimization", icon: Search },
            { href: "/app/admin/guides/internal-links", label: "Internal Links", icon: Link2 },
            { href: "/app/admin/blog-posts", label: "Blog Posts", icon: FileText },
        ],
    },
    {
        label: "Offers",
        links: [
            { href: "/app/admin/earn-offers", label: "Earn Offers", icon: MousePointerClick },
            { href: "/app/admin/earn-users", label: "Earn Users", icon: Users },
            { href: "/app/admin/conversions", label: "Conversions", icon: BarChart3 },
            { href: "/app/admin/rewards", label: "Reward Ledger", icon: WalletCards },
            { href: "/app/admin/site-offers", label: "Manual Offers", icon: Boxes },
            { href: "/app/admin/offers", label: "Ingested Offers", icon: LibraryBig },
            { href: "/app/admin/outbound", label: "Outbound Analytics", icon: BarChart3 },
        ],
    },
    {
        label: "SEO",
        links: [
            { href: "/app/admin/seo/search-console", label: "Search Console", icon: Search },
            { href: "/app/admin/seo/search-console-import", label: "GSC Import", icon: Upload },
            { href: "/app/admin/seo/query-opportunities", label: "Query Opportunities", icon: Compass },
            { href: "/app/admin/seo/serp-refresh", label: "SERP Refresh", icon: Sparkles },
            { href: "/app/admin/seo/content-decay", label: "Content Decay", icon: TrendingDown },
        ],
    },
    {
        label: "Research",
        links: [
            { href: "/app/admin/research", label: "Research Locker", icon: Microscope },
            { href: "/app/admin/research/opportunities", label: "Research Opportunities", icon: Compass },
        ],
    },
    {
        label: "Catalog",
        links: [
            { href: "/app/admin/games", label: "Games", icon: Gamepad2 },
        ],
    },
];

const MOBILE_LINKS = [
    ...BASE_LINKS,
    ...ADMIN_SECTIONS.flatMap((section) => section.links),
] as const;

export default function AdminNav({ isAdmin }: { isAdmin: boolean }) {
    const pathname = usePathname();
    const router = useRouter();

    function isActive(href: string) {
        if (href === "/app/admin") return pathname === href;
        if (href === "/app/admin/guides") {
            return pathname === href || (
                pathname.startsWith("/app/admin/guides/")
                && !pathname.startsWith("/app/admin/guides/analytics")
                && !pathname.startsWith("/app/admin/guides/optimization")
                && !pathname.startsWith("/app/admin/guides/internal-links")
                && !pathname.startsWith("/app/admin/guides/batch-generate")
            );
        }
        if (href === "/app/admin/seo/search-console") {
            return pathname === href;
        }
        return pathname.startsWith(href);
    }

    if (!isAdmin) {
        return (
            <nav className="flex items-center gap-1">
                {BASE_LINKS.map((link) => (
                    <NavLink key={link.href} link={link} active={isActive(link.href)} />
                ))}
            </nav>
        );
    }

    return (
        <>
            <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block">
                <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto px-3 py-4">
                    <div className="space-y-5">
                        {ADMIN_SECTIONS.map((section) => (
                            <div key={section.label}>
                                <div className="px-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-gray-400">
                                    {section.label}
                                </div>
                                <div className="mt-2 space-y-1">
                                    {section.links.map((link) => (
                                        <NavLink key={link.href} link={link} active={isActive(link.href)} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            <div className="lg:hidden">
                <label className="sr-only" htmlFor="admin-nav-mobile">Navigate admin</label>
                <select
                    id="admin-nav-mobile"
                    value={MOBILE_LINKS.find(({ href }) => isActive(href))?.href ?? ""}
                    onChange={(event) => {
                        if (event.target.value) router.push(event.target.value);
                    }}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-800 shadow-sm focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-100"
                >
                    <option value="" disabled>Navigate</option>
                    {MOBILE_LINKS.map(({ href, label }) => (
                        <option key={href} value={href}>{label}</option>
                    ))}
                </select>
            </div>
        </>
    );
}

function NavLink({ link, active }: { link: AdminLink; active: boolean }) {
    const Icon = link.icon;
    return (
        <Link
            href={link.href}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                active
                    ? "bg-gray-950 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
            }`}
        >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{link.label}</span>
        </Link>
    );
}
