import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GemslootCountryOffersPage from "@/components/offers/GemslootCountryOffersPage";
import { GEMSLOOT_PUBLIC_COUNTRIES, getGemslootPublicCountry } from "@/lib/gemsloot-countries";
import { GEMSLOOT_PUBLIC_PROVIDERS, type GemslootProviderSlug } from "@/lib/gemsloot-providers";

type PageProps = { params: { country: string; provider: string } };
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return GEMSLOOT_PUBLIC_COUNTRIES.filter((country) => country.slug !== "us").flatMap((country) => GEMSLOOT_PUBLIC_PROVIDERS.map((provider) => ({ country: country.slug, provider: provider.slug })));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const country = getGemslootPublicCountry(params.country); const provider = getProvider(params.provider);
  if (!country || !provider) return {};
  return { title: `${provider.label} Gemsloot Offers in ${country.name}`, description: `Browse imported ${provider.label} offers available through Gemsloot in ${country.name}. Compare rewards, tasks, and start through Gemsloot.`, alternates: { canonical: `/offers/gemsloot/${country.slug}/${provider.slug}` } };
}

export default function Page({ params }: PageProps) {
  const country = getGemslootPublicCountry(params.country); const provider = getProvider(params.provider);
  if (!country || !provider) notFound();
  return <GemslootCountryOffersPage country={country} provider={provider.slug} />;
}

function getProvider(value: string): { slug: GemslootProviderSlug; label: string } | null {
  const normalized = value.trim().toLowerCase();
  return GEMSLOOT_PUBLIC_PROVIDERS.find((provider) => provider.slug === normalized) ?? null;
}