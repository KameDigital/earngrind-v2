import PlatformReviewPage, { toPlatformReviewOfferRows } from "@/components/seo/PlatformReviewPage";
import { buildSeoMetadata } from "@/app/(seo)/_lib/seo-data";
import { fetchPublicOffers } from "@/lib/public-offer-search";

const canonicalPath = "/is-swagbucks-legit";
const description = "A quick EarnGrind review page for Swagbucks legitimacy, payout routes, and current comparable offers.";

export const metadata = buildSeoMetadata({
  title: "Is Swagbucks Legit?",
  description,
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
      pathname={canonicalPath}
      description={description}
      intro="Swagbucks is an established rewards platform, but each game or offer can still vary by country, device, tracking path, and approval timing. Compare current Swagbucks-related offers here, then confirm the live task requirements and redemption terms inside your account."
      offerRows={toPlatformReviewOfferRows(offers.data)}
      affiliateCta={{ label: "Compare Swagbucks offers", href: "/offers?q=Swagbucks" }}
    />
  );
}
