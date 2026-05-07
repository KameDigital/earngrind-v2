import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
    BadgeCheck,
    Banknote,
    ChevronRight,
    CircleDollarSign,
    Clock3,
    Coins,
    Gamepad2,
    Gift,
    LockKeyhole,
    MonitorSmartphone,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Star,
    Trophy,
    Users,
    Zap,
} from "lucide-react";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import { absoluteUrl } from "@/lib/site-url";

const PAGE_PATH = "/guides/fanduel-casino-review-bonus";
const PAGE_URL = absoluteUrl(PAGE_PATH);
const AFFILIATE_URL = "https://fndl.co/4hmshhm";
const CURRENT_OFFER = "500 Bonus Spins + up to $1,000 back in Casino Bonus on any first-day net loss";
const LAST_VERIFIED_DATE = "May 7, 2026";
const HERO_IMAGE_SRC = "/images/guides/fanduel-casino/fanduel-casino-bonus-review-hero.png";
const BONUS_BANNER_SRC = HERO_IMAGE_SRC;

const disclosureText =
    "EarnGrind may earn a commission if you sign up through links on this page. FanDuel Casino availability and promotions vary by state. 21+. Terms apply. Gambling problem? Call or text 1-800-GAMBLER.";

export const metadata: Metadata = {
    title: "FanDuel Casino Review: Bonus, Games, App Features & Promo Code",
    description:
        "See why FanDuel Casino is worth trying. Explore slots, live dealer games, app features, 500 Bonus Spins, and up to $1,000 back in Casino Bonus.",
    alternates: {
        canonical: PAGE_URL,
    },
    openGraph: {
        title: "FanDuel Casino Review: Games, Bonuses & App Features",
        description:
            "Explore FanDuel Casino's best features, including slots, live dealer games, jackpots, mobile app play, 500 Bonus Spins, and current casino bonus offers.",
        url: PAGE_URL,
        type: "article",
        images: [
            {
                url: BONUS_BANNER_SRC,
                width: 2048,
                height: 500,
                alt: "FanDuel Casino review bonus guide with slots, jackpots, live dealer action, and mobile app play",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "FanDuel Casino Review: Games, Bonuses & App Features",
        description:
            "Explore FanDuel Casino slots, live dealer games, jackpots, app features, 500 Bonus Spins, and current bonus offers.",
        images: [BONUS_BANNER_SRC],
    },
};

const bonusSteps = [
    "Join FanDuel Casino through the current offer link.",
    "Deposit $5 or more if required by the live promotion.",
    "500 Bonus Spins are added to your account in increments of 50 per day over your first 10 days.",
    "Play Bonus Spins on eligible Huff N' Puff Slot Games, including Huff N' Even More Puff Grand where available.",
    "Complete the 1X play through on Bonus Spins; any resulting winnings are yours to keep subject to FanDuel terms.",
];

const bonusTerms = [
    "Must not have previously placed any wager on FanDuel Sportsbook, FanDuel Casino, Betfair Casino, or Mohegan Sun Casino.",
    "Bonus Spins may only be used in the state of first deposit.",
    "Bonus Spins expire 7 days after receipt.",
    "The first-day bonus period begins when you make your first real-money wager and runs for 24 hours.",
    "If you are down after the first 24 hours of casino play, FanDuel may refund net losses as non-withdrawable Casino site credit up to $1,000.",
    "Casino site credit is automatically applied within 72 hours after the bonus period ends and expires 7 days after receipt.",
];

const trustBadges = [
    "21+ only",
    "Real-money casino games",
    "Slots, blackjack, roulette & live dealer",
    "Fast mobile signup",
    "Terms apply",
    "Availability varies by state",
];

const verdictRows = [
    ["Game Variety", "Excellent"],
    ["Mobile App", "Excellent"],
    ["Live Dealer Options", "Strong"],
    ["Beginner Friendliness", "Strong"],
    ["Bonus Potential", "Varies by state"],
    ["Trust Factor", "Strong brand recognition"],
];

const featureCards = [
    {
        title: "Huge Casino Game Variety",
        icon: Gamepad2,
        copy: "FanDuel Casino gives players a deep lobby of real-money casino games, from fast slots to familiar table games and live dealer rooms.",
    },
    {
        title: "Live Dealer Casino Tables",
        icon: Users,
        copy: "Play streamed tables with real dealers, real-time action, and a more social casino feel than standard digital tables.",
    },
    {
        title: "Popular Slots and Jackpot Games",
        icon: Coins,
        copy: "The FanDuel Casino slots lobby is built for quick browsing, bonus features, exclusive titles, and jackpot potential.",
    },
    {
        title: "Smooth Mobile App",
        icon: Smartphone,
        copy: "The FanDuel Casino app keeps categories, promos, banking, and favorites easy to reach on iOS and Android where available.",
    },
    {
        title: "Trusted FanDuel Brand",
        icon: ShieldCheck,
        copy: "FanDuel is one of the most recognizable names in U.S. real-money gaming, with regulated casino access where legal.",
    },
    {
        title: "Easy to Start Playing",
        icon: Zap,
        copy: "The account flow is simple: click the current offer, create an account, verify identity, deposit if required, and choose a game.",
    },
    {
        title: "Casino + Sportsbook Ecosystem",
        icon: Trophy,
        copy: "In eligible markets, FanDuel users can move between casino games and the broader FanDuel experience from one polished platform.",
    },
    {
        title: "Rewards and Promo Opportunities",
        icon: Gift,
        copy: "Depending on your state and timing, FanDuel Casino may show bonus spins, casino bonuses, referral-style offers, or limited-time promos.",
    },
];

const gameRows = [
    ["Slots", "Fast gameplay and bonus features", "Easy to play, huge variety, jackpot potential"],
    ["Blackjack", "Strategy players", "Classic casino feel with quick rounds"],
    ["Roulette", "Simple table-game action", "Easy to understand and exciting spins"],
    ["Baccarat", "Low-friction table play", "Straightforward betting choices and a sleek casino feel"],
    ["Craps", "Dice-game fans where available", "High-energy table action with many bet styles"],
    ["Video Poker", "Players who like draw-poker decisions", "Simple rounds with a blend of luck and choice"],
    ["Live Dealer", "Real casino atmosphere", "Real dealers streamed live"],
    ["Jackpots", "Bigger win potential", "Chance at larger prizes without guaranteed results"],
];

const gameCards = [
    ["Slots", "Quick-spin games, themed reels, bonus features, and jackpot potential."],
    ["Blackjack", "Classic table-game rhythm for players who like simple strategy decisions."],
    ["Roulette", "Easy-to-follow spins with red, black, number, and outside-bet options."],
    ["Baccarat", "A polished table option that is simple to learn and quick to play."],
    ["Craps", "Available in select markets, with dice-table energy from your phone."],
    ["Live Dealer", "Real dealers, live-streamed tables, and a stronger casino-floor feel."],
    ["Video Poker", "Fast rounds for players who enjoy poker-style hand decisions."],
    ["Jackpots", "Games built around larger prize potential and bigger moments."],
    ["Exclusive Games", "FanDuel-only or featured titles that help the lobby feel fresh."],
];

const previewCards = [
    ["App lobby preview", "Featured games, categories, promos, favorites, and quick access to top titles."],
    ["Slots category preview", "Browse new slots, popular picks, jackpot games, and bonus-feature titles."],
    ["Live dealer preview", "Jump into blackjack, roulette, baccarat, and other live tables where available."],
    ["Bonus/promo preview", "Check current casino offers before creating an account or depositing."],
];

const bestForCards = [
    ["Players who want a polished casino app", "FanDuel is built for quick navigation instead of clutter."],
    ["Slot fans who want variety", "The slots lobby is one of the main reasons to try FanDuel Casino."],
    ["Table game players", "Blackjack, roulette, baccarat, craps where available, and video poker give you more than reels."],
    ["Live dealer fans", "Real dealers and streamed tables bring more energy to phone play."],
    ["FanDuel Sportsbook users", "In eligible states, casino and sportsbook access can live in the same ecosystem."],
    ["Beginners who want a simple app", "The layout is straightforward, with categories that make the first session easier."],
];

const faqs = [
    {
        q: "Is FanDuel Casino worth signing up for?",
        a: "FanDuel Casino is worth checking out if you want a polished real-money casino app with slots, table games, live dealer options, jackpot potential, and a trusted U.S. gaming brand behind it. Offers vary by state, so check the current promotion before signing up.",
    },
    {
        q: "What games are on FanDuel Casino?",
        a: "FanDuel Casino games can include slots, blackjack, roulette, baccarat, craps where available, video poker, jackpot games, exclusive games, and live dealer tables. Game availability can vary by state and app version.",
    },
    {
        q: "Does FanDuel Casino have live dealer games?",
        a: "Yes. FanDuel live dealer casino games may include live blackjack, live roulette, live baccarat, and other streamed table games where available, with real dealers running the action in real time.",
    },
    {
        q: "Can I play FanDuel Casino on my phone?",
        a: "Yes. The FanDuel Casino app is designed for mobile play on supported iOS and Android devices in eligible states, with a lobby built around quick browsing, deposits, promos, and game categories.",
    },
    {
        q: "Is FanDuel Casino legit?",
        a: "FanDuel Casino operates in regulated U.S. markets where online casino gaming is legal. Real-money players must be 21+ and verify identity before playing.",
    },
    {
        q: "Does FanDuel Casino have a promo code?",
        a: "Many players search for a FanDuel Casino promo code, but FanDuel often uses tracked offer links instead of a traditional code box. The easiest route is to use the current FanDuel Casino offer link before creating your account.",
    },
    {
        q: "How do I claim the FanDuel Casino bonus?",
        a: "Click the current FanDuel Casino offer link, create your account, verify your identity, and follow the live offer instructions shown by FanDuel. Bonus requirements can vary by state, account history, and date.",
    },
    {
        q: "Is FanDuel Casino available in my state?",
        a: "FanDuel Casino availability varies by state. You must be physically located in an eligible state and meet FanDuel's age and verification requirements to play real-money casino games.",
    },
    {
        q: "Can I win real money on FanDuel Casino?",
        a: "FanDuel Casino offers real-money casino play in eligible states, so winnings are possible. Gambling involves risk, outcomes are not guaranteed, and you should only play with money you can afford to lose.",
    },
    {
        q: "What should I check before depositing?",
        a: "Check the current offer, eligible state rules, bonus requirements, wagering or qualifying-play requirements, expiration dates, game restrictions, deposit and withdrawal methods, and responsible gaming tools before depositing.",
    },
];

function CtaLink({
    label,
    eventLabel,
    location,
    className = "",
}: {
    label: string;
    eventLabel: string;
    location: string;
    className?: string;
}) {
    return (
        <TrackedOutboundLink
            href={AFFILIATE_URL}
            eventLabel={eventLabel}
            location={location}
            sourceContext="fanduel_casino_review_bonus"
            platformName="FanDuel Casino"
            rel="sponsored noopener noreferrer"
            className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1493ff] px-6 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(20,147,255,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(20,147,255,0.38)] focus:outline-none focus:ring-4 focus:ring-sky-200 ${className}`}
        >
            {label}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </TrackedOutboundLink>
    );
}

function SectionHeading({
    eyebrow,
    title,
    children,
}: {
    eyebrow?: string;
    title: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="mb-7">
            {eyebrow && (
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#1493ff]">
                    {eyebrow}
                </p>
            )}
            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {title}
            </h2>
            {children && <div className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{children}</div>}
        </div>
    );
}

function JsonLd() {
    const article = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "FanDuel Casino Review: Games, Bonuses, Live Dealer Action & Why It's Worth Trying",
        description:
            "A conversion-focused EarnGrind guide to FanDuel Casino games, app features, live dealer tables, 500 Bonus Spins, first-day Casino Bonus details, referral links, trust, and signup basics.",
        url: PAGE_URL,
        mainEntityOfPage: PAGE_URL,
        datePublished: "2026-05-04",
        dateModified: "2026-05-04",
        author: { "@type": "Organization", name: "EarnGrind" },
        publisher: { "@type": "Organization", name: "EarnGrind" },
    };

    const faq = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
                "@type": "Answer",
                text: item.a,
            },
        })),
    };

    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://earngrind.com" },
            { "@type": "ListItem", position: 2, name: "Guides", item: "https://earngrind.com/guides" },
            { "@type": "ListItem", position: 3, name: "FanDuel Casino Review", item: PAGE_URL },
        ],
    };

    return (
        <>
            {[article, faq, breadcrumb].map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
        </>
    );
}

export default function FanDuelCasinoReviewPage() {
    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <JsonLd />

            <section className="bg-slate-950 text-white">
                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                    <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white/70">
                        <Link href="/" className="hover:text-white">Home</Link>
                        <span>/</span>
                        <Link href="/guides" className="hover:text-white">Guides</Link>
                        <span>/</span>
                        <span className="text-white">FanDuel Casino Review</span>
                    </nav>
                </div>
                <div className="w-full overflow-hidden bg-slate-950">
                    <Image
                        src={HERO_IMAGE_SRC}
                        alt="FanDuel Casino review hero showing slots, jackpots, live dealer action, mobile app play, bonuses, and today's offer"
                        width={2048}
                        height={500}
                        priority
                        className="h-auto w-full"
                    />
                </div>
            </section>

            <section className="relative overflow-hidden bg-slate-950 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,147,255,0.24),transparent_32%),linear-gradient(135deg,#10233f_0%,#08111f_48%,#0a1f17_100%)]" />
                <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
                    <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
                        <div className="min-w-0">
                            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-sky-100">
                                <Sparkles className="h-4 w-4 text-[#44d17a]" aria-hidden="true" />
                                FanDuel Casino bonus guide
                            </div>
                            <h1 className="max-w-4xl break-words text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                                FanDuel Casino Review: Games, Bonuses, Live Dealer Action & Why It&apos;s Worth Trying
                            </h1>
                            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-200 sm:text-lg">
                                FanDuel Casino gives players a polished real-money casino app with slots,
                                blackjack, roulette, live dealer tables, jackpots, exclusive games, and a
                                simple mobile experience. See what makes it one of the top casino apps to try today.
                            </p>
                            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                                <CtaLink
                                    label="Claim the Current FanDuel Casino Offer"
                                    eventLabel="fanduel_casino_hero_cta"
                                    location="hero"
                                    className="w-full sm:w-auto"
                                />
                                <a
                                    href="#features"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-white/15 sm:w-auto"
                                >
                                    See FanDuel Casino Features
                                </a>
                            </div>
                            <p className="mt-4 max-w-2xl text-xs leading-5 text-slate-300">
                                EarnGrind may earn a commission if you sign up through links on this page.
                                Offers vary by state and date. 21+. Terms apply.
                            </p>
                        </div>
                        <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-xl backdrop-blur">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#44d17a]">New player offer</p>
                            <p className="mt-2 text-xl font-black text-white">500 Bonus Spins + up to $1,000 back</p>
                            <p className="mt-3 text-sm leading-6 text-slate-300">
                                Join FanDuel Casino, deposit $5+ if required, and check the live terms before your first wager.
                            </p>
                            <CtaLink
                                label="Join Now"
                                eventLabel="fanduel_casino_hero_card_join_now"
                                location="hero_offer_card"
                                className="mt-5 w-full"
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                        {trustBadges.map((badge) => (
                            <span
                                key={badge}
                                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-100"
                            >
                                {badge}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                        <div>
                            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#1493ff]">
                                Quick verdict
                            </p>
                            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                                Is FanDuel Casino Worth It?
                            </h2>
                            <p className="mt-4 text-base leading-7 text-slate-600">
                                Yes. FanDuel Casino is worth checking out if you want a polished online
                                casino app with a large game library, live dealer tables, popular slots,
                                jackpots, and a trusted brand behind the experience. It is especially
                                appealing for players who want a simple mobile casino app instead of a
                                cluttered, hard-to-use site.
                            </p>
                            <div className="mt-6">
                                <CtaLink
                                    label="Check Today's FanDuel Casino Offer"
                                    eventLabel="fanduel_casino_bonus_cta"
                                    location="quick_verdict"
                                />
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {verdictRows.map(([label, value]) => (
                                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                                        {label}
                                    </p>
                                    <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="features" className="py-14">
                    <SectionHeading eyebrow="Why play" title="Why FanDuel Casino Stands Out">
                        <p>
                            FanDuel Casino works because it feels like a modern app first and a casino lobby second.
                            You can move from a quick slot session to blackjack, roulette, live dealer tables,
                            or a jackpot game without digging through a confusing menu.
                        </p>
                    </SectionHeading>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {featureCards.map(({ title, icon: Icon, copy }) => (
                            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                <div className="mb-4 inline-flex rounded-2xl bg-sky-50 p-3 text-[#1493ff]">
                                    <Icon className="h-6 w-6" aria-hidden="true" />
                                </div>
                                <h3 className="text-base font-black text-slate-950">{title}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="py-6">
                    <SectionHeading eyebrow="Game library" title="FanDuel Casino Games You Can Play">
                        <p>
                            FanDuel Casino gives players access to a wide mix of real-money casino games,
                            from quick-spin slots to table games and live dealer rooms that feel closer to
                            a real casino experience. The best part is variety: you can keep sessions casual,
                            strategic, social, or jackpot-focused depending on what you want to play.
                        </p>
                    </SectionHeading>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {gameCards.map(([title, copy]) => (
                            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                    <Star className="h-5 w-5" aria-hidden="true" />
                                </div>
                                <h3 className="font-black text-slate-950">{title}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-full text-left text-sm md:min-w-[760px]">
                                <thead className="bg-slate-950 text-white">
                                    <tr>
                                        <th className="px-5 py-4 font-black">Game Type</th>
                                        <th className="px-5 py-4 font-black">Best For</th>
                                        <th className="px-5 py-4 font-black">Why Players Like It</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {gameRows.map(([type, bestFor, why]) => (
                                        <tr key={type} className="bg-white">
                                            <td className="px-5 py-4 font-black text-slate-950">{type}</td>
                                            <td className="px-5 py-4 text-slate-600">{bestFor}</td>
                                            <td className="px-5 py-4 text-slate-600">{why}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section className="py-14">
                    <div className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
                        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
                            <div>
                                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#44d17a]">
                                    Live casino
                                </p>
                                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                                    FanDuel Live Dealer Casino: Real Casino Energy From Your Phone
                                </h2>
                                <p className="mt-4 text-base leading-7 text-slate-200">
                                    The FanDuel live dealer casino is where the app starts to feel more
                                    immersive. Instead of only tapping through digital tables, you can join
                                    real-time streamed games with real dealers. Live blackjack, live roulette,
                                    live baccarat, and other table formats may be available depending on your state.
                                </p>
                                <p className="mt-4 text-base leading-7 text-slate-200">
                                    This is a strong fit if you like a real casino feel: dealers on camera,
                                    table pacing, card dealing, roulette spins, and the energy of a live room
                                    without leaving home.
                                </p>
                                <div className="mt-6">
                                    <CtaLink
                                        label="Try FanDuel Live Dealer Casino"
                                        eventLabel="fanduel_casino_live_dealer_cta"
                                        location="live_dealer"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    ["Real dealers", "Live hosts run the table in real time."],
                                    ["Live blackjack", "Classic card action with streamed dealing."],
                                    ["Live roulette", "Watch the wheel spin instead of only seeing a digital result."],
                                    ["Live baccarat", "A sleek table-game option for simple, fast decisions."],
                                ].map(([title, copy]) => (
                                    <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                                        <p className="font-black">{title}</p>
                                        <p className="mt-2 text-sm leading-6 text-slate-300">{copy}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-6">
                    <SectionHeading eyebrow="Mobile app" title="FanDuel Casino App: Built for Fast, Simple Play">
                        <p>
                            The FanDuel Casino app is one of the biggest reasons the brand belongs in the
                            best online casino app conversation. It is built for quick access: open the app,
                            browse a category, check promos, manage banking, and get into a game without
                            feeling buried in clutter.
                        </p>
                    </SectionHeading>
                    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="text-xl font-black text-slate-950">Why the app experience matters</h3>
                            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                                {[
                                    "Easy mobile access in eligible states.",
                                    "Quick navigation between slots, table games, live dealer, jackpots, and promos.",
                                    "Casino games on supported iOS and Android devices where available.",
                                    "Simple account flow and identity verification.",
                                    "Easy deposits and secure withdrawals where supported.",
                                    "Convenient play from home or on the go while physically located in an eligible state.",
                                ].map((item) => (
                                    <li key={item} className="flex gap-3">
                                        <BadgeCheck className="mt-0.5 h-5 w-5 flex-none text-emerald-600" aria-hidden="true" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {previewCards.map(([title, copy]) => (
                                <div key={title} className="min-h-[160px] rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-sky-50 p-5 shadow-sm">
                                    <MonitorSmartphone className="mb-4 h-7 w-7 text-[#1493ff]" aria-hidden="true" />
                                    <h3 className="font-black text-slate-950">{title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-14">
                    <div className="rounded-3xl border border-sky-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-xl">
                            <Image
                                src={BONUS_BANNER_SRC}
                                alt="FanDuel Casino review bonus guide showing slots, jackpots, live dealer action, mobile app play, and today's casino offer"
                                width={2048}
                                height={500}
                                unoptimized
                                className="h-auto w-full"
                                priority={false}
                            />
                        </div>
                        <div className="grid min-w-0 gap-7 lg:grid-cols-[1fr_0.75fr] lg:items-center">
                            <div className="min-w-0">
                                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#1493ff]">
                                    Bonus and promo
                                </p>
                                <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                                    FanDuel Casino Bonus: 500 Bonus Spins + Up to $1,000 Back
                                </h2>
                                <p className="mt-4 text-base leading-7 text-slate-600">
                                    The current FanDuel Casino bonus for new players is built around two strong
                                    hooks: 500 Bonus Spins to play on Huff N&apos; Even More Puff Grand and up to
                                    $1,000 back in Casino Bonus on any first-day net loss. That makes this one of
                                    the main FanDuel Casino promo code and FanDuel Casino sign up bonus searches
                                    worth checking before you create an account.
                                </p>
                                <p className="mt-4 text-base leading-7 text-slate-600">
                                    Current verified offer: <strong>{CURRENT_OFFER}</strong>. Last verified:{" "}
                                    <strong>{LAST_VERIFIED_DATE}</strong>. Offers vary by state, terms apply,
                                    and users should check the live FanDuel offer page before depositing because
                                    eligibility, games, timing, and bonus-credit rules can change.
                                </p>
                                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
                                        <h3 className="text-base font-black text-slate-950">How the 500 Bonus Spins work</h3>
                                        <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                                            {bonusSteps.map((step, index) => (
                                                <li key={step} className="flex gap-3">
                                                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#1493ff] text-xs font-black text-white">
                                                        {index + 1}
                                                    </span>
                                                    <span>{step}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                                        <h3 className="text-base font-black text-slate-950">First-day Casino Bonus details</h3>
                                        <p className="mt-3 text-sm leading-6 text-slate-700">
                                            If you are down after your first day, FanDuel may give you up to
                                            $1,000 back in non-withdrawable Casino site credit for net losses
                                            from your first 24 hours of casino play.
                                        </p>
                                        <p className="mt-3 text-sm leading-6 text-slate-700">
                                            The bonus period begins when you make your first real-money wager.
                                            Eligible Casino site credit is applied within 72 hours after the
                                            bonus period ends and expires 7 days after receipt.
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-5 text-xs leading-5 text-slate-500">
                                    Key terms: this offer is for eligible new players who have not previously
                                    wagered on FanDuel Sportsbook, FanDuel Casino, Betfair Casino, or Mohegan
                                    Sun Casino. Bonus Spins have 1X play through, may only be used in the state
                                    of first deposit, and expire 7 days after receipt.
                                </p>
                                <div className="mt-6">
                                    <CtaLink
                                        label="Join FanDuel Casino and Claim the Bonus"
                                        eventLabel="fanduel_casino_bonus_cta"
                                        location="bonus"
                                    />
                                </div>
                            </div>
                            <div className="min-w-0 rounded-3xl bg-slate-950 p-6 text-white">
                                <Gift className="h-8 w-8 text-[#44d17a]" aria-hidden="true" />
                                <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.18em] text-sky-100">
                                    Today&apos;s offer slot
                                </p>
                                <p className="mt-2 break-all text-xl font-black sm:text-2xl">{CURRENT_OFFER}</p>
                                <p className="mt-3 text-sm leading-6 text-slate-300">
                                    Join FanDuel Casino, deposit $5 or more if required, and check the live offer
                                    terms before your first real-money wager. Bonus Spins are issued 50 per day
                                    for 10 days and can be used on eligible Huff N&apos; Puff slot games.
                                </p>
                                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#44d17a]">
                                        Important bonus terms
                                    </p>
                                    <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-300">
                                        {bonusTerms.map((term) => (
                                            <li key={term} className="flex gap-2">
                                                <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#44d17a]" />
                                                <span>{term}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 py-6 lg:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <SectionHeading title="Does FanDuel Casino Have a Referral Code?" eyebrow="Referral search">
                            <p>
                                Many players search for a FanDuel Casino referral code, FanDuel Casino refer a friend,
                                or FanDuel Casino promo code. In practice, FanDuel often uses tracked links or referral
                                links instead of a traditional promo code box. The easiest path is to use the current
                                FanDuel offer link before creating your account.
                            </p>
                        </SectionHeading>
                        <CtaLink
                            label="Use the Current FanDuel Casino Link"
                            eventLabel="fanduel_casino_signup_cta"
                            location="referral_code"
                        />
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <SectionHeading title="How to Start Playing on FanDuel Casino" eyebrow="Signup">
                            <ol className="space-y-3 text-sm leading-6 text-slate-600">
                                {[
                                    "Click the current FanDuel Casino offer link.",
                                    "Create your account.",
                                    "Verify your identity.",
                                    "Deposit if required by the current offer.",
                                    "Choose a casino game and start playing in an eligible state.",
                                ].map((item, index) => (
                                    <li key={item} className="flex gap-3">
                                        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-sky-100 text-sm font-black text-[#1493ff]">
                                            {index + 1}
                                        </span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ol>
                        </SectionHeading>
                        <CtaLink
                            label="Start with FanDuel Casino"
                            eventLabel="fanduel_casino_signup_cta"
                            location="signup_steps"
                        />
                    </div>
                </section>

                <section className="py-14">
                    <SectionHeading eyebrow="Trust and safety" title="Is FanDuel Casino Legit?">
                        <p>
                            FanDuel Casino has the trust advantage that many smaller casino apps do not.
                            FanDuel is a major U.S. gaming brand, and FanDuel Casino operates in regulated
                            markets where available. Real-money casino gaming is state-regulated, users must
                            verify identity, and 21+ age rules apply.
                        </p>
                        <p>
                            That trust does not remove risk. Casino games are gambling, outcomes are not
                            guaranteed, and responsible gaming tools matter. Set limits, avoid chasing losses,
                            and only play with money you can afford to lose.
                        </p>
                    </SectionHeading>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            [ShieldCheck, "Regulated markets", "Real-money casino access only where online casino gaming is legal."],
                            [LockKeyhole, "Identity verification", "Players must verify account details before real-money play."],
                            [Banknote, "Secure banking", "Deposit and withdrawal options are handled through FanDuel where supported."],
                            [Clock3, "Responsible play", "Use limits, time checks, and help resources before gambling becomes a problem."],
                        ].map(([Icon, title, copy]) => {
                            const TrustIcon = Icon as typeof ShieldCheck;
                            return (
                                <div key={title as string} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <TrustIcon className="mb-4 h-6 w-6 text-emerald-600" aria-hidden="true" />
                                    <h3 className="font-black text-slate-950">{title as string}</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{copy as string}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="py-6">
                    <SectionHeading eyebrow="Best fit" title="Who Should Try FanDuel Casino?" />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {bestForCards.map(([title, copy]) => (
                            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="font-black text-slate-950">{title}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="grid gap-6 py-14 lg:grid-cols-2">
                    <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
                        <h2 className="text-2xl font-black text-slate-950">FanDuel Casino Pros</h2>
                        <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                            {[
                                "Strong brand recognition.",
                                "Large casino game selection.",
                                "Slots, table games, live dealer, and jackpots.",
                                "Smooth mobile app.",
                                "Real-money gameplay in eligible states.",
                                "Promo opportunities may be available.",
                                "Good for beginners and experienced players.",
                            ].map((item) => (
                                <li key={item} className="flex gap-3">
                                    <BadgeCheck className="mt-0.5 h-5 w-5 flex-none text-emerald-600" aria-hidden="true" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">
                        <h2 className="text-2xl font-black text-slate-950">FanDuel Casino Cons</h2>
                        <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                            {[
                                "Not available in every state.",
                                "Offers vary by location.",
                                "Bonus terms must be checked before depositing.",
                                "Gambling involves risk and users should play responsibly.",
                            ].map((item) => (
                                <li key={item} className="flex gap-3">
                                    <CircleDollarSign className="mt-0.5 h-5 w-5 flex-none text-amber-600" aria-hidden="true" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="py-6">
                    <SectionHeading eyebrow="FAQ" title="FanDuel Casino Review FAQs" />
                    <div className="divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        {faqs.map((item) => (
                            <details key={item.q} className="group p-5 open:bg-slate-50">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-black text-slate-950">
                                    {item.q}
                                    <ChevronRight className="h-5 w-5 flex-none text-slate-400 transition group-open:rotate-90" aria-hidden="true" />
                                </summary>
                                <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">{item.a}</p>
                            </details>
                        ))}
                    </div>
                </section>

                <section className="py-14">
                    <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-[#10233f] to-[#0d3824] p-6 text-white shadow-xl sm:p-8 lg:p-10">
                        <div className="grid gap-8 lg:grid-cols-[1fr_0.55fr] lg:items-center">
                            <div>
                                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#44d17a]">
                                    Final step
                                </p>
                                <h2 className="text-3xl font-black tracking-tight">Ready to Try FanDuel Casino?</h2>
                                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">
                                    If you want a polished casino app with slots, table games, live dealer action,
                                    jackpots, and a trusted brand behind it, FanDuel Casino is one of the first
                                    places worth checking. Use the link below to see the current offer available
                                    in your state before you sign up.
                                </p>
                                <p className="mt-4 text-xs leading-5 text-slate-300">
                                    21+. Terms apply. Availability varies by state. Gambling problem? Call or text 1-800-GAMBLER.
                                </p>
                            </div>
                            <div className="lg:text-right">
                                <CtaLink
                                    label="Claim the Current FanDuel Casino Offer"
                                    eventLabel="fanduel_casino_final_cta"
                                    location="final_cta"
                                    className="w-full sm:w-auto"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="pb-8 text-sm leading-6 text-slate-600">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="font-bold text-slate-950">Disclosure and responsible gaming</p>
                        <p className="mt-2">{disclosureText}</p>
                        <p className="mt-3">
                            Internal resources: browse more <Link href="/guides" className="font-bold text-[#1493ff] underline">EarnGrind guides</Link>,
                            compare <Link href="/offers" className="font-bold text-[#1493ff] underline">current offers</Link>, and read our{" "}
                            <Link href="/legal/disclosure" className="font-bold text-[#1493ff] underline">affiliate disclosure</Link>.
                        </p>
                        <p className="mt-3 text-xs text-slate-500">
                            Official source notes used for feature claims: FanDuel Casino game lobby pages, FanDuel Casino 101 live dealer information, and FanDuel responsible gaming materials. Verify live game availability, state eligibility, and promotion terms directly with FanDuel before depositing.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs">
                            <a href="https://casino.fanduel.com/" target="_blank" rel="noopener noreferrer nofollow" className="font-bold text-slate-700 underline">
                                FanDuel Casino official site
                            </a>
                            <a href="https://www.fanduel.com/casino-101/live-dealer/" target="_blank" rel="noopener noreferrer nofollow" className="font-bold text-slate-700 underline">
                                FanDuel live dealer guide
                            </a>
                            <a href="https://fanduel.com/about/news/fanduel-expands-suite-of-responsible-gaming-tools-with-introduction-of-my-spend" target="_blank" rel="noopener noreferrer nofollow" className="font-bold text-slate-700 underline">
                                FanDuel responsible gaming tools
                            </a>
                        </div>
                    </div>
                </section>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
                <CtaLink
                    label="Claim FanDuel Casino Offer"
                    eventLabel="fanduel_casino_sticky_mobile_cta"
                    location="sticky_mobile"
                    className="w-full"
                />
            </div>
        </main>
    );
}
