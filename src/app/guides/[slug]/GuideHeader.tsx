import Link from "next/link";

export interface GuideHeaderProps {
    guide: {
        title: string;
        slug: string;
        excerpt: string | null;
        difficulty: string | null;
        max_payout_usd: number | null;
        estimated_time: string | null;
        tips: string[];
        layout_style: string;
        updated_at: string;
        video_url: string | null;
    };
    gameName: string;
    gameSlug: string;
}

const DIFFICULTY_STYLES: Record<string, { bar: string; badge: string }> = {
    easy:   { bar: "bg-green-500",  badge: "bg-green-100 text-green-700 border-green-200" },
    medium: { bar: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    hard:   { bar: "bg-red-500",    badge: "bg-red-100 text-red-700 border-red-200" },
};

const LAYOUT_LABELS: Record<string, string> = {
    classic: "Strategy Guide",
    steps:   "Walkthrough",
    pro:     "Pro Guide",
};

export default function GuideHeader({ guide, gameName, gameSlug }: GuideHeaderProps) {
    const diff  = DIFFICULTY_STYLES[guide.difficulty ?? ""] ?? null;
    const label = LAYOUT_LABELS[guide.layout_style] ?? "Guide";
    const tipCount = (guide.tips ?? []).length;
    const updatedDate = new Date(guide.updated_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric"
    });

    return (
        <header className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ── Row 1: Breadcrumbs ── */}
                <div className="flex items-center gap-1.5 py-3 text-xs text-gray-400 font-medium flex-wrap">
                    <Link href="/" className="hover:text-lime-700 transition-colors">Home</Link>
                    <span>/</span>
                    <Link href="/offers" className="hover:text-lime-700 transition-colors">Offers</Link>
                    <span>/</span>
                    <Link href={`/offers/${gameSlug}`} className="hover:text-lime-700 transition-colors">{gameName}</Link>
                    <span>/</span>
                    <span className="text-gray-600">{label}</span>
                </div>

                {/* ── Row 2: Title + Badges ── */}
                <div className="pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-lime-700 bg-lime-100 border border-lime-200 px-2 py-0.5 rounded">
                            📖 {label}
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug mb-2">
                        {guide.title}
                    </h1>

                    {guide.excerpt && (
                        <p className="text-gray-500 text-sm leading-relaxed max-w-2xl mb-3">
                            {guide.excerpt}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                        {guide.difficulty && diff && (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase px-2.5 py-1 rounded-lg border ${diff.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${diff.bar}`} />
                                {guide.difficulty}
                            </span>
                        )}
                        {guide.max_payout_usd != null && (
                            <span className="text-xs font-extrabold text-lime-700 bg-lime-50 border border-lime-200 px-2.5 py-1 rounded-lg">
                                💰 Up to ${guide.max_payout_usd.toFixed(2)}
                            </span>
                        )}
                        {guide.estimated_time && (
                            <span className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                                ⏱ {guide.estimated_time}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Row 3: Action / Utility Bar ── */}
                <div className="flex items-center gap-3 py-3 flex-wrap">
                    <Link
                        href={`/offers/${gameSlug}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-extrabold rounded-xl hover:bg-gray-800 transition shadow-sm whitespace-nowrap"
                    >
                        View Offer →
                    </Link>
                    <Link
                        href={`/offers/${gameSlug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:border-gray-300 transition whitespace-nowrap"
                    >
                        All Guides
                    </Link>

                    {guide.video_url && (
                        <a
                            href={guide.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl hover:bg-red-100 transition whitespace-nowrap"
                        >
                            ▶ Watch Video
                        </a>
                    )}

                    <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
                        {tipCount > 0 && (
                            <span className="flex items-center gap-1">
                                <span>💡</span> {tipCount} tip{tipCount !== 1 ? "s" : ""}
                            </span>
                        )}
                        <span>Updated {updatedDate}</span>
                        {/* Anchor nav */}
                        <div className="hidden md:flex items-center gap-3 pl-3 border-l border-gray-200">
                            <a href="#overview" className="hover:text-gray-700 transition-colors">Overview</a>
                            <a href="#steps" className="hover:text-gray-700 transition-colors">Steps</a>
                            {tipCount > 0 && <a href="#tips" className="hover:text-gray-700 transition-colors">Tips</a>}
                        </div>
                    </div>
                </div>

            </div>
        </header>
    );
}
