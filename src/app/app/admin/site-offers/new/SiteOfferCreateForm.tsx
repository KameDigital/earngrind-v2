"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Option { id: string; name: string; }

interface SiteOfferCreateFormProps {
    platforms: Option[];
    providers: Option[];
    games:     Option[];
}

interface PlatformRow {
    rowId:      string;
    siteId:     string;
    providerId: string;
    payout:     string;
    offerUrl:   string;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const inputCls  = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition";
const labelCls  = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1";
const hintCls   = "text-xs text-gray-400 mt-1";
const addBtnCls = "inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition mt-1 px-0";

const STATUSES = ["active", "boosted", "paused", "expired"] as const;

// ─── Inline "Add New" panel ───────────────────────────────────────────────────

interface AddInlinePanelProps {
    label:       string;
    onSave:      (name: string) => Promise<{ error?: string }>;
    onClose:     () => void;
}

function AddInlinePanel({ label, onSave, onClose }: AddInlinePanelProps) {
    const [value,   setValue]   = useState("");
    const [saving,  setSaving]  = useState(false);
    const [err,     setErr]     = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleSave() {
        const trimmed = value.trim();
        if (!trimmed) { setErr("Name is required."); return; }
        setSaving(true); setErr(null);
        const result = await onSave(trimmed);
        if (result?.error) { setErr(result.error); setSaving(false); return; }
        onClose();
    }

    return (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">New {label}</p>
            <input
                ref={inputRef}
                autoFocus
                type="text"
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } if (e.key === "Escape") onClose(); }}
                placeholder={`${label} name…`}
                className="w-full px-2.5 py-1.5 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            />
            {err && <p className="text-xs text-red-600">{err}</p>}
            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
                >
                    {saving ? "Saving…" : "Save & Select"}
                </button>
                <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 transition">
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ─── Platform row component ──────────────────────────────────────────────────

interface PlatformRowEditorProps {
    row:          PlatformRow;
    platforms:    Option[];
    providers:    Option[];
    index:        number;
    canRemove:    boolean;
    onUpdate:     (id: string, field: keyof PlatformRow, value: string) => void;
    onRemove:     (id: string) => void;
    onAddPlatform:(newOpt: Option) => void;
    onAddProvider:(newOpt: Option) => void;
}

function PlatformRowEditor({
    row, platforms, providers, index, canRemove,
    onUpdate, onRemove, onAddPlatform, onAddProvider,
}: PlatformRowEditorProps) {
    const [showSitePanel,     setShowSitePanel]     = useState(false);
    const [showProviderPanel, setShowProviderPanel] = useState(false);

    async function saveNewPlatform(name: string) {
        const res  = await fetch("/api/admin/platforms", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        const json = await res.json();
        if (!res.ok) return { error: json.error ?? "Failed to create platform" };
        const opt = { id: json.platform.id, name: json.platform.name };
        onAddPlatform(opt);
        onUpdate(row.rowId, "siteId", opt.id);
        setShowSitePanel(false);
        return {};
    }

    async function saveNewProvider(name: string) {
        const res  = await fetch("/api/admin/providers", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        const json = await res.json();
        if (!res.ok) return { error: json.error ?? "Failed to create provider" };
        const opt = { id: json.provider.id, name: json.provider.name };
        onAddProvider(opt);
        onUpdate(row.rowId, "providerId", opt.id);
        setShowProviderPanel(false);
        return {};
    }

    return (
        <div className="relative border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/60">
            {/* Row header */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                    Platform {index + 1}
                </span>
                {canRemove && (
                    <button
                        type="button"
                        onClick={() => onRemove(row.rowId)}
                        className="text-xs text-gray-400 hover:text-red-500 transition font-medium"
                    >
                        ✕ Remove
                    </button>
                )}
            </div>

            {/* GPT Site + Provider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className={labelCls}>GPT Site <span className="text-red-400 normal-case font-semibold">*</span></label>
                    <select
                        value={row.siteId}
                        onChange={e => onUpdate(row.rowId, "siteId", e.target.value)}
                        className={inputCls}
                        required
                    >
                        {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {!showSitePanel
                        ? <button type="button" onClick={() => { setShowSitePanel(true); setShowProviderPanel(false); }} className={addBtnCls}>+ Add new GPT site</button>
                        : <AddInlinePanel label="GPT Site" onSave={saveNewPlatform} onClose={() => setShowSitePanel(false)} />
                    }
                </div>
                <div>
                    <label className={labelCls}>Provider (Offerwall) <span className="text-red-400 normal-case font-semibold">*</span></label>
                    <select
                        value={row.providerId}
                        onChange={e => onUpdate(row.rowId, "providerId", e.target.value)}
                        className={inputCls}
                        required
                    >
                        {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {!showProviderPanel
                        ? <button type="button" onClick={() => { setShowProviderPanel(true); setShowSitePanel(false); }} className={addBtnCls}>+ Add new provider</button>
                        : <AddInlinePanel label="Provider" onSave={saveNewProvider} onClose={() => setShowProviderPanel(false)} />
                    }
                </div>
            </div>

            {/* Payout + Offer URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className={labelCls}>Payout (USD) <span className="text-red-400 normal-case font-semibold">*</span></label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={row.payout}
                            onChange={e => onUpdate(row.rowId, "payout", e.target.value)}
                            className={`${inputCls} pl-7`}
                            placeholder="0.00"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className={labelCls}>Offer URL</label>
                    <input
                        type="url"
                        value={row.offerUrl}
                        onChange={e => onUpdate(row.rowId, "offerUrl", e.target.value)}
                        className={inputCls}
                        placeholder="https://…"
                    />
                    <p className={hintCls}>Referral link — leave blank to hide &ldquo;Start Offer&rdquo; button.</p>
                </div>
            </div>
        </div>
    );
}

// ─── Main form ────────────────────────────────────────────────────────────────

function newRow(platforms: Option[], providers: Option[]): PlatformRow {
    return {
        rowId:      crypto.randomUUID(),
        siteId:     platforms[0]?.id ?? "",
        providerId: providers[0]?.id ?? "",
        payout:     "",
        offerUrl:   "",
    };
}

export default function SiteOfferCreateForm({ platforms: initPlatforms, providers: initProviders, games }: SiteOfferCreateFormProps) {
    const router = useRouter();

    // Mutable lists (user can add to these inline)
    const [platforms, setPlatforms] = useState<Option[]>(initPlatforms);
    const [providers, setProviders] = useState<Option[]>(initProviders);
    const [allGames,  setAllGames]  = useState<Option[]>(games);

    // Shared fields
    const [gameId,    setGameId]    = useState(games[0]?.id    ?? "");
    const [title,     setTitle]     = useState("");
    const [goalText,  setGoalText]  = useState("");
    const [status,    setStatus]    = useState<string>("active");

    // Per-platform rows
    const [rows, setRows] = useState<PlatformRow[]>([newRow(initPlatforms, initProviders)]);

    // Game inline panel
    const [showGamePanel, setShowGamePanel] = useState(false);

    // Submission state
    const [saving, setSaving] = useState(false);
    const [error,  setError]  = useState<string | null>(null);

    // Magic wand state
    const [magicInput,  setMagicInput]  = useState("");
    const [isParsing,   setIsParsing]   = useState(false);
    const [magicError,  setMagicError]  = useState<string | null>(null);

    // ── Row helpers ──────────────────────────────────────────────────────────

    const updateRow = useCallback((id: string, field: keyof PlatformRow, value: string) => {
        setRows(prev => prev.map(r => r.rowId === id ? { ...r, [field]: value } : r));
    }, []);

    const removeRow = useCallback((id: string) => {
        setRows(prev => prev.filter(r => r.rowId !== id));
    }, []);

    const addRow = () => setRows(prev => [...prev, newRow(platforms, providers)]);

    // When a new platform/provider is added inline, update all dropdown lists
    const handleAddPlatform = useCallback((opt: Option) => {
        setPlatforms(prev => [...prev, opt].sort((a, b) => a.name.localeCompare(b.name)));
    }, []);

    const handleAddProvider = useCallback((opt: Option) => {
        setProviders(prev => [...prev, opt].sort((a, b) => a.name.localeCompare(b.name)));
    }, []);

    // ── Magic Wand ───────────────────────────────────────────────────────────

    async function handleMagicWand() {
        if (!magicInput.trim()) return;
        setIsParsing(true);
        setMagicError(null);
        try {
            const res = await fetch("/api/admin/magic-parser", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ input: magicInput })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Parsing failed");
            
            if (data.title) setTitle(data.title);
            if (data.payout) updateRow(rows[0].rowId, "payout", data.payout);
            
            setMagicInput("");
        } catch (err: any) {
            setMagicError(err.message);
        } finally {
            setIsParsing(false);
        }
    }

    // ── Game inline creation ─────────────────────────────────────────────────

    async function saveNewGame(name: string) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const res  = await fetch("/api/admin/games", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, slug }),
        });
        const json = await res.json();
        if (!res.ok) return { error: json.error ?? "Failed to create game" };
        const opt = { id: json.game.id, name: json.game.name };
        setAllGames(prev => [...prev, opt].sort((a, b) => a.name.localeCompare(b.name)));
        setGameId(opt.id);
        setShowGamePanel(false);
        return {};
    }

    // ── Submit ───────────────────────────────────────────────────────────────

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        // Validate all rows
        for (const row of rows) {
            const p = parseFloat(row.payout);
            if (isNaN(p) || p < 0) {
                setError(`Platform ${rows.indexOf(row) + 1}: payout must be a valid positive number.`);
                return;
            }
        }

        setSaving(true);

        const payload = rows.map(row => ({
            site_id:     row.siteId,
            provider_id: row.providerId,
            game_id:     gameId,
            title:       title.trim() || `${allGames.find(g => g.id === gameId)?.name ?? "Offer"} — ${platforms.find(p => p.id === row.siteId)?.name ?? ""}`,
            payout_usd:  parseFloat(row.payout),
            goal_text:   goalText.trim() || null,
            offer_url:   row.offerUrl.trim() || null,
            status,
        }));

        const res  = await fetch("/api/admin/site-offers", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload.length === 1 ? payload[0] : payload),
        });

        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            setError(json.error ?? "Create failed. Please try again.");
            setSaving(false);
            return;
        }

        router.push("/app/admin/site-offers");
        router.refresh();
    }

    const rowCount = rows.length;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── Magic Wand 🪄 ─────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex items-start gap-4 relative z-10">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg shrink-0 mt-0.5">
                        <Wand2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-purple-900 uppercase tracking-widest mb-1.5">
                            Magic Wand Parser ✨
                        </label>
                        <p className="text-xs text-purple-700/80 mb-3">
                            Paste an Offer URL or raw text block to automatically extract Title and Payout.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                value={magicInput}
                                onChange={e => setMagicInput(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleMagicWand(); } }}
                                placeholder="https://... or 'Reach level 10 $5.00'"
                                className={`${inputCls} !border-purple-200 focus:!ring-purple-400 focus:!border-purple-400`}
                            />
                            <button
                                type="button"
                                onClick={handleMagicWand}
                                disabled={isParsing || !magicInput}
                                className="px-5 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition shrink-0 shadow-sm"
                            >
                                {isParsing ? "Parsing…" : "✨ Auto-Fill"}
                            </button>
                        </div>
                        {magicError && <p className="text-xs font-medium text-red-500 mt-2">{magicError}</p>}
                    </div>
                </div>
            </div>

            {/* ── Section 1: Game ─────────────────────────────────────────── */}
            <fieldset className="space-y-3">
                <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 w-full">
                    Game
                </legend>
                <div>
                    <label className={labelCls}>Game <span className="text-red-400 normal-case font-semibold">*</span></label>
                    <select
                        value={gameId}
                        onChange={e => setGameId(e.target.value)}
                        className={inputCls}
                        required
                    >
                        {allGames.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    {!showGamePanel
                        ? <button type="button" onClick={() => setShowGamePanel(true)} className={addBtnCls}>+ Add new game</button>
                        : <AddInlinePanel label="Game" onSave={saveNewGame} onClose={() => setShowGamePanel(false)} />
                    }
                    <p className={hintCls}>The game this offer appears under on the public site.</p>
                </div>
            </fieldset>

            {/* ── Section 2: Offer details ─────────────────────────────────── */}
            <fieldset className="space-y-3">
                <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 w-full">
                    Offer Details
                </legend>

                <div>
                    <label className={labelCls}>Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Coin Master: Reach Village 40  (leave blank to auto-generate)"
                    />
                    <p className={hintCls}>User-facing task title. Auto-generates from game + site name if left blank.</p>
                </div>

                <div>
                    <label className={labelCls}>Goal Text</label>
                    <input
                        type="text"
                        value={goalText}
                        onChange={e => setGoalText(e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Reach Town Hall 10 within 30 days"
                    />
                    <p className={hintCls}>Short completion requirement shown to users.</p>
                </div>

                <div className="w-40">
                    <label className={labelCls}>Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </fieldset>

            {/* ── Section 3: Platform rows ─────────────────────────────────── */}
            <fieldset className="space-y-3">
                <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 w-full">
                    Platforms &amp; Payouts
                    <span className="ml-2 normal-case font-normal text-gray-400 tracking-normal">
                        — add one row per GPT site
                    </span>
                </legend>

                <div className="space-y-3">
                    {rows.map((row, i) => (
                        <PlatformRowEditor
                            key={row.rowId}
                            row={row}
                            platforms={platforms}
                            providers={providers}
                            index={i}
                            canRemove={rows.length > 1}
                            onUpdate={updateRow}
                            onRemove={removeRow}
                            onAddPlatform={handleAddPlatform}
                            onAddProvider={handleAddProvider}
                        />
                    ))}
                </div>

                <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 text-sm font-semibold rounded-xl transition w-full justify-center"
                >
                    + Add another platform
                </button>
            </fieldset>

            {/* ── Error ────────────────────────────────────────────────────── */}
            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* ── Submit ───────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition shadow-sm"
                >
                    {saving
                        ? "Creating…"
                        : rowCount === 1
                        ? "Create Offer"
                        : `Create ${rowCount} Offers`
                    }
                </button>
                <button
                    type="button"
                    onClick={() => router.push("/app/admin/site-offers")}
                    className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition"
                >
                    Cancel
                </button>
                {rowCount > 1 && (
                    <span className="text-xs text-gray-400 ml-1">
                        {rowCount} offers will be created for <strong className="text-gray-600">{allGames.find(g => g.id === gameId)?.name ?? "this game"}</strong>
                    </span>
                )}
            </div>
        </form>
    );
}
