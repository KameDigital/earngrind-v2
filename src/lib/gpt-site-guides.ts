import { GPT_AFFILIATE_PLATFORMS, buildTrackedPlatformHref } from "@/lib/gpt-affiliate-platforms";

export type GptSiteGuide = {
    slug: string;
    platformSlug: string;
    name: string;
    status?: "draft" | "published";
    title: string;
    description: string;
    bestFor: string;
    verdict: string;
    screenshot: string;
    accent: string;
    updatedAt: string;
    payoutStyle: string;
    minimumCashout: string;
    rewardOptions: string;
    accountFit: string;
    earningModes: string[];
    strengths: string[];
    watchouts: string[];
    strategy: string[];
    faq: Array<{ question: string; answer: string }>;
    sources: Array<{ label: string; href: string }>;
    primaryCtaLabel?: string;
    primaryCtaHref?: string;
    sidebarCtaLabel?: string;
    sidebarCtaHref?: string;
};

export type GptSiteFeatureAudit = {
    title: string;
    eyebrow: string;
    image: string;
    imageAlt: string;
    gallery?: Array<{ image: string; imageAlt: string; caption: string }>;
    summary: string;
    mechanics: string[];
    readerValue: string;
};

export type GptSiteNavigationAudit = {
    primary: string[];
    standout: string;
    gatedNote?: string;
};

const UPDATED_AT = "2026-05-13";

const platformBySlug = new Map(GPT_AFFILIATE_PLATFORMS.map((platform) => [platform.slug, platform]));

export const GPT_SITE_GUIDES: GptSiteGuide[] = [
    {
        slug: "kashkick",
        platformSlug: "kashkick",
        name: "KashKick",
        title: "KashKick Guide: Best Way to Use KashKick for Games, Surveys, and Cash Rewards",
        description:
            "A practical KashKick guide covering who should use it, how cashout works, which offers to prioritize, and what to verify before starting a game or survey route.",
        bestFor: "Beginners who want a simple cash-first GPT path",
        verdict:
            "KashKick is strongest when you want a straightforward rewards site with cash-style tracking, game goals, surveys, and a low-friction beginner flow. Treat bigger game payouts like projects: screenshot terms, track milestones, and wait for pending rewards to clear before stacking too many offers.",
        screenshot: "/images/guides/gpt-sites/kashkick.png",
        accent: "purple",
        updatedAt: UPDATED_AT,
        payoutStyle: "Cash-style Kash balance",
        minimumCashout: "$10 Kash according to KashKick help materials",
        rewardOptions: "PayPal, Venmo, KashRewards gift cards, prepaid cards, and donations where available",
        accountFit: "U.S. users 18+ who want surveys, games, and deal-style offers with cash-oriented rewards",
        earningModes: ["Mobile game milestones", "Survey profiles", "Deals and partner offers", "Daily rewards"],
        strengths: [
            "Easy to understand because $1 Kash is positioned like $1 in rewards.",
            "Good first stop for users who prefer PayPal or Venmo over point math.",
            "Game offers are prominent, so it fits EarnGrind readers comparing payout routes.",
            "The public help center explains pending and verification behavior clearly enough to set expectations.",
        ],
        watchouts: [
            "Some rewards can pend while advertiser verification runs.",
            "Game milestones need clean tracking from the original install click.",
            "Offer availability can change by country, device, and account history.",
            "Large rewards are not passive income; they usually require sustained play or purchases.",
        ],
        strategy: [
            "Complete survey profiles first so the account has cleaner matching signals.",
            "Before starting a game, screenshot the offer wall, milestone list, payout amount, and deadline.",
            "Start one high-value game at a time until you know tracking is working.",
            "Use KashKick for beginner-friendly cash offers, then compare the same game on other GPT sites before committing heavy time.",
        ],
        faq: [
            {
                question: "Is KashKick good for beginners?",
                answer: "Yes. It is one of the easier GPT sites to understand because rewards are presented in cash-like Kash instead of an abstract point system.",
            },
            {
                question: "What should I check before starting a KashKick game offer?",
                answer: "Confirm the device, deadline, new-user requirement, milestone wording, and whether rewards pend after completion.",
            },
            {
                question: "What is the best KashKick use case?",
                answer: "Use it for beginner cash rewards, survey matching, and game offers where the milestone path is realistic for your schedule.",
            },
        ],
        sources: [
            { label: "KashKick help: what KashKick is", href: "https://helpcenter.kashkick.com/en/articles/10752608-what-is-kashkick" },
            { label: "KashKick help: what Kash is", href: "https://helpcenter.kashkick.com/en/articles/10744937-what-is-kash" },
            { label: "KashKick official site", href: "https://kashkick.com/" },
        ],
    },
    {
        slug: "swagbucks",
        platformSlug: "swagbucks",
        name: "Swagbucks",
        title: "Swagbucks Guide: How to Use SB, Rewards, Surveys, Shopping, and Game Offers",
        description:
            "A Swagbucks guide for choosing the right earning paths, redeeming SB, avoiding wasted time, and deciding when Swagbucks is better than a smaller GPT site.",
        bestFor: "Mainstream rewards users who want many earning categories",
        verdict:
            "Swagbucks is the broadest mainstream option in this list. It is best when you want surveys, shopping rewards, Discover offers, games, search, and gift-card redemptions in one account. The tradeoff is that not every earning path has the same hourly value, so you need to sort ruthlessly.",
        screenshot: "/images/guides/gpt-sites/swagbucks.png",
        accent: "blue",
        updatedAt: UPDATED_AT,
        payoutStyle: "SB points, with 100 SB commonly treated as $1 in Swagbucks help content",
        minimumCashout: "Some rewards start around 300 SB; PayPal and other rewards vary",
        rewardOptions: "PayPal cash, gift cards, virtual cards, crypto voucher gift cards, and Swagstakes where available",
        accountFit: "Users who want a large rewards ecosystem rather than only high-payout game offers",
        earningModes: ["Surveys", "Shop & Earn", "Magic Receipts", "Discover offers", "Games", "Search"],
        strengths: [
            "Long-running mainstream brand with a broad reward store.",
            "Multiple earning categories reduce reliance on one offerwall.",
            "Good for gift-card redemptions and routine reward stacking.",
            "Useful as a benchmark when checking whether another GPT site has a meaningfully better game payout.",
        ],
        watchouts: [
            "The widest catalog is not automatically the highest-paying catalog.",
            "Survey disqualification and low-value tasks can waste time.",
            "PayPal setup requires the correct account connection and verification flow.",
            "Shopping and offer terms can have exclusions, waiting periods, or special conditions.",
        ],
        strategy: [
            "Use Swagbucks for breadth: shopping, receipts, surveys, and mainstream Discover offers.",
            "Reserve game installs for offers with clear milestone math and enough payout to justify the deadline.",
            "Check the reward store before grinding so you know the exact redemption target.",
            "Keep a separate screenshot folder for Swagbucks Discover offers because terms can update.",
        ],
        faq: [
            {
                question: "Is Swagbucks better for surveys or games?",
                answer: "It can handle both, but the best use case is mixing categories. Compare game payouts before installing because a dedicated offerwall site may pay more for the same title.",
            },
            {
                question: "How do Swagbucks rewards work?",
                answer: "Swagbucks uses SB points that can be redeemed for eligible rewards such as PayPal or gift cards, subject to reward availability and verification.",
            },
            {
                question: "Who should use Swagbucks?",
                answer: "Use it if you want one mainstream account for surveys, shopping, receipts, offers, and flexible redemptions.",
            },
        ],
        sources: [
            { label: "Swagbucks help: earning SB", href: "https://help.swagbucks.com/hc/en-us/articles/205639584-How-do-I-earn-SB" },
            { label: "Swagbucks help: rewards", href: "https://help.swagbucks.com/hc/en-us/categories/6899560561172-Redeeming-SB-Rewards" },
            { label: "Swagbucks official site", href: "https://www.swagbucks.com/" },
        ],
    },
    {
        slug: "inboxdollars",
        platformSlug: "inboxdollars",
        name: "InboxDollars",
        title: "InboxDollars Guide: Cash Offers, Surveys, Games, and Payment Strategy",
        description:
            "An InboxDollars guide covering cash offers, payment requirements, game tracking, surveys, and the best way to use it as a cash-style GPT backup.",
        bestFor: "Cash-style rewards users who want a familiar Prodege-backed alternative",
        verdict:
            "InboxDollars works best as a cash-labeled rewards site for surveys, offers, shopping, and games. It is less about chasing every tiny task and more about picking clear offers, keeping payment details clean, and avoiding any route where tracking is ambiguous.",
        screenshot: "/images/guides/gpt-sites/inboxdollars.png",
        accent: "green",
        updatedAt: UPDATED_AT,
        payoutStyle: "Dollar-based rewards balance",
        minimumCashout: "InboxDollars help lists $15 for first payment and $10 increments after that on the payment request page",
        rewardOptions: "Gift cards, PayPal, and Visa-style rewards where available",
        accountFit: "Users who prefer cash labels over points and want a mainstream backup to Swagbucks",
        earningModes: ["Cash offers", "Surveys", "Games", "Shopping", "Email and app-based activities"],
        strengths: [
            "Cash-style balance is easier to understand than point conversion.",
            "Official help documentation is detailed about payment requirements.",
            "Good companion site for comparing Prodege-style reward offers.",
            "Useful for users who want PayPal or gift-card style payment choices.",
        ],
        watchouts: [
            "PayPal details must match exactly for payment processing.",
            "First cashout requirements can be higher than some competitors.",
            "Only one pending payment behavior and processing windows can affect cashout timing.",
            "Game tracking problems usually require proof from the original click and install flow.",
        ],
        strategy: [
            "Set up your profile and payment information before you chase a large offer.",
            "Use InboxDollars for cash offers with clear advertiser terms and realistic timelines.",
            "Avoid installing the same game through multiple sites; pick the best payout first.",
            "Keep a written log of offer name, install time, device, payout, and deadline.",
        ],
        faq: [
            {
                question: "Is InboxDollars a good GPT site?",
                answer: "It can be a good cash-style GPT backup, especially if you want surveys and offers with a dollar balance instead of points.",
            },
            {
                question: "What matters most before cashing out?",
                answer: "Make sure your InboxDollars account details match your payment account details, especially for PayPal.",
            },
            {
                question: "Should I use InboxDollars for games?",
                answer: "Use it only when the payout, deadline, and tracking requirements are better than competing routes for the same game.",
            },
        ],
        sources: [
            { label: "InboxDollars help: cash offers", href: "https://help.inboxdollars.com/hc/en-us/articles/360044248012-What-Are-Cash-Offers" },
            { label: "InboxDollars help: payment request", href: "https://help.inboxdollars.com/hc/en-us/articles/360044243332-How-Do-I-Request-Payment" },
            { label: "InboxDollars official site", href: "https://www.inboxdollars.com/" },
        ],
    },
    {
        slug: "mypoints",
        platformSlug: "mypoints",
        name: "MyPoints",
        title: "MyPoints Guide: Shopping Rewards, Surveys, Points, and Gift Card Strategy",
        description:
            "A MyPoints guide for using shopping rewards, surveys, games, and redemptions without wasting time on low-value point routes.",
        bestFor: "Shopping rewards and gift-card backup value",
        verdict:
            "MyPoints is the most shopping-oriented site in the Best GPT Sites list. It belongs in your stack when you already shop online, want gift-card choices, and need a secondary source of surveys or offers, but it is rarely the first place to chase intense game milestones.",
        screenshot: "/images/guides/gpt-sites/mypoints.png",
        accent: "red",
        updatedAt: UPDATED_AT,
        payoutStyle: "MyPoints points",
        minimumCashout: "Varies by reward denomination and available point balance",
        rewardOptions: "Gift cards and online certificates from many retail and travel partners",
        accountFit: "Users who shop online and want reward stacking plus occasional surveys or games",
        earningModes: ["Shopping portals", "Surveys", "Games", "Email-style rewards", "Gift-card redemption"],
        strengths: [
            "Best fit for people who can stack rewards on purchases they already planned.",
            "Large gift-card catalog can be useful even when PayPal is not the goal.",
            "Good backup account when Swagbucks or InboxDollars does not have the right offer.",
            "Simple value proposition for routine, non-urgent earning.",
        ],
        watchouts: [
            "Point value can be less intuitive than cash-style sites.",
            "Shopping rewards depend on retailer terms, exclusions, and tracking.",
            "Surveys and games should be filtered carefully for hourly value.",
            "Gift-card redemptions may be more useful than cash depending on the account.",
        ],
        strategy: [
            "Use MyPoints first for shopping you were already going to do.",
            "Check retailer exclusions before assuming a purchase will earn points.",
            "Treat game offers as optional unless the payout beats your other GPT sites.",
            "Redeem toward specific gift cards instead of letting points sit without a target.",
        ],
        faq: [
            {
                question: "What is MyPoints best for?",
                answer: "MyPoints is best for shopping rewards, gift-card redemptions, and backup surveys or offers.",
            },
            {
                question: "Is MyPoints the best site for game offers?",
                answer: "Usually not first. Compare the same game on KashKick, Swagbucks, Gain.gg, or GemLoot before installing.",
            },
            {
                question: "How should I redeem MyPoints?",
                answer: "Pick a reward target first, then compare the point cost and redemption availability before grinding.",
            },
        ],
        sources: [
            { label: "MyPoints help: rewards", href: "https://help.mypoints.com/hc/en-us/articles/212187503-What-can-I-get-with-the-Points-that-I-earn" },
            { label: "MyPoints official site", href: "https://www.mypoints.com/" },
        ],
    },
    {
        slug: "prizerebel",
        platformSlug: "prizerebel",
        name: "PrizeRebel",
        title: "PrizeRebel Guide: Surveys, Points, PayPal, Gift Cards, and Crypto Rewards",
        description:
            "A PrizeRebel guide for survey-heavy earning, reward choices, point redemptions, and how to decide when it deserves your time.",
        bestFor: "Survey-focused users who want PayPal, gift cards, or crypto-style options",
        verdict:
            "PrizeRebel is a survey-first GPT option with a broad rewards catalog. It is best when you can qualify for surveys consistently and want flexible redemption choices, but you should protect your time from repeated disqualifications.",
        screenshot: "/images/guides/gpt-sites/prizerebel.png",
        accent: "orange",
        updatedAt: UPDATED_AT,
        payoutStyle: "PrizeRebel points",
        minimumCashout: "Varies by reward option and country",
        rewardOptions: "PayPal, gift cards, Bitcoin, and crypto voucher-style rewards where available",
        accountFit: "Users who want a survey-heavy GPT site with several reward categories",
        earningModes: ["Paid surveys", "Offerwall tasks", "Reward redemptions", "Bonus and account-level perks"],
        strengths: [
            "Clear survey-rewards positioning.",
            "Flexible reward catalog for PayPal, gift cards, and crypto options.",
            "Good backup when mainstream sites are dry.",
            "Works best for users who already know how to screen surveys quickly.",
        ],
        watchouts: [
            "Survey disqualification can drag down hourly value.",
            "Reward options vary by region and availability.",
            "Offerwall tasks still need the same screenshot and tracking discipline as game sites.",
            "Crypto-style rewards add extra redemption complexity compared with simple PayPal.",
        ],
        strategy: [
            "Use PrizeRebel in short survey sessions instead of leaving it open all day.",
            "Track which survey routers qualify you most often.",
            "Cash out on a predictable reward type before experimenting with crypto rewards.",
            "Use offerwalls only when the payout beats your other GPT accounts.",
        ],
        faq: [
            {
                question: "Is PrizeRebel mainly a survey site?",
                answer: "Yes. It has GPT features, but the strongest fit is users who want surveys plus flexible rewards.",
            },
            {
                question: "Can PrizeRebel pay through PayPal?",
                answer: "PrizeRebel support materials list PayPal among available reward types, subject to eligibility and region.",
            },
            {
                question: "How do I avoid wasting time on PrizeRebel?",
                answer: "Keep sessions short, learn which surveys qualify you, and stop routes that repeatedly disqualify late.",
            },
        ],
        sources: [
            { label: "PrizeRebel support: rewards", href: "https://support.prizerebel.com/support/solutions/articles/1000082266-what-rewards-can-i-get-" },
            { label: "PrizeRebel official site", href: "https://www.prizerebel.com/" },
        ],
    },
    {
        slug: "scrambly",
        platformSlug: "scrambly",
        name: "Scrambly",
        title: "Scrambly Guide: Play Games, Test Apps, Cash Out, and Avoid Tracking Mistakes",
        description:
            "A Scrambly guide covering mobile games, app discovery, reward tracking, cashout options, and the safest way to use newer game-focused GPT apps.",
        bestFor: "Newer mobile game and app discovery offers",
        verdict:
            "Scrambly is best for users who want a newer game-and-app rewards flow with an app-first feel. The upside is quick discovery and lower-friction rewards; the risk is that newer reward apps require extra tracking discipline and careful offer selection.",
        screenshot: "/images/guides/gpt-sites/scrambly.png",
        accent: "orange",
        updatedAt: UPDATED_AT,
        payoutStyle: "Reward balance inside Scrambly",
        minimumCashout: "Scrambly public pages advertise low-threshold cashout; verify the live threshold in account before starting",
        rewardOptions: "PayPal, gift cards, and crypto-style options are advertised on Scrambly public pages",
        accountFit: "Mobile users who want game and app discovery more than traditional desktop surveys",
        earningModes: ["Mobile game offers", "App testing", "Reward challenges", "Bonus tasks"],
        strengths: [
            "Modern, game-focused presentation.",
            "Good fit for mobile-first users comparing new app offers.",
            "Public pages emphasize PayPal and gift-card reward options.",
            "Useful as a second quote when another GPT site has the same game.",
        ],
        watchouts: [
            "Newer app-focused offers can be sensitive to install history and device tracking.",
            "Always confirm whether a game must be newly installed.",
            "Do not start multiple similar game offers at once if tracking proof matters.",
            "Referral codes and bonuses should be verified inside the live flow.",
        ],
        strategy: [
            "Use Scrambly for game discovery, then compare payout against Gain.gg, GemLoot, and KashKick.",
            "Start from a clean browser or app flow and do not interrupt the app-store redirect.",
            "Screenshot the offer detail page and every milestone completion screen.",
            "Cash out a small reward first so you understand the account review flow.",
        ],
        faq: [
            {
                question: "What is Scrambly best for?",
                answer: "Scrambly is best for mobile game and app discovery rewards, especially when you want to compare newer offers.",
            },
            {
                question: "Should I use a Scrambly referral code?",
                answer: "Only use one if the live signup flow clearly accepts it and the bonus terms are visible before you commit.",
            },
            {
                question: "How do I protect Scrambly tracking?",
                answer: "Click from Scrambly, complete the install immediately, avoid VPNs, keep screenshots, and do not reinstall games you played before.",
            },
        ],
        sources: [
            { label: "Scrambly official site", href: "https://scrambly.io/" },
            { label: "Scrambly app listing", href: "https://play.google.com/store/apps/details?id=com.scrambly&hl=en-US" },
        ],
    },
    {
        slug: "gain-gg",
        platformSlug: "gain-gg",
        name: "Gain.gg",
        status: "draft",
        title: "GAIN.GG Review: Offers, Surveys, Cashouts, and Rules to Know",
        description:
            "Source-backed EarnGrind review of GAIN.GG, covering public offers, surveys, withdrawals, coin value, support limits, and account-risk rules.",
        bestFor: "Users comparing public offers, surveys, and reward rules before signing up",
        verdict:
            "Based on the reviewed public pages, GAIN.GG is most useful for users who want a task-based rewards site with public game and app offers, surveys, multiple reward categories, and bonus surfaces like a leaderboard and Lucky Wheel. It is a weaker fit for users who need all survey inventory visible before sign-up, guaranteed payout timing, VPN or emulator use, or direct GAIN.GG staff resolution for every third-party offerwall credit issue.",
        screenshot: "/images/guides/gpt-sites/gain-gg/homepage.png",
        accent: "teal",
        updatedAt: "2026-05-14",
        payoutStyle: "Coins; the public FAQ says 1,000 coins equals $1.00 USD",
        minimumCashout: "Public Withdraw page says options start from as low as 500 coins; exact availability can vary",
        rewardOptions: "Homepage lists PayPal funds, crypto, virtual Visa cards, bank transfer, and gift cards",
        accountFit: "Users comfortable with offerwall-style tasks, strict anti-fraud rules, and source checking",
        earningModes: ["Games and app offers", "Surveys", "Offerwalls and tasks", "Videos", "Leaderboard and Lucky Wheel bonuses"],
        strengths: [
            "Public pages explain the coin model, withdrawal categories, timing expectations, support limits, and account rules before sign-up.",
            "The Offers and Earn pages show public game, app, and offerwall examples that users can inspect before committing.",
            "The FAQ gives specific rule and timing language around credits, withdrawals, VPNs, duplicate accounts, and manual reviews.",
            "Support channels are visible publicly, while the FAQ also makes clear that missing third-party offer credits usually go through the offerwall provider.",
        ],
        watchouts: [
            "Exact offer values, survey inventory, leaderboard values, Lucky Wheel state, and homepage trust metrics are dynamic and should be refreshed before final publication.",
            "The public Surveys page says users must sign in to view available surveys, so inventory cannot be fully audited from public pages.",
            "VPN, VPS, emulator, duplicate-account, and household-account rules are strict enough to matter before starting any offer.",
            "Account-specific withdrawal availability is not guaranteed by the public pages and may vary by region or account state.",
        ],
        strategy: [
            "Open the FAQ and Withdraw page before starting a major offer so the coin value, account rules, and reward caveats are clear.",
            "Record the provider name, offer page, visible requirements, deadline, payout, and completion proof for high-value or purchase-related tasks.",
            "Avoid VPNs, VPS services, emulators, duplicate accounts, and shared-account setups because the public FAQ flags them as ban risks.",
            "Treat leaderboard and Lucky Wheel activity as incidental upside; the offer route still needs to make sense on its own.",
            "Compare current Gain.gg routes on EarnGrind before installing a game or app, because public offer values can change.",
        ],
        faq: [
            {
                question: "What is GAIN.GG?",
                answer: "GAIN.GG is a GPT rewards site where users can earn rewards by completing tasks such as surveys, videos, app downloads, games, and offers, based on its public FAQ and homepage.",
            },
            {
                question: "How do you earn coins on GAIN.GG?",
                answer: "The public pages describe earning through games, surveys, offers, apps, and offerwalls. Survey inventory is not fully visible on the public Surveys page because it asks users to sign in to view available surveys.",
            },
            {
                question: "What are GAIN.GG coins worth?",
                answer: "GAIN.GG's public FAQ says every 1,000 coins is worth $1.00 USD.",
            },
            {
                question: "What withdrawal options does GAIN.GG list publicly?",
                answer: "The homepage names PayPal funds, crypto, virtual Visa cards, bank transfer, and gift cards. The Withdraw page says options start from as low as 500 coins and says gift card withdrawals are fee-free. Exact active options should be refreshed before publication because availability can change.",
            },
            {
                question: "How long do GAIN.GG rewards or withdrawals take?",
                answer: "The FAQ says most offer credits award within 5 minutes, rare offer-credit delays can take up to 48 hours, and withdrawals are typically processed within a few hours. It also says contacting support will not speed up withdrawal approval, and high-value or suspicious offers can be manually reviewed and held up to 90 days.",
            },
            {
                question: "Can you use a VPN with GAIN.GG?",
                answer: "No. The public FAQ says VPN, VPS, and emulator use is strictly prohibited and can result in a permanent ban.",
            },
            {
                question: "Who is GAIN.GG best for?",
                answer: "GAIN.GG looks best for users who want public offer browsing, games and apps, surveys, multiple reward categories, and bonus surfaces, and who can follow strict anti-fraud and offerwall rules.",
            },
            {
                question: "Who should avoid GAIN.GG?",
                answer: "Users should be cautious if they need guaranteed earnings, want to use VPNs or emulators, need survey inventory visible before login, or expect GAIN.GG staff to resolve all missing third-party offer credits directly.",
            },
        ],
        sources: [
            { label: "GAIN.GG homepage", href: "https://gain.gg/" },
            { label: "GAIN.GG earn page", href: "https://gain.gg/earn" },
            { label: "GAIN.GG offers page", href: "https://gain.gg/offers" },
            { label: "GAIN.GG surveys page", href: "https://gain.gg/surveys" },
            { label: "GAIN.GG withdraw page", href: "https://gain.gg/withdraw" },
            { label: "GAIN.GG FAQ", href: "https://gain.gg/faq" },
            { label: "GAIN.GG contact page", href: "https://gain.gg/contact" },
            { label: "GAIN.GG privacy policy", href: "https://gain.gg/privacy" },
            { label: "GAIN.GG terms", href: "https://gain.gg/terms" },
        ],
        primaryCtaLabel: "Compare current Gain.gg offers on EarnGrind",
        primaryCtaHref: "/best-gain-gg-offers",
        sidebarCtaLabel: "Browse EarnGrind's Gain.gg offer hub",
        sidebarCtaHref: "/offers/gain/us",
    },
    {
        slug: "gemsloot",
        platformSlug: "gemsloot",
        name: "GemLoot",
        title: "GemLoot Guide: Gaming Offerwalls, Rewards, Milestones, and Payout Checks",
        description:
            "A GemLoot guide for gaming-focused GPT users who want to compare offers, track milestones, avoid duplicate installs, and choose realistic payout routes.",
        bestFor: "Gaming offerwall backup routes",
        verdict:
            "GemLoot is best treated as a gaming offerwall comparison site. Use it when you want another quote for mobile games and app offers, but verify every provider term before installing because gaming routes can change quickly.",
        screenshot: "/images/guides/gpt-sites/gemsloot.png",
        accent: "violet",
        updatedAt: UPDATED_AT,
        payoutStyle: "GemLoot reward balance",
        minimumCashout: "Verify the live threshold in account before starting any long offer",
        rewardOptions: "Gaming, cash, and gift-card style rewards vary by live account and offer availability",
        accountFit: "Users who compare gaming offers across multiple walls before picking one install path",
        earningModes: ["Gaming offerwalls", "Mobile app offers", "Surveys", "Reward cases or bonus-style promos"],
        strengths: [
            "Useful for checking whether a game has a better alternate payout.",
            "Gaming-first positioning fits offerwall grinders.",
            "Can complement Gain.gg when comparing provider walls.",
            "Best used by users who already preserve screenshots and milestone proof.",
        ],
        watchouts: [
            "Offerwall availability and provider mix can shift.",
            "Duplicate installs can ruin tracking if you already played the game elsewhere.",
            "Small bonus mechanics can distract from the real hourly value of an offer.",
            "Support outcomes depend on provider evidence quality.",
        ],
        strategy: [
            "Search for the same game across GemLoot and other GPT sites before installing.",
            "Pick the route with the clearest deadline and strongest total payout, not just the biggest headline.",
            "Record provider name, offer ID if visible, milestone list, and country/device requirements.",
            "Cash out once early to understand the reward flow before pursuing larger offers.",
        ],
        faq: [
            {
                question: "Is GemLoot good for game offers?",
                answer: "Yes, its strongest use case is comparing gaming offer routes, but you still need to verify live terms before installing.",
            },
            {
                question: "Can I use GemLoot and Gain.gg together?",
                answer: "Yes. They are useful comparison points when deciding which provider route has the best payout and clearest terms.",
            },
            {
                question: "What screenshots matter on GemLoot?",
                answer: "Capture the provider name, total payout, milestone list, deadline, device and country rules, and completion confirmation screens.",
            },
        ],
        sources: [
            { label: "GemLoot official site", href: "https://gemsloot.com/" },
            { label: "GemLoot Lobby", href: "https://gemsloot.com/lobby" },
            { label: "GemLoot Rewards", href: "https://gemsloot.com/rewards" },
            { label: "GemLoot VIP information", href: "https://gemsloot.com/vip/info" },
        ],
    },
    {
        slug: "earnlab",
        platformSlug: "earnlab",
        name: "EarnLab",
        title: "EarnLab Guide: Boxes, Mines, Keno, Races, Offerwalls, and Rewards",
        description:
            "A deep EarnLab guide covering its earning side, dual wallet system, offerwall comparison workflow, surveys, races, mystery boxes, Mines, Keno, rewards, and withdrawals.",
        bestFor: "Gamified GPT users who want offers plus original games",
        verdict:
            "EarnLab is two products stitched together: a GPT earning platform where users earn Coins from offerwalls, surveys, tasks, referrals, and videos, and a separate games wallet for Boxes, Case Battles, Keno, Mines, and other coin-based games. The best user flow is to earn on the main side first, verify withdrawals, then treat the games section as a separate entertainment budget instead of mixing it with offer earnings.",
        screenshot: "/images/guides/gpt-sites/earnlab.png",
        accent: "teal",
        updatedAt: UPDATED_AT,
        payoutStyle: "Coins earned from tasks, surveys, offers, referrals, and game-wallet activity",
        minimumCashout: "EarnLab's guide lists 2,500 Coins ($2.50) for Main Balance withdrawal, $0.50 minimums for some crypto options, and PayPal from $5",
        rewardOptions: "Crypto, PayPal, Visa, gift cards, and reward-store options shown through EarnLab's rewards and withdraw pages",
        accountFit: "Users who enjoy offerwall earning with races, cases, and interactive original games",
        earningModes: ["Offerwalls", "Surveys", "Tasks", "Races", "Boxes", "Mines", "Keno"],
        strengths: [
            "More personality than a standard GPT site because rewards, races, and games are woven into the interface.",
            "Public Mines, Keno, and Boxes pages make the mechanics inspectable before signup.",
            "Live activity and race modules give the site an active, competitive feel.",
            "Offerwalls and surveys can fund the balance before a user considers any game-style feature.",
            "The official guide explains the Main Balance and Game Wallet separately, which removes a lot of first-withdrawal confusion.",
        ],
        watchouts: [
            "Mines, Keno, and Boxes introduce risk; treat them differently from normal task earnings.",
            "Game outcomes and multipliers are not a substitute for reliable GPT offer value.",
            "Withdraw methods and eligibility can vary, so check the live withdraw page first.",
            "Race and bonus incentives can push overactivity if users do not set limits.",
            "Game Wallet withdrawals have separate conditions from Main Balance withdrawals.",
        ],
        strategy: [
            "Start on Earn, Tasks, and Surveys until the Main Balance reaches a withdrawal test.",
            "Compare the same game or app across at least two offerwalls before starting; EarnLab's own guide says payout gaps can matter on high-value offers.",
            "For any offer worth $5 or more, screenshot the task page, requirements, completion screen, and support evidence.",
            "Withdraw a baseline amount before moving Coins into the Game Wallet.",
            "Treat Boxes, Mines, and Keno as a separate entertainment budget with a fixed stop point.",
            "Use race pages as a bonus overlay on offers you already wanted to complete, not as the reason to start a weak route.",
        ],
        faq: [
            {
                question: "What makes EarnLab different from a normal GPT site?",
                answer: "EarnLab combines standard earn pages with original games, mystery boxes, races, rewards, and live activity modules, so the experience feels more like a rewards arcade than a plain offer list.",
            },
            {
                question: "Are EarnLab Boxes, Mines, and Keno the same as completing offers?",
                answer: "No. Offers and surveys are earning tasks. Boxes, Mines, and Keno are game-style mechanics with risk. Set a fixed budget, understand the rules, and keep that balance separate from offer earnings.",
            },
            {
                question: "What is the first EarnLab screen to inspect?",
                answer: "Start with Earn, Tasks, Surveys, Rewards, and Withdraw. Then inspect Boxes, Mines, Keno, and Races only after you understand the account balance and cashout flow.",
            },
        ],
        sources: [
            { label: "EarnLab Mines", href: "https://earnlab.com/mines" },
            { label: "EarnLab Keno", href: "https://earnlab.com/keno" },
            { label: "EarnLab Boxes", href: "https://earnlab.com/boxes" },
            { label: "EarnLab Races", href: "https://earnlab.com/races" },
            { label: "EarnLab Rewards", href: "https://earnlab.com/rewards" },
            { label: "EarnLab mystery box guide", href: "https://earnlab.com/blog/best-mystery-box-sites" },
        ],
    },
];

export const GPT_SITE_FEATURE_AUDITS: Record<string, GptSiteFeatureAudit[]> = {
    kashkick: [
        {
            eyebrow: "Game missions",
            title: "Mobile game missions are the main payout hunt",
            image: "/images/guides/gpt-sites/features/precise/kashkick-games.png",
            imageAlt: "KashKick help page showing game mission instructions",
            summary:
                "KashKick's help center frames games as missions: pick a game you have never played, read requirements, install through KashKick, allow tracking, and complete goals on time.",
            mechanics: [
                "Game eligibility depends on being a new user for that game.",
                "The Games page supports search, filtering, sorting, and an Easy Play filter.",
                "Tracking permission is part of the official completion flow.",
            ],
            readerValue:
                "Use this screen before installing: confirm the game is new to you, copy the deadline and goals, allow tracking when prompted, then finish one route before starting another.",
        },
        {
            eyebrow: "Survey matching",
            title: "Surveys are fast balance builders when profiles are complete",
            image: "/images/guides/gpt-sites/features/precise/kashkick-surveys.png",
            imageAlt: "KashKick surveys help page with survey earning steps",
            summary:
                "KashKick uses survey profiles to match users to relevant surveys and shows time plus reward upfront so users can filter for better value.",
            mechanics: [
                "Survey rewards can be immediate.",
                "Prescreening is handled by survey providers, not KashKick.",
                "Honest profile answers matter because they affect matching quality.",
            ],
            readerValue:
                "Surveys are the low-commitment way to test the account: complete profiles, pick by time and payout, and cash out a small reward before committing to a long game.",
        },
        {
            eyebrow: "Deals and progress",
            title: "Deals need email matching, goal tracking, and patience",
            image: "/images/guides/gpt-sites/features/precise/kashkick-deals.png",
            imageAlt: "KashKick Deals help page showing deal requirements and tracking instructions",
            gallery: [
                {
                    image: "/images/guides/gpt-sites/features/precise/kashkick-deals.png",
                    imageAlt: "KashKick Deals help article",
                    caption: "Deals: terms can include purchases, clicks, app installs, time windows, and repeatability rules.",
                },
                {
                    image: "/images/guides/gpt-sites/features/precise/kashkick-progress.png",
                    imageAlt: "KashKick progress tracking help article",
                    caption: "Progress: in-progress and history screens are where users confirm goals are tracking.",
                },
            ],
            summary:
                "Outside KashKick reviews often praise the simple dollar balance but warn that high-paying offers depend on clean tracking. The official Deals docs confirm why: each deal has its own requirements, goals, supported devices, payout timing, and tracking path.",
            mechanics: [
                "Use the same email on the partner's site when the deal instructions require it; mismatched emails can delay or block payment.",
                "A deal can require a purchase, a click, an app install, a subscription trial, or a multi-day hold period.",
                "The In Progress and History tabs show where a deal sits after signup, including completed goals and pending status.",
                "Before starting, screenshot the deal card, key points, timeline, additional info, and payout amount.",
            ],
            readerValue:
                "Deals are worth checking when the payout is clear and the signup path is simple. Avoid deals where the terms are vague, the email requirement is unclear, or the waiting period is longer than the reward justifies.",
        },
        {
            eyebrow: "Cashout",
            title: "Kash Out is simple, but identity and payment-email details matter",
            image: "/images/guides/gpt-sites/features/precise/kashkick-cashout.png",
            imageAlt: "KashKick Kash Out help page showing withdrawal rules",
            summary:
                "Reviews commonly mention KashKick's $10 cashout as a strength. The official cashout flow adds the important details: available balance, identity verification, one pending request at a time, and correct PayPal or Venmo email.",
            mechanics: [
                "$10 Kash in Available Balance unlocks Kash Out.",
                "PayPal and Venmo require an active U.S.-based account and the correct payment email.",
                "KashRewards can provide gift cards, prepaid cards, or donations where available.",
                "Processing can take 1 to 3 business days, and deposits may come from Besitos or Tango.",
            ],
            readerValue:
                "Test cashout as soon as the account reaches the threshold. A small successful Kash Out proves verification, payment email, and processing before the user builds a much larger balance.",
        },
    ],
    swagbucks: [
        {
            eyebrow: "Reward store",
            title: "The rewards catalog is the planning screen",
            image: "/images/guides/gpt-sites/features/precise/swagbucks-rewards.png",
            imageAlt: "Swagbucks rewards store screenshot",
            summary:
                "Swagbucks exposes a deep rewards store with PayPal cash, Amazon, Walmart, gaming, travel, charity, Swagstakes, and sale filters.",
            mechanics: [
                "Rewards are grouped by value and category.",
                "The navigation includes Answer, Shop, Discover, Search, Play, and Rewards.",
                "Gift-card selection is broad enough that redemption planning matters.",
            ],
            readerValue:
                "Pick the reward first, then work backward. If PayPal or a specific gift card costs a certain amount of SB, every survey, shop trip, and Discover offer can be judged against that target.",
        },
        {
            eyebrow: "Shopping portal",
            title: "Shop is Swagbucks' underrated second engine",
            image: "/images/guides/gpt-sites/features/precise/swagbucks-shop.png",
            imageAlt: "Swagbucks shopping portal screenshot",
            summary:
                "The public shopping page highlights coupons, cashback-style rates, store pages, and seasonal promos, making Swagbucks more than a survey site.",
            mechanics: [
                "Store rates and coupons vary by merchant and promotion.",
                "Shopping trips need clean click tracking.",
                "Flash and seasonal deals can change the best earning path.",
            ],
            readerValue:
                "Shopping can beat surveys when it attaches rewards to purchases you already planned. Start the trip from Swagbucks, avoid coupon extensions that overwrite tracking, and save the merchant terms.",
        },
        {
            eyebrow: "Answer and Discover",
            title: "Surveys and Discover offers are useful only when the time math works",
            image: "/images/guides/gpt-sites/features/precise/swagbucks-answer.png",
            imageAlt: "Swagbucks paid surveys page screenshot",
            gallery: [
                {
                    image: "/images/guides/gpt-sites/features/precise/swagbucks-answer.png",
                    imageAlt: "Swagbucks paid surveys page",
                    caption: "Answer: surveys and polls are easy to start but need strict time filtering.",
                },
                {
                    image: "/images/guides/gpt-sites/features/precise/swagbucks-discover.png",
                    imageAlt: "Swagbucks Discover page screenshot",
                    caption: "Discover: partner offers can pay more, but tracking and terms are more important.",
                },
            ],
            summary:
                "Ranking reviews keep Swagbucks near the top because it has many earning surfaces. That breadth is also the trap: surveys, Discover, Shop, Search, Play, and Rewards all compete for time.",
            mechanics: [
                "Answer is best for short sessions where the reward and estimated time are visible before starting.",
                "Discover offers can pay better than surveys but may include trials, purchases, app installs, or delayed crediting.",
                "Search and polls are small add-ons, not the main hourly-value engine.",
                "The reward store gives the redemption target; the earning method is only good if it moves the account toward that target efficiently.",
            ],
            readerValue:
                "Use Swagbucks as a menu, not a to-do list. Pick the reward, compare Shop, Discover, Answer, and Play, then choose the route with the cleanest terms and best time-to-SB ratio.",
        },
        {
            eyebrow: "Play",
            title: "Play offers are different from casual Swagbucks games",
            image: "/images/guides/gpt-sites/features/precise/swagbucks-play.png",
            imageAlt: "Swagbucks games page screenshot",
            summary:
                "Competitor reviews often mention Swagbucks games, but the important distinction is casual game activity versus partner game offers. The visible Games page says award amounts are issued as SB, while partner offers can have multi-step conditions.",
            mechanics: [
                "Casual games are a lighter engagement surface.",
                "Partner game offers require a new install, a deadline, device compatibility, and milestone completion.",
                "The same mobile game may pay differently on Swagbucks, KashKick, Scrambly, Gain.gg, or GemLoot.",
                "Game installs should be compared before the first click because duplicate installs usually kill eligibility.",
            ],
            readerValue:
                "For games, Swagbucks is a quote to compare, not an automatic best route. Check the same title across the other GPT sites before installing.",
        },
    ],
    inboxdollars: [
        {
            eyebrow: "Games + scratch bar",
            title: "Free games can feed Scratch and Win progress",
            image: "/images/guides/gpt-sites/features/precise/inboxdollars-games.png",
            imageAlt: "InboxDollars games page screenshot",
            summary:
                "InboxDollars presents games as a casual earning surface, and its support docs say some free games can earn Scratch and Win bar progress.",
            mechanics: [
                "Free games may credit progress at different play intervals.",
                "The feature can vary by member and platform.",
                "Game offers still need app-store click and tracking discipline.",
            ],
            readerValue:
                "Free games are a light activity layer. Larger app offers are different: they require new installs, device tracking, deadlines, and milestone proof.",
        },
        {
            eyebrow: "Cash offers and signup flow",
            title: "InboxDollars is strongest when a cash offer has clean terms",
            image: "/images/guides/gpt-sites/features/precise/inboxdollars-surveys.png",
            imageAlt: "InboxDollars public signup and survey rewards page screenshot",
            summary:
                "Other reviews focus on InboxDollars' cash balance, signup bonus, paid emails, surveys, and Scratch and Win. The practical question is whether the offer has a clear payout and whether the account can reach the first cashout without getting stuck in low-value tasks.",
            mechanics: [
                "InboxDollars uses a dollar balance, which makes progress easier to understand than points.",
                "Cash offers can include signups, shopping, app installs, games, trials, or partner activities.",
                "PaidEmail and Scratch and Win are better treated as small bonus mechanics than dependable earners.",
                "The first cashout threshold and payment-account details matter more than the signup bonus headline.",
            ],
            readerValue:
                "Use InboxDollars for straightforward cash offers and surveys, then cash out as soon as eligible. Do not rely on Scratch and Win as a primary earnings plan.",
        },
        {
            eyebrow: "Payment friction",
            title: "The key InboxDollars risk is reaching cashout cleanly",
            image: "/images/guides/gpt-sites/inboxdollars.png",
            imageAlt: "InboxDollars homepage screenshot",
            summary:
                "Ranking reviews repeatedly mention payment threshold, slow tasks, and disqualification friction. That makes InboxDollars a site where users need to be selective instead of clicking every available activity.",
            mechanics: [
                "Prioritize offers that show a dollar amount, a clear completion action, and a realistic waiting period.",
                "Surveys can help fill gaps but often include disqualification time.",
                "Games and app offers need the same tracking proof as any other GPT route.",
                "Payment details should be checked before the balance reaches the threshold.",
            ],
            readerValue:
                "The best InboxDollars plan is boring on purpose: choose a few clear offers, avoid vague trials, use games only when the route is realistic, and request payment promptly.",
        },
    ],
    mypoints: [
        {
            eyebrow: "Shopping-first rewards",
            title: "MyPoints is strongest when it follows real shopping behavior",
            image: "/images/guides/gpt-sites/features/precise/mypoints-home.png",
            imageAlt: "MyPoints homepage screenshot",
            summary:
                "MyPoints positions itself around coupons, promo codes, shopping rewards, paid surveys, and gift-card redemption rather than only high-stakes app offers.",
            mechanics: [
                "Points can come from shopping, email offers, surveys, search, videos, travel, and games.",
                "Rewards are gift-card and certificate heavy.",
                "Shopping terms, exclusions, and pending points matter.",
            ],
            readerValue:
                "Use MyPoints where it naturally fits: shopping, groceries, travel, email offers, and gift-card redemptions. Only choose game offers when the payout beats your other GPT accounts.",
        },
        {
            eyebrow: "Rewards depth",
            title: "The redemption value is the real comparison point",
            image: "/images/guides/gpt-sites/features/precise/mypoints-about.png",
            imageAlt: "MyPoints about page screenshot",
            summary:
                "MyPoints emphasizes a flexible partner network: earn with many merchants, then redeem across a wide range of stores, restaurants, and travel partners.",
            mechanics: [
                "Redemption availability depends on non-pending point balance.",
                "Reward options can be filtered by gift cards or e-certificates.",
                "Gift-card value can beat cash only when it matches planned spending.",
            ],
            readerValue:
                "Compare the exact point cost of the reward you want. A high point payout is only attractive if it converts into a gift card you will actually use.",
        },
        {
            eyebrow: "Surveys and slow earn",
            title: "Surveys are filler; shopping is usually the main MyPoints reason",
            image: "/images/guides/gpt-sites/features/precise/mypoints-surveys.png",
            imageAlt: "MyPoints paid surveys page screenshot",
            summary:
                "External MyPoints reviews usually say the same thing: MyPoints is legitimate and broad, but point value varies and shopping is the strongest natural fit. Surveys can fill gaps, but they are not the reason MyPoints stands out.",
            mechanics: [
                "The public surveys page pitches gift cards for polls and survey answers.",
                "Survey availability and disqualification affect the real hourly value.",
                "Shopping rates can stack with planned purchases, which often makes the time cost much lower.",
                "Point value changes by reward, so a survey payout cannot be judged until the redemption target is known.",
            ],
            readerValue:
                "Use MyPoints as a shopping rewards account first. Surveys are best when they are short, clearly paid, and close the gap to a specific gift-card redemption.",
        },
    ],
    prizerebel: [
        {
            eyebrow: "Reward catalog",
            title: "PrizeRebel sells flexibility: PayPal, gift cards, crypto, and game codes",
            image: "/images/guides/gpt-sites/features/precise/prizerebel-rewards.png",
            imageAlt: "PrizeRebel rewards page screenshot",
            summary:
                "PrizeRebel's public pages focus on free paid surveys and more than 200 reward options, including PayPal cash, Bitcoin, gift cards, and gaming rewards.",
            mechanics: [
                "Points are earned from surveys and offers.",
                "Reward availability varies by country.",
                "Some digital gift cards can be delivered quickly after redemption.",
            ],
            readerValue:
                "PrizeRebel is most useful when its reward flexibility offsets survey friction. Track which survey routers qualify you, then redeem through the reward type with the least hassle in your country.",
        },
        {
            eyebrow: "Survey-first workflow",
            title: "PrizeRebel works best when you learn which surveys actually qualify",
            image: "/images/guides/gpt-sites/features/precise/prizerebel-home.png",
            imageAlt: "PrizeRebel homepage screenshot showing paid surveys and rewards",
            summary:
                "Most PrizeRebel reviews frame it as a long-running survey/GPT site with many reward options. The real user experience depends on qualification rate: two users can see the same catalog but get very different hourly value.",
            mechanics: [
                "Surveys and partner offers earn points that can be redeemed for cash-style rewards or gift cards.",
                "The public homepage highlights PayPal, Bitcoin, gift cards, and a simple sign-up flow.",
                "Survey routers vary by country, profile, and current demand.",
                "Reward flexibility is the strength; repeated survey disqualification is the main time sink.",
            ],
            readerValue:
                "Run PrizeRebel in short test sessions. If the account qualifies consistently, it can be a useful survey backup; if not, move to sites with stronger game or shopping value.",
        },
        {
            eyebrow: "Reward support",
            title: "The support page shows why PrizeRebel has broad redemption appeal",
            image: "/images/guides/gpt-sites/features/precise/prizerebel-support-rewards.png",
            imageAlt: "PrizeRebel support page listing reward options",
            summary:
                "PrizeRebel's support page lists gift cards, PayPal, Venmo in the U.S., bank transfer in the U.S., cryptocurrency, game codes, and mobile credits. This is broader than many casual survey sites.",
            mechanics: [
                "Gift cards cover major retailers and digital brands.",
                "Cash-style options can include PayPal, Venmo, and bank transfer depending on country.",
                "Crypto options add flexibility but also extra complexity.",
                "Game codes make PrizeRebel more interesting for users who redeem into gaming ecosystems.",
            ],
            readerValue:
                "Choose PrizeRebel when the reward catalog matches the way you already spend. A lower-paying survey can still be useful if it fills the last gap to a reward you actually want.",
        },
    ],
    scrambly: [
        {
            eyebrow: "Instant payout pitch",
            title: "Scrambly's Discover page is built around fast game selection",
            image: "/images/guides/gpt-sites/features/precise/scrambly-discover.png",
            imageAlt: "Scrambly homepage screenshot",
            summary:
                "Scrambly's Discover page is more like a mobile game catalog than a classic survey wall: categories, coin payouts, game genres, and popular routes are visible before a user commits.",
            mechanics: [
                "Gaming, Finance, Entertainment, Shopping, Services, and Deals categories are visible.",
                "Popular offers show large coin totals, which makes the first comparison quick.",
                "A game route still depends on install history, milestone clarity, and device tracking.",
                "Reviews focus heavily on Scrambly's low payout threshold, so the best first test is a small route that reaches withdrawal quickly.",
            ],
            readerValue:
                "Use Scrambly like a quick test: complete a small route, confirm the balance posts, then try withdrawal before spending days on a bigger game.",
        },
        {
            eyebrow: "Withdraw flow",
            title: "The withdraw page is part of the product promise",
            image: "/images/guides/gpt-sites/features/precise/scrambly-withdraw.png",
            imageAlt: "Scrambly withdraw page screenshot",
            summary:
                "Scrambly publicly routes users to a Withdraw page, reinforcing that payment speed and low-friction cashout are central to its pitch.",
            mechanics: [
                "Withdraw options should be checked before starting long offers.",
                "Bonus and affiliate pages can change the signup incentive.",
                "Game tracking remains the biggest risk despite low cashout friction.",
            ],
            readerValue:
                "Withdraw early once you qualify. A small successful cashout proves the account, reward method, and verification flow before you build a large pending balance.",
        },
        {
            eyebrow: "Bonus and referrals",
            title: "Scrambly's bonus page makes referral value easy to understand",
            image: "/images/guides/gpt-sites/features/precise/scrambly-bonus.png",
            imageAlt: "Scrambly affiliate and referral bonus page screenshot",
            summary:
                "Competitor reviews and user posts often talk about Scrambly's low cashout and bonus flow. The public Bonus page makes the referral logic explicit: inviter reward, referral reward, and leaderboard-style affiliate competition.",
            mechanics: [
                "The affiliate page shows an inviter bonus after a referred user completes their first withdrawal.",
                "Referral users can receive a bonus after earning the required coin amount.",
                "Affiliate leaders add a competitive layer, but the normal user value still depends on games and withdrawal speed.",
                "Bonus terms can change, so the live page is the only source to trust before signup.",
            ],
            readerValue:
                "Use bonuses as a boost, not the reason to pick a bad offer. The best Scrambly route is still a trackable game or app that reaches the $1+ withdrawal test quickly.",
        },
    ],
    "gain-gg": [
        {
            eyebrow: "Public earning flow",
            title: "The public pages show offers before sign-up, but exact values can move",
            image: "/images/guides/gpt-sites/gain-gg/homepage.png",
            imageAlt: "GAIN.GG homepage screenshot captured for EarnGrind research",
            gallery: [
                {
                    image: "/images/guides/gpt-sites/gain-gg/homepage.png",
                    imageAlt: "GAIN.GG homepage screenshot showing public earning categories",
                    caption: "Homepage: games, surveys, offers, apps, and reward categories are visible before login.",
                },
                {
                    image: "/images/guides/gpt-sites/gain-gg/earn-featured-offers.png",
                    imageAlt: "GAIN.GG earn page screenshot showing featured offers and offerwalls",
                    caption: "Earn page: featured offers and provider surfaces are public, but live values should be refreshed.",
                },
                {
                    image: "/images/guides/gpt-sites/gain-gg/offers-page.png",
                    imageAlt: "GAIN.GG offers page screenshot showing public game and app offers",
                    caption: "Offers page: game and app examples are visible enough to compare before starting.",
                },
            ],
            summary:
                "GAIN.GG exposes a useful amount of public offer context: the homepage explains broad earning categories, while the Earn and Offers pages show examples of games, apps, and provider-driven routes. Treat visible offer amounts as date-sensitive rather than permanent claims.",
            mechanics: [
                "Public pages support games, surveys, offers, apps, videos, and offerwall-style tasks.",
                "Offer examples can be inspected before login, but payout values and eligibility can change.",
                "Provider ownership matters because support and credit rules may sit with the offerwall.",
            ],
            readerValue:
                "Use GAIN.GG as a comparison target before installing an app or game. The useful decision is not whether an offer exists; it is whether the current provider, terms, payout, and proof requirements make sense.",
        },
        {
            eyebrow: "Surveys",
            title: "Survey inventory is partly login-gated",
            image: "/images/guides/gpt-sites/gain-gg/surveys-page.png",
            imageAlt: "GAIN.GG surveys page screenshot captured for EarnGrind research",
            summary:
                "The public Surveys page says surveys earn coins and are added daily from multiple providers, but it also tells users to sign in to view available surveys. That makes public survey-availability claims weaker than the offers evidence.",
            mechanics: [
                "Survey inventory was not fully visible from public pages during the audit.",
                "Survey availability can vary by account, geography, and provider matching.",
                "A review should explain the limitation instead of implying a fixed survey catalog.",
            ],
            readerValue:
                "Survey users should treat GAIN.GG as a site to test after signup, not as a guaranteed survey pipeline based only on public screenshots.",
        },
        {
            eyebrow: "Withdrawals",
            title: "The coin model is public, but account-level reward access still needs checking",
            image: "/images/guides/gpt-sites/gain-gg/withdraw-page.png",
            imageAlt: "GAIN.GG withdraw page screenshot captured for EarnGrind research",
            gallery: [
                {
                    image: "/images/guides/gpt-sites/gain-gg/withdraw-page.png",
                    imageAlt: "GAIN.GG withdraw page screenshot showing reward categories",
                    caption: "Withdraw page: public reward categories and low-threshold language are visible.",
                },
                {
                    image: "/images/guides/gpt-sites/gain-gg/faq-page.png",
                    imageAlt: "GAIN.GG FAQ screenshot showing coin value and timing rules",
                    caption: "FAQ: coin value, credit timing, withdrawal timing, and review caveats are stated publicly.",
                },
            ],
            summary:
                "GAIN.GG's FAQ says 1,000 coins equals $1.00 USD. The public Withdraw page says options start from as low as 500 coins and presents reward categories, while the homepage names PayPal funds, crypto, virtual Visa cards, bank transfer, and gift cards.",
            mechanics: [
                "Public coin value can be cited from the FAQ.",
                "Withdrawal methods and thresholds should be refreshed because availability can vary.",
                "The FAQ says withdrawals are typically processed within a few hours, but support contact will not speed approval.",
                "High-value or suspicious offers can be manually reviewed and held up to 90 days according to the FAQ.",
            ],
            readerValue:
                "Check the live Withdraw page before committing to a long route. A visible method is only useful if it is available and practical for the user's account.",
        },
        {
            eyebrow: "Rules and support",
            title: "The strongest guide angle is expectation-setting",
            image: "/images/guides/gpt-sites/gain-gg/faq-page.png",
            imageAlt: "GAIN.GG FAQ page screenshot captured for EarnGrind research",
            gallery: [
                {
                    image: "/images/guides/gpt-sites/gain-gg/faq-page.png",
                    imageAlt: "GAIN.GG FAQ screenshot showing account and credit rules",
                    caption: "FAQ: VPN, account, credit timing, and missing-credit expectations are stated directly.",
                },
                {
                    image: "/images/guides/gpt-sites/gain-gg/contact-support.png",
                    imageAlt: "GAIN.GG contact page screenshot showing support channels",
                    caption: "Contact page: live support, email, and Discord are listed as public support channels.",
                },
                {
                    image: "/images/guides/gpt-sites/gain-gg/privacy-offerwalls.png",
                    imageAlt: "GAIN.GG privacy page screenshot showing offerwall data notes",
                    caption: "Privacy page: third-party offerwall data collection and IP retention language matter for users.",
                },
                {
                    image: "/images/guides/gpt-sites/gain-gg/terms-risk-rules.png",
                    imageAlt: "GAIN.GG terms page screenshot showing account and age rules",
                    caption: "Terms page: minimum age, account, and coin limitation language should be checked before publishing.",
                },
            ],
            summary:
                "The best GAIN.GG review does more than list rewards. It should explain the account rules, support limits, third-party offerwall expectations, and privacy notes that affect whether a user should start a task.",
            mechanics: [
                "The public FAQ prohibits VPNs, VPS services, and emulators.",
                "Users are limited to one account, with one account per household stated in the FAQ.",
                "Missing third-party offer credits generally need to go through the offerwall provider.",
                "External offerwalls may collect additional data under their own privacy policies.",
            ],
            readerValue:
                "This is where EarnGrind can be more useful than a generic review: explain which rules can cost users their account or time before they chase a high-looking offer.",
        },
        {
            eyebrow: "Lucky Wheel",
            title: "Lucky Wheel evidence is real, but the live state is dynamic",
            image: "/images/guides/gpt-sites/gain-gg/lucky-wheel-page.png",
            imageAlt: "GAIN.GG Lucky Wheel page screenshot captured for EarnGrind research",
            summary:
                "The public Lucky Wheel page says users earn entries automatically by earning coins and that earning more can increase the chance of winning. Participant counts, prize state, and winner details are dynamic and should be refreshed before publication.",
            mechanics: [
                "The feature is tied to coin earning activity.",
                "More earning can increase chances according to the public page.",
                "Exact bonus amounts, participants, and winners should not be treated as evergreen.",
            ],
            readerValue:
                "Treat Lucky Wheel as possible upside from normal earning, not the reason to start a weak offer.",
        },
        {
            eyebrow: "Leaderboard",
            title: "Leaderboards show activity, not guaranteed value",
            image: "/images/guides/gpt-sites/gain-gg/leaderboard-page.png",
            imageAlt: "GAIN.GG leaderboard page screenshot captured for EarnGrind research",
            summary:
                "The public Leaderboard page shows daily and monthly views with earned-coin totals. That supports a claim that GAIN.GG has a public competitive bonus surface, but the exact values are time-sensitive.",
            mechanics: [
                "Leaderboard values can change during the active period.",
                "Visible earnings do not prove any specific route is easy or available to every user.",
                "Bonus motivation can push users toward low-quality grinding if offer math is ignored.",
            ],
            readerValue:
                "Use the leaderboard as activity context, then make the actual decision from provider terms, payout, deadline, and tracking proof.",
        },
    ],
    gemsloot: [
        {
            eyebrow: "Ascend",
            title: "Ascend bundles reward players for completing same-tier offers",
            image: "/images/guides/gpt-sites/features/precise/gemsloot-lobby.png",
            imageAlt: "GemLoot Lobby screenshot showing Ascend your Earnings and bundle cards",
            gallery: [
                {
                    image: "/images/guides/gpt-sites/features/precise/gemsloot-lobby.png",
                    imageAlt: "GemLoot Lobby showing Ascend your Earnings, Unlock Bundles, boosted offers, and chat",
                    caption: "Lobby: Ascend your Earnings sits beside Bundles and the current tournament card.",
                },
                {
                    image: "/images/guides/gpt-sites/features/precise/gemsloot-lobby-ascend.png",
                    imageAlt: "GemLoot reward bundle page showing app bundles and claim reward buttons",
                    caption: "Bundles view: app packs show required installs, step progress, and bonus value.",
                },
            ],
            summary:
                "GemLoot's Lobby exposes Ascend your Earnings as a Rewards card, then routes into bundle-style screens where users complete same-tier app or offer groups for a bonus.",
            mechanics: [
                "Ascend/Bundles cards show how many apps or steps are required before the reward can be claimed.",
                "Visible examples include iOS app bundles, GemsLoot game bundles, desktop bundles, and finance challenge packs.",
                "The bonus amount appears on the card, while progress text such as 0/1 steps or 0/2 steps shows what is still missing.",
                "Before starting, open each app in the bundle and confirm it is new to you, available on your device, and still tied to the same bonus card.",
            ],
            readerValue:
                "The clean way to use Ascend is to treat the bonus card like a checklist: screenshot the card, finish only the listed apps, watch the step counter move, then claim once the button becomes eligible.",
        },
        {
            eyebrow: "Offers, VIP, and live competition",
            title: "GemLoot makes offers feel like a live rewards lobby",
            image: "/images/guides/gpt-sites/features/precise/gemsloot-earn-offer-detail.png",
            imageAlt: "GemLoot earn page screenshot showing provider offers",
            gallery: [
                {
                    image: "/images/guides/gpt-sites/features/precise/gemsloot-earn-offer-detail.png",
                    imageAlt: "GemLoot Earn page showing provider offer cards and chat",
                    caption: "Earn: provider offers sit below live activity and chat.",
                },
                {
                    image: "/images/guides/gpt-sites/features/precise/gemsloot-leaderboard-race.png",
                    imageAlt: "GemLoot leaderboard page screenshot",
                    caption: "Leaderboard: users can compare progress and earnings against active members.",
                },
                {
                    image: "/images/guides/gpt-sites/features/precise/gemsloot-vip-benefits.png",
                    imageAlt: "GemLoot VIP page screenshot",
                    caption: "VIP: daily spins, boosts, bonuses, and raffle-style benefits shape the retention loop.",
                },
            ],
            summary:
                "GemLoot combines provider cards, boosted offers, tournaments, chat rain, VIP progress, leaderboards, and profile stats so earning feels social and game-like.",
            mechanics: [
                "Boosted offers show the base payout plus visible bonus percentages.",
                "The chat rail shows active users, chat rain, and recent messages, which makes the site feel alive.",
                "VIP progress is tied to earnings volume and unlocks extra reward mechanics.",
                "Leaderboards and tournaments reward activity, but the offer terms still determine whether a route is worth doing.",
            ],
            readerValue:
                "For a guest comparing sites, GemLoot is worth inspecting when a game has boosted payout, an Ascend/Bundles bonus, or a tournament overlay. The route is strongest when all three point to the same offer and the deadline is realistic.",
        },
    ],
    earnlab: [
        {
            eyebrow: "Main Balance",
            title: "EarnLab starts with Coins from offerwalls, tasks, surveys, and referrals",
            image: "/images/guides/gpt-sites/features/precise/earnlab-earn.png",
            imageAlt: "EarnLab Earn page screenshot showing offerwall earning routes",
            gallery: [
                {
                    image: "/images/guides/gpt-sites/features/precise/earnlab-earn.png",
                    imageAlt: "EarnLab Earn page with offerwall routes",
                    caption: "Earn: compare offerwalls before starting a high-value task.",
                },
                {
                    image: "/images/guides/gpt-sites/features/precise/earnlab-tasks.png",
                    imageAlt: "EarnLab Tasks page screenshot",
                    caption: "Tasks: app installs and sign-up offers can be faster than low-paying surveys.",
                },
                {
                    image: "/images/guides/gpt-sites/features/precise/earnlab-surveys.png",
                    imageAlt: "EarnLab Surveys page screenshot",
                    caption: "Surveys: complete profile data first to improve match quality.",
                },
            ],
            summary:
                "EarnLab's own 2026 guide separates earning Coins from using Coins. The earning side is the Main Balance: surveys, app downloads, sign-up offers, mobile games, videos, referrals, VIP bonuses, and offerwall tasks.",
            mechanics: [
                "Surveys connect to providers such as CPX Research, BitLabs, and PrimeSurveys, with typical individual survey payouts described around $0.10 to $1.50.",
                "App install and sign-up offers can range from small app installs to larger financial or crypto-platform signup rewards.",
                "Mobile game offers are third-party offerwall tasks, separate from EarnLab's own games section.",
                "The same offer can appear across multiple offerwalls at different payouts, so compare at least two walls before committing.",
                "Support evidence matters: for higher-value offers, keep screenshots of task requirements and completion confirmations.",
            ],
            readerValue:
                "The first EarnLab goal is not Mines or Boxes. It is proving the Main Balance: complete a clean task, watch Coins post, then test a withdrawal path before moving any Coins into game-wallet activity.",
        },
        {
            eyebrow: "Two wallet system",
            title: "Main Balance and Game Wallet are not the same thing",
            image: "/images/guides/gpt-sites/features/precise/earnlab-withdraw.png",
            imageAlt: "EarnLab Withdraw page screenshot",
            gallery: [
                {
                    image: "/images/guides/gpt-sites/features/precise/earnlab-withdraw.png",
                    imageAlt: "EarnLab Withdraw page showing cashout destination",
                    caption: "Withdraw: verify the current method, fee, and minimum before grinding.",
                },
                {
                    image: "/images/guides/gpt-sites/features/precise/earnlab-guide.png",
                    imageAlt: "EarnLab official 2026 earning system guide screenshot",
                    caption: "Official guide: EarnLab explains Main Balance and Game Wallet as separate systems.",
                },
            ],
            summary:
                "The most important EarnLab detail is the wallet split. Main Balance holds task, offer, survey, and referral earnings. Game Wallet is used for the games section and has its own unlock rules.",
            mechanics: [
                "EarnLab's guide lists 2,500 Coins as the Main Balance withdrawal threshold, equal to $2.50.",
                "Some crypto options are described with a $0.50 minimum and zero fee, while PayPal is described from $5 with a fee.",
                "The first withdrawal can go through manual review; later withdrawals may process faster once the account is trusted.",
                "Game Wallet withdrawals require separate eligibility, such as having enough Main Balance or meeting deposit/wager conditions.",
                "Moving Coins into games before understanding withdrawal rules is the common beginner mistake.",
            ],
            readerValue:
                "Use a simple rule: Main Balance is for earning and cashout proof; Game Wallet is for entertainment. Withdraw a baseline from Main Balance before testing Boxes, Keno, Mines, or Battles.",
        },
        {
            eyebrow: "Boxes",
            title: "Boxes turn the reward store into a case-opening experience",
            image: "/images/guides/gpt-sites/features/precise/earnlab-boxes.png",
            imageAlt: "EarnLab Boxes page screenshot",
            summary:
                "EarnLab's Boxes page lists mystery boxes by risk tags and prize pools, from low-risk boxes to high-value luxury and watch-themed mixes.",
            mechanics: [
                "Each box has a visible price, risk tag, and theme, so users can compare cheap boxes against higher-priced prize pools.",
                "Box contents are variable: the result can be smaller than the box cost, larger than the box cost, or a prize that must be handled through the site's reward flow.",
                "The right way to read a box is price first, prize list second, then risk label; the artwork is not the value calculation.",
                "Case Battles extend the box mechanic into a PvP format where users open the same case and the higher combined item value wins the pool.",
            ],
            readerValue:
                "Boxes are the flashy part of EarnLab. Enjoy them as a game mechanic after you understand the cost and possible outcomes; do not mix box spending with the money you need for offer tracking.",
        },
        {
            eyebrow: "Mines",
            title: "Mines is a 5x5 multiplier game with adjustable risk",
            image: "/images/guides/gpt-sites/features/precise/earnlab-mines.png",
            imageAlt: "EarnLab Mines page screenshot",
            summary:
                "EarnLab's Mines page lets users choose the number of hidden mines, reveal gems, build a multiplier, and cash out before hitting a mine.",
            mechanics: [
                "A lower mine count gives more safe tiles and slower multiplier growth; a higher mine count gives fewer safe tiles and a faster multiplier.",
                "Each safe gem reveal increases the cashout value. The round only becomes real profit if the user cashes out before selecting a mine.",
                "Manual mode lets users pick tiles themselves; auto mode exists for preset behavior, but presets do not remove the underlying risk.",
                "A disciplined Mines session means choosing a fixed bet amount, deciding the cashout point before the round, and stopping after a win or loss limit.",
            ],
            readerValue:
                "Mines is not an earning task like a survey or offer. It is a balance-risk game: low mines is slower and safer, high mines is faster and more volatile, and cashing out is the only way to lock a round.",
        },
        {
            eyebrow: "Keno",
            title: "Keno adds fast number-pick rounds to the GPT arcade",
            image: "/images/guides/gpt-sites/features/precise/earnlab-keno.png",
            imageAlt: "EarnLab Keno page screenshot",
            summary:
                "EarnLab's Keno page lets users pick numbers from 1 to 40, watch 10 numbers get drawn, and win based on matches.",
            mechanics: [
                "Selecting fewer numbers usually means fewer ways to match but simpler outcomes; selecting more numbers increases the number of possible hit combinations.",
                "Easy, Medium, and Hard settings change the payout/risk profile, so the same number picks can feel very different by difficulty.",
                "Random Pick is useful for speed, while Clear Table resets the board when a user wants to choose manually.",
                "Because rounds resolve quickly, the main skill is pacing: small bet, fixed stop point, and no chasing after a missed draw.",
                "EarnLab's guide frames Keno as adjustable by number selection, so conservative and aggressive users can choose different risk profiles.",
            ],
            readerValue:
                "Keno is the fast arcade layer. It is fun to inspect because the UI is clear, but the practical EarnGrind move is to keep it separate from offer earnings and use the rewards pages for actual cashout planning.",
        },
        {
            eyebrow: "Races and rewards",
            title: "Races make EarnLab feel active while rewards show the real destination",
            image: "/images/guides/gpt-sites/features/precise/earnlab-races.png",
            imageAlt: "EarnLab races page screenshot",
            gallery: [
                {
                    image: "/images/guides/gpt-sites/features/precise/earnlab-races.png",
                    imageAlt: "EarnLab monthly race page showing prize pool, timer, and leaders",
                    caption: "Races: prize pools, timers, and leaderboards reward active earning.",
                },
                {
                    image: "/images/guides/gpt-sites/features/precise/earnlab-rewards.png",
                    imageAlt: "EarnLab rewards page showing VIP rewards, Discord claim, and promo code area",
                    caption: "Rewards: VIP, Discord claim, promo codes, and redemption options are where earnings turn into value.",
                },
            ],
            summary:
                "EarnLab's race pages show prize pools, countdowns, points, and leaderboard positions, while the rewards page shows VIP progress, promo codes, and reward destinations.",
            mechanics: [
                "Races reward earning volume during a time window, so they are best treated as a bonus on offers you already wanted to complete.",
                "The leaderboard shows who is ahead, but the visible points do not tell you whether their underlying offers were easy or profitable.",
                "The rewards page shows cashout methods, community bonuses, promo codes, and VIP benefits before the user chases a race.",
                "EarnLab's guide describes daily and monthly leaderboards, including earning leaderboards and a games leaderboard, so race value depends on which side of the platform the user is active on.",
            ],
            readerValue:
                "Use races for motivation, not as the reason to start a bad offer. The better flow is rewards page first, offer math second, race progress third.",
        },
    ],
};

export const GPT_SITE_NAVIGATION_AUDITS: Record<string, GptSiteNavigationAudit> = {
    kashkick: {
        primary: ["Get Started", "Guide", "Support", "Games", "Deals", "Surveys"],
        standout: "KashKick's help navigation cleanly separates Games, Deals, and Surveys, which makes it easy to teach readers a step-by-step first route.",
    },
    swagbucks: {
        primary: ["Answer", "Shop", "Discover", "Search", "Play", "Rewards"],
        standout: "Swagbucks has the broadest public navigation, so the best guide structure is category-by-category instead of one generic verdict.",
    },
    inboxdollars: {
        primary: ["Games", "Surveys", "Cash Offers", "Payments", "Scratch and Win"],
        standout: "InboxDollars is strongest when the guide distinguishes cash offers from lighter free games and Scratch and Win progress.",
    },
    mypoints: {
        primary: ["Shopping", "Surveys", "Email offers", "Search", "Games", "Rewards"],
        standout: "MyPoints reads like a shopping-and-gift-card product first, so planned purchases and redemption math matter more than raw offer count.",
    },
    prizerebel: {
        primary: ["Surveys", "Offers", "Rewards", "PayPal", "Gift cards", "Crypto"],
        standout: "PrizeRebel's special angle is reward breadth for survey users, not a flashy arcade feature.",
    },
    scrambly: {
        primary: ["Discover", "Withdraw", "Bonus", "Games", "Apps", "Trustpilot reviews"],
        standout: "Scrambly puts Withdraw in the top nav, making payout speed part of the first impression.",
    },
    "gain-gg": {
        primary: ["Earn", "Offers", "Surveys", "Withdraw", "FAQ", "Contact", "Lucky Wheel", "Leaderboard"],
        standout: "GAIN.GG exposes enough public pages to explain the earning flow, coin value, withdrawals, support expectations, account rules, and bonus surfaces before sign-up.",
        gatedNote: "Survey inventory and account-specific withdrawal availability were not fully visible from public pages, so those claims should stay qualified until a login-approved audit is run.",
    },
    gemsloot: {
        primary: ["Earn", "Lobby", "Affiliates", "Leaderboard", "Rewards", "VIP"],
        standout: "GemLoot's notable differentiators are account-gated Ascend, VIP boosts, raffle tickets, and leaderboards.",
        gatedNote: "Ascend is visible from the public Lobby, but the actual offer eligibility and claim progress depend on the live Rewards flow in the user's account.",
    },
    earnlab: {
        primary: ["Earn", "Tasks", "Surveys", "Races", "Rewards", "Boxes", "Keno", "Mines", "Withdraw"],
        standout: "EarnLab has the richest public feature surface: original games, races, tasks, surveys, rewards, and withdraw navigation are visible before signup.",
    },
};

export const GPT_SITE_READER_INTERESTS: Record<string, string[]> = {
    kashkick: ["Which games track reliably", "How long rewards pend", "Whether $10 cashout is reachable", "Survey disqualification and profile setup"],
    swagbucks: ["Best SB redemption value", "PayPal versus gift cards", "Discover offer tracking", "Shopping cashback exclusions"],
    inboxdollars: ["First cashout threshold", "PayPal account matching", "Games versus cash offers", "Scratch and Win progress"],
    mypoints: ["Point value by reward", "Shopping tracking", "Gift-card catalog", "Whether games are worth doing here"],
    prizerebel: ["Survey qualification rate", "PayPal and crypto options", "Fast digital rewards", "Country-specific reward availability"],
    scrambly: ["$1+ payout promise", "Game tracking", "Bonus/referral flow", "How quickly withdrawals arrive"],
    "gain-gg": ["Coin value and withdrawal fit", "Public offers versus live values", "Survey inventory after sign-in", "VPN, account, and offerwall support rules"],
    gemsloot: ["Ascend and Bundles", "Boosted offers", "VIP perks and chat rain", "Whether a game route is realistic before installing"],
    earnlab: ["Main Balance vs Game Wallet", "First withdrawal threshold", "Offerwall payout comparison", "Boxes, Keno, Mines, Races, and VIP"],
};

export function getGptSiteGuide(slug: string) {
    return GPT_SITE_GUIDES.find((guide) => guide.slug === slug) ?? null;
}

export function isGptSiteGuidePublished(guide: GptSiteGuide) {
    return guide.status !== "draft";
}

export function getPublishedGptSiteGuides() {
    return GPT_SITE_GUIDES.filter(isGptSiteGuidePublished);
}

export function getGptSiteFeatureAudits(slug: string) {
    return GPT_SITE_FEATURE_AUDITS[slug] ?? [];
}

export function getGptSiteNavigationAudit(slug: string) {
    return GPT_SITE_NAVIGATION_AUDITS[slug] ?? null;
}

export function getGptSiteReaderInterests(slug: string) {
    return GPT_SITE_READER_INTERESTS[slug] ?? [];
}

export function getGptSitePlatform(guide: GptSiteGuide) {
    return platformBySlug.get(guide.platformSlug) ?? null;
}

export function getGptSiteTrackedHref(guide: GptSiteGuide, location: string) {
    const platform = getGptSitePlatform(guide);
    return platform ? buildTrackedPlatformHref(platform, location) : "/best-gpt-sites";
}
