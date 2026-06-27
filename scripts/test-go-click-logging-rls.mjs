import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const routeSource = readFileSync(resolve(process.cwd(), "src/app/go/[offerId]/route.ts"), "utf8");

assert.ok(
  routeSource.includes('import { createHash, randomUUID } from "crypto";'),
  "go route should generate click IDs before insert",
);
assert.ok(
  routeSource.includes("const clickId = randomUUID();"),
  "click logging should create a UUID locally",
);
assert.ok(
  routeSource.includes("id: clickId,"),
  "click logging should insert the generated UUID",
);
assert.ok(
  !routeSource.includes('.insert(payload).select("id")'),
  "click logging should not require SELECT after anonymous insert",
);

console.log("Go click logging RLS validation passed");
