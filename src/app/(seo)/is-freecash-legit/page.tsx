import PlatformReviewPage, { toPlatformReviewOfferRows } from "@/components/seo/PlatformReviewPage";
import { buildSeoMetadata } from "@/app/(seo)/_lib/seo-data";
import { fetchPublicOffers } from "@/lib/public-offer-search";

const canonicalPath = "/is-freecash-legit";
const description = "A quick EarnGrind review page for Freecash legitimacy, payout routes, and current comparable offers.";

export const metadata = buildSeoMetadata({
  title: "Is Freecash Legit?",
  description,
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
      pathname={canonicalPath}
      description={description}
      intro="Freecash is a real GPT platform, but individual offer outcomes still depend on eligibility, tracking, milestone wording, and payout approval. Use EarnGrind to compare current Freecash-related routes, then verify the exact terms in your account before spending time or money."
      offerRows={toPlatformReviewOfferRows(offers.data)}
      affiliateCta={{ label: "Compare Freecash offers", href: "/offers?q=Freecash" }}
    />
  );
}
