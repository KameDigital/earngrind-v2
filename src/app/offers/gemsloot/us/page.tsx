import type { Metadata } from "next";
import GemslootCountryOffersPage from "@/components/offers/GemslootCountryOffersPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Best Gemsloot Offers in the United States | EarnGrind",
    description: "Browse imported Gemsloot offers available in the United States. Compare rewards, providers, tasks, and start through Gemsloot.",
    alternates: {
        canonical: "/offers/gemsloot/us",
    },
};

export default function Page() {
    return <GemslootCountryOffersPage countryCode="US" />;
}
