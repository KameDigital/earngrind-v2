import { readFileSync } from "node:fs";
import { join } from "node:path";

const pageSource = readFileSync(
  join(process.cwd(), "src/app/page.tsx"),
  "utf8",
);

const sectionStart = pageSource.indexOf("Choose the hub that matches your next step");

if (sectionStart === -1) {
  throw new Error("Homepage start-here section is missing its semantic heading.");
}

const sectionSource = pageSource.slice(
  sectionStart,
  pageSource.indexOf("</section>", sectionStart),
);

if (!sectionSource.includes('className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"')) {
  throw new Error("Homepage start-here grid must keep a compact five-column desktop layout.");
}

if (!sectionSource.includes("START_HERE_ITEMS.map")) {
  throw new Error("Homepage start-here cards must render from the current shared hub item list.");
}

if (!sectionSource.includes("href={item.href}")) {
  throw new Error("Homepage start-here cards must link to their real hub routes.");
}

const requiredItemSnippets = [
  'name: "Compare Offers"',
  'href: "/offers"',
  'badge: "Canonical search"',
  'name: "Browse Games"',
  'href: "/offers#games"',
  'badge: "Game discovery"',
  'name: "Best GPT Sites"',
  'href: "/best-gpt-sites"',
  'badge: "Platform intel"',
  'name: "Game Guides"',
  'href: "/guides"',
  'badge: "Completion help"',
  'name: "Platform Reviews"',
  'href: "/best-gpt-sites#platform-reviews"',
  'badge: "Trust checks"',
];

for (const snippet of requiredItemSnippets) {
  if (!pageSource.includes(snippet)) {
    throw new Error(`Homepage start-here item list is missing: ${snippet}`);
  }
}

const obsoleteImageSnippets = [
  "/images/browse-games-phone-search-transparent.webp",
  "/images/best-gpt-sites-trophy-transparent.webp",
  "/images/game-guides-route-transparent.webp",
];

for (const snippet of obsoleteImageSnippets) {
  if (sectionSource.includes(snippet)) {
    throw new Error(`Homepage start-here section still depends on obsolete image-card markup: ${snippet}`);
  }
}

console.log("Homepage start-here compact hub card markup looks correct.");
