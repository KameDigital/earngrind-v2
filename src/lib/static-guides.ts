export interface StaticGuide {
    title: string;
    slug: string;
    href: string;
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
        title: "World of Warships Torox Offer Guide",
        slug: "world-of-warships-torox-offer-guide",
        href: "/guides/world-of-warships-torox-offer-guide",
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
