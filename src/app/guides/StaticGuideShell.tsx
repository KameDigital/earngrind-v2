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
            <style>{`
                .static-guide-prose{color:#334155;font-size:1.03rem;line-height:1.82;overflow-wrap:anywhere}
                .static-guide-prose h2,.static-guide-prose h3{color:#0f172a;font-weight:900;line-height:1.18;letter-spacing:0}
                .static-guide-prose h2{font-size:clamp(1.55rem,2.2vw,2.05rem);margin:0 0 1rem}
                .static-guide-prose h3{font-size:1.12rem;margin:2rem 0 .65rem;padding-top:1.15rem;border-top:1px solid #e2e8f0}
                .static-guide-prose p{margin:.9rem 0}
                .static-guide-prose a{color:#047857;font-weight:800;text-decoration:underline;text-underline-offset:3px}
                .static-guide-prose a:hover{color:#065f46}
                .static-guide-prose ul,.static-guide-prose ol{margin:1rem 0;padding-left:1.35rem}
                .static-guide-prose li{margin:.42rem 0;padding-left:.15rem}
                .static-guide-prose strong{color:#0f172a}
                .static-guide-prose blockquote{border:1px solid #fde68a;border-left:5px solid #f59e0b;background:#fffbeb;margin:1.35rem 0;padding:1rem 1.1rem;color:#713f12;border-radius:14px;box-shadow:0 12px 28px rgba(120,53,15,.08)}
                .static-guide-prose table{display:block;width:100%;max-width:100%;overflow-x:auto;border-collapse:separate;border-spacing:0;margin:1.15rem 0;border:1px solid #dbe3ea;border-radius:14px;background:white}
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
                    .static-guide-prose table{display:block;overflow:visible;border:0;border-radius:0;background:transparent}
                    .static-guide-prose thead{display:none}
                    .static-guide-prose tbody{display:grid;gap:.85rem}
                    .static-guide-prose tr{display:block;overflow:hidden;border:1px solid #dbe3ea;border-radius:14px;background:#fff}
                    .static-guide-prose td{display:grid;grid-template-columns:minmax(92px,36%) minmax(0,1fr);min-width:0;border-right:0;padding:.72rem .8rem;gap:.7rem}
                    .static-guide-prose td::before{content:attr(data-label);font-size:.68rem;font-weight:900;line-height:1.25;text-transform:uppercase;color:#475569}
                    .static-guide-prose td[data-label="Exact task"]{order:-1;grid-template-columns:1fr;background:#f8fafc;font-weight:900;color:#0f172a}
                    .static-guide-prose td[data-label="Exact task"]::before{content:"Task";color:#047857}
                    .static-guide-prose tr:last-child td{border-bottom:1px solid #dbe3ea}
                    .static-guide-prose tr td:last-child{border-bottom:0}
                }
            `}</style>

            <section className="relative border-b border-slate-200 bg-white">
                <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#10b981,#22d3ee,#f59e0b)]" />
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-12">
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
                        <h1 className="mt-3 max-w-5xl text-3xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
                            {title}
                        </h1>
                        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">
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

                    <aside className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-5 shadow-[0_18px_50px_rgba(15,23,42,.08)]">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Guide Snapshot</p>
                        <dl className="mt-4 grid gap-3">
                            {facts.map((fact) => (
                                <div key={fact.label} className="rounded-xl border border-white bg-white p-3 shadow-sm">
                                    <dt className="text-[11px] font-black uppercase tracking-wide text-slate-500">{fact.label}</dt>
                                    <dd className="mt-1 text-sm font-black leading-5 text-slate-950">{fact.value}</dd>
                                </div>
                            ))}
                        </dl>
                        <div className="mt-4 space-y-2">
                            {highlights.map((highlight) => (
                                <div key={highlight} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold leading-5 text-amber-950">
                                    {highlight}
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </section>

            <div className="mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8 lg:py-10">
                <article className="min-w-0 space-y-6">
                    {preamble ? (
                        <section className="static-guide-prose static-guide-preamble rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" dangerouslySetInnerHTML={{ __html: preamble }} />
                    ) : null}

                    {sections.map((section, index) => (
                        <section
                            key={section.id}
                            className="static-guide-prose rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
                            aria-labelledby={section.id}
                        >
                            <div className="mb-4 flex items-start gap-3">
                                <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <h2 id={section.id}>{section.heading}</h2>
                            </div>
                            <div dangerouslySetInnerHTML={{ __html: section.body }} />
                        </section>
                    ))}
                </article>

                <aside className="lg:sticky lg:top-24 lg:self-start">
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
            </div>
        </main>
    );
}
