import type { EarnGrindContentType } from "@/lib/content-routing";

export interface StaticGuide {
    title: string;
    slug: string;
    href: string;
    contentType: EarnGrindContentType;
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
        title: "Bid Wars 2 Offer Guide",
        slug: "bid-wars-2",
        href: "/guides/bid-wars-2",
        contentType: "offer_guide",
        indexLabel: "Bid Wars 2",
        initials: "BW",
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
