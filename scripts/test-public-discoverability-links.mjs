import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const offersPageSource = read("src/app/offers/page.tsx");
const guidesPageSource = read("src/app/guides/page.tsx");
const platformsPageSource = read("src/app/platforms/page.tsx");
const footerSource = read("src/components/layout/Footer.tsx");

assert(
  offersPageSource.includes("GEMSLOOT_PUBLIC_PROVIDERS"),
  "offers hub should build Gemsloot provider links from the shared provider list",
);
assert(
  offersPageSource.includes("EARNLAB_GALLERY_COUNTRIES"),
  "offers hub should expose supported EarnLab country pages",
);
for (const href of [
  "/offers/gemsloot/us",
  "/offers/gain/us",
  "/guides/how-to-earn",
  "/best-gain-gg-offers",
  "/highest-paying-gpt-games",
  "/best-freecash-games",
  "/best-money-making-games",
]) {
  assert(offersPageSource.includes(href), `offers hub should link ${href}`);
}

for (const href of ["/guides/how-to-earn", "/guides/best-gpt-sites", "/best-gpt-sites", "/platforms"]) {
  assert(guidesPageSource.includes(href), `guides hub should link ${href}`);
}

for (const href of ["/best-gpt-sites", "/guides/best-gpt-sites", "/best-gain-gg-offers", "/best-freecash-games"]) {
  assert(platformsPageSource.includes(href), `platforms hub should link ${href}`);
}

for (const href of ["/best-gpt-sites", "/guides/how-to-earn"]) {
  assert(footerSource.includes(href), `footer should expose evergreen hub ${href}`);
}

console.log("public discoverability link checks passed");
