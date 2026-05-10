"use client";

import { useState } from "react";
import ProviderGalleryImportPanel, {
    ProviderGalleryPanelStats,
    ProviderGalleryQualityMetric,
} from "./ProviderGalleryImportPanel";

type ImportResult = {
    countryCode: string;
    provider: string | null;
    stats: ProviderGalleryPanelStats;
    quality?: {
        totalRows?: number;
        totalGemslootRows?: number;
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

export default function GemslootGalleryImportPanel() {
    const [provider, setProvider] = useState("");
    const [country, setCountry] = useState("US");
    const [device, setDevice] = useState("");
    const [limit, setLimit] = useState(120);
    const [sort, setSort] = useState<"epc" | "completed">("epc");

    return (
        <ProviderGalleryImportPanel<ImportResult>
            providerName="Gemsloot"
            eyebrow="Gemsloot gallery import"
            title="Pull Gemsloot offers"
            description="Imports Gemsloot gallery rows by provider, country, and device through the shared provider-gallery upsert. Completed-count sorting is available from Gemsloot's list response."
            endpoint="/api/admin/gemsloot/gallery-import"
            tone="emerald"
            primaryLabel="Pull Gemsloot"
            buildRequestBody={() => ({
                provider: provider || undefined,
                country,
                device: device || undefined,
                limit,
                sort,
                refresh: true,
            })}
            getStats={(result) => result.stats}
            getQualityMetrics={getGemslootQualityMetrics}
            fields={(
                <>
                    <label className="block w-44">
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
                    <label className="block w-28">
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

function getGemslootQualityMetrics(result: ImportResult): ProviderGalleryQualityMetric[] {
    if (!result.quality) return [];
    return [
        ["Rows", result.quality.totalGemslootRows ?? result.quality.totalRows ?? 0],
        ["Missing images", result.quality.missingImages],
        ["Low payouts", result.quality.zeroOrLowPayouts],
        ["Missing tasks", result.quality.missingTasks],
        ["Dupes", result.quality.duplicateExternalIds],
        ["Bad slugs", result.quality.brokenGameSlugs],
    ].map(([label, value]) => ({ label: String(label), value }));
}
