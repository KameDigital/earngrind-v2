import type { Metadata } from "next";
import Link from "next/link";
import {
    Anchor,
    ArrowRight,
    BadgeCheck,
    Camera,
    CheckCircle2,
    Clock3,
    Coins,
    Compass,
    Download,
    Gamepad2,
    HardDrive,
    Monitor,
    MousePointerClick,
    ShieldAlert,
    Ship,
    Trophy,
} from "lucide-react";
import { buildGainOfferDeepLink, getGainOfferRef } from "@/lib/gain-deeplinks";
import { absoluteUrl } from "@/lib/site-url";

const PAGE_PATH = "/guides/world-of-warships-torox-offer-guide";
const PAGE_URL = absoluteUrl(PAGE_PATH);
const GAIN_WORLD_OF_WARSHIPS_OFFER_ID = "1-6b86";
const GAIN_GG_DEEP_LINK =
    buildGainOfferDeepLink(GAIN_WORLD_OF_WARSHIPS_OFFER_ID) ??
    `https://gain.gg/offer/${GAIN_WORLD_OF_WARSHIPS_OFFER_ID}?ref=${getGainOfferRef()}`;
const LAST_UPDATED = "May 14, 2026";

export const metadata: Metadata = {
    title: "World of Warships Torox Offer Guide: Earn 15$ Quick!",
    description:
        "Learn how to complete the World of Warships Torox offer, earn up to 10,692 points, unlock your first and second warships, and avoid tracking mistakes.",
    alternates: {
        canonical: PAGE_URL,
    },
    openGraph: {
        title: "World of Warships Torox Offer Guide: Earn 15$ Quick!",
        description:
            "Complete the World of Warships Torox offer, earn up to 10,692 points, and avoid the tracking mistakes that stop desktop game offers from crediting.",
        url: PAGE_URL,
        type: "article",
    },
    twitter: {
        card: "summary",
        title: "World of Warships Torox Offer Guide: Earn 15$ Quick!",
        description:
            "Step-by-step World of Warships Torox offer guide for the first battle, first warship, second warship, and tracking proof.",
    },
};

const rewardRows = [
    {
        task: "Task 1",
        requirement: "Open the game and play the first battle",
        reward: "746",
    },
    {
        task: "Task 2",
        requirement: "Play at least 8 battles to get your first warship with in-game currency",
        reward: "3,511",
    },
    {
        task: "Task 3",
        requirement:
            "Play at least 8 battles, unlock a second warship with in-game currency, and play 3 battles on it",
        reward: "6,435",
    },
];

const trackingChecklist = [
    "Use a desktop or laptop that can run the game.",
    "Free up at least 70 GB of storage.",
    "Turn off VPNs, private relay tools, and aggressive ad blockers.",
    "Use the same browser session from EarnGrind to Torox to World of Warships.",
    "Create a new account unless the offer terms clearly allow existing users.",
    "Screenshot the offer page before starting.",
];

const steps = [
    {
        title: "Register Through the Torox Offer Link",
        icon: MousePointerClick,
        copy: [
            "Start from the Gain.gg deep link below, then open the World of Warships offer through Torox. Do not manually search for the game on a store page or the Wargaming site after clicking away.",
            "Offerwall tracking depends on the click, registration, install, and first activity being connected. If you register outside the tracked path, you may still be able to play the game, but Torox may not credit the task.",
            "After registering, keep your email and login information saved. You may need to reopen the game later to finish the second and third milestones.",
        ],
        cta: true,
    },
    {
        title: "Download and Install World of Warships",
        icon: Download,
        copy: [
            "World of Warships is a large desktop game, so this step may take longer than the early-game tasks. The offer itself may show a 61 GB desktop download, so leave at least 70 GB free before starting.",
            "Use a stable internet connection and avoid switching devices mid-offer. Once the install finishes, launch the game and log in with the same account you created from the tracked offer path.",
            "Do not uninstall the game immediately after your first reward appears. Keep it installed until all milestones credit or until you are sure you are done.",
        ],
    },
    {
        title: "Open the Game and Play Your First Battle",
        icon: Gamepad2,
        copy: [
            "The first milestone is the easiest one: open the game and play your first battle.",
            "You do not need to win. Finish the battle normally, avoid leaving early, return to the port screen, and wait a bit before checking whether the task credited.",
            "Reward: 746 points.",
        ],
    },
    {
        title: "Play 8 Battles and Unlock Your First Warship",
        icon: Ship,
        copy: [
            "The second milestone asks you to play at least 8 battles and get your first warship with in-game currency.",
            "Stay in one beginner tech tree line, keep playing battles with your starter ship, save credits, then unlock and purchase the next available warship with in-game currency.",
            "Avoid buying a paid pack to skip progression. Paid purchases can confuse offer tracking, and this task should be doable through normal beginner play.",
        ],
    },
    {
        title: "Unlock Your Second Warship and Play 3 Battles With It",
        icon: Trophy,
        copy: [
            "The final milestone is worth the most, so follow the wording exactly: play at least 8 battles, unlock a second warship with in-game currency, select that second warship, then play 3 battles using that ship.",
            "Do not assume the task is complete just because you unlocked the second ship. After buying it, make sure it is active in your port, queue into 3 battles, and finish them normally.",
            "Reward: 6,435 points.",
        ],
    },
];

const beginnerTips = [
    ["Play safely, not perfectly.", "Stay near teammates, avoid sailing alone into the middle of the map, and focus on surviving long enough to contribute."],
    ["Do not quit matches early.", "Even if you sink, let the match finish or exit only when the game clearly allows it."],
    ["Focus one ship line.", "Jumping around between ships can slow down unlock progress. Pick one beginner path and keep feeding XP into it."],
    ["Save your credits.", "Credits are used to purchase unlocked ships, so avoid unnecessary extras before the offer tasks are done."],
    ["Check the port after every few battles.", "If a ship is ready to research or buy, do it as soon as you can."],
    ["Take screenshots.", "Capture your profile, battle count, unlocked ships, and the second ship after completing 3 battles."],
];

const mistakes = [
    "Installing the game before clicking the Torox offer.",
    "Using an old World of Warships account.",
    "Switching from desktop to another device.",
    "Using a VPN during registration or gameplay.",
    "Downloading from a different store than the tracked offer sends you to.",
    "Playing the first battle but not finishing it.",
    "Unlocking the second ship but not playing 3 battles on it.",
    "Deleting the game before all tasks credit.",
];

const quickRoute = [
    "Screenshot the Torox offer.",
    "Click through the tracked offer link.",
    "Register a new account.",
    "Download and install World of Warships on desktop.",
    "Open the game and complete the first battle.",
    "Keep playing until you reach at least 8 battles.",
    "Unlock and buy your first warship with in-game currency.",
    "Continue progressing toward the second ship.",
    "Unlock and buy the second warship with in-game currency.",
    "Select the second ship and complete 3 battles on it.",
    "Wait for Torox credit before uninstalling.",
];

const faqs = [
    {
        q: "Is World of Warships free?",
        a: "Yes. World of Warships is a free-to-play naval battle game with optional paid content.",
    },
    {
        q: "How much storage do I need for the World of Warships offer?",
        a: "The offer may say 61 GB. Leave at least 70 GB free to avoid install issues.",
    },
    {
        q: "Do I need to win battles for the Torox offer?",
        a: "The listed tasks say to play battles, unlock ships with in-game currency, and play battles on the second warship. They do not say you must win. Still, finish each battle normally.",
    },
    {
        q: "Can I use an existing World of Warships account?",
        a: "Avoid using an existing account unless the offer terms clearly allow it. Most game offers are meant for new users, and using an old account can prevent tracking.",
    },
    {
        q: "What is the fastest way to complete the offer?",
        a: "Stay in one beginner ship line, play the required battles, save your credits, unlock the next ships as soon as possible, and make sure you play 3 battles on the second warship.",
    },
    {
        q: "What should I do if the offer does not credit?",
        a: "Wait for the normal tracking window shown by Torox, then contact Torox support with screenshots of the offer page, your account, battle history, unlocked ships, and proof that you played 3 battles on the second warship.",
    },
];

function JsonLd() {
    const article = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "World of Warships Torox Offer Guide: How to Complete Every Task",
        description: metadata.description,
        dateModified: "2026-05-14",
        datePublished: "2026-05-14",
        mainEntityOfPage: PAGE_URL,
        author: {
            "@type": "Organization",
            name: "EarnGrind",
        },
        publisher: {
            "@type": "Organization",
            name: "EarnGrind",
        },
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
            { "@type": "ListItem", position: 3, name: "World of Warships Torox Offer Guide", item: PAGE_URL },
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

function SectionHeading({
    eyebrow,
    title,
    children,
}: {
    eyebrow?: string;
    title: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="mb-6">
            {eyebrow && (
                <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-cyan-700">
                    {eyebrow}
                </p>
            )}
            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
            {children && <div className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{children}</div>}
        </div>
    );
}

function TacticalProgressVisual() {
    return (
        <div className="relative overflow-hidden rounded-lg border border-cyan-200 bg-slate-950 p-5 text-white shadow-sm">
            <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(34,211,238,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.35)_1px,transparent_1px)] [background-size:28px_28px]" />
            <div className="relative">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-wide text-cyan-200">Offer route</p>
                        <p className="mt-1 text-2xl font-black">10,692 points</p>
                    </div>
                    <Anchor className="h-10 w-10 text-lime-300" aria-hidden="true" />
                </div>
                <div className="space-y-3">
                    {[
                        ["Battle 1", "746"],
                        ["First warship", "3,511"],
                        ["Second warship + 3 battles", "6,435"],
                    ].map(([label, reward], index) => (
                        <div key={label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300 bg-cyan-300/15 text-xs font-black text-cyan-100">
                                {index + 1}
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/15">
                                <div
                                    className="h-full rounded-full bg-lime-300"
                                    style={{ width: `${index === 0 ? 28 : index === 1 ? 56 : 100}%` }}
                                />
                            </div>
                            <span className="text-sm font-extrabold text-lime-200">{reward}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs font-bold text-cyan-100">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">Click</div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">Install</div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">Credit</div>
                </div>
            </div>
        </div>
    );
}

export default function WorldOfWarshipsToroxOfferGuidePage() {
    return (
        <main className="min-h-screen bg-[#f7fafb] text-slate-900">
            <JsonLd />

            <section className="border-b border-cyan-950 bg-slate-950 text-white">
                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                    <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white/70" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-white">Home</Link>
                        <span>/</span>
                        <Link href="/guides" className="hover:text-white">Guides</Link>
                        <span>/</span>
                        <span className="text-white">World of Warships Torox Offer</span>
                    </nav>
                </div>
            </section>

            <section className="bg-slate-950 text-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-20 lg:pt-12">
                    <div className="min-w-0">
                        <div className="mb-5 flex flex-wrap gap-2 text-xs font-extrabold uppercase tracking-wide">
                            <span className="rounded-full border border-lime-300/40 bg-lime-300/10 px-3 py-1 text-lime-200">Difficulty: Easy</span>
                            <span className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-cyan-100">Desktop offer</span>
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/80">Updated {LAST_UPDATED}</span>
                        </div>
                        <p className="mb-3 text-sm font-extrabold uppercase tracking-wide text-cyan-200">
                            World of Warships Torox offer
                        </p>
                        <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                            World of Warships Torox Offer Guide: How to Complete Every Task
                        </h1>
                        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                            World of Warships is one of the easier desktop game offers if you have enough storage space and follow the tracking steps correctly. Register through Torox, download the desktop game, play your first battle, then keep playing until you unlock and use additional warships.
                        </p>
                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                            <a
                                href={GAIN_GG_DEEP_LINK}
                                target="_blank"
                                rel="sponsored noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-lime-300 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-lime-200 focus:outline-none focus:ring-4 focus:ring-lime-200/40"
                            >
                                Start on Gain.gg
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </a>
                        </div>
                    </div>
                    <TacticalProgressVisual />
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <section className="grid gap-4 md:grid-cols-4">
                    {[
                        [Coins, "Total reward", "10,692 points"],
                        [HardDrive, "Storage target", "Leave 70 GB free"],
                        [Clock3, "Estimated time", "Same day for many users"],
                        [Monitor, "Best for", "Desktop users"],
                    ].map(([Icon, label, value]) => (
                        <div key={label as string} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <Icon className="h-6 w-6 text-cyan-700" aria-hidden="true" />
                            <p className="mt-4 text-xs font-extrabold uppercase tracking-wide text-slate-500">{label as string}</p>
                            <p className="mt-1 text-lg font-black text-slate-950">{value as string}</p>
                        </div>
                    ))}
                </section>

                <section className="py-12">
                    <SectionHeading eyebrow="Offer rewards" title="World of Warships Torox Offer Rewards">
                        <p>
                            The wording matters. Do not just unlock a ship and close the game. The final task specifically says you need to play 3 battles on the second warship, so select that ship and complete those battles with it.
                        </p>
                    </SectionHeading>
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="grid grid-cols-[0.7fr_2fr_0.8fr] bg-slate-100 px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-600">
                            <span>Task</span>
                            <span>Requirement</span>
                            <span className="text-right">Reward</span>
                        </div>
                        {rewardRows.map((row) => (
                            <div key={row.task} className="grid grid-cols-[0.7fr_2fr_0.8fr] gap-3 border-t border-slate-200 px-4 py-4 text-sm">
                                <span className="font-black text-slate-950">{row.task}</span>
                                <span className="leading-6 text-slate-600">{row.requirement}</span>
                                <span className="text-right font-black text-lime-700">{row.reward}</span>
                            </div>
                        ))}
                        <div className="grid grid-cols-[0.7fr_2fr_0.8fr] gap-3 border-t border-slate-300 bg-lime-50 px-4 py-4 text-sm">
                            <span className="font-black text-slate-950">Total</span>
                            <span className="font-bold text-slate-700">Complete all tasks</span>
                            <span className="text-right font-black text-lime-700">10,692</span>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 py-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-6">
                        <SectionHeading eyebrow="Before you start" title="Tracking Checklist" />
                        <ul className="space-y-3">
                            {trackingChecklist.map((item) => (
                                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-cyan-700" aria-hidden="true" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <SectionHeading eyebrow="Proof" title="Screenshot the Offer Page">
                            <p>
                                Your screenshot should include the provider name, reward amount, task list, deadline, device rule, and support button. If the offer does not credit, Torox support will usually need proof that you completed the exact milestones.
                            </p>
                        </SectionHeading>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {[
                                [Camera, "Task list"],
                                [BadgeCheck, "Reward amount"],
                                [Compass, "Support path"],
                            ].map(([Icon, label]) => (
                                <div key={label as string} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-extrabold text-slate-800">
                                    <Icon className="mb-3 h-5 w-5 text-cyan-700" aria-hidden="true" />
                                    {label as string}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-12">
                    <SectionHeading eyebrow="Step by step" title="How to Complete the World of Warships Torox Offer" />
                    <div className="space-y-5">
                        {steps.map(({ title, icon: Icon, copy, cta }, index) => (
                            <article key={title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex flex-col gap-4 sm:flex-row">
                                    <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-slate-950 text-lime-300">
                                        <Icon className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-extrabold uppercase tracking-wide text-cyan-700">Step {index + 1}</p>
                                        <h3 className="mt-1 text-xl font-black text-slate-950">{title}</h3>
                                        <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                                            {copy.map((paragraph) => (
                                                <p key={paragraph}>{paragraph}</p>
                                            ))}
                                        </div>
                                        {cta && (
                                            <a
                                                href={GAIN_GG_DEEP_LINK}
                                                target="_blank"
                                                rel="sponsored noopener noreferrer"
                                                className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-lime-300 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-lime-200 focus:outline-none focus:ring-4 focus:ring-lime-200/40"
                                            >
                                                Start World of Warships on Gain.gg
                                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="grid gap-6 py-6 lg:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <SectionHeading eyebrow="Beginner tips" title="Fast Completion Tips" />
                        <div className="space-y-4">
                            {beginnerTips.map(([title, copy]) => (
                                <div key={title} className="border-b border-slate-200 pb-4 last:border-b-0 last:pb-0">
                                    <h3 className="font-black text-slate-950">{title}</h3>
                                    <p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
                        <SectionHeading eyebrow="Avoid these" title="Common Mistakes That Can Stop Credit" />
                        <ul className="space-y-3">
                            {mistakes.map((item) => (
                                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                                    <ShieldAlert className="mt-0.5 h-5 w-5 flex-none text-rose-700" aria-hidden="true" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="py-12">
                    <div className="rounded-lg bg-slate-950 p-6 text-white shadow-sm sm:p-8">
                        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
                            <div>
                                <p className="text-xs font-extrabold uppercase tracking-wide text-lime-300">Worth doing?</p>
                                <h2 className="mt-2 text-3xl font-black tracking-tight">Yes, if your desktop can handle the download.</h2>
                                <p className="mt-4 text-sm leading-6 text-slate-300">
                                    This is a good offer if you have a capable desktop and enough storage. The tasks are clear, the game is free-to-play, and the early milestones are beginner-friendly. The only real downside is the large download size.
                                </p>
                                <p className="mt-3 text-sm leading-6 text-slate-300">
                                    This is better for users who can leave a large PC download running, play several battles, and carefully follow tracking instructions.
                                </p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                                <h3 className="text-lg font-black">Quick Completion Route</h3>
                                <ol className="mt-4 grid gap-3 text-sm leading-6 text-slate-200 sm:grid-cols-2">
                                    {quickRoute.map((item, index) => (
                                        <li key={item} className="flex gap-3">
                                            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-lime-300 text-xs font-black text-slate-950">
                                                {index + 1}
                                            </span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-6">
                    <SectionHeading eyebrow="FAQ" title="World of Warships Torox Offer FAQ" />
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

                <section className="py-10">
                    <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
                        <p className="font-black text-slate-950">Source and tracking note</p>
                        <p className="mt-2">
                            Offerwall rewards, task wording, device rules, and deadlines can change, so always trust the live Torox offer page on Gain.gg before starting.
                        </p>
                        <a
                            href={GAIN_GG_DEEP_LINK}
                            target="_blank"
                            rel="sponsored noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-2 font-extrabold text-cyan-700 hover:text-cyan-900"
                        >
                            Start on Gain.gg
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </a>
                    </div>
                </section>
            </div>
        </main>
    );
}
