"use client";

import GuideEditorForm from "../GuideEditorForm";

type SourceGuide = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    body_md: string | null;
    difficulty: string | null;
    estimated_time: string | null;
    max_payout_usd: number | null;
    tips: string[] | null;
    key_takeaways: string | null;
    checklist_items: string[] | null;
    video_url: string | null;
    layout_style: string | null;
    show_related_offers: boolean | null;
    show_related_guides: boolean | null;
    seo_title: string | null;
    seo_description: string | null;
};

export default function GuideCreateForm({ sourceGuide }: { sourceGuide?: SourceGuide | null }) {
    return <GuideEditorForm mode="create" sourceGuide={sourceGuide ?? null} />;
}
