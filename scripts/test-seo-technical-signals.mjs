import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const guidesPage = read("src/app/guides/page.tsx");
const offersPage = read("src/app/offers/page.tsx");
const howToEarnPage = read("src/app/(seo)/guides/how-to-earn/page.tsx");
const bestPayingMobileGamesPage = read("src/app/(seo)/best-paying-mobile-games-gpt/page.tsx");
const freecashLegitPage = read("src/app/(seo)/is-freecash-legit/page.tsx");
const swagbucksLegitPage = read("src/app/(seo)/is-swagbucks-legit/page.tsx");
const freecashPayoutTimePage = read("src/app/(seo)/how-long-does-freecash-take-to-pay/page.tsx");
const seoSchema = read("src/lib/seo-schema.tsx");
const seoMetadata = read("src/app/(seo)/_lib/seo-data.ts");

assert(/openGraph\s*:/.test(guidesPage), "Guide hub metadata should include page-specific Open Graph fields.");
assert(/twitter\s*:/.test(guidesPage), "Guide hub metadata should include page-specific Twitter fields.");
assert(/buildCollectionPage/.test(seoSchema), "Shared schema helpers should expose CollectionPage JSON-LD.");
assert(/buildWebPage/.test(seoSchema), "Shared schema helpers should expose WebPage JSON-LD.");

for (const [label, source] of [
  ["Guide hub", guidesPage],
  ["How-to-earn collection", howToEarnPage],
  ["Offers hub", offersPage],
]) {
  assert(/buildCollectionPage/.test(source), `${label} should render CollectionPage schema.`);
  assert(/buildItemList/.test(source), `${label} should render ItemList schema.`);
  assert(/<nav[^>]+aria-label="Breadcrumb"/.test(source), `${label} should render visible breadcrumbs.`);
}

assert(/type:\s*input\.type/.test(seoMetadata), "Shared SEO metadata builder should allow route-specific Open Graph types.");

console.log("SEO technical signal checks passed.");
