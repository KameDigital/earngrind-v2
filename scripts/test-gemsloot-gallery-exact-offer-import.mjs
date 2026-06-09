import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const gallerySource = read("src/lib/gemsloot-gallery.ts");
const routeSource = read("src/app/api/admin/gemsloot/gallery-import/route.ts");
const outboundSource = read("src/lib/outbound.ts");

for (const offerName of [
  "TyrAds__5553",
  "HangMyAds__82544",
  "TyrAds__4884",
  "TyrAds__4922",
  "WaxRewards__10-4513",
]) {
  assert(
    gallerySource.includes(offerName),
    `featured GemsLoot import identifiers should include ${offerName}`,
  );
}

assert(
  gallerySource.includes("offerIds?:") &&
    gallerySource.includes("loadExactOfferDetails"),
  "GemsLoot gallery should support exact upstream offer id imports",
);

assert(
  gallerySource.includes("https://gemsloot.com/transactions") &&
    gallerySource.includes('modal", "offer_3"') &&
    gallerySource.includes('aff", "kamedev"'),
  "GemsLoot gallery should build the offer_3 transactions modal URL with kamedev attribution",
);

assert(
  routeSource.includes("offerIds") &&
    routeSource.includes("normalizeGemslootOfferIds"),
  "GemsLoot admin import route should accept explicit offerIds",
);

assert(
  outboundSource.includes('replace(/-[A-Z]{2}$/i, "")'),
  "GemsLoot outbound extraction should remove country suffixes from provider-gallery external IDs",
);

console.log("GemsLoot exact offer import wiring looks correct");
