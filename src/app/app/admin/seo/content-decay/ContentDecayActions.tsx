"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildContentDecayTaskNotes, type ContentDecayResult } from "@/lib/content-decay";

export default function ContentDecayActions({ row }: { row: ContentDecayResult }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function createRefreshTask() {
        setLoading(true);
        try {
            const response = await fetch("/api/admin/seo/content-decay/create-task", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    guideId: row.guideId,
                    decayLevel: row.decayLevel,
                    editorNotes: buildContentDecayTaskNotes(row),
                }),
            });
            const json = await response.json().catch(() => null);
            if (!response.ok) {
                window.alert(json?.error ?? "Could not create refresh task.");
                return;
            }
            router.push("/app/admin/content-queue");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-wrap gap-2">
            <a href={`/app/admin/guides/${row.guideId}/edit`} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">
                Open editor
            </a>
            <button
                type="button"
                onClick={createRefreshTask}
                disabled={loading}
                className="rounded-lg bg-lime-600 px-2.5 py-1 text-xs font-bold text-white disabled:opacity-60"
            >
                {loading ? "Creating..." : "Create Refresh Task"}
            </button>
        </div>
    );
}
