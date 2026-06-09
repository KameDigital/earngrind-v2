import { readFileSync } from "node:fs";
import { join } from "node:path";

const pageSource = readFileSync(
  join(process.cwd(), "src/app/page.tsx"),
  "utf8",
);
const gridIndex = pageSource.indexOf(
  'className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"',
);

if (gridIndex === -1) {
  throw new Error("Homepage start-here grid must keep lg:grid-cols-5.");
}

const sectionSource = pageSource.slice(
  gridIndex,
  pageSource.indexOf("</section>", gridIndex),
);
const requiredRoutes = [
  'href="/offers"',
  'href="/offers#games"',
  'href="/best-gpt-sites"',
  'href="/guides"',
  'href="/best-gpt-sites#platform-reviews"',
];

for (const route of requiredRoutes) {
  if (
    !sectionSource.includes(route) &&
    !sectionSource.includes(`href={item.href}`)
  ) {
    throw new Error(`Homepage start-here grid is missing ${route}.`);
  }
}

const gameCardStart = sectionSource.indexOf('href="/offers#games"');
const nextCardStart = sectionSource.indexOf(
  'href="/best-gpt-sites"',
  gameCardStart,
);

if (gameCardStart === -1) {
  throw new Error("Game discovery card must use a literal /offers#games link.");
}

const gameCardLinkStart = sectionSource.lastIndexOf("<Link", gameCardStart);

if (gameCardLinkStart === -1) {
  throw new Error("Game discovery card must render as a Link component.");
}

const gameCardSource = sectionSource.slice(
  gameCardLinkStart,
  nextCardStart === -1 ? sectionSource.length : nextCardStart,
);
const normalizedGameCardSource = gameCardSource.replace(/\s+/g, " ");

const requiredSnippets = [
  "min-h-[186px]",
  'srcSet="/images/browse-games-phone-search-transparent.webp"',
  'src="/images/browse-games-phone-search-transparent.png"',
  'alt=""',
  'aria-hidden="true"',
  "group-hover:scale-105",
  "Game discovery",
  "Browse Games",
  "Start with game hubs for payout snapshots, guide coverage, and related games.",
];

for (const snippet of requiredSnippets) {
  if (
    !gameCardSource.includes(snippet) &&
    !normalizedGameCardSource.includes(snippet)
  ) {
    throw new Error(
      `Game discovery card is missing expected markup: ${snippet}`,
    );
  }
}

console.log("Homepage start-here game card markup looks correct.");
