"use client";

import GuideEditorForm from "../../GuideEditorForm";
import type { GameOption } from "../../GameCombobox";

type Guide = {
    id: string;
    title: string;
    slug: string;
    game_id: string;
    excerpt: string | null;
    body_md: string | null;
    difficulty: string | null;
    estimated_time: string | null;
    max_payout_usd: number | null;
    tips: string[] | null;
    key_takeaways: string | null;
    checklist_items: string[] | null;
    video_url: string | null;
    layout_style: string;
    show_related_offers: boolean;
    show_related_guides: boolean;
    seo_title: string | null;
    seo_description: string | null;
    status: string;
};

export default function GuideEditForm({
    guide,
    initialGame,
}: {
    guide: Guide;
    initialGame: GameOption | null;
}) {
    return <GuideEditorForm mode="edit" guide={guide} initialGame={initialGame} />;
}
