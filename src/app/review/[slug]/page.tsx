import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import Card from "@/components/ui/Card";
import RatingPill from "@/components/ui/RatingPill";
import ProConList from "@/components/ui/ProConList";

// ---------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------
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

// ---------------------------------------------------------------
// DATA FETCH
// ---------------------------------------------------------------
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

// ---------------------------------------------------------------
// METADATA
// ---------------------------------------------------------------
export async function generateMetadata(
    { params }: { params: { slug: string } }
): Promise<Metadata> {
    const review = await getReview(params.slug);
    if (!review) return { title: "Review Not Found | EarnGrind" };
    return {
        title: review.seo_title ?? `${review.title} | EarnGrind`,
        description: review.seo_description ?? review.excerpt ?? `Read our in-depth review of ${review.platforms?.name ?? "this platform"}.`,
    };
}

// ---------------------------------------------------------------
// MARKDOWN RENDERER (same lightweight approach as guides)
// ---------------------------------------------------------------
function renderMarkdown(md: string): string {
    return md
        .replace(/^## (.+)$/gm, '<h2 class="text-xl font-extrabold text-[var(--brand-ink)] mt-8 mb-3 tracking-tight">$1</h2>')
        .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-[var(--brand-ink)] mt-5 mb-2">$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-[var(--brand-ink)]">$1</strong>')
        .replace(/^- (.+)$/gm, '<li class="ml-5 list-disc text-[var(--text-secondary)] leading-relaxed">$1</li>')
        .replace(/\n\n(?!<[hlu])/g, '</p><p class="text-[var(--text-secondary)] leading-relaxed mb-4">')
        .replace(/^(?!<[hlu])/, '<p class="text-[var(--text-secondary)] leading-relaxed mb-4">')
        .concat('</p>')
        .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul class="space-y-1.5 mb-4">${m}</ul>`);
}

// ---------------------------------------------------------------
// RATING DIMENSION ROW
// ---------------------------------------------------------------
function RatingDimension({ label, value }: { label: string; value: number | null }) {
    const pct = value ? Math.round((value / 5) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-secondary)] w-20 flex-shrink-0">{label}</span>
            <div className="flex-1 h-2 bg-[var(--surface-muted)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--brand-lime)] rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-bold text-[var(--brand-ink)] w-8 text-right">
                {value != null ? value.toFixed(1) : "—"}
            </span>
        </div>
    );
}

// ---------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------
export default async function ReviewPage({ params }: { params: { slug: string } }) {
    const review = await getReview(params.slug);
    if (!review) notFound();

    const platform = review.platforms;
    const updatedDate = new Date(review.updated_at).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
    });

    // Build affiliate URL if available
    const affiliateUrl = platform?.affiliate_template
        ? platform.affiliate_template.replace("{custom_param}", "earngrind")
        : null;

    return (
        <article className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
            <Container>
                {/* ── Breadcrumb ── */}
                <nav className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] font-medium mb-8" aria-label="Breadcrumb">
                    <Link href="/" className="hover:text-lime-700 transition-colors">Home</Link>
                    <span>/</span>
                    <Link href="/reviews" className="hover:text-lime-700 transition-colors">Reviews</Link>
                    <span>/</span>
                    <span className="text-[var(--text-secondary)] truncate">{platform?.name ?? review.title}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                    {/* ── Main Content ── */}
                    <div className="lg:col-span-8 space-y-5">

                        {/* Header card */}
                        <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] p-6 sm:p-8">
                            {/* Platform identity */}
                            {platform && (
                                <div className="flex items-center gap-3 mb-5">
                                    {platform.logo_url && (
                                        <Image
                                            src={platform.logo_url}
                                            alt={platform.name}
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 rounded-xl object-cover border border-[var(--border-default)]"
                                        />
                                    )}
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{platform.platform_kind.replace("_", " ")}</div>
                                        <div className="font-bold text-[var(--brand-ink)]">{platform.name}</div>
                                    </div>
                                </div>
                            )}

                            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--brand-ink)] tracking-tight mb-5 leading-tight">
                                {review.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 pb-5 border-b border-[var(--border-default)]">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Our Rating:</span>
                                    {review.rating_overall != null && <RatingPill rating={review.rating_overall} />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Updated:</span>
                                    <span className="text-sm font-medium text-[var(--text-secondary)]">{updatedDate}</span>
                                </div>
                            </div>

                            {/* Rating dimensions */}
                            <div className="mt-5 space-y-2.5">
                                <RatingDimension label="Payouts" value={review.rating_payout} />
                                <RatingDimension label="Ease of Use" value={review.rating_ux} />
                                <RatingDimension label="Support" value={review.rating_support} />
                                <RatingDimension label="Trust" value={review.rating_trust} />
                            </div>
                        </div>

                        {/* Pros & Cons */}
                        {(review.pros || review.cons) && (
                            <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] p-6 sm:p-8">
                                <h2 className="text-lg font-extrabold text-[var(--brand-ink)] mb-5">At a Glance</h2>
                                <ProConList pros={review.pros ?? []} cons={review.cons ?? []} />
                            </div>
                        )}

                        {/* Verdict banner */}
                        {review.verdict && (
                            <div className="bg-[var(--brand-lime)]/10 border border-[var(--brand-lime)]/30 rounded-2xl p-5">
                                <div className="text-xs font-extrabold uppercase tracking-wider text-[color:hsl(84,93%,30%)] mb-2">⚡ Our Verdict</div>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">{review.verdict}</p>
                            </div>
                        )}

                        {/* Body markdown */}
                        {review.body_md && (
                            <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] p-6 sm:p-8">
                                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(review.body_md) }} />
                            </div>
                        )}

                        {/* Cross-link to offers */}
                        {platform && (
                            <div className="bg-[var(--brand-ink)] border border-[var(--brand-ink)] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-white mb-1">See live {platform.name} offers</div>
                                    <p className="text-sm text-white/60">Browse real-time game tasks and payouts on {platform.name}.</p>
                                </div>
                                <Link
                                    href={`/offers?platform_kind=${platform.platform_kind}`}
                                    className="flex-shrink-0 px-5 py-2.5 bg-[var(--brand-lime)] hover:bg-[color:hsl(84,93%,72%)] text-[var(--brand-ink)] font-extrabold text-sm rounded-xl transition-all hover:-translate-y-px whitespace-nowrap"
                                >
                                    Browse Offers →
                                </Link>
                            </div>
                        )}

                        {/* Disclosure */}
                        <div className="bg-[var(--surface-muted)] rounded-2xl p-5 border border-[var(--border-default)]">
                            <p className="text-xs text-[var(--text-tertiary)] leading-relaxed italic">
                                <strong className="font-semibold text-[var(--text-secondary)]">Affiliate Disclosure:</strong> EarnGrind is an independent review site.
                                Some links on this page are affiliate links. If you sign up through them, we may earn a small commission at no cost to you.
                                This never affects our ratings or editorial opinion.
                            </p>
                        </div>
                    </div>

                    {/* ── Sticky Sidebar ── */}
                    <aside className="hidden lg:block lg:col-span-4 sticky top-6">
                        <Card className="p-6 border-2 border-[var(--border-default)] shadow-[var(--shadow-card)]">
                            <div className="text-center space-y-5">
                                {platform?.logo_url && (
                                    <Image
                                        src={platform.logo_url}
                                        alt={platform.name ?? "Platform"}
                                        width={56}
                                        height={56}
                                        className="w-14 h-14 rounded-2xl object-cover border border-[var(--border-default)] mx-auto"
                                    />
                                )}
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Our Rating</p>
                                    <div className="flex justify-center">
                                        {review.rating_overall != null && <RatingPill rating={review.rating_overall} />}
                                    </div>
                                </div>
                                {affiliateUrl ? (
                                    <a
                                        href={affiliateUrl}
                                        target="_blank"
                                        rel="noopener noreferrer sponsored"
                                        className="block w-full py-3.5 bg-[var(--brand-ink)] hover:bg-[var(--brand-ink)]/90 text-[var(--brand-lime)] font-extrabold text-sm rounded-xl transition-all hover:-translate-y-px active:translate-y-0"
                                    >
                                        Visit {platform?.name} →
                                    </a>
                                ) : (
                                    <Link
                                        href="/offers"
                                        className="block w-full py-3.5 bg-[var(--brand-ink)] hover:bg-[var(--brand-ink)]/90 text-[var(--brand-lime)] font-extrabold text-sm rounded-xl transition-colors text-center"
                                    >
                                        Browse All Offers
                                    </Link>
                                )}
                                <p className="text-xs text-[var(--text-tertiary)]">No credit card required to sign up.</p>
                                <div className="pt-4 border-t border-[var(--border-default)]">
                                    <Link
                                        href="/guides"
                                        className="text-sm font-semibold text-lime-700 hover:text-lime-800 transition-colors"
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
