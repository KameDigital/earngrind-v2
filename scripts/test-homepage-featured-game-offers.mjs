import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const pageSource = read("src/app/page.tsx");

assert(
  !pageSource.includes('title="Featured Game Offers"'),
  'homepage should not render the removed "Featured Game Offers" carousel',
);

assert(
  !pageSource.includes("gemsLootFeaturedOfferRail"),
  "homepage should not map GemsLoot featured offers into a visible homepage rail",
);

assert(
  !pageSource.includes("homepage_gemsloot_featured_offer"),
  "homepage should not create GemsLoot featured rail tracking links for the removed carousel",
);

assert(
  pageSource.includes('title="Featured Games by Site"') &&
    pageSource.includes('<EmailCapture variant="inline" />') &&
    pageSource.includes("<TabbedOfferRail tabs={OFFER_RAIL_TABS} />"),
  "homepage should keep the Featured Games by Site section, email capture, and remaining tabbed offer rails",
);

assert(
  pageSource.includes("earnLabOfferRail") &&
    pageSource.includes("gainOfferRail") &&
    pageSource.includes("cashInStyleOfferRail"),
  "homepage should keep the remaining partner-site offer rails wired",
);

console.log("homepage removed Featured Game Offers carousel correctly");
