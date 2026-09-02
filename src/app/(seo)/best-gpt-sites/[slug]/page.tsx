import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
    Star,
    CheckCircle2,
    Clock,
    DollarSign,
    ShieldCheck,
    Globe2,
    Coins,
    Sparkles,
    ChevronRight,
    ExternalLink,
    Layers,
} from "lucide-react";
import {
    ReviewFaqAccordion,
    ReviewCountryEligibility,
    ReviewPromoCodeBox,
    ReviewStickyMobileCta,
    ReviewOfferwallsAccordion,
} from "@/components/review/ReviewComponents";
import {
    getPlatformReview,
    getAllPlatformReviewSlugs,
    getPlatformPreviewOffers,
    SHARED_REVIEW_FAQS,
} from "@/lib/platform-reviews-data";
import { absoluteUrl } from "@/lib/site-url";
import { buildBreadcrumbList, buildOrganization, buildReviewSchema } from "@/lib/seo-schema";
import SiteOfferPreview from "@/components/offers/SiteOfferPreview";
import PartnerLogo from "@/components/PartnerLogo";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
    return getAllPlatformReviewSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
    params,
}: {
    params: { slug: string };
}): Promise<Metadata> {
    const platform = await getPlatformReview(params.slug);
    if (!platform) {
        return {
            title: "Platform Review Not Found | EarnGrind",
            robots: { index: false, follow: false },
        };
    }

    const title = `${platform.name} Review — Payouts, Offers & Legitimacy | EarnGrind`;
    const description = `Read our verified ${platform.name} review. Compare min cashout (${platform.stats.minCashout}), payout speed (${platform.stats.payoutSpeed}), KYC rules, and top game offers.`;
    const canonical = absoluteUrl(`/best-gpt-sites/${platform.slug}`);

    return {
        title,
        description,
        alternates: {
            canonical,
        },
        openGraph: {
            title,
            description,
            url: canonical,
            type: "article",
            images: platform.logoUrl ? [{ url: platform.logoUrl, alt: `${platform.name} logo` }] : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

function formatDate(isoDate: string): string {
    try {
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(new Date(isoDate));
    } catch {
        return isoDate;
    }
}

export default async function PlatformReviewPage({
    params,
}: {
    params: { slug: string };
}) {
    const platform = await getPlatformReview(params.slug);
    if (!platform) {
        notFound();
    }

    const affiliateUrl =
        platform.affiliateLink ||
        `/go/platform/${platform.slug}?click_location=review_page&source_context=review_page&platform_name=${encodeURIComponent(platform.name)}`;

    const formattedDate = formatDate(platform.updatedAt);
    const countryCount = platform.stats.countryCount ?? platform.countries.length;
    const allFaqs = [...platform.faq, ...SHARED_REVIEW_FAQS];
    const initialOffers = await getPlatformPreviewOffers(platform.name, platform.slug);

    // Structured data
    const platformSchema = buildOrganization(platform.name, `/best-gpt-sites/${platform.slug}`, platform.logoUrl);
    const schemas = [
        buildBreadcrumbList([
            { name: "Home", path: "/" },
            { name: "Best GPT Sites", path: "/best-gpt-sites" },
            { name: `${platform.name} Review`, path: `/best-gpt-sites/${platform.slug}` },
        ]),
        platformSchema,
        buildReviewSchema({
            title: `${platform.name} Review`,
            path: `/best-gpt-sites/${platform.slug}`,
            excerpt: platform.overview,
            rating: platform.rating,
            datePublished: platform.updatedAt,
            dateModified: platform.updatedAt,
            itemReviewed: platformSchema,
        }),
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 pb-24 text-slate-900 selection:bg-lime-100 selection:text-slate-900">
            {/* JSON-LD Schemas */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
            />

            {/* Breadcrumb Bar */}
            <nav
                aria-label="Breadcrumb"
                className="border-b border-slate-200/80 bg-white/70 py-3 backdrop-blur-sm"
            >
                <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 text-xs font-semibold text-slate-500 sm:px-6">
                    <Link href="/" className="transition hover:text-slate-900">
                        Home
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href="/best-gpt-sites" className="transition hover:text-slate-900">
                        Best GPT Sites
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-extrabold text-slate-900">{platform.name} Review</span>
                </div>
            </nav>

            <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
                {/* ── Section 1: Header ── */}
                <header className="relative overflow-hidden rounded-none border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4 sm:gap-5">
                            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-none border border-slate-200 bg-white p-2 shadow-sm sm:h-24 sm:w-24">
                                <PartnerLogo
                                    name={platform.name}
                                    slug={platform.slug}
                                    logoUrl={platform.logoUrl}
                                    className="h-full w-full object-contain"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                                        {platform.name} Review
                                    </h1>
                                    <span className="inline-flex items-center rounded-none border border-lime-300 bg-lime-50 px-2.5 py-0.5 text-xs font-extrabold text-lime-900">
                                        {platform.category}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-slate-600 sm:text-base">
                                    {platform.tagline}
                                </p>
                                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <div className="flex text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-4 w-4 ${i < Math.floor(platform.rating) ? "fill-amber-400" : "fill-slate-200 text-slate-200"}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="font-extrabold text-slate-900">
                                            {platform.rating.toFixed(1)}/5
                                        </span>
                                    </div>
                                    <span>•</span>
                                    <span>Updated {formattedDate}</span>
                                    <span>•</span>
                                    <span>By EarnGrind Research</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
                            <a
                                href={affiliateUrl}
                                target="_blank"
                                rel="nofollow noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-none bg-slate-950 px-6 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
                            >
                                <span>Join {platform.name}</span>
                                <ExternalLink className="h-4 w-4" />
                            </a>
                            {platform.bonus?.signupBonus ? (
                                <div className="flex items-center justify-center gap-1.5 rounded-none bg-emerald-50 px-3 py-1.5 text-center text-xs font-bold text-emerald-800 border border-emerald-200">
                                    <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                    <span>{platform.bonus.signupBonus}</span>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </header>

                {/* ── Section 2: Key Stats Bar ── */}
                <section aria-label="Key Platform Stats" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-none border border-slate-200 bg-white p-4 shadow-xs">
                        <div className="flex items-center gap-2 text-slate-500">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Min Cashout</span>
                        </div>
                        <div className="mt-1 text-lg font-black text-slate-950 sm:text-xl">
                            {platform.stats.minCashout}
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">Fast baseline withdrawal</p>
                    </div>

                    <div className="rounded-none border border-slate-200 bg-white p-4 shadow-xs">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Payout Speed</span>
                        </div>
                        <div className="mt-1 text-lg font-black text-slate-950 sm:text-xl">
                            {platform.stats.payoutSpeed}
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">Average processing time</p>
                    </div>

                    <div className="rounded-none border border-slate-200 bg-white p-4 shadow-xs">
                        <div className="flex items-center gap-2 text-slate-500">
                            <ShieldCheck className="h-4 w-4 text-amber-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">KYC Required</span>
                        </div>
                        <div className="mt-1 text-lg font-black text-slate-950 sm:text-xl">
                            {platform.stats.kycRequired}
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">{platform.stats.kycRequired === "Yes" ? "Identity required" : platform.stats.kycRequired === "Sometimes" ? "Risk-based check" : "No ID required"}</p>
                    </div>

                    <div className="rounded-none border border-slate-200 bg-white p-4 shadow-xs">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Globe2 className="h-4 w-4 text-purple-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Countries</span>
                        </div>
                        <div className="mt-1 text-lg font-black text-slate-950 sm:text-xl">
                            {countryCount}+ Regions
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">Global availability</p>
                    </div>
                </section>

                {/* ── Section 3: Overview ── */}
                <section aria-labelledby="overview-heading" className="rounded-none border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-3">
                    <h2 id="overview-heading" className="text-xl font-black tracking-tight text-slate-950">
                        What is {platform.name}?
                    </h2>
                    <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                        {platform.overview}
                    </p>
                </section>

                {/* ── Section 4: Earning Methods ── */}
                <section aria-labelledby="earning-methods-heading" className="rounded-none border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-3">
                    <h2 id="earning-methods-heading" className="text-xl font-black tracking-tight text-slate-950">
                        Earning methods on {platform.name}
                    </h2>
                    <p className="text-xs text-slate-500">Available task categories and reward channels on this platform:</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                        {platform.earningMethods.map((method) => (
                            <span
                                key={method}
                                className="inline-flex items-center rounded-none border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-xs"
                            >
                                <Coins className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                                {method}
                            </span>
                        ))}
                    </div>
                </section>

                {/* ── Section 4b: Integrated Offerwalls & Networks ── */}
                {platform.offerwalls && platform.offerwalls.length > 0 ? (
                    <section aria-labelledby="offerwalls-heading" className="rounded-none border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 id="offerwalls-heading" className="text-xl font-black tracking-tight text-slate-950 flex items-center gap-2">
                                    <span>Integrated Offerwalls on {platform.name}</span>
                                    <span className="rounded-none bg-slate-950 px-2 py-0.5 text-[10px] font-black text-lime-400">
                                        {platform.offerwalls.length} Offerwalls
                                    </span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {platform.name} connects to these verified third-party offerwalls and direct reward networks:
                                </p>
                            </div>
                            <Link
                                href={`/offers?q=${encodeURIComponent(platform.name)}`}
                                className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-900 hover:text-lime-700"
                            >
                                <span>Browse Live {platform.name} Offers</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        <ReviewOfferwallsAccordion
                            offerwalls={platform.offerwalls}
                            platformName={platform.name}
                        />
                    </section>
                ) : null}

                {/* ── Section 5: Offer Preview Component ── */}
                <section className="rounded-none border border-slate-200 bg-white p-6 sm:p-7 shadow-sm">
                    <SiteOfferPreview platformName={platform.name} platformSlug={platform.slug} initialOffers={initialOffers} />
                </section>

                {/* ── Section 6: Payout Details / Hold & Proof / KYC ── */}
                <section aria-labelledby="payout-details-heading" className="rounded-none border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4">
                    <h2 id="payout-details-heading" className="text-xl font-black tracking-tight text-slate-950">
                        Payout details · Proof & Hold · Verification
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-none border border-slate-200 bg-slate-50/70 p-4 space-y-1.5">
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Payout Methods</p>
                            <p className="text-sm font-black text-slate-950">
                                {platform.payoutMethods.join(", ")}
                            </p>
                            <p className="text-xs text-slate-500">
                                Minimum withdrawal starts at <strong className="text-slate-900">{platform.stats.minCashout}</strong>.
                            </p>
                        </div>

                        <div className="rounded-none border border-slate-200 bg-slate-50/70 p-4 space-y-1.5">
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Hold & Fraud Policy</p>
                            <p className="text-xs leading-relaxed text-slate-700">
                                {platform.holdPeriodNote}
                            </p>
                        </div>

                        <div className="rounded-none border border-slate-200 bg-slate-50/70 p-4 space-y-1.5">
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">KYC & ID Verification</p>
                            <p className="text-xs leading-relaxed text-slate-700">
                                {platform.kycNote}
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── Section 7: Bonus & Referral Terms ── */}
                {platform.bonus ? (
                    <section aria-labelledby="bonus-heading" className="rounded-none border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-6 sm:p-7 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-emerald-600" />
                            <h2 id="bonus-heading" className="text-xl font-black tracking-tight text-slate-950">
                                Bonus & referral perks
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                {platform.bonus.signupBonus ? (
                                    <p className="text-sm font-bold text-slate-900">{platform.bonus.signupBonus}</p>
                                ) : null}
                                {platform.bonus.referralRate ? (
                                    <p className="text-xs font-semibold text-emerald-800">
                                        Referral commission: {platform.bonus.referralRate}
                                    </p>
                                ) : null}
                            </div>
                            {platform.bonus.promoCode ? (
                                <ReviewPromoCodeBox code={platform.bonus.promoCode} />
                            ) : null}
                        </div>
                    </section>
                ) : null}

                {/* ── Section 8: Country Eligibility ── */}
                <section aria-labelledby="countries-heading" className="rounded-none border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-3">
                    <h2 id="countries-heading" className="text-xl font-black tracking-tight text-slate-950">
                        Country eligibility & coverage
                    </h2>
                    <p className="text-xs text-slate-500">
                        {platform.name} supports users in over {countryCount} countries. Top supported regions:
                    </p>
                    <ReviewCountryEligibility countries={platform.countries} />
                </section>

                {/* ── Section 9: Pros & Cons ── */}
                <section aria-labelledby="pros-cons-heading" className="rounded-none border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4">
                    <h2 id="pros-cons-heading" className="text-xl font-black tracking-tight text-slate-950">
                        Pros & cons of {platform.name}
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-none border border-emerald-200 bg-emerald-50/40 p-5 space-y-3">
                            <p className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                What we like
                            </p>
                            <ul className="space-y-2 text-xs text-slate-700">
                                {platform.pros.map((pro, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-emerald-600 font-bold">✓</span>
                                        <span>{pro}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-none border border-rose-200 bg-rose-50/40 p-5 space-y-3">
                            <p className="text-xs font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                                <span className="flex h-4 w-4 items-center justify-center rounded-none bg-rose-200 text-[10px] font-black text-rose-800">✕</span>
                                Drawbacks & watchouts
                            </p>
                            <ul className="space-y-2 text-xs text-slate-700">
                                {platform.cons.map((con, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-rose-500 font-bold">✕</span>
                                        <span>{con}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ── Section 10: 4-Step Signup Guide ── */}
                <section aria-labelledby="signup-guide-heading" className="rounded-none border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4">
                    <h2 id="signup-guide-heading" className="text-xl font-black tracking-tight text-slate-950">
                        How to get started on {platform.name} in 4 steps
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {platform.signupSteps.map((step, idx) => (
                            <div
                                key={idx}
                                className="relative rounded-none border border-slate-200 bg-slate-50/60 p-4 space-y-2"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-none bg-slate-950 text-xs font-black text-white">
                                        {idx + 1}
                                    </span>
                                    <h3 className="text-xs font-extrabold text-slate-950">{step.title}</h3>
                                </div>
                                <p className="text-[11px] leading-relaxed text-slate-600">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Section 11: FAQ Accordion ── */}
                <section aria-labelledby="faq-heading" className="rounded-none border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4">
                    <h2 id="faq-heading" className="text-xl font-black tracking-tight text-slate-950">
                        Frequently asked questions about {platform.name}
                    </h2>
                    <ReviewFaqAccordion items={allFaqs} platformName={platform.name} />
                </section>

                {/* ── Section 12: Final CTA Banner ── */}
                <section className="relative overflow-hidden rounded-none border border-slate-950 bg-slate-950 p-8 text-center text-white shadow-xl sm:p-10">
                    <div className="relative z-10 mx-auto max-w-xl space-y-4">
                        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                            Ready to start earning on {platform.name}?
                        </h2>
                        <p className="text-sm text-slate-300">
                            Join verified users tracking high-yield game offers and fast rewards with zero hidden withdrawal fees.
                        </p>
                        <div className="pt-2">
                            <a
                                href={affiliateUrl}
                                target="_blank"
                                rel="nofollow noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-none bg-[var(--brand-lime,#a3e635)] px-8 py-3.5 text-sm font-black text-slate-950 shadow-md transition hover:bg-lime-400 active:scale-95"
                            >
                                <span>Join {platform.name} Now</span>
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            {/* ── Section 13: Mobile Sticky CTA ── */}
            <ReviewStickyMobileCta
                platformName={platform.name}
                slug={platform.slug}
                logoUrl={platform.logoUrl}
                affiliateUrl={affiliateUrl}
                rating={platform.rating}
            />
        </div>
    );
}
