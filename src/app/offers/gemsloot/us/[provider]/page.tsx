import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GemslootCountryOffersPage from "@/components/offers/GemslootCountryOffersPage";
import {
    GEMSLOOT_PUBLIC_PROVIDERS,
    type GemslootProviderSlug,
} from "@/lib/gemsloot-providers";

type PageProps = {
    params: {
        provider: string;
    };
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
    return GEMSLOOT_PUBLIC_PROVIDERS.map((provider) => ({ provider: provider.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
    const provider = getProvider(params.provider);
    if (!provider) return {};
    return {
        title: `${provider.label} Gemsloot Offers in the United States | EarnGrind`,
        description: `Browse imported ${provider.label} offers available through Gemsloot in the United States. Compare rewards, tasks, and start through Gemsloot.`,
        alternates: {
            canonical: `/offers/gemsloot/us/${provider.slug}`,
        },
    };
}

export default function Page({ params }: PageProps) {
    const provider = getProvider(params.provider);
    if (!provider) notFound();
    return <GemslootCountryOffersPage countryCode="US" provider={provider.slug} />;
}

function getProvider(value: string): { slug: GemslootProviderSlug; label: string } | null {
    const normalized = value.trim().toLowerCase();
    return GEMSLOOT_PUBLIC_PROVIDERS.find((provider) => provider.slug === normalized) ?? null;
}
