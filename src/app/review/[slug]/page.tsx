import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import { buildPlatformAffiliateUrl } from "@/lib/outbound";
import { buildBreadcrumbList, buildOrganization, buildReviewSchema, JsonLd } from "@/lib/seo-schema";
import Card from "@/components/ui/Card";
import RatingPill from "@/components/ui/RatingPill";
import ProConList from "@/components/ui/ProConList";

interface ReviewPlatform {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    platform_kind: string;
    affiliate_template: string | null;
}

interface ReviewDetail {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    body_md: string | null;
    verdict: string | null;
    rating_overall: number | null;
    rating_payout: number | null;
    rating_ux: number | null;
    rating_support: number | null;
    rating_trust: number | null;
    pros: string[] | null;
    cons: string[] | null;
    published_at: string | null;
    updated_at: string;
    seo_title: string | null;
    seo_description: string | null;
    platforms: ReviewPlatform | null;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function getReview(slug: string): Promise<ReviewDetail | null> {
    try {
        const res = await fetch(`${BASE_URL}/api/reviews/${slug}`, {
            next: { revalidate: 120 },
        });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`${res.status}`);
        const json = await res.json();
        return json.review ?? null;
    } catch {
        return null;
    }
}

export async function generateMetadata(
    { params }: { params: { slug: string } }
): Promise<Metadata> {
    const review = await getReview(params.slug);
    if (!review) return { title: "Review Not Found | EarnGrind" };

    const platformName = review.platforms?.name ?? "this platform";
    return {
        title: review.seo_title ?? `${review.title} | EarnGrind`,
        description:
            review.seo_description ??
            review.excerpt ??
            `Read our in-depth review of ${platformName} to compare trust, payout quality, and user experience before you start offers.`,
        alternates: {
            canonical: `/review/${params.slug}`,
        },
        openGraph: {
            title: review.seo_title ?? `${review.title} | EarnGrind`,
            description:
                review.seo_description ??
                review.excerpt ??
                `Read our in-depth review of ${platformName} before starting offers.`,
            url: `/review/${params.slug}`,
            type: "article",
        },
    };
}

function renderMarkdown(md: string): string {
    return md
        .replace(/^## (.+)$/gm, '<h2 class="mt-8 mb-3 text-xl font-extrabold tracking-tight text-[var(--brand-ink)]">$1</h2>')
        .replace(/^### (.+)$/gm, '<h3 class="mt-5 mb-2 text-base font-bold text-[var(--brand-ink)]">$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-[var(--brand-ink)]">$1</strong>')
        .replace(/^- (.+)$/gm, '<li class="ml-5 list-disc leading-relaxed text-[var(--text-secondary)]">$1</li>')
        .replace(/\n\n(?!<[hlu])/g, '</p><p class="mb-4 leading-relaxed text-[var(--text-secondary)]">')
        .replace(/^(?!<[hlu])/, '<p class="mb-4 leading-relaxed text-[var(--text-secondary)]">')
        .concat("</p>")
        .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul class="mb-4 space-y-1.5">${match}</ul>`);
}

function RatingDimension({ label, value }: { label: string; value: number | null }) {
    const pct = value ? Math.round((value / 5) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="w-20 flex-shrink-0 text-sm text-[var(--text-secondary)]">{label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div className="h-full rounded-full bg-[var(--brand-lime)] transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-right text-sm font-bold text-[var(--brand-ink)]">
                {value != null ? value.toFixed(1) : "—"}
            </span>
        </div>
    );
}

function buildTrustTakeaway(review: ReviewDetail): string {
    if ((review.rating_trust ?? 0) >= 4 && (review.rating_payout ?? 0) >= 4) {
        return "Strong trust and payout profile. This is worth checking if you want a credible platform with competitive offer value.";
    }
    if ((review.rating_trust ?? 0) >= 4) {
        return "Trust is the strongest signal here. Use this platform if safety and platform quality matter more than chasing the absolute top payout.";
    }
    if ((review.rating_payout ?? 0) >= 4) {
        return "Payout value looks strong, but you should read the trust and UX sections before committing.";
    }
    return "This platform needs a closer look before you treat it as a default starting point.";
}

function buildBestFor(review: ReviewDetail): string {
    if ((review.rating_payout ?? 0) >= 4 && (review.rating_ux ?? 0) >= 4) {
        return "Best for users who want a smoother platform and competitive payout routes.";
    }
    if ((review.rating_trust ?? 0) >= 4) {
        return "Best for users who want a more trustworthy place to start and do not mind comparing offers carefully.";
    }
    if ((review.rating_payout ?? 0) >= 4) {
        return "Best for users prioritizing payout upside and willing to tolerate more friction.";
    }
    return "Best for users still comparing options and not ready to commit to one platform.";
}

function buildNextStep(review: ReviewDetail): string {
    if ((review.rating_trust ?? 0) >= 4 || (review.rating_payout ?? 0) >= 4) {
        return "Read the verdict, then move into live offers if the tradeoffs fit what you want.";
    }
    return "Read the full review first, then compare it against stronger platforms on Best GPT Sites before you click into offers.";
}

export default async function ReviewPage({ params }: { params: { slug: string } }) {
    const review = await getReview(params.slug);
    if (!review) notFound();

    const platform = review.platforms;
    const platformName = platform?.name ?? "this platform";
    const updatedDate = new Date(review.updated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const platformVisitHref = platform && buildPlatformAffiliateUrl({ platform })
        ? `/go/platform/${platform.id}`
        : null;
    const offersHref = platform
        ? `/offers?platform_id=${encodeURIComponent(platform.id)}&platform_name=${encodeURIComponent(platform.name)}&from_review=1`
        : "/offers";
    const trustTakeaway = buildTrustTakeaway(review);
    const bestFor = buildBestFor(review);
    const nextStep = buildNextStep(review);
    const platformSchema = buildOrganization(platformName, platform ? `/review/${review.slug}` : undefined, platform?.logo_url);
    const schemas = [
        buildBreadcrumbList([
            { name: "Home", path: "/" },
            { name: "Reviews", path: "/reviews" },
            { name: platformName, path: `/review/${review.slug}` },
        ]),
        platformSchema,
        buildReviewSchema({
            title: review.title,
            path: `/review/${review.slug}`,
            excerpt: review.excerpt ?? review.verdict,
            rating: review.rating_overall,
            datePublished: review.published_at,
            dateModified: review.updated_at,
            itemReviewed: platformSchema,
        }),
    ];

    return (
        <article className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
            <JsonLd data={schemas} />
            <Container>
                <nav className="mb-8 flex items-center gap-2 text-sm font-medium text-[var(--text-tertiary)]" aria-label="Breadcrumb">
                    <Link href="/" className="transition-colors hover:text-lime-700">Home</Link>
                    <span>/</span>
                    <Link href="/reviews" className="transition-colors hover:text-lime-700">Reviews</Link>
                    <span>/</span>
                    <span className="truncate text-[var(--text-secondary)]">{platformName}</span>
                </nav>

                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
                    <div className="space-y-5 lg:col-span-8">
                        <div className="rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
                            {platform ? (
                                <div className="mb-5 flex items-center gap-3">
                                    {platform.logo_url ? (
                                        <Image
                                            src={platform.logo_url}
                                            alt={platform.name}
                                            width={40}
                                            height={40}
                                            className="h-10 w-10 rounded-xl border border-[var(--border-default)] object-cover"
                                        />
                                    ) : null}
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                                            {(platform.platform_kind || "platform").replace(/_/g, " ")}
                                        </div>
                                        <div className="font-bold text-[var(--brand-ink)]">{platform.name}</div>
                                    </div>
                                </div>
                            ) : null}

                            <h1 className="mb-3 text-2xl font-extrabold leading-tight tracking-tight text-[var(--brand-ink)] sm:text-3xl">
                                {review.title}
                            </h1>

                            {review.excerpt ? (
                                <p className="max-w-3xl text-base leading-relaxed text-[var(--text-secondary)]">
                                    {review.excerpt}
                                </p>
                            ) : null}

                            <div className="mt-5 grid gap-3 md:grid-cols-4">
                                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
                                    <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Overall rating</p>
                                    <div className="mt-1">
                                        {review.rating_overall != null ? <RatingPill rating={review.rating_overall} /> : <span className="text-sm font-bold text-[var(--brand-ink)]">No rating yet</span>}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
                                    <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Trust takeaway</p>
                                    <p className="mt-1 text-sm font-bold text-[var(--brand-ink)]">
                                        {(review.rating_trust ?? 0) >= 4 ? "Looks trustworthy" : "Read trust section first"}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
                                    <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Offer value</p>
                                    <p className="mt-1 text-sm font-bold text-[var(--brand-ink)]">
                                        {(review.rating_payout ?? 0) >= 4 ? "Worth checking offers" : "Compare with other platforms"}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
                                    <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Updated</p>
                                    <p className="mt-1 text-sm font-bold text-[var(--brand-ink)]">{updatedDate}</p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 lg:grid-cols-3">
                                <article className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Trust and value</p>
                                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{trustTakeaway}</p>
                                </article>
                                <article className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Best for</p>
                                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{bestFor}</p>
                                </article>
                                <article className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">What to do next</p>
                                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{nextStep}</p>
                                </article>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2">
                                <Link
                                    href={offersHref}
                                    className="inline-flex rounded-xl bg-[var(--brand-ink)] px-4 py-2 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
                                >
                                    View {platformName} Offers
                                </Link>
                                <Link
                                    href="/best-gpt-sites"
                                    className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400"
                                >
                                    Compare Best GPT Sites
                                </Link>
                                <Link
                                    href="/guides"
                                    className="inline-flex rounded-xl border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400"
                                >
                                    Explore Guides
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
                            <h2 className="mb-5 text-lg font-extrabold text-[var(--brand-ink)]">How {platformName} scores</h2>
                            <div className="space-y-2.5">
                                <RatingDimension label="Payouts" value={review.rating_payout} />
                                <RatingDimension label="Ease of Use" value={review.rating_ux} />
                                <RatingDimension label="Support" value={review.rating_support} />
                                <RatingDimension label="Trust" value={review.rating_trust} />
                            </div>
                        </div>

                        {(review.pros || review.cons) ? (
                            <div className="rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
                                <h2 className="mb-5 text-lg font-extrabold text-[var(--brand-ink)]">At a glance</h2>
                                <ProConList pros={review.pros ?? []} cons={review.cons ?? []} />
                            </div>
                        ) : null}

                        {review.verdict ? (
                            <div className="rounded-2xl border border-[var(--brand-lime)]/30 bg-[var(--brand-lime)]/10 p-5">
                                <div className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[color:hsl(84,93%,30%)]">Our verdict</div>
                                <p className="text-sm font-medium leading-relaxed text-[var(--text-secondary)]">{review.verdict}</p>
                            </div>
                        ) : null}

                        {review.body_md ? (
                            <div className="rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
                                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(review.body_md) }} />
                            </div>
                        ) : null}

                        <div className="rounded-2xl border border-[var(--brand-ink)] bg-[var(--brand-ink)] p-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                <div className="flex-1">
                                    <div className="mb-1 text-sm font-bold text-white">Ready for the next step?</div>
                                    <p className="text-sm text-white/65">
                                        If {platformName} looks like a fit, check the live offer list next. If you still have doubts, compare it against the broader Best GPT Sites page first.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Link
                                        href={offersHref}
                                        className="inline-flex rounded-xl bg-[var(--brand-lime)] px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px"
                                    >
                                        Browse Offers
                                    </Link>
                                    <Link
                                        href="/best-gpt-sites"
                                        className="inline-flex rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-extrabold text-white transition-all hover:-translate-y-px hover:bg-white/10"
                                    >
                                        Compare Platforms
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-5">
                            <p className="text-xs italic leading-relaxed text-[var(--text-tertiary)]">
                                <strong className="font-semibold text-[var(--text-secondary)]">Affiliate Disclosure:</strong> EarnGrind is an independent review site.
                                Some links on this page are affiliate links. If you sign up through them, we may earn a small commission at no cost to you.
                                This never affects our ratings or editorial opinion.
                            </p>
                        </div>
                    </div>

                    <aside className="sticky top-6 hidden lg:col-span-4 lg:block">
                        <Card className="border-2 border-[var(--border-default)] p-6 shadow-[var(--shadow-card)]">
                            <div className="space-y-5 text-center">
                                {platform?.logo_url ? (
                                    <Image
                                        src={platform.logo_url}
                                        alt={platformName}
                                        width={56}
                                        height={56}
                                        className="mx-auto h-14 w-14 rounded-2xl border border-[var(--border-default)] object-cover"
                                    />
                                ) : null}
                                <div>
                                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Overall rating</p>
                                    <div className="flex justify-center">
                                        {review.rating_overall != null ? <RatingPill rating={review.rating_overall} /> : <span className="text-sm font-bold text-[var(--brand-ink)]">No rating yet</span>}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4 text-left">
                                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Worth checking?</p>
                                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{trustTakeaway}</p>
                                </div>

                                <div className="space-y-2">
                                    {platformVisitHref ? (
                                        <TrackedOutboundLink
                                            href={platformVisitHref}
                                            className="block w-full rounded-xl bg-[var(--brand-ink)] py-3.5 text-center text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px"
                                            eventLabel="review-platform-visit"
                                            offerTitle={platformName}
                                            platformName={platformName}
                                            location="review-sidebar"
                                            sourceContext="review-detail"
                                        >
                                            Visit {platformName} →
                                        </TrackedOutboundLink>
                                    ) : null}
                                    <Link
                                        href={offersHref}
                                        className="block w-full rounded-xl border border-[var(--border-default)] bg-white py-3.5 text-center text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400"
                                    >
                                        View Related Offers
                                    </Link>
                                    <Link
                                        href="/best-gpt-sites"
                                        className="block w-full rounded-xl border border-[var(--border-default)] bg-white py-3.5 text-center text-sm font-extrabold text-[var(--brand-ink)] transition-all hover:-translate-y-px hover:border-lime-400"
                                    >
                                        Compare Best GPT Sites
                                    </Link>
                                </div>

                                <div className="border-t border-[var(--border-default)] pt-4 text-left">
                                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">If you are still undecided</p>
                                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                                        Read the verdict, then compare this platform against the broader trust and payout leaderboard before you commit.
                                    </p>
                                    <Link
                                        href="/guides"
                                        className="mt-3 inline-flex text-sm font-semibold text-lime-700 transition-colors hover:text-lime-800"
                                    >
                                        View completion guides →
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    </aside>
                </div>
            </Container>
        </article>
    );
}
