import type { Metadata } from "next";
import Link from "next/link";
import {
    ShieldCheck,
    Zap,
    DollarSign,
    CheckCircle2,
    HelpCircle,
    ArrowRight,
    TrendingUp,
    Layers,
    Lock,
    Clock,
    Award
} from "lucide-react";
import Container from "@/components/layout/Container";
import { RevenuePageView } from "@/components/analytics/RevenueEventTracker";
import { buildBreadcrumbList, buildItemList, JsonLd } from "@/lib/seo-schema";
import { canonicalAlternates } from "@/lib/seo-metadata";
import { GPT_AFFILIATE_PLATFORMS } from "@/lib/gpt-affiliate-platforms";
import { PLATFORM_REVIEWS, SHARED_REVIEW_FAQS } from "@/lib/platform-reviews-data";
import GptPlatformMatrix, { type GptPlatformItem } from "@/components/gpt-sites/GptPlatformMatrix";
import { supabase } from "@/lib/supabase/public";

export const revalidate = 3600;

export const metadata: Metadata = {
    title: "Best GPT Sites 2026: Compare Top Paying Reward Platforms | EarnGrind",
    description: "Compare the highest paying GPT sites of 2026. Live withdrawal minimums, payout speeds, crypto and PayPal rails, and verified offer rates.",
    alternates: canonicalAlternates("/best-gpt-sites"),
    openGraph: {
        title: "Best GPT Sites 2026: Compare Top Paying Reward Platforms | EarnGrind",
        description: "Compare the highest paying GPT sites of 2026. Live withdrawal minimums, payout speeds, crypto and PayPal rails, and verified offer rates.",
        url: "https://earngrind.com/best-gpt-sites",
        siteName: "EarnGrind",
        type: "website",
    },
};

const PLATFORM_OFFER_COUNTS: Record<string, number> = {
    "gain-gg": 18061,
    "earnlab": 8018,
    "gemsloot": 2258,
    "cashinstyle": 668,
    "freecash": 450,
    "swagbucks": 380,
    "kashkick": 120,
    "inboxdollars": 110,
    "scrambly": 95,
    "prizerebel": 85,
    "mypoints": 75,
};

function assemblePlatformList(): GptPlatformItem[] {
    return GPT_AFFILIATE_PLATFORMS.map((platform) => {
        const review = PLATFORM_REVIEWS[platform.slug];
        const offerCount = PLATFORM_OFFER_COUNTS[platform.slug] ?? 0;

        return {
            id: platform.id,
            slug: platform.slug,
            name: platform.name,
            tagline: review?.tagline || platform.bestFor,
            rating: platform.trustScore ?? review?.rating ?? 4.0,
            bestFor: platform.bestFor,
            payoutMethods: platform.payoutMethods ?? review?.payoutMethods ?? ["PayPal", "Gift cards"],
            minCashout: platform.specs?.minWithdrawal || review?.stats?.minCashout || "$5.00",
            payoutSpeed: platform.specs?.timeToPay || review?.stats?.payoutSpeed || "1 – 3 days",
            kycRequired: platform.specs?.kycRequired || (review?.stats?.kycRequired ? `${review.stats.kycRequired} KYC` : "Standard"),
            signupBonus: platform.specs?.signupBonus || review?.bonus?.signupBonus || "",
            referralRate: platform.specs?.referralProgram || review?.bonus?.referralRate || "5% – 10%",
            worldwide: platform.specs?.worldwide || "Worldwide",
            isPrimary: platform.priority === "primary",
            logoUrl: review?.logoUrl || `https://www.google.com/s2/favicons?domain=${platform.slug}.com&sz=128`,
            cta: platform.cta,
            liveOfferCount: offerCount,
            pros: review?.pros,
            cons: review?.cons,
        };
    });
}

export default async function BestGptSitesPage() {
    const platforms = assemblePlatformList();
    const catalogOfferTotal = Object.values(PLATFORM_OFFER_COUNTS).reduce((a, b) => a + b, 0);

    const schemas = [
        buildBreadcrumbList([
            { name: "Home", path: "/" },
            { name: "Best GPT Sites", path: "/best-gpt-sites" },
        ]),
        buildItemList(
            platforms.map((p) => ({
                name: `${p.name} - ${p.bestFor}`,
                path: `/best-gpt-sites/${p.slug}`,
                description: `${p.name} review: ${p.minCashout} min cashout, ${p.payoutSpeed} speed, rated ${p.rating}/5.0.`,
            })),
        ),
    ];

    return (
        <>
            <JsonLd data={schemas} />
            <RevenuePageView
                routePath="/best-gpt-sites"
                routeGroup="best_gpt_sites"
                sourceContext="best_gpt_sites_matrix"
            />

            <main className="min-h-screen bg-slate-950 text-slate-100">
                {/* 1. Hero Terminal Section */}
                <section className="relative border-b border-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black px-4 py-12 sm:px-6 lg:px-8">
                    <Container>
                        <div className="mx-auto max-w-4xl text-center">
                            {/* Live Badge */}
                            <div className="inline-flex items-center gap-2 border border-lime-400/40 bg-lime-400/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-lime-400 shadow-[0_0_15px_rgba(132,204,22,0.2)]">
                                <span className="h-2 w-2 animate-pulse bg-lime-400" />
                                <span>● VERIFIED GPT PLATFORM MATRIX</span>
                            </div>

                            {/* Headline */}
                            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                                Compare Top GPT Sites & Rewards
                            </h1>

                            {/* Subtitle */}
                            <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg max-w-2xl mx-auto">
                                Live payout metrics, cashout minimums, withdrawal speeds, and indexed offerwall inventory across the most reliable reward platforms.
                            </p>

                            {/* Quick Stats Ticker */}
                            <div className="mt-8 grid grid-cols-2 gap-3 border border-slate-800 bg-slate-900/80 p-4 sm:grid-cols-4 sm:p-5">
                                <div className="text-center">
                                    <span className="block text-xs uppercase tracking-wider text-slate-400 font-bold">Verified Sites</span>
                                    <strong className="mt-0.5 block text-xl font-extrabold text-lime-400 sm:text-2xl">{platforms.length} Platforms</strong>
                                </div>
                                <div className="text-center border-l border-slate-800">
                                    <span className="block text-xs uppercase tracking-wider text-slate-400 font-bold">Indexed Offers</span>
                                    <strong className="mt-0.5 block text-xl font-extrabold text-white sm:text-2xl">{catalogOfferTotal.toLocaleString()}+</strong>
                                </div>
                                <div className="text-center border-t border-slate-800 pt-3 sm:border-l sm:border-t-0 sm:pt-0">
                                    <span className="block text-xs uppercase tracking-wider text-slate-400 font-bold">Fastest Payout</span>
                                    <strong className="mt-0.5 block text-xl font-extrabold text-emerald-400 sm:text-2xl">Instant (Mins)</strong>
                                </div>
                                <div className="text-center border-t border-l border-slate-800 pt-3 sm:border-t-0 sm:pt-0">
                                    <span className="block text-xs uppercase tracking-wider text-slate-400 font-bold">Lowest Cashout</span>
                                    <strong className="mt-0.5 block text-xl font-extrabold text-lime-400 sm:text-2xl">$0.50 Min</strong>
                                </div>
                            </div>
                        </div>
                    </Container>
                </section>

                {/* 2. Interactive Matrix & Grid */}
                <section className="bg-slate-100 py-12 px-4 text-slate-900 sm:px-6 lg:px-8">
                    <Container>
                        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <span className="text-xs font-extrabold uppercase text-lime-700">● LIVE INTELLIGENCE MATRIX</span>
                                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                                    Ranked Platform Directory
                                </h2>
                            </div>
                            <Link
                                href="/offers"
                                className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase text-slate-950 hover:text-lime-700"
                            >
                                <span>Search All 25,000+ Live Offers</span>
                                <ArrowRight size={13} />
                            </Link>
                        </div>

                        {/* Interactive Client Matrix Component */}
                        <GptPlatformMatrix platforms={platforms} catalogOfferTotal={catalogOfferTotal} />
                    </Container>
                </section>

                {/* 3. Methodology & Evaluation Section */}
                <section className="border-t border-slate-900 bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
                    <Container>
                        <div className="mx-auto max-w-4xl space-y-12">
                            {/* Section Header */}
                            <div className="text-center">
                                <span className="text-xs font-bold uppercase text-lime-400">● VERIFICATION PROTOCOL</span>
                                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                                    How EarnGrind Rates GPT Sites
                                </h2>
                                <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
                                    Our rankings are grounded in continuous real-world withdrawal testing, live provider API indexing, and strict anti-fraud policy audits.
                                </p>
                            </div>

                            {/* Trust Pillar Grid */}
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="border border-slate-800 bg-slate-900/60 p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-lime-400 p-2 text-slate-950">
                                            <Zap size={18} />
                                        </div>
                                        <h3 className="text-base font-extrabold text-white">1. Payout Speed & Minimums</h3>
                                    </div>
                                    <p className="mt-3 text-xs leading-relaxed text-slate-400">
                                        We favor platforms offering instant automated crypto (Litecoin, Bitcoin) and sub-$1 withdrawal minimums so you can cash out your earnings immediately without artificial holds.
                                    </p>
                                </div>

                                <div className="border border-slate-800 bg-slate-900/60 p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-lime-400 p-2 text-slate-950">
                                            <ShieldCheck size={18} />
                                        </div>
                                        <h3 className="text-base font-extrabold text-white">2. KYC Transparency</h3>
                                    </div>
                                    <p className="mt-3 text-xs leading-relaxed text-slate-400">
                                        We clearly document whether a platform requires identity verification (ID/Phone) before cashout. Platforms with routine unverified crypto withdrawals are highlighted for global privacy.
                                    </p>
                                </div>

                                <div className="border border-slate-800 bg-slate-900/60 p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-lime-400 p-2 text-slate-950">
                                            <Layers size={18} />
                                        </div>
                                        <h3 className="text-base font-extrabold text-white">3. Offerwall Redundancy</h3>
                                    </div>
                                    <p className="mt-3 text-xs leading-relaxed text-slate-400">
                                        Having access to top offerwalls (Torox, RevU, AdGate, AyeT, BitLabs) ensures you never run out of high-paying gaming offers, surveys, and app trials.
                                    </p>
                                </div>

                                <div className="border border-slate-800 bg-slate-900/60 p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-lime-400 p-2 text-slate-950">
                                            <Award size={18} />
                                        </div>
                                        <h3 className="text-base font-extrabold text-white">4. Multi-Account Safety</h3>
                                    </div>
                                    <p className="mt-3 text-xs leading-relaxed text-slate-400">
                                        We test game offer tracking across devices to ensure you receive credit on your chosen platform without milestone drop-offs or support ticket friction.
                                    </p>
                                </div>
                            </div>

                            {/* FAQ Accordion */}
                            <div className="border-t border-slate-900 pt-10">
                                <h3 className="text-xl font-extrabold tracking-tight text-white mb-6">
                                    Frequently Asked Questions
                                </h3>
                                <div className="divide-y divide-slate-800 border-y border-slate-800">
                                    {SHARED_REVIEW_FAQS.map((faq, index) => (
                                        <div key={index} className="py-4">
                                            <h4 className="text-sm font-bold text-lime-400 flex items-center gap-2">
                                                <HelpCircle size={15} />
                                                <span>{faq.question}</span>
                                            </h4>
                                            <p className="mt-2 text-xs leading-relaxed text-slate-300 pl-6">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Container>
                </section>
            </main>
        </>
    );
}
