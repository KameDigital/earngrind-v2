import PlatformReviewPage, { toPlatformReviewOfferRows } from "@/components/seo/PlatformReviewPage";
import { buildSeoMetadata } from "@/app/(seo)/_lib/seo-data";
import { fetchPublicOffers } from "@/lib/public-offer-search";

const canonicalPath = "/best-paying-mobile-games-gpt";
const description = "Compare the best paying mobile game offers visible across current GPT site data on EarnGrind.";

export const metadata = buildSeoMetadata({
  title: "Best Paying Mobile Games on GPT Sites",
  description,
  path: canonicalPath,
  canonicalPath,
});

export default async function BestPayingMobileGamesGptPage() {
  const offers = await fetchPublicOffers({
    platformKind: "gpt_site",
    sort: "payout_desc",
    perPage: 12,
  });

  return (
    <PlatformReviewPage
      h1="Best Paying Mobile Games on GPT Sites"
      pathname={canonicalPath}
      description={description}
      intro="Use this page to compare current high-value mobile game routes across GPT platforms, then judge each offer by total payout, milestone clarity, device fit, and whether the time requirement is realistic before you start."
      offerRows={toPlatformReviewOfferRows(offers.data)}
      affiliateCta={{ label: "Compare mobile game offers", href: "/offers?platform_kind=gpt_site" }}
    />
  );
}
