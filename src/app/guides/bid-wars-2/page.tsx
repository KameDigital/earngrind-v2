import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    ArrowRight,
    BadgeDollarSign,
    Camera,
    CheckCircle2,
    Clock3,
    ExternalLink,
    Eye,
    Gavel,
    PackageOpen,
    Receipt,
    ShieldCheck,
    ShoppingBag,
    Vault,
} from "lucide-react";
import { absoluteUrl } from "@/lib/site-url";

const PAGE_PATH = "/guides/bid-wars-2";
const PAGE_URL = absoluteUrl(PAGE_PATH);
const LAST_UPDATED = "May 23, 2026";

export const metadata: Metadata = {
    title: "Bid Wars 2 Offer Guide: Complete Every Task",
    description:
        "Earn up to $20.11 with this Bid Wars 2 offer guide. See every Torox task, payout tier, vault target, auction grind, ad milestone, and 7-day route now.",
    alternates: {
        canonical: PAGE_URL,
    },
    openGraph: {
        title: "Bid Wars 2 Offer Guide: Complete Every Task",
        description:
            "Complete the Bid Wars 2 Torox offer with the corrected $20.11 payout table, 7-day task route, and tracking proof checklist.",
        url: PAGE_URL,
        type: "article",
    },
    twitter: {
        card: "summary",
        title: "Bid Wars 2 Offer Guide: Complete Every Task",
        description:
            "Step-by-step Bid Wars 2 Torox offer guide for vaults, auctions, ads, quests, purchase tracking, and support proof.",
    },
};

const payoutRows = [
    ["Watch 100 ads", "2,901", "$2.90", "7 days", "Grind"],
    ["Open 50 vaults", "2,694", "$2.69", "7 days", "Trap"],
    ["Make any in-app purchase above $0.99", "2,487", "$2.49", "7 days", "Trap"],
    ["Complete 100 auctions after 4 days", "1,617", "$1.62", "7 days; after 4 days", "Trap"],
    ["Complete 70 auctions", "1,078", "$1.08", "7 days", "Grind"],
    ["Sell 60 items", "1,078", "$1.08", "7 days", "Grind"],
    ["Watch 50 ads", "995", "$1.00", "7 days", "Grind"],
    ["Open 15 vaults", "970", "$0.97", "7 days", "Grind"],
    ["Complete 12 quests after 2 days", "916", "$0.92", "7 days; after 2 days", "Trap"],
    ["Reach level 10", "809", "$0.81", "7 days", "Grind"],
    ["Complete 20 Auctions", "647", "$0.65", "7 days", "Grind"],
    ["Open 4 vaults", "539", "$0.54", "7 days", "Grind"],
    ["Complete 5 quests", "485", "$0.49", "7 days", "Grind"],
    ["Reach level 8", "378", "$0.38", "7 days", "Grind"],
    ["Complete 10 Auctions", "324", "$0.32", "7 days", "Grind"],
    ["Complete 2 quests", "324", "$0.32", "7 days", "Grind"],
    ["Open 2 vaults", "324", "$0.32", "7 days", "Grind"],
    ["Sell 15 items", "324", "$0.32", "7 days", "Grind"],
    ["Watch 30 ads", "291", "$0.29", "7 days", "Grind"],
    ["Reach level 6", "270", "$0.27", "7 days", "Grind"],
    ["Complete 5 Auctions", "162", "$0.16", "7 days", "Grind"],
    ["Reach level 4", "135", "$0.14", "7 days", "Grind"],
    ["Sell 5 items", "135", "$0.14", "7 days", "Easy"],
    ["Watch 10 ads", "108", "$0.11", "7 days", "Grind"],
    ["Open 1 vault", "54", "$0.05", "7 days", "Grind"],
    ["Reach level 2", "54", "$0.05", "7 days", "Easy"],
    ["Open and play the game", "9", "$0.01", "7 days", "Easy"],
];

const trackingChecklist = [
    "Start from the Android QR or Torox offerwall path before installing.",
    "Screenshot the offer terms, task list, reward amounts, and 7-day timer.",
    "Confirm the Torox activity entry shows the offer as clicked before grinding hard.",
    "Save screenshots for level, vault, auction, ad, quest, purchase, and sell-item milestones.",
    "Keep the purchase receipt if you attempt the in-app purchase tier.",
];

const strategySections = [
    {
        title: "Setup and tracking",
        icon: ShieldCheck,
        body: [
            "Start the Bid Wars 2 Torox offer from the Android QR or offerwall link, then keep the Torox activity screen available. Torox says a missing reward request depends on the offer having a clicked status, so do not install the game from a random store search first.",
            "The level tasks are simpler than the rest of the offer. You need level 2, level 4, level 6, level 8, and level 10 while you work auctions, vaults, ads, quests, and selling in parallel.",
        ],
        warning: "The purchase task says above $0.99. A $0.99 item may not count. Use a purchase priced over $0.99 if you attempt the $2.49 tier.",
    },
    {
        title: "Complete auctions without burning cash",
        icon: Gavel,
        body: [
            "The auction tasks start at 5 auctions and climb to 70 auctions, plus 100 auctions after 4 days. Keep a separate note for the after-4-days task because timing matters, not just total count.",
            "Bid Wars 2 is still a cash-management game. Check item values before bidding, decide your max bid before the auction closes, and avoid chasing every room if it leaves you short on cash for later auctions.",
        ],
        warning: "Complete 100 auctions after 4 days pays $1.62 and has timing language. Take proof after the fourth day.",
    },
    {
        title: "Keep vaults opening while you play",
        icon: Vault,
        body: [
            "Vaults are the likely bottleneck because the task list jumps from 1 vault to 2, 4, 15, and finally 50 vaults. Treat every vault or safe as a timer track that should run while you do other tasks.",
            "If the game offers an ad option that speeds a vault, use it when it also advances your ad milestones. That turns one action into progress on two payout tracks.",
        ],
        warning: "Open 50 vaults pays $2.69 and is the most likely task to fall behind if you wait until the final day.",
    },
    {
        title: "Sell items and finish quests",
        icon: PackageOpen,
        body: [
            "The selling tasks are 5 items, 15 items, and 60 items. Keep common items moving through the pawn shop so inventory does not block future auction rewards.",
            "Quest progress matters too. You need 2 quests, 5 quests, and 12 quests after 2 days, so check the quest list before each session and line up auctions or selling with active quest requirements.",
        ],
        warning: "Complete 12 quests after 2 days pays $0.92. Keep date-visible proof after that timing point.",
    },
    {
        title: "Use ads as a payout track",
        icon: Eye,
        body: [
            "The ad tasks pay $0.11, $0.29, $1.00, and $2.90. The 100-ad tier is the largest single payout in the offer, so ads are not optional side content here.",
            "Make ads part of every session. Watch some while vaults are opening, some after auctions, and some when the game offers useful speedups.",
        ],
        warning: "Do not leave 100 ads until day 7. Ads can freeze, fail to load, or stop being available exactly when you need them.",
    },
];

const faqs = [
    {
        q: "Is the Bid Wars 2 Torox offer worth doing?",
        a: "It can be worth doing if you can use the full 7-day window and keep several task tracks moving. The offer pays up to $20.11, but the biggest rewards require 100 ads, 50 vaults, a purchase over $0.99, and late auction volume.",
    },
    {
        q: "What is the hardest Bid Wars 2 offer task?",
        a: "Open 50 vaults is likely the hardest task because vaults or safes take time to open and depend on steady auction play. Complete 100 auctions after 4 days is also risky because it has timing language.",
    },
    {
        q: "Does the $0.99 purchase count for the purchase task?",
        a: "The task says to make any in-app purchase above $0.99. That wording means a $0.99 purchase may not qualify, so use a purchase priced over $0.99 if you attempt that tier.",
    },
    {
        q: "What should I do if Torox does not credit Bid Wars 2?",
        a: "Wait at least 24 hours after the completed tier, then use Torox's My Activity area to apply for a missing reward if the offer is eligible. Include screenshots of the clicked offer, your game profile, completed milestone, and purchase receipt if relevant.",
    },
];

const sources = [
    ["Google Play listing", "https://play.google.com/store/apps/details?id=br.com.tapps.bidwars2&hl=en"],
    ["App Store listing", "https://apps.apple.com/ua/app/bid-wars-2-auction-simulator/id1262445849"],
    ["Level Winner strategy guide", "https://www.levelwinner.com/bid-wars-pawn-empire-guide-tips-tricks-strategies/"],
    ["Torox missing reward FAQ", "https://torox.io/faq-missing-your-reward/"],
];

function JsonLd() {
    const article = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Bid Wars 2 Offer Guide: Complete Every Task",
        description: metadata.description,
        datePublished: "2026-05-23",
        dateModified: "2026-05-23",
        mainEntityOfPage: PAGE_URL,
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
            { "@type": "ListItem", position: 3, name: "Bid Wars 2 Offer Guide", item: PAGE_URL },
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

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
    return (
        <div className="mb-6">
            <p className="mb-2 text-xs font-extrabold uppercase text-amber-700">{eyebrow}</p>
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">{title}</h2>
            {children ? <div className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{children}</div> : null}
        </div>
    );
}

function AuctionRouteVisual() {
    const stages = [
        ["Click", "Torox"],
        ["Bid", "Auctions"],
        ["Open", "Vaults"],
        ["Cash", "$20.11"],
    ];

    return (
        <div className="rounded-lg border border-amber-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase text-amber-700">Offer route</p>
                    <p className="mt-1 text-3xl font-black text-slate-950">$20.11</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-amber-200">
                    <Gavel className="h-7 w-7" aria-hidden="true" />
                </div>
            </div>
            <div className="grid gap-3">
                {stages.map(([label, value], index) => (
                    <div key={label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-xs font-black text-amber-900">
                            {index + 1}
                        </span>
                        <div className="h-2 rounded-full bg-slate-100">
                            <div className="h-2 rounded-full bg-amber-400" style={{ width: `${(index + 1) * 25}%` }} />
                        </div>
                        <span className="text-sm font-extrabold text-slate-800">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function BidWars2OfferGuidePage() {
    return (
        <main className="min-h-screen bg-[#f8faf7] text-slate-900">
            <JsonLd />

            <section className="border-b border-amber-200 bg-[#fff8e7]">
                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                    <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-slate-950">Home</Link>
                        <span>/</span>
                        <Link href="/guides" className="hover:text-slate-950">Guides</Link>
                        <span>/</span>
                        <span className="text-slate-950">Bid Wars 2</span>
                    </nav>
                </div>
            </section>

            <section className="bg-[#fff8e7]">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-16">
                    <div>
                        <div className="mb-5 flex flex-wrap gap-2 text-xs font-extrabold uppercase">
                            <span className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-amber-800">Torox Android offer</span>
                            <span className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-slate-700">7 days</span>
                            <span className="rounded-lg border border-lime-300 bg-lime-50 px-3 py-1 text-lime-800">Updated {LAST_UPDATED}</span>
                        </div>
                        <p className="mb-3 text-sm font-extrabold uppercase text-amber-800">Bid Wars 2 offer guide</p>
                        <h1 className="max-w-4xl text-4xl font-black text-slate-950 sm:text-5xl lg:text-6xl">
                            Bid Wars 2 Offer Guide: Complete Every Task
                        </h1>
                        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg">
                            The Bid Wars 2 offer guide pays up to $20.11 on Torox if you finish every listed Android task within the 7-day window. The highest-value tracks are 100 ads, 50 vaults, the purchase tier, and the later auction goals.
                        </p>
                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/offers"
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-extrabold text-amber-200 transition hover:bg-slate-800"
                            >
                                Compare current payouts
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                            <Link
                                href="#payouts"
                                className="inline-flex items-center justify-center rounded-lg border border-amber-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-900 transition hover:bg-amber-50"
                            >
                                View payout table
                            </Link>
                        </div>
                    </div>
                    <AuctionRouteVisual />
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <section className="grid gap-4 md:grid-cols-4">
                    {[
                        [BadgeDollarSign, "Total payout", "$20.11"],
                        [Clock3, "Deadline", "7 days"],
                        [Vault, "Main bottleneck", "50 vaults"],
                        [Receipt, "Purchase rule", "Above $0.99"],
                    ].map(([Icon, label, value]) => (
                        <div key={label as string} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <Icon className="h-6 w-6 text-amber-700" aria-hidden="true" />
                            <p className="mt-4 text-xs font-extrabold uppercase text-slate-500">{label as string}</p>
                            <p className="mt-1 text-lg font-black text-slate-950">{value as string}</p>
                        </div>
                    ))}
                </section>

                <section id="payouts" className="py-12">
                    <SectionHeading eyebrow="Payouts" title="Bid Wars 2 Torox Task Table">
                        <p>
                            Dollar values use the corrected offer conversion: points divided by 1,000, rounded to cents.
                        </p>
                    </SectionHeading>
                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-100 text-xs font-extrabold uppercase text-slate-600">
                                <tr>
                                    <th className="px-4 py-3">Task</th>
                                    <th className="px-4 py-3">Points</th>
                                    <th className="px-4 py-3">USD</th>
                                    <th className="px-4 py-3">Limit</th>
                                    <th className="px-4 py-3">Type</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {payoutRows.map(([task, points, usd, limit, type]) => (
                                    <tr key={`${task}-${points}`} className={type === "Trap" ? "bg-amber-50/55" : "bg-white"}>
                                        <td className="px-4 py-3 font-bold text-slate-950">{task}</td>
                                        <td className="px-4 py-3 text-slate-700">{points}</td>
                                        <td className="px-4 py-3 font-black text-lime-700">{usd}</td>
                                        <td className="px-4 py-3 text-slate-700">{limit}</td>
                                        <td className="px-4 py-3 text-slate-700">{type}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="grid gap-6 py-4 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                        <SectionHeading eyebrow="Before you play" title="Tracking Checklist" />
                        <ul className="space-y-3">
                            {trackingChecklist.map((item) => (
                                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-lime-700" aria-hidden="true" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <SectionHeading eyebrow="Proof" title="Screenshot the High-Value Tiers">
                            <p>
                                Focus your proof on the $2.90 ad tier, $2.69 vault tier, $2.49 purchase tier, and the after-day auction and quest tasks.
                            </p>
                        </SectionHeading>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {[
                                [Camera, "Milestone screens"],
                                [ShoppingBag, "Purchase receipt"],
                                [AlertTriangle, "Timing proof"],
                            ].map(([Icon, label]) => (
                                <div key={label as string} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-extrabold text-slate-800">
                                    <Icon className="mb-3 h-5 w-5 text-amber-700" aria-hidden="true" />
                                    {label as string}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-12">
                    <SectionHeading eyebrow="Route" title="How to Complete the Bid Wars 2 Offer" />
                    <div className="grid gap-5 lg:grid-cols-2">
                        {strategySections.map(({ title, icon: Icon, body, warning }) => (
                            <article key={title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-amber-200">
                                        <Icon className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-950">{title}</h3>
                                </div>
                                <div className="space-y-3 text-sm leading-6 text-slate-600">
                                    {body.map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                </div>
                                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">
                                    {warning}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="py-6">
                    <div className="rounded-lg bg-slate-950 p-6 text-white shadow-sm sm:p-8">
                        <p className="text-xs font-extrabold uppercase text-amber-200">Worth doing?</p>
                        <h2 className="mt-2 text-3xl font-black">Only if you can check in across the full 7 days.</h2>
                        <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-300">
                            This is not a quick install-and-level offer. The payout ceiling is $20.11, but the work is spread across auctions, vault timers, ads, selling, quests, and level milestones. It fits players who can do multiple short sessions and keep screenshots as they go.
                        </p>
                    </div>
                </section>

                <section className="py-12">
                    <SectionHeading eyebrow="FAQ" title="Bid Wars 2 Offer FAQ" />
                    <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                        {faqs.map((item) => (
                            <details key={item.q} className="group p-5 open:bg-slate-50">
                                <summary className="cursor-pointer list-none text-base font-black text-slate-950">
                                    {item.q}
                                </summary>
                                <p className="mt-3 text-sm leading-6 text-slate-600">{item.a}</p>
                            </details>
                        ))}
                    </div>
                </section>

                <section className="grid gap-6 py-6 lg:grid-cols-[1fr_0.8fr]">
                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <SectionHeading eyebrow="Sources" title="Evidence Used" />
                        <ul className="space-y-3">
                            {sources.map(([label, href]) => (
                                <li key={href}>
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm font-extrabold text-amber-800 hover:text-amber-950"
                                    >
                                        {label}
                                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-lg border border-lime-200 bg-lime-50 p-6">
                        <SectionHeading eyebrow="Next step" title="Compare Before Starting">
                            <p>
                                Offerwall payouts can change. Check the current EarnGrind offer list before committing the 7-day window.
                            </p>
                        </SectionHeading>
                        <Link
                            href="/offers"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-extrabold text-lime-200 transition hover:bg-slate-800"
                        >
                            Compare all offers
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
