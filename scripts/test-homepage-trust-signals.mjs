import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const read = (file) => readFileSync(path.join(process.cwd(), file), "utf8");

const weeklyTopGames = read("src/components/home/WeeklyTopGames.tsx");
const accountPartnerSites = read("src/components/account/AccountPartnerSites.tsx");
const homePage = read("src/app/page.tsx");

// 1. WeeklyTopGames card trust signals
assert.match(weeklyTopGames, /offer\.devices\.map/, "WeeklyTopGames must render device badges from real offer data");
assert.match(weeklyTopGames, /offer\.payout_type/, "WeeklyTopGames must render payout type badge when present");
assert.match(weeklyTopGames, /\(offer\.devices\.length > 0 \|\| offer\.payout_type\)/, "WeeklyTopGames trust badge row must degrade gracefully when no devices/payout_type exist");

// 2. AccountPartnerSites trust signals and editorial rating label
assert.match(accountPartnerSites, /EarnGrind Rating \{platform\.trustScore\.toFixed\(1\)\}\/5/, "AccountPartnerSites must explicitly label trust score as EarnGrind Rating to clarify editorial origin");
assert.match(accountPartnerSites, /platform\.payoutMethods\?\.map/, "AccountPartnerSites must render verified payout methods list");
assert.match(accountPartnerSites, /platform\.disclosure/, "AccountPartnerSites must render referral code disclosure when present");
assert.match(accountPartnerSites, /\(platform\.payoutMethods\?\.length \|\| platform\.disclosure\)/, "AccountPartnerSites trust badge row must degrade gracefully when no payout methods/disclosures exist");

// 3. Homepage FAQ content and SEO schema
assert.match(homePage, /How do GPT \(Get Paid To\) offer sites work\?/, "Homepage FAQ must include explanation of how GPT sites work");
assert.match(homePage, /Why are some offers or platforms shown first or marked featured\?/, "Homepage FAQ must explain featured placement logic and affiliate monetization disclosure");
assert.match(homePage, /How are offers and platforms vetted for trustworthiness\?/, "Homepage FAQ must explain trust vetting criteria");
assert.match(homePage, /buildFAQPage/, "Homepage must generate FAQPage structured JSON-LD schema");
assert.match(homePage, /EarnGrind Rating/, "Homepage partner table must explicitly label ratings as EarnGrind Rating");

console.log("✅ Homepage trust signals, card degradation, and FAQ test passed cleanly.");
