import Link from "next/link";
import { ReactNode } from "react";
import { LEGAL_EMAIL } from "@/lib/constants";

export default function LegalLayout({ children }: { children: ReactNode }) {
    return (
        <main className="min-h-screen bg-[#f5f5f0] py-14 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-400 font-medium mb-8">
                    <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
                    <span>/</span>
                    <span>Legal</span>
                </nav>

                {/* Legal nav */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {[
                        { href: "/legal/privacy",     label: "Privacy Policy" },
                        { href: "/legal/terms",        label: "Terms of Service" },
                        { href: "/legal/disclosure",   label: "Affiliate Disclosure" },
                    ].map(l => (
                        <Link key={l.href} href={l.href}
                            className="text-xs font-semibold px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:border-lime-300 hover:text-lime-700 transition-colors shadow-sm">
                            {l.label}
                        </Link>
                    ))}
                </div>

                {/* Page content */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 prose prose-sm max-w-none prose-headings:font-extrabold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600">
                    {children}
                </div>

                <p className="text-center text-xs text-gray-400 mt-8">
                    EarnGrind · Questions? Contact us at{" "}
                    <a href={`mailto:${LEGAL_EMAIL}`} className="hover:text-lime-700 transition-colors underline">
                        {LEGAL_EMAIL}
                    </a>
                </p>
            </div>
        </main>
    );
}
