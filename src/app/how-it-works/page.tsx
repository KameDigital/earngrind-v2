import { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";

export const metadata: Metadata = {
    title: "How EarnGrind Works — Find & Compare Offerwall Payouts",
    description: "EarnGrind automatically tracks offerwall game tasks across Swagbucks, Freecash, InboxDollars, and more. Here's exactly how we find, compare, and present the data.",
    robots: { index: true, follow: true },
};

const STEPS = [
    {
        number: "01",
        title: "We track every major offerwall",
        body: "Our ingestion pipeline monitors Swagbucks, Freecash, InboxDollars, Gain.gg, and other top GPT sites — capturing mobile game task payouts across hundreds of active offers, updated daily.",
    },
    {
        number: "02",
        title: "We match offers to games",
        body: "Each offer is linked to a specific mobile game. When the same game appears on multiple platforms at different payouts, we group them together so you can compare at a glance.",
    },
    {
        number: "03",
        title: "We surface the highest payout",
        body: "On every game page, we highlight the best-paying platform at the top. No sorting required — just visit the game, see the number, and start earning.",
    },
    {
        number: "04",
        title: "We write completion guides",
        body: "For popular offers, our guides walk you through exactly how to hit each milestone efficiently — so you complete the task faster and don't miss a single payout trigger.",
    },
    {
        number: "05",
        title: "You decide — we don't push you anywhere",
        body: "We show the data. You choose the platform and the game. No hidden algorithms promoting specific sites. If there's an affiliate relationship, it's disclosed on the page.",
    },
];

const FAQS = [
    {
        q: "Is EarnGrind free?",
        a: "Yes, always. We never charge users for access to payout data, guides, or comparisons.",
    },
    {
        q: "How current is the data?",
        a: "Payout data is refreshed daily via our ingestion pipeline. Some platforms update their offers more frequently than others — always confirm the final amount on the platform before starting.",
    },
    {
        q: "Does EarnGrind have affiliate links?",
        a: "Some links to platforms are affiliate links. We earn a small commission if you sign up — at no cost to you and with no impact on your payout. All affiliate relationships are disclosed.",
    },
    {
        q: "Can I trust the payout numbers?",
        a: "We pull data directly from public offerwall listings. Numbers are as accurate as the source allows, but payouts can change. Use EarnGrind to identify opportunities, then verify the live amount on the platform.",
    },
];

export default function HowItWorksPage() {
    return (
        <div className="bg-[var(--surface-muted)] min-h-screen">

            {/* ── Hero ── */}
            <section className="bg-white border-b border-[var(--border-default)] py-16 sm:py-20">
                <Container>
                    <nav className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] font-medium mb-8">
                        <Link href="/" className="hover:text-lime-700 transition-colors">Home</Link>
                        <span>/</span>
                        <span>How It Works</span>
                    </nav>
                    <div className="max-w-2xl">
                        <p className="section-label mb-3">How It Works</p>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--brand-ink)] tracking-tight mb-4 leading-tight">
                            From offerwall listing<br className="hidden sm:block" /> to your pocket — fast
                        </h1>
                        <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                            EarnGrind automatically monitors, matches, and ranks offerwall game tasks so
                            you always know where the highest payout is — without manually checking six
                            different sites.
                        </p>
                    </div>
                </Container>
            </section>

            {/* ── Steps ── */}
            <section className="py-16">
                <Container>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-8">The Process</h2>
                    <div className="space-y-4">
                        {STEPS.map(({ number, title, body }) => (
                            <div key={number} className="bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] p-6 flex gap-5 items-start">
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--brand-lime)] flex items-center justify-center">
                                    <span className="text-xs font-extrabold text-[var(--brand-ink)]">{number}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-[var(--brand-ink)] mb-1.5">{title}</h3>
                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Container>
            </section>

            {/* ── FAQ ── */}
            <section className="py-4 pb-20">
                <Container>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-8">Common Questions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
                        {FAQS.map(({ q, a }) => (
                            <div key={q} className="bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] p-5">
                                <p className="font-bold text-sm text-[var(--brand-ink)] mb-2">{q}</p>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{a}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 flex flex-wrap gap-3">
                        <Link
                            href="/offers"
                            className="px-5 py-2.5 bg-[var(--brand-ink)] text-[var(--brand-lime)] font-extrabold text-sm rounded-xl hover:-translate-y-px transition-all"
                        >
                            Browse Offers →
                        </Link>
                        <Link
                            href="/guides"
                            className="px-5 py-2.5 bg-white border border-[var(--border-default)] text-[var(--text-secondary)] font-semibold text-sm rounded-xl hover:border-lime-300 hover:text-lime-700 transition-all"
                        >
                            View Guides
                        </Link>
                    </div>
                </Container>
            </section>
        </div>
    );
}
