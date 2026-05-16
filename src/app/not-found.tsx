import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Page Not Found | EarnGrind",
    description: "The page you were looking for doesn't exist.",
};

export default function NotFound() {
    return (
        <main className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                {/* Large 404 */}
                <div className="text-[120px] font-extrabold text-gray-100 leading-none select-none mb-0">
                    404
                </div>

                {/* Icon */}
                <div className="text-4xl mb-4 -mt-4">🔍</div>

                <h1 className="text-2xl font-extrabold text-gray-900 mb-3">
                    Page not found
                </h1>
                <p className="text-gray-500 text-base mb-8 leading-relaxed">
                    The page you&apos;re looking for doesn&apos;t exist, may have been moved,
                    or the link might be incorrect.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
                    >
                        ← Go home
                    </Link>
                    <Link
                        href="/offers"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-lime-400 text-gray-900 font-bold rounded-xl hover:bg-lime-300 transition-all"
                    >
                        Browse offers
                    </Link>
                </div>

                {/* Quick links */}
                <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm">
                    {[
                        { href: "/guides", label: "Guides" },
                        { href: "/blog",   label: "Blog" },
                        { href: "/platforms", label: "Platforms" },
                    ].map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-gray-400 hover:text-lime-700 font-medium transition-colors"
                        >
                            {link.label} →
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
