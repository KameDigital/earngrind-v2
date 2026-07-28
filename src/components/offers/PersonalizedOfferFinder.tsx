"use client";

import { useMemo, useState } from "react";
import FeaturedOfferRail, { type FeaturedOfferRailItem } from "@/components/home/FeaturedOfferRail";
import type { Offer } from "@/components/offers/OfferSearchEngine";
import {
  FINDER_COUNTRY_OPTIONS,
  FINDER_DEVICE_OPTIONS,
  FINDER_OFFER_TYPE_OPTIONS,
  type FinderDevice,
  type FinderOfferType,
  getPersonalizedOfferResults,
} from "@/lib/personalized-offer-finder";
import { formatDataRefreshedLabel } from "@/lib/payout-freshness";

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function toRailItem(offer: Offer): FeaturedOfferRailItem {
  const gameName = offer.game?.name ?? offer.title;
  const gameSlug = offer.game?.slug;
  return {
    id: offer.id,
    href: gameSlug ? `/offers/${gameSlug}` : offer.redirect_url ?? "/offers",
    title: gameName,
    badge: offer.is_hot ? "Hot" : offer.is_new ? "New" : null,
    provider: offer.provider_name ?? offer.platform?.name ?? null,
    platform: offer.platform?.name ?? null,
    payout: formatMoney(Number(offer.total_payout_usd ?? offer.payout_usd ?? 0)),
    dataRefreshed: formatDataRefreshedLabel(offer.updated_at),
    secondaryValue: offer.goal_text ?? offer.title,
    imageUrl: offer.image_url ?? offer.game?.thumbnail_url ?? null,
  };
}

export default function PersonalizedOfferFinder({ offers }: { offers: Offer[] }) {
  const [country, setCountry] = useState("US");
  const [device, setDevice] = useState<FinderDevice>("ios");
  const [offerType, setOfferType] = useState<FinderOfferType>("most-completed");
  const [complete, setComplete] = useState(false);

  const results = useMemo(() => {
    return getPersonalizedOfferResults(offers, {
      country,
      device,
      offerType,
      limit: 5,
    }).map(toRailItem);
  }, [country, device, offerType, offers]);

  return (
    <div className="space-y-8">
      <section className="eg-card p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-3">
          <label className="block">
            <span className="section-label">Step 1</span>
            <span className="mt-2 block text-lg font-extrabold text-[var(--brand-ink)]">country selector</span>
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="mt-4 w-full rounded-none border border-[var(--border-default)] bg-white px-3 py-3 text-sm font-semibold text-[var(--brand-ink)]"
            >
              {FINDER_COUNTRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <div className="section-label">Step 2</div>
            <div className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">Device type</div>
            <div className="mt-4 grid gap-2">
              {FINDER_DEVICE_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 rounded-none border border-[var(--border-default)] bg-white px-3 py-2 text-sm font-semibold text-[var(--brand-ink)]">
                  <input
                    type="radio"
                    name="device"
                    value={option.value}
                    checked={device === option.value}
                    onChange={() => setDevice(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="section-label">Step 3</div>
            <div className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">Offer type</div>
            <div className="mt-4 grid gap-2">
              {FINDER_OFFER_TYPE_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 rounded-none border border-[var(--border-default)] bg-white px-3 py-2 text-sm font-semibold text-[var(--brand-ink)]">
                  <input
                    type="radio"
                    name="offerType"
                    value={option.value}
                    checked={offerType === option.value}
                    onChange={() => setOfferType(option.value)}
                  />
                  <span>
                    <span className="block">{option.label}</span>
                    <span className="block text-xs font-medium leading-5 text-[var(--text-tertiary)]">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setComplete(true)}
          className="mt-6 inline-flex items-center justify-center rounded-none bg-[var(--brand-ink)] px-5 py-3 text-sm font-extrabold text-[var(--brand-lime)] transition-all hover:-translate-y-px hover:bg-[var(--brand-ink)]/95"
        >
          Show my offers
        </button>
      </section>

      {complete ? (
        results.length > 0 ? (
          <FeaturedOfferRail
            items={results}
            title={`Your top ${results.length} offer${results.length === 1 ? "" : "s"}`}
            description="Ranked from the current EarnGrind offer data by country, device, offer type, payout, and freshness."
          />
        ) : (
          <div className="eg-card p-6 text-sm text-[var(--text-secondary)]">
            No offers matched those filters yet. Try a broader offer type or a different device.
          </div>
        )
      ) : null}
    </div>
  );
}
