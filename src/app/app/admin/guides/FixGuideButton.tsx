"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type GuideFixType =
    | "add_internal_links"
    | "add_cta_section"
    | "add_faq_section"
    | "expand_thin_content"
    | "regenerate_variation"
    | "move_to_queue";

const DEFAULT_LABELS: Record<GuideFixType, string> = {
    add_internal_links: "Add Internal Links",
    add_cta_section: "Add CTA",
    add_faq_section: "Add FAQ",
    expand_thin_content: "Add Expansion Prompts",
    regenerate_variation: "Create Variation Draft",
    move_to_queue: "Move to Queue",
};

export default function FixGuideButton({
    guideId,
    fixType,
    children,
    className,
}: {
    guideId: string;
    fixType: GuideFixType;
    children?: React.ReactNode;
    className?: string;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function runFix() {
        if (loading) return;
        if (fixType === "regenerate_variation" && !window.confirm("Create a new draft variation? The original guide will stay unchanged.")) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/admin/guides/${guideId}/fix`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fixType }),
            });
            const result = await response.json().catch(() => null);
            if (!response.ok) {
                window.alert(result?.error ?? "Fix failed.");
                return;
            }
            if (result?.draftId) {
                router.push(`/app/admin/guides/${result.draftId}/edit`);
                return;
            }
            router.refresh();
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            type="button"
            onClick={runFix}
            disabled={loading}
            className={className ?? "rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-bold text-gray-700 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-60"}
        >
            {loading ? "Working..." : children ?? DEFAULT_LABELS[fixType]}
        </button>
    );
}
