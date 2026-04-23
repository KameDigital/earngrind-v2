"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ADMIN_LINKS = [
    { href: "/app/admin", label: "Admin Home" },
    { href: "/app/admin/offers", label: "Ingested Offers" },
    { href: "/app/admin/site-offers", label: "Manual Offers" },
    { href: "/app/admin/games", label: "Games" },
    { href: "/app/admin/guides", label: "Guides" },
    { href: "/app/admin/blog-posts", label: "Blog Posts" },
    { href: "/app/admin/outbound", label: "Outbound" },
] as const;

export default function AdminNav({ isAdmin }: { isAdmin: boolean }) {
    const pathname = usePathname();
    const router = useRouter();

    function isActive(href: string) {
        if (href === "/app/admin") {
            return pathname === href;
        }

        return pathname.startsWith(href);
    }

    return (
        <div className="min-w-0">
            <nav className="hidden sm:flex items-center gap-1 min-w-0">
                <NavLink href="/app/dashboard" active={pathname === "/app/dashboard"}>
                    Dashboard
                </NavLink>
                <NavLink href="/app/account" active={pathname.startsWith("/app/account")}>
                    Account
                </NavLink>

                {isAdmin && (
                    <>
                        <div className="mx-1 h-4 w-px flex-shrink-0 bg-gray-200" />
                        <span className="select-none px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            CMS
                        </span>
                        {ADMIN_LINKS.map(({ href, label }) => (
                            <NavLink key={href} href={href} active={isActive(href)}>
                                {label}
                            </NavLink>
                        ))}
                    </>
                )}
            </nav>

            {isAdmin && (
                <div className="sm:hidden">
                    <label className="sr-only" htmlFor="admin-nav-mobile">Navigate admin</label>
                    <select
                        id="admin-nav-mobile"
                        value={ADMIN_LINKS.find(({ href }) => isActive(href))?.href ?? ""}
                        onChange={(event) => {
                            if (event.target.value) {
                                router.push(event.target.value);
                            }
                        }}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                        <option value="" disabled>Admin</option>
                        {ADMIN_LINKS.map(({ href, label }) => (
                            <option key={href} value={href}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}

function NavLink({
    href,
    active,
    children,
}: {
    href: string;
    active: boolean;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className={`flex-shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                active
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
        >
            {children}
        </Link>
    );
}
