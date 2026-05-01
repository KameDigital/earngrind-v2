"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    buildSerpRefreshTaskNotes,
    type SerpRefreshCandidate,
} from "@/lib/serp-refresh-candidates";
import { suggestedHeadingFromQuery } from "@/lib/search-console-opportunities";

export default function SerpRefreshActions({ candidate }: { candidate: SerpRefreshCandidate }) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const primaryQuery = candidate.topQueries[0]?.query ?? candidate.currentKeyword ?? candidate.title;

    async function addQuerySection() {
        setLoading("section");
        try {
            const response = await fetch(`/api/admin/guides/${candidate.guideId}/add-query-section`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: primaryQuery,
                    suggestedHeading: candidate.refreshPlan.suggestedH2ToAdd || suggestedHeadingFromQuery(primaryQuery),
                }),
            });
            const json = await response.json().catch(() => null);
            if (!response.ok) {
                window.alert(json?.error ?? "Could not add query section.");
                return;
            }
            router.push(`/app/admin/guides/${candidate.guideId}/edit`);
        } finally {
            setLoading(null);
        }
    }

    async function createSupportingGuide() {
        setLoading("supporting");
        try {
            const response = await fetch("/api/admin/seo/query-opportunities/create-guide", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: primaryQuery,
                    pageUrl: candidate.pageUrl ?? `/guides/${candidate.slug}`,
                    guideId: candidate.guideId,
                    opportunityType: "supporting_cluster",
                    impressions: candidate.topQueries[0]?.impressions ?? candidate.impressions,
                    clicks: candidate.topQueries[0]?.clicks ?? candidate.clicks,
                    position: candidate.topQueries[0]?.position ?? candidate.averagePosition,
                }),
            });
            const json = await response.json().catch(() => null);
            if (!response.ok) {
                window.alert(json?.error ?? "Could not create supporting guide.");
                return;
            }
            router.push(`/app/admin/guides/${json.id}/edit`);
        } finally {
            setLoading(null);
        }
    }

    async function moveToQueue() {
        setLoading("queue");
        try {
            const response = await fetch("/api/admin/content-queue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "mark_needs_edit", ids: [candidate.guideId] }),
            });
            const json = await response.json().catch(() => null);
            if (!response.ok) {
                window.alert(json?.error ?? "Could not move guide to content queue.");
                return;
            }
            router.push("/app/admin/content-queue");
        } finally {
            setLoading(null);
        }
    }

    async function createRefreshTask() {
        setLoading("task");
        try {
            const response = await fetch("/api/admin/seo/serp-refresh/create-task", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    guideId: candidate.guideId,
                    editorNotes: buildSerpRefreshTaskNotes(candidate),
                }),
            });
            const json = await response.json().catch(() => null);
            if (!response.ok) {
                window.alert(json?.error ?? "Could not create refresh task.");
                return;
            }
            router.push("/app/admin/content-queue");
        } finally {
            setLoading(null);
        }
    }

    return (
        <div className="flex flex-wrap gap-2">
            <a
                href={`/app/admin/guides/${candidate.guideId}/edit`}
                className="rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-bold text-white"
            >
                Open editor
            </a>
            <a
                href={`/app/admin/guides/${candidate.guideId}/edit#seo-preview-testing`}
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700"
            >
                Improve metadata
            </a>
            <button
                type="button"
                onClick={addQuerySection}
                disabled={loading !== null}
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700 disabled:opacity-60"
            >
                {loading === "section" ? "Adding..." : "Add query section"}
            </button>
            <button
                type="button"
                onClick={moveToQueue}
                disabled={loading !== null}
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700 disabled:opacity-60"
            >
                {loading === "queue" ? "Moving..." : "Move to content queue"}
            </button>
            <button
                type="button"
                onClick={createSupportingGuide}
                disabled={loading !== null}
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700 disabled:opacity-60"
            >
                {loading === "supporting" ? "Creating..." : "Create supporting guide"}
            </button>
            <button
                type="button"
                onClick={createRefreshTask}
                disabled={loading !== null}
                className="rounded-lg bg-lime-600 px-2.5 py-1 text-xs font-bold text-white disabled:opacity-60"
            >
                {loading === "task" ? "Creating..." : "Create Refresh Task"}
            </button>
        </div>
    );
}
