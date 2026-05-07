"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ImportStats = {
    fetched: number;
    imported: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
};

type ImportResult = {
    countryCode: string;
    provider: string | null;
    stats: ImportStats;
    quality?: {
        totalGemslootRows: number;
        missingImages: number;
        zeroOrLowPayouts: number;
        missingTasks: number;
        duplicateExternalIds: number;
        brokenGameSlugs: number;
    };
};

const PROVIDER_OPTIONS = [
    { value: "", label: "All providers" },
    { value: "Gemsloot", label: "Gemsloot" },
    { value: "ToroX", label: "ToroX" },
    { value: "RevU", label: "Revenue Universe" },
    { value: "BitLabs", label: "BitLabs" },
    { value: "TyrAds", label: "TyrAds" },
    { value: "AdscendMedia", label: "AdscendMedia" },
    { value: "HangMyAds", label: "HangMyAds" },
];

const EMPTY_STATS = { fetched: 0, imported: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

export default function GemslootGalleryImportPanel() {
    const router = useRouter();
    const [provider, setProvider] = useState("");
    const [country, setCountry] = useState("US");
    const [device, setDevice] = useState("");
    const [limit, setLimit] = useState(120);
    const [sort, setSort] = useState<"epc" | "completed">("epc");
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);

    async function runImport() {
        setIsImporting(true);
        setError(null);
        setResult(null);

        const response = await fetch("/api/admin/gemsloot/gallery-import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                provider: provider || undefined,
                country,
                device: device || undefined,
                limit,
                sort,
                refresh: true,
            }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(typeof payload.error === "string" ? payload.error : "Gemsloot import failed.");
            setIsImporting(false);
            return;
        }

        setResult(payload as ImportResult);
        setIsImporting(false);
        router.refresh();
    }

    const stats = result?.stats ?? EMPTY_STATS;

    return (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-2xl">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">Gemsloot gallery import</p>
                    <h2 className="mt-1 text-xl font-extrabold tracking-tight text-gray-950">Pull Gemsloot offers</h2>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                        Imports Gemsloot gallery rows by provider, country, and device. Completed-count sorting is available from Gemsloot&apos;s list response.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[180px_90px_110px_110px_110px_auto]">
                    <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Provider</span>
                        <select
                            value={provider}
                            onChange={(event) => setProvider(event.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                        >
                            {PROVIDER_OPTIONS.map((option) => (
                                <option key={option.value || "all"} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Country</span>
                        <input
                            value={country}
                            maxLength={2}
                            onChange={(event) => setCountry(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                        />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Device</span>
                        <select
                            value={device}
                            onChange={(event) => setDevice(event.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                        >
                            <option value="">Any</option>
                            <option value="android">Android</option>
                            <option value="ios">iOS</option>
                            <option value="windows">Windows</option>
                            <option value="mac">Mac</option>
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Sort</span>
                        <select
                            value={sort}
                            onChange={(event) => setSort(event.target.value === "completed" ? "completed" : "epc")}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                        >
                            <option value="epc">Payout</option>
                            <option value="completed">Completed</option>
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Limit</span>
                        <input
                            type="number"
                            min={1}
                            max={300}
                            value={limit}
                            onChange={(event) => setLimit(Math.min(300, Math.max(1, Number(event.target.value) || 1)))}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                        />
                    </label>
                    <button
                        type="button"
                        onClick={runImport}
                        disabled={isImporting}
                        className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 sm:self-end"
                    >
                        {isImporting ? "Importing..." : "Pull Gemsloot"}
                    </button>
                </div>
            </div>

            {error ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                </div>
            ) : null}

            {result ? (
                <>
                    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-6">
                        {[
                            ["Fetched", stats.fetched],
                            ["Imported", stats.imported],
                            ["Created", stats.created],
                            ["Updated", stats.updated],
                            ["Skipped", stats.skipped],
                            ["Failed", stats.failed],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-xl border border-emerald-200 bg-white px-3 py-2">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
                                <div className="mt-1 text-lg font-black text-gray-950">{value}</div>
                            </div>
                        ))}
                    </div>

                    {result.quality ? (
                        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
                            {[
                                ["Rows", result.quality.totalGemslootRows],
                                ["Missing images", result.quality.missingImages],
                                ["Low payouts", result.quality.zeroOrLowPayouts],
                                ["Missing tasks", result.quality.missingTasks],
                                ["Dupes", result.quality.duplicateExternalIds],
                                ["Bad slugs", result.quality.brokenGameSlugs],
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-xl border border-emerald-200 bg-white px-3 py-2">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
                                    <div className="mt-1 text-lg font-black text-gray-950">{value}</div>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </>
            ) : null}
        </section>
    );
}
