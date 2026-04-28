import { renderMarkdown, extractPreamble, extractSections } from "../markdownRenderer";
import Link from "next/link";

interface StepsLayoutProps {
    guide: {
        body_md: string | null;
        tips: string[];
        max_payout_usd: number | null;
    };
    gameSlug: string;
    gameName: string;
}

export default function StepsLayout({ guide, gameSlug, gameName }: StepsLayoutProps) {
    const sections = extractSections(guide.body_md ?? "");
    const tips     = guide.tips ?? [];

    // Extract any preamble (text before the first ## heading)
    const preamble = extractPreamble(guide.body_md ?? "");

    return (
        <div className="space-y-5">

            <div id="overview" />

            {/* Preamble / intro */}
            {preamble && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3">Overview</div>
                    <div
                        className="prose prose-slate max-w-none prose-img:rounded-xl prose-img:my-6 prose-img:max-w-full prose-table:border prose-th:border prose-td:border prose-th:bg-gray-100"
                        dangerouslySetInnerHTML={{ __html: preamble }}
                    />
                </div>
            )}

            {/* Before You Start reminder */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex gap-3">
                <span className="text-xl flex-shrink-0">📌</span>
                <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider text-blue-700 mb-0.5">Before You Start</div>
                    <p className="text-sm text-blue-800">
                        Read all steps before beginning — some require preparation that&apos;s easier to do upfront. Follow each step in order for the fastest completion.
                    </p>
                </div>
            </div>

            {/* Step cards */}
            <div id="steps" className="space-y-4">
                {sections.length > 0 ? (
                    sections.map((section, i) => (
                        <div
                            key={section.id}
                            id={section.id}
                            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                            {/* Step header bar */}
                            <div className="flex items-center gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-extrabold">
                                    {i + 1}
                                </div>
                                <h2 className="font-extrabold text-gray-900 leading-snug">{section.heading}</h2>
                            </div>
                            {/* Step body */}
                            {section.body && (
                                <div className="px-5 py-4">
                                    <div
                                        className="prose prose-slate max-w-none prose-img:rounded-xl prose-img:my-6 prose-img:max-w-full prose-table:border prose-th:border prose-td:border prose-th:bg-gray-100"
                                        dangerouslySetInnerHTML={{ __html: section.body }}
                                    />
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    // Fallback: render full markdown if no ## sections found
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div
                            className="prose prose-slate max-w-none prose-img:rounded-xl prose-img:my-6 prose-img:max-w-full prose-table:border prose-th:border prose-td:border prose-th:bg-gray-100"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(guide.body_md ?? "") }}
                        />
                    </div>
                )}
            </div>

            {/* Mistakes to Avoid */}
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex gap-3">
                <span className="text-xl flex-shrink-0">⚠️</span>
                <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider text-red-700 mb-0.5">Common Mistakes</div>
                    <p className="text-sm text-red-800">
                        Don&apos;t skip daily bonuses — they compound over time. Avoid spending premium currency unless you know the exact requirement. Check the goal completion screen before exiting the app each session.
                    </p>
                </div>
            </div>

            {/* Tips */}
            {tips.length > 0 && (
                <section id="tips" className="bg-lime-50 border border-lime-200 rounded-2xl p-5">
                    <h2 className="text-sm font-extrabold uppercase tracking-widest text-lime-700 mb-4">💡 Pro Tips</h2>
                    <ul className="space-y-2">
                        {tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                                <span className="flex-shrink-0 w-5 h-5 bg-lime-400 text-gray-900 rounded-full flex items-center justify-center text-[10px] font-extrabold mt-0.5">
                                    {i + 1}
                                </span>
                                <span className="leading-relaxed">{tip}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* CTA */}
            <div className="bg-gray-900 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-lime-400 mb-1">All steps done?</div>
                    <div className="text-white font-bold">
                        Claim your reward on {gameName}
                        {guide.max_payout_usd != null && ` — up to $${guide.max_payout_usd.toFixed(2)}`}
                    </div>
                </div>
                <Link
                    href={`/offers/${gameSlug}`}
                    className="flex-shrink-0 px-5 py-2.5 bg-lime-400 text-gray-900 font-extrabold text-sm rounded-xl hover:bg-lime-300 transition shadow"
                >
                    View Offer →
                </Link>
            </div>
        </div>
    );
}
