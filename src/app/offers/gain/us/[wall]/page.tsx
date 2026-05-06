import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GainCountryOffersPage from "@/components/offers/GainCountryOffersPage";
import { GAIN_GALLERY_WALLS, normalizeGainWall, type GainGalleryWall } from "@/lib/gain-gallery";

type PageProps = {
    params: {
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

export function generateStaticParams() {
    return GAIN_GALLERY_WALLS.map((wall) => ({ wall }));
}

export function generateMetadata({ params }: PageProps): Metadata {
    const wall = getWall(params.wall);
    if (!wall) return {};
    const label = WALL_LABELS[wall] ?? wall;
    return {
        title: `${label} Gain.gg Offers in the United States | EarnGrind`,
        description: `Browse imported ${label} offers available through Gain.gg in the United States. Compare rewards, tasks, and start through Gain.gg.`,
        alternates: {
            canonical: `/offers/gain/us/${wall}`,
        },
    };
}

export default function Page({ params }: PageProps) {
    const wall = getWall(params.wall);
    if (!wall) notFound();
    return <GainCountryOffersPage countryCode="US" wall={wall} />;
}

function getWall(value: string): GainGalleryWall | null {
    return normalizeGainWall(value);
}
