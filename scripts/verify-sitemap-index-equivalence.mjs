import { readFile, writeFile } from "node:fs/promises";

const [mode, filePath] = process.argv.slice(2);
const baseUrl = (process.env.SITEMAP_TEST_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const shardIds = ["guides", "offers-0", "offers-1", "games-0", "games-1", "how-to-earn-0", "how-to-earn-1"];

if (!filePath || !["capture", "verify"].includes(mode)) {
  throw new Error("Usage: node scripts/verify-sitemap-index-equivalence.mjs <capture|verify> <baseline-json-path>");
}

if (mode === "capture") {
  const monolith = await fetchXml(`${baseUrl}/sitemap.xml`);
  assert(/<urlset\b/.test(monolith), "baseline /sitemap.xml must be a URL set");

  const shards = await Promise.all(shardIds.map(async (id) => ({
    id,
    urls: extractLocs(await fetchXml(`${baseUrl}/sitemap/${id}.xml`)),
  })));
  const monolithUrls = extractLocs(monolith);
  const shardUrls = shards.flatMap((shard) => shard.urls);
  assertSetEqual(monolithUrls, shardUrls, "baseline monolith and shard union");
  assert(new Set(monolithUrls).size === monolithUrls.length, "baseline monolith should not contain duplicate URLs");

  await writeFile(filePath, JSON.stringify({ monolithUrls, shards }, null, 2));
  console.log(`captured ${monolithUrls.length} monolith URLs across ${shards.length} shards`);
  process.exit(0);
}

const baseline = JSON.parse(await readFile(filePath, "utf8"));
const index = await fetchXml(`${baseUrl}/sitemap.xml`);
assert(/<sitemapindex\b/.test(index), "/sitemap.xml must be a sitemap index");
const indexShardUrls = extractLocs(index);
assert(indexShardUrls.length === shardIds.length, "sitemap index must list every shard");

const currentShards = await Promise.all(shardIds.map(async (id) => ({
  id,
  urls: extractLocs(await fetchXml(`${baseUrl}/sitemap/${id}.xml`)),
})));

for (const current of currentShards) {
  const before = baseline.shards.find((shard) => shard.id === current.id);
  assert(before, `baseline missing shard ${current.id}`);
  assertSetEqual(before.urls, current.urls, `shard ${current.id}`);
}
assertSetEqual(baseline.monolithUrls, currentShards.flatMap((shard) => shard.urls), "old monolith and current shard union");
console.log(`sitemap index equivalence checks passed (${baseline.monolithUrls.length} URLs, ${currentShards.length} shards)`);


async function fetchXml(url) {
  const response = await fetch(url);
  assert(response.ok, `${url} returned ${response.status}`);
  const xml = await response.text();
  assert(/^<\?xml\b/.test(xml), `${url} did not return XML`);
  return xml;
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function assertSetEqual(expected, actual, label) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const missing = [...expectedSet].filter((url) => !actualSet.has(url));
  const extra = [...actualSet].filter((url) => !expectedSet.has(url));
  assert(missing.length === 0 && extra.length === 0, `${label} differs: missing=${missing.length}, extra=${extra.length}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
