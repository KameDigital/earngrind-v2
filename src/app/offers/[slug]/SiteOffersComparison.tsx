"use client";

import { useState } from "react";

// ── Types ───────────────────────────────────────────────────────────────────
export interface SiteOfferTask {
    id:              string;
    sort_order:      number;
    title:           string;
    reward_amount:   number;
    reward_display:  string | null;
    task_type:       string;
    time_limit_text: string | null;
}

export interface SiteOffer {
    id:         string;
    payout_usd: number;
    goal_text:  string | null;
    offer_url:  string | null;
    status:     string;
    site:       { name: string } | null;
    provider:   { name: string } | null;
    tasks:      SiteOfferTask[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
    install:   "bg-blue-100 text-blue-700",
    milestone: "bg-green-100 text-green-700",
    purchase:  "bg-purple-100 text-purple-700",
    signup:    "bg-yellow-100 text-yellow-700",
    other:     "bg-gray-100 text-gray-500",
};

// ── Component ────────────────────────────────────────────────────────────────
export default function SiteOffersComparison({ rows }: { rows: SiteOffer[] }) {
    const [openGoals, setOpenGoals] = useState<Record<string, boolean>>({});

    if (rows.length === 0) return null;

    const best = rows[0];

    function toggleGoals(id: string) {
        setOpenGoals(prev => ({ ...prev, [id]: !prev[id] }));
    }

    return (
        <div>
            <div className="flex items-center justify-between px-1 mb-3">
                <h2 className="text-lg font-extrabold text-[var(--brand-ink)] tracking-tight">
                    Compare GPT Sites
                </h2>
                <div className="text-sm font-bold text-[var(--text-secondary)] bg-white border border-[var(--border-default)] px-2.5 py-1 rounded-lg shadow-[var(--shadow-card)]">
                    {rows.length} site{rows.length !== 1 ? "s" : ""}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] overflow-hidden">
                {/* Header */}
                <div className="hidden sm:grid grid-cols-[1fr_1fr_auto] gap-3 items-center px-5 py-2.5 bg-[var(--surface-muted)] border-b border-[var(--border-default)]">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-tertiary)]">GPT Site · Offerwall</div>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-tertiary)]">Goal</div>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-tertiary)] text-right pr-2">Payout</div>
                </div>

                {rows.map((row, i) => {
                    const isBest = i === 0;
                    const pct    = best.payout_usd > 0 ? (row.payout_usd / best.payout_usd) * 100 : 0;
                    const hasTasks = row.tasks.length > 0;
                    const goalsOpen = !!openGoals[row.id];

                    return (
                        <div key={row.id} className={`border-b border-[var(--border-default)] last:border-0 ${isBest ? "bg-[var(--brand-lime)]/5 border-l-[3px] !border-l-[var(--brand-lime)]" : ""}`}>
                            {/* Main row */}
                            <div className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-4 ${!isBest ? "hover:bg-[var(--surface-muted)] transition-colors" : ""}`}>
                                {/* Site + Provider */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <span className="font-bold text-[var(--brand-ink)] text-sm">{row.site?.name ?? "—"}</span>
                                        <span className="text-[var(--text-tertiary)] text-xs">via</span>
                                        <span className="text-xs font-semibold text-[var(--text-secondary)]">{row.provider?.name ?? "—"}</span>
                                        {isBest && (
                                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[var(--brand-lime)] text-[var(--brand-ink)]">
                                                BEST PAYOUT
                                            </span>
                                        )}
                                    </div>
                                    {/* Payout bar */}
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-1.5 bg-[var(--surface-muted)] rounded-full overflow-hidden max-w-[120px]">
                                            <div
                                                className={`h-full rounded-full ${isBest ? "bg-[var(--brand-lime)]" : "bg-[var(--border-default)]"}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Goal text */}
                                <div className="flex-1 min-w-0 text-xs text-[var(--text-secondary)] italic">
                                    {row.goal_text ?? <span className="text-[var(--text-tertiary)]">—</span>}
                                </div>

                                {/* Payout + CTA */}
                                <div className="flex items-center gap-3 sm:justify-end border-t border-[var(--border-default)] sm:border-0 pt-3 sm:pt-0">
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Payout</div>
                                        <div className={`text-xl font-extrabold leading-tight ${isBest ? "text-[color:hsl(84,93%,25%)]" : "text-[var(--brand-ink)]"}`}>
                                            ${Number(row.payout_usd).toFixed(2)}
                                        </div>
                                    </div>
                                    {row.offer_url ? (
                                        <a
                                            href={row.offer_url}
                                            target="_blank"
                                            rel="noopener noreferrer sponsored"
                                            className={`px-4 py-2 text-sm font-extrabold rounded-xl transition-all hover:-translate-y-px whitespace-nowrap ${
                                                isBest
                                                    ? "bg-[var(--brand-ink)] text-[var(--brand-lime)] shadow-sm"
                                                    : "bg-[var(--surface-muted)] text-[var(--brand-ink)] border border-[var(--border-default)] hover:border-lime-300"
                                            }`}
                                        >
                                            {isBest ? "Start (Best)" : "Start Offer"}
                                        </a>
                                    ) : (
                                        <div className="w-[96px]" />
                                    )}
                                </div>
                            </div>

                            {/* ── Goals toggle ── */}
                            {hasTasks && (
                                <div className="px-4 sm:px-5 pb-3">
                                    <button
                                        onClick={() => toggleGoals(row.id)}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--brand-ink)] transition-colors"
                                    >
                                        <span className={`transition-transform ${goalsOpen ? "rotate-90" : ""}`}>▶</span>
                                        {goalsOpen ? "Hide" : "Show"} Goals ({row.tasks.length})
                                    </button>

                                    {goalsOpen && (
                                        <div className="mt-3 space-y-1.5 pl-2">
                                            {row.tasks.map((task, ti) => (
                                                <div key={task.id} className="flex items-center gap-3 py-2 border-b border-[var(--border-default)] last:border-0">
                                                    <span className="text-[10px] font-bold text-[var(--text-tertiary)] w-4 text-right flex-shrink-0">
                                                        {ti + 1}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-sm font-medium text-[var(--brand-ink)]">{task.title}</span>
                                                            <span className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded ${TYPE_COLORS[task.task_type] ?? "bg-gray-100 text-gray-500"}`}>
                                                                {task.task_type}
                                                            </span>
                                                        </div>
                                                        {task.time_limit_text && (
                                                            <span className="text-xs text-[var(--text-tertiary)]">⏱ {task.time_limit_text}</span>
                                                        )}
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <div className="text-sm font-bold text-[var(--brand-ink)]">
                                                            ${Number(task.reward_amount).toFixed(2)}
                                                        </div>
                                                        {task.reward_display && (
                                                            <div className="text-xs text-[var(--text-tertiary)]">{task.reward_display}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
