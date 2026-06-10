import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const homepage = read("src/app/page.tsx");
const header = read("src/components/layout/Header.tsx");
const offerSearch = read("src/components/offers/OfferSearchEngine.tsx");
const featuredRail = read("src/components/home/FeaturedOfferRail.tsx");
const siteOffersComparison = read("src/app/offers/[slug]/SiteOffersComparison.tsx");
const offerDetailPage = read("src/app/offers/[slug]/page.tsx");
const gemslootCountry = read("src/components/offers/GemslootCountryOffersPage.tsx");
const gainCountry = read("src/components/offers/GainCountryOffersPage.tsx");
const earnLabCountry = read("src/components/offers/EarnLabCountryOffersPage.tsx");
const payoutFreshness = read("src/lib/payout-freshness.ts");
const gitignore = read(".gitignore");

assert.match(homepage, /Find the Highest-Paying Version of Any Mobile Game Offer/);
assert.match(
  homepage,
  /Before you grind, check EarnGrind\s+—\s+we compare payouts across\s+every major rewards site so you earn more for the same time\./,
);
assert.match(
  homepage,
  /No account needed to browse\. We just show you where the money is\./,
);

for (const [question, answerNeedle] of [
  ["Which platform is best for beginners?", "Best GPT Sites"],
  ["How do I actually get paid?", "offer"],
  ["What's the difference between EarnGrind and Swagbucks?", "comparison tool"],
  ["Is EarnGrind free to use?", "No account"],
]) {
  assert.match(homepage, new RegExp(question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(homepage, new RegExp(answerNeedle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
assert.doesNotMatch(homepage, /Why are there so many internal pages\?/);

for (const source of [homepage, header, offerSearch]) {
  assert.doesNotMatch(source, new RegExp("-&" + "gt;"));
}
for (const source of [offerSearch, read("scripts/audit-seo-metadata.mjs")]) {
  assert.doesNotMatch(source, new RegExp(" " + "-" + "> "));
}
assert.match(homepage, /→/);
assert.match(header, /→/);

for (const file of ["error.log", ".env.local", ".env.production"]) {
  assert.equal(existsSync(join(root, file)), false, `${file} should not exist`);
  assert.match(gitignore, new RegExp(`^${file.replace(".", "\\.")}$`, "m"));
}
assert.equal(existsSync(join(root, ".env.example")), true, ".env.example should remain");

assert.match(payoutFreshness, /formatDataRefreshedLabel/);
for (const source of [
  offerSearch,
  featuredRail,
  siteOffersComparison,
  offerDetailPage,
  gemslootCountry,
  gainCountry,
  earnLabCountry,
]) {
  assert.match(source, /Data refreshed:|formatDataRefreshedLabel|dataRefreshed/);
}
