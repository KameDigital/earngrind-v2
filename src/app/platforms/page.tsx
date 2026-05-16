import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Card from "@/components/ui/Card";
import RatingPill from "@/components/ui/RatingPill";
import { canonicalAlternates } from "@/lib/seo-metadata";
import { getSiteUrl } from "@/lib/site-url";
import { STATIC_GUIDES } from "@/lib/static-guides";

export const metadata: Metadata = {
    title: "Platform Reviews | GPT Site Ratings and Trust Summaries | EarnGrind",
    description:
        "Browse EarnGrind platform reviews for Freecash, Swagbucks, EarnLab, Gain.gg, KashKick, InboxDollars, MyPoints, PrizeRebel, Scrambly, ySense, and other GPT sites.",
    alternates: canonicalAlternates("/platforms"),
};

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
    platforms: ReviewPlatform | null;
}

const BASE_URL = getSiteUrl();

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

function ratingLabel(review: ReviewSummary) {
    if ((review.rating_trust ?? 0) >= 4) return "Strong trust signal";
    if ((review.rating_payout ?? 0) >= 4) return "Strong payout signal";
    return "Read review before starting";
}

function PlatformReviewCard({ review }: { review: ReviewSummary }) {
    const platform = review.platforms;

    return (
        <Card className="flex flex-col gap-4 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    {platform?.logo_url ? (
                        <Image
                            src={platform.logo_url}
                            alt={platform.name}
                            width={36}
                            height={36}
                            className="h-9 w-9 flex-shrink-0 rounded-lg border border-[var(--border-default)] object-cover"
                        />
                    ) : (
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)]">
                            <span className="text-[10px] font-bold text-[var(--text-tertiary)]">
                                {platform?.name.substring(0, 2) ?? "PR"}
                            </span>
                        </div>
                    )}
                    <div className="min-w-0">
                        <h2 className="truncate font-extrabold text-[var(--brand-ink)]">
                            {platform?.name ?? review.title}
                        </h2>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                            Platform review
                        </p>
                    </div>
                </div>
                {review.rating_overall != null ? <RatingPill rating={review.rating_overall} /> : null}
            </div>

            <div className="flex-1">
                <p className="text-sm font-bold text-[var(--brand-ink)]">{ratingLabel(review)}</p>
                {review.excerpt ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                        {review.excerpt}
                    </p>
                ) : null}
            </div>

            <div className="grid grid-cols-3 gap-2 border-y border-[var(--border-default)] py-3 text-center text-xs">
                <div>
                    <p className="font-bold text-[var(--brand-ink)]">{review.rating_payout?.toFixed(1) ?? "?"}</p>
                    <p className="text-[var(--text-tertiary)]">Payout</p>
                </div>
                <div>
                    <p className="font-bold text-[var(--brand-ink)]">{review.rating_ux?.toFixed(1) ?? "?"}</p>
                    <p className="text-[var(--text-tertiary)]">UX</p>
                </div>
                <div>
                    <p className="font-bold text-[var(--brand-ink)]">{review.rating_trust?.toFixed(1) ?? "?"}</p>
                    <p className="text-[var(--text-tertiary)]">Trust</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link href={`/review/${review.slug}`} className="font-bold text-lime-600 hover:text-lime-700">
                    Read full review
                </Link>
                {platform ? (
                    <Link href={`/offers?q=${encodeURIComponent(platform.name)}`} className="font-semibold text-[var(--text-secondary)] hover:text-[var(--brand-ink)]">
                        View offers
                    </Link>
                ) : null}
            </div>
        </Card>
    );
}

function StaticPlatformReviewCard({ guide }: { guide: (typeof STATIC_GUIDES)[number] }) {
    return (
        <Card className="flex flex-col gap-4 transition-transform hover:-translate-y-0.5">
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Platform review</p>
                <h2 className="mt-1 font-extrabold text-[var(--brand-ink)]">{guide.title}</h2>
            </div>
            <p className="flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">{guide.description}</p>
            <Link href={guide.href} className="font-bold text-lime-600 hover:text-lime-700">
                {guide.ctaLabel}
            </Link>
        </Card>
    );
}

export default async function PlatformsPage() {
    const reviews = await getReviews();
    const staticPlatformReviews = STATIC_GUIDES.filter((guide) => guide.contentType === "platform_review");
    const reviewCount = reviews.length + staticPlatformReviews.length;
    const topReviewed = [...reviews]
        .filter((review) => review.rating_overall != null)
        .sort((a, b) => (b.rating_overall ?? 0) - (a.rating_overall ?? 0))[0] ?? null;

    return (
        <main className="min-h-screen bg-[var(--surface-muted)] pb-20 pt-10">
            <Container className="space-y-6">
                <header className="rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)]">
                    <p className="section-label">Platform Reviews</p>
                    <h1 className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
                        GPT site and rewards platform reviews
                    </h1>
                    <p className="mt-3 max-w-3xl text-lg leading-relaxed text-[var(--text-secondary)]">
                        Use this index for individual platform trust summaries, rating snapshots, and links to full reviews. For ranked comparisons, start with Best GPT Sites.
                    </p>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
                            <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Reviewed platforms</p>
                            <p className="mt-1 text-lg font-extrabold text-[var(--brand-ink)]">{reviewCount}</p>
                        </div>
                        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
                            <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Top reviewed</p>
                            <p className="mt-1 text-lg font-extrabold text-[var(--brand-ink)]">{topReviewed?.platforms?.name ?? "No rating yet"}</p>
                        </div>
                        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
                            <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Comparison hub</p>
                            <Link href="/best-gpt-sites" className="mt-1 inline-flex text-lg font-extrabold text-[var(--brand-ink)] hover:text-lime-700">
                                Best GPT Sites
                            </Link>
                        </div>
                    </div>
                </header>

                {reviewCount === 0 ? (
                    <div className="rounded-2xl border border-[var(--border-default)] bg-white p-12 text-center shadow-[var(--shadow-card)] sm:p-16">
                        <h2 className="mb-2 text-lg font-bold text-[var(--brand-ink)]">No platform reviews yet</h2>
                        <p className="text-[var(--text-tertiary)]">Check back soon. Platform reviews are added as they are published.</p>
                    </div>
                ) : (
                    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="Platform review cards">
                        {staticPlatformReviews.map((guide) => (
                            <StaticPlatformReviewCard key={guide.slug} guide={guide} />
                        ))}
                        {reviews.map((review) => (
                            <PlatformReviewCard key={review.id} review={review} />
                        ))}
                    </section>
                )}
            </Container>
        </main>
    );
}
