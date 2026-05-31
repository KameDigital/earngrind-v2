import type { Metadata } from "next";
import Link from "next/link";
import {
    AlertTriangle,
    BadgeDollarSign,
    Camera,
    CheckCircle2,
    CreditCard,
    ExternalLink,
    Receipt,
    ShieldCheck,
    Trophy,
} from "lucide-react";
import { absoluteUrl } from "@/lib/site-url";

const PAGE_PATH = "/guides/solitaire-stash";
const PAGE_URL = absoluteUrl(PAGE_PATH);
const LAST_UPDATED = "May 26, 2026";

export const metadata: Metadata = {
    title: "Solitaire Stash Offer Guide: Cash Tournament Route",
    description:
        "Earn up to $607.02 with this Solitaire Stash offer guide, covering cash tournament wins, purchase risk, tracking proof, and Lootably crediting strategy.",
    alternates: {
        canonical: PAGE_URL,
    },
    openGraph: {
        title: "Solitaire Stash Offer Guide: Cash Tournament Route",
        description:
            "Complete the Solitaire Stash Lootably offer with a cash tournament payout table, tracking proof plan, and spending-risk warnings.",
        url: PAGE_URL,
        type: "article",
    },
    twitter: {
        card: "summary",
        title: "Solitaire Stash Offer Guide",
        description:
            "Step-by-step Solitaire Stash Lootably offer route for cash tournament wins, in-app purchase proof, and missing-credit support.",
    },
};

const payoutRows = [
    ["Win 1,000 Cash Tournaments.", "238,870", "$238.87", "Trap"],
    ["Win 700 Cash Tournaments.", "170,620", "$170.62", "Trap"],
    ["Win 500 Cash Tournaments.", "85,310", "$85.31", "Trap"],
    ["Win 400 Cash Tournaments.", "37,530", "$37.53", "Grind"],
    ["Win 300 Cash Tournaments.", "30,710", "$30.71", "Grind"],
    ["Win 150 Cash Tournaments.", "21,490", "$21.49", "Grind"],
    ["Win 70 Cash Tournaments.", "8,530", "$8.53", "Grind"],
    ["Win 45 Cash Tournaments.", "4,770", "$4.77", "Grind"],
    ["Win 25 Cash Tournaments.", "2,730", "$2.73", "Grind"],
    ["Win 15 Cash Tournaments.", "2,040", "$2.04", "Grind"],
    ["Win 5 Cash Tournaments.", "930", "$0.93", "Grind"],
    ["Win 3 Cash Tournaments.", "680", "$0.68", "Grind"],
    ["Make an in-app purchase.", "600", "$0.60", "Purchase"],
    ["Install and open.", "100", "$0.10", "Easy"],
];

const proofChecklist = [
    "Start from the Lootably offerwall path before installing Solitaire Stash.",
    "Screenshot the offer page, visible reward amounts, and app account details.",
    "Confirm install and early cash tournament wins before making purchases.",
    "Track every session with entry cost, result, credited milestone, and date.",
    "Keep receipts and support-ready proof before crossing the 500, 700, and 1,000-win tiers.",
];

const faqs = [
    {
        q: "Is Solitaire Stash legit?",
        a: "Solitaire Stash is a real app with official App Store and website listings, cash tournaments, and public reviews. That does not make the Lootably offer risk-free. Treat this as a paid tournament tracking route, not guaranteed profit.",
    },
    {
        q: "How do you win cash tournaments in Solitaire Stash?",
        a: "Cash tournament performance depends on playing solitaire quickly and efficiently against other entrants. Official and review sources describe same-deck tournament play, timed scoring, and prizes for top performers. Practice before paid entries so you know whether your win rate can support the offer.",
    },
    {
        q: "Does a Solitaire Stash cash tournament win mean first place?",
        a: "The submitted task list does not define win. Because community posts show confusion around first place versus paid placement, treat first place as the safest definition until your own Lootably progress proves otherwise. Screenshot the tournament result whenever a placement credits.",
    },
    {
        q: "What should I do if Lootably does not credit Solitaire Stash?",
        a: "Check whether the event is delayed, then open Lootably support from the offerwall or email support@lootably.com if the wall directs you there. Include the provider, offer name, failed milestone, app account details, tournament history, receipts, and screenshots.",
    },
    {
        q: "Should you make the in-app purchase right away?",
        a: "No. The in-app purchase pays only $0.60, so it should come after the install and early win milestones are tracking. Buy the smallest qualifying product you can verify, save the receipt, and wait for credit before making any extra purchases.",
    },
];

const sources = [
    ["App Store listing", "https://apps.apple.com/us/app/solitaire-stash-win-real-cash/id6450462443"],
    ["Official Solitaire Stash site", "https://solitairestash.com/"],
    ["The Penny Hoarder review", "https://www.thepennyhoarder.com/make-money/game-review-solitaire-stash/"],
    ["Lootably postbacks documentation", "https://documentation.lootably.com/docs/postbacks"],
    ["Earnably missing-credit help", "https://help.earnably.com/article/215-i-completed-an-offer-but-didnt-receive-credit-what-can-i-do"],
];

function JsonLd() {
    const article = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Solitaire Stash Offer Guide: Cash Tournament Route",
        description: metadata.description,
        datePublished: "2026-05-26",
        dateModified: "2026-05-26",
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
            { "@type": "ListItem", position: 3, name: "Solitaire Stash Offer Guide", item: PAGE_URL },
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

function Warning({ children }: { children: React.ReactNode }) {
    return (
        <div className="my-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-950">
            <div className="mb-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-rose-700">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Warning
            </div>
            {children}
        </div>
    );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
    return (
        <div className="mb-5">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-emerald-700">{eyebrow}</p>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
        </div>
    );
}

export default function SolitaireStashOfferGuidePage() {
    return (
        <main className="min-h-screen bg-[#f7fbf8] text-slate-900">
            <JsonLd />

            <section className="border-b border-emerald-200 bg-emerald-50">
                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                    <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-slate-950">Home</Link>
                        <span>/</span>
                        <Link href="/guides" className="hover:text-slate-950">Guides</Link>
                        <span>/</span>
                        <span className="text-slate-950">Solitaire Stash</span>
                    </nav>
                </div>
            </section>

            <section className="bg-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-14">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-200">
                            <Trophy className="h-4 w-4" aria-hidden="true" />
                            Lootably cash tournament offer
                        </div>
                        <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                            Solitaire Stash offer guide: Cash Tournament Route
                        </h1>
                        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
                            Up to $607.02 is listed on this Solitaire Stash offer guide, but the visible Lootably steps add up to $604.91. That difference matters because every milestone needs to be traceable when you ask for missing credit. This route covers the install, cash tournament wins from 3 through 1,000, the in-app purchase, and the proof habits that keep the late tiers defensible.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href="/offers"
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-extrabold text-emerald-200"
                            >
                                Compare Solitaire Stash offers
                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </Link>
                            <Link
                                href="/best-gpt-sites"
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-900"
                            >
                                Compare GPT sites
                            </Link>
                        </div>
                    </div>

                    <aside className="rounded-lg border border-emerald-200 bg-emerald-950 p-5 text-white shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-300 text-emerald-950">
                                <BadgeDollarSign className="h-7 w-7" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-200">Visible task total</p>
                                <p className="text-3xl font-black">$604.91</p>
                            </div>
                        </div>
                        <div className="mt-5 rounded-lg border border-white/15 bg-white/10 p-4">
                            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-200">Headline payout</p>
                            <p className="mt-1 text-2xl font-black">$607.02</p>
                            <p className="mt-2 text-sm leading-6 text-emerald-50">
                                Use the task rows as the source of truth when tracking rewards. The headline and visible steps do not match exactly.
                            </p>
                        </div>
                        <div className="mt-5 text-sm font-semibold text-emerald-100">Updated {LAST_UPDATED}</div>
                    </aside>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <article className="space-y-10">
                        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <SectionHeader eyebrow="Payout table" title="Solitaire Stash Lootably rewards" />
                            <p className="mb-4 text-sm leading-6 text-slate-600">
                                Payout values come from the submitted Lootably task list only, with points converted at points / 1000.
                            </p>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="bg-slate-950 text-white">
                                        <tr>
                                            <th className="px-4 py-3 font-extrabold">Task</th>
                                            <th className="px-4 py-3 font-extrabold">Points</th>
                                            <th className="px-4 py-3 font-extrabold">USD</th>
                                            <th className="px-4 py-3 font-extrabold">Type</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {payoutRows.map(([task, points, usd, type]) => (
                                            <tr key={task} className="odd:bg-white even:bg-slate-50">
                                                <td className="px-4 py-3 font-semibold text-slate-950">{task}</td>
                                                <td className="px-4 py-3 text-slate-700">{points}</td>
                                                <td className="px-4 py-3 font-extrabold text-emerald-700">{usd}</td>
                                                <td className="px-4 py-3 text-slate-700">{type}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <SectionHeader eyebrow="Start correctly" title="Solitaire Stash offer guide setup and tracking" />
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    The Solitaire Stash Lootably offer starts before the first card is moved. Install from the Lootably path, open the app from that same device, and avoid VPNs, private relay tools, ad blockers, or device switches while the first event is trying to track. Lootably relies on postbacks from offer events, so your goal is to make the first install and early wins easy for the advertiser and offerwall to connect.
                                </p>
                                <p>
                                    Solitaire Stash is an 18+ real-money solitaire app with cash tournaments, a Casino category listing, and location restrictions. The App Store listing says prize tournaments are not available in AZ, AR, CT, DE, LA, MT, SC, SD, and TN. If you are in a blocked state, the cash tournament tasks can fail before strategy matters. Check tournament availability inside the app before you deposit, buy, or grind.
                                </p>
                                <p>
                                    Start small. The first three tournament milestones pay $0.68, $0.93, and $2.04 for 3, 5, and 15 cash tournament wins. Those numbers are not worth a large paid entry experiment. Use them as tracking tests. If the install credits and the first cash tournament wins appear in Lootably, then you have evidence the route is alive.
                                </p>
                            </div>
                            <Warning>
                                Do not scale into paid entries before the install and first win milestone are visible in Lootably. A $0.68 tracked tier is more useful than a dozen untracked wins.
                            </Warning>
                            <p className="text-base leading-8 text-slate-700">
                                Screenshots matter from the first session. Capture the Lootably offer page, the app account screen, the tournament history screen, and any milestone confirmation that shows your win count. If support asks for proof later, you want a clean trail that starts with install and open, not only a screenshot after hundreds of matches.
                            </p>
                        </section>

                        <section>
                            <SectionHeader eyebrow="Tournament wins" title="Solitaire Stash cash tournaments: what counts as a win" />
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    The biggest wording issue is simple: the task says win cash tournaments, not play cash tournaments. Solitaire Stash&apos;s official site says top players can win in head-to-head or multiplayer tournaments, and app review material describes cash tournaments where score depends on speed, moves, efficiency, and clearing the deck. A Reddit thread about a similar Solitaire Stash offer shows the real risk: people were unsure whether a win meant first place or whether paid placement counted.
                                </p>
                                <p>
                                    Treat win as the strictest version until your own tracking proves otherwise. If first place credits and second or third place does not, you need to know that near the 3 or 5-win tier, not near 700 wins. If a top-3 placement credits, document it with the tournament result screen and the matching Lootably progress change.
                                </p>
                                <p>
                                    The middle milestones are where routine matters: 25, 45, 70, 150, 300, and 400 cash tournament wins. None of those steps include a time limit in the submitted task list, so do not create an artificial deadline. Your practical limit is bankroll, consistency, tracking, and whether Solitaire Stash keeps offering tournaments you can enter legally from your location.
                                </p>
                                <p>
                                    Practice rounds are useful because the paid version rewards quick, clean solitaire. You need to reveal hidden cards efficiently, avoid wasteful undo loops, and know when clearing the board is realistic. If you are repeatedly losing low-stakes cash tournaments, more volume will not fix the offer. It will only make the win count more expensive.
                                </p>
                            </div>
                            <Warning>
                                The offer rewards wins, while cash tournaments can cost entry fees. Track wins, losses, deposits, withdrawals, bonus cash, and real cash separately so the reward does not hide a negative net result.
                            </Warning>
                            <p className="text-base leading-8 text-slate-700">
                                Build a simple session log. Record the date, tournament type, entry cost, result, whether it counted as a win, and the visible Lootably milestone before and after the session. This gives you a way to spot broken tracking before a support ticket. It also prevents the common mistake of relying on the app&apos;s balance screen when the offerwall needs milestone proof.
                            </p>
                        </section>

                        <section>
                            <SectionHeader eyebrow="Late milestones" title="High-volume route to 500, 700, and 1,000 wins" />
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    The late tiers are where the Solitaire Stash offer guide becomes a risk-control plan. This Solitaire Stash offer guide treats those late rewards as proof milestones, not just bigger payouts. The rewards jump to $85.31 for 500 wins, $170.62 for 700 wins, and $238.87 for 1,000 wins. Those are the largest visible rewards, but they also require the most repeat events. A small interpretation problem around cash tournament win becomes expensive at this volume.
                                </p>
                                <p>
                                    Do not chase the 1,000-win tier just because it has the largest payout. First, confirm that the 150, 300, and 400-win tiers are crediting in sequence. If one tier stalls, pause and collect proof before adding hundreds more entries. High-volume paid gameplay can create support problems because you may have proof of many matches, but support still needs the advertiser event or a clear manual review path.
                                </p>
                            </div>
                            <Warning>
                                The 500-win tier is the first large jump. Save proof before and after crossing it, including total win count, tournament history, app account details, and the Lootably progress screen.
                            </Warning>
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    The 700-win tier needs the same discipline, plus a net-spend check. Cash tournament apps often use deposits, bonus cash, entry fees, and prize balances in ways that are easy to blur together. Keep a separate note for real money spent. If you have spent more than the next reward can recover, stop and reassess instead of treating the offer as a sunk-cost challenge.
                                </p>
                                <p>
                                    For 1,000 wins, proof quality is more important than optimism. You want a dated screen that shows the completed count or a support response from Solitaire Stash confirming tournament totals. A Reddit report about a similar solitaire offer mentioned using unique game IDs as proof, which is the kind of detail that can help if an offerwall says the advertiser cannot verify completion.
                                </p>
                            </div>
                            <Warning>
                                The 1,000-win tier is the highest tracking-risk milestone. Do not rely on memory, screenshots without account identifiers, or a balance total that does not show completed wins.
                            </Warning>
                        </section>

                        <section>
                            <SectionHeader eyebrow="Purchase and crediting" title="In-app purchase and Lootably crediting" />
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    The in-app purchase pays $0.60, so it should not drive your strategy. Keep this Solitaire Stash offer guide focused on tracked wins first, then spend only after the install and early tournament wins have tracked. If the purchase is the first paid action you take, you may learn too late that the app is installed correctly but Lootably is not seeing your account events.
                                </p>
                                <p>
                                    Before buying, screenshot the Lootably task, the in-app product page, and the confirmation screen. After buying, save the Apple or platform receipt and capture the app balance or item unlock. The task does not name a price, product, or deadline, so do not invent one. The safest interpretation is that any legitimate in-app purchase may count, but only the advertiser and Lootably can confirm that event.
                                </p>
                            </div>
                            <Warning>
                                A $0.60 purchase reward is not worth testing multiple paid products. Make the smallest purchase that clearly qualifies, then wait for the event to track.
                            </Warning>
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    Lootably&apos;s public documentation explains why support proof matters. Postbacks can include the offer name, goal name, reward, revenue, user ID, and multistep completion percentage. That is useful when everything works, but it also means a missing goal may be invisible to EarnGrind or the platform until Lootably or the advertiser confirms it.
                                </p>
                                <p>
                                    If Solitaire Stash is not crediting, wait long enough for normal delayed credit, then use the Lootably support path. Support references for offerwalls point users to the Lootably wall, the Support option, and support@lootably.com. Send the offer name, provider, device, app account details, screenshots, receipts, and the exact milestone that failed. Keep the request specific. Win 500 Cash Tournaments did not credit is better than my offer is broken.
                                </p>
                                <p>
                                    The final check is whether this offer is worth continuing. The visible steps add to $604.91, while the headline says $607.02. That is not a reason to reject the offer by itself, but it is a reason to stay precise. If the current live offer changes, use the live task list as the payout source of truth and compare it against other platform options on <Link href="/platforms" className="font-bold text-emerald-700 underline">EarnGrind platforms</Link>.
                                </p>
                            </div>
                        </section>

                        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <SectionHeader eyebrow="FAQ" title="Frequently asked questions" />
                            <div className="divide-y divide-slate-200">
                                {faqs.map((item) => (
                                    <div key={item.q} className="py-5 first:pt-0 last:pb-0">
                                        <h3 className="text-lg font-black text-slate-950">{item.q}</h3>
                                        <p className="mt-2 text-base leading-7 text-slate-700">{item.a}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-lg border border-emerald-200 bg-emerald-950 p-6 text-white">
                            <h2 className="text-2xl font-black">Compare current Solitaire Stash payouts</h2>
                            <p className="mt-3 max-w-3xl text-base leading-7 text-emerald-50">
                                Ready to compare this route against other GPT offers? Use the live task list as the payout source before you deposit or grind cash tournaments.
                            </p>
                            <Link
                                href="/offers"
                                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-300 px-5 py-3 text-sm font-extrabold text-emerald-950"
                            >
                                Compare offers on EarnGrind
                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        </section>
                    </article>

                    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
                        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-emerald-700">
                                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                Proof checklist
                            </div>
                            <ul className="space-y-3">
                                {proofChecklist.map((item) => (
                                    <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                                        <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-600" aria-hidden="true" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-slate-700">
                                <Camera className="h-4 w-4" aria-hidden="true" />
                                Save proof for
                            </div>
                            <div className="grid gap-2 text-sm font-bold text-slate-800">
                                <span className="rounded-md bg-slate-100 px-3 py-2">Offer page</span>
                                <span className="rounded-md bg-slate-100 px-3 py-2">Tournament history</span>
                                <span className="rounded-md bg-slate-100 px-3 py-2">Win count</span>
                                <span className="rounded-md bg-slate-100 px-3 py-2">Lootably progress</span>
                                <span className="rounded-md bg-slate-100 px-3 py-2">Receipts</span>
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-slate-700">
                                <Receipt className="h-4 w-4" aria-hidden="true" />
                                Sources
                            </div>
                            <ul className="space-y-2 text-sm leading-6">
                                {sources.map(([label, href]) => (
                                    <li key={href}>
                                        <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-emerald-700 underline">
                                            {label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                            <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-emerald-700">
                                <CreditCard className="h-4 w-4" aria-hidden="true" />
                                Spend carefully
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                                The offer can require paid entries and an in-app purchase. Track real cash separately from bonus cash and rewards.
                            </p>
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    );
}
