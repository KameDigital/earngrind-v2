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
        title: "FanDuel Casino Review",
        slug: "fanduel-casino-review-bonus",
        href: "/guides/fanduel-casino-review-bonus",
        eyebrow: "New casino app guide",
        description:
            "Review FanDuel Casino games, app features, live dealer tables, bonuses, promo code searches, and signup steps.",
        ctaLabel: "Read FanDuel Casino Review",
        accentClassName: "border-sky-200 bg-sky-50 text-sky-700",
        buttonClassName: "bg-[#1493ff] text-white",
        lastModified: "2026-05-04",
        sitemapPriority: 0.82,
    },
];
