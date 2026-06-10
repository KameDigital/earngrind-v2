import { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";

export const metadata: Metadata = {
    title: "About EarnGrind — The Offerwall Intelligence Platform",
    description: "EarnGrind tracks hundreds of mobile game offers across every major GPT site. We test every platform personally so you can find the highest payouts without the guesswork.",
    robots: { index: true, follow: true },
};

const STATS = [
    { value: "500+", label: "Offers Tracked" },
    { value: "10+", label: "Platforms Covered" },
    { value: "Daily", label: "Data Updates" },
    { value: "Free", label: "Always" },
];

const PILLARS = [
    {
        emoji: "🔍",
        title: "We Research",
        body: "We monitor every major GPT site and offerwall — Swagbucks, Freecash, InboxDollars, Gain.gg, and more — capturing payout data across hundreds of mobile game tasks.",
    },
    {
        emoji: "⚖️",
        title: "We Compare",
        body: "For every game, we surface the best-paying platform so you never leave money on the table. One game, multiple platforms, ranked by real payout.",
    },
    {
        emoji: "✍️",
        title: "We Guide",
        body: "Our step-by-step game guides walk you through exactly how to complete offers efficiently — hitting milestones in the right order to maximize your earn.",
    },
    {
        emoji: "🚫",
        title: "No Paid Rankings",
        body: "Platforms don't pay us to rank higher. Our data is pulled directly from offerwall listings, not editorial opinion. What you see is what the market actually pays.",
    },
];

const FOUNDER_TWITTER_URL = process.env.NEXT_PUBLIC_FOUNDER_TWITTER?.trim() || "#";

export default function AboutPage() {
    return (
        <div className="bg-[var(--surface-muted)] min-h-screen">

            {/* ── Hero ── */}
            <section className="bg-white border-b border-[var(--border-default)] py-16 sm:py-20">
                <Container>
                    <nav className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] font-medium mb-8">
                        <Link href="/" className="hover:text-lime-700 transition-colors">Home</Link>
                        <span>/</span>
                        <span>About</span>
                    </nav>
                    <div className="max-w-2xl">
                        <p className="section-label mb-3">About</p>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--brand-ink)] tracking-tight mb-4 leading-tight">
                            The smartest way to find<br className="hidden sm:block" /> high-paying offerwall tasks
                        </h1>
                        <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                            EarnGrind tracks hundreds of mobile game offers across every major GPT site.
                            We test each platform personally and update payout data daily — so you spend
                            less time hunting and more time earning.
                        </p>
                        <section className="mt-8 eg-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)]">
                                <picture className="block h-full w-full">
                                    <source srcSet="/Logo_No_Text.png" type="image/png" />
                                    <img
                                        src="/Logo_No_Text.png"
                                        alt="Kame, founder of EarnGrind"
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </picture>
                            </div>
                            <div className="min-w-0">
                                <p className="section-label mb-1">Founder / Author</p>
                                <h2 className="text-lg font-extrabold text-[var(--brand-ink)]">Kame</h2>
                                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                                    Kame built EarnGrind after comparing mobile game offers across GPT sites and seeing how often the same task paid differently by platform. The goal is to make offer discovery more transparent, practical, and easier to verify before users spend time on a grind.
                                </p>
                                <a
                                    href={FOUNDER_TWITTER_URL}
                                    className="mt-3 inline-flex text-xs font-extrabold text-lime-700 hover:text-lime-800"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    Founder profile →
                                </a>
                            </div>
                        </section>
                    </div>
                </Container>
            </section>

            {/* ── Stats strip ── */}
            <section className="bg-[var(--brand-ink)] py-10">
                <Container>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                        {STATS.map(({ value, label }) => (
                            <div key={label}>
                                <div className="text-2xl font-extrabold text-[var(--brand-lime)]">{value}</div>
                                <div className="text-xs font-semibold text-white/60 mt-1 uppercase tracking-wider">{label}</div>
                            </div>
                        ))}
                    </div>
                </Container>
            </section>

            {/* ── What we do ── */}
            <section className="py-16">
                <Container>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-8">How We Work</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {PILLARS.map(({ emoji, title, body }) => (
                            <div key={title} className="bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] p-6">
                                <div className="text-2xl mb-3">{emoji}</div>
                                <h3 className="font-bold text-[var(--brand-ink)] mb-2">{title}</h3>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </Container>
            </section>

            {/* ── Mission statement ── */}
            <section className="py-8 pb-20">
                <Container>
                    <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] p-8 max-w-2xl">
                        <h2 className="text-lg font-extrabold text-[var(--brand-ink)] mb-3">Our commitment</h2>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                            We believe earning online shouldn&apos;t require navigating a minefield of
                            inflated promises and outdated data. EarnGrind exists to bring transparency
                            to the offerwall ecosystem — showing exactly how much each game task pays,
                            on which platform, right now.
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                            We don&apos;t accept payment to promote specific platforms. Affiliate relationships
                            we do have are disclosed clearly on every page and never influence our data or rankings.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href="/offers"
                                className="px-5 py-2.5 bg-[var(--brand-ink)] text-[var(--brand-lime)] font-extrabold text-sm rounded-xl hover:-translate-y-px transition-all"
                            >
                                Browse Offers →
                            </Link>
                            <Link
                                href="/legal/disclosure"
                                className="px-5 py-2.5 bg-white border border-[var(--border-default)] text-[var(--text-secondary)] font-semibold text-sm rounded-xl hover:border-lime-300 hover:text-lime-700 transition-all"
                            >
                                Affiliate Disclosure
                            </Link>
                        </div>
                    </div>
                </Container>
            </section>
        </div>
    );
}
