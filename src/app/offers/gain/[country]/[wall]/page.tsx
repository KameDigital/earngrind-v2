import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GainCountryOffersPage from "@/components/offers/GainCountryOffersPage";
import { normalizeGainWall, type GainGalleryWall } from "@/lib/gain-gallery";

type PageProps = {
    params: {
        country: string;
        wall: string;
    };
};

const WALL_LABELS: Record<string, string> = {
    native: "Native Gain / Torox",
    revu: "Revenue Universe",
    adtowall: "AdToWall",
    mychips: "MyChips",
    cpx: "CPX Research",
    asmwall: "ASMWall",
    lootably: "Lootably",
};

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: PageProps): Metadata {
    const countryCode = getCountryCode(params.country);
    const wall = getWall(params.wall);
    if (!countryCode || !wall) return {};
    const label = WALL_LABELS[wall] ?? wall;
    return {
        title: `${label} Gain.gg Offers in ${countryCode} | EarnGrind`,
        description: `Browse imported ${label} offers available through Gain.gg in ${countryCode}. Compare rewards, tasks, and start through Gain.gg.`,
        alternates: {
            canonical: `/offers/gain/${countryCode.toLowerCase()}/${wall}`,
        },
    };
}

export default function Page({ params }: PageProps) {
    const countryCode = getCountryCode(params.country);
    const wall = getWall(params.wall);
    if (!countryCode || !wall) notFound();
    return <GainCountryOffersPage countryCode={countryCode} wall={wall} />;
}

function getCountryCode(value: string): string | null {
    const countryCode = value.trim().toUpperCase();
    return /^[A-Z]{2}$/.test(countryCode) ? countryCode : null;
}

function getWall(value: string): GainGalleryWall | null {
    return normalizeGainWall(value);
}
