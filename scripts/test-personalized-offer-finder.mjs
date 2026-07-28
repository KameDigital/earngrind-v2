import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const page = read("src/app/find-offers/page.tsx");
const component = read("src/components/offers/PersonalizedOfferFinder.tsx");
const scorer = read("src/lib/personalized-offer-finder.ts");

assert(page.includes("FINDER_COUNTRY_OPTIONS.map"), "/find-offers should hydrate the quiz with every supported country pool.");
assert(!page.includes('country: "US"'), "/find-offers should not hard-code the initial offer pool to US only.");
assert(component.includes("getPersonalizedOfferResults"), "Finder component should use the shared recommendation scorer.");
assert(!component.includes("matchesTimeWindow"), "Finder should use offer type instead of the old time-window filter.");
assert(scorer.includes("scoreFinderOffer"), "Shared finder scorer is missing.");
assert(scorer.includes("completion_count"), "Finder scorer should accept persisted completion_count.");
assert(scorer.includes("hasRealCompletionCount"), "Most completed ranking should explicitly prefer real completion counts.");
assert(scorer.includes("Number.isFinite(completionCount)"), "Most completed ranking should guard real completion count numerics.");
assert(scorer.includes("FINDER_OFFER_TYPE_OPTIONS"), "Finder offer type options are missing.");
assert(scorer.includes("Most completed"), "Most completed should be a finder section.");
assert(scorer.includes("Highest payout"), "Highest payout should be a finder section.");
assert(scorer.includes("Quick Tasks"), "Quick Tasks should be a finder section.");
assert(!scorer.includes("Casino offers"), "Casino offers should not be an active finder section.");
assert(scorer.includes("offerMatchesFinderType"), "Offer type matching should be explicit.");
assert(scorer.includes("offerMatchesFinderCountry"), "Country matching should remain explicit.");
assert(scorer.includes("offerMatchesFinderDevice"), "Device matching should remain explicit.");
assert(component.includes("Offer type"), "Finder should label Step 3 as offer type.");
assert(!component.includes("Time available per day"), "Finder should not use the old time-per-day section.");

const publicOffers = read("src/lib/public-offers.ts");
assert(publicOffers.includes("completion_count"), "Public offer shaping should expose completion_count from search rows.");

const migration = read("supabase/migrations/20260702001851_add_site_offer_completion_count.sql");
assert(migration.includes("add column if not exists completion_count"), "Migration should add site_offers.completion_count.");
assert(migration.includes("so.completion_count"), "Migration should expose site_offers completion_count through unified_offers_view.");
assert(migration.includes("returns table") && migration.includes("completion_count integer"), "Search RPC should return completion_count.");

console.log("Personalized offer finder regression checks passed.");
