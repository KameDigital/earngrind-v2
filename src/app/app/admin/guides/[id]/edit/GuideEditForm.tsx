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
    primary_offer_id?: string | null;
    disable_auto_offer_matching?: boolean | null;
    seo_title: string | null;
    seo_description: string | null;
    status: string;
};

type GuideOfferOption = {
    id: string;
    title: string;
    platform: string | null;
    provider: string | null;
    payout: number | null;
    matchReason?: string;
    score?: number;
};

export default function GuideEditForm({
    guide,
    initialGame,
    availableOffers,
    matchedOffers,
}: {
    guide: Guide;
    initialGame: GameOption | null;
    availableOffers?: GuideOfferOption[];
    matchedOffers?: GuideOfferOption[];
}) {
    return (
        <GuideEditorForm
            mode="edit"
            guide={guide}
            initialGame={initialGame}
            availableOffers={availableOffers}
            matchedOffers={matchedOffers}
        />
    );
}
