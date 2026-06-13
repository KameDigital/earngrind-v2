import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const routePath = path.join(process.cwd(), "src/app/api/offers/game/[slug]/route.ts");
const source = await readFile(routePath, "utf8");

assert.match(
  source,
  /(?:^|\n)\s*export const revalidate = 120;/,
  "game offers API should advertise a 120 second revalidation window",
);

assert.doesNotMatch(
  source,
  /force-dynamic|no-store/,
  "game offers API should not force cache misses for crawler-accessible data",
);

assert.match(
  source,
  /"Cache-Control": "public, s-maxage=120, stale-while-revalidate=600"/,
  "game offers API should be CDN-cacheable with stale revalidation",
);
