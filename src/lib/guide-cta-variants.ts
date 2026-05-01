export type GuideCtaPlacement = "top" | "mid" | "bottom" | "fallback";

export type GuideCtaVariant = {
    id: string;
    label: string;
    buttonText: string;
    subtext: string;
};

export const GUIDE_CTA_VARIANTS: GuideCtaVariant[] = [
    {
        id: "highest_payout",
        label: "Highest payout",
        buttonText: "Start Highest Paying Offer",
        subtext: "Prioritizes the strongest payout match available for this guide.",
    },
    {
        id: "compare_payouts",
        label: "Compare payouts",
        buttonText: "Compare Payouts",
        subtext: "Check the current payout before choosing where to start.",
    },
    {
        id: "start_offer",
        label: "Start offer",
        buttonText: "Start This Offer",
        subtext: "Open the matched offer route and confirm requirements before starting.",
    },
    {
        id: "paid_to_play",
        label: "Paid to play",
        buttonText: "Get Paid to Play",
        subtext: "Use the matched route to start earning from this guide.",
    },
    {
        id: "best_route",
        label: "Best route",
        buttonText: "View Best Route",
        subtext: "See the best available route selected from current offer data.",
    },
];

function stableHash(value: string) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
    }
    return Math.abs(hash);
}

export function selectGuideCtaVariant({
    guideId,
    slug,
    placement,
}: {
    guideId?: string;
    slug: string;
    placement: GuideCtaPlacement;
}) {
    const seed = `${guideId ?? slug}:${slug}:${placement}`;
    return GUIDE_CTA_VARIANTS[stableHash(seed) % GUIDE_CTA_VARIANTS.length];
}
