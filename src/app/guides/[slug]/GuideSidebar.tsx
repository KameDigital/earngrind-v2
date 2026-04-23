import Link from "next/link";

interface RelatedGuide {
    id: string;
    title: string;
    slug: string;
    difficulty: string | null;
    estimated_time: string | null;
}

interface RelatedOffer {
    id: string;
    game_name: string;
    game_slug: string;
    platform_name: string;
    payout_usd: number;
}

export interface GuideSidebarProps {
    guide: {
        id: string;
        max_payout_usd: number | null;
        difficulty: string | null;
        estimated_time: string | null;
        tips: string[];
        show_related_offers: boolean;
        show_related_guides: boolean;
    };
    gameName: string;
    gameSlug: string;
    relatedGuides: RelatedGuide[];
    relatedOffers: RelatedOffer[];
}

const DIFF_BADGE: Record<string, string> = {
    easy:   "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    hard:   "bg-red-100 text-red-700",
};

export default function GuideSidebar({
    guide, gameName, gameSlug, relatedGuides, relatedOffers,
}: GuideSidebarProps) {
    const tipCount = (guide.tips ?? []).length;

    return (
        <aside className="space-y-4">

            {/* Box 1 — Quick Info + CTA */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-900 px-4 py-3">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-lime-400 mb-0.5">Quick Info</div>
                    <div className="text-white font-bold text-sm">{gameName}</div>
                </div>
                <div className="px-4 py-3 space-y-2.5">
                    {guide.max_payout_usd != null && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 font-medium">Max payout</span>
                            <span className="font-extrabold text-lime-700">${guide.max_payout_usd.toFixed(2)}</span>
                        </div>
                    )}
                    {guide.difficulty && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 font-medium">Difficulty</span>
                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${DIFF_BADGE[guide.difficulty] ?? "bg-gray-100 text-gray-600"}`}>
                                {guide.difficulty}
                            </span>
                        </div>
                    )}
                    {guide.estimated_time && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 font-medium">Time</span>
                            <span className="font-semibold text-gray-700">{guide.estimated_time}</span>
                        </div>
                    )}
                    {tipCount > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 font-medium">Tips included</span>
                            <span className="font-semibold text-gray-700">{tipCount}</span>
                        </div>
                    )}
                </div>
                <div className="px-4 pb-4">
                    <Link
                        href={`/offers/${gameSlug}`}
                        className="block w-full text-center px-4 py-2.5 bg-gray-900 text-lime-400 text-sm font-extrabold rounded-xl hover:bg-gray-800 transition shadow-sm"
                    >
                        View Offer →
                    </Link>
                </div>
            </div>

            {/* Box 4 — Anchor Navigation (shown near top for UX) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">Quick Navigation</div>
                <nav className="space-y-1 text-sm">
                    {[
                        { href: "#overview", label: "📋 Overview" },
                        { href: "#steps",    label: "🪜 Steps" },
                        ...(tipCount > 0 ? [{ href: "#tips", label: "💡 Tips" }] : []),
                    ].map(({ href, label }) => (
                        <a
                            key={href}
                            href={href}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors font-medium"
                        >
                            {label}
                        </a>
                    ))}
                </nav>
            </div>

            {/* Box 2 — Related Guides */}
            {guide.show_related_guides && relatedGuides.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">
                        More {gameName} Guides
                    </div>
                    <div className="space-y-2">
                        {relatedGuides.map((g) => (
                            <Link
                                key={g.id}
                                href={`/guides/${g.slug}`}
                                className="group block p-2.5 rounded-xl border border-gray-100 hover:border-lime-300 hover:bg-lime-50/50 transition-all"
                            >
                                <div className="text-sm font-semibold text-gray-900 group-hover:text-lime-700 transition-colors leading-snug line-clamp-2">
                                    {g.title}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                    {g.difficulty && (
                                        <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${DIFF_BADGE[g.difficulty] ?? ""}`}>
                                            {g.difficulty}
                                        </span>
                                    )}
                                    {g.estimated_time && <span>{g.estimated_time}</span>}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Box 3 — Related Offers */}
            {guide.show_related_offers && relatedOffers.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">
                        Top Offers
                    </div>
                    <div className="space-y-2">
                        {relatedOffers.map((o) => (
                            <Link
                                key={o.id}
                                href={`/offers/${o.game_slug}`}
                                className="group flex items-center justify-between px-2.5 py-2 rounded-xl border border-gray-100 hover:border-lime-300 hover:bg-lime-50/50 transition-all"
                            >
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-gray-900 group-hover:text-lime-700 transition-colors truncate">
                                        {o.game_name}
                                    </div>
                                    <div className="text-xs text-gray-400 truncate">{o.platform_name}</div>
                                </div>
                                <span className="text-sm font-extrabold text-lime-700 flex-shrink-0 ml-2">
                                    ${o.payout_usd.toFixed(2)}
                                </span>
                            </Link>
                        ))}
                    </div>
                    <Link
                        href="/offers"
                        className="block mt-3 text-center text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
                    >
                        View all offers →
                    </Link>
                </div>
            )}

        </aside>
    );
}
