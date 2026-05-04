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
    keyword_target?: string | null;
    keyword_cluster_id?: string | null;
    keyword_intent?: string | null;
    guide_type?: string | null;
    needs_variation?: boolean | null;
    payout_verified_at?: string | null;
    tasks_verified_at?: string | null;
    provider_terms_verified_at?: string | null;
    last_offer_check_at?: string | null;
};

export default function GuideCreateForm({ sourceGuide }: { sourceGuide?: SourceGuide | null }) {
    return <GuideEditorForm mode="create" sourceGuide={sourceGuide ?? null} />;
}
