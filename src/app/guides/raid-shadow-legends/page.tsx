import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    AlertTriangle,
    BadgeDollarSign,
    BookOpen,
    Camera,
    CheckCircle2,
    Clock3,
    ExternalLink,
    Gamepad2,
    PackageCheck,
    Receipt,
    ShieldCheck,
    Sparkles,
    Star,
    Trophy,
} from "lucide-react";
import { absoluteUrl } from "@/lib/site-url";

const PAGE_PATH = "/guides/raid-shadow-legends";
const PAGE_URL = absoluteUrl(PAGE_PATH);
const LAST_UPDATED = "May 30, 2026";
const HERO_IMAGE_SRC = "/images/guides/gpt-sites/gain-gg.png";
const HERO_IMAGE_URL = absoluteUrl(HERO_IMAGE_SRC);

export const metadata: Metadata = {
    title: "Raid: Shadow Legends Offer Guide: Gain.gg Android Tasks",
    description:
        "Use this Raid: Shadow Legends offer guide to judge 361,695 Gain.gg points, Android tracking, purchase risk, Sacred Shards, and level goals before spending.",
    alternates: {
        canonical: PAGE_URL,
    },
    openGraph: {
        title: "Raid: Shadow Legends Offer Guide: Gain.gg Android Tasks",
        description:
            "Complete the Raid: Shadow Legends Gain.gg Android offer with exact task payouts, tracking setup, purchase cautions, Sacred Shards, Champion ranks, and proof steps.",
        url: PAGE_URL,
        type: "article",
        images: [{ url: HERO_IMAGE_URL }],
    },
    twitter: {
        card: "summary",
        title: "Raid: Shadow Legends Offer Guide",
        description:
            "Step-by-step Raid: Shadow Legends Gain.gg route for Android tracking, purchases, Sacred Shards, 5-star and 6-star Champions, and support proof.",
        images: [HERO_IMAGE_URL],
    },
};

const navSections = [
    ["Payouts", "payouts"],
    ["Setup", "setup"],
    ["Game Basics", "game-basics"],
    ["Systems", "systems"],
    ["Worth It", "worth-it"],
    ["Task Route", "task-route"],
    ["Proof", "proof"],
    ["Support", "support"],
    ["FAQ", "faq"],
];

const payoutRows = [
    ["Register and start playing the game", "370", "$0.370", "No specific deadline in task row", "Tracking test"],
    ["Complete the tutorial", "37", "$0.037", "No specific deadline in task row", "Finish before spending"],
    ["Fight 20 Battles within 24 Hours", "89", "$0.089", "within 24 Hours", "Day-one proof task"],
    ["Reach level 15 within 3 Days", "111", "$0.111", "within 3 Days", "Screenshot account/profile level"],
    ["Upgrade a hero to 5 stars within 3 days", "185", "$0.185", "within 3 days", "Early Tavern/rank pressure"],
    ["Make any purchase. Can be repeated daily (1 time per 24 hours)", "2,220", "$2.220", "Can be repeated daily (1 time per 24 hours)", "Buy only after early tracking works"],
    ["Purchase Silver 500k pack for $9.99", "11,100", "$11.100", "No specific deadline in task row", "Exact named pack only"],
    ["Purchase the Daily Gem Pack for $9.99", "11,100", "$11.100", "No specific deadline in task row", "Exact named pack only"],
    ["Reach Level 30 Within 4 Days", "444", "$0.444", "Within 4 Days", "Tight early level task"],
    ["Upgrade 3 heroes to 5 stars within 5 Days", "740", "$0.740", "within 5 Days", "Resource-heavy"],
    ["Upgrade a hero to 6 stars within 10 Days", "1,110", "$1.110", "within 10 Days", "Major rank-up bottleneck"],
    ["Upgrade 5 heroes to 5 stars within 14 Days", "1,850", "$1.850", "within 14 Days", "Can compete with 6-star food needs"],
    ["Purchase a Sacred Daily Pack for $29.99", "25,900", "$25.900", "No specific deadline in task row", "High-value review risk"],
    ["Purchase the Beginner Progress Pack for $49.99 (Eligible only if purchased after Day 7)", "44,400", "$44.400", "Eligible only if purchased after Day 7", "Do not buy early"],
    ["Purchase Box of Gems for $29.99 (Eligible only if purchased after Day 30)", "37,000", "$37.000", "Eligible only if purchased after Day 30", "Verify the offer is still active"],
    ["Open 2 Sacred (Yellow) Shards", "2,220", "$2.220", "No specific deadline in task row", "Portal task"],
    ["Upgrade 3 heroes to 6 stars within 21 Days", "5,920", "$5.920", "within 21 Days", "Very high resource task"],
    ["Open 4 Sacred (Yellow) Shards", "5,920", "$5.920", "No specific deadline in task row", "Continue only after earlier shard credit"],
    ["Reach Level 50 within 21 days", "14,800", "$14.800", "within 21 days", "Late grind"],
    ["Open 6 Sacred (Yellow) Shards", "16,280", "$16.280", "No specific deadline in task row", "Expensive or slow if short on Shards"],
    ["Open 8 Sacred (Yellow) Shards", "28,120", "$28.120", "No specific deadline in task row", "Highest shard tier"],
    ["Reach Level 60 within 35 days", "37,000", "$37.000", "within 35 days", "Stretch goal"],
    ["Reach Level 70 within 60 days", "125,800", "$125.800", "within 60 days", "Largest payout and highest grind risk"],
];

const gameSystems = [
    {
        title: "Campaign, Battles, and Multi-Battle",
        icon: Gamepad2,
        body: [
            "Use the opening Campaign and normal early battles for the 20-battle task, early account progress, XP, Silver, and general growth.",
            "Plarium support says Multi-Battle can run repeated Campaign or Dungeon battles after a stage has been beaten manually or on Auto. It also says Campaign and Dungeons have 30 free Multi-Battle attempts per day.",
            "Multi-Battle result screens can be useful proof because they can show completed battle count, XP, Silver, Energy, Gems, and rewards.",
        ],
    },
    {
        title: "Tavern, Champion Rank, and Star Tasks",
        icon: Star,
        body: [
            "The Tavern unlocks at Level 6 and lets players level Champions, upgrade Champion Rank, upgrade skills, and Ascend Champions.",
            "Plarium support lists rank caps as Rank 1 level 10, Rank 2 level 20, Rank 3 level 30, Rank 4 level 40, Rank 5 level 50, and Rank 6 level 60.",
            "Upgrading Champion Rank requires same-rank Champions or Chickens, and moving to Rank 6 needs five Rank 5 Champions or Chickens. That is why the 5-star and 6-star tasks are resource walls.",
        ],
    },
    {
        title: "Sacred Shards and the Portal",
        icon: Sparkles,
        body: [
            "The offer tasks are opening Sacred Yellow Shards, not pulling a specific Champion.",
            "Plarium support says players should check the Portal event state before opening Shards if they care about event timing. That is separate from the Gain.gg requirement.",
            "Opening Shards is irreversible, so screenshot your Sacred Shard count before opening, the Portal results, and the Gain.gg task status afterward.",
        ],
    },
    {
        title: "Purchases and Receipts",
        icon: Receipt,
        body: [
            "Raid has in-app purchases, and Google Play warns that some paid items may not be refundable depending on item type.",
            "For Android purchase problems, Plarium support recommends checking stable internet, the correct Google Account, card and address details, Google Play cache, and pending transactions.",
            "For this offer, exact pack matching matters. Do not treat any $9.99 purchase as the same as the Silver 500k pack or Daily Gem Pack unless the live offerwall explicitly says substitutes count.",
        ],
    },
];

const decisionRows = [
    ["Register, tutorial, 20 battles, Level 15", "Tracking test", "Low payout, strict early timing on battles and Level 15", "Do these first"],
    ["Level 30 and early 5-star tasks", "Early progress check", "Tight 3-5 day windows", "Try if early tracking works"],
    ["Any purchase and $9.99 named packs", "Small spend test", "Purchase may not stack, review risk, non-refund risk", "Only after no-spend tasks track"],
    ["$29.99 and $49.99 purchase tasks", "Higher point value", "Exact pack availability, timing gates, held offer review", "Only with clear proof and budget"],
    ["5-star and 6-star hero chains", "Shows serious progress", "Food and Chicken bottleneck", "High effort"],
    ["Sacred Shard tiers", "Can add value if you already have Shards", "Shards may require spend or long progression", "Do not chase blindly"],
    ["Level 50, 60, 70", "Biggest level payouts", "Time-heavy late grind", "Treat Level 70 as a stretch goal"],
];

const earlyTasks = [
    ["Register and start playing the game", "Screenshot the Gain.gg offer row, Google Play install page, first app open, and first account/profile screen. Keep the same Android device and do not use a VPN, VPS, or emulator."],
    ["Complete the tutorial", "Finish the opening sequence before spending. Screenshot the first hub or profile/account screen after the tutorial."],
    ["Fight 20 Battles within 24 Hours", "Use Campaign battles and Auto/Multi-Battle only after you have unlocked and cleared eligible stages. Capture battle result screens inside the first day."],
    ["Reach level 15 within 3 Days", "Treat this as an account/profile level task unless the live Gain.gg wall defines it differently. Screenshot the visible level screen."],
    ["Upgrade a hero to 5 stars within 3 days", "Use the Tavern and preserve rank-up materials. A Champion detail screen showing 5 stars is the cleanest proof."],
    ["Reach Level 30 Within 4 Days", "Keep pushing Campaign and early activities, then screenshot account/profile Level 30 immediately."],
    ["Upgrade 3 heroes to 5 stars within 5 Days", "Repeat the Tavern rank-up loop for three Champions and keep individual or roster proof for all three."],
];

const purchaseTasks = [
    ["Make any purchase. Can be repeated daily (1 time per 24 hours)", "Do not expect repeated credit from several purchases inside the same 24-hour period. Capture the task row, in-game purchase screen, Google Play receipt, and Gain.gg activity status."],
    ["Purchase Silver 500k pack for $9.99", "Find the exact Silver 500k pack. Keep a screenshot where both the pack name and price are visible."],
    ["Purchase the Daily Gem Pack for $9.99", "Buy only the exact Daily Gem Pack if you choose to attempt it, and keep proof separate from any other $9.99 transaction."],
    ["Purchase a Sacred Daily Pack for $29.99", "Confirm the exact pack name and $29.99 price before buying. Treat it as higher risk because the point value is larger and the task row does not include a deadline."],
    ["Purchase the Beginner Progress Pack for $49.99 (Eligible only if purchased after Day 7)", "Do not buy before Day 7. Keep proof of the task row, purchase date, pack name, price, and receipt."],
    ["Purchase Box of Gems for $29.99 (Eligible only if purchased after Day 30)", "Verify that the offer is still active and visible after Day 30 before buying. Skip this if earlier tasks have not credited cleanly."],
];

const shardTasks = [
    ["Open 2 Sacred (Yellow) Shards", "Screenshot your Sacred Shard inventory before opening, then capture the Portal results and Gain.gg status afterward."],
    ["Open 4 Sacred (Yellow) Shards", "Continue only if the 2-shard task credited and you can capture a clean proof chain."],
    ["Open 6 Sacred (Yellow) Shards", "Do not buy speculative packs just to chase this tier unless the purchase cost, credit history, and your budget all make sense."],
    ["Open 8 Sacred (Yellow) Shards", "This is the highest shard tier. Treat it as a paid-or-long-progression decision unless your account already has enough Sacred Shards."],
];

const lateTasks = [
    ["Upgrade a hero to 6 stars within 10 Days", "A 6-star Champion means Rank 6, which requires five Rank 5 Champions or Chickens. Treat this as a major resource bottleneck."],
    ["Upgrade 5 heroes to 5 stars within 14 Days", "Track each finished 5-star Champion so proof is not ambiguous. This can conflict with using 5-star food for a 6-star upgrade."],
    ["Upgrade 3 heroes to 6 stars within 21 Days", "Plan this only if you are already producing enough Rank 5 food. Three 6-star Champions repeat the Rank 6 requirement multiple times."],
    ["Reach Level 50 within 21 days", "Screenshot the profile/account level as soon as you hit 50. This is a more serious grind than Level 15 or 30."],
    ["Reach Level 60 within 35 days", "Decide based on your actual pace. If you are far from Level 60 by the midpoint, do not let the payout push you into bad purchases."],
    ["Reach Level 70 within 60 days", "Treat this as the stretch task. It pays 125,800 points, but that does not make it easy or guaranteed."],
];

const proofRows = [
    ["Install and start", "Gain.gg offer page, task list, Google Play page, install/open screen, first profile/account screen"],
    ["Tutorial", "Post-tutorial hub, account/profile screen"],
    ["Battles", "Battle result screens, Multi-Battle result screen, date/time if possible"],
    ["Level milestones", "Profile/account level screen at 15, 30, 50, 60, and 70"],
    ["Champion stars", "Champion detail screen showing 5 or 6 stars, roster screen with multiple completed Champions"],
    ["Purchases", "Task row, exact pack screen, Google Play receipt, inventory change, Gain.gg status"],
    ["Sacred Shards", "Shard inventory before opening, Portal result screens, Gain.gg status after opening"],
    ["Support", "Credited, pending, held, or missing status; ticket ID; all receipts and screenshots"],
];

const faqs = [
    {
        q: "Is the Raid: Shadow Legends Gain.gg offer worth doing?",
        a: "It can be worth testing because the task list totals 361,695 points, but it is high-risk as a full completion attempt. Do the no-spend tasks first. Consider purchases only after early tasks track, and treat Level 60, Level 70, 8 Sacred Shards, and multiple 6-star Champions as stretch goals.",
    },
    {
        q: "Should I buy Raid packs before early tasks credit?",
        a: "No. Finish the install, tutorial, 20 battles, and early level tasks first. Purchases can be reviewed, held, or non-refundable, and a named pack task should be attempted only with exact pack proof.",
    },
    {
        q: "Do I need an emulator or PC to complete the Android offer?",
        a: "No. This is an Android offer for the target user, and Gain.gg prohibits VPN, VPS, and emulator use. Stay on the Android device used for the offer click and install.",
    },
    {
        q: "Are the Sacred Shard tasks about opening Shards or pulling a Legendary?",
        a: "The task text says to open Sacred Yellow Shards. It does not say you must pull a Legendary. Screenshot your inventory before opening and the Portal results after opening.",
    },
    {
        q: "What should I do if a Raid task does not credit?",
        a: "Check Gain.gg activity first. If it is pending or held, keep your proof. If it is missing, use the offerwall provider support path and submit the exact task text, screenshots, dates, and receipts.",
    },
];

const sources = [
    ["User-provided Gain.gg task list", "Task list used for provider, payout, deadline, country, device, and target-user source of truth."],
    ["Google Play Raid listing", "https://play.google.com/store/apps/details?id=com.plarium.raidlegends"],
    ["Official Raid website", "https://raidshadowlegends.com/"],
    ["Plarium support: The Tavern", "https://raid-support.plarium.com/hc/en-us/articles/360014648380-The-Tavern"],
    ["Plarium support: Multi-Battle", "https://raid-support.plarium.com/hc/en-us/articles/360014658840-Guide-Multi-Battle"],
    ["Plarium support: Summoning Events", "https://raid-support.plarium.com/hc/en-us/articles/4415734735634-Summoning-Events"],
    ["Plarium support: Android purchase issues", "https://raid-support.plarium.com/hc/en-us/articles/360014097979-I-cannot-make-a-purchase-what-can-I-do-Mobile"],
    ["Gain.gg FAQ", "https://gain.gg/faq"],
];

function JsonLd() {
    const article = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Raid: Shadow Legends Offer Guide: Gain.gg Android Tasks",
        description: metadata.description,
        datePublished: "2026-05-30",
        dateModified: "2026-05-30",
        mainEntityOfPage: PAGE_URL,
        image: HERO_IMAGE_URL,
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
            { "@type": "ListItem", position: 3, name: "Raid: Shadow Legends Offer Guide", item: PAGE_URL },
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
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.08em] text-red-700">{eyebrow}</p>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
            {children ? <div className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{children}</div> : null}
        </div>
    );
}

function Warning({ children }: { children: ReactNode }) {
    return (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">
            <div className="mb-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-amber-700">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Risk note
            </div>
            {children}
        </div>
    );
}

function ProofTip({ children }: { children: ReactNode }) {
    return (
        <div className="mt-5 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm font-semibold leading-6 text-sky-950">
            <div className="mb-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-sky-700">
                <Camera className="h-4 w-4" aria-hidden="true" />
                Proof tip
            </div>
            {children}
        </div>
    );
}

function TaskList({ rows }: { rows: string[][] }) {
    return (
        <div className="space-y-3">
            {rows.map(([task, copy]) => (
                <div key={task} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <h3 className="text-base font-black text-slate-950">{task}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{copy}</p>
                </div>
            ))}
        </div>
    );
}

export default function RaidShadowLegendsOfferGuidePage() {
    return (
        <main className="min-h-screen bg-[#f6f7f2] text-slate-900">
            <JsonLd />
            <nav aria-label="Breadcrumb" className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-4 text-sm font-bold text-slate-500 sm:px-6 lg:px-8">
                <Link href="/" className="hover:text-red-700">Home</Link>
                <span aria-hidden="true">/</span>
                <Link href="/guides" className="hover:text-red-700">Guides</Link>
                <span aria-hidden="true">/</span>
                <span className="text-slate-800">Raid: Shadow Legends</span>
            </nav>

            <section className="border-b border-red-200 bg-[#fff4ef]">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 lg:py-14">
                    <div>
                        <Link href="/guides" className="mb-6 inline-flex text-sm font-bold text-red-800 hover:text-red-950">
                            Back to guides
                        </Link>
                        <p className="mb-3 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-[0.08em] text-red-800">
                            <Gamepad2 className="h-4 w-4" aria-hidden="true" />
                            Gain.gg Android offer guide
                        </p>
                        <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                            Raid: Shadow Legends Offer Guide: Gain.gg Android Tasks
                        </h1>
                        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
                            This Raid: Shadow Legends offer guide is for a US Android user doing the Gain.gg task list for the first time on a device where the game has not been installed before. The list totals 361,695 points, but most value sits behind purchases, Sacred Shards, 5-star and 6-star Champion upgrades, and late level milestones.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link href="/offers" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-extrabold text-red-100">
                                Compare current offers
                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </Link>
                            <a href="#payouts" className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-900">
                                View payout table
                                <BadgeDollarSign className="h-4 w-4" aria-hidden="true" />
                            </a>
                        </div>
                    </div>

                    <aside className="rounded-lg border border-red-300 bg-slate-950 p-5 text-white shadow-sm">
                        <div className="flex items-start gap-4">
                            <Image
                                src={HERO_IMAGE_SRC}
                                alt="Raid: Shadow Legends app icon"
                                width={80}
                                height={80}
                                className="h-20 w-20 rounded-lg border border-white/20 bg-white object-cover"
                            />
                            <div>
                                <p className="text-xs font-extrabold uppercase text-red-100">Submitted task total</p>
                                <p className="text-3xl font-black">$361.695</p>
                                <p className="mt-1 text-sm font-semibold text-slate-300">23 Gain.gg tasks</p>
                            </div>
                        </div>
                        <div className="mt-5 rounded-lg border border-white/15 bg-white/10 p-4">
                            <p className="text-xs font-extrabold uppercase text-red-100">Largest row</p>
                            <p className="mt-1 text-2xl font-black">Level 70</p>
                            <p className="mt-2 text-sm leading-6 text-red-50">
                                The final level task pays 125,800 points, but it is a stretch goal and should not drive early spending.
                            </p>
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg border border-white/10 bg-white/10 p-3">
                                <p className="text-xs font-bold uppercase text-slate-300">Device</p>
                                <p className="mt-1 font-black">Android</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/10 p-3">
                                <p className="text-xs font-bold uppercase text-slate-300">Updated</p>
                                <p className="mt-1 font-black">{LAST_UPDATED}</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <article className="min-w-0 space-y-10">
                        <section className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.08em] text-red-700">
                                <BookOpen className="h-4 w-4" aria-hidden="true" />
                                Section navigation
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {navSections.map(([label, id]) => (
                                    <a
                                        key={id}
                                        href={`#${id}`}
                                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 hover:border-red-300 hover:bg-red-50"
                                    >
                                        {label}
                                    </a>
                                ))}
                            </div>
                        </section>

                        <section id="payouts">
                            <SectionHeading eyebrow="Payouts" title="Raid: Shadow Legends Gain.gg Task Table">
                                <p>
                                    These payouts and time windows come from the submitted Gain.gg task list only. Public offer pages and other Raid guides can show different totals.
                                </p>
                            </SectionHeading>
                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="min-w-[900px] text-left text-sm">
                                        <thead className="bg-slate-950 text-white">
                                            <tr>
                                                <th className="px-4 py-3">Task</th>
                                                <th className="px-4 py-3">Points</th>
                                                <th className="px-4 py-3">USD</th>
                                                <th className="px-4 py-3">Deadline or timing</th>
                                                <th className="px-4 py-3">Safer read</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {payoutRows.map(([task, points, usd, timing, read], index) => (
                                                <tr key={`${task}-${points}`} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                                    <td className="px-4 py-3 font-bold text-slate-950">{task}</td>
                                                    <td className="px-4 py-3 text-slate-700">{points}</td>
                                                    <td className="px-4 py-3 font-black text-emerald-700">{usd}</td>
                                                    <td className="px-4 py-3 text-slate-700">{timing}</td>
                                                    <td className="px-4 py-3 text-slate-700">{read}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        <section id="setup">
                            <SectionHeading eyebrow="Setup" title="Android setup and tracking checks">
                                <p>
                                    Start from the Gain.gg offer click on the Android device you will keep using. This offer is for a new user who has not installed Raid: Shadow Legends before.
                                </p>
                            </SectionHeading>
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    Use the real Android device. Gain.gg FAQ text says VPN, VPS, and emulator use are prohibited, and it also warns against multiple accounts and more than one account per household. Many Raid search results discuss PC tools or emulator play, but that advice does not fit this Android offer.
                                </p>
                                <p>
                                    Before you spend, make sure the early tasks track. A conservative order is to click the Gain.gg offer, screenshot the task list, install Raid from Google Play, register and start playing, complete the tutorial, finish 20 battles inside the first 24 hours, and check whether Gain.gg shows credited, pending, or tracked activity.
                                </p>
                            </div>
                            <Warning>
                                If the first no-spend actions do not show any sign of tracking, stop before purchases. The purchase tasks have better point values on paper, but they also carry receipt, review, and non-refund risk.
                            </Warning>
                        </section>

                        <section id="game-basics">
                            <SectionHeading eyebrow="Game basics" title="What Raid systems matter for this offer">
                                <p>
                                    Raid: Shadow Legends is listed on Google Play by Plarium Global Ltd as a role-playing, turn-based RPG with in-app purchases.
                                </p>
                            </SectionHeading>
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    The Google Play listing describes Champions, Artifacts, Champion rank upgrades, Dungeons, and a 12-location Campaign. The official Raid site also describes Campaign play, Dungeons, Clan Boss fights, PvP Arena, Champion levels and ranks, Artifacts, Accessories, Ascension, and Awakening.
                                </p>
                                <p>
                                    For this offer, you do not need a broad Raid walkthrough. You need Campaign and repeated battles for battle count and XP, the Tavern for Champion rank upgrades, Sacred Shards through the Portal, Google Play receipts for purchase proof, and visible account/profile level screens for level milestones.
                                </p>
                                <p>
                                    The task list uses both level and hero language. Because the hero tasks are explicitly about upgrading heroes to 5 or 6 stars, treat Level 15, 30, 50, 60, and 70 as account/profile level milestones unless the live Gain.gg wall gives a different definition.
                                </p>
                            </div>
                        </section>

                        <section id="systems">
                            <SectionHeading eyebrow="Systems" title="Campaign, Tavern, Sacred Shards, and purchases" />
                            <div className="grid gap-5 md:grid-cols-2">
                                {gameSystems.map(({ title, icon: Icon, body }) => (
                                    <div key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-red-100">
                                                <Icon className="h-6 w-6" aria-hidden="true" />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-950">{title}</h3>
                                        </div>
                                        <div className="space-y-3 text-sm leading-6 text-slate-700">
                                            {body.map((paragraph) => (
                                                <p key={paragraph}>{paragraph}</p>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section id="worth-it">
                            <SectionHeading eyebrow="Worth it" title="Complete-or-skip filter">
                                <p>
                                    The offer can be worth attempting if early tracking works and you are comfortable stopping before the expensive parts.
                                </p>
                            </SectionHeading>
                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="min-w-[760px] text-left text-sm">
                                        <thead className="bg-red-950 text-white">
                                            <tr>
                                                <th className="px-4 py-3">Task group</th>
                                                <th className="px-4 py-3">Best use</th>
                                                <th className="px-4 py-3">Main risk</th>
                                                <th className="px-4 py-3">Verdict</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {decisionRows.map(([group, use, risk, verdict]) => (
                                                <tr key={group} className="align-top odd:bg-white even:bg-slate-50">
                                                    <td className="px-4 py-3 font-bold text-slate-950">{group}</td>
                                                    <td className="px-4 py-3 text-slate-700">{use}</td>
                                                    <td className="px-4 py-3 text-slate-700">{risk}</td>
                                                    <td className="px-4 py-3 font-extrabold text-red-800">{verdict}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <Warning>
                                It is not a good fit if you plan to buy packs immediately, use an emulator, skip screenshots, or assume the Level 70 payout is guaranteed.
                            </Warning>
                        </section>

                        <section id="task-route">
                            <SectionHeading eyebrow="Task route" title="How to approach every task family" />
                            <div className="space-y-8">
                                <div id="early-tasks">
                                    <h3 className="mb-3 text-xl font-black text-slate-950">Early tasks</h3>
                                    <TaskList rows={earlyTasks} />
                                </div>
                                <div id="purchase-tasks">
                                    <h3 className="mb-3 text-xl font-black text-slate-950">Purchase tasks</h3>
                                    <TaskList rows={purchaseTasks} />
                                    <Warning>
                                        Do not begin purchase tasks until the install, tutorial, battle, or early level tasks show credit or at least reliable pending/tracking behavior.
                                    </Warning>
                                </div>
                                <div id="shard-tasks">
                                    <h3 className="mb-3 text-xl font-black text-slate-950">Sacred Shard tasks</h3>
                                    <TaskList rows={shardTasks} />
                                </div>
                                <div id="late-level-tasks">
                                    <h3 className="mb-3 text-xl font-black text-slate-950">Hero rank and late level tasks</h3>
                                    <TaskList rows={lateTasks} />
                                </div>
                            </div>
                        </section>

                        <section id="proof">
                            <SectionHeading eyebrow="Proof" title="Screenshot checklist by task family" />
                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="min-w-[720px] text-left text-sm">
                                        <thead className="bg-slate-100 text-slate-700">
                                            <tr>
                                                <th className="px-4 py-3">Task family</th>
                                                <th className="px-4 py-3">Proof to keep</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {proofRows.map(([family, proof]) => (
                                                <tr key={family} className="align-top odd:bg-white even:bg-slate-50">
                                                    <td className="px-4 py-3 font-bold text-slate-950">{family}</td>
                                                    <td className="px-4 py-3 text-slate-700">{proof}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <ProofTip>
                                For purchases, keep the Google Play receipt email and a screenshot of the in-game pack. If a pack name or price is not visible, your proof is weaker.
                            </ProofTip>
                        </section>

                        <section id="support">
                            <SectionHeading eyebrow="Support" title="If the offer does not credit" />
                            <div className="space-y-4 text-base leading-8 text-slate-700">
                                <p>
                                    Gain.gg FAQ text says most offers can credit quickly, but rare cases can be delayed, and high-value or payment offers may be reviewed or held. It also says Gain.gg staff cannot investigate why an offer did not credit properly; users generally need to use the offerwall provider support or offer history path.
                                </p>
                                <ol className="list-decimal space-y-2 pl-5">
                                    <li>Check whether Gain.gg shows pending, held, or credited activity.</li>
                                    <li>Wait through the normal delay window if the task is pending.</li>
                                    <li>If it is missing, open the offerwall support path from the wall or activity history.</li>
                                    <li>Submit the exact task text, date completed, device, screenshots, and receipt if it was a purchase.</li>
                                    <li>Keep the ticket ID and do not repeat the task with a different account or device.</li>
                                </ol>
                                <p>
                                    For a purchase that did not appear in Raid, use Plarium&apos;s purchase support route. For a Gain.gg reward that did not credit even though the item appeared in Raid, use the offerwall support route.
                                </p>
                            </div>
                        </section>

                        <section id="faq" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <SectionHeading eyebrow="FAQ" title="Raid: Shadow Legends Gain.gg questions" />
                            <div className="divide-y divide-slate-200">
                                {faqs.map((item) => (
                                    <div key={item.q} className="py-5 first:pt-0 last:pb-0">
                                        <h3 className="text-lg font-black text-slate-950">{item.q}</h3>
                                        <p className="mt-2 text-base leading-7 text-slate-700">{item.a}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-lg border border-red-200 bg-slate-950 p-6 text-white">
                            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-red-100">Compare before you start</p>
                            <h2 className="mt-2 text-2xl font-black">Check current Raid payouts before spending</h2>
                            <p className="mt-3 max-w-3xl text-base leading-7 text-red-50">
                                Use the live Gain.gg task list as the final payout source before you buy packs, open scarce Shards, or grind toward Level 70.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <Link href="/offers" className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-5 py-3 text-sm font-extrabold text-slate-950">
                                    Compare offers on EarnGrind
                                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                                </Link>
                                <Link href="/guides/best-gpt-sites" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-extrabold text-white">
                                    Compare GPT sites
                                </Link>
                            </div>
                        </section>
                    </article>

                    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
                        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.08em] text-red-700">
                                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                Start safely
                            </div>
                            <ul className="space-y-3 text-sm leading-6 text-slate-700">
                                {[
                                    "Use the same Android device from click to completion.",
                                    "Avoid VPN, VPS, emulator, multiple accounts, and device switching.",
                                    "Finish no-spend tracking tasks before buying anything.",
                                    "Save proof for every milestone before moving to the next spend-heavy tier.",
                                ].map((item) => (
                                    <li key={item} className="flex gap-2">
                                        <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-700" aria-hidden="true" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.08em] text-slate-700">
                                <PackageCheck className="h-4 w-4" aria-hidden="true" />
                                Best first target
                            </div>
                            <p className="text-sm leading-6 text-slate-700">
                                Register, complete the tutorial, finish 20 battles inside 24 hours, and reach Level 15 before you consider any purchase task.
                            </p>
                        </div>

                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
                            <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.08em] text-amber-700">
                                <Trophy className="h-4 w-4" aria-hidden="true" />
                                Stretch payout
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                                Level 70 pays 125,800 points. Chase it only if the earlier level tasks credited and your actual pace supports the 60-day route.
                            </p>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.08em] text-slate-700">
                                <Receipt className="h-4 w-4" aria-hidden="true" />
                                Sources
                            </div>
                            <ul className="space-y-2 text-sm leading-6">
                                {sources.map(([label, hrefOrNote]) => (
                                    <li key={label}>
                                        {hrefOrNote.startsWith("http") ? (
                                            <a href={hrefOrNote} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 font-semibold text-red-700 underline">
                                                {label}
                                                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                            </a>
                                        ) : (
                                            <span className="font-semibold text-slate-700">{label}: {hrefOrNote}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    );
}
