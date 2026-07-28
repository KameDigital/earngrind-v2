import PlatformReviewPage, { toPlatformReviewOfferRows } from "@/components/seo/PlatformReviewPage";
import { buildSeoMetadata } from "@/app/(seo)/_lib/seo-data";
import { fetchPublicOffers } from "@/lib/public-offer-search";

const canonicalPath = "/how-long-does-freecash-take-to-pay";
const description = "A quick EarnGrind guide page for Freecash payout timing and current Freecash-related offers.";

export const metadata = buildSeoMetadata({
  title: "How Long Does Freecash Take to Pay?",
  description,
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
      pathname={canonicalPath}
      description={description}
      intro="Freecash payout timing depends on two separate steps: the offer must first track or approve, and then the account cashout must clear through the available reward method. Compare related routes here, screenshot the terms before starting, and treat pending or verification windows as part of the real timeline."
      offerRows={toPlatformReviewOfferRows(offers.data)}
      affiliateCta={{ label: "Compare Freecash routes", href: "/offers?q=Freecash" }}
    />
  );
}
