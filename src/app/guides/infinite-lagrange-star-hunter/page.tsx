import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    BadgeDollarSign,
    Building2,
    Camera,
    CheckCircle2,
    Clock3,
    ExternalLink,
    Receipt,
    Rocket,
    ShieldCheck,
    Trophy,
    Users,
} from "lucide-react";
import { absoluteUrl } from "@/lib/site-url";

const PAGE_PATH = "/guides/infinite-lagrange-star-hunter";
const PAGE_URL = absoluteUrl(PAGE_PATH);
const LAST_UPDATED = "May 25, 2026";

export const metadata: Metadata = {
    title: "Infinite Lagrange Offer Guide: Star Hunter",
    description:
        "Earn up to $117.55 with this Infinite Lagrange offer guide. See every Torox Star Hunter task, purchase deadline, Battle Pass goal, base target, and proof tip.",
    alternates: {
        canonical: PAGE_URL,
    },
    openGraph: {
        title: "Infinite Lagrange Offer Guide: Star Hunter",
        description:
            "Complete the Infinite Lagrange Star Hunter Torox offer with a $117.55 payout table, purchase deadline warnings, base route, and proof checklist.",
        url: PAGE_URL,
        type: "article",
    },
    twitter: {
        card: "summary",
        title: "Infinite Lagrange Offer Guide: Star Hunter",
        description:
            "Step-by-step Infinite Lagrange Star Hunter guide for Torox tracking, purchases, Control Center, Battle Pass, alliance tasks, and support proof.",
    },
};

const payoutRows = [
    ["Spend a total of $50 or more on in-game purchases", "33,300", "$33.30", "30 days", "Trap"],
    ["Upgrade the Control Center (Main City) to Level 9", "29,600", "$29.60", "30 days", "Trap"],
    ["Purchase of the 799-tier Ship Crate $13 within 24 hours", "13,320", "$13.32", "within 24 hours", "Trap"],
    ["Purchase the 888-tier Ship Crate Successful $13.8", "12,580", "$12.58", "30 days", "Purchase"],
    ["Control Center (Main City) upgraded to Level 7", "5,920", "$5.92", "30 days", "Grind"],
    ["Attack NPC cities with your alliance", "5,180", "$5.18", "30 days", "Trap"],
    ["Reach Battle Pass Level 50", "4,440", "$4.44", "30 days", "Trap"],
    ["Reach Battlepass level 40", "2,960", "$2.96", "30 days", "Grind"],
    ["Purchase the first gift pack ($0,99) within 24 hours", "1,850", "$1.85", "within 24 hours", "Trap"],
    ["Make any in-app purchase- Can be repeated daily", "1,850", "$1.85", "30 days", "Purchase"],
    ["Control Center (Main City) upgraded to Level 5", "1,850", "$1.85", "30 days", "Grind"],
    ["Reach Battlepass level 30", "1,629", "$1.63", "30 days", "Grind"],
    ["Reach Battlepass level 20", "1,000", "$1.00", "30 days", "Grind"],
    ["Control Center (Main City) upgraded to Level 3", "740", "$0.74", "30 days", "Grind"],
    ["Play 3 days in a row", "592", "$0.59", "3 days in a row", "Timed"],
    ["Complete the tutorial", "296", "$0.30", "30 days", "Easy"],
    ["Reach Battlepass level 10", "296", "$0.30", "30 days", "Grind"],
    ["Open and play the game", "148", "$0.15", "30 days", "Easy"],
];

const proofChecklist = [
    "Start from the Torox Android QR code or offerwall button before installing.",
    "Screenshot the offer terms, 30-day timer, task list, and reward amounts.",
    "Confirm the Torox activity entry shows the offer as clicked.",
    "Save your game ID, Control Center levels, Battle Pass levels, and alliance attack proof.",
    "Keep Google Play receipts for the gift pack, ship crates, and total spend task.",
];

const routeCards = [
    {
        title: "Tracking first",
        icon: ShieldCheck,
        copy: "Confirm the Torox clicked status before grinding or buying. Smaller tutorial and streak credits are useful signals before you risk paid tasks.",
    },
    {
        title: "Buy only with proof",
        icon: Receipt,
        copy: "Two purchases have 24-hour wording. Screenshot the live task row immediately before buying and keep every receipt.",
    },
    {
        title: "Push Control Center",
        icon: Building2,
        copy: "Level 9 is the largest non-purchase milestone at $29.60. Keep mining, missions, storage, and upgrades moving every day.",
    },
    {
        title: "Do daily activity",
        icon: Trophy,
        copy: "Battle Pass Level 50 depends on steady logins and Action Point use. Do not try to finish the pass in the final stretch.",
    },
];

const faqs = [
    {
        q: "Is the Infinite Lagrange Star Hunter offer worth doing?",
        a: "It can be worth doing if you want a high-value Android strategy offer and you are comfortable with a 30-day grind. The full task list pays $117.55, but several of the largest rewards require real purchases or high-value manual review proof.",
    },
    {
        q: "Which Infinite Lagrange Star Hunter tasks should I do first?",
        a: "Start with tracking, tutorial, the 3-day streak, and daily Battle Pass activity. If you plan to buy, decide on the $0.99 gift pack and 799-tier Ship Crate inside the first 24 hours because those deadlines cannot be recovered later.",
    },
    {
        q: "How do I reach Battle Pass Level 50 in Infinite Lagrange?",
        a: "Log in daily and spend Action Points through useful activity instead of letting them sit capped. Treat Level 50 as a daily rhythm task across the 30-day window, not a final-week sprint.",
    },
    {
        q: "What proof should I keep for Torox?",
        a: "Keep the offer page, Torox clicked status, game ID, milestone screens, purchase receipts, alliance attack proof, and Battle Pass level screens. Take extra proof for Control Center Level 9 and Battle Pass Level 50 because those are high-value tiers.",
    },
    {
        q: "Should I spend $50 on the Infinite Lagrange Star Hunter offer?",
        a: "Only spend $50 if the remaining payout is worth the risk to you. The $50 spend task pays $33.30, so it is not profitable by itself unless other purchase and progress tiers also credit.",
    },
];

const sources = [
    ["GPTHub offer listing", "https://gpthub.gg/offer/infinite-lagrange-star-hunter-ofskoqta"],
    ["Pocket Gamer base upgrade guide", "https://www.pocketgamer.com/infinite-lagrange/infinite-lagrange-guide-essential-tips-for-upgrading-your-base/"],
    ["Pocket Gamer Lagrange Pass tips", "https://www.pocketgamer.com/infinite-lagrange/strategy-tips-to-activate-the-lagrange-pass/"],
    ["Level Winner beginner guide", "https://www.levelwinner.com/infinite-lagrange-beginners-guide-tips-tricks-strategies/"],
    ["Torox missing reward FAQ", "https://torox.io/faq-missing-your-reward/"],
];

function JsonLd() {
    const article = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Infinite Lagrange Offer Guide: Star Hunter",
        description: metadata.description,
        datePublished: "2026-05-25",
        dateModified: "2026-05-25",
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
            { "@type": "ListItem", position: 3, name: "Infinite Lagrange Star Hunter", item: PAGE_URL },
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
            <p className="mb-2 text-xs font-extrabold uppercase text-cyan-700">{eyebrow}</p>
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">{title}</h2>
            {children ? <div className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{children}</div> : null}
        </div>
    );
}

function Warning({ children }: { children: ReactNode }) {
    return (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-950">
            <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" aria-hidden="true" />
                <div>{children}</div>
            </div>
        </div>
    );
}

function RouteVisual() {
    const stages = [
        ["Click", "Torox"],
        ["Build", "Level 9"],
        ["Pass", "Level 50"],
        ["Cash", "$117.55"],
    ];

    return (
        <div className="rounded-lg border border-cyan-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase text-cyan-700">Star Hunter route</p>
                    <p className="mt-1 text-3xl font-black text-slate-950">$117.55</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-cyan-200">
                    <Rocket className="h-7 w-7" aria-hidden="true" />
                </div>
            </div>
            <div className="grid gap-3">
                {stages.map(([label, value], index) => (
                    <div key={label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-xs font-black text-cyan-900">
                            {index + 1}
                        </span>
                        <div className="h-2 rounded-full bg-slate-100">
                            <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${(index + 1) * 25}%` }} />
                        </div>
                        <span className="text-sm font-extrabold text-slate-800">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function InfiniteLagrangeStarHunterPage() {
    return (
        <main className="min-h-screen bg-[#f7fbfc] text-slate-900">
            <JsonLd />
            <nav aria-label="Breadcrumb" className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-4 text-sm font-bold text-slate-500 sm:px-6">
                <Link href="/" className="hover:text-cyan-700">Home</Link>
                <span aria-hidden="true">/</span>
                <Link href="/guides" className="hover:text-cyan-700">Guides</Link>
                <span aria-hidden="true">/</span>
                <span className="text-slate-800">Infinite Lagrange</span>
            </nav>

            <section className="border-b border-cyan-200 bg-[#eaffff]">
                <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:py-14">
                    <div>
                        <Link href="/guides" className="mb-6 inline-flex text-sm font-bold text-cyan-800 hover:text-cyan-950">
                            Back to guides
                        </Link>
                        <p className="mb-3 inline-flex rounded-full border border-cyan-300 bg-white px-3 py-1 text-xs font-extrabold uppercase text-cyan-800">
                            Torox Android offer guide
                        </p>
                        <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                            Infinite Lagrange Offer Guide: Star Hunter
                        </h1>
                        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
                            The Infinite Lagrange offer guide pays up to $117.55 on Torox if you finish the Star Hunter Android task list within 30 days. The biggest rows are $50 total spend, Control Center Level 9, and the early ship crate purchases, so tracking proof matters before you put money in.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href="/offers"
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-extrabold text-cyan-200"
                            >
                                Compare current payouts <BadgeDollarSign className="h-4 w-4" aria-hidden="true" />
                            </Link>
                            <a
                                href="#payout-breakdown"
                                className="inline-flex items-center gap-2 rounded-lg border border-cyan-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-800"
                            >
                                View task table <Clock3 className="h-4 w-4" aria-hidden="true" />
                            </a>
                        </div>
                    </div>

                    <div className="lg:pt-10">
                        <RouteVisual />
                        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                            {[
                                ["30", "days"],
                                ["18", "tasks"],
                                ["$33.30", "top row"],
                            ].map(([value, label]) => (
                                <div key={label} className="rounded-lg border border-cyan-200 bg-white p-3">
                                    <p className="text-xl font-black text-slate-950">{value}</p>
                                    <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section id="payout-breakdown" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                <SectionHeading eyebrow="Payout table" title="Infinite Lagrange Star Hunter tasks">
                    <p>
                        Dollar values use the EarnGrind conversion rule: points divided by 1,000. This table keeps every number tied to the Torox task list.
                    </p>
                </SectionHeading>

                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-950 text-xs uppercase text-cyan-100">
                                <tr>
                                    <th className="px-4 py-3">Task</th>
                                    <th className="px-4 py-3">Points</th>
                                    <th className="px-4 py-3">USD</th>
                                    <th className="px-4 py-3">Limit</th>
                                    <th className="px-4 py-3">Type</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payoutRows.map(([task, points, usd, limit, type]) => (
                                    <tr key={task} className="align-top">
                                        <td className="px-4 py-3 font-bold text-slate-900">{task}</td>
                                        <td className="px-4 py-3 text-slate-600">{points}</td>
                                        <td className="px-4 py-3 font-extrabold text-lime-700">{usd}</td>
                                        <td className="px-4 py-3 text-slate-600">{limit}</td>
                                        <td className="px-4 py-3 text-slate-600">{type}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <section className="border-y border-slate-200 bg-white">
                <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                    <SectionHeading eyebrow="Route" title="What to do first">
                        <p>
                            The best route is not just playing harder. It is protecting tracking, making deadline purchases only when the terms still match, and keeping base and pass progress moving daily.
                        </p>
                    </SectionHeading>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {routeCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <div key={card.title} className="rounded-lg border border-slate-200 bg-[#f8fafc] p-5">
                                    <Icon className="mb-4 h-7 w-7 text-cyan-700" aria-hidden="true" />
                                    <h3 className="text-lg font-black text-slate-950">{card.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{card.copy}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                <section className="mb-12">
                    <SectionHeading eyebrow="Setup" title="Start with Torox tracking proof" />
                    <p className="text-base leading-8 text-slate-700">
                        Start the Infinite Lagrange Torox offer from the Android QR code or exact offerwall button, then confirm the offer appears in Torox activity. Torox says a missing reward request only works when the offer has a clicked status, so the install path matters before you even reach the tutorial.
                    </p>
                    <p className="mt-4 text-base leading-8 text-slate-700">
                        Screenshot the offer page before launch. Capture the 30-day deadline, purchase wording, point values, Android device requirement, and your Torox activity screen. After the tutorial, screenshot your game profile or ID screen so every later support ticket can tie the device, account, and offer together.
                    </p>
                    <div className="mt-6 rounded-lg border border-cyan-200 bg-cyan-50 p-5">
                        <h3 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-950">
                            <Camera className="h-5 w-5 text-cyan-700" aria-hidden="true" /> Proof checklist
                        </h3>
                        <ul className="grid gap-2 text-sm leading-6 text-slate-700">
                            {proofChecklist.map((item) => (
                                <li key={item} className="flex gap-2">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-lime-700" aria-hidden="true" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <Warning>
                        <strong>Do not delete Infinite Lagrange or clear app data until the high-value tiers credit.</strong> Keep the offer screenshot, Torox clicked status, game ID, milestone screens, and purchase receipts.
                    </Warning>
                </section>

                <section className="mb-12">
                    <SectionHeading eyebrow="Purchases" title="Handle ship crate and spend tasks carefully" />
                    <p className="text-base leading-8 text-slate-700">
                        The purchase side is where the risk changes from time to real cash. Your list includes the $0.99 first gift pack within 24 hours, any in-app purchase that can repeat daily, the 799-tier Ship Crate for $13 within 24 hours, the 888-tier Ship Crate for $13.80, and the $50 total spend milestone.
                    </p>
                    <p className="mt-4 text-base leading-8 text-slate-700">
                        The $50 spend task pays $33.30, which is the largest single payout in the offer. That does not make it profitable by itself. If you spend exactly $50 and only that task credits, you are still down money. The purchase route makes more sense only when you are also chasing the crate tasks, base progress, and Battle Pass progress.
                    </p>
                    <Warning>
                        <strong>The 799-tier Ship Crate task says &quot;$13 within 24 hours.&quot;</strong> Buying the wrong crate, buying after the first 24 hours, or losing the receipt can turn a $13 attempt into a support problem.
                    </Warning>
                </section>

                <section className="mb-12">
                    <SectionHeading eyebrow="Base route" title="Push Control Center Level 9" />
                    <p className="text-base leading-8 text-slate-700">
                        The Control Center chain is the core grind. You need Level 3, Level 5, Level 7, and Level 9. The Level 9 row alone pays $29.60, so treat base growth as your main free-to-play objective from day 1.
                    </p>
                    <p className="mt-4 text-base leading-8 text-slate-700">
                        Infinite Lagrange base progress depends on resources, construction queues, and main mission rewards. Beginner guides point to Metal, Crystals, and Deuterium as core resources, with utility ships mining deposits and returning the yield to base. Keep mining active whenever you are not fighting.
                    </p>
                    <p className="mt-4 text-base leading-8 text-slate-700">
                        Main mission chapters matter because they feed resources back into your account. Complete main missions early, keep warehouses upgraded, and build a steady resource flow. Do not max every side structure before pushing the next meaningful Control Center milestone.
                    </p>
                    <Warning>
                        <strong>Do not assume Level 7 proof will cover Level 9.</strong> The Level 9 payout is $29.60, and support may ask for exact milestone evidence.
                    </Warning>
                </section>

                <section className="mb-12">
                    <SectionHeading eyebrow="Daily activity" title="Reach Battle Pass Level 50" />
                    <p className="text-base leading-8 text-slate-700">
                        The Battle Pass path pays across five tiers: Level 10, 20, 30, 40, and 50. The first tier is only $0.30, but the full Battle Pass chain adds up to $10.33. More importantly, the activity that raises your pass often overlaps with the rest of the Star Hunter grind.
                    </p>
                    <p className="mt-4 text-base leading-8 text-slate-700">
                        Pocket Gamer&apos;s Lagrange Pass advice says daily login gives Activeness Points and Action Point spending can add more Activeness. Log in, collect pass and mission rewards, send utility ships out, spend AP on useful operations, check construction, and screenshot each pass milestone.
                    </p>
                    <Warning>
                        <strong>Do not leave Battle Pass Level 50 until the last few days.</strong> If AP, activity caps, or alliance timing slows you down, the $4.44 final pass tier can become unreachable.
                    </Warning>
                </section>

                <section className="mb-12">
                    <SectionHeading eyebrow="Alliance" title="Attack NPC cities with your alliance" />
                    <p className="text-base leading-8 text-slate-700">
                        &quot;Attack NPC cities with your alliance&quot; pays $5.18 and cannot be treated like a solo checklist item. Infinite Lagrange is built around unions, fleets, operations, and territory. Join an active alliance early, ideally on day 1 or day 2, and ask when they run NPC city attacks.
                    </p>
                    <p className="mt-4 text-base leading-8 text-slate-700">
                        Before the attack, repair ships, check AP, and place fleets where the alliance asks. After the task completes, screenshot the battle report, alliance screen, city target, and any Torox progress update.
                    </p>
                    <Warning>
                        <strong>This task depends on other people.</strong> If your alliance is quiet, move early instead of hoping one city attack appears before the 30-day deadline.
                    </Warning>
                </section>

                <section className="mb-12">
                    <SectionHeading eyebrow="Support" title="If Infinite Lagrange does not credit" />
                    <p className="text-base leading-8 text-slate-700">
                        Infinite Lagrange not crediting is a support problem, not a reason to panic in the first hour. Torox says users can submit a missing reward ticket after at least 24 hours have passed since completing the offer. The same FAQ says the offer must show clicked status before a missing reward request is available.
                    </p>
                    <p className="mt-4 text-base leading-8 text-slate-700">
                        If a small tier credits but a high-value tier stays pending, do not delete the app. Keep logging in until the issue resolves or the support window closes. High-value tiers like Control Center Level 9 and Battle Pass Level 50 deserve stronger proof than a single final screenshot.
                    </p>
                    <Warning>
                        <strong>A support ticket is weaker if the offer never shows as clicked.</strong> Check Torox activity immediately after starting, not after spending $50.
                    </Warning>
                </section>

                <section className="mb-12">
                    <SectionHeading eyebrow="FAQ" title="Infinite Lagrange Star Hunter questions" />
                    <div className="grid gap-4">
                        {faqs.map((item) => (
                            <div key={item.q} className="rounded-lg border border-slate-200 bg-white p-5">
                                <h3 className="text-lg font-black text-slate-950">{item.q}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-700">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mb-12">
                    <SectionHeading eyebrow="Sources" title="Research used" />
                    <ul className="grid gap-2 text-sm leading-6 text-slate-700">
                        {sources.map(([label, href]) => (
                            <li key={href}>
                                <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-2 font-bold text-cyan-800 hover:text-cyan-950">
                                    {label} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="rounded-lg bg-slate-950 p-6 text-white">
                    <p className="text-xs font-extrabold uppercase text-cyan-200">Updated {LAST_UPDATED}</p>
                    <h2 className="mt-2 text-2xl font-black">Ready to start the Star Hunter route?</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                        Compare current Infinite Lagrange payouts before starting, screenshot the live terms, and only buy when the wall still matches the task list.
                    </p>
                    <Link href="/offers" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cyan-200 px-5 py-3 text-sm font-extrabold text-slate-950">
                        Compare offers on EarnGrind <Users className="h-4 w-4" aria-hidden="true" />
                    </Link>
                </section>
            </article>
        </main>
    );
}
