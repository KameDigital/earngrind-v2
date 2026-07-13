import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const affiliateUrl = "https://gemsloot.com/?aff=kamedev";

const guideSource = readFileSync(resolve(process.cwd(), "src/lib/gpt-site-guides.ts"), "utf8");
const homepageSource = readFileSync(resolve(process.cwd(), "src/lib/homepage-data.ts"), "utf8");
const publicOffersSource = readFileSync(resolve(process.cwd(), "src/lib/public-offers.ts"), "utf8");

assert.ok(
  guideSource.includes(`const GEMSLOOT_AFFILIATE_URL = "${affiliateUrl}";`),
  "GemLoot guide data should define the affiliate target",
);
assert.ok(
  homepageSource.includes(`const GEMSLOOT_AFFILIATE_URL = "${affiliateUrl}";`),
  "Homepage Gemsloot data should define the affiliate target",
);

for (const directUrl of [
  "https://gemsloot.com/",
  "https://gemsloot.com/lobby",
  "https://gemsloot.com/rewards",
  "https://gemsloot.com/vip/info",
]) {
  assert.ok(!guideSource.includes(`href: "${directUrl}"`), `GemLoot guide should not link directly to ${directUrl}`);
}

const gemslootSourceBlock = guideSource.match(/slug: "gemsloot"[\s\S]*?sources: \[([\s\S]*?)\],\s*\},\s*\{/);
assert.ok(gemslootSourceBlock, "GemLoot guide source block should be present");
const gemslootSourceHrefs = [...gemslootSourceBlock[1].matchAll(/href: ([^ },]+)[ },]/g)].map((match) => match[1]);
assert.equal(gemslootSourceHrefs.length, 4, "GemLoot guide should expose four source links");
assert.ok(
  gemslootSourceHrefs.every((href) => href === "GEMSLOOT_AFFILIATE_URL"),
  "Every GemLoot guide backlink should use the affiliate link constant",
);

assert.ok(
  homepageSource.includes("return GEMSLOOT_AFFILIATE_URL;"),
  "Gemsloot featured homepage fallback should use the affiliate link",
);
assert.ok(
  !homepageSource.includes("return `https://gemsloot.com/transactions?${params.toString()}`;"),
  "Gemsloot featured homepage fallback should not build a direct transaction URL",
);

assert.ok(
  publicOffersSource.includes(`const GEMSLOOT_AFFILIATE_URL = "${affiliateUrl}";`),
  "Public offer shaping should define the Gemsloot affiliate target",
);
assert.ok(
  publicOffersSource.includes("return GEMSLOOT_AFFILIATE_URL;"),
  "Public Gemsloot offer payloads should use the affiliate link instead of raw source URLs",
);

console.log("Gemsloot affiliate backlink validation passed");
