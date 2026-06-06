import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const homepage = read("src/app/page.tsx");
assert.match(homepage, /title:\s*"EarnGrind \| GPT Offer Discovery, Game Guides, and Platform Research"/);
assert.doesNotMatch(homepage, /title:\s*"Highest Paying GPT Offers, Game Guides, and Best GPT Sites"/);
assert.match(homepage, /href:\s*"\/offers#games"/);
assert.match(homepage, /href:\s*"\/best-gpt-sites#platform-reviews"/);

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

const gamesIndexPage = read("src/app/(seo)/games/page.tsx");
assert.match(gamesIndexPage, /permanentRedirect\("\/offers#games"\)/);

const offersIndexPage = read("src/app/offers/page.tsx");
assert.match(offersIndexPage, /getGamesIndexData/);
assert.match(offersIndexPage, /<GamesIndexClient/);
assert.match(offersIndexPage, /id="offer-search"/);
assert.match(offersIndexPage, /id="games"/);
assert.match(offersIndexPage, /params\.set\("per_page", "4"\)/);

const offerSearchEngine = read("src/components/offers/OfferSearchEngine.tsx");
assert.match(offerSearchEngine, /params\.set\("per_page", "4"\)/);

const gamesIndexClient = read("src/app/(seo)/games/GamesIndexClient.tsx");
assert.match(gamesIndexClient, /useSearchParams/);
assert.match(gamesIndexClient, /terminalQuery/);
assert.doesNotMatch(gamesIndexClient, /Offer finder/);
assert.doesNotMatch(gamesIndexClient, /Search games/);
assert.doesNotMatch(gamesIndexClient, /placeholder="Search by game, provider, platform\.\.\."/);
assert.match(gamesIndexClient, /\{variant === "standalone" \? \(/);

const cardSurfaceSources = [
  ["offers index", offersIndexPage],
  ["games index client", gamesIndexClient],
  ["offer search engine", offerSearchEngine],
];
for (const [label, source] of cardSurfaceSources) {
  assert.doesNotMatch(source, /rounded-(?:md|lg|xl|2xl|3xl|full)|rounded-\[[^\]]+\]/, `${label} should use square card corners`);
}
assert.match(gamesIndexClient, /aspect-square w-full rounded-none/);
assert.match(gamesIndexClient, /hover:ring-2 hover:ring-lime-300\/35/);
assert.match(gamesIndexClient, /grid-cols-\[3\.5rem_minmax\(0,1fr\)\]/);
assert.match(gamesIndexClient, /Top payout \{money\(game\.topPayout\)\}/);
assert.doesNotMatch(gamesIndexClient, /<p className="text-lg font-black text-lime-300">\{money\(game\.topPayout\)\}<\/p>/);
const rankingSectionMatch = gamesIndexClient.match(/<p className="section-label">How EarnGrind ranks game offers<\/p>[\s\S]*?<section id=\{sectionId\}/);
assert.ok(rankingSectionMatch, "ranking explainer section should render before the matched games section");
const rankingSection = rankingSectionMatch[0];
assert.doesNotMatch(rankingSection, /lg:grid-cols-\[1fr_auto\]/);
assert.match(rankingSection, /Payout strength, route choice, and tracking risk/);
assert.match(rankingSection, /grid grid-cols-\[2\.25rem_minmax\(0,1fr\)\] gap-3/);
assert.match(gamesIndexClient, /lg:grid-cols-\[7rem_minmax\(0,1fr\)_9rem_7rem_7\.25rem_13rem\]/);
assert.match(gamesIndexClient, /grid gap-3 xl:grid-cols-2/);
assert.match(gamesIndexClient, /sm:grid-cols-\[minmax\(0,1fr\)_9\.75rem\]/);
assert.match(gamesIndexClient, /border border-slate-900 bg-slate-950 text-white/);
assert.match(gamesIndexClient, /Compare offers <ArrowRight/);
assert.doesNotMatch(gamesIndexClient, /min-h-\[(?:18|28)rem\]/);
assert.match(gamesIndexClient, /<ProviderLogo name=\{pick\.game\.bestProvider\} src=\{pick\.game\.providerLogoUrl\}/);
assert.match(gamesIndexClient, /<ProviderLogo name=\{game\.bestProvider\} src=\{game\.providerLogoUrl\}/);
assert.match(offersIndexPage, /hover:ring-2 hover:ring-lime-300\/35/);
assert.match(offerSearchEngine, /hover:shadow-\[inset_0_0_0_1px_rgba\(132,204,22,0\.35\)\]/);
assert.match(offerSearchEngine, /<ProviderLogo name=\{providerName\} compact/);

const providerLogo = read("src/components/providers/ProviderLogo.tsx");
assert.match(providerLogo, /bitlabs:\s*"\/providers\/bitlabs_games\.svg"/);
assert.match(providerLogo, /torox:\s*"\/providers\/torox\.svg"/);
assert.match(providerLogo, /revu:\s*"\/providers\/revu\.svg"/);
assert.match(providerLogo, /border-slate-700 bg-\[var\(--brand-ink\)\] px-2 py-1/);

const offerPage = read("src/app/offers/[slug]/page.tsx");
assert.match(offerPage, /offerRoutePath/);
assert.match(offerPage, /buildOfferRouteSeoTitle/);
assert.match(offerPage, /canonical = absoluteUrl\(offerRoutePath\(game\.slug\)\)/);

const reviewsPage = read("src/app/reviews/page.tsx");
assert.match(reviewsPage, /permanentRedirect\("\/best-gpt-sites"\)/);
assert.doesNotMatch(reviewsPage, /getReviews\(\)/);

const platformsPage = read("src/app/platforms/page.tsx");
assert.match(platformsPage, /permanentRedirect\("\/best-gpt-sites"\)/);
assert.doesNotMatch(platformsPage, /getReviews\(\)/);

const bestGptSitesPage = read("src/app/(seo)/best-gpt-sites/page.tsx");
assert.match(bestGptSitesPage, /id="platform-reviews"/);
assert.match(bestGptSitesPage, /PlatformReviewCard/);
assert.match(bestGptSitesPage, /STATIC_GUIDES\.filter\(\(guide\) => guide\.contentType === "platform_review"\)/);

console.log("route intent policy checks passed");
