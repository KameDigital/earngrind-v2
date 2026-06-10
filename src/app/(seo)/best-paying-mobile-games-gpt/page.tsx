import PlatformReviewPage, { toPlatformReviewOfferRows } from "@/components/seo/PlatformReviewPage";
import { buildSeoMetadata } from "@/app/(seo)/_lib/seo-data";
import { fetchPublicOffers } from "@/lib/public-offer-search";

const canonicalPath = "/best-paying-mobile-games-gpt";

export const metadata = buildSeoMetadata({
  title: "Best Paying Mobile Games on GPT Sites | EarnGrind",
  description: "Compare the best paying mobile game offers visible across current GPT site data on EarnGrind.",
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
      intro="TODO: Replace this placeholder with a researched roundup explaining which mobile game offer types tend to pay best and how users should compare time requirements."
      offerRows={toPlatformReviewOfferRows(offers.data)}
      affiliateCta={{ label: "Compare mobile game offers", href: "/offers?platform_kind=gpt_site" }}
    />
  );
}
