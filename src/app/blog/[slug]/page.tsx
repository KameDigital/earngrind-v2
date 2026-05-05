import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import sanitizeHtml from "sanitize-html";
import { createClient } from "@/lib/supabase/server";
import BlogJsonLd from "./BlogJsonLd";

export const revalidate = 120;

// ---------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------
interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    body_md: string;
    category: string | null;
    tags: string[] | null;
    featured_image: string | null;
    published_at: string | null;
    updated_at: string;
    seo_title: string | null;
    seo_description: string | null;
}

interface RecentPost {
    id: string;
    slug: string;
    title: string;
    category: string | null;
    published_at: string | null;
}

// ---------------------------------------------------------------
// METADATA
// ---------------------------------------------------------------
export async function generateMetadata(
    { params }: { params: { slug: string } }
): Promise<Metadata> {
    const supabase = createClient();
    const { data: post } = await supabase
        .from("blog_posts")
        .select("title, excerpt, seo_title, seo_description, published_at")
        .eq("slug", params.slug)
        .eq("status", "published")
        .maybeSingle();

    if (!post) return { title: "Post Not Found | EarnGrind" };

    const title = post.seo_title ?? post.title;
    const description = post.seo_description ?? post.excerpt ?? `Read ${post.title} on EarnGrind`;

    return {
        title: `${title} | EarnGrind`,
        description,
        openGraph: {
            title, description,
            type: "article",
            publishedTime: post.published_at ?? undefined,
        },
        twitter: { card: "summary_large_image", title, description },
    };
}

// ---------------------------------------------------------------
// MARKDOWN RENDERER  (improved — links, code, quotes)
// ---------------------------------------------------------------
function renderMarkdown(md: string): string {
    if (!md) return "";
    const html = md
        .replace(/^#### (.+)$/gm, '<h4 class="text-base font-bold text-gray-900 mt-5 mb-2">$1</h4>')
        .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-gray-900 mt-6 mb-2">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-xl font-extrabold text-gray-900 mt-8 mb-3 tracking-tight">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-extrabold text-gray-900 mt-8 mb-3">$1</h1>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-sm font-mono text-gray-800">$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-lime-700 hover:underline font-medium">$1</a>')
        .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-lime-400 pl-4 py-1 my-3 text-gray-600 italic bg-lime-50 rounded-r">$1</blockquote>')
        .replace(/^- (.+)$/gm, '<li class="ml-5 list-disc text-gray-600 leading-relaxed mb-1">$1</li>')
        .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-5 list-decimal text-gray-600 leading-relaxed mb-1">$2</li>')
        .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul class="space-y-1 mb-4">${m}</ul>`)
        .replace(/\n\n(?!<[hul])/g, '</p><p class="text-gray-600 leading-relaxed mb-4">')
        .replace(/^(?!<[hul>])(.+)/, '<p class="text-gray-600 leading-relaxed mb-4">$1')
        .concat("</p>")
        .replace(/<p[^>]*>\s*<\/p>/g, "");

    return sanitizeHtml(html, {
        allowedTags: [
            "h1",
            "h2",
            "h3",
            "h4",
            "p",
            "strong",
            "em",
            "code",
            "a",
            "blockquote",
            "ul",
            "ol",
            "li",
            "br",
        ],
        allowedAttributes: {
            "*": ["class"],
            a: ["href", "target", "rel", "class"],
        },
        allowedSchemes: ["http", "https", "mailto"],
        transformTags: {
            a: (_tagName, attribs) => ({
                tagName: "a",
                attribs: {
                    href: attribs.href ?? "#",
                    class: attribs.class ?? "text-lime-700 hover:underline font-medium",
                    target: "_blank",
                    rel: "noopener noreferrer nofollow",
                },
            }),
        },
    });
}

// ---------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------
export default async function BlogDetail({ params }: { params: { slug: string } }) {
    const supabase = createClient();

    const [{ data: post }, { data: recentPosts }] = await Promise.all([
        supabase
            .from("blog_posts")
            .select("id, slug, title, excerpt, body_md, category, tags, featured_image, published_at, updated_at, seo_title, seo_description")
            .eq("slug", params.slug)
            .eq("status", "published")
            .maybeSingle(),
        supabase
            .from("blog_posts")
            .select("id, slug, title, category, published_at")
            .eq("status", "published")
            .neq("slug", params.slug)
            .order("published_at", { ascending: false })
            .limit(5),
    ]);

    if (!post) notFound();

    const typedPost   = post as BlogPost;
    const recentTyped = (recentPosts ?? []) as RecentPost[];

    const publishedDate = typedPost.published_at
        ? new Date(typedPost.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : null;

    const updatedDate = new Date(typedPost.updated_at).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
    });

    const renderedBody = renderMarkdown(typedPost.body_md ?? "");

    return (
        <div className="min-h-screen bg-[#f5f5f0]">

            {/* JSON-LD structured data */}
            <BlogJsonLd post={{
                title:         typedPost.title,
                slug:          typedPost.slug,
                excerpt:       typedPost.excerpt,
                category:      typedPost.category,
                tags:          typedPost.tags,
                featured_image: typedPost.featured_image,
                published_at:  typedPost.published_at,
                updated_at:    typedPost.updated_at,
            }} />

            {/* Compact Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-sm text-gray-400 font-medium mb-4">
                        <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
                        <span>/</span>
                        <Link href="/blog" className="hover:text-gray-700 transition-colors">Blog</Link>
                        <span>/</span>
                        <span className="text-gray-600 truncate max-w-[240px]">{typedPost.title}</span>
                    </nav>

                    {/* Category + date */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        {typedPost.category && (
                            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 bg-lime-300 text-gray-900 rounded">
                                {typedPost.category}
                            </span>
                        )}
                        {publishedDate && (
                            <span className="text-xs text-gray-400 font-medium">{publishedDate}</span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight mb-3">
                        {typedPost.title}
                    </h1>

                    {/* Excerpt */}
                    {typedPost.excerpt && (
                        <p className="text-base text-gray-500 leading-relaxed max-w-2xl">
                            {typedPost.excerpt}
                        </p>
                    )}
                </div>
            </div>

            {/* ── 2-column content grid ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 items-start">

                    {/* Main column */}
                    <main className="min-w-0">

                        {/* Featured image */}
                        {typedPost.featured_image && (
                            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm mb-5">
                                <Image
                                    src={typedPost.featured_image}
                                    alt={typedPost.title}
                                    width={800}
                                    height={400}
                                    className="w-full h-48 sm:h-64 object-cover"
                                />
                            </div>
                        )}

                        {/* Body */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-5">
                            <style>{`
                                .blog-prose{color:#374151;font-size:.9375rem;line-height:1.75}
                                .blog-prose h2{font-size:1.25rem;font-weight:800;color:#111827;margin-top:2em;margin-bottom:.5em;padding-bottom:.3em;border-bottom:1px solid #f3f4f6}
                                .blog-prose h3{font-size:1.05rem;font-weight:700;color:#111827;margin-top:1.5em;margin-bottom:.35em}
                                .blog-prose h4{font-size:.95rem;font-weight:700;color:#374151;margin-top:1.25em;margin-bottom:.3em}
                                .blog-prose p{margin-bottom:.9em}
                                .blog-prose ul{padding-left:1.25rem;margin-bottom:.9em}
                                .blog-prose li{margin-bottom:.3em}
                                .blog-prose strong{font-weight:700;color:#111827}
                                .blog-prose a{color:#65a30d;text-decoration:underline}
                                .blog-prose code{background:#f3f4f6;border:1px solid #e5e7eb;border-radius:4px;padding:1px 5px;font-size:.85em;font-family:monospace}
                                .blog-prose blockquote{border-left:4px solid #bef264;padding:.5rem 1rem;background:#f7fee7;border-radius:0 6px 6px 0;margin:1.25em 0;font-style:italic;color:#4b5563}
                            `}</style>
                            <div
                                className="blog-prose"
                                dangerouslySetInnerHTML={{ __html: renderedBody }}
                            />
                        </div>

                        {/* Tags */}
                        {typedPost.tags && typedPost.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-5">
                                {typedPost.tags.map(tag => (
                                    <span key={tag} className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-lg">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Continue Exploring CTA */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
                            <h2 className="text-sm font-extrabold uppercase tracking-widest text-gray-400 mb-4">Continue Exploring</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { label: "Browse Offers", href: "/offers", desc: "Live payouts across all platforms" },
                                    { label: "View Guides", href: "/guides", desc: "Step-by-step earning strategies" },
                                    { label: "Platform Reviews", href: "/reviews", desc: "Independent GPT site ratings" },
                                ].map(link => (
                                    <Link key={link.href} href={link.href}
                                        className="group flex flex-col gap-1 p-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-lime-300 hover:bg-lime-50 transition-all">
                                        <span className="text-sm font-bold text-gray-900 group-hover:text-lime-700 transition-colors">{link.label} →</span>
                                        <span className="text-xs text-gray-500">{link.desc}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Footer nav */}
                        <div className="flex items-center justify-between text-sm text-gray-400 px-1">
                            <Link href="/blog" className="font-semibold hover:text-gray-700 transition-colors">← Back to blog</Link>
                            <span>Updated {updatedDate}</span>
                        </div>
                    </main>

                    {/* ── Sticky Sidebar ── */}
                    <aside className="mt-6 lg:mt-0 lg:sticky lg:top-[72px] space-y-4">

                        {/* Quick nav — anchors from the body */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <div className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3">Quick Actions</div>
                            <div className="space-y-2">
                                <Link href="/offers"
                                    className="flex items-center gap-2 px-3 py-2.5 bg-lime-400 text-gray-900 rounded-lg text-sm font-extrabold hover:bg-lime-300 transition">
                                    Browse Offers →
                                </Link>
                                <Link href="/guides"
                                    className="flex items-center gap-2 px-3 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">
                                    View Guides →
                                </Link>
                            </div>
                        </div>

                        {/* Recent posts */}
                        {recentTyped.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                                <div className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3">Recent Posts</div>
                                <div className="space-y-1">
                                    {recentTyped.map(p => {
                                        const d = p.published_at
                                            ? new Date(p.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                            : null;
                                        return (
                                            <Link key={p.id} href={`/blog/${p.slug}`}
                                                className="group flex items-start gap-2 py-2 border-b border-gray-50 last:border-0 hover:text-lime-700 transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    {p.category && (
                                                        <div className="text-[9px] font-bold uppercase tracking-widest text-lime-600 mb-0.5">{p.category}</div>
                                                    )}
                                                    <div className="text-sm font-semibold text-gray-800 group-hover:text-lime-700 transition-colors leading-snug line-clamp-2">
                                                        {p.title}
                                                    </div>
                                                    {d && <div className="text-xs text-gray-400 mt-0.5">{d}</div>}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                                <Link href="/blog" className="mt-3 block text-xs font-semibold text-gray-500 hover:text-lime-700 transition-colors">
                                    View all posts →
                                </Link>
                            </div>
                        )}

                        {/* Tags cloud */}
                        {typedPost.tags && typedPost.tags.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                                <div className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3">Tags</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {typedPost.tags.map(tag => (
                                        <span key={tag} className="text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>

                </div>
            </div>
        </div>
    );
}
