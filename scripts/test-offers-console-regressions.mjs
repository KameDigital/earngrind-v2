import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const nextConfig = readFileSync("next.config.mjs", "utf8");
const offerSearchEngine = readFileSync("src/components/offers/OfferSearchEngine.tsx", "utf8");

assert.match(
  nextConfig,
  /script-src[^"]*https:\/\/pagead2\.googlesyndication\.com/,
  "CSP script-src should allow the AdSense loader host.",
);

assert.doesNotMatch(
  offerSearchEngine,
  /<Image\s+src=\{offer\.platform\.logo_url\}/,
  "Offer platform logos should not use next/image for volatile remote provider URLs.",
);

assert.match(
  offerSearchEngine,
  /if\s*\(\s*filters\.q\s*!==\s*debouncedQ\s*\)\s*return;/,
  "Offer search should wait for the debounced query before fetching.",
);

assert.match(
  offerSearchEngine,
  /buildShareableSearchParams\(\s*\{\s*\.\.\.filters,\s*q:\s*debouncedQ\s*\}/,
  "Offer search should write debounced query text into the URL.",
);

const hydrateEffect = offerSearchEngine.match(
  /useEffect\(\(\) => \{\s*const nextFilters = buildFiltersFromSearchParams[\s\S]*?dispatch\(\{\s*type:\s*"HYDRATE"[\s\S]*?\n\s*\}, \[([^\]]*)\]\);/,
);
assert.ok(hydrateEffect, "Offer search should keep a URL hydration effect.");
assert.doesNotMatch(
  hydrateEffect[1],
  /\bfilters\b/,
  "URL hydration should not rerun from local filter changes before the debounced URL write catches up.",
);

console.log("offers console regression checks passed");
