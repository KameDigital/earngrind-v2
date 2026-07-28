import Link from "next/link";
import { extractPreamble, extractSections } from "./[slug]/markdownRenderer";

interface GuideFact {
    label: string;
    value: string;
}

interface GuideCta {
    href: string;
    label: string;
}

interface StaticGuideShellProps {
    title: string;
    description: string;
    eyebrow: string;
    gameName: string;
    markdown: string;
    badges: string[];
    facts: GuideFact[];
    highlights: string[];
    primaryCta: GuideCta;
    secondaryCta?: GuideCta;
}

export function StaticGuideShell({
    title,
    description,
    eyebrow,
    gameName,
    markdown,
    badges,
    facts,
    highlights,
    primaryCta,
    secondaryCta,
}: StaticGuideShellProps) {
    const preamble = extractPreamble(markdown);
    const sections = extractSections(markdown);

    return (
        <main className="min-h-screen overflow-x-hidden bg-[#f5f5f0] text-slate-950">
            <style dangerouslySetInnerHTML={{ __html: `
                .static-guide-prose{color:#334155;font-size:1.03rem;line-height:1.76;overflow-wrap:anywhere}
                .static-guide-prose h2,.static-guide-prose h3{color:#0f172a;font-weight:900;line-height:1.18;letter-spacing:0}
                .static-guide-prose h2{font-size:clamp(1.65rem,2.25vw,2.1rem);margin:0 0 1rem}
                .static-guide-prose h3{font-size:1.18rem;margin:2rem 0 .8rem;padding:.95rem 1rem;border:1px solid #dbeafe;border-left:5px solid #10b981;border-radius:14px;background:#f8fafc}
                .static-guide-prose p{margin:.72rem 0}
                .static-guide-prose a{color:#047857;font-weight:800;text-decoration:underline;text-underline-offset:3px}
                .static-guide-prose a:hover{color:#065f46}
                .static-guide-prose ul,.static-guide-prose ol{margin:.65rem 0 1rem;padding-left:1.35rem}
                .static-guide-prose li{margin:.22rem 0;padding-left:.15rem}
                .static-guide-prose strong{color:#0f172a}
                .static-guide-prose blockquote{border:1px solid #fde68a;border-left:5px solid #f59e0b;background:#fffbeb;margin:1.5rem 0;padding:1rem 1.1rem;color:#713f12;border-radius:14px;box-shadow:0 12px 28px rgba(120,53,15,.08)}
                .static-guide-prose hr{border:0;border-top:1px solid #e2e8f0;margin:2rem 0}
                .static-guide-prose .guide-field-label{margin:1.15rem 0 .35rem;color:#0f766e;font-size:.82rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
                .static-guide-prose .guide-key-line{margin:.75rem 0;border-left:3px solid #a7f3d0;background:#f0fdfa;padding:.65rem .85rem;border-radius:10px}
                .static-guide-prose .guide-key-line strong{color:#065f46}
                .static-guide-prose table{display:block;width:100%;max-width:100%;overflow-x:auto;border-collapse:separate;border-spacing:0;margin:1.25rem 0;border:1px solid #dbe3ea;border-radius:14px;background:white;box-shadow:0 10px 28px rgba(15,23,42,.05)}
                .static-guide-prose thead{background:#ecfeff}
                .static-guide-prose th,.static-guide-prose td{min-width:150px;border-right:1px solid #dbe3ea;border-bottom:1px solid #dbe3ea;padding:.75rem .8rem;text-align:left;vertical-align:top}
                .static-guide-prose th{color:#0f172a;font-size:.76rem;font-weight:900;text-transform:uppercase}
                .static-guide-prose td{font-size:.92rem;line-height:1.55}
                .static-guide-prose tr:last-child td{border-bottom:0}
                .static-guide-prose th:last-child,.static-guide-prose td:last-child{border-right:0}
                .static-guide-prose code{background:#f1f5f9;border:1px solid #dbe3ea;border-radius:6px;padding:1px 6px;color:#0f172a}
                .static-guide-preamble ul:first-of-type{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:.55rem;margin-top:1.25rem;padding-left:0;list-style:none}
                .static-guide-preamble ul:first-of-type li{margin:0;padding:0}
                .static-guide-preamble ul:first-of-type a{display:flex;min-height:42px;align-items:center;border:1px solid #dbe3ea;border-radius:12px;background:#f8fafc;padding:.6rem .75rem;text-decoration:none;color:#0f766e}
                .static-guide-preamble ul:first-of-type a:hover{border-color:#99f6e4;background:#f0fdfa}
                @media (max-width: 640px){
                    .static-guide-prose{font-size:.98rem;line-height:1.76}
                    .static-guide-prose h3{padding:.85rem .9rem}
                    .static-guide-prose table{display:block;overflow:visible;border:0;border-radius:0;background:transparent}
                    .static-guide-prose thead{display:none}
                    .static-guide-prose tbody{display:grid;gap:.85rem}
                    .static-guide-prose tr{display:block;overflow:hidden;border:1px solid #dbe3ea;border-radius:14px;background:#fff}
                    .static-guide-prose td{display:grid;grid-template-columns:minmax(92px,36%) minmax(0,1fr);min-width:0;border-right:0;padding:.72rem .8rem;gap:.7rem}
                    .static-guide-prose td::before{content:attr(data-label);font-size:.68rem;font-weight:900;line-height:1.25;text-transform:uppercase;color:#475569}
                    .static-guide-prose td[data-label=Exact\\ task]{order:-1;grid-template-columns:1fr;background:#f8fafc;font-weight:900;color:#0f172a}
                    .static-guide-prose td[data-label=Exact\\ task]::before{content:'Task';color:#047857}
                    .static-guide-prose tr:last-child td{border-bottom:1px solid #dbe3ea}
                    .static-guide-prose tr td:last-child{border-bottom:0}
                }
            ` }} />

            <section className="relative border-b border-slate-200 bg-white">
                <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#10b981,#22d3ee,#f59e0b)]" />
                <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                    <div className="min-w-0">
                        <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500" aria-label="Breadcrumb">
                            <Link href="/" className="transition-colors hover:text-emerald-700">Home</Link>
                            <span>/</span>
                            <Link href="/guides" className="transition-colors hover:text-emerald-700">Guides</Link>
                            <span>/</span>
                            <span className="text-slate-800">{gameName}</span>
                        </nav>

                        <div className="mb-4 flex flex-wrap gap-2">
                            {badges.map((badge) => (
                                <span key={badge} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-800">
                                    {badge}
                                </span>
                            ))}
                        </div>

                        <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-700">{eyebrow}</p>
                        <h1 className="mt-3 max-w-7xl text-3xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
                            {title}
                        </h1>
                        <p className="mt-5 max-w-4xl text-base leading-8 text-slate-700 sm:text-lg">
                            {description}
                        </p>

                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href={primaryCta.href}
                                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-[0_14px_34px_rgba(15,23,42,.18)] transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                            >
                                {primaryCta.label}
                            </Link>
                            {secondaryCta ? (
                                <Link
                                    href={secondaryCta.href}
                                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                                >
                                    {secondaryCta.label}
                                </Link>
                            ) : null}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_320px] xl:grid-cols-[260px_minmax(0,1fr)_340px]">
                <aside className="order-3 min-w-0 lg:order-none lg:sticky lg:top-24 lg:self-start">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">On This Page</p>
                        <nav className="mt-3 max-h-[calc(100vh-160px)] space-y-1 overflow-y-auto pr-1" aria-label="Guide sections">
                            {sections.map((section) => (
                                <a
                                    key={section.id}
                                    href={`#${section.id}`}
                                    className="block rounded-lg px-3 py-2 text-sm font-bold leading-5 text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                                >
                                    {section.heading}
                                </a>
                            ))}
                        </nav>
                    </div>
                </aside>

                <article className="order-2 min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm lg:order-none">
                    {preamble ? (
                        <section className="static-guide-prose static-guide-preamble border-b border-slate-200 p-5 sm:p-8" dangerouslySetInnerHTML={{ __html: preamble }} />
                    ) : null}

                    {sections.map((section, index) => (
                        <section
                            key={section.id}
                            className="static-guide-prose border-b border-slate-200 p-5 last:border-b-0 sm:p-8"
                            aria-labelledby={section.id}
                        >
                            <div className="mb-5 flex items-start gap-3">
                                <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white shadow-sm">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Guide Section</p>
                                    <h2 id={section.id}>{section.heading}</h2>
                                </div>
                            </div>
                            <div dangerouslySetInnerHTML={{ __html: section.body }} />
                        </section>
                    ))}
                </article>

                <aside className="order-1 min-w-0 space-y-4 lg:order-none lg:sticky lg:top-24 lg:self-start">
                    <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-5 shadow-[0_18px_50px_rgba(15,23,42,.08)]">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Offer Snapshot</p>
                        <dl className="mt-4 grid gap-3">
                            {facts.map((fact) => (
                                <div key={fact.label} className="min-w-0 rounded-xl border border-white bg-white p-3 shadow-sm">
                                    <dt className="text-[11px] font-black uppercase tracking-wide text-slate-500">{fact.label}</dt>
                                    <dd className="mt-1 whitespace-normal break-words text-sm font-black leading-5 text-slate-950">{fact.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Important Notes</p>
                        <div className="mt-3 space-y-2">
                            {highlights.map((highlight) => (
                                <div key={highlight} className="rounded-xl border border-amber-200 bg-white/70 px-3 py-2 text-sm font-bold leading-5 text-amber-950">
                                    {highlight}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-[0_18px_50px_rgba(15,23,42,.16)]">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">Next Step</p>
                        <div className="mt-4 grid gap-2">
                            <Link
                                href={primaryCta.href}
                                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-300 px-4 py-2 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-200 focus:outline-none focus:ring-4 focus:ring-emerald-100/30"
                            >
                                {primaryCta.label}
                            </Link>
                            {secondaryCta ? (
                                <Link
                                    href={secondaryCta.href}
                                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-center text-sm font-black text-white transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/20"
                                >
                                    {secondaryCta.label}
                                </Link>
                            ) : null}
                        </div>
                    </div>
                </aside>
            </div>
            </section>
        </main>
    );
}
