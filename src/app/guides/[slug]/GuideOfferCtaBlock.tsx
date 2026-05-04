import Link from "next/link";
import { selectGuideCtaVariant, type GuideCtaPlacement } from "@/lib/guide-cta-variants";
import type { GuideOfferMatch } from "@/lib/guide-offer-matcher";

function formatMoney(value: number | null) {
    return typeof value === "number" && Number.isFinite(value) ? `$${value.toFixed(2)}` : "Payout varies";
}

function placementLabel(placement: GuideOfferCtaBlockProps["placement"]) {
    if (placement === "top") return "Best route for this guide";
    if (placement === "mid") return "Compare before continuing";
    if (placement === "bottom") return "Ready to start";
    return "Compare latest payouts";
}

type GuideOfferCtaBlockProps = {
    guideId: string;
    guideSlug: string;
    offers: GuideOfferMatch[];
    placement: GuideCtaPlacement;
};

export default function GuideOfferCtaBlock({
    guideId,
    guideSlug,
    offers,
    placement,
}: GuideOfferCtaBlockProps) {
    const variant = selectGuideCtaVariant({ guideId, slug: guideSlug, placement });
    const best = offers[0] ?? null;
    const alternatives = offers.slice(1, 4);

    if (!best) {
        return (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">{placementLabel("fallback")}</div>
                <div className="mt-2 text-lg font-extrabold text-gray-900">Compare latest payouts before starting</div>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    No direct offer match is available for this guide right now. Check the live offer list before committing time.
                </p>
                <p className="mt-2 text-xs font-semibold text-gray-500">{variant.subtext}</p>
                <Link
                    href="/offers"
                    data-guide-cta="true"
                    data-cta-variant="guide_offer_matcher_fallback"
                    data-cta-variant-id={variant.id}
                    data-cta-variant-label={variant.label}
                    data-cta-placement={placement}
                    data-offer-id=""
                    data-platform-id=""
                    data-match-reason="No matched offer"
                    data-placement={placement}
                    className="mt-4 inline-flex rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-gray-800"
                >
                    {variant.buttonText}
                </Link>
            </section>
        );
    }

    return (
        <section className="rounded-2xl border border-lime-200 bg-lime-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="text-[11px] font-extrabold uppercase tracking-widest text-lime-700">{placementLabel(placement)}</div>
                    <h2 className="mt-2 text-xl font-extrabold tracking-tight text-gray-950">{best.title}</h2>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                        <span className="rounded-full bg-white px-2.5 py-1 text-lime-800 ring-1 ring-lime-200">{best.matchReason}</span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-gray-700 ring-1 ring-gray-200">{formatMoney(best.payout)}</span>
                        {best.platform ? <span className="rounded-full bg-white px-2.5 py-1 text-gray-700 ring-1 ring-gray-200">{best.platform}</span> : null}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-gray-700">
                        This route is selected from the current offer feed. Verify live requirements and device/country fit on the platform before starting.
                    </p>
                    <p className="mt-2 text-xs font-semibold text-lime-800">{variant.subtext}</p>
                </div>
                <a
                    href={best.targetUrl}
                    data-guide-cta="true"
                    data-cta-variant="guide_offer_matcher_primary"
                    data-cta-variant-id={variant.id}
                    data-cta-variant-label={variant.label}
                    data-cta-placement={placement}
                    data-offer-id={best.id}
                    data-platform-id={best.platformId ?? ""}
                    data-match-reason={best.matchReason}
                    data-placement={placement}
                    data-guide-id={guideId}
                    data-guide-slug={guideSlug}
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-extrabold text-lime-300 shadow-sm hover:bg-gray-800"
                >
                    {variant.buttonText}
                </a>
            </div>

            {alternatives.length > 0 ? (
                <div className="mt-4 border-t border-lime-200 pt-4">
                    <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-lime-700">Other available routes</div>
                    <div className="grid gap-2 sm:grid-cols-3">
                        {alternatives.map((offer) => (
                            <a
                                key={`${placement}-${offer.id}`}
                                href={offer.targetUrl}
                                data-guide-cta="true"
                                data-cta-variant="guide_offer_matcher_alternative"
                                data-cta-variant-id={variant.id}
                                data-cta-variant-label={variant.label}
                                data-cta-placement={placement}
                                data-offer-id={offer.id}
                                data-platform-id={offer.platformId ?? ""}
                                data-match-reason={offer.matchReason}
                                data-placement={placement}
                                data-guide-id={guideId}
                                data-guide-slug={guideSlug}
                                className="rounded-xl border border-lime-200 bg-white px-3 py-2 text-sm hover:border-lime-400"
                            >
                                <div className="truncate font-bold text-gray-900">{offer.platform ?? offer.provider ?? "Offer route"}</div>
                                <div className="mt-0.5 text-xs font-semibold text-lime-700">{formatMoney(offer.payout)}</div>
                            </a>
                        ))}
                    </div>
                </div>
            ) : null}
        </section>
    );
}
