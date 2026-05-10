import Image from "next/image";
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
    heroImageUrl?: string | null;
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

export default function GuideHeader({ guide, gameName, gameSlug, heroImageUrl }: GuideHeaderProps) {
    const diff = DIFFICULTY_STYLES[guide.difficulty ?? ""] ?? null;
    const label = LAYOUT_LABELS[guide.layout_style] ?? "Guide";
    const tipCount = (guide.tips ?? []).length;
    const updatedDate = new Date(guide.updated_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    return (
        <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center gap-1.5 py-3 text-xs font-medium text-gray-400">
                    <Link href="/" className="transition-colors hover:text-lime-700">Home</Link>
                    <span>/</span>
                    <Link href="/guides" className="transition-colors hover:text-lime-700">Guides</Link>
                    <span>/</span>
                    <Link href={`/games/${gameSlug}`} className="transition-colors hover:text-lime-700">{gameName}</Link>
                    <span>/</span>
                    <span className="text-gray-600">{label}</span>
                </div>

                <div className="grid gap-5 border-b border-gray-100 pb-5 lg:grid-cols-[1fr_360px] lg:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="rounded border border-lime-200 bg-lime-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-lime-700">
                                {label}
                            </span>
                        </div>

                        <h1 className="mb-2 text-2xl font-extrabold leading-snug tracking-tight text-gray-900 sm:text-3xl">
                            {guide.title}
                        </h1>

                        {guide.excerpt ? (
                            <p className="mb-3 max-w-3xl text-sm leading-relaxed text-gray-600">
                                {guide.excerpt}
                            </p>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-2">
                            {guide.difficulty && diff ? (
                                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold uppercase ${diff.badge}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${diff.bar}`} />
                                    {guide.difficulty}
                                </span>
                            ) : null}
                            {guide.max_payout_usd != null ? (
                                <span className="rounded-lg border border-lime-200 bg-lime-50 px-2.5 py-1 text-xs font-extrabold text-lime-700">
                                    Up to ${guide.max_payout_usd.toFixed(2)}
                                </span>
                            ) : null}
                            {guide.estimated_time ? (
                                <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600">
                                    {guide.estimated_time}
                                </span>
                            ) : null}
                            <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-500">
                                Last updated: {updatedDate}
                            </span>
                        </div>
                    </div>

                    {heroImageUrl ? (
                        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm">
                            <Image
                                src={heroImageUrl}
                                alt={`${gameName} guide preview`}
                                fill
                                sizes="(min-width: 1024px) 360px, 100vw"
                                className="object-cover"
                                priority
                                unoptimized={heroImageUrl.startsWith("http")}
                            />
                        </div>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3 py-3">
                    <Link
                        href={`/games/${gameSlug}`}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-gray-900 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-gray-800"
                    >
                        Compare live offers for this game
                    </Link>
                    <Link
                        href={`/offers/${gameSlug}`}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300"
                    >
                        Check payout routes
                    </Link>
                    <Link
                        href="/guides"
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300"
                    >
                        All Guides
                    </Link>

                    {guide.video_url ? (
                        <a
                            href={guide.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                            Watch Video
                        </a>
                    ) : null}

                    <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
                        {tipCount > 0 ? <span>{tipCount} tip{tipCount !== 1 ? "s" : ""}</span> : null}
                        <div className="hidden items-center gap-3 border-l border-gray-200 pl-3 md:flex">
                            <a href="#overview" className="transition-colors hover:text-gray-700">Overview</a>
                            <a href="#steps" className="transition-colors hover:text-gray-700">Steps</a>
                            {tipCount > 0 ? <a href="#tips" className="transition-colors hover:text-gray-700">Tips</a> : null}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
