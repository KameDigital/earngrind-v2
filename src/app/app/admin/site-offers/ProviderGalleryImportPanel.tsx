"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";

export type ProviderGalleryPanelStats = {
    fetched: number;
    imported: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
};

export type ProviderGalleryQualityMetric = {
    label: string;
    value: number | string;
};

export type ProviderGalleryBatchRow = {
    label: string;
    stats: ProviderGalleryPanelStats;
};

type Tone = "lime" | "emerald" | "sky";

type Props<Result> = {
    providerName: string;
    eyebrow: string;
    title: string;
    description: string;
    endpoint: string;
    tone: Tone;
    fields: ReactNode;
    buildRequestBody: (batch: boolean) => Record<string, unknown>;
    getStats: (result: Result) => ProviderGalleryPanelStats | null;
    getQualityMetrics?: (result: Result) => ProviderGalleryQualityMetric[];
    getBatchRows?: (result: Result) => ProviderGalleryBatchRow[];
    primaryLabel?: string;
    secondaryLabel?: string;
    footerNote?: ReactNode;
};

const EMPTY_STATS: ProviderGalleryPanelStats = {
    fetched: 0,
    imported: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
};

const TONE_CLASSES: Record<Tone, {
    section: string;
    eyebrow: string;
    stat: string;
    batchHeader: string;
}> = {
    lime: {
        section: "border-lime-200 bg-lime-50/50",
        eyebrow: "text-lime-700",
        stat: "border-lime-200",
        batchHeader: "border-lime-100 bg-lime-50",
    },
    emerald: {
        section: "border-emerald-200 bg-emerald-50/50",
        eyebrow: "text-emerald-700",
        stat: "border-emerald-200",
        batchHeader: "border-emerald-100 bg-emerald-50",
    },
    sky: {
        section: "border-sky-200 bg-sky-50/50",
        eyebrow: "text-sky-700",
        stat: "border-sky-200",
        batchHeader: "border-sky-100 bg-sky-50",
    },
};

export default function ProviderGalleryImportPanel<Result>({
    providerName,
    eyebrow,
    title,
    description,
    endpoint,
    tone,
    fields,
    buildRequestBody,
    getStats,
    getQualityMetrics,
    getBatchRows,
    primaryLabel = "Pull Offers",
    secondaryLabel,
    footerNote,
}: Props<Result>) {
    const router = useRouter();
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<Result | null>(null);
    const classes = TONE_CLASSES[tone];

    async function runImport(batch = false) {
        setIsImporting(true);
        setError(null);
        setResult(null);

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildRequestBody(batch)),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(typeof payload.error === "string" ? payload.error : `${providerName} import failed.`);
            setIsImporting(false);
            return;
        }

        setResult(payload as Result);
        setIsImporting(false);
        router.refresh();
    }

    const stats = result ? getStats(result) ?? EMPTY_STATS : null;
    const quality = result && getQualityMetrics ? getQualityMetrics(result) : [];
    const batchRows = result && getBatchRows ? getBatchRows(result) : [];

    return (
        <section className={`rounded-2xl border p-5 shadow-sm ${classes.section}`}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-2xl">
                    <p className={`text-[11px] font-bold uppercase tracking-[0.24em] ${classes.eyebrow}`}>{eyebrow}</p>
                    <h2 className="mt-1 text-xl font-extrabold tracking-tight text-gray-950">{title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
                </div>
                <div className="grid gap-3">
                    <div className="grid gap-3 sm:grid-flow-col sm:auto-cols-max">{fields}</div>
                    <div className="grid gap-2 sm:grid-flow-col sm:auto-cols-max sm:justify-end">
                        <button
                            type="button"
                            onClick={() => runImport(false)}
                            disabled={isImporting}
                            className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isImporting ? "Importing..." : primaryLabel}
                        </button>
                        {secondaryLabel ? (
                            <button
                                type="button"
                                onClick={() => runImport(true)}
                                disabled={isImporting}
                                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-900 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {secondaryLabel}
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            {footerNote ? <div className="mt-3 text-xs font-medium text-gray-500">{footerNote}</div> : null}

            {error ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                </div>
            ) : null}

            {stats ? (
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-6">
                    {statsEntries(stats).map(([label, value]) => (
                        <MetricCard key={label} label={label} value={value} className={classes.stat} />
                    ))}
                </div>
            ) : null}

            {batchRows.length > 0 ? (
                <div className={`mt-3 overflow-hidden rounded-xl border bg-white ${classes.stat}`}>
                    <div className={`grid grid-cols-7 gap-2 border-b px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 ${classes.batchHeader}`}>
                        <span>Source</span><span>Fetched</span><span>Imported</span><span>Created</span><span>Updated</span><span>Skipped</span><span>Failed</span>
                    </div>
                    {batchRows.map((item) => (
                        <div key={item.label} className="grid grid-cols-7 gap-2 px-3 py-2 text-xs font-semibold text-gray-700">
                            <span>{item.label}</span>
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

            {quality.length > 0 ? (
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
                    {quality.map((item) => (
                        <MetricCard key={item.label} label={item.label} value={item.value} className={classes.stat} />
                    ))}
                </div>
            ) : null}
        </section>
    );
}

function MetricCard({ label, value, className }: { label: string; value: number | string; className: string }) {
    return (
        <div className={`rounded-xl border bg-white px-3 py-2 ${className}`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
            <div className="mt-1 text-lg font-black text-gray-950">{value}</div>
        </div>
    );
}

function statsEntries(stats: ProviderGalleryPanelStats): Array<[string, number]> {
    return [
        ["Fetched", stats.fetched],
        ["Imported", stats.imported],
        ["Created", stats.created],
        ["Updated", stats.updated],
        ["Skipped", stats.skipped],
        ["Failed", stats.failed],
    ];
}
