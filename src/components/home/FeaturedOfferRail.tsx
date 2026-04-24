"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

export interface FeaturedOfferRailItem {
  id: string;
  href: string;
  title: string;
  badge?: string | null;
  provider?: string | null;
  platform?: string | null;
  payout?: string | null;
  secondaryValue?: string | null;
  imageUrl?: string | null;
}

function OfferImage({
  src,
  alt,
  fallback,
}: {
  src: string | null | undefined;
  alt: string;
  fallback: string;
}) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(190,242,100,0.18),_rgba(17,24,39,0.95))] text-lg font-extrabold uppercase tracking-[0.18em] text-white/80">
        {fallback}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="(max-width: 640px) 160px, 220px"
    />
  );
}

export default function FeaturedOfferRail({
  items,
  title = "Top Offers",
  description,
}: {
  items: FeaturedOfferRailItem[];
  title?: string;
  description?: string;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);

  if (items.length === 0) return null;

  function scrollRail(direction: "left" | "right") {
    const rail = railRef.current;
    if (!rail) return;

    const offset = Math.max(rail.clientWidth * 0.8, 240);
    rail.scrollBy({
      left: direction === "left" ? -offset : offset,
      behavior: "smooth",
    });
  }

  return (
    <div className="space-y-4">
      <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight text-[var(--brand-ink)]">
            {title}
          </h3>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollRail("left")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-white text-[var(--brand-ink)] transition-colors hover:border-[var(--brand-lime)]/45 hover:bg-[var(--surface-muted)]"
            aria-label="Scroll top offers left"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollRail("right")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-white text-[var(--brand-ink)] transition-colors hover:border-[var(--brand-lime)]/45 hover:bg-[var(--surface-muted)]"
            aria-label="Scroll top offers right"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className="-mx-4 overflow-x-auto px-4 pb-2 hide-scrollbar scroll-smooth sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        <div className="flex snap-x snap-mandatory gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group flex w-[172px] flex-shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-lime)]/40 hover:shadow-[0_16px_36px_-20px_rgba(132,204,22,0.35)] sm:w-[196px] lg:w-[212px]"
            >
              <div className="relative aspect-[1.1/1] overflow-hidden border-b border-[var(--border-default)] bg-[var(--surface-muted)]">
                <OfferImage
                  src={item.imageUrl}
                  alt={item.title}
                  fallback={item.title.slice(0, 2)}
                />
                {item.badge ? (
                  <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-[rgba(15,23,15,0.78)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--brand-lime)] backdrop-blur-sm">
                    {item.badge}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col gap-2 px-3.5 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {item.provider || item.platform ? (
                      <div className="mb-1 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                        {[item.provider, item.platform].filter(Boolean).join(" • ")}
                      </div>
                    ) : null}
                    <h4 className="truncate text-sm font-extrabold leading-tight text-[var(--brand-ink)] transition-colors group-hover:text-[color:hsl(84,93%,32%)]">
                      {item.title}
                    </h4>
                  </div>
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--brand-ink)] transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>

                <div className="mt-auto">
                  {item.secondaryValue ? (
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)] line-through">
                      {item.secondaryValue}
                    </div>
                  ) : null}
                  {item.payout ? (
                    <div className="text-lg font-extrabold text-[color:hsl(84,93%,30%)]">
                      {item.payout}
                    </div>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
