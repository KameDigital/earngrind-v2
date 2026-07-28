import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/layout/Container";
import { canonicalAlternates } from "@/lib/seo-metadata";
import { buildBreadcrumbList, buildCollectionPage, buildItemList, JsonLd } from "@/lib/seo-schema";

export const revalidate = 120;

export const metadata: Metadata = {
    title: "Blog — Offerwall Strategies & Earning Tips",
    description: "Editorial articles on offerwall strategy, earning experiments, roundups, and how to maximize earnings from mobile game offers.",
    alternates: canonicalAlternates("/blog"),
    openGraph: {
        title: "Blog - Offerwall Strategies & Earning Tips",
        description: "Editorial articles on offerwall strategy, earning experiments, roundups, and how to maximize earnings from mobile game offers.",
        url: "https://earngrind.com/blog",
        siteName: "EarnGrind",
        images: [{ url: "/og-earngrind.png", width: 1200, height: 630, alt: "EarnGrind offerwall strategy blog" }],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Blog - Offerwall Strategies & Earning Tips",
        description: "Editorial articles on offerwall strategy, earning experiments, roundups, and how to maximize earnings from mobile game offers.",
        images: ["/og-earngrind.png"],
    },
};

const PAGE_SIZE = 12;

// ---------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------
interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    category: string | null;
    tags: string[] | null;
    published_at: string | null;
}

// ---------------------------------------------------------------
// PAGINATION
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
export default async function BlogIndex({
    searchParams,
}: {
    searchParams: { page?: string; category?: string };
}) {
    const supabase  = createClient();
    const page      = Math.max(1, parseInt(searchParams.page ?? "1") || 1);
    const category  = searchParams.category ?? null;
    const from      = (page - 1) * PAGE_SIZE;
    const to        = from + PAGE_SIZE - 1;

    let query = supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, category, tags, published_at", { count: "exact" })
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(from, to);

    if (category) query = query.eq("category", category);

    const { data: posts, count } = await query;

    const typedPosts  = (posts ?? []) as BlogPost[];
    const totalCount  = count ?? 0;

    // Fetch distinct categories for filter chips
    const { data: categoryRows } = await supabase
        .from("blog_posts")
        .select("category")
        .eq("status", "published")
        .not("category", "is", null);

    const categories = Array.from(new Set((categoryRows ?? []).map(r => r.category).filter(Boolean))) as string[];
    const itemList = buildItemList(
        typedPosts.slice(0, 12).map((post) => ({
            name: post.title,
            path: `/blog/${post.slug}`,
            description: post.excerpt,
        })),
    );
    const schemas = [
        buildCollectionPage({
            name: "EarnGrind Blog",
            path: "/blog",
            description: metadata.description as string,
            mainEntity: itemList,
        }),
        buildBreadcrumbList([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
        ]),
    ];

    return (
        <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-10">
            <JsonLd data={schemas} />
            <Container>
                {/* Header */}
                <div className="mb-8 max-w-2xl">
                    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--text-tertiary)]">
                        <Link href="/" className="hover:text-lime-700">Home</Link>
                        <span aria-hidden="true">/</span>
                        <span className="text-[var(--brand-ink)]">Blog</span>
                    </nav>
                    <p className="section-label mb-3">Blog</p>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--brand-ink)] tracking-tight mb-3">
                        Blog
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                        Strategy tips, earnings experiments, news, and roundups — so you spend less time guessing and more time earning.
                    </p>
                    {totalCount > 0 && (
                        <p className="text-sm text-[var(--text-tertiary)] mt-2">
                            {totalCount} article{totalCount !== 1 ? "s" : ""}
                            {category ? ` in "${category}"` : ""}
                        </p>
                    )}
                </div>

                {/* Category filter chips */}
                <div className="mb-8 flex flex-wrap gap-2">
                    <Link
                        href="/blog"
                        className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-colors shadow-[var(--shadow-card)] ${
                            !category
                                ? "bg-[var(--brand-ink)] text-white border border-[var(--brand-ink)]"
                                : "bg-white border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-lime-300 hover:text-lime-700"
                        }`}
                    >
                        All
                    </Link>
                    {categories.map(cat => (
                        <Link
                            key={cat}
                            href={`/blog?category=${encodeURIComponent(cat)}`}
                            className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold capitalize transition-colors shadow-[var(--shadow-card)] ${
                                category === cat
                                    ? "bg-[var(--brand-ink)] text-white border border-[var(--brand-ink)]"
                                    : "bg-white border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-lime-300 hover:text-lime-700"
                            }`}
                        >
                            {cat}
                        </Link>
                    ))}
                </div>

                {typedPosts.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] p-16 text-center">
                        <div className="text-3xl mb-4">✍️</div>
                        <h2 className="text-lg font-bold text-[var(--brand-ink)] mb-2">No posts yet</h2>
                        <p className="text-[var(--text-tertiary)]">Check back soon — new articles are published weekly.</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {typedPosts.map((post) => {
                                const date = post.published_at
                                    ? new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                                    : null;

                                return (
                                    <Link
                                        key={post.id}
                                        href={`/blog/${post.slug}`}
                                        className="group eg-card flex flex-col sm:flex-row sm:items-start gap-4 p-5"
                                    >
                                        {/* Category chip */}
                                        <div className="flex-shrink-0 sm:w-24 sm:pt-0.5">
                                            {post.category ? (
                                                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[var(--brand-ink)] bg-[var(--brand-lime)] px-2 py-1 rounded">
                                                    {post.category}
                                                </span>
                                            ) : null}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <h2 className="font-bold text-[var(--brand-ink)] group-hover:text-lime-700 transition-colors leading-snug mb-1.5">
                                                {post.title}
                                            </h2>
                                            {post.excerpt && (
                                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                                                    {post.excerpt}
                                                </p>
                                            )}
                                            {post.tags && post.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {post.tags.slice(0, 4).map((tag) => (
                                                        <span key={tag} className="text-[10px] font-semibold text-[var(--text-tertiary)] bg-[var(--surface-muted)] border border-[var(--border-default)] px-2 py-0.5 rounded">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Date + arrow */}
                                        <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                                            {date && <span className="text-xs text-[var(--text-tertiary)] font-medium whitespace-nowrap">{date}</span>}
                                            <span className="text-[var(--border-strong)] group-hover:text-lime-500 transition-colors text-lg">→</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                        <Pagination
                            page={page}
                            totalCount={totalCount}
                            pageSize={PAGE_SIZE}
                            basePath={category ? `/blog?category=${encodeURIComponent(category)}` : "/blog"}
                        />
                    </>
                )}
            </Container>
        </main>
    );
}
