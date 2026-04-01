"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GameEditFormProps {
    game: {
        id:            string;
        name:          string;
        slug:          string;
        category:      string | null;
        devices:       string[];
        aliases:       string[];
        thumbnail_url: string | null;
        description:   string | null;
    };
}

const DEVICE_OPTIONS = ["ios", "android", "pc", "web"] as const;
const DEVICE_LABELS: Record<string, string> = {
    ios: "🍏 iOS", android: "🤖 Android", pc: "💻 PC", web: "🌐 Web",
};

const inputClass  = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white transition";
const labelClass  = "block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5";
const hintClass   = "text-xs text-gray-400 mt-1";

export default function GameEditForm({ game }: GameEditFormProps) {
    const router = useRouter();
    const [name,        setName]        = useState(game.name);
    const [slug,        setSlug]        = useState(game.slug);
    const [category,    setCategory]    = useState(game.category ?? "");
    const [devices,     setDevices]     = useState<string[]>(game.devices ?? []);
    const [aliases,     setAliases]     = useState((game.aliases ?? []).join(", "));
    const [thumbUrl,    setThumbUrl]    = useState(game.thumbnail_url ?? "");
    const [description, setDescription] = useState(game.description ?? "");
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    const [success,     setSuccess]     = useState(false);

    function toggleDevice(d: string) {
        setDevices(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSaving(true);
        const res = await fetch(`/api/admin/games/${game.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name, slug,
                category:      category    || null,
                devices,
                aliases:       aliases ? aliases.split(",").map(a => a.trim()).filter(Boolean) : [],
                thumbnail_url: thumbUrl    || null,
                description:   description || null,
            }),
        });
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            setError(json.error ?? "Save failed.");
            setSaving(false);
            return;
        }
        setSuccess(true);
        setTimeout(() => router.push("/app/admin/games"), 800);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-7">
            {/* ── Core identity ── */}
            <fieldset className="space-y-4">
                <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 w-full">
                    Core Identity
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} required />
                    </div>
                    <div>
                        <label className={labelClass}>Slug</label>
                        <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className={`${inputClass} font-mono`} required />
                        <p className={hintClass}>Changing slug breaks existing public URLs — use caution.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Category</label>
                        <input type="text" value={category} onChange={e => setCategory(e.target.value)} className={inputClass} placeholder="e.g. Strategy" />
                    </div>
                    <div>
                        <label className={labelClass}>Thumbnail URL</label>
                        <input type="url" value={thumbUrl} onChange={e => setThumbUrl(e.target.value)} className={inputClass} placeholder="https://..." />
                    </div>
                </div>
            </fieldset>

            {/* ── Platform support ── */}
            <fieldset className="space-y-3">
                <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 w-full">
                    Platform Support
                </legend>
                <div className="flex gap-4 flex-wrap mt-1">
                    {DEVICE_OPTIONS.map(d => (
                        <label key={d} className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={devices.includes(d)}
                                onChange={() => toggleDevice(d)}
                                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                            />
                            <span className="text-sm text-gray-700">{DEVICE_LABELS[d]}</span>
                        </label>
                    ))}
                </div>
            </fieldset>

            {/* ── Metadata ── */}
            <fieldset className="space-y-4">
                <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 w-full">
                    Metadata
                </legend>
                <div>
                    <label className={labelClass}>Aliases</label>
                    <input type="text" value={aliases} onChange={e => setAliases(e.target.value)} className={inputClass} placeholder="Coin Master, coin-master" />
                    <p className={hintClass}>Comma-separated. Used by ingestion pipeline to match this game to external offers.</p>
                </div>
                <div>
                    <label className={labelClass}>Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClass} />
                </div>
            </fieldset>

            {error   && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
            {success && <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">✓ Saved! Redirecting…</div>}

            <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                <button type="submit" disabled={saving || success}
                    className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition shadow-sm">
                    {saving ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" onClick={() => router.push("/app/admin/games")}
                    className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition">
                    Cancel
                </button>
            </div>
        </form>
    );
}
