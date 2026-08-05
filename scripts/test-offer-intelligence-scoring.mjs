import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

// Transpile and load TypeScript module dynamically for node execution
const code = readFileSync(path.join(process.cwd(), "src/lib/offer-intelligence.ts"), "utf8");
const transpiled = ts.transpileModule(code, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const dataUri = "data:text/javascript;base64," + Buffer.from(transpiled).toString("base64");
const { getOfferReality, offerRouteScore } = await import(dataUri);

// 1. Non-throwing behavior on empty or minimal input
assert.doesNotThrow(() => {
  const minimal = { id: "min-1", payout_usd: 0 };
  const reality = getOfferReality(minimal);
  assert.equal(typeof reality.score, "number");
  assert.ok(["Strong", "Review", "Stale"].includes(reality.label));
  assert.ok(Array.isArray(reality.reasons));
  const score = offerRouteScore(minimal);
  assert.equal(typeof score, "number");
}, "getOfferReality and offerRouteScore must handle minimal input without throwing");

assert.doesNotThrow(() => {
  const nullFields = {
    id: "null-1",
    payout_usd: 0,
    total_payout_usd: null,
    updated_at: null,
    goal_text: null,
    devices: null,
    countries: null,
  };
  const reality = getOfferReality(nullFields);
  assert.equal(reality.label, "Stale");
}, "getOfferReality must handle null fields gracefully");

// 2. Synthetic fixtures for scoring rank verification
const now = new Date();
const daysAgo = (d) => new Date(now.getTime() - d * 86_400_000).toISOString();

const strongOffer = {
  id: "strong-1",
  payout_usd: 50,
  total_payout_usd: 50,
  updated_at: daysAgo(2),
  goal_text: "Reach Level 50 within 14 days",
  devices: ["Android", "iOS"],
  countries: ["US", "CA"],
};

const reviewOffer = {
  id: "review-1",
  payout_usd: 15,
  total_payout_usd: 15,
  updated_at: daysAgo(20),
  goal_text: "Complete registration",
  devices: null,
  countries: null,
};

const staleOffer = {
  id: "stale-1",
  payout_usd: 5,
  total_payout_usd: 5,
  updated_at: daysAgo(90),
  goal_text: null,
  devices: null,
  countries: null,
};

const minimalOffer = {
  id: "minimal-1",
  payout_usd: 0,
  updated_at: null,
};

const strongReality = getOfferReality(strongOffer);
const reviewReality = getOfferReality(reviewOffer);
const staleReality = getOfferReality(staleOffer);

assert.equal(strongReality.label, "Strong", "Fresh offer with complete fields must yield 'Strong' label");
assert.equal(reviewReality.label, "Review", "Moderately fresh offer without device/country fit must yield 'Review' label");
assert.equal(staleReality.label, "Stale", "Old offer without requirement text must yield 'Stale' label");

const scoreStrong = offerRouteScore(strongOffer);
const scoreReview = offerRouteScore(reviewOffer);
const scoreStale = offerRouteScore(staleOffer);
const scoreMinimal = offerRouteScore(minimalOffer);

assert.ok(scoreStrong > scoreReview, `Strong route score (${scoreStrong}) must rank higher than Review route score (${scoreReview})`);
assert.ok(scoreReview > scoreStale, `Review route score (${scoreReview}) must rank higher than Stale route score (${scoreStale})`);
assert.ok(scoreStale > scoreMinimal, `Stale route score (${scoreStale}) must rank higher than minimal route score (${scoreMinimal})`);

console.log("✅ Offer intelligence scoring regression test passed cleanly.");
