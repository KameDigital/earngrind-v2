import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    BadgeDollarSign,
    Camera,
    CheckCircle2,
    ExternalLink,
    Gamepad2,
    Receipt,
    ShieldCheck,
    Smartphone,
    Trophy,
} from "lucide-react";
import { absoluteUrl } from "@/lib/site-url";

const PAGE_PATH = "/guides/woodoku-blast";
const PAGE_URL = absoluteUrl(PAGE_PATH);
const LAST_UPDATED = "May 27, 2026";

export const metadata: Metadata = {
    title: "Woodoku Blast Offer Guide: Journey Level Route",
    description:
        "Earn up to $293.71 with this Woodoku Blast offer guide, including Journey level deadlines, purchase timing, Torox tracking, and proof tips for every milestone.",
    alternates: {
        canonical: PAGE_URL,
    },
    openGraph: {
        title: "Woodoku Blast Offer Guide: Journey Level Route",
        description:
            "Complete the Woodoku Blast Torox offer with Android tracking setup, Journey level deadlines, purchase timing, and missing-credit proof.",
        url: PAGE_URL,
        type: "article",
    },
    twitter: {
        card: "summary",
        title: "Woodoku Blast Offer Guide",
        description:
            "Step-by-step Woodoku Blast Torox route for Journey Level 2000, purchase timing, daily sessions, and support proof.",
    },
};

const payoutRows = [
    ["Clear Level 2000 in Journey mode in 30 Days", "148,000", "$148.00", "30 Days", "Trap"],
    ["Clear Level 1600 in Journey mode in 20 Days", "59,200", "$59.20", "20 Days", "Timed"],
    ["Clear Level 1200 in Journey mode in 15 Days", "29,600", "$29.60", "15 Days", "Timed"],
    ["Clear Level 900 in Journey mode in 10 Days", "14,800", "$14.80", "10 Days", "Timed"],
    ["Clear Level 700 in Journey mode in 8 Days", "10,360", "$10.36", "8 Days", "Timed"],
    ["Make a Purchase Of At Least $4.99", "7,400", "$7.40", "", "Purchase"],
    ["Clear Level 500 in Journey mode after 7 Days", "7,400", "$7.40", "after 7 Days", "Trap"],
    ["Clear Level 400 in Journey mode in 5 days", "5,550", "$5.55", "5 days", "Timed"],
    ["Clear Level 325 in Journey mode in 5 Days", "3,700", "$3.70", "5 Days", "Timed"],
    ["Clear Level 275 in Journey mode in 4 Days", "2,220", "$2.22", "4 Days", "Timed"],
    ["Clear Level 225 in Journey mode in 4 Days", "1,629", "$1.63", "4 Days", "Timed"],
    ["Clear Level 150 in Journey mode after 3 days", "1,036", "$1.04", "after 3 days", "Trap"],
    ["Clear Level 100 in Journey mode in 3 Days", "740", "$0.74", "3 Days", "Timed"],
    ["Clear Level 70 in Journey mode in 2 days", "555", "$0.56", "2 days", "Timed"],
    ["Clear Level 50 in Journey mode in 2 days", "444", "$0.44", "2 days", "Timed"],
    ["Clear Level 40 in Journey mode in 2 days", "348", "$0.35", "2 days", "Timed"],
    ["Clear Level 32 in Journey mode in 2 days", "274", "$0.27", "2 days", "Timed"],
    ["Clear Level 20 in Journey mode in 24 Hours", "185", "$0.19", "24 Hours", "Timed"],
    ["Clear Level 10 in Journey mode in 12 hours", "104", "$0.10", "12 hours", "Timed"],
    ["Open The App And Start A Session Daily", "74", "$0.07", "", "Daily"],
    ["Clear Level 5 in Journey mode in 12 hours", "41", "$0.04", "12 hours", "Timed"],
    ["Open and play the game", "37", "$0.04", "", "Easy"],
    ["Clear Level 1 in Journey mode in 12 hours", "15", "$0.02", "12 hours", "Timed"],
];

const earlyMilestones = [
    ["Open and play", "$0.04", "", "Torox activity plus app home screen"],
    ["Level 1", "$0.02", "12 hours", "Journey map showing Level 1 cleared"],
    ["Daily session", "$0.07", "Daily", "App open/session screen each day"],
    ["Level 5", "$0.04", "12 hours", "Journey map showing Level 5 cleared"],
    ["Level 10", "$0.10", "12 hours", "Journey map showing Level 10 cleared"],
    ["Level 20", "$0.19", "24 Hours", "Journey map showing Level 20 cleared"],
    ["Level 32", "$0.27", "2 days", "Journey map showing Level 32 cleared"],
    ["Level 40", "$0.35", "2 days", "Journey map showing Level 40 cleared"],
    ["Level 50", "$0.44", "2 days", "Journey map showing Level 50 cleared"],
    ["Level 70", "$0.56", "2 days", "Journey map showing Level 70 cleared"],
    ["Level 100", "$0.74", "3 Days", "Journey map showing Level 100 cleared"],
];

const midMilestones = [
    ["Purchase $4.99+", "$7.40", "", "Receipt, product page, Torox activity"],
    ["Level 150", "$1.04", "after 3 days", "Journey map after day 3"],
    ["Level 225", "$1.63", "4 Days", "Journey map at Level 225"],
    ["Level 275", "$2.22", "4 Days", "Journey map at Level 275"],
    ["Level 325", "$3.70", "5 Days", "Journey map at Level 325"],
    ["Level 400", "$5.55", "5 days", "Journey map and account/device detail"],
    ["Level 500", "$7.40", "after 7 Days", "Journey map after day 7"],
];

const lateMilestones = [
    ["Level 700", "$10.36", "8 Days", "Journey map, account detail, Torox activity"],
    ["Level 900", "$14.80", "10 Days", "Journey map, account detail, Torox activity"],
    ["Level 1200", "$29.60", "15 Days", "Journey map/profile, Torox activity before and after"],
    ["Level 1600", "$59.20", "20 Days", "Journey map/profile, account ID, device date"],
    ["Level 2000", "$148.00", "30 Days", "Completion screen or map, account ID, Torox activity, device date"],
];

const proofChecklist = [
    "Start from the Torox Android scan or offerwall path before installing.",
    "Screenshot the offer terms, task list, reward amounts, and 30-day timer.",
    "Use the same Android device, Google Play account, and app install for the full route.",
    "Save Journey map proof at every $5+ milestone and before continuing past it.",
    "Keep the Google Play receipt for the $4.99 purchase task.",
];

const faqs = [
    {
        q: "How do I play Journey mode in Woodoku Blast?",
        a: "Use the Journey button in the bottom right of the screen, then select the current level on the map. The Woodoku Blast offer guide tasks require Journey mode clears, so make sure you are progressing on the Journey map rather than only playing classic or event modes.",
    },
    {
        q: "Can I finish the Woodoku Blast Torox offer in 30 days?",
        a: "The submitted task list gives 30 Days for Level 2000, so that is the full-route window. Whether you can finish depends on play time, clear speed, ads, failed levels, and whether Torox keeps crediting each milestone.",
    },
    {
        q: "Should I make the $4.99 purchase right away?",
        a: "No. The purchase pays $7.40, but you should wait until the install and early Journey milestones show that Torox is tracking. Buy the smallest qualifying $4.99+ product, save the receipt, and avoid extra purchases unless the live terms require them.",
    },
    {
        q: "What if Torox does not credit a Journey level?",
        a: "Wait for normal delayed credit, then check Torox activity and gather screenshots before opening support. Include the exact milestone, Journey map proof, account details, device information, and completion time.",
    },
    {
        q: "Are there working Woodoku Blast promo codes?",
        a: "No official active Woodoku Blast promo codes were verified for this guide. Unverified third-party code pages were excluded because stale or fake codes can waste time and push users toward unsafe downloads.",
    },
];

const sources = [
    ["Google Play listing", "https://play.google.com/store/apps/details?id=com.tripledot.blockbash"],
    ["Woodoku Journey support", "https://woodoku.zendesk.com/hc/en-us/articles/4419672485009-How-do-I-play-the-Journey"],
    ["App Store listing", "https://apps.apple.com/us/app/woodoku-blast/id6608975929"],
    ["Reward XP offer crediting guide", "https://support.rewardxp.com/technical-issues/offers-not-crediting-guide/"],
    ["Points Castle missing points guide", "https://pointscastle.com/help/missing-points-from-arcade-or-offerwall"],
];

function JsonLd() {
    const article = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Woodoku Blast Offer Guide: Journey Level Route",
        description: metadata.description,
        datePublished: "2026-05-27",
        dateModified: "2026-05-27",
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
            { "@type": "ListItem", position: 3, name: "Woodoku Blast Offer Guide", item: PAGE_URL },
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

function Tip({ children }: { children: ReactNode }) {
    return (
        <div className="mt-5 rounded-lg border border-lime-200 bg-lime-50 p-4 text-sm leading-6 text-lime-950">
            <div className="flex gap-3">
                <Camera className="mt-0.5 h-5 w-5 flex-shrink-0 text-lime-700" aria-hidden="true" />
                <div>{children}</div>
            </div>
        </div>
    );
}

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
    return (
        <div className="mb-6">
            <p className="mb-2 text-xs font-extrabold uppercase text-lime-700">{eyebrow}</p>
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">{title}</h2>
            {children ? <div className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{children}</div> : null}
        </div>
    );
}

function MilestoneTable({ rows, columns }: { rows: string[][]; columns: [string, string, string, string] }) {
    return (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-950 text-white">
                    <tr>
                        {columns.map((column) => (
                            <th key={column} className="px-4 py-3 font-extrabold">{column}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {rows.map((row) => (
                        <tr key={row.join("|")} className="odd:bg-white even:bg-slate-50">
                            {row.map((cell, index) => (
                                <td key={`${row[0]}-${index}`} className={index === 1 ? "px-4 py-3 font-extrabold text-lime-700" : "px-4 py-3 text-slate-700"}>
                                    {cell || "-"}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function RouteVisual() {
    const stages = [
        ["Click", "Torox"],
        ["Rush", "Level 100"],
        ["Proof", "Level 500"],
        ["Finish", "Level 2000"],
    ];

    return (
        <div className="rounded-lg border border-lime-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase text-lime-700">Journey route</p>
                    <p className="mt-1 text-3xl font-black text-slate-950">$293.71</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-lime-300">
                    <Gamepad2 className="h-7 w-7" aria-hidden="true" />
                </div>
            </div>
            <div className="grid gap-3">
                {stages.map(([label, value], index) => (
                    <div key={label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-100 text-sm font-black text-lime-900">
                            {index + 1}
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                            <div className="h-2 rounded-full bg-lime-500" style={{ width: `${25 + index * 25}%` }} />
                        </div>
                        <div className="text-right">
                            <p className="text-[11px] font-extrabold uppercase text-slate-500">{label}</p>
                            <p className="text-sm font-black text-slate-950">{value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function WoodokuBlastOfferGuidePage() {
    return (
        <main className="min-h-screen bg-[#e9efe8] text-slate-900">
            <JsonLd />

            <section className="eg-visual-frame">
                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                    <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white/55" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-white">Home</Link>
                        <span>/</span>
                        <Link href="/guides" className="hover:text-white">Guides</Link>
                        <span>/</span>
                        <span className="text-white">Woodoku Blast</span>
                    </nav>
                </div>

                <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:pb-16">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 border border-lime-300/35 bg-lime-300/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand-lime)]">
                            <Trophy className="h-4 w-4" aria-hidden="true" />
                            Torox Android Journey offer
                        </div>
                        <h1 className="max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.07em] text-white sm:text-7xl">
                            Woodoku Blast offer guide: Journey Level Route
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-white/68">
                            Up to $293.71 is available in this Woodoku Blast offer guide if every Torox Journey milestone tracks correctly. The task list is simple on paper: install on Android, play daily, make a $4.99 purchase, and push Journey mode from Level 1 to Level 2000 inside the submitted deadlines.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link href="/offers" className="inline-flex items-center gap-2 bg-[var(--brand-lime)] px-5 py-3 text-sm font-extrabold text-slate-950">
                                Compare Woodoku offers
                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </Link>
                            <Link href="/best-gpt-sites" className="inline-flex items-center gap-2 border border-white/15 bg-white/5 px-5 py-3 text-sm font-extrabold text-white">
                                Compare GPT sites
                            </Link>
                        </div>
                    </div>

                    <aside className="border border-lime-300/30 bg-white/[0.06] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center bg-lime-300 text-slate-950">
                                <BadgeDollarSign className="h-7 w-7" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-xs font-extrabold uppercase text-lime-200">Submitted task total</p>
                                <p className="text-3xl font-black">$293.71</p>
                            </div>
                        </div>
                        <div className="mt-5 rounded-lg border border-white/15 bg-white/10 p-4">
                            <p className="text-xs font-extrabold uppercase text-lime-200">Final goal</p>
                            <p className="mt-1 text-2xl font-black">Level 2000</p>
                            <p className="mt-2 text-sm leading-6 text-lime-50">
                                The $148.00 final tier has a 30 Days deadline and needs the strongest proof trail.
                            </p>
                        </div>
                        <div className="mt-5 text-sm font-semibold text-lime-100">Updated {LAST_UPDATED}</div>
                    </aside>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <article className="min-w-0 space-y-10">
                        <section className="border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
                            <SectionHeading eyebrow="Payout table" title="Woodoku Blast Torox rewards">
                                Payout values come from the submitted Torox task list only, with points converted at points / 1000.
                            </SectionHeading>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="bg-slate-950 text-white">
                                        <tr>
                                            <th className="px-4 py-3 font-extrabold">Task</th>
                                            <th className="px-4 py-3 font-extrabold">Points</th>
                                            <th className="px-4 py-3 font-extrabold">USD</th>
                                            <th className="px-4 py-3 font-extrabold">Limit</th>
                                            <th className="px-4 py-3 font-extrabold">Type</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {payoutRows.map(([task, points, usd, limit, type]) => (
                                            <tr key={task} className="odd:bg-white even:bg-slate-50">
                                                <td className="px-4 py-3 font-semibold text-slate-950">{task}</td>
                                                <td className="px-4 py-3 text-slate-700">{points}</td>
                                                <td className="px-4 py-3 font-extrabold text-lime-700">{usd}</td>
                                                <td className="px-4 py-3 text-slate-700">{limit || "-"}</td>
                                                <td className="px-4 py-3 text-slate-700">{type}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <SectionHeading eyebrow="Before install" title="Device and Torox tracking setup" />
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    The Woodoku Blast Torox offer is shown as an Android scan-and-play offer, so treat Android as required even though public store listings also show iOS availability. Scan or open the offer on the same Android device you plan to use for the full 30-day route.
                                </p>
                                <p>
                                    Use a fresh install and keep the same device, Google Play account, and app data for the full offer. Disable VPN, proxy, private DNS blocking, ad blockers, and battery tools that can interfere with tracking before you click the offer.
                                </p>
                            </div>
                            <Warning>
                                Do not use an emulator, reinstall, clear app data, switch devices, or restore old progress during the offer. Those actions can break the chain between Torox, the advertiser, and your Journey progress.
                            </Warning>
                        </section>

                        <section>
                            <SectionHeading eyebrow="Promo codes" title="Woodoku Blast offer guide: Promo Codes" />
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    There are no official active Woodoku Blast promo codes verified for this guide as of May 27, 2026. Search results included third-party code pages, but those claims were not confirmed by official Woodoku Blast or Tripledot sources.
                                </p>
                                <p>
                                    No official redemption menu was found in the official sources checked for this route. If Woodoku Blast adds codes later, redeem only through a visible in-app settings, inbox, store, or support field.
                                </p>
                            </div>
                        </section>

                        <section>
                            <SectionHeading eyebrow="First sprint" title="Woodoku Blast offer guide: First 100 Journey Levels">
                                Official Woodoku support says Journey mode is reached from the Journey button in the bottom right of the screen. Press the current Journey level, clear it, return to the map, and continue from there.
                            </SectionHeading>
                            <MilestoneTable rows={earlyMilestones} columns={["Target", "Reward", "Deadline", "What to capture"]} />
                            <div className="mt-5 space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    The first 12 hours are a tracking test. You need Level 1, Level 5, and Level 10 inside that same 12-hour wording, then Level 20 within 24 Hours. These tiny rewards tell you whether the install and Journey events are reporting.
                                </p>
                                <p>
                                    Front-load levels while the puzzles are still moving quickly. If you hit a frustrating level, step away instead of wasting a full session while tired.
                                </p>
                            </div>
                            <Warning>
                                If Level 1, Level 5, or Level 10 does not track, pause. Early non-tracking is a sign that the install path or device state may already be broken.
                            </Warning>
                            <Tip>
                                After Level 1, capture the Journey map and the Torox activity page. The payout is tiny, but this gives you a baseline before the route becomes expensive.
                            </Tip>
                        </section>

                        <section>
                            <SectionHeading eyebrow="Purchase and midgame" title="Woodoku Blast offer guide: Purchase and Midgame Levels" />
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    The purchase task says &quot;Make a Purchase Of At Least $4.99&quot; and pays 7,400 points, which is $7.40. Public app-store data shows a $4.99 pack exists for Woodoku Blast. That makes the purchase potentially net-positive, but only if tracking works and taxes or a higher product choice do not erase the margin.
                                </p>
                                <p>
                                    Before buying, screenshot the Torox task, the in-app product page showing the $4.99 price, and your account or profile if the app shows one. After buying, keep the Google Play receipt and capture the app state after the purchase.
                                </p>
                            </div>
                            <div className="mt-5">
                                <MilestoneTable rows={midMilestones} columns={["Target", "Reward", "Deadline wording", "Proof plan"]} />
                            </div>
                            <Warning>
                                Do not make the $4.99 purchase until the early Torox goals have tracked. A $7.40 reward is only useful if Torox can see your app events.
                            </Warning>
                            <Tip>
                                At Level 400 and Level 500, capture the Journey map immediately after the clear. Include any visible account or profile detail, then capture Torox activity before continuing.
                            </Tip>
                        </section>

                        <section>
                            <SectionHeading eyebrow="Late route" title="Woodoku Blast offer guide: Late Route to Level 2000">
                                The late route is where the guide shifts from casual play advice to proof management. These tiers are worth defending with screenshots, session logs, and clean device habits.
                            </SectionHeading>
                            <MilestoneTable rows={lateMilestones} columns={["Target", "Reward", "Deadline", "Proof plan"]} />
                            <div className="mt-5 space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    Do not treat the late tiers as one giant push. Break them into session blocks and check tracking after every paid milestone. If Level 700 credits but Level 900 does not, pause and gather proof before adding 300 more levels.
                                </p>
                                <p>
                                    Clear space before you chase a single line, keep flexible openings for awkward pieces, and avoid playing while tilted after repeated failed attempts.
                                </p>
                            </div>
                            <Tip>
                                For Level 1200, Level 1600, and Level 2000, capture a fuller proof set: Journey map or profile, account identifier if visible, device date/time, and Torox activity.
                            </Tip>
                            <Warning>
                                Level 2000 is the highest tracking-risk milestone because it carries the $148.00 reward. Do not rely on memory, a cropped screenshot, or a screen that only shows a puzzle board without Journey progress.
                            </Warning>
                        </section>

                        <section>
                            <SectionHeading eyebrow="Missing credit" title="Woodoku Blast offer guide: If Torox Doesn't Credit" />
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    Game milestones can take time to report. If a Woodoku Blast Torox offer step does not credit immediately, wait long enough for normal delayed credit, then check the Torox activity screen. Treat missing credit as a stop-and-document moment, not a reason to grind blindly.
                                </p>
                                <p>
                                    Gather the Torox offer page, failed milestone name, Journey screenshot, account or profile details, Android device model, Google Play receipt for the $4.99 purchase, and the date/time you completed the task.
                                </p>
                                <p>
                                    When you contact support, be specific. &quot;Clear Level 1200 in Journey mode in 15 Days did not credit&quot; is better than &quot;my game did not pay.&quot; If this route becomes unreliable, <Link href="/offers" className="font-bold text-lime-700 underline">compare current offer options on EarnGrind</Link>.
                                </p>
                            </div>
                        </section>

                        <section className="border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
                            <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
                            <div className="divide-y divide-slate-200">
                                {faqs.map((item) => (
                                    <div key={item.q} className="py-5 first:pt-0 last:pb-0">
                                        <h3 className="text-lg font-black text-slate-950">{item.q}</h3>
                                        <p className="mt-2 text-base leading-7 text-slate-700">{item.a}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="border border-lime-200 bg-slate-950 p-6 text-white">
                            <h2 className="text-2xl font-black">Compare current Woodoku Blast payouts</h2>
                            <p className="mt-3 max-w-3xl text-base leading-7 text-lime-50">
                                Ready to compare this route against other GPT offers? Use the live Torox task list as the payout source before you spend money or grind toward Level 2000.
                            </p>
                            <Link href="/offers" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-lime-300 px-5 py-3 text-sm font-extrabold text-slate-950">
                                Compare offers on EarnGrind
                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        </section>
                    </article>

                    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
                        <RouteVisual />

                        <div className="border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
                            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase text-lime-700">
                                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                Proof checklist
                            </div>
                            <ul className="space-y-3">
                                {proofChecklist.map((item) => (
                                    <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                                        <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-lime-600" aria-hidden="true" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
                            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase text-slate-700">
                                <Receipt className="h-4 w-4" aria-hidden="true" />
                                Sources
                            </div>
                            <ul className="space-y-2 text-sm leading-6">
                                {sources.map(([label, href]) => (
                                    <li key={href}>
                                        <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-lime-700 underline">
                                            {label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-lg border border-lime-200 bg-lime-50 p-5">
                            <div className="flex items-center gap-2 text-sm font-extrabold uppercase text-lime-700">
                                <Smartphone className="h-4 w-4" aria-hidden="true" />
                                Android only
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                                The submitted offer says to scan on an Android device. Keep the route on one Android install from click to Level 2000.
                            </p>
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    );
}
