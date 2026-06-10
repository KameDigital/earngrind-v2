import PlatformReviewPage, { toPlatformReviewOfferRows } from "@/components/seo/PlatformReviewPage";
import { buildSeoMetadata } from "@/app/(seo)/_lib/seo-data";
import { fetchPublicOffers } from "@/lib/public-offer-search";

const canonicalPath = "/how-long-does-freecash-take-to-pay";

export const metadata = buildSeoMetadata({
  title: "How Long Does Freecash Take to Pay? | EarnGrind",
  description: "A quick EarnGrind guide page for Freecash payout timing and current Freecash-related offers.",
  path: canonicalPath,
  canonicalPath,
});

export default async function FreecashPayoutTimingPage() {
  const offers = await fetchPublicOffers({
    q: "Freecash",
    sort: "payout_desc",
    perPage: 12,
  });

  return (
    <PlatformReviewPage
      h1="How Long Does Freecash Take to Pay?"
      intro="TODO: Add source-backed payout timing copy for Freecash, including verification holds, withdrawal methods, and why offer completion can take longer than cashout."
      offerRows={toPlatformReviewOfferRows(offers.data)}
      affiliateCta={{ label: "Compare Freecash routes", href: "/offers?q=Freecash" }}
    />
  );
}
