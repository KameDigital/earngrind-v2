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
const modalSource = read("src/components/home/GamePreviewModal.tsx");

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

assert(
  pageSource.includes('import FeaturedOfferRail') &&
    pageSource.includes('items={gemsLootFeaturedOfferRail}') &&
    pageSource.includes('title="Featured Game Offers"') &&
    pageSource.includes('description="Curated GemsLoot game offers.'),
  "homepage should compose the Featured Game Offers rail from the current shared rail and GemsLoot data",
);

assert(
  pageSource.includes('href: offer.game_slug ? `/games/${offer.game_slug}` : "/offers"') &&
    pageSource.includes('gameHref: offer.game_slug ? `/games/${offer.game_slug}` : "/offers"'),
  "Featured Game Offers should route users to real game hubs or the canonical offers experience",
);

assert(
  pageSource.includes("gemsLootFeaturedOfferRail"),
  "homepage should map GemsLoot featured offers into the shared rail component",
);

assert(
  pageSource.includes("importedRoute") &&
    pageSource.includes("modalRoutesByGameKey[gameKey]") &&
    pageSource.includes("route.offerId === offer.id") &&
    pageSource.includes("const exactTasks = offer.tasks.length") &&
    pageSource.includes("tasks: exactTasks"),
  "GemsLoot featured previews should prefer the exact backend task list for the matched offer",
);

assert(
  dataSource.includes("gemsLootFeaturedOffers") &&
    dataSource.includes("tasks: RailPreviewTask[]") &&
    dataSource.includes("attachGemslootFeaturedTasks") &&
    dataSource.includes("gemsLootFeaturedOfferIds") &&
    dataSource.includes("manualTaskMap.get(offer.id)") &&
    dataSource.includes("MANUAL_TASK_QUERY_CHUNK_SIZE") &&
    dataSource.includes(".range(0, MANUAL_TASK_QUERY_RANGE_END)"),
  "homepage data should expose GemsLoot featured offers with exact site_offer_tasks",
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
  dataSource.includes('const GEMSLOOT_AFFILIATE_URL = "https://gemsloot.com/?aff=kamedev"') &&
    dataSource.includes('return GEMSLOOT_AFFILIATE_URL;'),
  "GemsLoot featured fallback should retain the configured real affiliate destination",
);

assert(
  modalSource.includes("Expand all") &&
    modalSource.includes("Show less") &&
    modalSource.includes("Show {visibleTasks.length - displayedTasks.length} more"),
  "preview modal should include an expand/collapse control for long imported task lists",
);

console.log("homepage Featured Game Offers rail wiring looks correct");
