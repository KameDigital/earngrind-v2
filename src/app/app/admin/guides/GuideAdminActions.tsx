"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GuideAdminActions({ guideId, status = "draft" }: { guideId: string; status?: string }) {
    const router = useRouter();
    const [duplicating, setDuplicating] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleDuplicate() {
        setDuplicating(true);
        setError(null);
        const res = await fetch(`/api/admin/guides/${guideId}/duplicate`, { method: "POST" });
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            setError(json.error ?? "Duplicate failed.");
            setDuplicating(false);
            return;
        }
        const json = await res.json();
        router.push(`/app/admin/guides/${json.id}/edit`);
        router.refresh();
    }

    async function updateStatus(nextStatus: "draft" | "needs_review" | "published") {
        setUpdating(nextStatus);
        setError(null);
        const res = await fetch(`/api/admin/guides/${guideId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: nextStatus }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            const blockers = Array.isArray(json.quality?.requiredErrors) ? ` ${json.quality.requiredErrors.join(" ")}` : "";
            setError(`${json.error ?? "Status update failed."}${blockers}`);
            setUpdating(null);
            return;
        }
        setUpdating(null);
        router.refresh();
    }

    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
                href={`/app/admin/guides/new?sourceGuideId=${guideId}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-700 text-xs font-semibold rounded-lg transition-all"
            >
                Create Similar
            </Link>
            <button
                type="button"
                onClick={handleDuplicate}
                disabled={duplicating}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-700 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
            >
                {duplicating ? "Duplicating..." : "Duplicate"}
            </button>
            {status !== "needs_review" ? (
                <button type="button" onClick={() => updateStatus("needs_review")} disabled={updating !== null} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold rounded-lg transition-all disabled:opacity-50">
                    {updating === "needs_review" ? "Updating..." : "Needs Review"}
                </button>
            ) : null}
            {status === "published" ? (
                <button type="button" onClick={() => updateStatus("draft")} disabled={updating !== null} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-all disabled:opacity-50">
                    {updating === "draft" ? "Updating..." : "Unpublish"}
                </button>
            ) : (
                <button type="button" onClick={() => updateStatus("published")} disabled={updating !== null} className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 hover:bg-green-200 text-green-800 text-xs font-semibold rounded-lg transition-all disabled:opacity-50">
                    {updating === "published" ? "Checking..." : "Publish"}
                </button>
            )}
            {error ? <div className="w-full text-[11px] text-red-600">{error}</div> : null}
        </div>
    );
}
