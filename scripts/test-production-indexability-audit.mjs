import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scriptPath = resolve(process.cwd(), "scripts/audit-production-indexability.mjs");
assert(existsSync(scriptPath), "Production indexability audit script should exist.");

const source = readFileSync(scriptPath, "utf8");
for (const expected of [
  "sitemap URL noindex",
  "indexable not in sitemap",
  "canonical mismatch",
  "non-200",
]) {
  assert(source.includes(expected), `Production audit should report ${expected}.`);
}

assert(source.includes("LIVE_AUDIT_MAX_CANDIDATES"), "Production audit should support bounded candidate audits.");
assert(source.includes("guide_search_console_metrics"), "Production audit should include imported Search Console page candidates when available.");

console.log("production indexability audit script checks passed");
