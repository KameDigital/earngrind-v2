import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "src/lib/provider-gallery/upsert.ts"), "utf8");
const refreshScript = readFileSync(resolve(process.cwd(), "scripts/refresh-provider-gallery.ts"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  source.includes("siteScopedExternalId") &&
    source.includes(".eq(\"site_id\", options.siteId)") &&
    source.includes(".eq(\"external_id\", options.externalId)") &&
    source.includes("if (siteScopedExternalId) return siteScopedExternalId"),
  "provider-gallery importer should find an existing row by site_id + external_id before inserting, even if the provider label changed",
);

assert(
  source.includes("completion_count") &&
    source.includes("offer.completionCount") &&
    source.includes("existing.completion_count") &&
    source.includes("payload.completion_count"),
  "provider-gallery importer should persist normalized completion_count and include it in change detection",
);

assert(
  refreshScript.includes("completionCount: offer.completionCount"),
  "bulk provider-gallery refresh should pass Gemsloot completionCount into the shared importer",
);

console.log("Provider gallery external-id lookup guard looks correct");
