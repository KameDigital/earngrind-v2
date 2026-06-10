import PlatformReviewPage, { toPlatformReviewOfferRows } from "@/components/seo/PlatformReviewPage";
import { buildSeoMetadata } from "@/app/(seo)/_lib/seo-data";
import { fetchPublicOffers } from "@/lib/public-offer-search";

const canonicalPath = "/is-freecash-legit";

export const metadata = buildSeoMetadata({
  title: "Is Freecash Legit? | EarnGrind",
  description: "A quick EarnGrind review page for Freecash legitimacy, payout routes, and current comparable offers.",
  path: canonicalPath,
  canonicalPath,
});

export default async function IsFreecashLegitPage() {
  const offers = await fetchPublicOffers({
    q: "Freecash",
    sort: "payout_desc",
    perPage: 12,
  });

  return (
    <PlatformReviewPage
      h1="Is Freecash Legit?"
      intro="TODO: Add source-backed Freecash review copy covering payout reliability, offer verification, and cashout expectations for new users."
      offerRows={toPlatformReviewOfferRows(offers.data)}
      affiliateCta={{ label: "Compare Freecash offers", href: "/offers?q=Freecash" }}
    />
  );
}
