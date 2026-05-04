export type GptAffiliatePlatform = {
    id: string;
    name: string;
    slug: string;
    bestFor: string;
    rewardNote: string;
    trustNote: string;
    cta: string;
    priority: "primary" | "secondary";
    disclosure?: string;
};

export const GPT_AFFILIATE_PLATFORMS: GptAffiliatePlatform[] = [
    {
        id: "71000000-0000-4000-8000-000000000001",
        name: "KashKick",
        slug: "kashkick",
        bestFor: "Best beginner cash path",
        rewardNote: "Cash-first rewards for eligible U.S. users.",
        trustNote: "Check country, age, and payout-account fit before starting.",
        cta: "Start KashKick",
        priority: "primary",
    },
    {
        id: "71000000-0000-4000-8000-000000000002",
        name: "Swagbucks",
        slug: "swagbucks",
        bestFor: "Best mainstream rewards site",
        rewardNote: "Broad reward ecosystem with PayPal and gift-card style redemptions.",
        trustNote: "Good for steady rewards, but compare time-to-payout before each offer.",
        cta: "Start Swagbucks",
        priority: "primary",
    },
    {
        id: "71000000-0000-4000-8000-000000000003",
        name: "InboxDollars",
        slug: "inboxdollars",
        bestFor: "Best cash-style backup",
        rewardNote: "Dollar-based reward tracking with PayPal, Visa, and gift-card options.",
        trustNote: "Read trial and processing terms before completing cash offers.",
        cta: "Start InboxDollars",
        priority: "primary",
    },
    {
        id: "71000000-0000-4000-8000-000000000004",
        name: "MyPoints",
        slug: "mypoints",
        bestFor: "Best shopping rewards backup",
        rewardNote: "Useful for shopping, surveys, email, videos, points, and gift cards.",
        trustNote: "Better for routine rewards than high-upside game routes.",
        cta: "Start MyPoints",
        priority: "secondary",
    },
    {
        id: "71000000-0000-4000-8000-000000000005",
        name: "PrizeRebel",
        slug: "prizerebel",
        bestFor: "Best survey backup",
        rewardNote: "Survey-heavy GPT option with PayPal, Bitcoin, and gift-card style rewards.",
        trustNote: "Survey disqualifications are normal, so protect your time.",
        cta: "Start PrizeRebel",
        priority: "secondary",
    },
    {
        id: "71000000-0000-4000-8000-000000000006",
        name: "Scrambly",
        slug: "scrambly",
        bestFor: "Best newer game/app option",
        rewardNote: "Game and app discovery with reward options that can vary by account.",
        trustNote: "Use code 3P5OXUA and verify current app/cashout terms before committing.",
        cta: "Open Scrambly",
        priority: "secondary",
        disclosure: "Referral code: 3P5OXUA",
    },
    {
        id: "71000000-0000-4000-8000-000000000007",
        name: "Gain.gg",
        slug: "gain-gg",
        bestFor: "High-payout offerwall backup",
        rewardNote: "Useful when you want another offerwall route to compare against GPT sites.",
        trustNote: "Compare live provider terms and track each milestone.",
        cta: "Open Gain.gg",
        priority: "secondary",
    },
    {
        id: "71000000-0000-4000-8000-000000000008",
        name: "GemLoot",
        slug: "gemsloot",
        bestFor: "Gaming offerwall backup",
        rewardNote: "Useful for checking alternate game payout routes.",
        trustNote: "Verify payout freshness, country fit, and milestone wording.",
        cta: "Open GemLoot",
        priority: "secondary",
    },
];

export function buildTrackedPlatformHref(platform: GptAffiliatePlatform, clickLocation: string) {
    const params = new URLSearchParams({
        click_location: clickLocation,
        source_context: "best_gpt_sites_monetization",
        platform_name: platform.name,
    });
    return `/go/platform/${platform.slug}?${params.toString()}`;
}
