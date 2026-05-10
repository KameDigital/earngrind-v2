"use client";

import { useState } from "react";
import ProviderGalleryImportPanel, {
    ProviderGalleryBatchRow,
    ProviderGalleryPanelStats,
    ProviderGalleryQualityMetric,
} from "./ProviderGalleryImportPanel";

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
        stats: ProviderGalleryPanelStats;
    }>;
    totals?: ProviderGalleryPanelStats;
    stats?: ProviderGalleryPanelStats;
    quality?: {
        totalRows?: number;
        totalGainRows?: number;
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

export default function GainGalleryImportPanel() {
    const [wall, setWall] = useState<GainWall>("native");
    const [country, setCountry] = useState("US");
    const [limit, setLimit] = useState(100);

    return (
        <ProviderGalleryImportPanel<ImportResult>
            providerName="Gain"
            eyebrow="Gain.gg gallery import"
            title="Pull Gain wall offers"
            description="Imports Gain walls as separate sources through the shared provider-gallery upsert. Direct URLs are only updated when the wall returns a safe tracking link."
            endpoint="/api/admin/gain/gallery-import"
            tone="sky"
            primaryLabel="Pull Wall"
            secondaryLabel="Batch Proven"
            buildRequestBody={(batch) => ({
                wall,
                country,
                limit: batch ? undefined : limit,
                refresh: true,
                batch,
            })}
            getStats={(result) => result.totals ?? result.stats ?? null}
            getBatchRows={getGainBatchRows}
            getQualityMetrics={getGainQualityMetrics}
            footerNote={WALL_OPTIONS.find((option) => option.value === wall)?.note}
            fields={(
                <>
                    <label className="block w-56">
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
                    <label className="block w-24">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Country</span>
                        <input
                            value={country}
                            maxLength={2}
                            onChange={(event) => setCountry(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                        />
                    </label>
                    <label className="block w-28">
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
                </>
            )}
        />
    );
}

function getGainBatchRows(result: ImportResult): ProviderGalleryBatchRow[] {
    return result.results?.map((item) => ({
        label: item.wall,
        stats: item.stats,
    })) ?? [];
}

function getGainQualityMetrics(result: ImportResult): ProviderGalleryQualityMetric[] {
    if (!result.quality) return [];
    return [
        ["Gain rows", result.quality.totalGainRows ?? result.quality.totalRows ?? 0],
        ["Missing images", result.quality.missingImages],
        ["Low payouts", result.quality.zeroOrLowPayouts],
        ["Missing tasks", result.quality.missingTasks],
        ["Dupes", result.quality.duplicateExternalIds],
        ["Bad slugs", result.quality.brokenGameSlugs],
    ].map(([label, value]) => ({ label: String(label), value }));
}
