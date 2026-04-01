import { renderMarkdown } from "../markdownRenderer";
import Link from "next/link";

interface ClassicLayoutProps {
    guide: {
        body_md: string | null;
        tips: string[];
        game_id: string;
        max_payout_usd: number | null;
    };
    gameSlug: string;
    gameName: string;
}

export default function ClassicLayout({ guide, gameSlug, gameName }: ClassicLayoutProps) {
    const html = renderMarkdown(guide.body_md ?? "");
    const tips = guide.tips ?? [];

    return (
        <div className="space-y-6">

            {/* Overview anchor target */}
            <div id="overview" />

            {/* Rendered Markdown Body */}
            {html && (
                <div id="steps">
                    <div
                        className="prose-guide"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                </div>
            )}

            {/* Tips Section */}
            {tips.length > 0 && (
                <section id="tips" className="bg-lime-50 border border-lime-200 rounded-2xl p-5">
                    <h2 className="text-sm font-extrabold uppercase tracking-widest text-lime-700 mb-4 flex items-center gap-2">
                        <span>💡</span> Pro Tips
                    </h2>
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

            {/* Bottom CTA */}
            <div className="bg-gray-900 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-lime-400 mb-1">Ready?</div>
                    <div className="text-white font-bold">
                        Start earning on {gameName}
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
