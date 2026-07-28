import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const layout = read("src/app/layout.tsx");
const findOffersPage = read("src/app/find-offers/page.tsx");
const guidesPage = read("src/app/guides/page.tsx");
const offersPage = read("src/app/offers/page.tsx");
const blogPage = read("src/app/blog/page.tsx");
const legalPrivacyPage = read("src/app/legal/privacy/page.tsx");
const legalTermsPage = read("src/app/legal/terms/page.tsx");
const legalDisclosurePage = read("src/app/legal/disclosure/page.tsx");
const earnlabCountryOfferPage = read("src/app/offers/[slug]/page.tsx");
const gainCountryOfferPage = read("src/app/offers/gain/[country]/page.tsx");
const gainCountryWallOfferPage = read("src/app/offers/gain/[country]/[wall]/page.tsx");
const gainUsOfferPage = read("src/app/offers/gain/us/page.tsx");
const gainUsWallOfferPage = read("src/app/offers/gain/us/[wall]/page.tsx");
const gemslootCountryOfferPage = read("src/app/offers/gemsloot/[country]/page.tsx");
const gemslootCountryProviderOfferPage = read("src/app/offers/gemsloot/[country]/[provider]/page.tsx");
const howToEarnPage = read("src/app/(seo)/guides/how-to-earn/page.tsx");
const howToEarnSlugPage = read("src/app/(seo)/guides/how-to-earn/[slug]/page.tsx");
const bestPayingMobileGamesPage = read("src/app/(seo)/best-paying-mobile-games-gpt/page.tsx");
const freecashLegitPage = read("src/app/(seo)/is-freecash-legit/page.tsx");
const swagbucksLegitPage = read("src/app/(seo)/is-swagbucks-legit/page.tsx");
const freecashPayoutTimePage = read("src/app/(seo)/how-long-does-freecash-take-to-pay/page.tsx");
const gamePage = read("src/app/(seo)/games/[slug]/page.tsx");
const faqSection = read("src/app/(seo)/components/FAQSection.tsx");
const platformReviewPage = read("src/components/seo/PlatformReviewPage.tsx");
const seoSchema = read("src/lib/seo-schema.tsx");
const seoMetadata = read("src/app/(seo)/_lib/seo-data.ts");
const publicSeoCoverageAudit = read("scripts/audit-public-seo-coverage.mjs");

assert(!/\bkeywords\s*:/.test(layout), "Root metadata should not emit meta keywords.");
assert(!/Game Guides[^"]*\|\s*EarnGrind/.test(guidesPage), "Guide hub title should not include branding that duplicates the root title template.");
for (const [label, source] of [
  ["find offers page", findOffersPage],
  ["offers page", offersPage],
  ["blog page", blogPage],
  ["legal privacy page", legalPrivacyPage],
  ["legal terms page", legalTermsPage],
  ["legal disclosure page", legalDisclosurePage],
  ["EarnLab country offer page", earnlabCountryOfferPage],
  ["Gain country offer page", gainCountryOfferPage],
  ["Gain country wall offer page", gainCountryWallOfferPage],
  ["Gain US offer page", gainUsOfferPage],
  ["Gain US wall offer page", gainUsWallOfferPage],
  ["Gemsloot country offer page", gemslootCountryOfferPage],
  ["Gemsloot country provider offer page", gemslootCountryProviderOfferPage],
  ["best paying mobile games page", bestPayingMobileGamesPage],
  ["Freecash legit page", freecashLegitPage],
  ["Swagbucks legit page", swagbucksLegitPage],
  ["Freecash payout timing page", freecashPayoutTimePage],
]) {
  assert(!/title:\s*["'`][^"'`]*\|\s*EarnGrind/.test(source), `${label} metadata title should not include branding that duplicates the root title template.`);
}
assert(/openGraph\s*:/.test(guidesPage), "Guide hub metadata should include page-specific Open Graph fields.");
assert(/twitter\s*:/.test(guidesPage), "Guide hub metadata should include page-specific Twitter fields.");
assert(/buildCollectionPage/.test(seoSchema), "Shared schema helpers should expose CollectionPage JSON-LD.");
assert(/buildWebPage/.test(seoSchema), "Shared schema helpers should expose WebPage JSON-LD.");
assert(/buildCollectionPage/.test(guidesPage), "Guide hub should render CollectionPage schema.");
assert(/buildItemList/.test(guidesPage), "Guide hub should render ItemList schema.");
assert(/buildBreadcrumbList/.test(guidesPage), "Guide hub should render BreadcrumbList schema.");
assert(/<nav[^>]+aria-label="Breadcrumb"/.test(guidesPage), "Guide hub should render visible breadcrumbs.");
assert(/buildCollectionPage/.test(howToEarnPage), "How-to-earn collection should render CollectionPage schema.");
assert(/buildItemList/.test(howToEarnPage), "How-to-earn collection should render ItemList schema.");
assert(/<nav[^>]+aria-label="Breadcrumb"/.test(howToEarnPage), "How-to-earn collection should render visible breadcrumbs.");
assert(/buildCollectionPage/.test(offersPage), "Offers hub should render CollectionPage schema.");
assert(/buildItemList/.test(offersPage), "Offers hub should render ItemList schema.");
assert(/<nav[^>]+aria-label="Breadcrumb"/.test(offersPage), "Offers hub should render visible breadcrumbs.");
assert(/buildCollectionPage/.test(blogPage), "Blog index should render CollectionPage schema.");
assert(/buildItemList/.test(blogPage), "Blog index should render ItemList schema.");
assert(/<nav[^>]+aria-label="Breadcrumb"/.test(blogPage), "Blog index should render visible breadcrumbs.");
assert(/buildWebPage/.test(platformReviewPage), "Platform review template should render WebPage schema.");
assert(/buildBreadcrumbList/.test(platformReviewPage), "Platform review template should render BreadcrumbList schema.");
assert(/<nav[^>]+aria-label="Breadcrumb"/.test(platformReviewPage), "Platform review template should render visible breadcrumbs.");
assert(/type:\s*input\.type/.test(seoMetadata), "Shared SEO metadata builder should allow route-specific Open Graph types.");
assert(/type:\s*input\.type\s*\?\?\s*"website"/.test(seoMetadata), "Shared SEO metadata builder should default Open Graph type to website.");
assert(/type:\s*editorialContent\s*\?\s*"article"\s*:\s*"website"/.test(gamePage), "Game pages should use article Open Graph type only when editorial article content exists.");
assert(/type:\s*"article"/.test(howToEarnSlugPage), "Generated how-to-earn guide pages should opt into article Open Graph type.");
for (const section of ["Overview", "Best payout", "Milestones", "Worth it", "Tracking tips", "Crediting issues", "Related links"]) {
  assert(gamePage.includes(section), `Game SEO template should include reusable ${section} section copy.`);
}
assert(gamePage.includes("FAQSection") && faqSection.includes("FAQs"), "Game SEO template should include reusable FAQs section copy.");
assert(!gamePage.includes("No related games found."), "Game page should not render an empty related-games dead end.");
assert(!gamePage.includes("No guides published yet."), "Game page should not render an empty guide dead end.");
assert(/fallbackRelatedGames/.test(gamePage), "Game page should define fallback related-game links.");
assert(/fallbackGuideLinks/.test(gamePage), "Game page should define fallback guide links.");
assert(/fetchSitemapUrls/.test(publicSeoCoverageAudit), "Public SEO coverage audit should expand live sitemap URLs.");
assert(/Live sitemap URLs expanded/.test(publicSeoCoverageAudit), "Public SEO coverage audit should report live sitemap coverage.");

console.log("SEO technical signal checks passed.");
