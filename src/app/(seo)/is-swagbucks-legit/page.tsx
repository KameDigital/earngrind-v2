import PlatformReviewPage, { toPlatformReviewOfferRows } from "@/components/seo/PlatformReviewPage";
import { buildSeoMetadata } from "@/app/(seo)/_lib/seo-data";
import { fetchPublicOffers } from "@/lib/public-offer-search";

const canonicalPath = "/is-swagbucks-legit";

export const metadata = buildSeoMetadata({
  title: "Is Swagbucks Legit? | EarnGrind",
  description: "A quick EarnGrind review page for Swagbucks legitimacy, payout routes, and current comparable offers.",
  path: canonicalPath,
  canonicalPath,
});

export default async function IsSwagbucksLegitPage() {
  const offers = await fetchPublicOffers({
    q: "Swagbucks",
    sort: "payout_desc",
    perPage: 12,
  });

  return (
    <PlatformReviewPage
      h1="Is Swagbucks Legit?"
      intro="TODO: Add source-backed Swagbucks review copy covering payout reliability, redemption options, and what beginners should verify before starting."
      offerRows={toPlatformReviewOfferRows(offers.data)}
      affiliateCta={{ label: "Compare Swagbucks offers", href: "/offers?q=Swagbucks" }}
    />
  );
}
