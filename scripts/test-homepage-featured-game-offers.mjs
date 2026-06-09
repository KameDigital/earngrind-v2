import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const pageSource = read("src/app/page.tsx");
const dataSource = read("src/lib/homepage-data.ts");

const offerIds = [
  "TyrAds__5553",
  "HangMyAds__82544",
  "TyrAds__4884",
  "TyrAds__4922",
  "WaxRewards__10-4513",
];

assert(
  pageSource.includes("Featured Game Offers"),
  'homepage should render a "Featured Game Offers" rail',
);

const railSectionIndex = pageSource.indexOf('title="Featured Game Offers"');
const earnLabRailIndex = pageSource.indexOf('title="Featured EarnLab games"');

assert(
  railSectionIndex !== -1 &&
    earnLabRailIndex !== -1 &&
    railSectionIndex < earnLabRailIndex,
  "Featured Game Offers rail should appear before the existing offer rails",
);

assert(
  pageSource.includes("gemsLootFeaturedOfferRail"),
  "homepage should map GemsLoot featured offers into the shared rail component",
);

assert(
  dataSource.includes("gemsLootFeaturedOffers"),
  "homepage data should expose GemsLoot featured offers",
);

assert(
  dataSource.includes('from("site_offers")') &&
    dataSource.includes("external_id.ilike"),
  "homepage data should load GemsLoot featured offers from site_offers by external_id",
);

for (const offerId of offerIds) {
  assert(
    dataSource.includes(offerId),
    `featured game offer list should include ${offerId}`,
  );
}

assert(
  dataSource.includes('params.set("modal", "offer_3")') &&
    dataSource.includes('params.set("aff", "kamedev")'),
  "GemsLoot fallback href should preserve modal=offer_3 and aff=kamedev",
);

console.log("homepage Featured Game Offers rail wiring looks correct");
