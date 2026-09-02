"use client";

import { useState } from "react";
import Link from "next/link";
import { GPT_AFFILIATE_PLATFORMS, buildTrackedPlatformHref } from "@/lib/gpt-affiliate-platforms";
import PartnerLogo from "@/components/PartnerLogo";

type PartnerConnection = { slug: string; connectedAt: string; lastSignupClickAt: string };
type PartnerSignupCardsProps = {
    connections?: PartnerConnection[];
    variant?: "account" | "homepage";
};

function dateLabel(value: string) {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export default function AccountPartnerSites({ connections = [], variant = "account" }: PartnerSignupCardsProps) {
    const isHomepage = variant === "homepage";
    const bySlug = new Map(connections.map((connection) => [connection.slug, connection]));
    const headingId = isHomepage ? "homepage-partner-signups" : "partner-sites";
    const [activeSpecKey, setActiveSpecKey] = useState<string | null>(null);

    const toggleSpec = (key: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveSpecKey((prev) => (prev === key ? null : key));
    };

    return (
        <section aria-labelledby={headingId} className={isHomepage ? "" : "account-partners"}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Partner signups</p>
                    <h2 id={headingId} className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                        {isHomepage ? "Choose your next GPT site" : "Your GPT sites"}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                        {isHomepage
                            ? "Start with a trusted reward site using an EarnGrind affiliate link, then complete signup and verification directly with that partner."
                            : "Open a partner from here to use the EarnGrind affiliate signup link. We mark the link as opened; finish signup and any verification directly with that site."}
                    </p>
                </div>
                {!isHomepage && (
                    <span className="w-fit rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-800">
                        {connections.length} links opened
                    </span>
                )}
            </div>
            <div className="flex flex-col gap-3.5">
                {GPT_AFFILIATE_PLATFORMS.map((platform) => {
                    const connection = bySlug.get(platform.slug);
                    const href = buildTrackedPlatformHref(
                        platform,
                        isHomepage ? "homepage_partner_signup" : "account_partner_signup",
                        isHomepage ? "homepage_partner_signup" : "account_partner_signup",
                    );
                    const guideHref = `/best-gpt-sites/${platform.slug}`;

                    const payoutsValue = [
                        ...(platform.payoutMethods || []),
                        ...(platform.disclosure ? [platform.disclosure] : []),
                    ].join(", ") || "Gift cards, PayPal, Crypto";

                    const specsList = [
                        { id: "payouts", label: "PAYOUTS", value: payoutsValue },
                        { id: "countries", label: "COUNTRIES", value: platform.specs.worldwide },
                        { id: "referral", label: "REFERRAL", value: platform.specs.referralProgram },
                        { id: "holdProof", label: "HOLD / PROOF", value: platform.specs.releaseWithProof },
                        { id: "kyc", label: "KYC CHECK", value: platform.specs.kycRequired },
                        { id: "bonus", label: "BONUS", value: platform.specs.signupBonus },
                        { id: "payoutSpeed", label: "PAYOUT SPEED", value: platform.specs.timeToPay },
                        { id: "minCashout", label: "MIN CASHOUT", value: platform.specs.minWithdrawal },
                    ];

                    return (
                        <article
                            key={platform.slug}
                            className="group relative flex flex-col justify-between gap-3.5 rounded border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                        >
                            {/* ── Top Row: Identity on Left, Description in Center, Action CTA on Right ── */}
                            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                {/* Left: Logo + Name + Best For */}
                                <div className="flex items-center gap-3.5 shrink-0 lg:w-[260px]">
                                    <PartnerLogo
                                        name={platform.name}
                                        slug={platform.slug}
                                        logoUrl={platform.slug === "inboxdollars" ? "/gpt-logo/inboxdollars-mascot.png" : undefined}
                                        className="h-12 w-12 shrink-0 rounded border border-slate-200 p-1.5 shadow-sm bg-white"
                                    />
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-extrabold text-slate-950 text-base transition group-hover:text-black truncate">{platform.name}</h3>
                                            {!isHomepage && connection && (
                                                <>
                                                    <span className="text-xs text-slate-400">·</span>
                                                    <span className="text-xs font-medium text-slate-600">
                                                        Opened
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5 truncate">{platform.bestFor}</p>
                                    </div>
                                </div>

                                {/* Center: Description Note */}
                                <div className="flex-1 min-w-0 pointer-events-none lg:px-4">
                                    <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                                        {platform.rewardNote}
                                    </p>
                                </div>

                                {/* Right: Guide Link & Action Button */}
                                <div className="flex shrink-0 items-center gap-3">
                                    <Link
                                        href={guideHref}
                                        className="text-xs font-bold text-slate-500 transition duration-150 hover:text-slate-950 inline-block hover:underline"
                                    >
                                        Full Review & Info →
                                    </Link>
                                    <a href={href} target="_blank" rel="noopener noreferrer sponsored nofollow" className="inline-flex w-full items-center justify-center whitespace-nowrap rounded bg-slate-950 px-5 py-2.5 text-xs font-extrabold text-white transition duration-150 hover:bg-lime-400 hover:text-black shadow-sm sm:w-auto">
                                        {connection && !isHomepage ? "Open link again →" : `${platform.cta} →`}
                                    </a>
                                </div>
                            </div>

                            {/* ── Bottom Row: All Specification & Payout Dropdown Tags ── */}
                            <div className="relative z-10 flex flex-wrap items-center gap-1.5 pt-0.5">
                                {specsList.map((spec) => {
                                    const key = `${platform.slug}-${spec.id}`;
                                    const isOpen = activeSpecKey === key;

                                    return (
                                        <div key={spec.id} className="relative">
                                            <button
                                                type="button"
                                                onClick={(e) => toggleSpec(key, e)}
                                                className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[8.5px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer focus:outline-none ${
                                                    isOpen
                                                        ? "border-slate-400 bg-white text-slate-950 shadow-sm"
                                                        : "border-slate-200 bg-slate-50/80 text-slate-800 hover:bg-white hover:border-slate-300"
                                                }`}
                                                aria-expanded={isOpen}
                                                aria-label={`Toggle ${spec.label} specification`}
                                            >
                                                <span>{spec.label}</span>
                                                <svg
                                                    className={`h-2.5 w-2.5 shrink-0 transition-transform duration-200 ${
                                                        isOpen ? "rotate-180 text-slate-900" : "text-slate-400"
                                                    }`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth="2.5"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                </svg>
                                            </button>

                                            {isOpen && (
                                                <div className="absolute top-[calc(100%+4px)] left-0 z-30 min-w-[150px] max-w-[220px] rounded border border-slate-200 bg-white p-2 shadow-lg text-left">
                                                    <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400">{spec.label}</p>
                                                    <p className="mt-0.5 text-[11px] font-normal text-slate-700 leading-tight whitespace-normal">{spec.value}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}