import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GemslootCountryOffersPage from "@/components/offers/GemslootCountryOffersPage";
import { GEMSLOOT_PUBLIC_COUNTRIES, getGemslootPublicCountry } from "@/lib/gemsloot-countries";

type PageProps = { params: { country: string } };
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return GEMSLOOT_PUBLIC_COUNTRIES.filter((country) => country.slug !== "us").map((country) => ({ country: country.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const country = getGemslootPublicCountry(params.country);
  if (!country) return {};
  return { title: `Best Gemsloot Offers in ${country.name} | EarnGrind`, description: `Browse imported Gemsloot offers available in ${country.name}. Compare rewards, providers, tasks, and start through Gemsloot.`, alternates: { canonical: `/offers/gemsloot/${country.slug}` } };
}

export default function Page({ params }: PageProps) {
  const country = getGemslootPublicCountry(params.country);
  if (!country) notFound();
  return <GemslootCountryOffersPage country={country} />;
}