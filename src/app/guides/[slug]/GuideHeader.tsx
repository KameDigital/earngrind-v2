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
    classic:        "Strategy Guide",
    steps:          "Walkthrough",
    pro:            "Pro Guide",
    conversion:     "Offer Guide",
    pro_conversion: "Pro Conversion Guide",
};

const ZOMBIE_WAVES_TOROX_LEVEL_100_SLUG = "zombie-waves-offer-guide-level-100-torox-route";

export default function GuideHeader({ guide, gameName, gameSlug, heroImageUrl }: GuideHeaderProps) {
    const diff = DIFFICULTY_STYLES[guide.difficulty ?? ""] ?? null;
    const label = LAYOUT_LABELS[guide.layout_style] ?? "Guide";
    const tipCount = (guide.tips ?? []).length;
    const updatedDate = new Date(guide.updated_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
    const useZombieWavesHero = guide.slug === ZOMBIE_WAVES_TOROX_LEVEL_100_SLUG && Boolean(heroImageUrl);

    if (useZombieWavesHero) {
        return (
            <header
                className="zombie-waves-guide-hero relative isolate overflow-hidden border-b border-cyan-300/20 bg-slate-950 text-white"
                style={{ backgroundImage: `url(${heroImageUrl})` }}
            >
                <style>{`
                    .zombie-waves-guide-hero {
                        background-size: cover;
                        background-position: center;
                        background-repeat: no-repeat;
                    }
                    @media (max-width: 640px) {
                        .zombie-waves-guide-hero {
                            background-position: center 42%;
                        }
                    }
                `}</style>
                <div className="absolute inset-0 -z-10 bg-slate-950/68" />
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(8,47,73,0.18),rgba(2,6,23,0.84)_62%,rgba(2,6,23,0.94)_100%)]" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/45 via-slate-950/58 to-slate-950/92" />
                <div className="absolute inset-x-0 top-0 -z-10 h-28 bg-gradient-to-b from-slate-950/80 to-transparent" />

                <div className="mx-auto flex min-h-[520px] max-w-7xl flex-col px-4 sm:min-h-[500px] sm:px-6 lg:min-h-[540px] lg:px-8">
                    <nav className="flex flex-wrap items-center gap-1.5 py-4 text-xs font-semibold text-cyan-50/75" aria-label="Breadcrumb">
                        <Link href="/" className="transition-colors hover:text-white">Home</Link>
                        <span>/</span>
                        <Link href="/guides" className="transition-colors hover:text-white">Guides</Link>
                        <span>/</span>
                        <Link href={`/games/${gameSlug}`} className="transition-colors hover:text-white">{gameName}</Link>
                        <span>/</span>
                        <span className="text-white">{label}</span>
                    </nav>

                    <div className="flex flex-1 items-center justify-center py-9 sm:py-12 lg:py-14">
                        <div className="mx-auto max-w-4xl text-center">
                            <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
                                {["Torox Offer Guide", "Level 100 Route", gameName].map((badge) => (
                                    <span
                                        key={badge}
                                        className="rounded-full border border-cyan-200/35 bg-cyan-200/12 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-cyan-50 shadow-[0_10px_30px_rgba(2,6,23,0.28)] backdrop-blur"
                                    >
                                        {badge}
                                    </span>
                                ))}
                            </div>

                            <h1 className="text-balance text-3xl font-black leading-tight tracking-tight text-white drop-shadow-[0_3px_24px_rgba(0,0,0,0.82)] sm:text-5xl lg:text-6xl">
                                {guide.title}
                            </h1>

                            {guide.excerpt ? (
                                <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-slate-100 drop-shadow-[0_2px_16px_rgba(0,0,0,0.82)] sm:text-lg">
                                    {guide.excerpt}
                                </p>
                            ) : null}

                            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                                {guide.difficulty && diff ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-200/40 bg-lime-200/14 px-3 py-1.5 text-xs font-extrabold uppercase text-lime-50 backdrop-blur">
                                        <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
                                        {guide.difficulty}
                                    </span>
                                ) : null}
                                {guide.max_payout_usd != null ? (
                                    <span className="rounded-full border border-lime-200/45 bg-lime-200/16 px-3 py-1.5 text-xs font-extrabold text-lime-50 backdrop-blur">
                                        Up to ${guide.max_payout_usd.toFixed(2)}
                                    </span>
                                ) : null}
                                {guide.estimated_time ? (
                                    <span className="rounded-full border border-white/25 bg-white/12 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                                        {guide.estimated_time}
                                    </span>
                                ) : null}
                                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-100 backdrop-blur">
                                    Updated {updatedDate}
                                </span>
                            </div>

                            <div className="mx-auto mt-8 flex max-w-2xl flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                                <Link
                                    href={`/games/${gameSlug}`}
                                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-lime-300 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-[0_18px_42px_rgba(0,0,0,0.34)] transition hover:bg-lime-200 focus:outline-none focus:ring-4 focus:ring-lime-200/40 sm:w-auto"
                                >
                                    Compare live offers
                                </Link>
                                <Link
                                    href={`/offers/${gameSlug}`}
                                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-cyan-100/35 bg-white/12 px-5 py-3 text-sm font-extrabold text-white shadow-[0_14px_36px_rgba(0,0,0,0.26)] backdrop-blur transition hover:border-cyan-100/60 hover:bg-white/18 focus:outline-none focus:ring-4 focus:ring-cyan-100/25 sm:w-auto"
                                >
                                    Check payout routes
                                </Link>
                                <Link
                                    href="/guides"
                                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/20 bg-slate-950/35 px-5 py-3 text-sm font-bold text-slate-100 backdrop-blur transition hover:border-white/35 hover:bg-slate-950/50 focus:outline-none focus:ring-4 focus:ring-white/20 sm:w-auto"
                                >
                                    All Guides
                                </Link>
                            </div>

                            {guide.video_url ? (
                                <a
                                    href={guide.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center justify-center rounded-xl border border-red-200/35 bg-red-400/16 px-4 py-2 text-xs font-extrabold text-red-50 backdrop-blur transition hover:bg-red-400/24"
                                >
                                    Watch Video
                                </a>
                            ) : null}

                            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-cyan-50/70">
                                {tipCount > 0 ? <span>{tipCount} tip{tipCount !== 1 ? "s" : ""}</span> : null}
                                <a href="#overview" className="transition-colors hover:text-white">Overview</a>
                                <a href="#steps" className="transition-colors hover:text-white">Steps</a>
                                {tipCount > 0 ? <a href="#tips" className="transition-colors hover:text-white">Tips</a> : null}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

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
