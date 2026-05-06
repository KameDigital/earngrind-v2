"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EARNLAB_GALLERY_COUNTRIES, EARNLAB_COUNTRY_NAMES } from "@/lib/earnlab-countries";

type ImportResult = {
    countryCode: string;
    countryName: string;
    stats: {
        fetched: number;
        imported: number;
        created: number;
        updated: number;
        skipped: number;
        failed: number;
    };
};

export default function EarnLabGalleryImportPanel() {
    const router = useRouter();
    const [country, setCountry] = useState("US");
    const [limit, setLimit] = useState(50);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);

    async function runImport() {
        setIsImporting(true);
        setError(null);
        setResult(null);

        const response = await fetch("/api/admin/earnlab/gallery-import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                country,
                limit,
                refresh: true,
            }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(typeof payload.error === "string" ? payload.error : "EarnLab import failed.");
            setIsImporting(false);
            return;
        }

        setResult(payload as ImportResult);
        setIsImporting(false);
        router.refresh();
    }

    return (
        <section className="rounded-2xl border border-lime-200 bg-lime-50/50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-lime-700">EarnLab gallery import</p>
                    <h2 className="mt-1 text-xl font-extrabold tracking-tight text-gray-950">Pull country-specific EarnLab offers</h2>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                        Fetches the EarnLab gallery API by country and upserts results into existing site_offers rows using source ID plus country code. Direct per-offer links are preserved if they already exist.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[160px_120px_auto]">
                    <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Country</span>
                        <select
                            value={country}
                            onChange={(event) => setCountry(event.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                        >
                            {EARNLAB_GALLERY_COUNTRIES.map((code) => (
                                <option key={code} value={code}>
                                    {code} - {EARNLAB_COUNTRY_NAMES[code]}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Limit</span>
                        <input
                            type="number"
                            min={1}
                            max={75}
                            value={limit}
                            onChange={(event) => setLimit(Math.min(75, Math.max(1, Number(event.target.value) || 1)))}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                        />
                    </label>
                    <button
                        type="button"
                        onClick={runImport}
                        disabled={isImporting}
                        className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 sm:self-end"
                    >
                        {isImporting ? "Importing..." : "Pull Offers"}
                    </button>
                </div>
            </div>

            {error ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                </div>
            ) : null}

            {result ? (
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-6">
                    {[
                        ["Fetched", result.stats.fetched],
                        ["Imported", result.stats.imported],
                        ["Created", result.stats.created],
                        ["Updated", result.stats.updated],
                        ["Skipped", result.stats.skipped],
                        ["Failed", result.stats.failed],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-lime-200 bg-white px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
                            <div className="mt-1 text-lg font-black text-gray-950">{value}</div>
                        </div>
                    ))}
                </div>
            ) : null}
        </section>
    );
}
