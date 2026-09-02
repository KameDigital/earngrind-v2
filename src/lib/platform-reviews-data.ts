export interface PlatformOfferwall {
    name: string;
    logoUrl: string;
    category?: "Gaming" | "Surveys" | "Multi-Task" | "High Yield" | "Direct Partner";
    description?: string;
}

export interface PlatformReview {
    // Identity
    slug: string;
    name: string;
    logoUrl: string;
    tagline: string;
    category: "Mainstream" | "Partner";
    rating: number;
    updatedAt: string;

    // Key stats bar
    stats: {
        minCashout: string;
        payoutSpeed: string;
        kycRequired: "Yes" | "No" | "Sometimes";
        countryCount?: number;
    };

    // Overview
    overview: string;

    // Earning methods & Offerwalls
    earningMethods: string[];
    offerwalls?: PlatformOfferwall[];

    // Payout details
    payoutMethods: string[];
    holdPeriodNote: string;
    kycNote: string;

    // Bonus & referral
    bonus: {
        signupBonus?: string;
        referralRate?: string;
        promoCode?: string;
    };

    // Countries (ISO 2-letter codes)
    countries: string[];

    // Pros & cons
    pros: string[];
    cons: string[];

    // Signup steps
    signupSteps: {
        title: string;
        description: string;
    }[];

    // FAQ — platform-specific only
    faq: {
        question: string;
        answer: string;
    }[];

    // Affiliate link override
    affiliateLink?: string;

    // SEO
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
    };
}

export const SHARED_REVIEW_FAQS = [
    {
        question: "How does EarnGrind verify GPT platform payouts?",
        answer: "EarnGrind continuously tracks live offer payout rates, cashout minimums, user withdrawal reports, and proof requirements to ensure verified and accurate information across all reward platforms.",
    },
    {
        question: "Can I use multiple GPT sites at the same time?",
        answer: "Yes, you can register on multiple reward sites to compare game payouts. However, most offerwall game offers require you to be a first-time player on your device, so you should only install a specific game once on your chosen platform.",
    },
    {
        question: "What should I do if an offer milestone does not track?",
        answer: "Always take screenshots of your account ID, offer requirements, and in-game milestone achievement with timestamp. You can submit these directly to the platform or provider support ticket for manual credit.",
    },
];

export const PLATFORM_REVIEWS: Record<string, PlatformReview> = {
    earnlab: {
        slug: "earnlab",
        name: "EarnLab",
        logoUrl: "https://www.google.com/s2/favicons?domain=earnlab.com&sz=128",
        tagline: "Best gamified GPT experience",
        category: "Partner",
        rating: 4.3,
        updatedAt: "2026-08-15",
        stats: {
            minCashout: "$0.50 Crypto · $5.00 PayPal",
            payoutSpeed: "Instant – 24h",
            kycRequired: "Sometimes",
            countryCount: 40,
        },
        overview:
            "EarnLab is a gamified GPT platform combining offerwalls, surveys, races, cases, and arcade mini-games like Mines and Keno with reward-store style cashouts. It is built for active offer grinders looking for high-paying mobile game milestones and fast crypto withdrawals.",
        earningMethods: ["Offerwalls", "Surveys", "Races", "Boxes", "Mines", "Keno", "Reward store"],
        offerwalls: [
            {
                name: "Torox",
                logoUrl: "/images/offerwalls/torox-light.svg",
                category: "Gaming",
                description: "Leading mobile & desktop gaming network featuring tiered high-yield milestone rewards up to $500+.",
            },
            {
                name: "RevU",
                logoUrl: "/images/offerwalls/revu-light.svg",
                category: "High Yield",
                description: "Premium advertiser wall with high-payout gaming trials, banking apps, and 2x/3x multiplier events.",
            },
            {
                name: "Aye-T Studios",
                logoUrl: "/images/offerwalls/ayet-light.png",
                category: "Gaming",
                description: "Mobile gaming specialist offering progressive level achievements with verified milestone tracking.",
            },
            {
                name: "AdGate Media",
                logoUrl: "/images/offerwalls/adgatemedia-light.svg",
                category: "Multi-Task",
                description: "Established multi-task offerwall featuring app installs, surveys, free trials, and fast-clearing tasks.",
            },
            {
                name: "AdGem",
                logoUrl: "/images/offerwalls/adgem-light.png",
                category: "Gaming",
                description: "Mobile-focused gaming wall featuring exclusive Android and iOS game installation campaigns.",
            },
            {
                name: "MyChips",
                logoUrl: "/images/offerwalls/mychips-light.svg",
                category: "Gaming",
                description: "Fast-growing gaming offerwall with competitive per-task payout rates and instant milestone verification.",
            },
            {
                name: "Tyr Rewards",
                logoUrl: "/images/offerwalls/tyr-light.svg",
                category: "Gaming",
                description: "Specialized mobile gaming network offering playtime rewards and tiered stage progression payouts.",
            },
            {
                name: "Monlix",
                logoUrl: "/images/offerwalls/monlix-light.svg",
                category: "Multi-Task",
                description: "Dynamic micro-task and survey wall with fast credit confirmations and global offer coverage.",
            },
            {
                name: "Lootably",
                logoUrl: "/images/offerwalls/lootably.png",
                category: "Multi-Task",
                description: "Multi-format reward provider offering quiz tasks, video streams, and desktop software downloads.",
            },
            {
                name: "PrimeEarn",
                logoUrl: "/images/offerwalls/primeearn-dark.svg",
                category: "Direct Partner",
                description: "Direct partner offerwall integration delivering exclusive high-yield campaigns directly on EarnLab.",
            },
            {
                name: "Besitos",
                logoUrl: "/images/offerwalls/besitos-light.svg",
                category: "Gaming",
                description: "Interactive gaming network with curated mobile game quests and multi-step achievement payouts.",
            },
            {
                name: "MM Wall",
                logoUrl: "/images/offerwalls/mm-wall.png",
                category: "Multi-Task",
                description: "Versatile rewards wall featuring mobile app exploration and multi-reward gaming campaigns.",
            },
            {
                name: "HangMyAds",
                logoUrl: "/images/offerwalls/hangmyads.png",
                category: "Gaming",
                description: "Global mobile performance network connecting directly to premium top-tier gaming advertisers.",
            },
            {
                name: "Adscend Media",
                logoUrl: "/images/offerwalls/adscendmedia-light.svg",
                category: "Multi-Task",
                description: "Veteran rewards network offering market research surveys, app downloads, and media engagement.",
            },
            {
                name: "AdToWall",
                logoUrl: "/images/offerwalls/adtowall-light.svg",
                category: "Gaming",
                description: "Modern offerwall expanding rapidly across casual and mid-core mobile gaming campaigns.",
            },
        ],
        payoutMethods: ["Crypto", "PayPal", "Gift cards"],
        holdPeriodNote:
            "Most game offers route through providers like Torox, RevU, and EarnLab direct, with holds up to 30 days depending on the offer. Standard survey and quick task earnings clear within 24–72 hours.",
        kycNote: "ID check triggered on larger cashouts or suspicious multi-account flags; not required for routine browsing or low-tier redemptions.",
        bonus: {
            signupBonus: "Daily Cases + Bonus Coins on verified signup",
            referralRate: "5% – 10% Tiered referral commissions on referred earnings",
        },
        countries: ["US", "GB", "CA", "AU", "DE", "FR", "NL", "SE", "NO", "DK", "FI", "ES", "IT", "BR", "MX", "IN"],
        pros: [
            "Wide variety of earning formats and gamified reward features",
            "High-payout game offers ($500+ top milestone routes seen)",
            "Low $0.50 minimum cashout on cryptocurrency payouts",
            "Active community chat rain and weekly wager leaderboards",
        ],
        cons: [
            "Some high-tier game offers have up to 30-day verification holds",
            "Arcade mini-games involve risk if playing with earned balance",
        ],
        signupSteps: [
            { title: "Sign up", description: "Create a free account with email, Google, or Steam login." },
            { title: "Verify", description: "Confirm your email address; complete identity verification only if prompted." },
            { title: "Earn", description: "Complete game offers, take surveys, or participate in hourly community events." },
            { title: "Cash out", description: "Redeem via Litecoin, Bitcoin, PayPal, or digital gift cards once minimum is met." },
        ],
        faq: [
            {
                question: "Is EarnLab legit?",
                answer: "EarnLab has a verified track record with active payout tracking on EarnGrind, offering automated crypto cashouts and responsive support.",
            },
            {
                question: "How long does EarnLab take to pay?",
                answer: "Crypto withdrawals typically process within 5–15 minutes, while PayPal redemptions usually take 24–48 hours for review.",
            },
            {
                question: "What is the minimum age to use EarnLab?",
                answer: "You must be at least 13 years old with parental consent to use offerwalls, and 18+ for arcade-style wager features.",
            },
        ],
        affiliateLink: "https://earngrind.com/go/platform/earnlab?click_location=review_page&source_context=review_page&platform_name=EarnLab",
        seo: {
            metaTitle: "EarnLab Review — Payouts, Offers, and How to Get Paid | EarnGrind",
            metaDescription: "Read our comprehensive EarnLab review. Compare minimum cashouts, payout speed, KYC rules, earning methods, and verified user ratings.",
        },
    },
    gemsloot: {
        slug: "gemsloot",
        name: "Gemsloot",
        logoUrl: "https://www.google.com/s2/favicons?domain=gemsloot.com&sz=128",
        tagline: "Gaming offerwall backup",
        category: "Partner",
        rating: 3.8,
        updatedAt: "2026-08-20",
        stats: {
            minCashout: "$0.50 Crypto · $1.00 Gift",
            payoutSpeed: "Instant – 24h",
            kycRequired: "No",
            countryCount: 50,
        },
        overview:
            "Gemsloot is a gaming-focused GPT platform that aggregates multiple offerwall providers into a social lobby format. It features Ascend earnings, bundled offer bonuses, daily leaderboards, and instant crypto redemptions.",
        earningMethods: ["Offerwalls", "Mobile app offers", "Surveys", "Ascend Bundles", "Tournaments", "Chat rain"],
        payoutMethods: ["Crypto", "Gift cards"],
        holdPeriodNote: "Standard offerwall holds apply for first-time large payouts; routine crypto payouts process within minutes.",
        kycNote: "Generally none required for standard crypto redemptions unless flagged for proxy/VPN usage.",
        bonus: {
            signupBonus: "Free Welcome Case + 100 Gems upon signup",
            referralRate: "5% – 10% Tiered referral commission",
        },
        countries: ["US", "GB", "CA", "AU", "DE", "FR", "NL", "SE", "NO", "DK", "FI", "ES", "IT", "BR", "MX", "IN", "PL", "PH"],
        pros: [
            "Great backup site to find alternate game payout rates",
            "Very low $0.50 minimum cashout on crypto",
            "No routine KYC checks for crypto withdrawals",
            "Lobby features Ascend bonuses and active chat rain",
        ],
        cons: [
            "No direct PayPal cashout option (crypto and gift cards only)",
            "Offer availability depends heavily on your country and device",
        ],
        signupSteps: [
            { title: "Sign up", description: "Join Gemsloot with email or Google in under a minute." },
            { title: "Choose offers", description: "Browse offerwalls to compare boosted game payouts." },
            { title: "Track progress", description: "Follow milestone instructions and preserve completion screenshots." },
            { title: "Cash out", description: "Withdraw instantly to crypto or gift cards starting at $0.50." },
        ],
        faq: [
            {
                question: "Is Gemsloot good for mobile games?",
                answer: "Yes, Gemsloot frequently features boosted game rates and bundle bonuses through providers like TyrAds, HangMyAds, and WaxRewards.",
            },
            {
                question: "What payout methods does Gemsloot support?",
                answer: "Gemsloot supports Bitcoin, Litecoin, Ethereum, and a wide selection of regional gift cards.",
            },
        ],
        affiliateLink: "https://earngrind.com/go/platform/gemsloot?click_location=review_page&source_context=review_page&platform_name=Gemsloot",
        seo: {
            metaTitle: "Gemsloot Review — Payouts, Game Offers, and Rewards | EarnGrind",
            metaDescription: "Comprehensive Gemsloot review: explore minimum withdrawal limits, payout speed, offerwall options, and payment methods.",
        },
    },
    "gain-gg": {
        slug: "gain-gg",
        name: "Gain.gg",
        logoUrl: "https://www.google.com/s2/favicons?domain=gain.gg&sz=128",
        tagline: "High-payout offerwall backup",
        category: "Partner",
        rating: 3.8,
        updatedAt: "2026-08-10",
        stats: {
            minCashout: "$0.50 Crypto · $5.00 PayPal",
            payoutSpeed: "Instant – 24h",
            kycRequired: "No",
            countryCount: 45,
        },
        overview:
            "Gain.gg is an established GPT rewards hub offering direct access to top offerwalls, fast automated crypto withdrawals, daily leaderboards, and clean transparent coin-to-cash conversions.",
        earningMethods: ["Offerwalls", "Surveys", "Daily Leaderboards", "Lucky Spin", "Video watching"],
        payoutMethods: ["Crypto", "PayPal", "Gift cards"],
        holdPeriodNote: "High-value milestone game offers have standard provider verification holds (7–30 days).",
        kycNote: "Zero KYC for standard cryptocurrency withdrawals. Basic email verification required.",
        bonus: {
            signupBonus: "Free Lucky Spin + 100 Starter Coins",
            referralRate: "5% Lifetime earnings from active referrals",
        },
        countries: ["US", "GB", "CA", "AU", "DE", "FR", "NL", "SE", "NO", "DK", "FI", "ES", "IT", "IN"],
        pros: [
            "Reliable and fast automated crypto payouts starting at $0.50",
            "Direct integration with major offerwalls (AdGate, Torox, RevU, CPX)",
            "Simple, fast interface with minimal distraction",
        ],
        cons: [
            "Interface is utilitarian compared to newer gamified platforms",
            "Survey availability varies by region",
        ],
        signupSteps: [
            { title: "Sign up", description: "Register via Steam or Google with one click." },
            { title: "Spin wheel", description: "Claim your free welcome spin for bonus starting coins." },
            { title: "Complete tasks", description: "Select high-paying game offers or short surveys." },
            { title: "Withdraw", description: "Instant cashout to crypto wallet or PayPal account." },
        ],
        faq: [
            {
                question: "How fast are payouts on Gain.gg?",
                answer: "Cryptocurrency cashouts are automated and usually reach your wallet within a few minutes.",
            },
        ],
        affiliateLink: "https://earngrind.com/go/platform/gain-gg?click_location=review_page&source_context=review_page&platform_name=Gain.gg",
        seo: {
            metaTitle: "Gain.gg Review — Offers, Payout Speed, and Rewards | EarnGrind",
            metaDescription: "Detailed Gain.gg review covering payout speeds, minimum cashouts, offerwall selections, and crypto withdrawal options.",
        },
    },
    kashkick: {
        slug: "kashkick",
        name: "KashKick",
        logoUrl: "https://www.google.com/s2/favicons?domain=kashkick.com&sz=128",
        tagline: "High-payout US mobile game deals",
        category: "Partner",
        rating: 4.2,
        updatedAt: "2026-08-25",
        stats: {
            minCashout: "$10.00 PayPal",
            payoutSpeed: "1 – 3 days",
            kycRequired: "Yes",
            countryCount: 1,
        },
        overview:
            "KashKick is a premier US-focused rewards platform known for some of the highest verified game offer payouts on the market. It delivers direct cash redemptions to PayPal with transparent dollar-denominated task tracking.",
        earningMethods: ["Direct mobile game offers", "Surveys", "Financial services", "App installs"],
        payoutMethods: ["PayPal direct"],
        holdPeriodNote: "Game offer tiers usually pend for 14–30 days while game publishers verify milestone completion.",
        kycNote: "Identity and US phone verification required before processing your initial PayPal cashout.",
        bonus: {
            signupBonus: "$1.00 Profile completion bonus",
            referralRate: "25% of referred earnings lifetime",
        },
        countries: ["US"],
        pros: [
            "Top-tier mobile game payout rates (often $100–$300+ per game)",
            "Clean dollar-denominated balance (no confusing coin conversion)",
            "Direct cash deposit to your verified PayPal account",
            "Generous 25% referral program",
        ],
        cons: [
            "Strictly US residents only (phone & ID verification mandatory)",
            "Higher $10 minimum cashout threshold",
        ],
        signupSteps: [
            { title: "Sign up", description: "Register with your US email and basic demographic profile." },
            { title: "Select games", description: "Choose high-value mobile games with realistic completion goals." },
            { title: "Hit milestones", description: "Reach required levels within the stated time limits (usually 30 days)." },
            { title: "Cash out", description: "Request direct PayPal deposit once your balance reaches $10." },
        ],
        faq: [
            {
                question: "Is KashKick available outside the US?",
                answer: "No, KashKick currently requires US residency, a US IP address, and a US mobile phone number for verification.",
            },
            {
                question: "How does KashKick pay?",
                answer: "All earnings are paid directly in USD to your linked PayPal account.",
            },
        ],
        affiliateLink: "https://earngrind.com/go/platform/kashkick?click_location=review_page&source_context=review_page&platform_name=KashKick",
        seo: {
            metaTitle: "KashKick Review — High-Paying Game Offers and Payouts | EarnGrind",
            metaDescription: "In-depth KashKick review: explore top gaming payouts, PayPal cashout requirements, KYC verification, and earning potential.",
        },
    },
    swagbucks: {
        slug: "swagbucks",
        name: "Swagbucks",
        logoUrl: "https://www.google.com/s2/favicons?domain=swagbucks.com&sz=128",
        tagline: "Most established global rewards brand",
        category: "Mainstream",
        rating: 4.1,
        updatedAt: "2026-08-18",
        stats: {
            minCashout: "$3.00 Gift · $5.00 PayPal",
            payoutSpeed: "2 – 5 days",
            kycRequired: "Sometimes",
            countryCount: 15,
        },
        overview:
            "Swagbucks is the world's most recognized GPT platform, having paid out hundreds of millions of dollars to members worldwide. It offers an immense variety of earning channels from gaming deals and shopping cashback to daily surveys.",
        earningMethods: ["Mobile game offers", "Surveys", "Cashback shopping", "Magic Receipts", "Search engine", "Daily polls"],
        payoutMethods: ["PayPal", "Visa prepaid", "Amazon", "Retail gift cards"],
        holdPeriodNote: "Game offers and cashback transactions typically show as pending for 7–32 days before funds unlock.",
        kycNote: "Periodic phone or ID check on redemption depending on account risk flags.",
        bonus: {
            signupBonus: "$10.00 Welcome bonus with qualifying shopping offer",
            referralRate: "10% Lifetime commission + 300 SB bonus",
        },
        countries: ["US", "GB", "CA", "AU", "DE", "FR", "ES", "IN", "IE"],
        pros: [
            "Decades of reliable payment history and trustworthy support",
            "Huge selection of gift cards discounted at 12% once per month",
            "Diverse earning methods beyond just mobile games",
        ],
        cons: [
            "Pending periods on offers are consistently 14–32 days",
            "Survey disqualification rate can be high for some demographics",
        ],
        signupSteps: [
            { title: "Sign up", description: "Create an account with email and password." },
            { title: "Earn SB", description: "Play games, shop online, or complete daily answer polls." },
            { title: "Accumulate points", description: "100 SB equals $1.00 USD in real reward value." },
            { title: "Redeem", description: "Choose PayPal, Amazon, or prepaid Visa cards starting at $3." },
        ],
        faq: [
            {
                question: "Is Swagbucks safe and legitimate?",
                answer: "Yes, Swagbucks is owned by Prodege LLC and has paid out over $900 million to members since 2008.",
            },
        ],
        affiliateLink: "https://earngrind.com/go/platform/swagbucks?click_location=review_page&source_context=review_page&platform_name=Swagbucks",
        seo: {
            metaTitle: "Swagbucks Review — Trust, Payouts, and Gaming Rewards | EarnGrind",
            metaDescription: "Comprehensive Swagbucks review covering gift card options, PayPal cashout speeds, gaming offers, and verified ratings.",
        },
    },
    inboxdollars: {
        slug: "inboxdollars",
        name: "InboxDollars",
        logoUrl: "/gpt-logo/inboxdollars-mascot.png",
        tagline: "Direct cash rewards for games and surveys",
        category: "Mainstream",
        rating: 3.9,
        updatedAt: "2026-08-12",
        stats: {
            minCashout: "$15.00 (First) · $10.00 (Subsequent)",
            payoutSpeed: "3 – 5 days",
            kycRequired: "Sometimes",
            countryCount: 1,
        },
        overview:
            "InboxDollars is a long-standing US cash-rewards platform that displays all earnings in straightforward US dollars rather than arbitrary point systems. It features exclusive gaming offers, paid emails, and grocery receipt scans.",
        earningMethods: ["Game offers", "Paid surveys", "Receipt scanning", "Cashback shopping", "Paid emails"],
        payoutMethods: ["PayPal", "Prepaid Visa", "Retail gift cards"],
        holdPeriodNote: "Offers pend between 7 and 30 days depending on the game publisher verification cycle.",
        kycNote: "Phone verification and US address verification required upon initial cashout.",
        bonus: {
            signupBonus: "$5.00 Instant welcome bonus upon email confirmation",
            referralRate: "$3.00 Bonus per referral + 10% qualified earnings",
        },
        countries: ["US"],
        pros: [
            "Straightforward dollar balance with no point conversion math",
            "$5 instant welcome bonus for new accounts",
            "Established brand with reliable payouts to PayPal",
        ],
        cons: [
            "US residents only",
            "Higher initial cashout threshold of $15 ($10 on subsequent redemptions)",
        ],
        signupSteps: [
            { title: "Sign up", description: "Register and confirm your email to claim the instant $5 bonus." },
            { title: "Explore tasks", description: "Browse gaming offers, surveys, and receipt upload promos." },
            { title: "Complete goals", description: "Finish game levels or shopping tasks before the expiration date." },
            { title: "Cash out", description: "Redeem funds directly to PayPal or e-gift cards." },
        ],
        faq: [
            {
                question: "How do I get the $5 signup bonus on InboxDollars?",
                answer: "Simply sign up using an active EarnGrind referral link and confirm your email address within 24 hours.",
            },
        ],
        affiliateLink: "https://earngrind.com/go/platform/inboxdollars?click_location=review_page&source_context=review_page&platform_name=InboxDollars",
        seo: {
            metaTitle: "InboxDollars Review — $5 Bonus, Game Offers, and Payouts | EarnGrind",
            metaDescription: "Detailed InboxDollars review: learn how to claim the $5 bonus, cashout requirements, PayPal speeds, and gaming routes.",
        },
    },
    mypoints: {
        slug: "mypoints",
        name: "MyPoints",
        logoUrl: "https://www.google.com/s2/favicons?domain=mypoints.com&sz=128",
        tagline: "Shopping cashback and gaming rewards",
        category: "Mainstream",
        rating: 3.7,
        updatedAt: "2026-08-08",
        stats: {
            minCashout: "$3.00 Gift · $10.00 PayPal",
            payoutSpeed: "3 – 5 days",
            kycRequired: "Sometimes",
            countryCount: 2,
        },
        overview:
            "MyPoints is a veteran rewards platform operating under the Prodege network. It pairs shopping cashback bonuses with game offerwalls, email rewards, and gift card redemptions starting at low thresholds.",
        earningMethods: ["Cashback shopping", "Mobile game offers", "Surveys", "Receipt uploads", "Daily goals"],
        payoutMethods: ["PayPal", "Visa prepaid", "Amazon gift cards"],
        holdPeriodNote: "Standard 14–32 day pending period for shopping and high-tier game achievements.",
        kycNote: "Basic phone or ID verification upon first high-value redemption.",
        bonus: {
            signupBonus: "$10.00 Amazon or Visa gift card with $20 qualifying spend",
            referralRate: "10% Referral earnings + 250 Points bonus",
        },
        countries: ["US", "CA"],
        pros: [
            "Low $3 minimum cashout on selected merchant gift cards",
            "Part of the reputable Prodege family alongside Swagbucks",
            "Great combined shopping cashback rates",
        ],
        cons: [
            "Point values are approximately 150–160 points per $1.00 (non-linear conversion)",
            "Limited to US and Canada",
        ],
        signupSteps: [
            { title: "Sign up", description: "Create your MyPoints account with email." },
            { title: "Shop & play", description: "Earn points across shopping portals and mobile game downloads." },
            { title: "Reach minimum", description: "Accumulate points toward your target gift card or PayPal balance." },
            { title: "Redeem", description: "Request digital delivery of your chosen gift card or cash." },
        ],
        faq: [
            {
                question: "How much are MyPoints points worth?",
                answer: "Points roughly translate to ~150 points per $1.00, depending on the specific gift card or PayPal tier chosen.",
            },
        ],
        affiliateLink: "https://earngrind.com/go/platform/mypoints?click_location=review_page&source_context=review_page&platform_name=MyPoints",
        seo: {
            metaTitle: "MyPoints Review — Cashback, Games, and Gift Card Rewards | EarnGrind",
            metaDescription: "Read our verified MyPoints review. Discover minimum cashouts, point conversion values, gaming deals, and payout times.",
        },
    },
    prizerebel: {
        slug: "prizerebel",
        name: "PrizeRebel",
        logoUrl: "https://www.google.com/s2/favicons?domain=prizerebel.com&sz=128",
        tagline: "Fast survey and offerwall redemptions",
        category: "Partner",
        rating: 4.0,
        updatedAt: "2026-08-16",
        stats: {
            minCashout: "$5.00 PayPal · $2.00 Gift",
            payoutSpeed: "Instant – 24h",
            kycRequired: "Sometimes",
            countryCount: 40,
        },
        overview:
            "PrizeRebel is a trusted international GPT site that has operated continuously since 2007. Known for its tiered VIP system, Diamond members enjoy instant gift card and PayPal processing within minutes.",
        earningMethods: ["Surveys", "Offerwalls", "Raffles", "Contests", "Promo codes"],
        payoutMethods: ["PayPal", "Direct bank (US)", "Amazon", "Crypto (via gift cards)"],
        holdPeriodNote: "Most survey earnings credit instantly. Large game offerwall rewards may have standard provider holds.",
        kycNote: "ID check is rarely required unless automated risk algorithms flag account anomalies.",
        bonus: {
            signupBonus: "Starter account bonuses and daily promo codes",
            referralRate: "15% – 30% Tiered referral commission based on account level",
        },
        countries: ["US", "GB", "CA", "AU", "DE", "FR", "NL", "SE", "NO", "DK", "FI", "ES", "IT", "IN", "BR", "MX"],
        pros: [
            "Instant processing on gift cards for Diamond level members",
            "Low $2 minimum cashout on select gift card brands",
            "High referral commissions scaling up to 30%",
            "Extremely consistent payout history since 2007",
        ],
        cons: [
            "Best survey inventory is heavily weighted toward US/UK/CA/AU",
            "Fewer proprietary in-house gaming tools compared to newer apps",
        ],
        signupSteps: [
            { title: "Sign up", description: "Register in 10 seconds using email or social accounts." },
            { title: "Earn points", description: "Answer demographic surveys and complete offerwall tasks." },
            { title: "Level up", description: "Climb account tiers (Bronze to Diamond) for faster processing and discounts." },
            { title: "Claim reward", description: "Get your PayPal deposit or gift card code sent directly to your inbox." },
        ],
        faq: [
            {
                question: "How long do PrizeRebel rewards take to process?",
                answer: "Standard members receive rewards within 24 hours; Gold and Diamond members receive instant processing in under 5 minutes.",
            },
        ],
        affiliateLink: "https://earngrind.com/go/platform/prizerebel?click_location=review_page&source_context=review_page&platform_name=PrizeRebel",
        seo: {
            metaTitle: "PrizeRebel Review — Fast Surveys, Instant Payouts, and Rewards | EarnGrind",
            metaDescription: "Comprehensive PrizeRebel review: explore VIP tiers, instant cashout perks, minimum redemption limits, and survey availability.",
        },
    },
    scrambly: {
        slug: "scrambly",
        name: "Scrambly",
        logoUrl: "https://www.google.com/s2/favicons?domain=scrambly.io&sz=128",
        tagline: "Instant game testing and cashouts",
        category: "Partner",
        rating: 4.2,
        updatedAt: "2026-08-22",
        stats: {
            minCashout: "$1.00 PayPal · $1.00 Gift",
            payoutSpeed: "Instant (under 5 mins)",
            kycRequired: "Yes",
            countryCount: 3,
        },
        overview:
            "Scrambly is a modern game-testing and rewards platform tailored for quick mobile earnings. It provides immediate, step-by-step milestone rewards that can be withdrawn to PayPal or gift cards with an industry-low $1.00 minimum.",
        earningMethods: ["Mobile game testing", "App discovery", "Financial signups", "Daily streaks"],
        payoutMethods: ["PayPal", "Visa prepaid", "Amazon", "Walmart"],
        holdPeriodNote: "Step-by-step milestones credit instantly once verified by publisher postbacks.",
        kycNote: "Facial selfie and ID verification required prior to your first cashout to prevent fraud.",
        bonus: {
            signupBonus: "$0.50 – $1.00 Welcome bonus with promo code",
            referralRate: "$3.00 Per active referral + 10% lifetime reward share",
            promoCode: "EARNGRIND",
        },
        countries: ["US", "CA", "GB"],
        pros: [
            "Ultra-low $1.00 minimum withdrawal for PayPal and gift cards",
            "Instant payout delivery (typically 1–5 minutes)",
            "Milestone-based game rewards pay as you play each level",
            "Clean, user-friendly mobile and desktop interface",
        ],
        cons: [
            "Mandatory ID and selfie verification before first cashout",
            "Available in US, Canada, and UK only",
        ],
        signupSteps: [
            { title: "Sign up", description: "Create an account with email and enter promo code EARNGRIND." },
            { title: "Verify ID", description: "Complete the fast 1-minute selfie verification." },
            { title: "Test games", description: "Download games and reach level milestones for progressive rewards." },
            { title: "Instant cashout", description: "Withdraw to PayPal starting at just $1.00." },
        ],
        faq: [
            {
                question: "Is Scrambly instant cashout really instant?",
                answer: "Yes, once your initial ID verification is approved, subsequent PayPal withdrawals process within 1–5 minutes automatically.",
            },
            {
                question: "What countries can use Scrambly?",
                answer: "Scrambly is officially available to residents of the United States, Canada, and the United Kingdom.",
            },
        ],
        affiliateLink: "https://earngrind.com/go/platform/scrambly?click_location=review_page&source_context=review_page&platform_name=Scrambly",
        seo: {
            metaTitle: "Scrambly Review — Instant $1 Payouts, Games, and Bonus Code | EarnGrind",
            metaDescription: "In-depth Scrambly review: test games for instant $1 PayPal cashouts, verified promo codes, KYC requirements, and speed.",
        },
    },
};

export async function getPlatformReview(slug: string): Promise<PlatformReview | null> {
    const normalized = slug.trim().toLowerCase();
    return PLATFORM_REVIEWS[normalized] ?? null;
}

export function getAllPlatformReviewSlugs(): string[] {
    return Object.keys(PLATFORM_REVIEWS);
}

const PLATFORM_DB_ALIASES: Record<string, string[]> = {
    earnlab: ["EarnLab", "earnlab"],
    gemsloot: ["Gemsloot", "GemLoot", "gemloot", "gemsloot"],
    "gain-gg": ["Gain.gg", "Gain", "gain-gg", "gain"],
    cashinstyle: ["CashInStyle", "cashinstyle"],
    kashkick: ["KashKick", "kashkick"],
    swagbucks: ["Swagbucks", "swagbucks"],
    inboxdollars: ["InboxDollars", "inboxdollars"],
    mypoints: ["MyPoints", "mypoints"],
    prizerebel: ["PrizeRebel", "prizerebel"],
    scrambly: ["Scrambly", "scrambly"],
};

export async function getPlatformPreviewOffers(platformName: string, platformSlug?: string) {
    try {
        const { supabase } = await import("@/lib/supabase/public");
        const slug = (platformSlug || platformName.toLowerCase().replace(/[^a-z0-9]/g, "")).trim();
        const aliases = PLATFORM_DB_ALIASES[slug] || [platformName, slug];

        const orFilters = aliases
            .map((a) => `platform_name.ilike.%${a}%,platform_slug.eq.${a}`)
            .join(",");

        const { data: matchedRows } = await supabase
            .from("unified_offers_view")
            .select("id, title, game_name, game_slug, game_thumbnail, image_url, payout_usd, total_payout_usd, goal_text, provider_name, platform_name, offer_url")
            .or(orFilters)
            .order("total_payout_usd", { ascending: false })
            .limit(60);

        let candidates = matchedRows ?? [];

        // If no direct platform offers found, fallback to top network game offers
        if (candidates.length === 0) {
            const { data: topNetworkData } = await supabase
                .from("unified_offers_view")
                .select("id, title, game_name, game_slug, game_thumbnail, image_url, payout_usd, total_payout_usd, goal_text, provider_name, platform_name, offer_url")
                .order("total_payout_usd", { ascending: false })
                .limit(60);
            candidates = topNetworkData ?? [];
        }

        // Deduplicate candidates by normalized game name/title to ensure all 6 cards are unique
        const seen = new Set<string>();
        const deduped: Array<{
            id: string;
            title: string;
            gameName: string | null;
            gameSlug: string | null;
            imageUrl: string | null;
            payoutUsd: number;
            totalPayoutUsd: number;
            providerName: string | null;
            platformName: string | null;
            goalText: string | null;
            offerUrl: string | null;
        }> = [];

        for (const row of candidates) {
            const rawTitle = (row.game_name || row.title || "").trim();
            if (!rawTitle) continue;
            const normKey = rawTitle.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15);
            if (seen.has(normKey)) continue;
            seen.add(normKey);

            const resolvedPlatform =
                row.platform_name === "GemLoot" ? "Gemsloot" : row.platform_name || platformName;

            deduped.push({
                id: String(row.id),
                title: rawTitle,
                gameName: row.game_name ? String(row.game_name) : null,
                gameSlug: row.game_slug ? String(row.game_slug) : null,
                imageUrl: (row.image_url || row.game_thumbnail) ? String(row.image_url || row.game_thumbnail) : null,
                payoutUsd: Number(row.payout_usd || 0),
                totalPayoutUsd: Number(row.total_payout_usd || row.payout_usd || 0),
                providerName: row.provider_name ? String(row.provider_name) : null,
                platformName: resolvedPlatform,
                goalText: row.goal_text ? String(row.goal_text) : null,
                offerUrl: row.offer_url ? String(row.offer_url) : null,
            });

            if (deduped.length >= 6) break;
        }

        return deduped;
    } catch (err) {
        console.error("getPlatformPreviewOffers error:", err);
        return [];
    }
}
