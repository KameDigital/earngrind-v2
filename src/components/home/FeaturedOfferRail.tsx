"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import GamePreviewModal, { type RailPreviewData } from "@/components/home/GamePreviewModal";

export interface FeaturedOfferRailItem {
  id: string;
  href: string;
  title: string;
  badge?: string | null;
  provider?: string | null;
  platform?: string | null;
  payout?: string | null;
  dataRefreshed?: string | null;
  secondaryValue?: string | null;
  imageUrl?: string | null;
  preview?: RailPreviewData | null;
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
  const [imageFailed, setImageFailed] = useState(false);

  if (!src || imageFailed) {
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
      onError={() => setImageFailed(true)}
    />
  );
}

function RailCardContent({ item }: { item: FeaturedOfferRailItem }) {
  return (
    <>
      <div className="relative aspect-[1.22/1] overflow-hidden bg-slate-950">
        <OfferImage
          src={item.imageUrl}
          alt={item.title}
          fallback={item.title.slice(0, 2)}
        />
        {item.badge ? (
          <div className="absolute left-2 top-2 border border-lime-300/30 bg-slate-950/82 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[var(--brand-lime)] backdrop-blur-sm">
            {item.badge}
          </div>
        ) : null}
        {item.payout ? (
          <div className="absolute bottom-2 right-2 bg-[var(--brand-lime)] px-2.5 py-1 text-sm font-black text-slate-950 shadow-[0_10px_30px_rgba(156,255,36,0.28)]">
            {item.payout}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-3.5 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {item.provider || item.platform ? (
              <div className="mb-1 truncate text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                {[item.provider, item.platform].filter(Boolean).join(" / ")}
              </div>
            ) : null}
            <h4 className="line-clamp-2 text-[15px] font-black leading-tight text-slate-950 transition-colors group-hover:text-lime-700">
              {item.title}
            </h4>
            {item.dataRefreshed ? (
              <p className="mt-1 text-[10px] font-bold text-slate-400">
                {item.dataRefreshed}
              </p>
            ) : null}
          </div>
          <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-950 transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>

        <div className="mt-auto border-t border-slate-200 pt-2">
          {item.secondaryValue ? (
            <div className="line-clamp-2 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
              {item.secondaryValue}
            </div>
          ) : null}
        </div>
      </div>
    </>
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
  const [activePreview, setActivePreview] = useState<RailPreviewData | null>(null);

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

  const cardClassName = "group flex w-[196px] flex-shrink-0 snap-start flex-col overflow-hidden border border-slate-900/10 bg-white text-left shadow-[0_18px_44px_rgba(7,11,18,0.16)] transition-all duration-200 hover:-translate-y-1 hover:border-lime-300 sm:w-[220px] lg:w-[242px]";

  return (
    <div className="space-y-4">
      <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-black tracking-tight text-[var(--brand-ink)]">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 max-w-3xl text-xs font-medium leading-relaxed text-[var(--text-secondary)] sm:text-sm">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollRail("left")}
            className="inline-flex h-9 w-9 items-center justify-center border border-slate-900/10 bg-white text-[var(--brand-ink)] transition-colors hover:border-lime-300 hover:bg-lime-50"
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollRail("right")}
            className="inline-flex h-9 w-9 items-center justify-center border border-slate-900/10 bg-white text-[var(--brand-ink)] transition-colors hover:border-lime-300 hover:bg-lime-50"
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={railRef} className="-mx-4 overflow-x-auto px-4 pb-2 hide-scrollbar scroll-smooth sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex snap-x snap-mandatory gap-3">
          {items.map((item) =>
            item.preview ? (
              <button key={item.id} type="button" onClick={() => setActivePreview(item.preview ?? null)} className={cardClassName}>
                <RailCardContent item={item} />
              </button>
            ) : (
              <Link key={item.id} href={item.href} className={cardClassName}>
                <RailCardContent item={item} />
              </Link>
            ),
          )}
        </div>
      </div>

      {activePreview ? <GamePreviewModal preview={activePreview} onClose={() => setActivePreview(null)} /> : null}
    </div>
  );
}
