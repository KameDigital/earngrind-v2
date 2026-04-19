"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GameCombobox, { type GameOption } from "../../GameCombobox";

interface Guide {
    id: string;
    title: string;
    slug: string;
    game_id: string;
    excerpt: string | null;
    body_md: string | null;
    difficulty: string | null;
    estimated_time: string | null;
    max_payout_usd: number | null;
    tips: string[];
    key_takeaways: string | null;
    checklist_items: string[];
    video_url: string | null;
    layout_style: string;
    show_related_offers: boolean;
    show_related_guides: boolean;
    seo_title: string | null;
    seo_description: string | null;
    status: string;
}

const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white transition";
const labelClass = "block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5";
const hintClass  = "text-xs text-gray-400 mt-1";

function slugify(str: string) {
    return str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
}

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
    return (
        <button
            type="button"
            id={id}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${checked ? "bg-gray-900" : "bg-gray-200"}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-1"}`} />
        </button>
    );
}

export default function GuideEditForm({
    guide,
    initialGame,
}: {
    guide: Guide;
    initialGame: GameOption | null;
}) {
    const router = useRouter();
    const [title,          setTitle]          = useState(guide.title);
    const [slug,           setSlug]           = useState(guide.slug);
    const [gameId,         setGameId]         = useState(guide.game_id);
    const [selectedGame,   setSelectedGame]   = useState<GameOption | null>(initialGame);
    const [excerpt,        setExcerpt]        = useState(guide.excerpt ?? "");
    const [bodyMd,         setBodyMd]         = useState(guide.body_md ?? "");
    const [difficulty,     setDifficulty]     = useState(guide.difficulty ?? "");
    const [estimatedTime,  setEstimatedTime]  = useState(guide.estimated_time ?? "");
    const [maxPayout,      setMaxPayout]      = useState(guide.max_payout_usd?.toString() ?? "");
    const [tips,           setTips]           = useState((guide.tips ?? []).join("\n"));
    const [keyTakeaways,   setKeyTakeaways]   = useState(guide.key_takeaways ?? "");
    const [checklistItems, setChecklistItems] = useState((guide.checklist_items ?? []).join("\n"));
    const [videoUrl,       setVideoUrl]       = useState(guide.video_url ?? "");
    const [layoutStyle,    setLayoutStyle]    = useState(guide.layout_style ?? "classic");
    const [showOffers,     setShowOffers]     = useState(guide.show_related_offers ?? true);
    const [showGuides,     setShowGuides]     = useState(guide.show_related_guides ?? true);
    const [seoTitle,       setSeoTitle]       = useState(guide.seo_title ?? "");
    const [seoDesc,        setSeoDesc]        = useState(guide.seo_description ?? "");
    const [status,         setStatus]         = useState(guide.status);
    const [saving,         setSaving]         = useState(false);
    const [deleting,       setDeleting]       = useState(false);
    const [error,          setError]          = useState<string | null>(null);

    function handleTitleChange(val: string) {
        setTitle(val);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSaving(true);
        const res = await fetch(`/api/admin/guides/${guide.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title, slug, game_id: gameId,
                excerpt: excerpt || null,
                body_md: bodyMd || null,
                difficulty: difficulty || null,
                estimated_time: estimatedTime || null,
                max_payout_usd: maxPayout || null,
                tips: tips || null,
                key_takeaways: keyTakeaways || null,
                checklist_items: checklistItems || null,
                video_url: videoUrl || null,
                layout_style: layoutStyle,
                show_related_offers: showOffers,
                show_related_guides: showGuides,
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
        router.push("/app/admin/guides");
        router.refresh();
    }

    async function handleDelete() {
        if (!confirm("Delete this guide permanently? This cannot be undone.")) return;
        setDeleting(true);
        const res = await fetch(`/api/admin/guides/${guide.id}`, { method: "DELETE" });
        if (!res.ok) { setError("Delete failed."); setDeleting(false); return; }
        router.push("/app/admin/guides");
        router.refresh();
    }

    const LAYOUT_HINTS: Record<string, string> = {
        classic: "Clean single-column editorial article. Best for SEO.",
        steps:   "Numbered step cards based on ## headings. Best for walkthroughs.",
        pro:     "Most polished — key takeaways, checklist, premium tip cards. Best for conversion.",
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">{error}</div>
            )}

            {/* ── Basic Info ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Basic Info</h2>

                <div>
                    <label className={labelClass}>Title *</label>
                    <input type="text" value={title} onChange={e => handleTitleChange(e.target.value)} required className={inputClass} />
                </div>

                <div>
                    <label className={labelClass}>Slug *</label>
                    <input type="text" value={slug} onChange={e => setSlug(e.target.value)} required className={inputClass + " font-mono"} />
                    <p className={hintClass + " text-amber-600"}>⚠ Changing the slug breaks existing links to this guide.</p>
                </div>

                <div>
                    <label className={labelClass}>Excerpt</label>
                    <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} placeholder="1–2 sentence summary shown in header and SEO description." className={inputClass + " resize-none"} />
                    <p className={hintClass}>Shown in the page header, sidebar, and used as SEO description fallback.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <GameCombobox
                            value={gameId}
                            onChange={(nextGameId, option) => {
                                setGameId(nextGameId);
                                setSelectedGame(option);
                            }}
                            labelClassName={labelClass}
                            inputClassName={inputClass}
                            hintClassName={hintClass}
                            required
                            initialOption={initialGame}
                        />
                        {selectedGame ? (
                            <input type="hidden" name="game_id" value={selectedGame.id} />
                        ) : null}
                    </div>
                    <div>
                        <label className={labelClass}>Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Offer Data ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Offer Data</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Difficulty</label>
                        <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={inputClass}>
                            <option value="">— Select —</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Est. Completion Time</label>
                        <input type="text" value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} placeholder="e.g. 7–10 days" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Max Payout (USD)</label>
                        <input type="number" step="0.01" value={maxPayout} onChange={e => setMaxPayout(e.target.value)} className={inputClass} />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Video URL</label>
                    <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className={inputClass} />
                </div>
            </div>

            {/* ── Layout & Display ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Layout & Display</h2>

                <div>
                    <label className={labelClass}>Layout Style</label>
                    <select value={layoutStyle} onChange={e => setLayoutStyle(e.target.value)} className={inputClass}>
                        <option value="classic">Classic — Editorial article</option>
                        <option value="steps">Steps — Numbered walkthrough</option>
                        <option value="pro">Pro — Premium conversion layout</option>
                    </select>
                    <p className={hintClass}>{LAYOUT_HINTS[layoutStyle]}</p>
                </div>

                <div className="flex items-center justify-between py-2">
                    <div>
                        <div className="text-sm font-semibold text-gray-700">Show Related Offers</div>
                        <div className="text-xs text-gray-400 mt-0.5">Display top offers for this game in the sidebar</div>
                    </div>
                    <Toggle id="showOffersEdit" checked={showOffers} onChange={setShowOffers} />
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <div>
                        <div className="text-sm font-semibold text-gray-700">Show Related Guides</div>
                        <div className="text-xs text-gray-400 mt-0.5">Display other guides for this game in the sidebar</div>
                    </div>
                    <Toggle id="showGuidesEdit" checked={showGuides} onChange={setShowGuides} />
                </div>
            </div>

            {/* ── Content ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Content (Markdown)</h2>

                <div>
                    <label className={labelClass}>Body</label>
                    <textarea value={bodyMd} onChange={e => setBodyMd(e.target.value)} rows={20} className={inputClass + " font-mono text-xs resize-y"} />
                    <p className={hintClass}>
                        <span className={layoutStyle === "steps" || layoutStyle === "pro" ? "text-amber-600 font-semibold" : ""}>
                            {layoutStyle === "steps" || layoutStyle === "pro"
                                ? "⚡ Use ## headings to define step cards in this layout."
                                : "Supports Markdown. Use ## for headings, **bold**, - for lists."}
                        </span>
                    </p>
                </div>

                <div>
                    <label className={labelClass}>Tips (one per line)</label>
                    <textarea value={tips} onChange={e => setTips(e.target.value)} rows={4} className={inputClass + " resize-y"} />
                </div>

                <div className={layoutStyle === "pro" ? "" : "opacity-50"}>
                    <label className={labelClass}>Key Takeaways <span className="text-[10px] normal-case font-normal text-gray-400">(Pro layout)</span></label>
                    <textarea value={keyTakeaways} onChange={e => setKeyTakeaways(e.target.value)} rows={4} placeholder={"- Complete the tutorial before day 1\n- Focus on village progression, not combat"} className={inputClass + " resize-y"} />
                    <p className={hintClass}>Shown in a dark highlight box at the top of the Pro layout. One point per line.</p>
                </div>

                <div className={layoutStyle === "pro" ? "" : "opacity-50"}>
                    <label className={labelClass}>Checklist Items <span className="text-[10px] normal-case font-normal text-gray-400">(Pro layout)</span></label>
                    <textarea value={checklistItems} onChange={e => setChecklistItems(e.target.value)} rows={4} placeholder={"Reach Village 50\nComplete 100 spins in first 24h"} className={inputClass + " resize-y"} />
                    <p className={hintClass}>Each line becomes a checkbox in the Pro layout completion checklist.</p>
                </div>
            </div>

            {/* ── SEO ── */}
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

            {/* ── Actions ── */}
            <div className="flex items-center justify-between gap-4 pt-2">
                <button type="button" onClick={handleDelete} disabled={deleting || saving}
                    className="px-4 py-2.5 text-sm font-semibold text-red-600 hover:text-red-800 border border-red-200 rounded-xl bg-white hover:bg-red-50 transition disabled:opacity-40">
                    {deleting ? "Deleting…" : "Delete Guide"}
                </button>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => router.back()} className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition">Cancel</button>
                    <button type="submit" disabled={saving || deleting} className="px-6 py-2.5 bg-gray-900 text-white text-sm font-extrabold rounded-xl hover:bg-gray-800 transition disabled:opacity-60 shadow-sm">
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </form>
    );
}
