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

type GainWall =
    | "native"
    | "revu"
    | "adtowall"
    | "timewall"
    | "mychips"
    | "grabcherries"
    | "cpx"
    | "adgate"
    | "ayet"
    | "polltastic"
    | "asmwall"
    | "lootably"
    | "theoremreach"
    | "primeearn"
    | "bitlabs";

type ImportResult = {
    wall: GainWall;
    countryCode: string;
    batch?: boolean;
    results?: Array<{
        wall: GainWall;
        countryCode: string;
        stats: ImportStats;
    }>;
    totals?: ImportStats;
    stats?: ImportStats;
    quality?: {
        totalGainRows: number;
        byWall: Record<string, number>;
        byProvider: Record<string, number>;
        byCountry: Record<string, number>;
        byStatus: Record<string, number>;
        missingImages: number;
        zeroOrLowPayouts: number;
        missingTasks: number;
        duplicateExternalIds: number;
        brokenGameSlugs: number;
    };
};

const WALL_OPTIONS: Array<{ value: GainWall; label: string; note: string }> = [
    { value: "native", label: "Native Gain / Torox", note: "Gain API offers" },
    { value: "revu", label: "Revenue Universe", note: "Direct RevU wall API" },
    { value: "adtowall", label: "AdToWall", note: "Live offerwall HTML" },
    { value: "mychips", label: "MyChips", note: "Bootstraps Gain MyChips session, then pulls campaigns API" },
    { value: "cpx", label: "CPX Research", note: "Survey API from CPX Research" },
    { value: "asmwall", label: "ASMWall", note: "Direct ASMWall offers JSON" },
    { value: "lootably", label: "Lootably", note: "Embedded Lootably offer data from the wall page" },
    { value: "timewall", label: "Timewall", note: "Registered as a shell source; parser pending" },
    { value: "grabcherries", label: "GrabCherries", note: "Registered as a shell source; parser pending" },
    { value: "adgate", label: "AdGate", note: "Registered as a shell source; parser pending" },
    { value: "ayet", label: "AyeT Studios", note: "Registered as a shell source; parser pending" },
    { value: "polltastic", label: "Polltastic", note: "Registered as a shell source; parser pending" },
    { value: "theoremreach", label: "TheoremReach", note: "Registered as a shell source; parser pending" },
    { value: "primeearn", label: "PrimeEarn", note: "Registered as a shell source; parser pending" },
    { value: "bitlabs", label: "BitLabs", note: "Registered as a shell source; parser pending" },
];

const EMPTY_STATS = { fetched: 0, imported: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

export default function GainGalleryImportPanel() {
    const router = useRouter();
    const [wall, setWall] = useState<GainWall>("native");
    const [country, setCountry] = useState("US");
    const [limit, setLimit] = useState(100);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);

    async function runImport() {
        await runRequest(false);
    }

    async function runBatchImport() {
        await runRequest(true);
    }

    async function runRequest(batch: boolean) {
        setIsImporting(true);
        setError(null);
        setResult(null);

        const response = await fetch("/api/admin/gain/gallery-import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                wall,
                country,
                limit: batch ? undefined : limit,
                refresh: true,
                batch,
            }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(typeof payload.error === "string" ? payload.error : "Gain import failed.");
            setIsImporting(false);
            return;
        }

        setResult(payload as ImportResult);
        setIsImporting(false);
        router.refresh();
    }

    return (
        <section className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-2xl">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-sky-700">Gain.gg gallery import</p>
                    <h2 className="mt-1 text-xl font-extrabold tracking-tight text-gray-950">Pull Gain wall offers</h2>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                        Imports Gain walls as separate sources. Direct URLs are only updated when the wall returns a tracking link; shell-only walls are selectable but import zero rows until a safe parser is added.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[220px_100px_120px_auto]">
                    <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Wall</span>
                        <select
                            value={wall}
                            onChange={(event) => setWall(event.target.value as GainWall)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                        >
                            {WALL_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
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
                    <div className="grid gap-2 sm:self-end">
                        <button
                            type="button"
                            onClick={runImport}
                            disabled={isImporting}
                            className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isImporting ? "Importing..." : "Pull Wall"}
                        </button>
                        <button
                            type="button"
                            onClick={runBatchImport}
                            disabled={isImporting}
                            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-900 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Batch Proven
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-3 text-xs font-medium text-gray-500">
                {WALL_OPTIONS.find((option) => option.value === wall)?.note}
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
                            ["Fetched", (result.totals ?? result.stats ?? EMPTY_STATS).fetched],
                            ["Imported", (result.totals ?? result.stats ?? EMPTY_STATS).imported],
                            ["Created", (result.totals ?? result.stats ?? EMPTY_STATS).created],
                            ["Updated", (result.totals ?? result.stats ?? EMPTY_STATS).updated],
                            ["Skipped", (result.totals ?? result.stats ?? EMPTY_STATS).skipped],
                            ["Failed", (result.totals ?? result.stats ?? EMPTY_STATS).failed],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-xl border border-sky-200 bg-white px-3 py-2">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
                                <div className="mt-1 text-lg font-black text-gray-950">{value}</div>
                            </div>
                        ))}
                    </div>

                    {result.results?.length ? (
                        <div className="mt-3 overflow-hidden rounded-xl border border-sky-200 bg-white">
                            <div className="grid grid-cols-7 gap-2 border-b border-sky-100 bg-sky-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                <span>Wall</span><span>Fetched</span><span>Imported</span><span>Created</span><span>Updated</span><span>Skipped</span><span>Failed</span>
                            </div>
                            {result.results.map((item) => (
                                <div key={item.wall} className="grid grid-cols-7 gap-2 px-3 py-2 text-xs font-semibold text-gray-700">
                                    <span>{item.wall}</span>
                                    <span>{item.stats.fetched}</span>
                                    <span>{item.stats.imported}</span>
                                    <span>{item.stats.created}</span>
                                    <span>{item.stats.updated}</span>
                                    <span>{item.stats.skipped}</span>
                                    <span>{item.stats.failed}</span>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {result.quality ? (
                        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
                            {[
                                ["Gain rows", result.quality.totalGainRows],
                                ["Missing images", result.quality.missingImages],
                                ["Low payouts", result.quality.zeroOrLowPayouts],
                                ["Missing tasks", result.quality.missingTasks],
                                ["Dupes", result.quality.duplicateExternalIds],
                                ["Bad slugs", result.quality.brokenGameSlugs],
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-xl border border-sky-200 bg-white px-3 py-2">
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
