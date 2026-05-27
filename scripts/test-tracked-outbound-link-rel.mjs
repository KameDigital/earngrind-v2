import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const source = readFileSync(
  resolve(process.cwd(), "src/components/offers/TrackedOutboundLink.tsx"),
  "utf8",
);

const relDefault = source.match(/rel\s*=\s*"([^"]+)"/)?.[1] ?? "";
const relTokens = new Set(relDefault.split(/\s+/).filter(Boolean));

assert(relTokens.has("noopener"), "TrackedOutboundLink rel should include noopener.");
assert(relTokens.has("noreferrer"), "TrackedOutboundLink rel should include noreferrer.");
assert(relTokens.has("sponsored"), "TrackedOutboundLink rel should include sponsored.");
assert(relTokens.has("nofollow"), "TrackedOutboundLink rel should include nofollow for /go CTAs.");

console.log("tracked outbound link rel checks passed");
