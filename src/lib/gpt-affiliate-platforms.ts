export type PlatformSpecs = {
    instantPayments: string;
    timeToPay: string;
    minWithdrawal: string;
    minAge: string;
    kycRequired: string;
    signupBonus: string;
    referralProgram: string;
    worldwide: string;
    releaseWithProof: string;
};

export type GptAffiliatePlatform = {
    id: string;
    name: string;
    slug: string;
    bestFor: string;
    rewardNote: string;
    trustNote: string;
    cta: string;
    priority: "primary" | "secondary";
    payoutMethods?: string[];
    trustScore?: number;
    disclosure?: string;
    specs: PlatformSpecs;
};

export const GPT_AFFILIATE_PLATFORMS: GptAffiliatePlatform[] = [
    {
        id: "71000000-0000-4000-8000-000000000009",
        name: "EarnLab",
        slug: "earnlab",
        bestFor: "Best gamified GPT experience",
        rewardNote: "Offerwalls, surveys, races, boxes, Mines, Keno, and reward-store style cashouts.",
        trustNote: "Verify game rules, wager risk, and withdrawal methods before using original games.",
        cta: "Join EarnLab",
        priority: "primary",
        payoutMethods: ["Crypto", "PayPal", "Gift cards"],
        trustScore: 4.3,
        specs: {
            instantPayments: "Yes (Crypto in mins)",
            timeToPay: "Instant – 24h",
            minWithdrawal: "$0.50 Crypto · $5.00 PayPal",
            minAge: "13+ (18+ for arcade)",
            kycRequired: "Optional (on fraud flag)",
            signupBonus: "Daily Cases + Coins",
            referralProgram: "5% – 10% Tiered",
            worldwide: "Worldwide (180+ countries)",
            releaseWithProof: "7 – 30d holds on big offers",
        },
    },
    {
        id: "71000000-0000-4000-8000-000000000008",
        name: "Gemsloot",
        slug: "gemsloot",
        bestFor: "Gaming offerwall backup",
        rewardNote: "Useful for checking alternate game payout routes.",
        trustNote: "Verify payout freshness, country fit, and milestone wording.",
        cta: "Join Gemsloot",
        priority: "primary",
        payoutMethods: ["Crypto", "Gift cards"],
        trustScore: 3.8,
        specs: {
            instantPayments: "Yes (5 – 15 mins)",
            timeToPay: "Instant – 24h",
            minWithdrawal: "$0.50 Crypto · $1.00 Gift",
            minAge: "13+ (with parent)",
            kycRequired: "None (routine crypto)",
            signupBonus: "Welcome Box + 100 Gems",
            referralProgram: "5% – 10% Tiered",
            worldwide: "Worldwide",
            releaseWithProof: "Standard offerwall holds",
        },
    },
    {
        id: "71000000-0000-4000-8000-000000000007",
        name: "Gain.gg",
        slug: "gain-gg",
        bestFor: "High-payout offerwall backup",
        rewardNote: "Useful when you want another offerwall route to compare against GPT sites.",
        trustNote: "Compare live provider terms and track each milestone.",
        cta: "Join Gain.gg",
        priority: "primary",
        payoutMethods: ["Crypto", "Gift cards"],
        trustScore: 3.8,
        specs: {
            instantPayments: "Yes (Automated Crypto)",
            timeToPay: "Instant – 24h",
            minWithdrawal: "$0.50 Crypto · $5.00 PayPal",
            minAge: "13+",
            kycRequired: "None (standard crypto)",
            signupBonus: "Lucky Spin + 100 Coins",
            referralProgram: "5% Lifetime",
            worldwide: "Worldwide",
            releaseWithProof: "7 – 30d provider holds",
        },
    },
    {
        id: "71000000-0000-4000-8000-000000000001",
        name: "KashKick",
        slug: "kashkick",
        bestFor: "Best beginner cash path",
        rewardNote: "Cash-first rewards for eligible U.S. users.",
        trustNote: "Check country, age, and payout-account fit before starting.",
        cta: "Join KashKick",
        priority: "primary",
        payoutMethods: ["PayPal", "Venmo", "Gift cards"],
        trustScore: 4.1,
        specs: {
            instantPayments: "No (1 – 3 business days)",
            timeToPay: "1 – 3 days",
            minWithdrawal: "$10.00",
            minAge: "18+",
            kycRequired: "Required (U.S. ID match)",
            signupBonus: "$1.00 Profile Bonus",
            referralProgram: "25% Lifetime",
            worldwide: "United States only",
            releaseWithProof: "14 – 31d game holds",
        },
    },
    {
        id: "71000000-0000-4000-8000-000000000002",
        name: "Swagbucks",
        slug: "swagbucks",
        bestFor: "Best mainstream rewards site",
        rewardNote: "Broad reward ecosystem with PayPal and gift-card style redemptions.",
        trustNote: "Good for steady rewards, but compare time-to-payout before each offer.",
        cta: "Join Swagbucks",
        priority: "primary",
        payoutMethods: ["PayPal", "Gift cards"],
        trustScore: 4.3,
        specs: {
            instantPayments: "No (1 – 3 business days)",
            timeToPay: "1 – 3 days",
            minWithdrawal: "$3.00 Gift · $5.00 PayPal",
            minAge: "13+",
            kycRequired: "Phone & ID on cashout",
            signupBonus: "$5.00 – $10.00 Bonus",
            referralProgram: "10% + 300 SB Bonus",
            worldwide: "US, UK, CA, AU, DE, FR, ES",
            releaseWithProof: "7 – 32d pending holds",
        },
    },
    {
        id: "71000000-0000-4000-8000-000000000003",
        name: "InboxDollars",
        slug: "inboxdollars",
        bestFor: "Best cash-style backup",
        rewardNote: "Dollar-based reward tracking with PayPal, Visa, and gift-card options.",
        trustNote: "Read trial and processing terms before completing cash offers.",
        cta: "Join InboxDollars",
        priority: "primary",
        payoutMethods: ["PayPal", "Visa", "Gift cards"],
        trustScore: 4.0,
        specs: {
            instantPayments: "No (1 – 3 business days)",
            timeToPay: "1 – 3 days",
            minWithdrawal: "$15 1st · $10 after",
            minAge: "18+",
            kycRequired: "Required (ID & Phone)",
            signupBonus: "$5.00 Welcome Bonus",
            referralProgram: "$1.00 + 30% Earnings",
            worldwide: "United States only",
            releaseWithProof: "7 – 30d pending holds",
        },
    },
    {
        id: "71000000-0000-4000-8000-000000000004",
        name: "MyPoints",
        slug: "mypoints",
        bestFor: "Best shopping rewards backup",
        rewardNote: "Useful for shopping, surveys, email, videos, points, and gift cards.",
        trustNote: "Better for routine rewards than high-upside game routes.",
        cta: "Join MyPoints",
        priority: "secondary",
        payoutMethods: ["PayPal", "Gift cards", "Travel miles"],
        trustScore: 3.9,
        specs: {
            instantPayments: "No (1 – 3 business days)",
            timeToPay: "1 – 3 days",
            minWithdrawal: "$3.00 Gift · $10 PayPal",
            minAge: "13+",
            kycRequired: "Phone & ID check",
            signupBonus: "$5.00 – $10.00 Bonus",
            referralProgram: "10% + 25 Points",
            worldwide: "United States & Canada",
            releaseWithProof: "7 – 30d pending holds",
        },
    },
    {
        id: "71000000-0000-4000-8000-000000000005",
        name: "PrizeRebel",
        slug: "prizerebel",
        bestFor: "Best survey backup",
        rewardNote: "Survey-heavy GPT option with PayPal, Bitcoin, and gift-card style rewards.",
        trustNote: "Survey disqualifications are normal, so protect your time.",
        cta: "Join PrizeRebel",
        priority: "secondary",
        payoutMethods: ["PayPal", "Bitcoin", "Gift cards"],
        trustScore: 3.9,
        specs: {
            instantPayments: "Yes (Gold+ in mins)",
            timeToPay: "Instant – 24h",
            minWithdrawal: "$2.00 Gift · $5.00 PayPal",
            minAge: "13+",
            kycRequired: "Low (Phone on 1st cashout)",
            signupBonus: "Promo codes & Points",
            referralProgram: "15% – 30% Tiered",
            worldwide: "Worldwide",
            releaseWithProof: "7 – 30d offerwall holds",
        },
    },
    {
        id: "71000000-0000-4000-8000-000000000006",
        name: "Scrambly",
        slug: "scrambly",
        bestFor: "Best newer game/app option",
        rewardNote: "Game and app discovery with reward options that can vary by account.",
        trustNote: "Use code 3P5OXUA and verify current app/cashout terms before committing.",
        cta: "Join Scrambly",
        priority: "secondary",
        disclosure: "Referral code: 3P5OXUA",
        payoutMethods: ["PayPal", "Visa", "Gift cards"],
        trustScore: 3.7,
        specs: {
            instantPayments: "Yes (< 10 mins)",
            timeToPay: "Instant (< 24h)",
            minWithdrawal: "$1.00",
            minAge: "18+",
            kycRequired: "Selfie / ID on 1st cashout",
            signupBonus: "500 – 600 Bonus Coins",
            referralProgram: "$3 – $5 + 10% Lifetime",
            worldwide: "US, UK, CA",
            releaseWithProof: "Instant to 24h holds",
        },
    },
];

export function buildTrackedPlatformHref(platform: GptAffiliatePlatform, clickLocation: string, sourceContext = "best_gpt_sites_monetization") {
    const params = new URLSearchParams({
        click_location: clickLocation,
        source_context: sourceContext,
        platform_name: platform.name,
    });
    return `/go/platform/${platform.slug}?${params.toString()}`;
}
