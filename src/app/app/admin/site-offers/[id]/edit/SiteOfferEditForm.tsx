"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SiteOfferEditFormProps {
    offer: {
        id:         string;
        title:      string;
        payout_usd: number;
        goal_text:  string | null;
        offer_url:  string | null;
        status:     string;
    };
}

const STATUSES = ["active", "expired", "boosted", "paused"] as const;

const inputClass  = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white transition";
const labelClass  = "block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5";
const hintClass   = "text-xs text-gray-400 mt-1";

export default function SiteOfferEditForm({ offer }: SiteOfferEditFormProps) {
    const router = useRouter();
    const [title,    setTitle]    = useState(offer.title);
    const [payout,   setPayout]   = useState(String(Number(offer.payout_usd).toFixed(2)));
    const [goalText, setGoalText] = useState(offer.goal_text ?? "");
    const [offerUrl, setOfferUrl] = useState(offer.offer_url ?? "");
    const [status,   setStatus]   = useState(offer.status);
    const [saving,   setSaving]   = useState(false);
    const [error,    setError]    = useState<string | null>(null);
    const [success,  setSuccess]  = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const payoutNum = parseFloat(payout);
        if (isNaN(payoutNum) || payoutNum < 0) {
            setError("Payout must be a positive number.");
            return;
        }
        setSaving(true);
        const res = await fetch(`/api/admin/site-offers/${offer.id}`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, payout_usd: payoutNum, goal_text: goalText || null, offer_url: offerUrl || null, status }),
        });
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            setError(json.error ?? "Save failed. Please try again.");
            setSaving(false);
            return;
        }
        setSuccess(true);
        setTimeout(() => router.push("/app/admin/site-offers"), 800);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-7">
            {/* ── Offer Details ── */}
            <fieldset className="space-y-4">
                <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 w-full">
                    Offer Details
                </legend>
                <div>
                    <label className={labelClass}>Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} required />
                    <p className={hintClass}>User-facing name shown in the comparison table.</p>
                </div>
                <div>
                    <label className={labelClass}>Goal Text</label>
                    <input
                        type="text"
                        value={goalText}
                        onChange={e => setGoalText(e.target.value)}
                        className={inputClass}
                        placeholder="e.g. Reach Town Hall 10"
                    />
                    <p className={hintClass}>Short description of what the user must complete.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Payout (USD)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                            <input type="number" step="0.01" min="0" value={payout}
                                onChange={e => setPayout(e.target.value)}
                                className={`${inputClass} pl-7`} required />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </fieldset>

            {/* ── Tracking ── */}
            <fieldset className="space-y-4">
                <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 w-full">
                    Tracking
                </legend>
                <div>
                    <label className={labelClass}>Offer URL</label>
                    <input type="url" value={offerUrl} onChange={e => setOfferUrl(e.target.value)}
                        className={inputClass} placeholder="https://..." />
                    <p className={hintClass}>Referral / tracking link. If empty, the &quot;Start Offer&quot; button will be hidden.</p>
                </div>
            </fieldset>

            {error   && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
            {success && <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">✓ Saved! Redirecting…</div>}

            <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                <button type="submit" disabled={saving || success}
                    className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition shadow-sm">
                    {saving ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" onClick={() => router.push("/app/admin/site-offers")}
                    className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition">
                    Cancel
                </button>
            </div>
        </form>
    );
}
