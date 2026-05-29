import type { Metadata } from "next";
import type { ReactNode } from "react";
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
} from "lucide-react";
import { absoluteUrl } from "@/lib/site-url";

const PAGE_PATH = "/guides/mu-dark-epoch";
const PAGE_URL = absoluteUrl(PAGE_PATH);
const LAST_UPDATED = "May 27, 2026";

export const metadata: Metadata = {
    title: "MU Dark Epoch Offer Guide: 576,862 Torox Points",
    description:
        "Use this MU Dark Epoch offer guide to plan 576,862 Torox points, Android tracking, purchases, level tasks through 440, and proof screenshots before day 30.",
    alternates: {
        canonical: PAGE_URL,
    },
    openGraph: {
        title: "MU Dark Epoch Offer Guide: 576,862 Torox Points",
        description:
            "Complete the MU: Dark Epoch Torox Android offer with exact task payouts, purchase timing, level checkpoints, and missing-credit proof.",
        url: PAGE_URL,
        type: "article",
    },
    twitter: {
        card: "summary",
        title: "MU Dark Epoch Offer Guide",
        description:
            "Step-by-step MU: Dark Epoch Torox route for Android tracking, Diamonds, Month Cards, level 440 risk, and support proof.",
    },
};

const payoutRows = [
    ["Open the game", "9", "$0.009", "30 days", "Tracking"],
    ["Login the game", "50", "$0.050", "30 days", "Tracking"],
    ["Reach Character level 5", "75", "$0.075", "30 days", "Tracking"],
    ["Buy Diamonds 60 (eligible only if purchased within 3 days)", "1,492", "$1.492", "within 3 days", "Purchase"],
    ["Purchase the ultra special daily package - The reward can be repeated daily!", "1,327", "$1.327", "repeatable daily", "Purchase"],
    ["Reach Character level 15", "199", "$0.199", "30 days", "Level"],
    ["Reach Character level 30", "249", "$0.249", "30 days", "Level"],
    ["Purchase Month Card ($4.99) - eligible only if purchased within 7 days", "4,973", "$4.973", "within 7 days", "Purchase"],
    ["Reach Character level 60", "755", "$0.755", "30 days", "Level"],
    ["Reach Character level 98", "1,161", "$1.161", "30 days", "Level"],
    ["Buy Diamonds 980 (eligible only if purchased after 3 days or more)", "18,234", "$18.234", "after 3 days or more", "Purchase"],
    ["Reach Character level 112", "1,658", "$1.658", "30 days", "Level"],
    ["Purchase Month Card Plus ($12.99) - eligible only if purchased after 7 days or more", "16,576", "$16.576", "after 7 days or more", "Purchase"],
    ["Reach Character level 129", "1,990", "$1.990", "30 days", "Level"],
    ["Reach Character level 167", "4,973", "$4.973", "30 days", "Level"],
    ["Buy Diamonds 1980 (eligible only if purchased after 7 days or more)", "41,440", "$41.440", "after 7 days or more", "Purchase"],
    ["Reach Character level 199", "7,874", "$7.874", "30 days", "Level"],
    ["Purchase Diamonds 3280 ($49.99) - eligible only if purchased after 14 days or more", "49,728", "$49.728", "after 14 days or more", "Purchase"],
    ["Reach Character level 213", "10,941", "$10.941", "30 days", "Level"],
    ["Reach Character level 248", "22,792", "$22.792", "30 days", "Level"],
    ["Reach Character level 270", "44,756", "$44.756", "30 days", "Level"],
    ["Reach Character level 318", "74,592", "$74.592", "30 days", "Stretch"],
    ["Reach Character level 366", "96,970", "$96.970", "30 days", "Stretch"],
    ["Reach Character level 440", "174,048", "$174.048", "30 days", "Stretch"],
];

const navSections = [
    ["Executive assessment", "executive-assessment"],
    ["Payout table", "payout-breakdown"],
    ["Decision ladder", "decision-ladder"],
    ["Android setup", "android-setup"],
    ["Leveling route", "leveling-route"],
    ["Server and guild", "server-guild-class"],
    ["Purchases", "purchase-timing"],
    ["30-day playbook", "thirty-day-playbook"],
    ["Stretch goals", "stretch-goals"],
    ["Support", "missing-credit"],
    ["FAQ", "faq"],
];

const decisionSteps = [
    ["Confirm tracking", "Open, log in, reach level 5, and check Torox activity before spending."],
    ["Build around level 270", "Treat 270 as the primary expected-value goal, not a consolation prize."],
    ["Use purchase windows carefully", "Diamonds 60 and Month Card are early; later Diamond and Month Card Plus tasks require waiting."],
    ["Only stretch to 318 when ahead", "Level 318 needs older-server catch-up, EXP stacking, event discipline, uptime, and usually some spend."],
];

const levelGroups = [
    {
        title: "Early tracking",
        reward: "$0.373",
        levels: "Open, login, 5, 15, 30",
        copy: "Low payout, high signal. These rows prove whether the install, login, and early level callbacks are visible to Torox.",
    },
    {
        title: "Midgame pace",
        reward: "$11.477",
        levels: "60, 98, 112, 129, 167, 199",
        copy: "Use tasks, monster hunting, EXP items, and buffs. If these arrive late, do not spend aggressively on the top route.",
    },
    {
        title: "Late value",
        reward: "$78.489",
        levels: "213, 248, 270",
        copy: "These tiers start paying real money. Keep account, character, Torox, and date proof before moving to stretch goals.",
    },
    {
        title: "Stretch goals",
        reward: "$345.610",
        levels: "318, 366, 440",
        copy: "More than half the value is here, but 318 is a stretch and 366/440 are not dependable 30-day goals.",
    },
];

const communityReports = [
    ["No-spend new-server run", "Level 224 on day 13 and level 289 on day 30."],
    ["Late strategy learner", "Level 313 on day 30 after learning the EXP route late."],
    ["Near miss", "Level 317 on day 30, just short of the level 318 payout."],
    ["Optimized older-server spender", "Level 322 on day 24 with stronger guild/server setup."],
];

const playbookSteps = [
    ["Opening sprint", "Rush the task chain, join an active guild the same day, and secure Diamonds 60 and Month Card only inside their offer windows."],
    ["Daily engine", "Turn daily activity into contribution, then use contribution for Land of Demons and other high-EXP windows."],
    ["Saturday burst", "Save your best EXP resources for a long Saturday Land of Demons session instead of spending them randomly."],
    ["Class and gear discipline", "Advance around level 120 and 200 promptly, but spend gear resources only when they improve farming stability or speed."],
];

const proofChecklist = [
    "Torox offer page with every MU: Dark Epoch task visible.",
    "Android install path, first launch, login/profile, and account or server screen.",
    "Character level screenshots for every credited milestone.",
    "Google Play receipt and exact product screen for every purchase.",
    "Torox My Activity status before and after high-value tasks.",
    "One separate receipt and proof set for each repeatable daily package purchase.",
];

const purchaseRules = [
    ["Within 3 days", "Buy Diamonds 60", "$1.492", "Buy only if early tracking works and the product is exactly 60 Diamonds."],
    ["Repeatable daily", "Ultra special daily package", "$1.327", "Verify each daily credit before repeating heavily."],
    ["Within 7 days", "Month Card ($4.99)", "$4.973", "Near break-even before tax, so buy only if the product matches and tracking is clean."],
    ["After 3 days", "Diamonds 980", "$18.234", "Do not buy early. Screenshot task timing, product, receipt, and Torox status."],
    ["After 7 days", "Month Card Plus ($12.99)", "$16.576", "Wait for the after-day condition and match the exact card name."],
    ["After 7 days", "Diamonds 1980", "$41.440", "High-value purchase row. Do not assume a different pack will count."],
    ["After 14 days", "Diamonds 3280 ($49.99)", "$49.728", "Close to break-even before tax, so it needs clean tracking or level-route value."],
];

const faqs = [
    {
        q: "Can I reach character level 440 in 30 days?",
        a: "No source-backed evidence proves every player can reach character level 440 in 30 days. Treat level 440 as a stretch goal and decide based on your own level 270 pace, tracking history, and remaining time.",
    },
    {
        q: "Which MU: Dark Epoch purchase should I make first?",
        a: "Only consider purchases after Open the game, Login the game, and Reach Character level 5 behave correctly. The first timed purchase is Diamonds 60 within 3 days, while Month Card has a within-7-day window.",
    },
    {
        q: "Does one Diamond purchase credit several Torox tasks?",
        a: "Do not assume that. Diamonds 60, 980, 1980, and 3280 are separate task rows with different timing rules. Treat each as its own event unless your Torox activity proves otherwise.",
    },
    {
        q: "What should I screenshot for Torox support?",
        a: "Screenshot the offer task, character level, account or server, Torox My Activity, and receipts for purchases. For repeatable daily purchases, keep a separate proof set for each day.",
    },
    {
        q: "Does this guide confirm country eligibility?",
        a: "No. The submitted task list gives provider and Android device context, but it does not specify country eligibility. Check the live offer in your own Torox wall before starting.",
    },
];

const sources = [
    ["Google Play listing", "https://play.google.com/store/apps/details?gl=us&hl=en&id=com.global.mus"],
    ["LDPlayer leveling guide", "https://www.ldplayer.net/blog/mu-dark-epoch-leveling-guide.html"],
    ["LDPlayer class guide", "https://www.ldplayer.net/blog/mu-dark-epoch-class-guide.html"],
    ["Reward XP Torox support", "https://support.rewardxp.com/offerwalls/torox/"],
    ["Macadam Torox support", "https://help.macadam.app/en/articles/407589-contacting-torox-support"],
];

function JsonLd() {
    const article = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "MU Dark Epoch Offer Guide: 576,862 Torox Points",
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
            { "@type": "ListItem", position: 3, name: "MU Dark Epoch Offer Guide", item: PAGE_URL },
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
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.08em] text-teal-700">{eyebrow}</p>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
            {children ? <div className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{children}</div> : null}
        </div>
    );
}

function Warning({ children }: { children: ReactNode }) {
    return (
        <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-950">
            <div className="mb-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-rose-700">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Warning
            </div>
            {children}
        </div>
    );
}

function Tip({ children }: { children: ReactNode }) {
    return (
        <div className="mt-5 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-semibold leading-6 text-teal-950">
            <div className="mb-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-teal-700">
                <Camera className="h-4 w-4" aria-hidden="true" />
                Proof tip
            </div>
            {children}
        </div>
    );
}

function RouteVisual() {
    return (
        <div className="rounded-lg border border-teal-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-teal-700">30-day route</p>
                    <h2 className="text-lg font-black text-slate-950">Stoplight plan</h2>
                </div>
                <Gamepad2 className="h-7 w-7 text-teal-700" aria-hidden="true" />
            </div>
            <div className="space-y-3">
                {[
                    ["Green", "Tracking works; push levels and timed purchases.", "bg-lime-400"],
                    ["Yellow", "Levels are slow; keep grinding but avoid big spends.", "bg-amber-400"],
                    ["Red", "Early tasks failed; stop and document before buying.", "bg-rose-400"],
                ].map(([label, copy, color]) => (
                    <div key={label} className="grid grid-cols-[auto_1fr] gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <span className={`mt-1 h-3 w-3 rounded-full ${color}`} />
                        <div>
                            <p className="text-sm font-black text-slate-950">{label}</p>
                            <p className="text-sm leading-6 text-slate-600">{copy}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function MuDarkEpochGuidePage() {
    return (
        <main className="min-h-screen bg-[#f6f8f5] text-slate-900">
            <JsonLd />

            <section className="border-b border-teal-200 bg-[#e9f7f1]">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-14">
                    <div>
                        <Link href="/guides" className="mb-6 inline-flex text-sm font-bold text-teal-800 hover:text-teal-950">
                            Back to guides
                        </Link>
                        <p className="mb-3 inline-flex items-center gap-2 rounded-lg border border-teal-300 bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-[0.08em] text-teal-800">
                            <Smartphone className="h-4 w-4" aria-hidden="true" />
                            Torox Android offer guide
                        </p>
                        <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                            MU Dark Epoch Offer Guide: 576,862 Torox Points
                        </h1>
                        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
                            The MU Dark Epoch offer guide starts with one practical warning: the headline is large, but most of the value sits late. This Torox Android task list pays up to 576,862 points across login tasks, character levels, diamond purchases, Month Card purchases, and a level 440 stretch goal.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link href="/offers" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-extrabold text-lime-200">
                                Compare current offers
                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </Link>
                            <a href="#payout-breakdown" className="inline-flex items-center gap-2 rounded-lg border border-teal-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-900">
                                View payout table
                                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                            </a>
                        </div>
                    </div>

                    <aside className="rounded-lg border border-teal-300 bg-slate-950 p-5 text-white shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-lime-300 text-slate-950">
                                <BadgeDollarSign className="h-7 w-7" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-xs font-extrabold uppercase text-lime-200">Submitted task total</p>
                                <p className="text-3xl font-black">$576.862</p>
                            </div>
                        </div>
                        <div className="mt-5 rounded-lg border border-white/15 bg-white/10 p-4">
                            <p className="text-xs font-extrabold uppercase text-lime-200">Largest row</p>
                            <p className="mt-1 text-2xl font-black">Level 440</p>
                            <p className="mt-2 text-sm leading-6 text-lime-50">
                                The final task pays 174,048 points, but it should be treated as a stretch goal inside the 30-day window.
                            </p>
                        </div>
                        <div className="mt-5 text-sm font-semibold text-lime-100">Updated {LAST_UPDATED}</div>
                    </aside>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <article className="space-y-10">
                        <section className="rounded-lg border border-teal-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.08em] text-teal-700">
                                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                                Section navigation
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {navSections.map(([label, id]) => (
                                    <a
                                        key={id}
                                        href={`#${id}`}
                                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 hover:border-teal-300 hover:bg-teal-50"
                                    >
                                        {label}
                                    </a>
                                ))}
                            </div>
                        </section>

                        <section id="executive-assessment" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <SectionHeading eyebrow="Executive assessment" title="Plan around level 270, not level 440">
                                <p>
                                    The best expected-value strategy is to treat level 270 as the primary target, level 318 as a stretch, and level 366 plus 440 as unreliable goals for a typical 30-day offerwall player.
                                </p>
                            </SectionHeading>
                            <div className="grid gap-4 md:grid-cols-2">
                                {communityReports.map(([label, report]) => (
                                    <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <h3 className="text-base font-black text-slate-950">{label}</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-700">{report}</p>
                                    </div>
                                ))}
                            </div>
                            <Warning>
                                The raw level 440 payout is large, but the available strategy evidence does not support using it as the default 30-day plan. Build around 270 first, then decide if 318 is live.
                            </Warning>
                        </section>

                        <section id="payout-breakdown" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <SectionHeading eyebrow="Payout table" title="MU: Dark Epoch Torox rewards">
                                <p>
                                    Payouts come from the submitted Torox task list only. Dollar values use the EarnGrind rule: points divided by 1,000.
                                </p>
                            </SectionHeading>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="bg-slate-950 text-white">
                                        <tr>
                                            <th className="px-4 py-3 font-extrabold">Task</th>
                                            <th className="px-4 py-3 font-extrabold">Points</th>
                                            <th className="px-4 py-3 font-extrabold">USD</th>
                                            <th className="px-4 py-3 font-extrabold">Timing</th>
                                            <th className="px-4 py-3 font-extrabold">Type</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {payoutRows.map(([task, points, usd, limit, type]) => (
                                            <tr key={task} className="align-top odd:bg-white even:bg-slate-50">
                                                <td className="px-4 py-3 font-semibold text-slate-950">{task}</td>
                                                <td className="px-4 py-3 text-slate-700">{points}</td>
                                                <td className="px-4 py-3 font-extrabold text-teal-700">{usd}</td>
                                                <td className="px-4 py-3 text-slate-700">{limit}</td>
                                                <td className="px-4 py-3 text-slate-700">{type}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section id="decision-ladder" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <SectionHeading eyebrow="Decision ladder" title="Use this offer as a stoplight">
                                <p>
                                    The first rows are low value, but they tell you whether Torox sees the install and account. Do not make the expensive decisions until those signals are clean.
                                </p>
                            </SectionHeading>
                            <div className="grid gap-4 md:grid-cols-2">
                                {decisionSteps.map(([title, copy], index) => (
                                    <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-sm font-black text-teal-900">
                                            {index + 1}
                                        </div>
                                        <h3 className="text-lg font-black text-slate-950">{title}</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-700">{copy}</p>
                                    </div>
                                ))}
                            </div>
                            <Warning>
                                Do not spend just because a later level reward looks large. Spend only when the earlier tasks tracked, the product wording matches, and your level pace still supports the 30-day route.
                            </Warning>
                        </section>

                        <section id="android-setup">
                            <SectionHeading eyebrow="Setup" title="Android setup and first tracking checks" />
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    Scan on the Android device you plan to use for the whole run. Start from Torox, open the Google Play path, install MU: Dark Epoch, and keep the same device, Google account, game account, and network pattern as much as possible.
                                </p>
                                <p>
                                    The first tasks are Open the game, Login the game, and Reach Character level 5. Screenshot the Torox task list before you start, the first launch, the login or profile screen, character level 5, and Torox My Activity.
                                </p>
                                <p>
                                    MU: Dark Epoch is listed on Google Play by 37GAMES with in-app purchases. Public app listing language describes dungeons, guild play, PvP, trading, high drops, and AFK leveling, which is useful context for a level-based route.
                                </p>
                            </div>
                            <Tip>
                                If open, login, or level 5 does not credit or appear as expected, pause before buying Diamonds, Month Card, or the daily package.
                            </Tip>
                        </section>

                        <section id="leveling-route">
                            <SectionHeading eyebrow="Leveling route" title="How the MU: Dark Epoch leveling route actually works">
                                <p>
                                    This run is less about mechanical skill and more about account setup, EXP routing, uptime, and event timing.
                                </p>
                            </SectionHeading>
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    Start with the task chain because it unlocks the systems and zones that matter later. After the opening rush, the run becomes an EXP optimization loop built around tasks, monster hunting, EXP potions, hourglass-style boosts, Benediction or similar EXP gain effects, event windows, and long auto-combat uptime.
                                </p>
                                <p>
                                    Saturday is the premium grinding window in the strongest strategy notes. Some sources describe a 1.5x monster EXP effect, while offer runners often describe the stacked Saturday/Land of Demons value as closer to a 2x-style burst. The safe takeaway is the same: save your best contribution and EXP resources for the best burst window.
                                </p>
                            </div>
                            <Tip>
                                Think in burst windows, not constant consumption. Save contribution and premium EXP resources for your best Saturday Land of Demons session.
                            </Tip>
                        </section>

                        <section id="server-guild-class">
                            <SectionHeading eyebrow="Setup choices" title="Older server, active guild, practical class">
                                <p>
                                    Server, guild, and class choices shape how realistic level 318 becomes.
                                </p>
                            </SectionHeading>
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    Community runners repeatedly point to older servers as the better offer setup because catch-up mechanics can make progress much faster than a fresh-server start. An older high-world-level server is the setup that keeps showing up in stronger 300+ reports.
                                </p>
                                <p>
                                    Join an active guild immediately. Guild quests, world content, boss participation, and cooperative event activity feed the same progression engine that makes Land of Demons and EXP stacking matter.
                                </p>
                                <p>
                                    For class choice, do not over-optimize endgame fantasy. Ranged PvE comfort such as Dark Wizard/Archmage-style or Energy Elf-style play is a reasonable offer-run bias because safe farming and unattended killing matter more than PvP identity.
                                </p>
                            </div>
                            <Warning>
                                Some strategy notes are iOS/App Store oriented. This submitted Torox task says Android, so keep the offer click, install, account, and payment path on the Android device that started the route.
                            </Warning>
                        </section>

                        <section id="purchase-timing">
                            <SectionHeading eyebrow="Purchases" title="Diamonds, Month Cards, and daily package timing">
                                <p>
                                    The purchase tasks are where the route can turn from profitable to messy. Match the exact wording on the offer screen and the exact visible product in the game store.
                                </p>
                            </SectionHeading>
                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead className="bg-teal-900 text-white">
                                            <tr>
                                                <th className="px-4 py-3">Timing</th>
                                                <th className="px-4 py-3">Task</th>
                                                <th className="px-4 py-3">Value</th>
                                                <th className="px-4 py-3">Rule</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {purchaseRules.map(([timing, task, value, rule]) => (
                                                <tr key={task} className="align-top odd:bg-white even:bg-slate-50">
                                                    <td className="px-4 py-3 font-bold text-slate-950">{timing}</td>
                                                    <td className="px-4 py-3 text-slate-700">{task}</td>
                                                    <td className="px-4 py-3 font-extrabold text-teal-700">{value}</td>
                                                    <td className="px-4 py-3 text-slate-700">{rule}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <Warning>
                                One purchase may not credit multiple purchase rows. Treat every purchase task as its own event unless Torox activity proves otherwise.
                            </Warning>
                        </section>

                        <section id="thirty-day-playbook" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <SectionHeading eyebrow="30-day playbook" title="The route that gives level 318 a chance">
                                <p>
                                    The stronger reports keep pointing to the same loop: rush unlocks, build daily contribution, save it, then spend it in stacked EXP windows.
                                </p>
                            </SectionHeading>
                            <div className="grid gap-4 md:grid-cols-2">
                                {playbookSteps.map(([title, copy]) => (
                                    <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <h3 className="text-lg font-black text-slate-950">{title}</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-700">{copy}</p>
                                    </div>
                                ))}
                            </div>
                            <Warning>
                                After level 200, pace can slow sharply. If you are behind the stronger community paths by late week 3, level 318 becomes a poor-risk chase and level 270 becomes the sensible finish line.
                            </Warning>
                        </section>

                        <section id="stretch-goals">
                            <SectionHeading eyebrow="Level route" title="Level 15 to 440 route decisions">
                                <p>
                                    Leveling guidance sources point to tasks, monster hunting, EXP potions, and EXP gain buffs as important ways to gain EXP in MU: Dark Epoch. Use those systems around the offer checkpoints, not as generic gameplay filler.
                                </p>
                            </SectionHeading>
                            <div className="grid gap-4 md:grid-cols-2">
                                {levelGroups.map((group) => (
                                    <div key={group.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="mb-3 flex items-center justify-between gap-4">
                                            <h3 className="text-lg font-black text-slate-950">{group.title}</h3>
                                            <span className="rounded-lg bg-lime-100 px-2.5 py-1 text-sm font-extrabold text-lime-800">{group.reward}</span>
                                        </div>
                                        <p className="text-sm font-bold text-teal-800">{group.levels}</p>
                                        <p className="mt-2 text-sm leading-6 text-slate-700">{group.copy}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    Keep progression tasks moving before grinding idle monsters. Use EXP boosts when you can actually play, not during a short idle window. Join cooperative or guild content when it helps unlock better progression or EXP sources.
                                </p>
                                <p>
                                    Reach Character level 270 is the last major checkpoint before the stretch tier stack. If you barely reach level 270 near the end of the 30-day window, level 318, 366, and 440 are not a safe assumption. Level 318 is only worth chasing when your server, guild, event participation, EXP stack, and daily uptime are clearly ahead of the average reports.
                                </p>
                            </div>
                            <Warning>
                                Do not treat level 366 or 440 as dependable 30-day milestones. Fresh servers, missed events, weak guild activity, or late discovery of the Land of Demons/contribution loop can make those rows unrealistic.
                            </Warning>
                        </section>

                        <section id="missing-credit">
                            <SectionHeading eyebrow="Missing credit" title="If your MU: Dark Epoch offer does not credit" />
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    Torox support guidance points users toward the My Activity area and Missing Credits for missing rewards. Support proof should include screenshots, the exact game name, and the exact mission or level completed.
                                </p>
                                <p>
                                    Use the exact task text in a ticket: &quot;Reach Character level 270&quot; or &quot;Purchase Diamonds 3280 ($49.99) - eligible only if purchased after 14 days or more.&quot; Attach the matching level screen, receipt if relevant, offer screenshot, account ID, and Torox status.
                                </p>
                                <p>
                                    If early tasks never tracked, be conservative. If several early tiers tracked and one later tier is delayed, your proof chain is stronger.
                                </p>
                            </div>
                        </section>

                        <section id="worth-it">
                            <SectionHeading eyebrow="Worth it" title="Is the MU: Dark Epoch Torox offer worth doing?" />
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    The offer can be worth doing if you want a high-ceiling Android MMORPG offer and you are willing to manage tracking, purchases, and proof carefully. The total is 576,862 points, but the route is top-heavy.
                                </p>
                                <p>
                                    It is not a good casual offer if you only want to open the game and play lightly. The early level payouts are small, some purchases are close to break-even, and the top level task is valuable but unproven as a safe 30-day target for every player.
                                </p>
                            </div>
                        </section>

                        <section id="faq" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <SectionHeading eyebrow="FAQ" title="MU: Dark Epoch Torox questions" />
                            <div className="divide-y divide-slate-200">
                                {faqs.map((item) => (
                                    <div key={item.q} className="py-5 first:pt-0 last:pb-0">
                                        <h3 className="text-lg font-black text-slate-950">{item.q}</h3>
                                        <p className="mt-2 text-base leading-7 text-slate-700">{item.a}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-lg border border-lime-200 bg-slate-950 p-6 text-white">
                            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-lime-200">Compare before you start</p>
                            <h2 className="mt-2 text-2xl font-black">Check current MU: Dark Epoch payouts</h2>
                            <p className="mt-3 max-w-3xl text-base leading-7 text-lime-50">
                                Use the live Torox task list as the final payout source before you spend money or grind toward level 440.
                            </p>
                            <Link href="/offers" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-lime-300 px-5 py-3 text-sm font-extrabold text-slate-950">
                                Compare offers on EarnGrind
                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        </section>
                    </article>

                    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
                        <RouteVisual />

                        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.08em] text-teal-700">
                                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                Proof checklist
                            </div>
                            <ul className="space-y-3">
                                {proofChecklist.map((item) => (
                                    <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                                        <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-teal-700" aria-hidden="true" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.08em] text-slate-700">
                                <Receipt className="h-4 w-4" aria-hidden="true" />
                                Sources
                            </div>
                            <ul className="space-y-2 text-sm leading-6">
                                {sources.map(([label, href]) => (
                                    <li key={href}>
                                        <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 font-semibold text-teal-700 underline">
                                            {label}
                                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-lg border border-lime-200 bg-lime-50 p-5">
                            <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.08em] text-lime-700">
                                <Trophy className="h-4 w-4" aria-hidden="true" />
                                Top payout
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                                Level 318, 366, and 440 are worth $345.610 together. Chase them only if the route is already working.
                            </p>
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    );
}
