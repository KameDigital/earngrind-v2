import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/layout/Container";

export const metadata: Metadata = {
    title: "Game Guides — Maximize Your Offerwall Earnings | EarnGrind",
    description: "Step-by-step guides for the most popular offerwall game tasks. Learn the fastest routes to max payout on Coin Master, Bingo Blitz, and more.",
};

const PAGE_SIZE = 18;

// ---------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------
interface GuideGame {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
}

interface Guide {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    difficulty: "easy" | "medium" | "hard" | null;
    estimated_time: string | null;
    max_payout_usd: number | null;
    published_at: string | null;
    games: GuideGame | null;
}

// ---------------------------------------------------------------
// DIFFICULTY BADGE
// ---------------------------------------------------------------
const DIFFICULTY_STYLES: Record<string, string> = {
    easy:   "bg-green-50 text-green-700 border-green-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    hard:   "bg-red-50 text-red-700 border-red-200",
};

function DifficultyBadge({ difficulty }: { difficulty: string | null }) {
    if (!difficulty) return null;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${DIFFICULTY_STYLES[difficulty] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
            {difficulty}
        </span>
    );
}

// ---------------------------------------------------------------
// GUIDE CARD
// ---------------------------------------------------------------
function GuideCard({ guide }: { guide: Guide }) {
    return (
        <Link
            href={`/guides/${guide.slug}`}
            className="group eg-card flex flex-col p-5 hover:-translate-y-0.5"
        >
            {guide.games && (
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--surface-muted)] border border-[var(--border-default)] flex-shrink-0 flex items-center justify-center">
                        {guide.games.thumbnail_url ? (
                            <Image
                                src={guide.games.thumbnail_url}
                                alt={guide.games.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-xs font-bold text-[var(--text-tertiary)]">{guide.games.name.substring(0, 2)}</span>
                        )}
                    </div>
                    <span className="section-label">{guide.games.name}</span>
                </div>
            )}

            <h2 className="font-bold text-[var(--brand-ink)] group-hover:text-lime-700 transition-colors leading-snug mb-2 flex-1">
                {guide.title}
            </h2>

            {guide.excerpt && (
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-2">
                    {guide.excerpt}
                </p>
            )}

            <div className="flex items-center gap-2 flex-wrap mt-auto pt-3 border-t border-[var(--border-default)]">
                <DifficultyBadge difficulty={guide.difficulty} />
                {guide.estimated_time && (
                    <span className="text-xs text-[var(--text-tertiary)] font-medium">⏱ {guide.estimated_time}</span>
                )}
                {guide.max_payout_usd && (
                    <span className="ml-auto text-sm font-extrabold text-lime-600">
                        up to ${guide.max_payout_usd.toFixed(2)}
                    </span>
                )}
            </div>
        </Link>
    );
}

// ---------------------------------------------------------------
// PAGINATION CONTROLS
// ---------------------------------------------------------------
function Pagination({ page, totalCount, pageSize, basePath }: {
    page: number;
    totalCount: number;
    pageSize: number;
    basePath: string;
}) {
    const totalPages = Math.ceil(totalCount / pageSize);
    if (totalPages <= 1) return null;

    const pageUrl = (p: number) => p === 1 ? basePath : `${basePath}?page=${p}`;

    return (
        <nav className="flex items-center justify-center gap-1 mt-10" aria-label="Pagination">
            {page > 1 && (
                <Link href={pageUrl(page - 1)} className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all">
                    ← Prev
                </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Link
                    key={p}
                    href={pageUrl(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                        p === page
                            ? "bg-[var(--brand-ink)] text-white shadow"
                            : "text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200"
                    }`}
                >
                    {p}
                </Link>
            ))}
            {page < totalPages && (
                <Link href={pageUrl(page + 1)} className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all">
                    Next →
                </Link>
            )}
        </nav>
    );
}

// ---------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------
export default async function GuidesPage({
    searchParams,
}: {
    searchParams: { page?: string };
}) {
    const supabase  = createClient();
    const page      = Math.max(1, parseInt(searchParams.page ?? "1") || 1);
    const from      = (page - 1) * PAGE_SIZE;
    const to        = from + PAGE_SIZE - 1;

    const { data: guides, count } = await supabase
        .from("guides")
        .select("id, title, slug, excerpt, difficulty, estimated_time, max_payout_usd, published_at, games(id, name, slug, thumbnail_url)", { count: "exact" })
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(from, to);

    const totalCount = count ?? 0;

    return (
        <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
            <Container>
                <div className="mb-10">
                    <p className="section-label mb-3">Game Guides</p>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--brand-ink)] tracking-tight mb-3">
                        Game Guides
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                        Step-by-step completion guides for the best-paying offerwall games.
                        Every guide covers the fastest path to maximum payout.
                    </p>
                    {totalCount > 0 && (
                        <p className="text-sm text-[var(--text-tertiary)] mt-2">
                            {totalCount} guide{totalCount !== 1 ? "s" : ""} available
                        </p>
                    )}
                </div>

                {(guides ?? []).length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] p-16 text-center">
                        <div className="text-3xl mb-4">📖</div>
                        <h2 className="text-lg font-bold text-[var(--brand-ink)] mb-2">No guides published yet</h2>
                        <p className="text-[var(--text-tertiary)]">Check back soon — new guides are added weekly.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {(guides ?? []).map((guide) => (
                                <GuideCard key={guide.id} guide={guide as unknown as Guide} />
                            ))}
                        </div>
                        <Pagination
                            page={page}
                            totalCount={totalCount}
                            pageSize={PAGE_SIZE}
                            basePath="/guides"
                        />
                    </>
                )}
            </Container>
        </main>
    );
}
