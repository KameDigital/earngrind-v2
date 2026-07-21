import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("SEO data helpers tolerate non-JSON internal Preview responses", async () => {
  const source = await readFile(new URL("../src/app/(seo)/_lib/seo-data.ts", import.meta.url), "utf8");

  assert.match(source, /function isJsonResponse\(response: Response\)/);
  assert.match(source, /if \(!res\.ok \|\| !isJsonResponse\(res\)\) return \[\];/);
  assert.match(source, /if \(res\.status === 404 \|\| !res\.ok \|\| !isJsonResponse\(res\)\) return null;/);
  assert.match(source, /catch \{\s+return \[\];\s+\}/);
  assert.match(source, /catch \{\s+return null;\s+\}/);
});
