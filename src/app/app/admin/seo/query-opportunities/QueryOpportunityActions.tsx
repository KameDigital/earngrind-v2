"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { suggestedHeadingFromQuery, type QueryOpportunityType } from "@/lib/search-console-opportunities";

export default function QueryOpportunityActions({
    query,
    pageUrl,
    guideId,
    opportunityType,
    impressions,
    clicks,
    position,
}: {
    query: string;
    pageUrl: string;
    guideId: string | null;
    opportunityType: QueryOpportunityType;
    impressions: number;
    clicks: number;
    position: number;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    async function createGuideDraft() {
        setLoading("create");
        try {
            const response = await fetch("/api/admin/seo/query-opportunities/create-guide", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, pageUrl, guideId, opportunityType, impressions, clicks, position }),
            });
            const json = await response.json().catch(() => null);
            if (!response.ok) {
                window.alert(json?.error ?? "Could not create guide draft.");
                return;
            }
            router.push(`/app/admin/guides/${json.id}/edit`);
        } finally {
            setLoading(null);
        }
    }

    async function addSection() {
        if (!guideId) return;
        setLoading("section");
        try {
            const response = await fetch(`/api/admin/guides/${guideId}/add-query-section`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, suggestedHeading: suggestedHeadingFromQuery(query) }),
            });
            const json = await response.json().catch(() => null);
            if (!response.ok) {
                window.alert(json?.error ?? "Could not add section.");
                return;
            }
            router.push(`/app/admin/guides/${guideId}/edit`);
        } finally {
            setLoading(null);
        }
    }

    return (
        <div className="flex flex-wrap gap-2">
            <button
                type="button"
                onClick={createGuideDraft}
                disabled={loading !== null}
                className="rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-bold text-white disabled:opacity-60"
            >
                {loading === "create" ? "Creating..." : "Create guide draft"}
            </button>
            {guideId ? (
                <button
                    type="button"
                    onClick={addSection}
                    disabled={loading !== null}
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700 disabled:opacity-60"
                >
                    {loading === "section" ? "Adding..." : "Add section"}
                </button>
            ) : null}
            {guideId ? (
                <a href={`/app/admin/guides/${guideId}/edit#seo-preview-testing`} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">
                    Open SEO testing
                </a>
            ) : null}
            <a href="/app/admin/content-queue" className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">
                Content queue
            </a>
        </div>
    );
}
