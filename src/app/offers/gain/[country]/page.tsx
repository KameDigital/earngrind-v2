import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GainCountryOffersPage from "@/components/offers/GainCountryOffersPage";

type PageProps = {
    params: {
        country: string;
    };
};

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: PageProps): Metadata {
    const countryCode = getCountryCode(params.country);
    if (!countryCode) return {};
    return {
        title: `Best Gain.gg Offers in ${countryCode} | EarnGrind`,
        description: `Browse imported Gain.gg offers available in ${countryCode}. Compare rewards, providers, tasks, and start through Gain.gg.`,
        alternates: {
            canonical: `/offers/gain/${countryCode.toLowerCase()}`,
        },
    };
}

export default function Page({ params }: PageProps) {
    const countryCode = getCountryCode(params.country);
    if (!countryCode) notFound();
    return <GainCountryOffersPage countryCode={countryCode} />;
}

function getCountryCode(value: string): string | null {
    const countryCode = value.trim().toUpperCase();
    return /^[A-Z]{2}$/.test(countryCode) ? countryCode : null;
}
