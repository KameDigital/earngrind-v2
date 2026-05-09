import Link from "next/link";

type RelatedGuide = {
    id: string;
    title: string;
    slug: string;
};

type GuideInternalLinksProps = {
    gameName: string;
    gameSlug: string;
    relatedGuides: RelatedGuide[];
};

export default function GuideInternalLinks({ gameName, gameSlug, relatedGuides }: GuideInternalLinksProps) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">Keep comparing</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Link
                    href={`/games/${gameSlug}`}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:border-lime-300 hover:bg-lime-50"
                >
                    <div className="text-sm font-extrabold text-gray-900">{gameName} game page</div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600">Compare live routes, payouts, and platform options.</p>
                </Link>
                <Link
                    href={`/offers/${gameSlug}`}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:border-lime-300 hover:bg-lime-50"
                >
                    <div className="text-sm font-extrabold text-gray-900">Current offer routes</div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600">Check available payout paths before starting.</p>
                </Link>
                <Link
                    href="/guides"
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:border-lime-300 hover:bg-lime-50"
                >
                    <div className="text-sm font-extrabold text-gray-900">More earning guides</div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600">Find other walkthroughs with better effort-to-reward fit.</p>
                </Link>
            </div>

            {relatedGuides.length > 0 ? (
                <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-gray-400">Related guides</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {relatedGuides.slice(0, 4).map((guide) => (
                            <Link
                                key={guide.id}
                                href={`/guides/${guide.slug}`}
                                className="rounded-xl border border-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-lime-300 hover:bg-lime-50 hover:text-lime-700"
                            >
                                {guide.title}
                            </Link>
                        ))}
                    </div>
                </div>
            ) : null}
        </section>
    );
}
