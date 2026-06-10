"use client";

import { useMemo, useState } from "react";
import FeaturedOfferRail, { type FeaturedOfferRailItem } from "@/components/home/FeaturedOfferRail";
import type { Offer } from "@/components/offers/OfferSearchEngine";
import { formatDataRefreshedLabel } from "@/lib/payout-freshness";

type FinderDevice = "ios" | "android" | "desktop";
type FinderTime = "under-30" | "30-60" | "1-2" | "2-plus";

const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
];

const DEVICE_OPTIONS: Array<{ value: FinderDevice; label: string; offerDevices: string[] }> = [
  { value: "ios", label: "iOS", offerDevices: ["ios"] },
  { value: "android", label: "Android", offerDevices: ["android"] },
  { value: "desktop", label: "Desktop", offerDevices: ["pc", "web"] },
];

const TIME_OPTIONS: Array<{ value: FinderTime; label: string; maxPayout: number | null }> = [
  { value: "under-30", label: "Under 30 min", maxPayout: 25 },
  { value: "30-60", label: "30-60 min", maxPayout: 60 },
  { value: "1-2", label: "1-2 hrs", maxPayout: 125 },
  { value: "2-plus", label: "2+ hrs", maxPayout: null },
];

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function hasCountry(offer: Offer, country: string) {
  return offer.countries.length === 0 || offer.countries.includes(country);
}

function hasDevice(offer: Offer, device: FinderDevice) {
  const allowedDevices = DEVICE_OPTIONS.find((option) => option.value === device)?.offerDevices ?? [];
  return offer.devices.length === 0 || offer.devices.some((offerDevice) => allowedDevices.includes(offerDevice));
}

function matchesTimeWindow(offer: Offer, time: FinderTime) {
  const option = TIME_OPTIONS.find((item) => item.value === time);
  if (!option?.maxPayout) return true;
  return Number(offer.total_payout_usd ?? offer.payout_usd ?? 0) <= option.maxPayout;
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
  const [time, setTime] = useState<FinderTime>("30-60");
  const [complete, setComplete] = useState(false);

  const results = useMemo(() => {
    const filtered = offers
      .filter((offer) => hasCountry(offer, country))
      .filter((offer) => hasDevice(offer, device))
      .filter((offer) => matchesTimeWindow(offer, time))
      .sort((a, b) => Number(b.total_payout_usd ?? b.payout_usd ?? 0) - Number(a.total_payout_usd ?? a.payout_usd ?? 0));

    return filtered.slice(0, 5).map(toRailItem);
  }, [country, device, offers, time]);

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
              {COUNTRY_OPTIONS.map((option) => (
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
              {DEVICE_OPTIONS.map((option) => (
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
            <div className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">Time available per day</div>
            <div className="mt-4 grid gap-2">
              {TIME_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 rounded-none border border-[var(--border-default)] bg-white px-3 py-2 text-sm font-semibold text-[var(--brand-ink)]">
                  <input
                    type="radio"
                    name="time"
                    value={option.value}
                    checked={time === option.value}
                    onChange={() => setTime(option.value)}
                  />
                  {option.label}
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
            title="Your top 5 offers"
            description="Filtered client-side from the current EarnGrind offer data by country, device, and daily time window."
          />
        ) : (
          <div className="eg-card p-6 text-sm text-[var(--text-secondary)]">
            No offers matched those filters yet. Try a broader time window or a different device.
          </div>
        )
      ) : null}
    </div>
  );
}
