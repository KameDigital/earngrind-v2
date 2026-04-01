"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white transition";
const labelClass = "block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5";
const hintClass  = "text-xs text-gray-400 mt-1";

function slugify(str: string) {
    return str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
}

export default function BlogPostCreateForm() {
    const router = useRouter();
    const [title,      setTitle]      = useState("");
    const [slug,       setSlug]       = useState("");
    const [slugManual, setSlugManual] = useState(false);
    const [excerpt,    setExcerpt]    = useState("");
    const [bodyMd,     setBodyMd]     = useState("");
    const [category,   setCategory]   = useState("");
    const [tags,       setTags]       = useState("");
    const [featImg,    setFeatImg]    = useState("");
    const [seoTitle,   setSeoTitle]   = useState("");
    const [seoDesc,    setSeoDesc]    = useState("");
    const [status,     setStatus]     = useState("draft");
    const [saving,     setSaving]     = useState(false);
    const [error,      setError]      = useState<string | null>(null);

    function handleTitleChange(val: string) {
        setTitle(val);
        if (!slugManual) setSlug(slugify(val));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (!title.trim() || !slug.trim()) {
            setError("Title and slug are required.");
            return;
        }
        setSaving(true);
        const res = await fetch("/api/admin/blog-posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title, slug, excerpt: excerpt || null,
                body_md: bodyMd || "",
                category: category || null, tags: tags || null,
                featured_image: featImg || null,
                seo_title: seoTitle || null, seo_description: seoDesc || null,
                status,
            }),
        });
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            setError(json.error ?? "Create failed. Please try again.");
            setSaving(false);
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
                    <input type="text" value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="e.g. How I made $450 in one week with Sea of Conquest" required className={inputClass} />
                </div>

                <div>
                    <label className={labelClass}>Slug *</label>
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={slug}
                            onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
                            placeholder="auto-derived-from-title"
                            required
                            className={inputClass + " font-mono"}
                        />
                        {slugManual && (
                            <button type="button" onClick={() => { setSlug(slugify(title)); setSlugManual(false); }}
                                className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-700 underline whitespace-nowrap">
                                Auto
                            </button>
                        )}
                    </div>
                    <p className={hintClass}>URL: /blog/{slug || "…"}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Category</label>
                        <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Strategy, Tutorial, Review" className={inputClass} />
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
                    <textarea value={tags} onChange={e => setTags(e.target.value)} rows={3} placeholder="mobile games&#10;sea of conquest&#10;offerwall" className={inputClass + " resize-y"} />
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Content</h2>

                <div>
                    <label className={labelClass}>Excerpt</label>
                    <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} placeholder="Short 1–3 sentence summary shown on the blog listing and homepage." className={inputClass + " resize-none"} />
                </div>

                <div>
                    <label className={labelClass}>Body (Markdown)</label>
                    <textarea
                        value={bodyMd}
                        onChange={e => setBodyMd(e.target.value)}
                        rows={20}
                        placeholder="## Introduction&#10;&#10;Write your post here..."
                        className={inputClass + " font-mono text-xs resize-y"}
                    />
                    <p className={hintClass}>Supports Markdown.</p>
                </div>

                <div>
                    <label className={labelClass}>Featured Image URL</label>
                    <input type="url" value={featImg} onChange={e => setFeatImg(e.target.value)} placeholder="https://..." className={inputClass} />
                </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">SEO (optional)</h2>
                <div>
                    <label className={labelClass}>SEO Title</label>
                    <input type="text" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder="Override page title for search engines" className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>SEO Description</label>
                    <textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)} rows={2} placeholder="150–160 character description for Google" className={inputClass + " resize-none"} />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-4 pt-2">
                <button type="button" onClick={() => router.back()} className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition">
                    Cancel
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-gray-900 text-white text-sm font-extrabold rounded-xl hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm">
                    {saving ? "Saving…" : "Create Post"}
                </button>
            </div>
        </form>
    );
}
