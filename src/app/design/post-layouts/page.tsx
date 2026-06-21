/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
    Bookmark,
    Check,
    Download,
    ExternalLink,
    Play,
    Search,
    Share2,
    ShieldAlert,
    Sparkles,
    Star,
} from "lucide-react";

export const metadata: Metadata = {
    title: "Gaming Post Layout System | EarnGrind",
    description: "Design preview for premium gaming article, guide, and review post layouts.",
};

const navItems = ["News", "Guides", "Reviews", "Deals", "Community"];
const tags = ["Patch Notes", "RPG", "Strategy", "Console", "PC", "Mobile"];
const related = [
    "Best games to start after the summer showcase",
    "How to optimize your loadout before ranked resets",
    "The settings every PC player should check first",
];
const similarGames = ["Starfall Outriders", "Neon Bastion", "Warden Protocol", "Ash Circuit"];
const visualImages = {
    blue: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80",
    green: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1400&q=80",
    violet: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=1400&q=80",
};

function Visual({ label, tone = "blue", tall = false }: { label: string; tone?: "blue" | "green" | "violet"; tall?: boolean }) {
    const toneClass = {
        blue: "from-sky-500/35 via-cyan-300/10 to-slate-950",
        green: "from-lime-300/40 via-emerald-400/10 to-slate-950",
        violet: "from-violet-400/35 via-blue-400/10 to-slate-950",
    }[tone];

    return (
        <div
            className={`relative overflow-hidden border border-white/10 bg-slate-950 ${tall ? "min-h-[420px]" : "min-h-[230px]"}`}
            data-layer={`Image Placeholder - ${label}`}
        >
            <img
                alt={`${label} placeholder gaming artwork`}
                className="absolute inset-0 h-full w-full object-cover opacity-75"
                src={visualImages[tone]}
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${toneClass}`} />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,.16)_42%,transparent_58%),radial-gradient(circle_at_78%_18%,rgba(190,242,100,.32),transparent_30%)]" />
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-200">Gaming Artwork</p>
                    <p className="mt-1 max-w-xs text-xl font-black leading-tight text-white">{label}</p>
                </div>
                <div className="hidden h-16 w-28 border border-white/20 bg-white/10 backdrop-blur sm:block" />
            </div>
        </div>
    );
}

function Button({ children, variant = "primary" }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost" }) {
    const variants = {
        primary: "border-lime-300 bg-lime-300 text-slate-950 shadow-[0_10px_28px_rgba(190,242,100,.2)] hover:bg-lime-200",
        secondary: "border-cyan-300/40 bg-cyan-300/10 text-cyan-100 hover:border-cyan-200 hover:bg-cyan-300/20",
        ghost: "border-white/10 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10",
    };

    return (
        <button
            className={`inline-flex items-center justify-center gap-2 border px-4 py-2.5 text-sm font-black transition hover:-translate-y-0.5 ${variants[variant]}`}
            data-layer={`Button - ${variant}`}
        >
            {children}
        </button>
    );
}

function Tag({ children, accent = "blue" }: { children: ReactNode; accent?: "blue" | "green" | "neutral" }) {
    const classes = {
        blue: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
        green: "border-lime-300/40 bg-lime-300/15 text-lime-100",
        neutral: "border-slate-700 bg-slate-900 text-slate-300",
    };
    return <span className={`inline-flex border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${classes[accent]}`}>{children}</span>;
}

function PreviewNav() {
    return (
        <header className="flex h-16 items-center gap-8 border-b border-white/10 bg-slate-950/95 px-8 text-white" data-layer="Reusable Nav">
            <div className="flex items-center gap-2 font-black tracking-tight">
                <span className="h-3 w-3 bg-lime-300 shadow-[0_0_18px_rgba(190,242,100,.9)]" />
                GrindWire
            </div>
            <nav className="hidden flex-1 items-center gap-5 text-xs font-bold uppercase tracking-wide text-slate-300 md:flex">
                {navItems.map((item) => <span key={item}>{item}</span>)}
            </nav>
            <div className="ml-auto flex items-center gap-3">
                <div className="hidden items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 md:flex">
                    <Search size={14} /> Search
                </div>
                <Button>Join Free</Button>
            </div>
        </header>
    );
}

function FrameShell({ title, width, children }: { title: string; width: 1440 | 390; children: ReactNode }) {
    return (
        <section className="mb-16" data-layer={`Frame Group - ${title} ${width}`}>
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300">{title}</h2>
                <span className="border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-bold text-slate-400">{width}px frame</span>
            </div>
            <div className="overflow-x-auto border border-slate-700 bg-slate-950 p-4">
                <div className="mx-auto overflow-hidden bg-slate-950 text-slate-100 shadow-2xl" style={{ width }} data-layer={`${title} - ${width}px`}>
                    {children}
                </div>
            </div>
        </section>
    );
}

function ArticleCard({ title, meta }: { title: string; meta: string }) {
    return (
        <article className="group border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-1 hover:border-lime-300/60 hover:bg-white/[0.07]" data-layer="Reusable Article Card Hover">
            <div className="mb-3 h-24 bg-gradient-to-br from-cyan-400/30 to-slate-900" />
            <p className="text-[11px] font-black uppercase tracking-wide text-lime-200">{meta}</p>
            <h3 className="mt-2 text-base font-black leading-tight text-white group-hover:text-lime-100">{title}</h3>
        </article>
    );
}

function AuthorBio() {
    return (
        <section className="border border-white/10 bg-white/[0.04] p-5" data-layer="Reusable Author Bio">
            <div className="flex gap-4">
                <div className="h-14 w-14 bg-gradient-to-br from-lime-300 to-cyan-300" />
                <div>
                    <p className="text-sm font-black text-white">Maya Chen, Senior Guides Editor</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">Tests live service updates, tracks economy changes, and rewrites guides after major patches.</p>
                </div>
            </div>
        </section>
    );
}

function BlogArticle({ compact = false }: { compact?: boolean }) {
    return (
        <main data-layer="Blog Article Layout">
            <PreviewNav />
            <section className={`grid gap-8 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,.22),transparent_34%),#08111f] ${compact ? "p-5" : "grid-cols-[1fr_520px] p-12"}`} data-layer="Article Hero">
                <div className="flex flex-col justify-end">
                    <Tag>Industry News</Tag>
                    <h1 className={`${compact ? "mt-5 text-4xl" : "mt-6 text-6xl"} max-w-4xl font-black leading-[0.95] tracking-tight text-white`}>
                        How the new season update changes the grind for solo players
                    </h1>
                    <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Patch 9.4 adds faster progression, a revised loot table, and one upgrade path that casual players should prioritize first.</p>
                    <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-slate-300">
                        <span>By Jordan Vale</span><span>Jun 21, 2026</span><span>7 min read</span>
                    </div>
                </div>
                <Visual label="Season update battle pass preview" tone="blue" tall={!compact} />
            </section>
            <section className={`grid gap-8 bg-slate-100 text-slate-950 ${compact ? "p-5" : "grid-cols-[72px_minmax(0,760px)_320px] p-12"}`} data-layer="Article Body Grid">
                {!compact && <div className="sticky top-24 flex h-max flex-col gap-2"><Button variant="ghost"><Share2 size={16} /></Button><Button variant="ghost"><Bookmark size={16} /></Button></div>}
                <article className="space-y-8 bg-white p-8 shadow-xl" data-layer="Readable Article Body">
                    <p className="text-xl leading-9 text-slate-700">The headline change is not the bigger reward pool. It is the lower friction between daily objectives and meaningful upgrades.</p>
                    <h2 className="text-3xl font-black">What changed in the opening loop</h2>
                    <p className="leading-8 text-slate-700">Daily contracts now stack with region objectives, which means a normal evening session can finish two unlock tracks instead of one. The result is a friendlier first week without flattening the endgame.</p>
                    <blockquote className="border-l-4 border-lime-400 bg-slate-950 p-6 text-2xl font-black leading-tight text-white" data-layer="Article Pull Quote">The smartest play is to bank materials until the third reward tier opens.</blockquote>
                    <Visual label="Loadout comparison and reward track" tone="green" />
                    <div className="border border-cyan-200 bg-cyan-50 p-5">
                        <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Related Link</p>
                        <p className="mt-2 font-bold">See our complete season currency farming route for week one.</p>
                    </div>
                    <AuthorBio />
                </article>
                {!compact && <Sidebar />}
            </section>
            <RelatedSection title="Keep reading gaming news" cta="Read more news" />
        </main>
    );
}

function Sidebar() {
    return (
        <aside className="space-y-5" data-layer="Article Sidebar">
            <div className="border border-slate-200 bg-white p-5">
                <h3 className="font-black">Trending posts</h3>
                {related.map((item, index) => <p key={item} className="mt-4 border-t border-slate-200 pt-4 text-sm font-bold leading-5">{index + 1}. {item}</p>)}
            </div>
            <div className="bg-slate-950 p-5 text-white">
                <h3 className="font-black">Get weekly patch reads</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">One useful digest. No filler.</p>
                <Button>Subscribe</Button>
            </div>
            <div className="flex flex-wrap gap-2">{tags.map((tag) => <Tag key={tag} accent="neutral">{tag}</Tag>)}</div>
        </aside>
    );
}

function Callout({ type, children }: { type: "Tip" | "Warning" | "Pro Note"; children: ReactNode }) {
    const icon = type === "Warning" ? <ShieldAlert size={18} /> : <Sparkles size={18} />;
    const style = type === "Warning" ? "border-amber-300 bg-amber-50 text-amber-950" : type === "Tip" ? "border-lime-300 bg-lime-50 text-lime-950" : "border-cyan-300 bg-cyan-50 text-cyan-950";
    return <div className={`border p-4 ${style}`} data-layer={`Reusable Callout - ${type}`}><p className="mb-1 flex items-center gap-2 text-sm font-black">{icon}{type}</p><p className="text-sm leading-6">{children}</p></div>;
}

function GuideLayout({ compact = false }: { compact?: boolean }) {
    const steps = ["Unlock the correct route", "Prepare your gear", "Clear the timed encounter", "Claim and verify rewards"];
    return (
        <main data-layer="Guide Tutorial Layout">
            <PreviewNav />
            <section className={`bg-[#06170f] ${compact ? "p-5" : "p-12"}`} data-layer="Guide Hero">
                <div className={`grid gap-8 ${compact ? "" : "grid-cols-[1fr_420px]"}`}>
                    <div>
                        <div className="flex flex-wrap gap-2"><Tag accent="green">Intermediate</Tag><Tag accent="blue">35 min</Tag><Tag accent="neutral">PC</Tag><Tag accent="neutral">PS5</Tag></div>
                        <h1 className={`${compact ? "text-4xl" : "text-6xl"} mt-6 max-w-4xl font-black leading-none text-white`}>How to farm rare upgrade cores without wasting stamina</h1>
                        <p className="mt-5 max-w-2xl text-lg leading-8 text-emerald-100/80">A practical route for players who want a reliable core loop before the weekly reset.</p>
                        <div className="mt-6 flex flex-wrap gap-3"><Button><Bookmark size={16} />Save</Button><Button variant="secondary"><Share2 size={16} />Share</Button><Button variant="ghost"><Download size={16} />PDF</Button></div>
                    </div>
                    <div className="border border-lime-300/20 bg-lime-300/10 p-5" data-layer="Guide Progress Indicator">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-200">Guide Progress</p>
                        {steps.map((step, index) => (
                            <div key={step} className="mt-5 flex items-center gap-3">
                                <span className={`grid h-8 w-8 place-items-center border text-sm font-black ${index < 2 ? "border-lime-300 bg-lime-300 text-slate-950" : "border-white/20 text-slate-300"}`}>{index + 1}</span>
                                <span className="text-sm font-bold text-white">{step}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className={`grid gap-8 bg-slate-100 text-slate-950 ${compact ? "p-5" : "grid-cols-[280px_1fr] p-12"}`} data-layer="Guide Content Grid">
                {!compact && <aside className="sticky top-24 h-max border border-slate-200 bg-white p-5" data-layer="Sticky Table Of Contents"><p className="font-black">On this guide</p>{steps.map((step) => <p key={step} className="mt-3 text-sm font-bold text-slate-600">{step}</p>)}</aside>}
                <article className="space-y-6" data-layer="Step By Step Blocks">
                    {steps.map((step, index) => (
                        <section key={step} className="border border-slate-200 bg-white p-6 shadow-sm" data-layer={`Step ${index + 1} - ${step}`}>
                            <p className="text-sm font-black uppercase tracking-wide text-emerald-700">Step {index + 1}</p>
                            <h2 className="mt-2 text-3xl font-black">{step}</h2>
                            <p className="mt-3 leading-8 text-slate-700">Follow this section before moving on. It keeps the route consistent, avoids dead time, and makes every stamina spend easier to audit.</p>
                            {index === 0 && <Callout type="Tip">Start from the northern relay because it puts two elite packs inside one cooldown window.</Callout>}
                            {index === 1 && <Callout type="Warning">Do not upgrade temporary gear before the timed encounter. Save cores for permanent slots.</Callout>}
                            {index === 2 && <Callout type="Pro Note">A support ultimate at 1:15 usually prevents the second wave from splitting.</Callout>}
                        </section>
                    ))}
                    <div className="border border-lime-300 bg-lime-50 p-6" data-layer="Checklist Component">
                        <h3 className="text-xl font-black">Before you leave the route</h3>
                        {["Daily contract claimed", "Two elite packs cleared", "Reward chest opened", "Core count recorded"].map((item) => <p key={item} className="mt-3 flex items-center gap-3 font-bold"><Check className="text-emerald-600" size={18} />{item}</p>)}
                    </div>
                </article>
            </section>
            <RelatedSection title="Related walkthroughs" cta="View more walkthroughs" />
        </main>
    );
}

function ReviewLayout({ compact = false }: { compact?: boolean }) {
    return (
        <main data-layer="Game Review Profile Layout">
            <PreviewNav />
            <section className={`relative bg-slate-950 ${compact ? "p-5" : "p-12"}`} data-layer="Cinematic Review Hero">
                <Visual label="Astra Vale: Eclipse Frontier" tone="violet" tall />
                <div className={`${compact ? "mt-5" : "absolute bottom-12 left-12 max-w-3xl"} text-white`}>
                    <div className="flex flex-wrap gap-2"><Tag>Action RPG</Tag><Tag accent="neutral">PC</Tag><Tag accent="neutral">Xbox</Tag><Tag accent="green">8.8 Review Score</Tag></div>
                    <h1 className={`${compact ? "text-4xl" : "text-7xl"} mt-5 font-black leading-none`}>Astra Vale: Eclipse Frontier</h1>
                    <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">A confident sci-fi RPG with sharp combat, generous buildcraft, and a few uneven performance pockets.</p>
                </div>
            </section>
            <section className={`grid gap-8 bg-slate-100 p-5 text-slate-950 ${compact ? "" : "grid-cols-[360px_1fr] p-12"}`} data-layer="Review Main Grid">
                <aside className="space-y-5" data-layer="Quick Facts And Rating Cards">
                    <div className="border border-slate-200 bg-white p-6">
                        <p className="text-sm font-black uppercase tracking-wide text-slate-500">Quick Facts</p>
                        {["Developer: Northline Studio", "Publisher: Blue Orbit", "Release: Aug 14, 2026", "Platforms: PC, Xbox, PS5", "Multiplayer: 4 player co-op", "Price: $49.99"].map((fact) => <p key={fact} className="mt-3 border-t border-slate-200 pt-3 text-sm font-bold">{fact}</p>)}
                    </div>
                    <div className="bg-slate-950 p-6 text-white" data-layer="Rating Card">
                        <p className="text-sm font-black uppercase tracking-wide text-lime-200">Verdict</p>
                        <div className="mt-3 flex items-end gap-2"><span className="text-6xl font-black">8.8</span><span className="pb-2 text-slate-400">/10</span></div>
                        <p className="mt-3 text-sm leading-6 text-slate-300">Excellent for action RPG players who like flexible builds and short-session progression.</p>
                    </div>
                </aside>
                <article className="space-y-7" data-layer="Review Content Sections">
                    <div className="grid gap-4 md:grid-cols-2" data-layer="Pros And Cons">
                        <div className="border border-emerald-200 bg-white p-5"><h3 className="font-black text-emerald-700">Pros</h3><p className="mt-3 leading-7">Fast combat, generous loot, clear mission structure, strong co-op scaling.</p></div>
                        <div className="border border-rose-200 bg-white p-5"><h3 className="font-black text-rose-700">Cons</h3><p className="mt-3 leading-7">Some late zones stutter, companion AI can lag behind, story starts slowly.</p></div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3" data-layer="Screenshot Gallery"><Visual label="Combat arena" /><Visual label="Hub city" tone="green" /><Visual label="Boss phase" tone="violet" /></div>
                    {["Gameplay overview", "Story", "Graphics", "Performance", "Final verdict"].map((section) => <section key={section} className="border border-slate-200 bg-white p-6"><h2 className="text-2xl font-black">{section}</h2><p className="mt-3 leading-8 text-slate-700">This section uses short paragraphs, strong headings, and scan-friendly verdict language so readers can evaluate the game quickly without losing editorial depth.</p></section>)}
                    <div className="flex flex-wrap gap-3"><Button><ExternalLink size={16} />Read Full Review</Button><Button variant="secondary"><Play size={16} />Watch Trailer</Button><Button variant="ghost"><Star size={16} />Add to Wishlist</Button></div>
                </article>
            </section>
            <RelatedSection title="Similar games" cta="Explore reviews" items={similarGames} />
        </main>
    );
}

function RelatedSection({ title, cta, items = related }: { title: string; cta: string; items?: string[] }) {
    return (
        <section className="bg-slate-950 p-8 text-white" data-layer="Reusable Related Content Section">
            <div className="mb-5 flex items-end justify-between gap-4">
                <div><p className="text-xs font-black uppercase tracking-[0.2em] text-lime-200">Next read</p><h2 className="text-3xl font-black">{title}</h2></div>
                <Button variant="secondary">{cta}</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">{items.slice(0, 3).map((item, index) => <ArticleCard key={item} title={item} meta={`${index + 4} min read`} />)}</div>
        </section>
    );
}

export default function PostLayoutsPreview() {
    return (
        <main className="min-h-screen bg-[#050914] px-6 py-10 text-white" data-layer="Post Layout Preview Board">
            <div className="mx-auto mb-10 max-w-5xl">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-lime-200">Design System Preview</p>
                <h1 className="mt-3 text-5xl font-black tracking-tight">Professional gaming editorial post layouts</h1>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">Three distinct but cohesive post templates with reusable navigation, tags, buttons, author blocks, callouts, rating cards, hoverable article cards, and related content modules.</p>
            </div>
            <FrameShell title="Blog Article Layout Desktop" width={1440}><BlogArticle /></FrameShell>
            <FrameShell title="Blog Article Layout Mobile" width={390}><BlogArticle compact /></FrameShell>
            <FrameShell title="Guide Tutorial Layout Desktop" width={1440}><GuideLayout /></FrameShell>
            <FrameShell title="Guide Tutorial Layout Mobile" width={390}><GuideLayout compact /></FrameShell>
            <FrameShell title="Game Review Profile Layout Desktop" width={1440}><ReviewLayout /></FrameShell>
            <FrameShell title="Game Review Profile Layout Mobile" width={390}><ReviewLayout compact /></FrameShell>
        </main>
    );
}
