"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    body_md: string;
    category: string | null;
    tags: string[];
    featured_image: string | null;
    seo_title: string | null;
    seo_description: string | null;
    status: string;
}

const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white transition";
const labelClass = "block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5";
const hintClass  = "text-xs text-gray-400 mt-1";

export default function BlogPostEditForm({ post }: { post: BlogPost }) {
    const router = useRouter();
    const [title,    setTitle]    = useState(post.title);
    const [slug,     setSlug]     = useState(post.slug);
    const [excerpt,  setExcerpt]  = useState(post.excerpt ?? "");
    const [bodyMd,   setBodyMd]   = useState(post.body_md ?? "");
    const [category, setCategory] = useState(post.category ?? "");
    const [tags,     setTags]     = useState((post.tags ?? []).join("\n"));
    const [featImg,  setFeatImg]  = useState(post.featured_image ?? "");
    const [seoTitle, setSeoTitle] = useState(post.seo_title ?? "");
    const [seoDesc,  setSeoDesc]  = useState(post.seo_description ?? "");
    const [status,   setStatus]   = useState(post.status);
    const [saving,   setSaving]   = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error,    setError]    = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSaving(true);
        const res = await fetch(`/api/admin/blog-posts/${post.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title, slug,
                excerpt: excerpt || null,
                body_md: bodyMd || "",
                category: category || null,
                tags: tags || null,
                featured_image: featImg || null,
                seo_title: seoTitle || null,
                seo_description: seoDesc || null,
                status,
            }),
        });
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            setError(json.error ?? "Save failed.");
            setSaving(false);
            return;
        }
        router.push("/app/admin/blog-posts");
        router.refresh();
    }

    async function handleDelete() {
        if (!confirm("Delete this post permanently? This cannot be undone.")) return;
        setDeleting(true);
        const res = await fetch(`/api/admin/blog-posts/${post.id}`, { method: "DELETE" });
        if (!res.ok) {
            setError("Delete failed.");
            setDeleting(false);
            return;
        }
        router.push("/app/admin/blog-posts");
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Core */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Core</h2>

                <div>
                    <label className={labelClass}>Title *</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className={inputClass} />
                </div>

                <div>
                    <label className={labelClass}>Slug *</label>
                    <input type="text" value={slug} onChange={e => setSlug(e.target.value)} required className={inputClass + " font-mono"} />
                    <p className={hintClass + " text-amber-600"}>⚠ Changing the slug will break existing links to this post.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Category</label>
                        <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Strategy, Tutorial, Review…" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Tags (one per line)</label>
                    <textarea value={tags} onChange={e => setTags(e.target.value)} rows={3} className={inputClass + " resize-y"} />
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Content</h2>
                <div>
                    <label className={labelClass}>Excerpt</label>
                    <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} className={inputClass + " resize-none"} />
                </div>
                <div>
                    <label className={labelClass}>Body (Markdown)</label>
                    <textarea value={bodyMd} onChange={e => setBodyMd(e.target.value)} rows={22} className={inputClass + " font-mono text-xs resize-y"} />
                    <p className={hintClass}>Supports Markdown.</p>
                </div>
                <div>
                    <label className={labelClass}>Featured Image URL</label>
                    <input type="url" value={featImg} onChange={e => setFeatImg(e.target.value)} className={inputClass} />
                </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">SEO (optional)</h2>
                <div>
                    <label className={labelClass}>SEO Title</label>
                    <input type="text" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>SEO Description</label>
                    <textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)} rows={2} className={inputClass + " resize-none"} />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-4 pt-2">
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting || saving}
                    className="px-4 py-2.5 text-sm font-semibold text-red-600 hover:text-red-800 border border-red-200 rounded-xl bg-white hover:bg-red-50 transition disabled:opacity-40"
                >
                    {deleting ? "Deleting…" : "Delete Post"}
                </button>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => router.back()} className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving || deleting} className="px-6 py-2.5 bg-gray-900 text-white text-sm font-extrabold rounded-xl hover:bg-gray-800 transition disabled:opacity-60 shadow-sm">
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </form>
    );
}
