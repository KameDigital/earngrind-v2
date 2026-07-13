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
const platformCardStart = sectionSource.indexOf('href="/best-gpt-sites"');
const guidesCardStart = sectionSource.indexOf(
  'href="/guides"',
  platformCardStart,
);
const reviewsCardStart = sectionSource.indexOf(
  'href="/best-gpt-sites#platform-reviews"',
  guidesCardStart,
);

if (gameCardStart === -1) {
  throw new Error("Game discovery card must use a literal /offers#games link.");
}

if (platformCardStart === -1) {
  throw new Error(
    "Platform intel card must use a literal /best-gpt-sites link.",
  );
}

if (guidesCardStart === -1) {
  throw new Error("Completion help card must use a literal /guides link.");
}

const gameCardLinkStart = sectionSource.lastIndexOf("<Link", gameCardStart);
const platformCardLinkStart = sectionSource.lastIndexOf(
  "<Link",
  platformCardStart,
);
const guidesCardLinkStart = sectionSource.lastIndexOf("<Link", guidesCardStart);

if (gameCardLinkStart === -1) {
  throw new Error("Game discovery card must render as a Link component.");
}

if (platformCardLinkStart === -1) {
  throw new Error("Platform intel card must render as a Link component.");
}

if (guidesCardLinkStart === -1) {
  throw new Error("Completion help card must render as a Link component.");
}

const gameCardSource = sectionSource.slice(
  gameCardLinkStart,
  platformCardStart === -1 ? sectionSource.length : platformCardLinkStart,
);
const normalizedGameCardSource = gameCardSource.replace(/\s+/g, " ");
const platformCardSource = sectionSource.slice(
  platformCardLinkStart,
  guidesCardStart === -1
    ? sectionSource.length
    : sectionSource.lastIndexOf("<Link", guidesCardStart),
);
const normalizedPlatformCardSource = platformCardSource.replace(/\s+/g, " ");
const guidesCardSource = sectionSource.slice(
  guidesCardLinkStart,
  reviewsCardStart === -1
    ? sectionSource.length
    : sectionSource.lastIndexOf("<Link", reviewsCardStart),
);
const normalizedGuidesCardSource = guidesCardSource.replace(/\s+/g, " ");

const requiredGameCardSnippets = [
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

const requiredPlatformCardSnippets = [
  "min-h-[186px]",
  "bottom-2 right-2 block h-24 w-24",
  'srcSet="/images/best-gpt-sites-trophy-transparent.webp"',
  'src="/images/best-gpt-sites-trophy-transparent.png"',
  'alt=""',
  'aria-hidden="true"',
  "group-hover:scale-105",
  "Platform intel",
  "Best GPT Sites",
  "Find trusted GPT sites with competitive payouts.",
];

const requiredGuidesCardSnippets = [
  "min-h-[186px]",
  "bottom-2 -right-3 block h-20 w-32",
  'srcSet="/images/game-guides-route-transparent.webp"',
  'src="/images/game-guides-route-transparent.png"',
  'alt=""',
  'aria-hidden="true"',
  "group-hover:scale-105",
  "Completion help",
  "Game Guides",
  "Finish milestones faster.",
];

for (const snippet of requiredGameCardSnippets) {
  if (
    !gameCardSource.includes(snippet) &&
    !normalizedGameCardSource.includes(snippet)
  ) {
    throw new Error(
      `Game discovery card is missing expected markup: ${snippet}`,
    );
  }
}

for (const snippet of requiredPlatformCardSnippets) {
  if (
    !platformCardSource.includes(snippet) &&
    !normalizedPlatformCardSource.includes(snippet)
  ) {
    throw new Error(
      `Platform intel card is missing expected markup: ${snippet}`,
    );
  }
}

for (const snippet of requiredGuidesCardSnippets) {
  if (
    !guidesCardSource.includes(snippet) &&
    !normalizedGuidesCardSource.includes(snippet)
  ) {
    throw new Error(
      `Completion help card is missing expected markup: ${snippet}`,
    );
  }
}

console.log("Homepage start-here enhanced card markup looks correct.");
