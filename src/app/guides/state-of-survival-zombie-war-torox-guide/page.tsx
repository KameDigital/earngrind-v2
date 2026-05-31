import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    AlertTriangle,
    BadgeDollarSign,
    CalendarClock,
    Camera,
    CheckCircle2,
    ExternalLink,
    Gamepad2,
    Receipt,
    ShieldCheck,
    Smartphone,
    Trophy,
    Users,
} from "lucide-react";
import { absoluteUrl } from "@/lib/site-url";

const PAGE_PATH = "/guides/state-of-survival-zombie-war-torox-guide";
const PAGE_URL = absoluteUrl(PAGE_PATH);
const LAST_UPDATED = "May 30, 2026";
const APP_ICON_URL = "https://www.appbrain.com/stats/libraries/image/com.kingsgroup.sos";

export const metadata: Metadata = {
    title: "State of Survival Zombie War Torox Guide: HQ, Power, Purchases",
    description:
        "State of Survival Zombie War Torox guide for US Android users: compare tasks, deadlines, HQ goals, purchases, proof, and risk before you start safely.",
    alternates: {
        canonical: PAGE_URL,
    },
    openGraph: {
        title: "State of Survival Zombie War Torox Guide",
        description:
            "Plan the Gain.gg Torox State of Survival Android offer with exact task payouts, HQ targets, power goals, purchase risk, and missing-credit proof.",
        url: PAGE_URL,
        type: "article",
        images: [{ url: APP_ICON_URL }],
    },
    twitter: {
        card: "summary",
        title: "State of Survival Zombie War Torox Guide",
        description:
            "Task-by-task State of Survival route for Torox/Gain.gg tracking, HQ milestones, power goals, purchase decisions, and support proof.",
        images: [APP_ICON_URL],
    },
};

const navSections = [
    ["Payout table", "payout-table"],
    ["Before you start", "before-you-start"],
    ["Game basics", "game-basics"],
    ["Systems", "systems-that-matter"],
    ["Spend gates", "spend-gate-decision-table"],
    ["Task route", "task-route"],
    ["Proof", "proof-and-support"],
    ["FAQ", "faq"],
];

const payoutRows = [
    ["Install", "9", "$0.009", "No task deadline stated", "Tracking"],
    ["Reach power 10w within 18 days", "233", "$0.233", "within 18 days", "Power"],
    ["Reach power 40w within 18 days", "726", "$0.726", "within 18 days", "Power"],
    ["Reach power 200w within 18 days", "1,451", "$1.451", "within 18 days", "Power"],
    ["Upgrade headquarter to level 16 within 18 days", "1,741", "$1.741", "within 18 days", "HQ"],
    ["Purchase any 4.99 package in 7 days within 7 days", "2,176", "$2.176", "within 7 days", "Purchase"],
    ["Reach power 10m within 18 days", "2,321", "$2.321", "within 18 days", "Power"],
    ["Purchase any 9.99 package in 30 days within 30 days", "3,481", "$3.481", "within 30 days", "Purchase"],
    ["Upgrade headquarter to level 20 within 18 days", "4,932", "$4.932", "within 18 days", "HQ"],
    ["Purchase any 19.99 package", "7,253", "$7.253", "No task deadline stated", "Purchase"],
    ["Purchase any 49.99 package in 7 days within 7 days", "17,405", "$17.405", "within 7 days", "Purchase"],
    ["Upgrade headquarter to level 23 within 22 days", "23,207", "$23.207", "within 22 days", "HQ"],
    ["Cumulative purchase over USD 100 in 15 days within 15 days", "24,864", "$24.864", "within 15 days", "Purchase"],
    ["Upgrade headquarter to level 28 within 22 days", "40,612", "$40.612", "within 22 days", "Stretch"],
    ["Reach power 90m within 22 days", "145,040", "$145.04", "within 22 days", "Stretch"],
];

const setupChecks = [
    "Use a US Android device and a first-time install path.",
    "Start from Gain.gg, open the Torox offer, then install from that tracked path.",
    "Screenshot the full offer page, provider, task list, payouts, and deadlines before installing.",
    "Open the app, register, and save your player ID or profile screen immediately.",
    "Check Torox activity before making optional purchases when possible.",
];

const systemCards = [
    {
        icon: Trophy,
        title: "Headquarters gates",
        copy: "HQ 16, 20, 23, and 28 are building-chain tasks. Plan around Headquarters, Hero Precinct, secondary building gates, resources, prosperity, and construction time.",
    },
    {
        icon: Gamepad2,
        title: "Power growth",
        copy: "Power should be treated as broad account growth from buildings, troops, research, heroes, training, and upgrades, not one isolated stat.",
    },
    {
        icon: Users,
        title: "Alliance support",
        copy: "An active alliance can provide timer help, store access, crates, and tech benefits. A quiet alliance makes the deadline pressure harder.",
    },
    {
        icon: Receipt,
        title: "Purchases and proof",
        copy: "The 4.99, 9.99, 19.99, 49.99, and cumulative USD 100 rows are requirements, not payouts. Keep receipts and activity screenshots.",
    },
];

const spendGateRows = [
    ["Before spending", "Install or early tasks show tracking evidence, and you have screenshots.", "Install is not visible in activity, or you cannot find player ID/proof screens."],
    ["First 7 days", "You are active daily, in an alliance, and early HQ/power progress is moving.", "You would need to buy only to chase low-value early rewards."],
    ["Around HQ 20", "You still have resources, speedups, and clear building gates.", "HQ prerequisites are lagging and power is not compounding."],
    ["Purchase threshold", "Purchases also help HQ/power goals you can realistically finish.", "Buying only unlocks one reward while late tasks look out of reach."],
    ["HQ 28 and 90m power", "You are already near the path, with strong progress and acceptable spend risk.", "You are far behind before the 22-day deadline."],
];

const taskGroups = [
    {
        title: "Install and early tracking",
        tasks: "Install",
        copy: "Start from the Gain.gg/Torox route, open the app, register, and capture your player profile. The Install payout is tiny, so its real value is confirming tracking and proof before you risk money.",
        proof: "Offer page, clicked/activity state, Google Play install screen, first-open screen, player ID.",
    },
    {
        title: "Early power tasks",
        tasks: "Reach power 10w within 18 days; Reach power 40w within 18 days; Reach power 200w within 18 days",
        copy: "Handle these as broad growth checks. Upgrade useful buildings, train troops, use beginner rewards, join an alliance, and avoid idle builders. Keep the offer's 10w, 40w, and 200w labels in your proof.",
        proof: "Profile or power screen after crossing each milestone, plus Torox activity state.",
    },
    {
        title: "HQ 16 and HQ 20",
        tasks: "Upgrade headquarter to level 16 within 18 days; Upgrade headquarter to level 20 within 18 days",
        copy: "Keep Headquarters prerequisites visible every day. The wiki progression data shows Hero Precinct and secondary building gates around these targets, so do not let required buildings fall behind while chasing side upgrades.",
        proof: "HQ level screen, upgrade-complete screen, profile/player ID.",
    },
    {
        title: "Early purchase decisions",
        tasks: "Purchase any 4.99 package in 7 days within 7 days; Purchase any 49.99 package in 7 days within 7 days",
        copy: "These seven-day rows are proof-sensitive and can cost more than their individual rewards. Buy only from a tracked app session after checking activity evidence, and only if the package helps larger HQ or power goals.",
        proof: "Package screen before purchase, confirmation screen, receipt, player ID, Torox activity.",
    },
    {
        title: "Mid-offer growth and flexible purchases",
        tasks: "Reach power 10m within 18 days; Purchase any 9.99 package in 30 days within 30 days; Purchase any 19.99 package",
        copy: "Use the 10m power target as a progress check. The 9.99 row has a 30-day purchase window, and the 19.99 row has no stated task deadline, so do not rush either one without tracking confidence.",
        proof: "Power screen, receipts for purchases, activity status, account ID.",
    },
    {
        title: "Late HQ stretch",
        tasks: "Upgrade headquarter to level 23 within 22 days; Upgrade headquarter to level 28 within 22 days",
        copy: "HQ 23 starts the late pressure. HQ 28 is high risk because advanced prerequisites, resources, prosperity, and long timers stack up. Community Torox reports are useful as caution, not as a guarantee.",
        proof: "HQ completion screens, profile ID, task screenshot, Torox status before and after.",
    },
    {
        title: "Cumulative purchase and 90m power",
        tasks: "Cumulative purchase over USD 100 in 15 days within 15 days; Reach power 90m within 22 days",
        copy: "Treat cumulative spend as a separate threshold and keep every receipt. The 90m power row is the largest payout and the least certain milestone; no source verified a dependable low-spend route in the 22-day window.",
        proof: "All receipts, purchase history, power screen, profile ID, Torox activity.",
    },
];

const proofChecklist = [
    "Full offer page with task list, provider, country/device context, and date.",
    "Torox activity or clicked status when visible.",
    "Google Play install screen, first-open screen, and player ID.",
    "Power milestone screenshots with the value visible.",
    "HQ completion screens for levels 16, 20, 23, and 28.",
    "Package screen, purchase confirmation, receipt, and purchase history.",
];

const faqs = [
    {
        q: "Is the State of Survival Zombie War Torox offer worth doing?",
        a: "It can be worth considering if you accept spend risk, play actively, and stop when tracking or progress is weak. The maximum listed payout is high, but the late value is tied to HQ 28 and 90m power.",
    },
    {
        q: "Can I finish HQ 28 or 90m power without spending?",
        a: "Do not assume that. The research supports that HQ and power growth depend on buildings, resources, troops, research, heroes, alliances, timers, and often spending pressure.",
    },
    {
        q: "Should I buy the package tasks early?",
        a: "Only after you have tracking proof and a reason the purchase helps larger tasks. The 4.99 and 49.99 package rows have 7-day windows; the 9.99 row has 30 days; the 19.99 row has no stated task deadline.",
    },
    {
        q: "What if Torox does not credit State of Survival?",
        a: "Collect proof, then use the Torox activity/support path when eligible. Gain.gg hosts the offer, but missing offerwall credit generally goes back through the offerwall provider.",
    },
    {
        q: "What does 10w or 40w mean in the task list?",
        a: "Use the labels exactly as the offer shows them. Screenshot the in-game power display when you believe you crossed the target and keep the original task screenshot for comparison.",
    },
];

const sources = [
    ["Google Play listing", "https://play.google.com/store/apps/details?hl=en-US&id=com.kingsgroup.sos"],
    ["FunPlus State of Survival page", "https://funplus.com/games/state-of-survival/"],
    ["State of Survival Headquarters wiki", "https://state-of-survival.fandom.com/wiki/Headquarters"],
    ["State of Survival Alliance wiki", "https://state-of-survival.fandom.com/wiki/Alliance"],
    ["State of Survival Training Camp wiki", "https://state-of-survival.fandom.com/wiki/Training_Camp"],
    ["Torox missing reward FAQ", "https://torox.io/faq-missing-your-reward/"],
    ["Gain.gg FAQ", "https://gain.gg/faq"],
];

function JsonLd() {
    const article = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "State of Survival Zombie War Torox Guide: HQ, Power, Purchases",
        description: metadata.description,
        datePublished: "2026-05-30",
        dateModified: "2026-05-30",
        mainEntityOfPage: PAGE_URL,
        author: { "@type": "Organization", name: "EarnGrind" },
        publisher: { "@type": "Organization", name: "EarnGrind" },
        image: APP_ICON_URL,
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
            { "@type": "ListItem", position: 3, name: "State of Survival Zombie War Torox Guide", item: PAGE_URL },
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
            <p className="mb-2 text-xs font-extrabold uppercase text-emerald-700">{eyebrow}</p>
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">{title}</h2>
            {children ? <div className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{children}</div> : null}
        </div>
    );
}

function Callout({ icon: Icon, tone, children }: { icon: typeof AlertTriangle; tone: "warning" | "proof"; children: ReactNode }) {
    const className = tone === "warning"
        ? "border-red-200 bg-red-50 text-red-950"
        : "border-emerald-200 bg-emerald-50 text-emerald-950";
    const iconClassName = tone === "warning" ? "text-red-600" : "text-emerald-700";

    return (
        <div className={`mt-5 rounded-lg border p-4 text-sm leading-6 ${className}`}>
            <div className="flex gap-3">
                <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${iconClassName}`} aria-hidden="true" />
                <div>{children}</div>
            </div>
        </div>
    );
}

function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
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
                                <td key={`${row[0]}-${index}`} className={index === 2 ? "px-4 py-3 font-extrabold text-emerald-700" : "px-4 py-3 text-slate-700"}>
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function StateOfSurvivalToroxGuidePage() {
    return (
        <main className="min-h-screen bg-[#f4f6f1] text-slate-900">
            <JsonLd />
            <section className="relative overflow-hidden bg-slate-950 text-white">
                <div className="absolute inset-0 opacity-35" aria-hidden="true">
                    <div className="h-full w-full bg-[radial-gradient(circle_at_18%_25%,rgba(16,185,129,0.34),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(250,204,21,0.18),transparent_30%),linear-gradient(135deg,#0f172a,#111827_58%,#064e3b)]" />
                </div>
                <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-14">
                    <div>
                        <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-extrabold uppercase text-emerald-200">
                            <span className="rounded-full border border-emerald-300/40 px-3 py-1">Torox via Gain.gg</span>
                            <span className="rounded-full border border-emerald-300/40 px-3 py-1">US Android</span>
                            <span className="rounded-full border border-emerald-300/40 px-3 py-1">Updated {LAST_UPDATED}</span>
                        </div>
                        <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                            State of Survival Zombie War Torox guide: tasks, HQ goals, purchases, and risk
                        </h1>
                        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
                            This State of Survival Zombie War Torox guide is for a US Android user starting from Gain.gg with a fresh install. The task list has a high maximum payout, but the route mixes power goals, Headquarters upgrades, short purchase windows, and two late milestones that should be treated as high risk before you spend.
                        </p>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <a href="#payout-table" className="rounded-lg bg-emerald-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-200">
                                Review payout table
                            </a>
                            <Link href="/offers" className="rounded-lg border border-white/25 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">
                                Compare live offers
                            </Link>
                        </div>
                    </div>
                    <aside className="rounded-lg border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur">
                        <div className="flex items-center gap-4">
                            <Image
                                src={APP_ICON_URL}
                                alt="State of Survival: Zombie War app icon"
                                width={80}
                                height={80}
                                className="h-20 w-20 rounded-2xl border border-white/20 object-cover"
                            />
                            <div>
                                <p className="text-xs font-extrabold uppercase text-emerald-200">Offer snapshot</p>
                                <p className="mt-1 text-2xl font-black">275,451 pts</p>
                                <p className="text-sm text-slate-300">$275.451 by the guide conversion rule</p>
                            </div>
                        </div>
                        <div className="mt-5 grid gap-3 text-sm">
                            <div className="rounded-lg bg-slate-950/45 p-4">
                                <p className="font-extrabold text-white">Best-fit user</p>
                                <p className="mt-1 text-slate-300">First-time US Android player who can document tracking and stop if early credit looks weak.</p>
                            </div>
                            <div className="rounded-lg bg-slate-950/45 p-4">
                                <p className="font-extrabold text-white">Verdict</p>
                                <p className="mt-1 text-slate-300">High ceiling, high risk. Late HQ and 90m power tasks are not safe to assume.</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>

            <nav className="border-b border-slate-200 bg-white" aria-label="Guide sections">
                <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
                    {navSections.map(([label, anchor]) => (
                        <a key={anchor} href={`#${anchor}`} className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-extrabold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50">
                            {label}
                        </a>
                    ))}
                </div>
            </nav>

            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <section id="payout-table" className="mb-12">
                    <SectionHeading eyebrow="Task list" title="Payout table">
                        <p>
                            The task list is the only payout and deadline source here. Points convert at 1,000 points = 1 USD. Purchase amounts are requirements, not rewards.
                        </p>
                    </SectionHeading>
                    <DataTable columns={["Task", "Points", "USD equivalent", "Deadline", "Type"]} rows={payoutRows} />
                    <Callout icon={AlertTriangle} tone="warning">
                        The offer looks attractive because the final power task is large. The risk is that several purchase tasks happen before you know whether every later milestone will be practical on your server, with your alliance, and within your available playtime.
                    </Callout>
                </section>

                <section id="before-you-start" className="mb-12 rounded-lg border border-slate-200 bg-white p-6">
                    <SectionHeading eyebrow="Tracking setup" title="Before you start">
                        <p>
                            Start only if you can use the exact Gain.gg to Torox to Google Play path on the Android device you plan to play on. If the game is already on your Google account, another device, or a previous tracking path, that is a real crediting risk.
                        </p>
                    </SectionHeading>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {setupChecks.map((item) => (
                            <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                                <Smartphone className="mb-3 h-5 w-5 text-emerald-700" aria-hidden="true" />
                                {item}
                            </div>
                        ))}
                    </div>
                </section>

                <section id="game-basics" className="mb-12">
                    <SectionHeading eyebrow="Game context" title="Game basics">
                        <p>
                            State of Survival: Zombie War is a mobile strategy survival game from FunPlus International AG on Google Play. For this offer, the key point is that you are completing account-growth tasks: power, Headquarters levels, and purchase rows.
                        </p>
                        <p className="mt-3">
                            The guide uses wiki progression pages for building-system context, not as a promise that the live game will match every timer or requirement exactly. Confirm in the game before committing speedups or paid packs to a specific upgrade path.
                        </p>
                    </SectionHeading>
                </section>

                <section id="systems-that-matter" className="mb-12">
                    <SectionHeading eyebrow="Progression systems" title="Systems that matter" />
                    <div className="grid gap-4 md:grid-cols-2">
                        {systemCards.map(({ icon: Icon, title, copy }) => (
                            <div key={title} className="rounded-lg border border-slate-200 bg-white p-5">
                                <Icon className="mb-4 h-6 w-6 text-emerald-700" aria-hidden="true" />
                                <h3 className="text-lg font-black text-slate-950">{title}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="spend-gate-decision-table" className="mb-12">
                    <SectionHeading eyebrow="Decision block" title="Spend gate decision table">
                        <p>This is a high-ceiling, high-risk offer. Use the table before deciding how far to push.</p>
                    </SectionHeading>
                    <DataTable columns={["Stage", "Continue if", "Stop or slow down if"]} rows={spendGateRows} />
                </section>

                <section id="task-route" className="mb-12">
                    <SectionHeading eyebrow="Route" title="Task route">
                        <p>
                            Every task below uses the task-list deadline and payout source. Treat community completion reports as caution only, not as proof that your account will finish the late milestones.
                        </p>
                    </SectionHeading>
                    <div className="grid gap-4">
                        {taskGroups.map((group) => (
                            <article key={group.title} className="rounded-lg border border-slate-200 bg-white p-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-950">{group.title}</h3>
                                        <p className="mt-1 text-xs font-extrabold uppercase text-emerald-700">{group.tasks}</p>
                                    </div>
                                    <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-emerald-700" aria-hidden="true" />
                                </div>
                                <p className="mt-4 text-sm leading-7 text-slate-700">{group.copy}</p>
                                <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
                                    <span className="font-extrabold">Proof: </span>{group.proof}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="proof-and-support" className="mb-12 rounded-lg border border-slate-200 bg-white p-6">
                    <SectionHeading eyebrow="Support" title="Proof and support">
                        <p>
                            Your proof trail should be ready before any purchase task. Torox says missing reward tickets can be submitted from activity/support with proof when eligible, and Gain.gg points missing offerwall credit issues back to the provider.
                        </p>
                    </SectionHeading>
                    <div className="grid gap-3 md:grid-cols-2">
                        {proofChecklist.map((item) => (
                            <div key={item} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                                <Camera className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                    <Callout icon={ShieldCheck} tone="proof">
                        Do not wait until the final day to organize screenshots. Support tickets are easier when each screenshot has a clear timestamp, account identifier, and task evidence.
                    </Callout>
                </section>

                <section id="faq" className="mb-12">
                    <SectionHeading eyebrow="Questions" title="FAQ" />
                    <div className="grid gap-4">
                        {faqs.map((item) => (
                            <details key={item.q} className="rounded-lg border border-slate-200 bg-white p-5">
                                <summary className="cursor-pointer text-base font-black text-slate-950">{item.q}</summary>
                                <p className="mt-3 text-sm leading-7 text-slate-700">{item.a}</p>
                            </details>
                        ))}
                    </div>
                </section>

                <section id="next-step" className="mb-12 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
                    <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div>
                            <p className="text-xs font-extrabold uppercase text-emerald-700">Next step</p>
                            <h2 className="mt-2 text-2xl font-black text-slate-950">Compare the current live offers before starting.</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                                If this State of Survival task list is still the best option, start only after you are ready to document tracking, progress, purchases, and support evidence from day one.
                            </p>
                        </div>
                        <Link href="/offers" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-emerald-200">
                            Browse offers <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-6">
                    <SectionHeading eyebrow="Research" title="Sources" />
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {sources.map(([label, href]) => (
                            <a key={href} href={href} target="_blank" rel="noopener noreferrer nofollow" className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50">
                                {label}
                            </a>
                        ))}
                    </div>
                    <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <CalendarClock className="h-4 w-4" aria-hidden="true" />
                        Source notes captured May 30, 2026. Payouts and deadlines come from the provided task list.
                    </p>
                </section>
            </div>
        </main>
    );
}
