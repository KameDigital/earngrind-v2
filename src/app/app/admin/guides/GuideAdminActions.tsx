"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GuideAdminActions({ guideId }: { guideId: string }) {
    const router = useRouter();
    const [duplicating, setDuplicating] = useState(false);
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
            {error ? <div className="w-full text-[11px] text-red-600">{error}</div> : null}
        </div>
    );
}
