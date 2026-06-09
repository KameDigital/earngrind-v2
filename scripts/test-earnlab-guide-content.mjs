import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const sourcePath = join(process.cwd(), "src", "lib", "gpt-site-guides.ts");
const articlePath = join(process.cwd(), "src", "lib", "earnlab-contextual-guide.ts");
const pagePath = join(process.cwd(), "src", "app", "guides", "best-gpt-sites", "[slug]", "page.tsx");
const source = `${readFileSync(sourcePath, "utf8")}\n${readFileSync(articlePath, "utf8")}\n${readFileSync(pagePath, "utf8")}`;

const requiredText = [
  "EarnLab Guide for Offers Plus Original Games",
  "earnlab-preview-layout",
  "Preview navigation",
  "Contextual HTML preview",
  "Earn first, game second",
  "$50 / $2,500",
  "Offerwall ecosystem and how to compare it",
  "Tracking, hold periods, and offer hygiene",
  "Surveys, payout expectations, and completion reality",
  "Original games and race mechanics",
  "The dual-wallet system",
  "Withdrawals, limits, fees, KYC, and timing",
  "Security, fraud controls, and legal considerations",
  "Open questions and limitations",
  "Use EarnLab as an offerwall-first GPT site with optional game-style features",
];

const requiredAssets = [
  "earnlab-guide-hero.jpg",
  "earnlab-platform-overview.jpg",
  "earnlab-offerwall-comparison.jpg",
  "earnlab-mystery-boxes.jpg",
  "earnlab-mines.jpg",
  "earnlab-keno.jpg",
  "earnlab-monthly-race.jpg",
  "earnlab-daily-race.jpg",
  "earnlab-dual-wallet.jpg",
  "earnlab-rewards-withdrawals.jpg",
];

const missingText = requiredText.filter((text) => !source.includes(text));
const assetDir = join(process.cwd(), "public", "images", "guides", "gpt-sites", "earnlab-contextual");
const missingAssets = requiredAssets.filter((asset) => !existsSync(join(assetDir, asset)));

if (missingText.length || missingAssets.length) {
  if (missingText.length) {
    console.error("Missing EarnLab guide text markers:");
    for (const text of missingText) console.error(`- ${text}`);
  }
  if (missingAssets.length) {
    console.error("Missing EarnLab guide public assets:");
    for (const asset of missingAssets) console.error(`- ${asset}`);
  }
  process.exit(1);
}

console.log("EarnLab guide content markers and public assets are present.");
