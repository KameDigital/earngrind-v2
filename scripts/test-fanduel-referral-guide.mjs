import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const guideRoute = "src/app/guides/fanduel-sportsbook-referral-bonus/page.tsx";
const registry = read("src/lib/static-guides.ts");
const registryEntry = registry.match(/\{\s*title: "FanDuel Sportsbook Referral Bonus Guide",[\s\S]*?sitemapPriority: 0\.8,\s*\}/)?.[0] ?? "";

assert(existsSync(resolve(process.cwd(), guideRoute)), "FanDuel referral guide route should exist under /guides");

const guideSource = read(guideRoute);

assert(
  registryEntry.includes('slug: "fanduel-sportsbook-referral-bonus"'),
  "FanDuel referral guide should be registered in STATIC_GUIDES",
);
assert(
  registryEntry.includes('href: "/guides/fanduel-sportsbook-referral-bonus"'),
  "FanDuel referral guide registry entry should point to the guide route",
);
assert(
  registryEntry.includes('contentType: "offer_guide"'),
  "FanDuel referral guide should be classified as an offer guide so it appears on /guides",
);
assert(
  guideSource.includes("https://fndl.co/yeio8rw"),
  "FanDuel referral guide should use the provided referral link",
);
assert(
  !guideSource.includes("Offer Snapshot") && !guideSource.includes('location="snapshot_referral"'),
  "FanDuel referral guide should not render the hero Offer Snapshot panel",
);
assert(
  guideSource.includes("21+") && guideSource.includes("1-800-GAMBLER"),
  "FanDuel referral guide should include responsible gambling language",
);
assert(
  guideSource.includes("deposit at least $5") && guideSource.includes("settle a real-money bet of at least $5"),
  "FanDuel referral guide should explain the referral qualification steps",
);

console.log("FanDuel referral guide checks passed");
