"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_LINKS = [
    { href: "/app/admin/offers",      label: "Offers",      icon: "📥" },
    { href: "/app/admin/site-offers", label: "Manual",      icon: "✏️" },
    { href: "/app/admin/games",       label: "Games",       icon: "🎮" },
    { href: "/app/admin/guides",      label: "Guides",      icon: "📖" },
    { href: "/app/admin/blog-posts",  label: "Blog",        icon: "✍️" },
] as const;

export default function AdminNav({ isAdmin }: { isAdmin: boolean }) {
    const pathname = usePathname();

    function isActive(href: string) {
        return pathname.startsWith(href);
    }

    return (
        <nav className="hidden sm:flex items-center gap-1 min-w-0">
            <NavLink href="/app/dashboard" active={pathname === "/app/dashboard"}>
                Dashboard
            </NavLink>
            <NavLink href="/app/account" active={pathname.startsWith("/app/account")}>
                Account
            </NavLink>

            {isAdmin && (
                <>
                    <div className="w-px h-4 bg-gray-200 mx-1 flex-shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1 select-none flex-shrink-0">
                        CMS
                    </span>
                    {ADMIN_LINKS.map(({ href, label, icon }) => (
                        <NavLink key={href} href={href} active={isActive(href)}>
                            <span className="hidden lg:inline">{icon} </span>{label}
                        </NavLink>
                    ))}
                </>
            )}
        </nav>
    );
}

function NavLink({ href, active, children }: {
    href: string;
    active: boolean;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                active
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
        >
            {children}
        </Link>
    );
}
