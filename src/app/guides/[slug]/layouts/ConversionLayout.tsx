import { extractPreamble, extractSections, renderMarkdown } from "../markdownRenderer";
import Link from "next/link";

interface ConversionLayoutProps {
    guide: {
        body_md: string | null;
        tips: string[];
        key_takeaways: string | null;
        checklist_items: string[];
        max_payout_usd: number | null;
        difficulty: string | null;
        estimated_time: string | null;
    };
    gameSlug: string;
    gameName: string;
    showStaticCta?: boolean;
}

function cleanLines(value: string | null | undefined) {
    return (value ?? "")
        .split("\n")
        .map((line) => line.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean);
}

export default function ConversionLayout({ guide, gameSlug, gameName, showStaticCta = true }: ConversionLayoutProps) {
    const sections = extractSections(guide.body_md ?? "", [2, 3]);
    const preamble = extractPreamble(guide.body_md ?? "", [2, 3]);
    const takeaways = cleanLines(guide.key_takeaways);
    const checklist = guide.checklist_items ?? [];
    const tips = guide.tips ?? [];
    const primaryActions = checklist.length > 0 ? checklist.slice(0, 4) : takeaways.slice(0, 4);
    const visibleSections = sections.length > 0 ? sections : [];

    return (
        <div className="space-y-6">
            <div id="overview" />

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="grid gap-0 lg:grid-cols-[1fr_0.38fr]">
                    <div className="p-5 sm:p-6">
                        <div className="mb-3 text-xs font-extrabold uppercase tracking-widest text-lime-700">
                            Best path summary
                        </div>
                        <h2 className="text-2xl font-extrabold tracking-tight text-gray-950">
                            Finish the right milestones first, then verify credit before going deeper.
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                            This layout is built for offer guides where readers need a fast go/no-go decision, a clear starting checklist, and a step path that keeps the payout route visible while they read.
                        </p>
                        {primaryActions.length > 0 && (
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                {primaryActions.map((item, index) => (
                                    <div key={`${item}-${index}`} className="rounded-xl border border-lime-200 bg-lime-50 px-4 py-3">
                                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-lime-700">
                                            Check {index + 1}
                                        </div>
                                        <div className="mt-1 text-sm font-bold leading-5 text-gray-900">{item}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <aside className="border-t border-gray-200 bg-gray-950 p-5 text-white lg:border-l lg:border-t-0">
                        <div className="text-xs font-extrabold uppercase tracking-widest text-lime-300">Route metrics</div>
                        <div className="mt-4 space-y-3">
                            {guide.max_payout_usd != null && (
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Payout</div>
                                    <div className="text-3xl font-black text-lime-300">${guide.max_payout_usd.toFixed(2)}</div>
                                </div>
                            )}
                            {guide.difficulty && (
                                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Difficulty</div>
                                    <div className="font-extrabold capitalize">{guide.difficulty}</div>
                                </div>
                            )}
                            {guide.estimated_time && (
                                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Time</div>
                                    <div className="font-extrabold">{guide.estimated_time}</div>
                                </div>
                            )}
                        </div>
                        {showStaticCta ? (
                            <Link
                                href={`/offers/${gameSlug}`}
                                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-lime-300 px-4 py-3 text-sm font-extrabold text-gray-950 transition hover:bg-lime-200"
                            >
                                View {gameName} offer
                            </Link>
                        ) : null}
                    </aside>
                </div>
            </section>

            {preamble && (
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-3 text-xs font-extrabold uppercase tracking-widest text-gray-400">Overview</div>
                    <div
                        className="prose prose-slate max-w-none prose-img:my-6 prose-img:max-w-full prose-img:rounded-xl prose-table:border prose-th:border prose-th:bg-gray-100 prose-td:border"
                        dangerouslySetInnerHTML={{ __html: preamble }}
                    />
                </section>
            )}

            <section id="steps" className="space-y-4">
                {visibleSections.length > 0 ? (
                    visibleSections.map((section, index) => (
                        <article
                            key={`${section.id}-${index}`}
                            id={section.id}
                            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                        >
                            <div className="grid gap-0 md:grid-cols-[92px_1fr]">
                                <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4 md:flex-col md:items-start md:border-b-0 md:border-r">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-sm font-black text-lime-300">
                                        {index + 1}
                                    </span>
                                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">
                                        Step
                                    </span>
                                </div>
                                <div className="p-5">
                                    <h2 className="text-xl font-extrabold leading-snug text-gray-950">{section.heading}</h2>
                                    {section.body && (
                                        <div
                                            className="prose prose-slate mt-3 max-w-none prose-img:my-6 prose-img:max-w-full prose-img:rounded-xl prose-table:border prose-th:border prose-th:bg-gray-100 prose-td:border"
                                            dangerouslySetInnerHTML={{ __html: section.body }}
                                        />
                                    )}
                                </div>
                            </div>
                        </article>
                    ))
                ) : (
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div
                            className="prose prose-slate max-w-none prose-img:my-6 prose-img:max-w-full prose-img:rounded-xl prose-table:border prose-th:border prose-th:bg-gray-100 prose-td:border"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(guide.body_md ?? "") }}
                        />
                    </section>
                )}
            </section>

            {tips.length > 0 && (
                <section id="tips" className="rounded-2xl border border-lime-200 bg-lime-50 p-5 sm:p-6">
                    <div className="mb-4 text-xs font-extrabold uppercase tracking-widest text-lime-700">
                        Conversion tips
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {tips.map((tip, index) => (
                            <div key={`${tip}-${index}`} className="rounded-xl border border-lime-200 bg-white px-4 py-3">
                                <div className="text-[11px] font-extrabold uppercase tracking-wider text-lime-700">
                                    Tip {index + 1}
                                </div>
                                <p className="mt-1 text-sm leading-6 text-gray-700">{tip}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {showStaticCta ? (
                <div className="rounded-2xl bg-gray-950 p-6 text-white shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-widest text-lime-300">Ready to start?</div>
                            <div className="mt-1 text-lg font-extrabold">
                                Open the current {gameName} payout route before requirements change.
                            </div>
                        </div>
                        <Link
                            href={`/offers/${gameSlug}`}
                            className="inline-flex items-center justify-center rounded-xl bg-lime-300 px-5 py-3 text-sm font-extrabold text-gray-950 transition hover:bg-lime-200"
                        >
                            View Offer
                        </Link>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
