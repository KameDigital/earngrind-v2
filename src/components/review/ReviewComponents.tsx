"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Check, Copy, ExternalLink, Star } from "lucide-react";
import { EARNLAB_COUNTRY_NAMES } from "@/lib/earnlab-countries";

export function countryCodeToFlag(code: string): string {
    const normalized = code.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalized)) return "🌐";
    return normalized
        .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function getCountryDisplayName(code: string): string {
    const upper = code.trim().toUpperCase();
    return EARNLAB_COUNTRY_NAMES[upper] || upper;
}

// ---------------------------------------------------------------------------
// 1. FAQ Accordion
// ---------------------------------------------------------------------------
interface FaqItem {
    question: string;
    answer: string;
}

export function ReviewFaqAccordion({
    items,
    platformName,
}: {
    items: FaqItem[];
    platformName: string;
}) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggle = (idx: number) => {
        setOpenIndex((prev) => (prev === idx ? null : idx));
    };

    return (
        <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {items.map((item, idx) => {
                const isOpen = openIndex === idx;
                return (
                    <div key={idx} className="transition-colors">
                        <button
                            type="button"
                            onClick={() => toggle(idx)}
                            aria-expanded={isOpen}
                            className="flex w-full items-center justify-between gap-4 p-4 sm:p-5 text-left text-sm font-extrabold text-slate-900 transition hover:bg-slate-50 focus:outline-none"
                        >
                            <span>{item.question}</span>
                            <ChevronDown
                                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                                    isOpen ? "rotate-180 text-slate-900" : ""
                                }`}
                            />
                        </button>
                        {isOpen && (
                            <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm leading-relaxed text-slate-600">
                                <p>{item.answer}</p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ---------------------------------------------------------------------------
// 2. Country Eligibility Chips
// ---------------------------------------------------------------------------
export function ReviewCountryEligibility({ countries }: { countries: string[] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const limit = 8;
    const hasMore = countries.length > limit;
    const displayed = isExpanded ? countries : countries.slice(0, limit);

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                {displayed.map((code) => {
                    const flag = countryCodeToFlag(code);
                    const name = getCountryDisplayName(code);
                    return (
                        <span
                            key={code}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs"
                        >
                            <span className="text-base leading-none">{flag}</span>
                            <span>{name}</span>
                            <span className="text-[10px] font-bold text-slate-400">({code})</span>
                        </span>
                    );
                })}
            </div>

            {hasMore && (
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-700 underline underline-offset-4 hover:text-black cursor-pointer"
                >
                    {isExpanded ? "Show fewer countries" : `+${countries.length - limit} more supported countries`}
                </button>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// 3. Promo Code Copy Component
// ---------------------------------------------------------------------------
export function ReviewPromoCodeBox({
    code,
    label = "Exclusive Promo Code",
}: {
    code: string;
    label?: string;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="inline-flex items-center gap-3 rounded-xl border border-dashed border-lime-500 bg-lime-50/70 p-3">
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-lime-900">{label}</p>
                <p className="font-mono text-sm font-black text-slate-950">{code}</p>
            </div>
            <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-md bg-slate-950 px-3 py-1.5 text-xs font-extrabold text-white transition hover:bg-slate-800"
            >
                {copied ? (
                    <>
                        <Check className="h-3.5 w-3.5 text-lime-400" />
                        <span>Copied!</span>
                    </>
                ) : (
                    <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Code</span>
                    </>
                )}
            </button>
        </div>
    );
}

import PartnerLogo from "@/components/PartnerLogo";

// ---------------------------------------------------------------------------
// 4. Sticky Mobile CTA Bar
// ---------------------------------------------------------------------------
export function ReviewStickyMobileCta({
    platformName,
    slug,
    rating,
    logoUrl,
    affiliateUrl,
}: {
    platformName: string;
    slug?: string;
    rating: number;
    logoUrl: string;
    affiliateUrl: string;
}) {
    return (
        <div className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur-md sm:hidden">
            <div className="flex items-center gap-2.5 min-w-0">
                <PartnerLogo
                    name={platformName}
                    slug={slug}
                    logoUrl={logoUrl}
                    className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-1 shadow-2xs"
                />
                <div className="min-w-0">
                    <p className="truncate text-xs font-black text-slate-900">{platformName}</p>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                        <span>{rating.toFixed(1)} / 5.0</span>
                    </div>
                </div>
            </div>

            <a
                href={affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm transition active:scale-95"
            >
                Join {platformName} →
            </a>
        </div>
    );
}
