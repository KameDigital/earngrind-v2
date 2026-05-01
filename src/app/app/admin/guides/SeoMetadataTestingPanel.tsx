"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SerpPreview from "./SerpPreview";
import {
    analyzeSeoDescription,
    analyzeSeoTitle,
    generateSeoDescriptionVariants,
    generateSeoTitleVariants,
} from "@/lib/seo-metadata-tools";

function ScoreBadge({ score }: { score: number }) {
    const className = score >= 85
        ? "bg-green-100 text-green-800"
        : score >= 65
            ? "bg-amber-100 text-amber-800"
            : "bg-red-50 text-red-700";
    return <span className={`rounded-full px-2 py-1 text-xs font-extrabold ${className}`}>{score}/100</span>;
}

function VariantButton({
    children,
    onApply,
}: {
    children: React.ReactNode;
    onApply: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onApply}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-bold text-gray-700 hover:border-gray-300"
        >
            Apply Variant
        </button>
    );
}

export default function SeoMetadataTestingPanel({
    guideId,
    guideTitle,
    slug,
    seoTitle,
    seoDescription,
    keywordTarget,
    maxPayoutUsd,
    duplicateTitles,
}: {
    guideId: string;
    guideTitle: string;
    slug: string;
    seoTitle: string | null;
    seoDescription: string | null;
    keywordTarget: string | null;
    maxPayoutUsd: number | null;
    duplicateTitles: string[];
}) {
    const router = useRouter();
    const [title, setTitle] = useState(seoTitle ?? guideTitle);
    const [description, setDescription] = useState(seoDescription ?? "");
    const [saving, setSaving] = useState(false);
    const url = `https://earngrind.com/guides/${slug}`;

    const titleAnalysis = useMemo(() => analyzeSeoTitle(title, keywordTarget, duplicateTitles), [title, keywordTarget, duplicateTitles]);
    const descriptionAnalysis = useMemo(() => analyzeSeoDescription(description, keywordTarget), [description, keywordTarget]);
    const titleVariants = useMemo(() => generateSeoTitleVariants({
        guideTitle,
        keywordTarget,
        currentTitle: title,
        maxPayoutUsd,
    }), [guideTitle, keywordTarget, title, maxPayoutUsd]);
    const descriptionVariants = useMemo(() => generateSeoDescriptionVariants({
        guideTitle,
        keywordTarget,
        currentDescription: description,
        maxPayoutUsd,
    }), [guideTitle, keywordTarget, description, maxPayoutUsd]);

    async function save(nextTitle = title, nextDescription = description) {
        setSaving(true);
        try {
            const response = await fetch(`/api/admin/guides/${guideId}/seo-metadata`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ seoTitle: nextTitle, seoDescription: nextDescription }),
            });
            const result = await response.json().catch(() => null);
            if (!response.ok) {
                window.alert(result?.error ?? "Could not save SEO metadata.");
                return;
            }
            router.refresh();
        } finally {
            setSaving(false);
        }
    }

    return (
        <div id="seo-preview-testing" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">SEO Preview & Testing</p>
                    <h2 className="mt-1 text-lg font-extrabold text-gray-900">Title and Meta Description Testing</h2>
                    <p className="mt-1 text-sm text-gray-500">Preview search appearance, score metadata, and apply safer CTR-focused variants.</p>
                </div>
                <button
                    type="button"
                    onClick={() => save()}
                    disabled={saving}
                    className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {saving ? "Saving..." : "Save Metadata"}
                </button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
                <div className="space-y-4">
                    <SerpPreview title={title} url={url} description={description} />
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                            <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">SEO Title</span>
                            <textarea value={title} onChange={(event) => setTitle(event.target.value)} rows={2} className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-400">SEO Description</span>
                            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Title Score</div>
                                <ScoreBadge score={titleAnalysis.score} />
                            </div>
                            <div className="mt-2 text-xs text-gray-500">{titleAnalysis.length} characters</div>
                            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-gray-600">
                                {titleAnalysis.warnings.length > 0 ? titleAnalysis.warnings.map((warning) => <li key={warning}>{warning}</li>) : <li>No major title warnings.</li>}
                            </ul>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Description Score</div>
                                <ScoreBadge score={descriptionAnalysis.score} />
                            </div>
                            <div className="mt-2 text-xs text-gray-500">{descriptionAnalysis.length} characters</div>
                            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-gray-600">
                                {descriptionAnalysis.warnings.length > 0 ? descriptionAnalysis.warnings.map((warning) => <li key={warning}>{warning}</li>) : <li>No major description warnings.</li>}
                            </ul>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200">
                        <div className="border-b border-gray-100 px-3 py-2 text-xs font-bold uppercase tracking-widest text-gray-400">Title Variants</div>
                        <div className="divide-y divide-gray-100">
                            {titleVariants.map((variant) => (
                                <div key={variant} className="flex items-start justify-between gap-3 px-3 py-2">
                                    <p className="text-sm font-semibold text-gray-800">{variant}</p>
                                    <VariantButton onApply={() => {
                                        setTitle(variant);
                                        void save(variant, description);
                                    }}>Apply</VariantButton>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200">
                        <div className="border-b border-gray-100 px-3 py-2 text-xs font-bold uppercase tracking-widest text-gray-400">Description Variants</div>
                        <div className="divide-y divide-gray-100">
                            {descriptionVariants.map((variant) => (
                                <div key={variant} className="flex items-start justify-between gap-3 px-3 py-2">
                                    <p className="text-sm text-gray-700">{variant}</p>
                                    <VariantButton onApply={() => {
                                        setDescription(variant);
                                        void save(title, variant);
                                    }}>Apply</VariantButton>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
