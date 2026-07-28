import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const gallerySource = read("src/lib/gemsloot-gallery.ts");

assert(
  gallerySource.includes("loadAllProviderListOfferDetails") &&
    gallerySource.includes("mapWithConcurrency(providerNames") &&
    gallerySource.includes("ALL_PROVIDER_LIST_LIMIT") &&
    gallerySource.includes("dedupeGemslootOffers"),
  "Gemsloot all-provider imports should fan out through full provider lists and dedupe before country filtering",
);

console.log("Gemsloot provider fanout guard passed");
