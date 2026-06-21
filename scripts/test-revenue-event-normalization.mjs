import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync("src/lib/revenue-events.ts", "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});

const moduleShim = { exports: {} };
const sandbox = {
  exports: moduleShim.exports,
  module: moduleShim,
  require,
};
vm.runInNewContext(output.outputText, sandbox, { filename: "revenue-events.js" });

const { normalizeRevenueEvent, inferRevenueRouteGroup } = moduleShim.exports;

assert.equal(inferRevenueRouteGroup("/"), "homepage");
assert.equal(inferRevenueRouteGroup("/best-gpt-sites"), "best_gpt_sites");
assert.equal(inferRevenueRouteGroup("/games/raid-shadow-legends"), "game");
assert.equal(inferRevenueRouteGroup("/offers/raid-shadow-legends"), "offer");
assert.equal(inferRevenueRouteGroup("/go/platform/gain-gg"), "platform_go");
assert.equal(inferRevenueRouteGroup("/api/postbacks/test"), "postback");

const valid = normalizeRevenueEvent({
  event_name: "cta_click",
  route_path: "/best-gpt-sites?provider=gain",
  route_group: "best_gpt_sites",
  entity_type: "platform",
  entity_slug: "gain-gg",
  cta_location: "best_gpt_sites_primary_card",
  source_context: "best_gpt_sites_monetization",
  target_url: "/go/platform/gain-gg",
  session_key: "sess_test",
  visitor_key: "visitor_test",
  metadata: {
    keep: "value",
    number: 7,
    bool: true,
    nested: { rejected: true },
  },
});

assert.equal(valid.ok, true);
assert.equal(valid.event.event_name, "cta_click");
assert.equal(valid.event.route_path, "/best-gpt-sites?provider=gain");
assert.equal(valid.event.metadata.keep, "value");
assert.equal(valid.event.metadata.number, 7);
assert.equal(valid.event.metadata.bool, true);
assert.equal(valid.event.metadata.nested, undefined);

const badEvent = normalizeRevenueEvent({
  event_name: "signup",
  route_path: "/",
});
assert.equal(badEvent.ok, false);
assert.equal(badEvent.error, "invalid_event_name");

const badRoute = normalizeRevenueEvent({
  event_name: "page_view",
  route_path: "not a url",
});
assert.equal(badRoute.ok, false);
assert.equal(badRoute.error, "invalid_route_path");

console.log("Revenue event normalization checks passed.");
