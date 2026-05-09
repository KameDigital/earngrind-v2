"use client";

import { useMemo, useState } from "react";

type SyncResult = {
    inserted: number;
    matched: number;
    unmatched: number;
    dateStart: string;
    dateEnd: string;
};

function formatDate(date: Date) {
    return date.toISOString().slice(0, 10);
}

function defaultRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 27);
    return { start: formatDate(start), end: formatDate(end) };
}

export default function SearchConsoleSyncPanel({
    connected,
    envReady,
    missingEnv,
    isAdmin,
    message,
    error,
}: {
    connected: boolean;
    envReady: boolean;
    missingEnv: string[];
    isAdmin: boolean;
    message?: string;
    error?: string;
}) {
    const range = useMemo(() => defaultRange(), []);
    const [startDate, setStartDate] = useState(range.start);
    const [endDate, setEndDate] = useState(range.end);
    const [status, setStatus] = useState<string | null>(message ?? null);
    const [syncError, setSyncError] = useState<string | null>(error ?? null);
    const [syncing, setSyncing] = useState(false);

    async function sync() {
        setSyncing(true);
        setStatus(null);
        setSyncError(null);
        try {
            const response = await fetch("/api/admin/seo/search-console/sync", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ startDate, endDate }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(typeof payload.error === "string" ? payload.error : "Search Console sync failed.");
            }
            const result = payload as SyncResult;
            setStatus(`Synced ${result.inserted} rows (${result.matched} matched, ${result.unmatched} unmatched) for ${result.dateStart} to ${result.dateEnd}.`);
        } catch (err) {
            setSyncError(err instanceof Error ? err.message : "Search Console sync failed.");
        } finally {
            setSyncing(false);
        }
    }

    if (!isAdmin) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm font-semibold text-gray-500 shadow-sm">
                Google Search Console sync is restricted to admins.
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Google Search Console API</div>
                    <div className="mt-1 text-sm font-semibold text-gray-700">
                        {connected ? "Connected for API sync." : "Connect Google Search Console to sync page/query performance."}
                    </div>
                    {!envReady ? (
                        <div className="mt-2 text-sm font-semibold text-red-700">
                            Missing Google env vars: {missingEnv.join(", ")}
                        </div>
                    ) : null}
                </div>

                {connected ? (
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,160px)_minmax(0,160px)_auto]">
                        <label className="block">
                            <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Start</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(event) => setStartDate(event.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">End</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(event) => setEndDate(event.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={sync}
                            disabled={syncing || !envReady}
                            className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            {syncing ? "Syncing..." : "Sync Last 28 Days"}
                        </button>
                    </div>
                ) : (
                    <a
                        href="/api/admin/seo/search-console/oauth/start"
                        className={`rounded-xl px-4 py-2.5 text-sm font-bold ${envReady ? "bg-gray-900 text-white" : "pointer-events-none bg-gray-300 text-white"}`}
                    >
                        Connect Google Search Console
                    </a>
                )}
            </div>

            {status ? <div className="mt-4 rounded-xl border border-lime-200 bg-lime-50 px-3 py-2 text-sm font-semibold text-lime-800">{status}</div> : null}
            {syncError ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{syncError}</div> : null}
        </div>
    );
}
