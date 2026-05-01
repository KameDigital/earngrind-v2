"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type OpportunityRow = {
  key: string;
  targetName: string;
  type: "game" | "platform" | "offer";
  researchSourceCount: number;
  highestPayout: number | null;
  existingGuideCount: number;
  publishedGuideCount: number;
  score: number;
  label: string;
  reasons: string[];
  needsResearch: boolean;
  generatorType: "platform" | "game_offer";
};

function generatorHref(row: OpportunityRow) {
  const params = new URLSearchParams({
    mode: "research_review",
    target: row.targetName,
    type: row.generatorType === "platform" ? "platform" : "game",
    useStoredResearch: "1",
  });
  return `/app/admin/guides/batch-generate?${params.toString()}`;
}

function encodeTargets(rows: OpportunityRow[]) {
  const payload = rows.map((row) => ({
    targetName: row.targetName,
    type: row.type,
    reviewType: row.generatorType === "platform" ? "platform" : "game_offer",
    opportunityScore: row.score,
    opportunityLabel: row.label,
    researchSourceCount: row.researchSourceCount,
    highestPayout: row.highestPayout,
  }));
  return encodeURIComponent(JSON.stringify(payload));
}

export default function ResearchOpportunitiesClient({ rows, needsResearchRows }: { rows: OpportunityRow[]; needsResearchRows: OpportunityRow[] }) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const selectedRows = useMemo(() => rows.filter((row) => selectedKeys.has(row.key)), [rows, selectedKeys]);

  function setSelected(row: OpportunityRow, selected: boolean) {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (selected) next.add(row.key);
      else next.delete(row.key);
      return next;
    });
  }

  function selectRows(nextRows: OpportunityRow[]) {
    setSelectedKeys(new Set(nextRows.map((row) => row.key)));
  }

  const batchName = `Research Batch - ${new Date().toISOString().slice(0, 10)}`;
  const batchHref = selectedRows.length
    ? `/app/admin/guides/batch-generate?mode=research_review&useStoredResearch=1&createMultipleLongTail=1&aggressiveMode=1&batchName=${encodeURIComponent(batchName)}&targets=${encodeTargets(selectedRows)}`
    : "#";

  return (
    <div className="space-y-6">
      {needsResearchRows.length ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-amber-950">Needs Research: high payout, no research, no published review</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {needsResearchRows.map((row) => (
              <div key={`needs-${row.key}`} className="rounded-xl border border-amber-200 bg-white p-3">
                <div className="text-sm font-bold text-gray-900">{row.targetName}</div>
                <div className="mt-1 text-xs text-gray-500 capitalize">{row.type} | {row.highestPayout ? `$${row.highestPayout.toFixed(2)}` : "no payout"}</div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/app/admin/research?target=${encodeURIComponent(row.targetName)}`} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">Add research</Link>
                  <Link href={generatorHref(row)} className="rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-bold text-white">Generate review</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-gray-900">Prioritized Targets</h2>
            <p className="mt-1 text-xs text-gray-500">{selectedRows.length} selected for batch planning.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => selectRows(rows.slice(0, 10))} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Select Top 10</button>
            <button type="button" onClick={() => selectRows(rows.filter((row) => row.label === "Highest Priority"))} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Select Highest Priority</button>
            <button type="button" onClick={() => setSelectedKeys(new Set())} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Clear Selection</button>
            {selectedRows.length ? <Link href={batchHref} className="rounded-lg bg-lime-500 px-3 py-2 text-xs font-extrabold text-gray-950 hover:bg-lime-400">Create Content Batch</Link> : null}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
              <tr>
                <th className="px-4 py-3 text-center">Plan</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-center">Sources</th>
                <th className="px-4 py-3 text-right">Highest Payout</th>
                <th className="px-4 py-3 text-center">Guides</th>
                <th className="px-4 py-3 text-center">Score</th>
                <th className="px-4 py-3">Reasons</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.key} className={row.needsResearch ? "bg-amber-50/50" : "hover:bg-gray-50"}>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={selectedKeys.has(row.key)} onChange={(event) => setSelected(row, event.target.checked)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900">{row.targetName}</div>
                    <div className="mt-0.5 text-xs font-semibold text-gray-400">{row.label}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{row.type}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.researchSourceCount}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-700">{row.highestPayout ? `$${row.highestPayout.toFixed(2)}` : "-"}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{row.existingGuideCount}<div className="text-[11px] text-gray-400">{row.publishedGuideCount} published</div></td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${row.score >= 90 ? "bg-lime-100 text-lime-900" : row.score >= 75 ? "bg-green-100 text-green-800" : row.score >= 50 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-500"}`}>{row.score}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-sm flex-wrap gap-1">
                      {row.reasons.length ? row.reasons.map((reason) => <span key={`${row.key}-${reason}`} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600">{reason}</span>) : <span className="text-xs text-gray-400">No strong signals yet</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link href={`/app/admin/research?target=${encodeURIComponent(row.targetName)}`} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-50">Add research</Link>
                      <Link href={generatorHref(row)} className="rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-bold text-white hover:bg-gray-800">Generate review</Link>
                      <Link href={`/app/admin/guides?keyword=${encodeURIComponent(row.targetName)}`} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-50">Related guides</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
