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
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="bg-gray-900 px-4 py-3">
                    <div className="mb-0.5 text-[10px] font-extrabold uppercase tracking-widest text-lime-400">Quick Info</div>
                    <div className="text-sm font-bold text-white">{gameName}</div>
                </div>
                <div className="space-y-2.5 px-4 py-3">
                    {guide.max_payout_usd != null ? (
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-500">Max payout</span>
                            <span className="font-extrabold text-lime-700">${guide.max_payout_usd.toFixed(2)}</span>
                        </div>
                    ) : null}
                    {guide.difficulty ? (
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-500">Difficulty</span>
                            <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${DIFF_BADGE[guide.difficulty] ?? "bg-gray-100 text-gray-600"}`}>
                                {guide.difficulty}
                            </span>
                        </div>
                    ) : null}
                    {guide.estimated_time ? (
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-500">Time</span>
                            <span className="font-semibold text-gray-700">{guide.estimated_time}</span>
                        </div>
                    ) : null}
                    {tipCount > 0 ? (
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-500">Tips included</span>
                            <span className="font-semibold text-gray-700">{tipCount}</span>
                        </div>
                    ) : null}
                </div>
                <div className="px-4 pb-4">
                    <Link
                        href={`/games/${gameSlug}`}
                        className="block w-full rounded-xl bg-gray-900 px-4 py-2.5 text-center text-sm font-extrabold text-lime-400 shadow-sm transition hover:bg-gray-800"
                    >
                        Compare live offers
                    </Link>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Quick Navigation</div>
                <nav className="space-y-1 text-sm">
                    {[
                        { href: "#overview", label: "Overview" },
                        { href: "#steps", label: "Steps" },
                        ...(tipCount > 0 ? [{ href: "#tips", label: "Tips" }] : []),
                    ].map(({ href, label }) => (
                        <a
                            key={href}
                            href={href}
                            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                        >
                            {label}
                        </a>
                    ))}
                </nav>
            </div>

            {guide.show_related_guides && relatedGuides.length > 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                        More {gameName} Guides
                    </div>
                    <div className="space-y-2">
                        {relatedGuides.map((g) => (
                            <Link
                                key={g.id}
                                href={`/guides/${g.slug}`}
                                className="group block rounded-xl border border-gray-100 p-2.5 transition-all hover:border-lime-300 hover:bg-lime-50/50"
                            >
                                <div className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-lime-700">
                                    {g.title}
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                                    {g.difficulty ? (
                                        <span className={`rounded px-1.5 py-0.5 font-bold uppercase ${DIFF_BADGE[g.difficulty] ?? ""}`}>
                                            {g.difficulty}
                                        </span>
                                    ) : null}
                                    {g.estimated_time ? <span>{g.estimated_time}</span> : null}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            ) : null}

            {guide.show_related_offers && relatedOffers.length > 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                        Top Offers
                    </div>
                    <div className="space-y-2">
                        {relatedOffers.map((o) => (
                            <Link
                                key={o.id}
                                href={`/offers/${o.game_slug}`}
                                className="group flex items-center justify-between rounded-xl border border-gray-100 px-2.5 py-2 transition-all hover:border-lime-300 hover:bg-lime-50/50"
                            >
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-gray-900 transition-colors group-hover:text-lime-700">
                                        {o.game_name}
                                    </div>
                                    <div className="truncate text-xs text-gray-400">{o.platform_name}</div>
                                </div>
                                <span className="ml-2 shrink-0 text-sm font-extrabold text-lime-700">
                                    ${o.payout_usd.toFixed(2)}
                                </span>
                            </Link>
                        ))}
                    </div>
                    <Link
                        href="/offers"
                        className="mt-3 block text-center text-xs font-semibold text-gray-400 transition-colors hover:text-gray-700"
                    >
                        View all offers
                    </Link>
                </div>
            ) : null}
        </aside>
    );
}
