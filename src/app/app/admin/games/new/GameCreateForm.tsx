"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEVICE_OPTIONS = ["ios", "android", "pc", "web"] as const;
const DEVICE_LABELS: Record<string, string> = {
    ios: "🍏 iOS", android: "🤖 Android", pc: "💻 PC", web: "🌐 Web",
};

function slugify(s: string) {
    return s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const inputClass  = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white transition";
const labelClass  = "block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5";
const hintClass   = "text-xs text-gray-400 mt-1";

export default function GameCreateForm() {
    const router = useRouter();
    const [name,        setName]       = useState("");
    const [slug,        setSlug]       = useState("");
    const [category,    setCategory]   = useState("");
    const [devices,     setDevices]    = useState<string[]>([]);
    const [aliases,     setAliases]    = useState("");
    const [thumbUrl,    setThumbUrl]   = useState("");
    const [description, setDesc]       = useState("");
    const [saving,      setSaving]     = useState(false);
    const [error,       setError]      = useState<string | null>(null);
    const [slugEdited,  setSlugEdited] = useState(false);

    function handleNameChange(v: string) {
        setName(v);
        if (!slugEdited) setSlug(slugify(v));
    }

    function toggleDevice(d: string) {
        setDevices(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSaving(true);
        const res = await fetch("/api/admin/games", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                slug: slug || slugify(name),
                category:      category    || null,
                devices,
                aliases:       aliases ? aliases.split(",").map(a => a.trim()).filter(Boolean) : [],
                thumbnail_url: thumbUrl    || null,
                description:   description || null,
            }),
        });
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            setError(json.error ?? "Create failed.");
            setSaving(false);
            return;
        }
        router.push("/app/admin/games");
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-7">
            {/* ── Group 1: Core identity ── */}
            <fieldset className="space-y-4">
                <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 w-full">
                    Core Identity
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>
                            Name <span className="text-red-500 normal-case tracking-normal font-semibold">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => handleNameChange(e.target.value)}
                            className={inputClass}
                            placeholder="e.g. Coin Master"
                            required
                        />
                    </div>
                    <div>
                        <label className={labelClass}>
                            Slug <span className="text-red-500 normal-case tracking-normal font-semibold">*</span>
                        </label>
                        <input
                            type="text"
                            value={slug}
                            onChange={e => { setSlug(slugify(e.target.value)); setSlugEdited(true); }}
                            className={`${inputClass} font-mono`}
                            placeholder="auto-filled from name"
                            required
                        />
                        <p className={hintClass}>URL-safe identifier. Auto-generated from name, or type to override.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Category</label>
                        <input
                            type="text"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className={inputClass}
                            placeholder="e.g. Strategy, Casino"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Thumbnail URL</label>
                        <input
                            type="url"
                            value={thumbUrl}
                            onChange={e => setThumbUrl(e.target.value)}
                            className={inputClass}
                            placeholder="https://..."
                        />
                    </div>
                </div>
            </fieldset>

            {/* ── Group 2: Platform support ── */}
            <fieldset className="space-y-3">
                <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 w-full">
                    Platform Support
                </legend>
                <div>
                    <label className={labelClass}>Supported Devices</label>
                    <div className="flex gap-3 flex-wrap mt-1">
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
                    <p className={hintClass}>Controls which platform badges appear on the game&apos;s offer page.</p>
                </div>
            </fieldset>

            {/* ── Group 3: Metadata ── */}
            <fieldset className="space-y-4">
                <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 w-full">
                    Metadata
                </legend>
                <div>
                    <label className={labelClass}>Aliases</label>
                    <input
                        type="text"
                        value={aliases}
                        onChange={e => setAliases(e.target.value)}
                        className={inputClass}
                        placeholder="Coin Master, coin-master, CoinMaster"
                    />
                    <p className={hintClass}>Comma-separated. Used by the ingestion pipeline to match offer data to this game.</p>
                </div>
                <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                        value={description}
                        onChange={e => setDesc(e.target.value)}
                        rows={3}
                        className={inputClass}
                        placeholder="Short game description shown on the offer page…"
                    />
                </div>
            </fieldset>

            {/* ── Error ── */}
            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* ── Actions ── */}
            <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition shadow-sm"
                >
                    {saving ? "Creating…" : "Create Game"}
                </button>
                <button
                    type="button"
                    onClick={() => router.push("/app/admin/games")}
                    className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
