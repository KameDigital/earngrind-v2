import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/layout/Container";
import Card from "@/components/ui/Card";
import RatingPill from "@/components/ui/RatingPill";

export const metadata: Metadata = {
    title: "Platform Reviews — GPT Sites, Offerwalls & Game Task Sites | EarnGrind",
    description: "Honest, data-driven reviews of every major GPT site and offerwall. Freecash, Swagbucks, and more — find out which platform actually pays the most.",
};

// ---------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------
interface ReviewPlatform {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    platform_kind: string;
}

interface ReviewSummary {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    rating_overall: number | null;
    rating_payout: number | null;
    rating_ux: number | null;
    rating_trust: number | null;
    published_at: string | null;
    platforms: ReviewPlatform | null;
}

// ---------------------------------------------------------------
// DATA FETCH
// ---------------------------------------------------------------
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function getReviews(): Promise<ReviewSummary[]> {
    try {
        const res = await fetch(`${BASE_URL}/api/reviews`, {
            next: { revalidate: 120 },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data ?? [];
    } catch {
        return [];
    }
}

// ---------------------------------------------------------------
// RATING BAR (for sub-ratings)
// ---------------------------------------------------------------
function RatingBar({ label, value }: { label: string; value: number | null }) {
    const pct = value ? Math.round((value / 5) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[var(--text-tertiary)] w-16 flex-shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-[var(--surface-muted)] rounded-full overflow-hidden">
                <div className="h-full bg-lime-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-bold text-[var(--text-secondary)] w-6 text-right">{value?.toFixed(1) ?? "—"}</span>
        </div>
    );
}

// ---------------------------------------------------------------
// REVIEW CARD
// ---------------------------------------------------------------
function ReviewCard({ review }: { review: ReviewSummary }) {
    const platform = review.platforms;
    return (
        <Card className="flex flex-col gap-4 hover:-translate-y-0.5 transition-transform">
            {/* Platform header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {platform?.logo_url ? (
                        <Image
                            src={platform.logo_url}
                            alt={platform.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-lg object-cover border border-[var(--border-default)] flex-shrink-0"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-default)] flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-[var(--text-tertiary)]">{platform?.name.substring(0, 2) ?? "??"}</span>
                        </div>
                    )}
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] truncate">
                        {platform?.name ?? "Platform"} Review
                    </span>
                </div>
                {review.rating_overall != null && (
                    <RatingPill rating={review.rating_overall} />
                )}
            </div>

            {/* Title + excerpt */}
            <div className="flex-1">
                <h2 className="font-bold text-[var(--brand-ink)] leading-snug mb-2">{review.title}</h2>
                {review.excerpt && (
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">{review.excerpt}</p>
                )}
            </div>

            {/* Sub-ratings */}
            <div className="space-y-1.5 py-3 border-t border-b border-[var(--border-default)]">
                <RatingBar label="Payout" value={review.rating_payout} />
                <RatingBar label="UX" value={review.rating_ux} />
                <RatingBar label="Trust" value={review.rating_trust} />
            </div>

            {/* CTA */}
            <Link
                href={`/review/${review.slug}`}
                className="text-sm font-bold text-lime-600 hover:text-lime-700 transition-colors"
            >
                Read full review →
            </Link>
        </Card>
    );
}

// ---------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------
export default async function ReviewsPage() {
    const reviews = await getReviews();

    return (
        <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
            <Container>
                {/* Header */}
                <div className="mb-10 max-w-2xl">
                    <p className="section-label mb-3">Platform Reviews</p>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--brand-ink)] tracking-tight mb-3">
                        Platform Reviews
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                        Independent, data-driven reviews of every major GPT site and offerwall.
                        We test each platform personally before publishing.
                    </p>
                </div>

                {/* Banner */}
                <div className="mb-8 flex items-center gap-3 p-4 bg-[var(--brand-lime)]/10 border border-lime-200 rounded-2xl text-sm">
                    <span className="text-[var(--brand-ink)] font-medium flex-1">
                        Looking for live payouts instead of reviews?
                    </span>
                    <Link href="/offers" className="flex-shrink-0 px-4 py-2 bg-[var(--brand-lime)] text-[var(--brand-ink)] font-bold rounded-xl transition-colors text-sm hover:bg-[var(--brand-lime-dark)]">
                        Browse Offers →
                    </Link>
                </div>

                {/* Grid */}
                {reviews.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] p-16 text-center">
                        <div className="text-3xl mb-4">📋</div>
                        <h2 className="text-lg font-bold text-[var(--brand-ink)] mb-2">No reviews yet</h2>
                        <p className="text-[var(--text-tertiary)]">Check back soon — platform reviews are added monthly.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {reviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </div>
                )}
            </Container>
        </main>
    );
}
