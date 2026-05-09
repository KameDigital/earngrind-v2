export type FanDuelGameCategory =
    | "slots"
    | "table-games"
    | "live-dealer"
    | "jackpot"
    | "video-poker"
    | "exclusive";

export type FanDuelGame = {
    id: string;
    name: string;
    slug: string;
    category: FanDuelGameCategory;
    provider?: string;
    imageUrl?: string;
    imageSourceUrl?: string;
    imageSourceLabel?: string;
    animatedMediaUrl?: string;
    animatedMediaSourceUrl?: string;
    animatedMediaSourceLabel?: string;
    fallbackGradient?: string;
    fallbackIcon?: string;
    shortDescription: string;
    tags: string[];
    featured: boolean;
    popularityRank?: number;
    affiliateUrl?: string;
    ctaUrl?: string;
    legalNote?: string;
};

export const FANDUEL_CASINO_AFFILIATE_URL = "https://fndl.co/4hmshhm";

export const FANDUEL_GAMES: FanDuelGame[] = [
    {
        id: "huff-n-more-puff",
        name: "Huff N' More Puff",
        slug: "huff-n-more-puff",
        category: "slots",
        provider: "Light & Wonder",
        imageUrl: "/images/guides/fanduel-casino/games/huff-n-more-puff.jpg",
        imageSourceUrl: "https://casino.fanduel.com/game/huff-n-even-more-puff",
        imageSourceLabel: "FanDuel Casino public game page",
        animatedMediaUrl: "https://animatedtrailer.casino.fanduel.com/uploads/HuffNMorePuffVegasMatt1080p-video-trailer.mp4",
        animatedMediaSourceUrl: "https://casino.fanduel.com/c/slots",
        animatedMediaSourceLabel: "FanDuel Casino slots category trailer payload",
        fallbackGradient: "linear-gradient(135deg, #08111f 0%, #164e8f 46%, #12b7d6 100%)",
        fallbackIcon: "SLOTS",
        shortDescription: "A bonus-feature slot family tied to the current FanDuel Casino bonus-spin offer where available.",
        tags: ["Slots", "Bonus Spins", "Promo Eligible"],
        featured: true,
        popularityRank: 1,
        ctaUrl: FANDUEL_CASINO_AFFILIATE_URL,
        legalNote: "Bonus Spin eligibility and eligible games vary by state and live offer terms.",
    },
    {
        id: "divine-fortune",
        name: "Divine Fortune",
        slug: "divine-fortune",
        category: "jackpot",
        provider: "NetEnt",
        imageUrl: "/images/guides/fanduel-casino/games/divine-fortune.jpg",
        imageSourceUrl: "https://casino.fanduel.com/game/divine-fortune-ant",
        imageSourceLabel: "FanDuel Casino public game page",
        animatedMediaUrl: "https://animatedtrailer.casino.fanduel.com/uploads/DivineFortune1080p-video-trailer.mp4",
        animatedMediaSourceUrl: "https://casino.fanduel.com/c/slots",
        animatedMediaSourceLabel: "FanDuel Casino slots category trailer payload",
        fallbackGradient: "linear-gradient(135deg, #101827 0%, #14532d 46%, #f8c34a 100%)",
        fallbackIcon: "JACKPOT",
        shortDescription: "A well-known jackpot-style slot for players who like bigger prize potential without guaranteed results.",
        tags: ["Jackpot", "Slots", "Popular"],
        featured: true,
        popularityRank: 2,
        ctaUrl: FANDUEL_CASINO_AFFILIATE_URL,
        legalNote: "Jackpot availability varies by state and current FanDuel Casino lobby.",
    },
    {
        id: "88-fortunes",
        name: "88 Fortunes",
        slug: "88-fortunes",
        category: "slots",
        provider: "Light & Wonder",
        imageUrl: "/images/guides/fanduel-casino/games/88-fortunes.jpg",
        imageSourceUrl: "https://casino.fanduel.com/game/88-fortunes",
        imageSourceLabel: "FanDuel Casino public game page",
        animatedMediaUrl: "https://animatedtrailer.casino.fanduel.com/uploads/88Fortunes-gameplay-trailer.mp4",
        animatedMediaSourceUrl: "https://casino.fanduel.com/c/slots",
        animatedMediaSourceLabel: "FanDuel Casino slots category trailer payload",
        fallbackGradient: "linear-gradient(135deg, #270a0a 0%, #b91c1c 48%, #facc15 100%)",
        fallbackIcon: "88",
        shortDescription: "A familiar slot title built around quick spins, bonus features, and a bright casino feel.",
        tags: ["Slots", "Bonus Features", "Popular"],
        featured: true,
        popularityRank: 3,
        ctaUrl: FANDUEL_CASINO_AFFILIATE_URL,
    },
    {
        id: "wheel-of-fortune",
        name: "Wheel of Fortune",
        slug: "wheel-of-fortune",
        category: "slots",
        provider: "IGT",
        imageUrl: "/images/guides/fanduel-casino/games/wheel-of-fortune.jpg",
        imageSourceUrl: "https://casino.fanduel.com/game/wheel-of-fortune-ruby-riches",
        imageSourceLabel: "FanDuel Casino public game page",
        animatedMediaUrl: "https://animatedtrailer.casino.fanduel.com/uploads/WheelofFortuneSpins2XWilds-gameplay-trailer.mp4",
        animatedMediaSourceUrl: "https://casino.fanduel.com/c/slots",
        animatedMediaSourceLabel: "FanDuel Casino slots category trailer payload",
        fallbackGradient: "linear-gradient(135deg, #111827 0%, #1d4ed8 46%, #f59e0b 100%)",
        fallbackIcon: "WHEEL",
        shortDescription: "A recognizable slot franchise for players who want a polished, prize-wheel style experience.",
        tags: ["Slots", "Brand Title", "Bonus Features"],
        featured: true,
        popularityRank: 4,
        ctaUrl: FANDUEL_CASINO_AFFILIATE_URL,
    },
    {
        id: "white-rabbit",
        name: "White Rabbit",
        slug: "white-rabbit",
        category: "slots",
        provider: "Big Time Gaming",
        imageUrl: "/images/guides/fanduel-casino/games/white-rabbit.webp",
        imageSourceUrl: "https://www.bigtimegaming.com/news/white-rabbit-slot-exclusive-launch-tomorrow",
        imageSourceLabel: "Big Time Gaming public game article",
        fallbackGradient: "linear-gradient(135deg, #06101f 0%, #4c1d95 48%, #38bdf8 100%)",
        fallbackIcon: "SLOT",
        shortDescription: "A feature-heavy slot pick for players who like lively themes and bonus-round potential.",
        tags: ["Slots", "Megaways", "Bonus Features"],
        featured: false,
        popularityRank: 5,
        ctaUrl: FANDUEL_CASINO_AFFILIATE_URL,
    },
    {
        id: "blackjack-classic",
        name: "Blackjack Classic",
        slug: "blackjack-classic",
        category: "table-games",
        imageUrl: "/images/guides/fanduel-casino/games/blackjack-classic.jpg",
        imageSourceUrl: "https://casino.fanduel.com/c/blackjack",
        imageSourceLabel: "FanDuel Casino blackjack category page",
        animatedMediaUrl: "https://animatedtrailer.casino.fanduel.com/uploads/VegasMattBlackjack1080p-video-trailer.mp4",
        animatedMediaSourceUrl: "https://casino.fanduel.com/c/blackjack",
        animatedMediaSourceLabel: "FanDuel Casino blackjack category trailer payload",
        fallbackGradient: "linear-gradient(135deg, #061a12 0%, #047857 48%, #111827 100%)",
        fallbackIcon: "21",
        shortDescription: "A straightforward blackjack table for players who want familiar casino card action.",
        tags: ["Blackjack", "Table Games", "Strategy"],
        featured: true,
        popularityRank: 6,
        ctaUrl: FANDUEL_CASINO_AFFILIATE_URL,
    },
    {
        id: "zappit-blackjack",
        name: "Zappit Blackjack",
        slug: "zappit-blackjack",
        category: "table-games",
        imageUrl: "/images/guides/fanduel-casino/games/zappit-blackjack.jpg",
        imageSourceUrl: "https://casino.fanduel.com/c/blackjack",
        imageSourceLabel: "FanDuel Casino blackjack category page",
        animatedMediaUrl: "https://animatedtrailer.casino.fanduel.com/uploads/VegasMattBlackjack1080p-video-trailer.mp4",
        animatedMediaSourceUrl: "https://casino.fanduel.com/c/blackjack",
        animatedMediaSourceLabel: "FanDuel Casino blackjack category trailer payload",
        fallbackGradient: "linear-gradient(135deg, #082f49 0%, #0ea5e9 46%, #111827 100%)",
        fallbackIcon: "BJ",
        shortDescription: "A blackjack variant for players who want a faster table-game twist.",
        tags: ["Blackjack", "Table Games", "Variant"],
        featured: false,
        popularityRank: 7,
        ctaUrl: FANDUEL_CASINO_AFFILIATE_URL,
    },
    {
        id: "multi-hand-blackjack",
        name: "Multi-hand Blackjack",
        slug: "multi-hand-blackjack",
        category: "table-games",
        imageUrl: "/images/guides/fanduel-casino/games/multi-hand-blackjack.jpg",
        imageSourceUrl: "https://casino.fanduel.com/c/blackjack",
        imageSourceLabel: "FanDuel Casino blackjack category page",
        animatedMediaUrl: "https://animatedtrailer.casino.fanduel.com/uploads/FanDuelLiveDealerBlackjack1080p-video-trailer.mp4",
        animatedMediaSourceUrl: "https://casino.fanduel.com/c/blackjack",
        animatedMediaSourceLabel: "FanDuel Casino blackjack category trailer payload",
        fallbackGradient: "linear-gradient(135deg, #172554 0%, #2563eb 48%, #0f172a 100%)",
        fallbackIcon: "MULTI",
        shortDescription: "A blackjack option for players who like managing multiple hands in one session.",
        tags: ["Blackjack", "Multi-hand", "Table Games"],
        featured: false,
        popularityRank: 8,
        ctaUrl: FANDUEL_CASINO_AFFILIATE_URL,
    },
    {
        id: "american-roulette",
        name: "American Roulette",
        slug: "american-roulette",
        category: "table-games",
        imageUrl: "/images/guides/fanduel-casino/games/american-roulette.jpg",
        imageSourceUrl: "https://casino.fanduel.com/c/roulette",
        imageSourceLabel: "FanDuel Casino roulette category page",
        animatedMediaUrl: "https://animatedtrailer.casino.fanduel.com/uploads/RedDoorRoulette1080p-video-trailer.mp4",
        animatedMediaSourceUrl: "https://casino.fanduel.com/c/roulette",
        animatedMediaSourceLabel: "FanDuel Casino roulette category trailer payload",
        fallbackGradient: "linear-gradient(135deg, #111827 0%, #991b1b 50%, #0f5132 100%)",
        fallbackIcon: "ROULETTE",
        shortDescription: "A classic roulette option for players who want simple table-game action and exciting spins.",
        tags: ["Roulette", "Table Games", "Classic"],
        featured: true,
        popularityRank: 9,
        ctaUrl: FANDUEL_CASINO_AFFILIATE_URL,
    },
    {
        id: "video-poker",
        name: "Video Poker",
        slug: "video-poker",
        category: "video-poker",
        imageUrl: "/images/guides/fanduel-casino/games/video-poker.jpg",
        imageSourceUrl: "https://casino.fanduel.com/game/game-king-video-poker-aig",
        imageSourceLabel: "FanDuel Casino public game page",
        fallbackGradient: "linear-gradient(135deg, #0f172a 0%, #4338ca 48%, #f8fafc 100%)",
        fallbackIcon: "POKER",
        shortDescription: "A quick casino staple for players who like poker-style hand decisions and fast rounds.",
        tags: ["Video Poker", "Cards", "Fast Play"],
        featured: false,
        popularityRank: 10,
        ctaUrl: FANDUEL_CASINO_AFFILIATE_URL,
    },
];
