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
const bestGptSitesPageSource = read("src/app/(seo)/best-gpt-sites/page.tsx");
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

for (const href of ["/guides/how-to-earn", "/guides/best-gpt-sites", "/best-gpt-sites"]) {
  assert(guidesPageSource.includes(href), `guides hub should link ${href}`);
}

assert(
  guidesPageSource.includes("/best-gpt-sites#platform-reviews"),
  "guides hub should link the combined platform reviews section",
);

assert(
  platformsPageSource.includes('permanentRedirect("/best-gpt-sites")'),
  "platforms route should redirect to the combined Best GPT Sites page",
);

for (const href of ["/guides/best-gpt-sites", "#platform-reviews"]) {
  assert(bestGptSitesPageSource.includes(href), `best GPT sites page should link ${href}`);
}

for (const removedHref of ["#live-payouts", "#provider-comparison", "#faq"]) {
  assert(!bestGptSitesPageSource.includes(removedHref), `best GPT sites page should not link removed section ${removedHref}`);
}

for (const href of ["/best-gpt-sites", "/best-gpt-sites#platform-reviews", "/guides/how-to-earn"]) {
  assert(footerSource.includes(href), `footer should expose evergreen hub ${href}`);
}

const gemslootCountryRegistrySource = read("src/lib/gemsloot-countries.ts");
assert(offersPageSource.includes("GEMSLOOT_PUBLIC_COUNTRIES.flatMap"), "offers hub should derive Gemsloot links from the shared country registry");
for (const country of ["US", "GB"]) {
  assert(gemslootCountryRegistrySource.includes(`code: "${country}"`), `Gemsloot country registry should include ${country}`);
}
assert(offersPageSource.includes("/offers/gemsloot/${country.slug}") && offersPageSource.includes("/offers/gemsloot/${country.slug}/${provider.slug}"), "offers hub should link each registered Gemsloot country and provider route");
console.log("public discoverability link checks passed");