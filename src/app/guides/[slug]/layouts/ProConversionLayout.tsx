import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Gauge, ShieldCheck, Trophy } from "lucide-react";
import { extractPreamble, extractSections, renderMarkdown } from "../markdownRenderer";
import ProChecklist from "../ProChecklist";
import type { GuideOfferMatch } from "@/lib/guide-offer-matcher";

interface ProConversionLayoutProps {
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
    guideId: string;
    guideSlug: string;
    gameSlug: string;
    gameName: string;
    offers: GuideOfferMatch[];
    showStaticCta?: boolean;
}

function cleanLines(value: string | null | undefined) {
    return (value ?? "")
        .split("\n")
        .map((line) => line.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean);
}

function formatMoney(value: number | null | undefined) {
    return typeof value === "number" && Number.isFinite(value) ? `$${value.toFixed(2)}` : "Payout varies";
}

function offerTarget(offer: GuideOfferMatch | null, gameSlug: string) {
    return offer?.targetUrl ?? `/offers/${gameSlug}`;
}

function offerButtonText(offer: GuideOfferMatch | null, gameName: string) {
    if (offer?.ctaLabel) return offer.ctaLabel;
    return `Compare ${gameName} offers`;
}

export default function ProConversionLayout({
    guide,
    guideId,
    guideSlug,
    gameSlug,
    gameName,
    offers,
    showStaticCta = true,
}: ProConversionLayoutProps) {
    const sections = extractSections(guide.body_md ?? "");
    const faqSections = sections.filter((section) => /faq|frequently asked questions/i.test(section.heading));
    const routeSections = sections.filter((section) => !/faq|frequently asked questions/i.test(section.heading));
    const preamble = extractPreamble(guide.body_md ?? "");
    const takeaways = cleanLines(guide.key_takeaways);
    const checklist = guide.checklist_items ?? [];
    const tips = guide.tips ?? [];
    const bestOffer = offers[0] ?? null;
    const alternativeOffers = offers.slice(1, 4);
    const primaryActions = checklist.length > 0 ? checklist.slice(0, 4) : takeaways.slice(0, 4);
    const primaryHref = offerTarget(bestOffer, gameSlug);
    const showGuideVideo = Boolean(guide.video_url);

    return (
        <div className="space-y-6">
            <div id="overview" />

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="p-5 sm:p-6">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-lime-700 ring-1 ring-lime-200">
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            Pro route plan
                        </div>
                        <h2 className="max-w-2xl text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">
                            Pick the best live route, verify the terms, then follow the checklist before the long grind.
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                            Confirm the current payout, screenshot the live terms, and use the checklist before spending time on the longest milestones.
                        </p>

                        {takeaways.length > 0 ? (
                            <div className="mt-5 rounded-2xl border border-gray-900 bg-gray-950 p-4 text-white">
                                <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-lime-300">
                                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                    Key takeaways
                                </div>
                                <ul className="grid gap-2 sm:grid-cols-2">
                                    {takeaways.slice(0, 4).map((takeaway, index) => (
                                        <li key={`${takeaway}-${index}`} className="flex gap-2 text-sm leading-6 text-gray-100">
                                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-lime-300" />
                                            <span>{takeaway}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        {primaryActions.length > 0 ? (
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                {primaryActions.map((item, index) => (
                                    <div key={`${item}-${index}`} className="rounded-xl border border-lime-200 bg-lime-50 px-4 py-3">
                                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-lime-700">
                                            Action {index + 1}
                                        </div>
                                        <div className="mt-1 text-sm font-bold leading-5 text-gray-950">{item}</div>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <aside className="border-t border-gray-200 bg-gray-950 p-5 text-white lg:border-l lg:border-t-0">
                        <div className="text-xs font-extrabold uppercase tracking-widest text-lime-300">Best route metrics</div>
                        <div className="mt-4 space-y-3">
                            <div className="rounded-2xl border border-lime-300/30 bg-lime-300 px-4 py-3 text-gray-950">
                                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-gray-800">
                                    <Trophy className="h-4 w-4" aria-hidden="true" />
                                    Current payout
                                </div>
                                <div className="mt-1 text-3xl font-black">
                                    {formatMoney(bestOffer?.payout ?? guide.max_payout_usd)}
                                </div>
                                <div className="mt-1 text-xs font-bold text-gray-800">
                                    {bestOffer?.platform ?? bestOffer?.provider ?? "Compare live offer routes"}
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                {guide.difficulty ? (
                                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                                            <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
                                            Difficulty
                                        </div>
                                        <div className="mt-1 font-extrabold capitalize">{guide.difficulty}</div>
                                    </div>
                                ) : null}
                                {guide.estimated_time ? (
                                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                                            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                                            Time
                                        </div>
                                        <div className="mt-1 font-extrabold">{guide.estimated_time}</div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {showStaticCta ? (
                            <Link
                                href={primaryHref}
                                data-guide-cta="true"
                                data-cta-variant="pro_conversion_primary"
                                data-cta-placement="hero"
                                data-offer-id={bestOffer?.id ?? ""}
                                data-platform-id={bestOffer?.platformId ?? ""}
                                data-match-reason={bestOffer?.matchReason ?? "No matched offer"}
                                data-guide-id={guideId}
                                data-guide-slug={guideSlug}
                                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 py-3 text-sm font-extrabold text-gray-950 shadow-sm transition hover:bg-lime-200"
                            >
                                {offerButtonText(bestOffer, gameName)}
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        ) : null}

                        {alternativeOffers.length > 0 ? (
                            <div className="mt-4 border-t border-white/10 pt-4">
                                <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-gray-400">Other routes</div>
                                <div className="space-y-2">
                                    {alternativeOffers.map((offer) => (
                                        <Link
                                            key={offer.id}
                                            href={offerTarget(offer, gameSlug)}
                                            data-guide-cta="true"
                                            data-cta-variant="pro_conversion_alternative"
                                            data-cta-placement="other_routes"
                                            data-offer-id={offer.id}
                                            data-platform-id={offer.platformId ?? ""}
                                            data-match-reason={offer.matchReason}
                                            data-guide-id={guideId}
                                            data-guide-slug={guideSlug}
                                            className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:border-lime-300/60"
                                        >
                                            <div className="truncate font-bold text-white">{offer.platform ?? offer.provider ?? "Offer route"}</div>
                                            <div className="mt-0.5 text-xs font-semibold text-lime-300">{formatMoney(offer.payout)}</div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </aside>
                </div>
            </section>

            {showGuideVideo ? (
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-lg font-extrabold text-gray-950">Watch first: {gameName} walkthrough</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                        Use this overview before starting the route. Then confirm the written tasks and live platform terms.
                    </p>
                    <div className="guide-video mt-4">
                        <video
                            controls
                            preload="metadata"
                            className="w-full rounded-xl border border-gray-200 bg-gray-950"
                            title={`${gameName} guide video walkthrough`}
                        >
                            <source src={guide.video_url ?? ""} type="video/mp4" />
                        </video>
                    </div>
                    {guide.video_summary ? (
                        <div className="mt-4 rounded-xl border border-lime-200 bg-lime-50 p-4">
                            <div className="text-sm font-extrabold text-gray-950">Video summary</div>
                            <p className="mt-1 text-sm leading-6 text-gray-700">{guide.video_summary}</p>
                        </div>
                    ) : null}
                    {guide.video_transcript ? (
                        <details className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <summary className="cursor-pointer text-sm font-extrabold text-gray-950">Video transcript</summary>
                            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-700">{guide.video_transcript}</p>
                        </details>
                    ) : null}
                </section>
            ) : null}

            {checklist.length > 0 ? <ProChecklist items={checklist} /> : null}

            {preamble ? (
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-3 text-xs font-extrabold uppercase tracking-widest text-gray-400">Overview</div>
                    <div
                        className="prose prose-slate max-w-none prose-img:my-6 prose-img:max-w-full prose-img:rounded-xl prose-table:border prose-th:border prose-th:bg-gray-100 prose-td:border"
                        dangerouslySetInnerHTML={{ __html: preamble }}
                    />
                </section>
            ) : null}

            <section id="steps" className="space-y-4">
                {routeSections.length > 0 ? (
                    routeSections.map((section, index) => (
                        <article
                            key={`${section.id}-${index}`}
                            id={section.id}
                            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                        >
                            <div className="grid gap-0 md:grid-cols-[96px_1fr]">
                                <div className="flex items-center gap-3 border-b border-gray-100 bg-lime-50 px-5 py-4 md:flex-col md:items-start md:border-b-0 md:border-r">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-950 text-sm font-black text-lime-300">
                                        {index + 1}
                                    </span>
                                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-lime-700">
                                        Route step
                                    </span>
                                </div>
                                <div className="p-5">
                                    <h2 className="text-xl font-extrabold leading-snug text-gray-950">{section.heading}</h2>
                                    {section.body ? (
                                        <div
                                            className="prose prose-slate mt-3 max-w-none prose-img:my-6 prose-img:max-w-full prose-img:rounded-xl prose-table:border prose-th:border prose-th:bg-gray-100 prose-td:border"
                                            dangerouslySetInnerHTML={{ __html: section.body }}
                                        />
                                    ) : null}
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

            {faqSections.map((section) => (
                <section
                    key={section.id}
                    id={section.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
                >
                    <h2 className="text-xl font-extrabold leading-snug text-gray-950">{section.heading}</h2>
                    {section.body ? (
                        <div
                            className="prose prose-slate mt-3 max-w-none prose-img:my-6 prose-img:max-w-full prose-img:rounded-xl prose-table:border prose-th:border prose-th:bg-gray-100 prose-td:border"
                            dangerouslySetInnerHTML={{ __html: section.body }}
                        />
                    ) : null}
                </section>
            ))}

            {tips.length > 0 ? (
                <section id="tips" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-4 text-xs font-extrabold uppercase tracking-widest text-gray-400">Pro tips</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {tips.map((tip, index) => (
                            <div key={`${tip}-${index}`} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                <div className="text-[11px] font-extrabold uppercase tracking-wider text-lime-700">Tip {index + 1}</div>
                                <p className="mt-1 text-sm leading-6 text-gray-700">{tip}</p>
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            {showStaticCta ? (
                <section className="rounded-2xl bg-gray-950 p-6 text-white shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-widest text-lime-300">Final check</div>
                            <div className="mt-1 text-lg font-extrabold">
                                Verify the live {gameName} payout route before installing or spending.
                            </div>
                        </div>
                        <Link
                            href={primaryHref}
                            data-guide-cta="true"
                            data-cta-variant="pro_conversion_final"
                            data-cta-placement="bottom"
                            data-offer-id={bestOffer?.id ?? ""}
                            data-platform-id={bestOffer?.platformId ?? ""}
                            data-match-reason={bestOffer?.matchReason ?? "No matched offer"}
                            data-guide-id={guideId}
                            data-guide-slug={guideSlug}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-extrabold text-gray-950 transition hover:bg-lime-200"
                        >
                            {offerButtonText(bestOffer, gameName)}
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </div>
                </section>
            ) : null}
        </div>
    );
}
