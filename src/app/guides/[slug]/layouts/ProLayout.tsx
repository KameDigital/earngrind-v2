import { renderMarkdown, extractPreamble, extractSections } from "../markdownRenderer";
import ProChecklist from "../ProChecklist";
import Link from "next/link";


interface ProLayoutProps {
    guide: {
        body_md: string | null;
        tips: string[];
        key_takeaways: string | null;
        checklist_items: string[];
        max_payout_usd: number | null;
        difficulty: string | null;
        estimated_time: string | null;
        video_url?: string | null;
        video_summary?: string | null;
        video_transcript?: string | null;
    };
    gameSlug: string;
    gameName: string;
    showStaticCta?: boolean;
}

export default function ProLayout({ guide, gameSlug, gameName, showStaticCta = true }: ProLayoutProps) {
    const sections       = extractSections(guide.body_md ?? "", [2, 3]);
    const tips           = guide.tips ?? [];
    const checklist      = guide.checklist_items ?? [];
    const takeaways      = (guide.key_takeaways ?? "")
        .split("\n")
        .map(l => l.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean);

    const preamble = extractPreamble(guide.body_md ?? "", [2, 3]);
    const showSeaOfConquestVideo = Boolean(guide.video_url && gameName.toLowerCase().includes("sea of conquest"));

    return (
        <div className="space-y-5">

            <div id="overview" />

            {/* Key Takeaways */}
            {takeaways.length > 0 && (
                <div className="bg-gray-900 rounded-2xl p-5">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-lime-400 mb-3">⚡ Key Takeaways</div>
                    <ul className="space-y-2">
                        {takeaways.map((t, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-white">
                                <span className="flex-shrink-0 mt-0.5 text-lime-400">✓</span>
                                <span>{t}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {showSeaOfConquestVideo && (
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <h2 className="text-lg font-extrabold text-gray-900 mb-3">
                        Watch First: Sea of Conquest Offerwall ROI Breakdown
                    </h2>
                    <p className="text-sm leading-6 text-gray-700 mb-4">
                        This video explains the core strategy before you start: Sea of Conquest offerwall rewards are tied to Flagship milestones, not overall ship power. The goal is to build a gold engine, avoid wasted upgrades, protect auto-trade with Ghost Mode, and know when to stop instead of chasing Level 30.
                    </p>
                    <div className="guide-video">
                        <video
                            controls
                            preload="metadata"
                            className="w-full rounded-xl border border-gray-200 bg-gray-950"
                            title="Sea of Conquest offerwall ROI breakdown"
                        >
                            <source src={guide.video_url ?? ""} type="video/mp4" />
                        </video>
                    </div>
                    <div className="mt-4 rounded-xl border border-lime-200 bg-lime-50 p-4">
                        <div className="text-sm font-extrabold text-gray-900 mb-2">Video summary</div>
                        <p className="text-sm leading-6 text-gray-700">
                            {guide.video_summary ?? "The video explains why Sea of Conquest offerwall runs should be managed as a Flagship milestone economy: build gold income by Day 4, protect auto-trade with Ghost Mode, buy only when tracking and ROI make sense, and treat Level 21 as the usual practical stopping point."}
                        </p>
                    </div>
                    {guide.video_transcript && (
                        <details className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <summary className="cursor-pointer text-sm font-extrabold text-gray-900">Video transcript</summary>
                            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-700">
                                {guide.video_transcript}
                            </p>
                        </details>
                    )}
                </section>
            )}

            {/* Summary stats strip */}
            <div className="grid grid-cols-3 gap-3">
                {guide.max_payout_usd != null && (
                    <div className="bg-lime-50 border border-lime-200 rounded-xl px-3 py-3 text-center">
                        <div className="text-xs font-bold text-lime-600 uppercase tracking-wider mb-0.5">Payout</div>
                        <div className="text-lg font-extrabold text-lime-700">${guide.max_payout_usd.toFixed(2)}</div>
                    </div>
                )}
                {guide.difficulty && (
                    <div className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-center">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Difficulty</div>
                        <div className="text-sm font-extrabold text-gray-700 capitalize">{guide.difficulty}</div>
                    </div>
                )}
                {guide.estimated_time && (
                    <div className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-center">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Time</div>
                        <div className="text-sm font-extrabold text-gray-700">{guide.estimated_time}</div>
                    </div>
                )}
            </div>

            {/* Interactive Checklist */}
            {checklist.length > 0 && <ProChecklist items={checklist} />}

            {/* Preamble */}
            {preamble && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3">Overview</div>
                    <div className="prose prose-slate max-w-none prose-img:rounded-xl prose-img:my-6 prose-img:max-w-full prose-table:border prose-th:border prose-td:border prose-th:bg-gray-100" dangerouslySetInnerHTML={{ __html: preamble }} />
                </div>
            )}

            {/* Mid-page CTA */}
            {showStaticCta ? <Link
                href={`/offers/${gameSlug}`}
                className="flex items-center justify-between bg-lime-400 rounded-2xl px-5 py-4 hover:bg-lime-300 transition group"
            >
                <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider text-lime-900">Start Now</div>
                    <div className="font-bold text-gray-900">
                        View {gameName} offer
                        {guide.max_payout_usd != null && ` — up to $${guide.max_payout_usd.toFixed(2)}`}
                    </div>
                </div>
                <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
            </Link> : null}

            {/* Step sections */}
            <div id="steps" className="space-y-4">
                {sections.length > 0 ? (
                    sections.map((section, i) => (
                        <div key={`${section.id}-${i}`} id={section.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className={`flex items-center gap-4 px-5 py-3 border-b border-gray-100 ${section.level === 3 ? "bg-gray-50" : ""}`}>
                                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                                    section.level === 3 ? "bg-gray-900 text-white" : "bg-lime-400 text-gray-900"
                                }`}>
                                    {i + 1}
                                </div>
                                <h2 className="font-extrabold text-gray-900 leading-snug">{section.heading}</h2>
                            </div>
                            {section.body && (
                                <div className="px-5 py-4">
                                    <div className="prose prose-slate max-w-none prose-img:rounded-xl prose-img:my-6 prose-img:max-w-full prose-table:border prose-th:border prose-td:border prose-th:bg-gray-100" dangerouslySetInnerHTML={{ __html: section.body }} />
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="prose prose-slate max-w-none prose-img:rounded-xl prose-img:my-6 prose-img:max-w-full prose-table:border prose-th:border prose-td:border prose-th:bg-gray-100" dangerouslySetInnerHTML={{ __html: renderMarkdown(guide.body_md ?? "") }} />
                    </div>
                )}
            </div>

            {/* Premium Tips */}
            {tips.length > 0 && (
                <section id="tips" className="space-y-3">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-gray-500 px-1">💡 Expert Tips</div>
                    {tips.map((tip, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex gap-4 shadow-sm hover:border-lime-300 transition-colors">
                            <span className="flex-shrink-0 w-6 h-6 bg-lime-100 text-lime-700 rounded-full flex items-center justify-center text-xs font-extrabold">
                                {i + 1}
                            </span>
                            <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
                        </div>
                    ))}
                </section>
            )}

            {/* Final CTA */}
            {showStaticCta ? <div className="bg-gray-900 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-lime-400 mb-1">Ready to earn?</div>
                    <div className="text-white font-bold text-lg">
                        {gameName}
                        {guide.max_payout_usd != null && ` — up to $${guide.max_payout_usd.toFixed(2)}`}
                    </div>
                    {guide.estimated_time && (
                        <div className="text-gray-400 text-sm mt-0.5">Completion time: {guide.estimated_time}</div>
                    )}
                </div>
                <Link
                    href={`/offers/${gameSlug}`}
                    className="flex-shrink-0 px-6 py-3 bg-lime-400 text-gray-900 font-extrabold rounded-xl hover:bg-lime-300 transition shadow-lg text-sm"
                >
                    View Offer →
                </Link>
            </div> : null}
        </div>
    );
}
