import type { EarnGrindContentType } from "@/lib/content-routing";

export interface StaticGuide {
    title: string;
    slug: string;
    href: string;
    contentType: EarnGrindContentType;
    gameSlug?: string;
    imageUrl?: string | null;
    indexLabel?: string;
    initials?: string;
    difficulty?: "easy" | "medium" | "hard" | null;
    estimatedTime?: string | null;
    maxPayoutUsd?: number | null;
    eyebrow: string;
    description: string;
    ctaLabel: string;
    accentClassName: string;
    buttonClassName: string;
    lastModified: string;
    sitemapPriority: number;
}

export const STATIC_GUIDES: StaticGuide[] = [
    {
        title: "Raid: Shadow Legends Offer Guide",
        slug: "raid-shadow-legends",
        href: "/guides/raid-shadow-legends",
        contentType: "offer_guide",
        indexLabel: "Raid: Shadow Legends",
        initials: "RS",
        imageUrl: "/images/guides/gpt-sites/gain-gg.png",
        difficulty: "hard",
        estimatedTime: "60 days",
        maxPayoutUsd: 361.695,
        eyebrow: "New Gain.gg Android guide",
        description:
            "Complete the Raid: Shadow Legends Gain.gg Android offer, plan 361,695 points, track purchases, Sacred Shards, Champion ranks, and Level 70 proof.",
        ctaLabel: "Read Raid Guide",
        accentClassName: "border-red-200 bg-red-50 text-red-800",
        buttonClassName: "bg-slate-950 text-red-100",
        lastModified: "2026-05-30",
        sitemapPriority: 0.82,
    },
    {
        title: "MU Dark Epoch Offer Guide",
        slug: "mu-dark-epoch",
        href: "/guides/mu-dark-epoch",
        contentType: "offer_guide",
        indexLabel: "MU: Dark Epoch",
        initials: "MU",
        difficulty: "hard",
        estimatedTime: "30 days",
        maxPayoutUsd: 576.862,
        eyebrow: "New Torox Android guide",
        description:
            "Complete the MU: Dark Epoch Torox offer, plan 576,862 points, time Diamonds and Month Cards, and protect level 440 proof.",
        ctaLabel: "Read MU Dark Epoch Guide",
        accentClassName: "border-teal-200 bg-teal-50 text-teal-800",
        buttonClassName: "bg-slate-950 text-lime-200",
        lastModified: "2026-05-27",
        sitemapPriority: 0.82,
    },
    {
        title: "Woodoku Blast Offer Guide",
        slug: "woodoku-blast",
        href: "/guides/woodoku-blast",
        contentType: "offer_guide",
        indexLabel: "Woodoku Blast",
        initials: "WB",
        difficulty: "hard",
        estimatedTime: "30 days",
        maxPayoutUsd: 293.71,
        eyebrow: "New Torox Journey guide",
        description:
            "Complete the Woodoku Blast Torox offer, earn up to $293.71, track Journey levels, time the $4.99 purchase, and protect high-value proof.",
        ctaLabel: "Read Woodoku Blast Guide",
        accentClassName: "border-lime-200 bg-lime-50 text-lime-800",
        buttonClassName: "bg-slate-950 text-lime-200",
        lastModified: "2026-05-27",
        sitemapPriority: 0.82,
    },
    {
        title: "Solitaire Stash Offer Guide",
        slug: "solitaire-stash",
        href: "/guides/solitaire-stash",
        contentType: "offer_guide",
        indexLabel: "Solitaire Stash",
        initials: "SS",
        difficulty: "hard",
        estimatedTime: "No fixed limit",
        maxPayoutUsd: 607.02,
        eyebrow: "New Lootably cash tournament guide",
        description:
            "Complete the Solitaire Stash Lootably offer, track up to 1,000 cash tournament wins, avoid purchase risk, and prepare missing-credit proof.",
        ctaLabel: "Read Solitaire Stash Guide",
        accentClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
        buttonClassName: "bg-slate-950 text-emerald-200",
        lastModified: "2026-05-26",
        sitemapPriority: 0.82,
    },
    {
        title: "Infinite Lagrange Offer Guide",
        slug: "infinite-lagrange-star-hunter",
        href: "/guides/infinite-lagrange-star-hunter",
        contentType: "offer_guide",
        indexLabel: "Infinite Lagrange",
        initials: "IL",
        difficulty: "hard",
        estimatedTime: "30 days",
        maxPayoutUsd: 117.55,
        eyebrow: "New Android strategy offer",
        description:
            "Complete the Infinite Lagrange Star Hunter Torox offer, earn up to $117.55, and track purchases, Control Center, Battle Pass, and alliance tasks.",
        ctaLabel: "Read Infinite Lagrange Guide",
        accentClassName: "border-cyan-200 bg-cyan-50 text-cyan-800",
        buttonClassName: "bg-slate-950 text-cyan-200",
        lastModified: "2026-05-25",
        sitemapPriority: 0.82,
    },
    {
        title: "Bid Wars 2 Offer Guide",
        slug: "bid-wars-2",
        href: "/guides/bid-wars-2",
        contentType: "offer_guide",
        indexLabel: "Bid Wars 2",
        initials: "BW",
        imageUrl: "https://play-lh.googleusercontent.com/NJsfTLl3zPgNQKF2FxZu7a-XjREnxsDI2gHTeixHaHiI9fL9SBLOsRLE1CEidyeYhruk=w240-h480",
        difficulty: "medium",
        estimatedTime: "7 days",
        maxPayoutUsd: 20.11,
        eyebrow: "New Android offer guide",
        description:
            "Complete the Bid Wars 2 Torox offer, earn up to $20.11, track vaults, auctions, ads, quests, and the purchase tier.",
        ctaLabel: "Read Bid Wars 2 Guide",
        accentClassName: "border-amber-200 bg-amber-50 text-amber-800",
        buttonClassName: "bg-slate-950 text-amber-200",
        lastModified: "2026-05-23",
        sitemapPriority: 0.82,
    },
    {
        title: "World of Warships Torox Offer Guide",
        slug: "world-of-warships-torox-offer-guide",
        href: "/guides/world-of-warships-torox-offer-guide",
        contentType: "offer_guide",
        gameSlug: "world-of-warships",
        imageUrl: "/images/guides/world-of-warships/world-of-warships-hero-background.webp",
        eyebrow: "New desktop offer guide",
        description:
            "Complete the World of Warships Torox offer, earn up to 10,692 points, unlock two warships, and avoid tracking mistakes.",
        ctaLabel: "Read World of Warships Guide",
        accentClassName: "border-cyan-200 bg-cyan-50 text-cyan-800",
        buttonClassName: "bg-slate-950 text-lime-300",
        lastModified: "2026-05-14",
        sitemapPriority: 0.82,
    },
    {
        title: "FanDuel Casino Review",
        slug: "fanduel-casino-review-bonus",
        href: "/guides/fanduel-casino-review-bonus",
        contentType: "platform_review",
        imageUrl: "/images/guides/fanduel-casino/fanduel-casino-bonus-review-hero.png",
        eyebrow: "New casino app guide",
        description:
            "Review FanDuel Casino games, app features, live dealer tables, bonuses, promo code searches, and signup steps.",
        ctaLabel: "Read FanDuel Casino Review",
        accentClassName: "border-sky-200 bg-sky-50 text-sky-700",
        buttonClassName: "bg-[#1493ff] text-white",
        lastModified: "2026-05-09",
        sitemapPriority: 0.82,
    },
];
