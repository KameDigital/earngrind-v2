"use client";

import Link from "next/link";
import { useState } from "react";

export default function SearchConsoleImportForm() {
    const [csv, setCsv] = useState("");
    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ inserted: number; matched: number; unmatched: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function submit() {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const response = await fetch("/api/admin/seo/search-console-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ csv, dateStart, dateEnd }),
            });
            const json = await response.json().catch(() => null);
            if (!response.ok) {
                setError(json?.error ?? "Import failed.");
                return;
            }
            setResult(json);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Date Start</span>
                        <input type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Date End</span>
                        <input type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    </label>
                </div>
                <label className="mt-4 block">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">CSV Export</span>
                    <textarea
                        value={csv}
                        onChange={(event) => setCsv(event.target.value)}
                        rows={14}
                        placeholder={"Page,Query,Clicks,Impressions,CTR,Position\nhttps://earngrind.com/guides/raid-shadow-legends-offer-guide,raid shadow legends offer guide,12,900,1.33%,7.4"}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-xs"
                    />
                </label>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={submit}
                        disabled={loading || !csv.trim()}
                        className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Importing..." : "Import Search Console Rows"}
                    </button>
                    <Link href="/app/admin/seo/search-console" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">
                        View Report
                    </Link>
                </div>
                {error ? <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
                {result ? (
                    <div className="mt-4 rounded-xl border border-green-100 bg-green-50 p-3 text-sm font-semibold text-green-800">
                        Imported {result.inserted} rows. Matched {result.matched} to guides; {result.unmatched} unmatched rows kept by page URL.
                    </div>
                ) : null}
            </div>
        </div>
    );
}
