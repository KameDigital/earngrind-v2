import type { Metadata } from "next";
import GainCountryOffersPage from "@/components/offers/GainCountryOffersPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Best Gain.gg Offers in the United States | EarnGrind",
    description: "Browse imported Gain.gg offers available in the United States. Compare rewards, providers, tasks, and start through Gain.gg.",
    alternates: {
        canonical: "/offers/gain/us",
    },
};

export default function Page() {
    return <GainCountryOffersPage countryCode="US" />;
}
