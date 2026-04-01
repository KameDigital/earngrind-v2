"use client";

import { useState } from "react";

interface ProChecklistProps {
    items: string[];
}

export default function ProChecklist({ items }: ProChecklistProps) {
    const [checked, setChecked] = useState<Set<number>>(new Set());

    function toggle(i: number) {
        setChecked(prev => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    }

    const completedCount = checked.size;
    const totalCount     = items.length;
    const pct            = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const allDone        = completedCount === totalCount && totalCount > 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-gray-900">
                        {allDone ? "✅ Completed!" : "Completion Checklist"}
                    </span>
                    <span className="text-xs font-semibold text-gray-400">
                        {completedCount}/{totalCount}
                    </span>
                </div>
                {completedCount > 0 && !allDone && (
                    <button
                        type="button"
                        onClick={() => setChecked(new Set())}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100">
                <div
                    className={`h-full transition-all duration-500 rounded-r ${allDone ? "bg-lime-400" : "bg-lime-300"}`}
                    style={{ width: `${pct}%` }}
                />
            </div>

            {/* Items */}
            <ul className="divide-y divide-gray-50">
                {items.map((item, i) => {
                    const isChecked = checked.has(i);
                    return (
                        <li key={i}>
                            <button
                                type="button"
                                onClick={() => toggle(i)}
                                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors group"
                            >
                                <span
                                    className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                        isChecked
                                            ? "bg-lime-400 border-lime-400"
                                            : "border-gray-300 group-hover:border-gray-400"
                                    }`}
                                >
                                    {isChecked && (
                                        <svg viewBox="0 0 10 8" fill="none" className="w-3 h-3">
                                            <path d="M1 4l3 3 5-6" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </span>
                                <span className={`text-sm leading-snug transition-colors ${isChecked ? "text-gray-400 line-through" : "text-gray-700"}`}>
                                    {item}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            {allDone && (
                <div className="px-4 py-3 bg-lime-50 border-t border-lime-100 text-xs font-semibold text-lime-700 text-center">
                    🎉 You&apos;re ready to complete this offer!
                </div>
            )}
        </div>
    );
}
