import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tracker = readFileSync("src/components/analytics/GoogleAnalyticsPageTracker.tsx", "utf8");
const layout = readFileSync("src/app/layout.tsx", "utf8");

assert.match(tracker, /trackEvent\("page_view",\s*\{/s, "tracker should emit a page_view event");
assert.match(tracker, /useEffect\(\(\) => \{[\s\S]*?trackEvent\("page_view"[\s\S]*?\}, \[pathname\]\);/, "page_view should run only when pathname changes");
assert.doesNotMatch(tracker, /useSearchParams/, "query-only changes should not trigger page_view");
assert.doesNotMatch(tracker, /searchParams/, "tracker should not subscribe to query changes");
assert.match(layout, /<Suspense fallback=\{null\}>\s*<GoogleAnalyticsPageTracker \/>\s*<\/Suspense>/s, "root layout should provide the navigation tracker a Suspense boundary");

console.log("SPA page-view tracking regression checks passed");
