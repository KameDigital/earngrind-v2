import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function includesAll(file, values) {
  const text = read(file);
  for (const value of values) {
    assert(text.includes(value), `${file} is missing ${value}`);
  }
}

assert(existsSync(join(root, "src/app/find-offers/page.tsx")), "Missing /find-offers page");
assert(
  existsSync(join(root, "src/components/offers/PersonalizedOfferFinder.tsx")),
  "Missing personalized offer finder component",
);
includesAll("src/components/offers/PersonalizedOfferFinder.tsx", [
  "Step 1",
  "country selector",
  "iOS",
  "Android",
  "Desktop",
  "Under 30 min",
  "30-60 min",
  "1-2 hrs",
  "2+ hrs",
  "Your top 5 offers",
  "FeaturedOfferRail",
]);
includesAll("src/components/layout/Header.tsx", [
  'href: "/find-offers"',
  "ti-brand-discord",
  "NEXT_PUBLIC_DISCORD_URL",
  "Re-enable when onboarding flow, terms display, and status dashboard are complete.",
]);
const header = read("src/components/layout/Header.tsx");
assert(!header.includes('label: "Earn Rewards"'), "Earn Rewards nav entry should be removed");
assert(!header.includes('NEXT_PUBLIC_EARN_REWARDS_ENTRY_ENABLED === "true"'), "Earn Rewards feature flag should not control nav");

assert(
  existsSync(join(root, "src/components/seo/PlatformReviewPage.tsx")),
  "Missing PlatformReviewPage component",
);
includesAll("src/components/seo/PlatformReviewPage.tsx", [
  "OfferTable",
  "affiliateCta",
  "TODO:",
]);

const seoPages = [
  ["src/app/(seo)/is-swagbucks-legit/page.tsx", "Is Swagbucks Legit?"],
  ["src/app/(seo)/is-freecash-legit/page.tsx", "Is Freecash Legit?"],
  ["src/app/(seo)/best-paying-mobile-games-gpt/page.tsx", "Best Paying Mobile Games on GPT Sites"],
  ["src/app/(seo)/how-long-does-freecash-take-to-pay/page.tsx", "How Long Does Freecash Take to Pay?"],
];
for (const [file, h1] of seoPages) {
  assert(existsSync(join(root, file)), `Missing ${file}`);
  includesAll(file, [h1, "buildSeoMetadata", "canonical", "fetchPublicOffers", "PlatformReviewPage"]);
}
includesAll("src/lib/sitemap-builder.ts", [
  "/is-swagbucks-legit",
  "/is-freecash-legit",
  "/best-paying-mobile-games-gpt",
  "/how-long-does-freecash-take-to-pay",
]);

includesAll("src/app/page.tsx", [
  "NEXT_PUBLIC_DISCORD_URL",
  "Join the community →",
  "JsonLd",
  "buildWebsiteSearchAction",
]);
includesAll("src/components/layout/Footer.tsx", [
  "NEXT_PUBLIC_DISCORD_URL",
  "ti-brand-discord",
  "Discord",
]);
includesAll("src/lib/seo-schema.tsx", [
  "buildWebsiteSearchAction",
  "WebSite",
  "SearchAction",
  "search_term_string",
  "/offers?q={search_term_string}",
  "query-input",
]);

console.log("Week 3 quick wins coverage checks passed.");
