const baseUrl = (process.env.SITEMAP_TEST_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

const rootResponse = await fetch(`${baseUrl}/sitemap.xml`);
assert(rootResponse.ok, `/sitemap.xml returned ${rootResponse.status}`);

const rootXml = await rootResponse.text();
assert(/^<\?xml\b/.test(rootXml), "/sitemap.xml should return XML");
assert(/<sitemapindex\b/.test(rootXml), "/sitemap.xml should return a sitemap index");
assert(!/<urlset\b/.test(rootXml), "/sitemap.xml should not return a merged URL set");

const shardUrls = extractLocs(rootXml);
assert(shardUrls.length > 0, "sitemap index should include at least one shard");

for (const shardUrl of shardUrls) {
  assert(new URL(shardUrl).pathname.match(/^\/sitemap\/[^/]+\.xml$/), `unexpected sitemap shard URL: ${shardUrl}`);
  const shardResponse = await fetch(shardUrl);
  assert(shardResponse.ok, `${shardUrl} returned ${shardResponse.status}`);
  const shardXml = await shardResponse.text();
  assert(/^<\?xml\b/.test(shardXml), `${shardUrl} should return XML`);
  assert(/<urlset\b/.test(shardXml), `${shardUrl} should return a URL set`);
  assert(!/<sitemapindex\b/.test(shardXml), `${shardUrl} should not return a sitemap index`);
}

console.log(`sitemap index regression checks passed (${shardUrls.length} shards)`);

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
