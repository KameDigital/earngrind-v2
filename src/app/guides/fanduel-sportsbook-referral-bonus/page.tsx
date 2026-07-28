import type { Metadata } from "next";
import Link from "next/link";
import {
    AlertTriangle,
    BadgeCheck,
    ChevronRight,
    CircleDollarSign,
    Clock3,
    Gift,
    ShieldCheck,
    Smartphone,
    Trophy,
    Users,
} from "lucide-react";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import { absoluteUrl } from "@/lib/site-url";
import { indexFollowRobots } from "@/lib/seo-metadata";

const PAGE_PATH = "/guides/fanduel-sportsbook-referral-bonus";
const PAGE_URL = absoluteUrl(PAGE_PATH);
const REFERRAL_URL = "https://fndl.co/yeio8rw";
const TITLE = "FanDuel Sportsbook Referral Bonus Guide";
const DESCRIPTION =
    "FanDuel Sportsbook referral bonus guide with signup steps, $5 deposit and settled-bet requirements, timing rules, limits, and responsible gambling notes.";
const referralSteps = [
    "Open the referral link before creating your account.",
    "Create a new FanDuel Sportsbook account on mobile web or the FanDuel flow shown by the link.",
    "Verify your account and deposit at least $5 if the live referral terms match the current public offer.",
    "Place and settle a real-money bet of at least $5 within 30 days of signing up.",
    "Check the FanDuel Referral Hub or account promos area for referral status and bonus-bet delivery.",
];

const terms = [
    "Bonus amount, eligible states, age rules, and deposit requirements can vary by state and live FanDuel promotion.",
    "The first qualifying bet must settle within 30 days of account signup.",
    "Site credits, Bonus Bets, and Profit Boost Tokens do not satisfy the qualifying wager requirement.",
    "FanDuel public referral terms have capped referral bonuses at five referrals per referrer in a 30-day period.",
    "Referral links are subject to FanDuel eligibility checks, account verification, and full promotion terms.",
];

const faqs = [
    {
        q: "Is this a FanDuel promo code?",
        a: "No. FanDuel referrals usually use a tracked referral link instead of a promo code box. Use the referral link before creating the account, then follow the live FanDuel instructions.",
    },
    {
        q: "How much is the FanDuel referral bonus?",
        a: "The screenshot and recent FanDuel Sportsbook referral terms point to Bonus Bets after a qualifying first bet, but the exact amount can vary by state, account, and promotion window. Check the live referral page before depositing.",
    },
    {
        q: "What has to happen before the bonus is paid?",
        a: "The referred player generally needs to sign up through the referral link, verify the account, deposit at least $5, place a real-money bet of at least $5, and have that bet settle within 30 days.",
    },
    {
        q: "Do bonus bets count toward the qualifying wager?",
        a: "No. FanDuel referral terms exclude wagers placed with site credits, Bonus Bets, or Profit Boost Tokens from satisfying the qualifying wager requirement.",
    },
];

export const dynamic = "force-static";

export const metadata: Metadata = {
    title: "FanDuel Referral Bonus Guide: Get Bonus Bets With This Link",
    description: DESCRIPTION,
    alternates: {
        canonical: PAGE_URL,
    },
    robots: indexFollowRobots(),
    openGraph: {
        title: TITLE,
        description: DESCRIPTION,
        url: PAGE_URL,
        type: "article",
    },
    twitter: {
        card: "summary",
        title: TITLE,
        description: DESCRIPTION,
    },
};

function CtaLink({
    label,
    location,
    className = "",
}: {
    label: string;
    location: string;
    className?: string;
}) {
    return (
        <TrackedOutboundLink
            href={REFERRAL_URL}
            eventLabel="fanduel_sportsbook_referral_bonus"
            location={location}
            sourceContext="fanduel_sportsbook_referral_guide"
            platformName="FanDuel Sportsbook"
            rel="sponsored noopener noreferrer nofollow"
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1167d8] px-5 py-3 text-sm font-black text-white shadow-[0_14px_34px_rgba(17,103,216,.24)] transition hover:-translate-y-0.5 hover:bg-[#0d54b5] focus:outline-none focus:ring-4 focus:ring-blue-200 ${className}`}
        >
            {label}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </TrackedOutboundLink>
    );
}

function JsonLd() {
    const article = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: TITLE,
        description: DESCRIPTION,
        url: PAGE_URL,
        mainEntityOfPage: PAGE_URL,
        datePublished: "2026-06-06",
        dateModified: "2026-06-06",
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
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("/guides") },
            { "@type": "ListItem", position: 3, name: TITLE, item: PAGE_URL },
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

export default function FanDuelSportsbookReferralBonusGuidePage() {
    return (
        <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
            <JsonLd />

            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                    <nav className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-blue-700">Home</Link>
                        <span>/</span>
                        <Link href="/guides" className="hover:text-blue-700">Guides</Link>
                        <span>/</span>
                        <span className="text-slate-800">FanDuel Referral Bonus</span>
                    </nav>
                </div>
            </section>

            <section className="relative overflow-hidden bg-[#071327] text-white">
                <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#e8143c,#0d6efd,#2dd4bf)]" />
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                    <div className="min-w-0">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase text-blue-100">
                            <Gift className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                            FanDuel Sportsbook referral guide
                        </div>
                        <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                            Get FanDuel Bonus Bets With This Referral Link
                        </h1>
                        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
                            Use the referral link below before signing up, then follow FanDuel&apos;s live
                            Sportsbook terms. The current public flow requires a new account, account
                            verification, a qualifying deposit, and a settled real-money first bet.
                        </p>
                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                            <CtaLink label="Open FanDuel Referral Link" location="hero" />
                            <Link
                                href="#how-it-works"
                                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/20"
                            >
                                See the steps
                            </Link>
                        </div>
                        <p className="mt-4 text-xs font-semibold leading-5 text-slate-300">
                            21+ in most eligible states. Terms apply. Availability varies by state. Gambling problem? Call or text 1-800-GAMBLER.
                        </p>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <section id="how-it-works" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">How it works</p>
                        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                            FanDuel Referral Steps
                        </h2>
                        <ol className="mt-6 grid gap-4">
                            {referralSteps.map((step, index) => (
                                <li key={step} className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#1167d8] text-sm font-black text-white">
                                        {index + 1}
                                    </span>
                                    <span className="pt-1 text-sm font-bold leading-6 text-slate-700">{step}</span>
                                </li>
                            ))}
                        </ol>
                        <div className="mt-7">
                            <CtaLink label="Use the FanDuel Referral Link" location="steps" />
                        </div>
                    </article>

                    <aside className="space-y-4">
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="mt-1 h-5 w-5 flex-none text-amber-700" aria-hidden="true" />
                                <div>
                                    <p className="font-black text-amber-950">Check before depositing</p>
                                    <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
                                        The referral screenshot says both users get Bonus Bets after the referred friend&apos;s
                                        first qualifying bet settles. FanDuel can change state eligibility, amounts, dates,
                                        and requirements, so confirm the live offer page first.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Best fit</p>
                            <div className="mt-4 grid gap-3">
                                {[
                                    [Users, "New FanDuel users", "The referred friend must be a new eligible FanDuel account holder."],
                                    [Smartphone, "Mobile signup", "The screenshot points users to mobile web or the FanDuel app flow."],
                                    [Clock3, "Fast settlement", "Do not wait until day 30 if your bet could settle late."],
                                ].map(([Icon, title, copy]) => {
                                    const ItemIcon = Icon as typeof Users;
                                    return (
                                        <div key={title as string} className="flex gap-3">
                                            <ItemIcon className="mt-1 h-5 w-5 flex-none text-blue-700" aria-hidden="true" />
                                            <div>
                                                <p className="font-black text-slate-950">{title as string}</p>
                                                <p className="text-sm leading-6 text-slate-600">{copy as string}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>
                </section>

                <section className="py-10">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Terms checklist</p>
                        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                            Key Rules to Know
                        </h2>
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            {terms.map((term) => (
                                <div key={term} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <BadgeCheck className="mt-0.5 h-5 w-5 flex-none text-emerald-700" aria-hidden="true" />
                                    <p className="text-sm font-semibold leading-6 text-slate-700">{term}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-3">
                    {[
                        [CircleDollarSign, "Use cash for the qualifier", "A bonus bet, site credit, or profit boost token can leave the referral incomplete."],
                        [Trophy, "Let the bet settle", "Placed is not enough. The qualifying first bet must settle before the referral bonus can trigger."],
                        [ShieldCheck, "Keep screenshots", "Save the referral signup screen, deposit confirmation, bet slip, and settled-bet result in case support asks."],
                    ].map(([Icon, title, copy]) => {
                        const CardIcon = Icon as typeof CircleDollarSign;
                        return (
                            <div key={title as string} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <CardIcon className="h-7 w-7 text-blue-700" aria-hidden="true" />
                                <h3 className="mt-4 text-lg font-black text-slate-950">{title as string}</h3>
                                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{copy as string}</p>
                            </div>
                        );
                    })}
                </section>

                <section className="py-10">
                    <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {faqs.map((item) => (
                            <details key={item.q} className="group p-5 open:bg-slate-50">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-black text-slate-950">
                                    {item.q}
                                    <ChevronRight className="h-5 w-5 flex-none text-slate-400 transition group-open:rotate-90" aria-hidden="true" />
                                </summary>
                                <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600">{item.a}</p>
                            </details>
                        ))}
                    </div>
                </section>

                <section className="pb-8">
                    <div className="rounded-2xl bg-[#071327] p-6 text-white shadow-[0_22px_70px_rgba(15,23,42,.18)] sm:p-8">
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">Next step</p>
                                <h2 className="mt-2 text-3xl font-black tracking-tight">Open the FanDuel Referral Link</h2>
                                <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
                                    Use the referral link before creating the account, then read the live FanDuel
                                    terms on the signup page. Only deposit and bet if the offer, state eligibility,
                                    and responsible gambling limits make sense for you.
                                </p>
                                <p className="mt-3 text-xs font-semibold leading-5 text-slate-400">
                                    EarnGrind may earn a commission or referral benefit from this link. 21+. Terms apply.
                                    Availability varies by state. Gambling problem? Call or text 1-800-GAMBLER.
                                </p>
                            </div>
                            <CtaLink label="Claim FanDuel Referral" location="final_cta" className="w-full" />
                        </div>
                    </div>
                    <p className="mt-5 text-xs leading-5 text-slate-500">
                        Source notes: FanDuel public Sportsbook referral terms, FanDuel Sportsbook training guide referral
                        notes, and the referral screenshot provided for this page. Verify the live FanDuel offer before
                        depositing because promotions can change.
                    </p>
                </section>
            </div>
        </main>
    );
}
