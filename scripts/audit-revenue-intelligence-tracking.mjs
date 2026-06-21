import { readFileSync } from "node:fs";

function readText(path) {
  return readFileSync(path, "utf8");
}

const files = {
  taxonomy: readText("docs/revenue-intelligence-plan.md"),
  normalizer: readText("src/lib/revenue-events.ts"),
  clientTracker: readText("src/components/analytics/RevenueEventTracker.tsx"),
  trackedOutboundLink: readText("src/components/offers/TrackedOutboundLink.tsx"),
  homepage: readText("src/app/page.tsx"),
  bestGptSites: readText("src/app/(seo)/best-gpt-sites/page.tsx"),
  bestOffersTemplate: readText("src/app/(seo)/components/BestOffersPageTemplate.tsx"),
  gamePage: readText("src/app/(seo)/games/[slug]/page.tsx"),
  offerPage: readText("src/app/offers/[slug]/page.tsx"),
  guideTracker: readText("src/app/guides/[slug]/GuidePerformanceTracker.tsx"),
  goOffer: readText("src/app/go/[offerId]/route.ts"),
  goPlatform: readText("src/app/go/platform/[platformId]/route.ts"),
  goEarn: readText("src/app/go/earn/[offerId]/route.ts"),
  admin: readText("src/app/app/admin/revenue-intelligence/page.tsx"),
};

const requiredTaxonomy = [
  "page_view",
  "cta_impression",
  "cta_click",
  "outbound_click",
  "conversion_postback",
  "homepage",
  "best_gpt_sites",
  "seo_best_offers",
  "game",
  "offer",
  "guide",
  "CTA location naming",
];

const checks = [
  ...requiredTaxonomy.map((term) => ({
    label: `taxonomy documents ${term}`,
    pass: files.taxonomy.includes(term),
  })),
  {
    label: "normalizer rejects invalid route paths",
    pass: files.normalizer.includes("invalid_route_path") && files.normalizer.includes("normalizeRevenueEvent"),
  },
  {
    label: "client tracker dedupes CTA impressions in session storage",
    pass: files.clientTracker.includes("cta_impression") &&
      files.clientTracker.includes("sessionStorage") &&
      files.clientTracker.includes("IntersectionObserver"),
  },
  {
    label: "TrackedOutboundLink records CTA impressions and clicks",
    pass: files.trackedOutboundLink.includes('buildRevenuePayload("cta_impression")') &&
      files.trackedOutboundLink.includes('buildRevenuePayload("cta_click")'),
  },
  {
    label: "homepage page view is wired",
    pass: files.homepage.includes('routeGroup="homepage"') && files.homepage.includes('sourceContext="homepage"'),
  },
  {
    label: "/best-gpt-sites page view is wired",
    pass: files.bestGptSites.includes('routeGroup="best_gpt_sites"') &&
      files.bestGptSites.includes('sourceContext="best_gpt_sites"'),
  },
  {
    label: "shared SEO best-offer pages use seo_best_offers route group",
    pass: files.bestOffersTemplate.includes('routeGroup="seo_best_offers"') &&
      files.bestOffersTemplate.includes("sourceContext={sourceContext}"),
  },
  {
    label: "game pages identify game entities",
    pass: files.gamePage.includes('routeGroup="game"') &&
      files.gamePage.includes('entityType="game"') &&
      files.gamePage.includes("gameSlug={data.game.slug}"),
  },
  {
    label: "offer pages identify game route entities",
    pass: files.offerPage.includes('routeGroup="offer"') &&
      files.offerPage.includes('sourceContext="offer_detail"'),
  },
  {
    label: "guide tracker records page views, impressions, and clicks",
    pass: files.guideTracker.includes('eventName: "page_view"') &&
      files.guideTracker.includes('eventName: "cta_impression"') &&
      files.guideTracker.includes('eventName: "cta_click"'),
  },
  {
    label: "/go routes record outbound_click without changing redirects",
    pass: [files.goOffer, files.goPlatform, files.goEarn].every((source) =>
      source.includes('event_name: "outbound_click"') && source.includes("NextResponse.redirect"),
    ),
  },
  {
    label: "admin Revenue Intelligence page has recent event QA table",
    pass: files.admin.includes("Recent revenue events") && files.admin.includes("Revenue Intelligence Loop"),
  },
];

const failed = checks.filter((check) => !check.pass);

for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"} ${check.label}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} revenue intelligence tracking check(s) failed.`);
  process.exit(1);
}

console.log("\nRevenue intelligence tracking audit passed.");
