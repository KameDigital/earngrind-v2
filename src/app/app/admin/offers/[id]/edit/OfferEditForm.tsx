"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EditFormProps {
    offer: {
        id:          string;
        payout_usd:  number;
        status:      string;
        is_featured: boolean;
        is_boosted:  boolean;
    };
}

const STATUSES = ["active", "expired", "boosted", "paused"] as const;

const inputClass  = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white transition";
const labelClass  = "block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5";

export default function OfferEditForm({ offer }: EditFormProps) {
    const router = useRouter();
    const [payout,   setPayout]   = useState(String(Number(offer.payout_usd).toFixed(2)));
    const [status,   setStatus]   = useState(offer.status);
    const [featured, setFeatured] = useState(offer.is_featured);
    const [boosted,  setBoosted]  = useState(offer.is_boosted);
    const [saving,   setSaving]   = useState(false);
    const [error,    setError]    = useState<string | null>(null);
    const [success,  setSuccess]  = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSaving(true);
        const payoutNum = parseFloat(payout);
        if (isNaN(payoutNum) || payoutNum < 0) {
            setError("Payout must be a positive number.");
            setSaving(false);
            return;
        }
        const res = await fetch(`/api/admin/offers/${offer.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payout_usd: payoutNum, status, is_featured: featured, is_boosted: boosted }),
        });
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            setError(json.error ?? "Save failed. Please try again.");
            setSaving(false);
            return;
        }
        setSuccess(true);
        setTimeout(() => router.push("/app/admin/offers"), 800);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── Payout + Status ── */}
            <fieldset className="space-y-4">
                <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 w-full">
                    Payout & Status
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Payout (USD)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={payout}
                                onChange={e => setPayout(e.target.value)}
                                className={`${inputClass} pl-7`}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
                            {STATUSES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </fieldset>

            {/* ── Flags ── */}
            <fieldset className="space-y-3">
                <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 w-full">
                    Display Flags
                </legend>
                <div className="flex gap-6">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={featured}
                            onChange={e => setFeatured(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                        />
                        <span className="text-sm font-medium text-gray-700">Featured ⭐</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={boosted}
                            onChange={e => setBoosted(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                        />
                        <span className="text-sm font-medium text-gray-700">Boosted 🚀</span>
                    </label>
                </div>
            </fieldset>

            {/* ── Feedback ── */}
            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
            )}
            {success && (
                <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
                    ✓ Saved! Redirecting…
                </div>
            )}

            {/* ── Actions ── */}
            <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                <button
                    type="submit"
                    disabled={saving || success}
                    className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition shadow-sm"
                >
                    {saving ? "Saving…" : "Save Changes"}
                </button>
                <button
                    type="button"
                    onClick={() => router.push("/app/admin/offers")}
                    className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
