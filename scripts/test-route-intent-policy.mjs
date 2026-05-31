import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const homepage = read("src/app/page.tsx");
assert.match(homepage, /title:\s*"EarnGrind \| GPT Offer Discovery, Game Guides, and Platform Research"/);
assert.doesNotMatch(homepage, /title:\s*"Highest Paying GPT Offers, Game Guides, and Best GPT Sites"/);
assert.match(homepage, /href:\s*"\/games"/);
assert.match(homepage, /href:\s*"\/platforms"/);

const policyPath = "src/lib/route-intent-policy.ts";
assert.equal(existsSync(join(root, policyPath)), true, `${policyPath} should exist`);
const policy = read(policyPath);
assert.match(policy, /gameHubPath/);
assert.match(policy, /offerRoutePath/);
assert.match(policy, /Game hubs explain what to play/);
assert.match(policy, /Offer routes are the canonical payout comparison/);

const gamePage = read("src/app/(seo)/games/[slug]/page.tsx");
assert.match(gamePage, /gameHubPath/);
assert.match(gamePage, /buildGameHubSeoTitle/);
assert.match(gamePage, /href=\{offerRoutePath\(data\.game\.slug\)\}/);

const offerPage = read("src/app/offers/[slug]/page.tsx");
assert.match(offerPage, /offerRoutePath/);
assert.match(offerPage, /buildOfferRouteSeoTitle/);
assert.match(offerPage, /canonical = absoluteUrl\(offerRoutePath\(game\.slug\)\)/);

const reviewsPage = read("src/app/reviews/page.tsx");
assert.match(reviewsPage, /permanentRedirect\("\/platforms"\)/);
assert.doesNotMatch(reviewsPage, /getReviews\(\)/);

console.log("route intent policy checks passed");
