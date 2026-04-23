import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/layout/Container";
import Card from "@/components/ui/Card";
import RatingPill from "@/components/ui/RatingPill";

export const metadata: Metadata = {
    title: "GPT Site Reviews | Compare Trust, Payout Quality, and User Experience | EarnGrind",
    description: "Compare GPT site reviews by trust, payout quality, and user experience so you can decide which platforms are worth joining before you start offers.",
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
    published_at: string | null;
    platforms: ReviewPlatform | null;
}

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

function RatingBar({ label, value }: { label: string; value: number | null }) {
    const pct = value ? Math.round((value / 5) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="w-16 flex-shrink-0 text-xs font-semibold text-[var(--text-tertiary)]">{label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div className="h-full rounded-full bg-lime-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-6 text-right text-xs font-bold text-[var(--text-secondary)]">{value?.toFixed(1) ?? "?"}</span>
        </div>
    );
}

function ReviewCard({ review }: { review: ReviewSummary }) {
    const platform = review.platforms;
    const decisionSummary =
        review.rating_trust != null && review.rating_trust >= 4
            ? "Strong trust signal for users who want a safer place to start."
            : review.rating_payout != null && review.rating_payout >= 4
                ? "Worth checking if your priority is stronger offer value."
                : "Use the full review to decide whether this platform deserves your time.";

    return (
        <Card className="flex flex-col gap-4 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    {platform?.logo_url ? (
                        <Image
                            src={platform.logo_url}
                            alt={platform.name}
                            width={32}
                            height={32}
                            className="h-8 w-8 flex-shrink-0 rounded-lg border border-[var(--border-default)] object-cover"
                        />
                    ) : (
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)]">
                            <span className="text-[10px] font-bold text-[var(--text-tertiary)]">{platform?.name.substring(0, 2) ?? "??"}</span>
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold text-[var(--brand-ink)]">
                            {platform?.name ?? "Platform"}
                        </div>
                        <span className="truncate text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                            Platform review
                        </span>
                    </div>
                </div>
                {review.rating_overall != null ? <RatingPill rating={review.rating_overall} /> : null}
            </div>

            <div className="flex-1">
                <h2 className="mb-2 font-bold leading-snug text-[var(--brand-ink)]">{review.title}</h2>
                <p className="text-sm font-medium leading-relaxed text-[var(--text-secondary)]">{decisionSummary}</p>
                {review.excerpt ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--text-secondary)]">{review.excerpt}</p>
                ) : null}
            </div>

            <div className="space-y-1.5 border-y border-[var(--border-default)] py-3">
                <RatingBar label="Payout" value={review.rating_payout} />
                <RatingBar label="UX" value={review.rating_ux} />
                <RatingBar label="Trust" value={review.rating_trust} />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                    href={`/review/${review.slug}`}
                    className="font-bold text-lime-600 transition-colors hover:text-lime-700"
                >
                    Read full review ?
                </Link>
                {platform ? (
                    <Link
                        href={`/offers?q=${encodeURIComponent(platform.name)}`}
                        className="font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-ink)]"
                    >
                        View offers
                    </Link>
                ) : null}
            </div>
        </Card>
    );
}

export default async function ReviewsPage() {
    const reviews = await getReviews();
    const topReviewed = [...reviews]
        .filter((review) => review.rating_overall != null)
        .sort((a, b) => (b.rating_overall ?? 0) - (a.rating_overall ?? 0))[0] ?? null;
    const trustRatedCount = reviews.filter((review) => review.rating_trust != null).length;

    return (
        <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
            <Container className="space-y-6">
                <header className="rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)]">
                    <div className="max-w-3xl">
                        <p className="mb-3 section-label">Platform Reviews</p>
                        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
                            Compare GPT sites before you trust them with your time
                        </h1>
                        <p className="text-lg leading-relaxed text-[var(--text-secondary)]">
                            Use these reviews to decide which GPT sites are worth joining, which ones look trustworthy, and where strong offer value actually shows up before you start clicking into routes.
                        </p>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-4">
                        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
                            <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Reviewed platforms</p>
                            <p className="mt-1 text-lg font-extrabold text-[var(--brand-ink)]">{reviews.length}</p>
                        </div>
                        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
                            <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Trust-rated</p>
                            <p className="mt-1 text-lg font-extrabold text-[var(--brand-ink)]">{trustRatedCount}</p>
                        </div>
                        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
                            <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Top reviewed</p>
                            <p className="mt-1 text-lg font-extrabold text-[var(--brand-ink)]">{topReviewed?.platforms?.name ?? "No rating yet"}</p>
                        </div>
                        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
                            <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Next step</p>
                            <p className="mt-1 text-lg font-extrabold text-[var(--brand-ink)]">Read, compare, then browse offers</p>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-3">
                        <article className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Why reviews matter</p>
                            <h2 className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">Check trust before you chase payouts</h2>
                            <p className="mt-2 text-sm text-[var(--text-secondary)]">
                                A review helps answer whether a GPT site is worth joining, whether it feels trustworthy, and whether the payout quality looks strong enough to justify your time.
                            </p>
                        </article>
                        <article className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">What to do next</p>
                            <h2 className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">Use reviews to narrow the field fast</h2>
                            <p className="mt-2 text-sm text-[var(--text-secondary)]">
                                Start with the platforms that score well on trust and payout, then move into offers once you know which sites deserve deeper attention.
                            </p>
                        </article>
                        <article className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Keep moving</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Link href="/offers" className="inline-flex rounded-xl bg-[var(--brand-ink)] px-4 py-2 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px">
                                    Browse Offers
                                </Link>
                                <Link href="/best-gpt-sites" className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400">
                                    Compare Best GPT Sites
                                </Link>
                                <Link href="/guides" className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400">
                                    Explore Guides
                                </Link>
                            </div>
                        </article>
                    </div>
                </header>

                <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
                    <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Reviewed GPT sites</h2>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        Compare platforms by trust, payout quality, and user experience. Open the full review when a platform looks promising, then move into offers with more confidence.
                    </p>
                </section>

                {reviews.length === 0 ? (
                    <div className="rounded-2xl border border-[var(--border-default)] bg-white p-16 text-center shadow-[var(--shadow-card)]">
                        <div className="mb-4 text-3xl">??</div>
                        <h2 className="mb-2 text-lg font-bold text-[var(--brand-ink)]">No reviews yet</h2>
                        <p className="text-[var(--text-tertiary)]">Check back soon ? platform reviews are added monthly.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {reviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </div>
                )}

                <section className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
                    <h2 className="text-2xl font-extrabold text-[var(--brand-ink)]">Keep exploring</h2>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        Use these paths if you want to connect trust research to live payout discovery and game-level completion strategy.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                        <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/best-gpt-sites">Best GPT Sites</Link>
                        <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/offers">All Offers</Link>
                        <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/guides">Game Guides</Link>
                        <Link className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 hover:bg-[var(--surface-muted)]" href="/highest-paying-gpt-games">Highest Paying GPT Games</Link>
                    </div>
                </section>
            </Container>
        </main>
    );
}
