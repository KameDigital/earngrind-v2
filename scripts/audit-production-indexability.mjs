import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnvFile(".env.local");
loadEnvFile(".env.production");

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://earngrind.com").replace(/\/$/, "");
const maxCandidates = readPositiveInteger(process.env.LIVE_AUDIT_MAX_CANDIDATES, 120);
const maxSitemapUrls = readPositiveInteger(process.env.LIVE_AUDIT_MAX_SITEMAP_URLS, 120);
const concurrency = readPositiveInteger(process.env.LIVE_AUDIT_CONCURRENCY, 6);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const sitemapUrls = await fetchSitemapUrls();
const sitemapSet = new Set(sitemapUrls);
const candidates = await buildCandidateUrls(sitemapUrls);
const sitemapSample = sitemapUrls.slice(0, maxSitemapUrls);

const [sitemapAudit, candidateAudit] = await Promise.all([
  auditUrls(sitemapSample),
  auditUrls(candidates),
]);

const sitemapNoindex = sitemapAudit.filter((item) => item.inSitemap && item.robots.includes("noindex"));
const sitemapNon200 = sitemapAudit.filter((item) => item.inSitemap && item.status !== 200);
const sitemapCanonicalMismatch = sitemapAudit.filter((item) => {
  if (!item.inSitemap || !item.canonical) return false;
  return normalizeUrl(item.canonical) !== normalizeUrl(item.url);
});
const indexableNotInSitemap = candidateAudit.filter((item) => {
  if (item.inSitemap || item.status !== 200 || item.robots.includes("noindex")) return false;
  if (!item.canonical) return true;
  return normalizeUrl(item.canonical) === normalizeUrl(item.url);
});

printSection("Production Indexability Audit");
console.log(`Site: ${siteUrl}`);
console.log(`Sitemap URLs found: ${sitemapUrls.length}`);
console.log(`Sitemap URLs audited: ${sitemapAudit.length}`);
console.log(`Candidate URLs audited: ${candidateAudit.length}`);
console.log(`sitemap URL noindex: ${sitemapNoindex.length}`);
console.log(`sitemap URL non-200: ${sitemapNon200.length}`);
console.log(`sitemap canonical mismatch: ${sitemapCanonicalMismatch.length}`);
console.log(`indexable not in sitemap: ${indexableNotInSitemap.length}`);

printExamples("sitemap URL noindex", sitemapNoindex);
printExamples("non-200", sitemapNon200);
printExamples("canonical mismatch", sitemapCanonicalMismatch);
printExamples("indexable not in sitemap", indexableNotInSitemap);

async function fetchSitemapUrls() {
  const visited = new Set();
  const urls = [];
  await visit(`${siteUrl}/sitemap.xml`);
  return urls;

  async function visit(url) {
    if (visited.has(url)) return;
    visited.add(url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch sitemap URL ${url}: ${response.status}`);
    const xml = await response.text();
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]).filter(Boolean);
    if (/<sitemapindex\b/i.test(xml)) {
      await Promise.all(locs.map((loc) => visit(loc)));
      return;
    }
    urls.push(...locs);
  }
}

async function buildCandidateUrls(currentSitemapUrls) {
  const urls = new Set(currentSitemapUrls.slice(0, Math.ceil(maxCandidates / 3)));
  for (const path of [
    "/",
    "/offers",
    "/games",
    "/guides",
    "/guides/how-to-earn",
    "/blog",
    "/best-gpt-sites",
  ]) {
    urls.add(`${siteUrl}${path === "/" ? "" : path}`);
  }

  if (supabase) {
    await addRows("games", "slug, updated_at", (row) => [
      `/games/${row.slug}`,
      `/offers/${row.slug}`,
      `/guides/how-to-earn/${row.slug}`,
    ], urls);
    await addRows("guides", "slug, updated_at", (row) => [`/guides/${row.slug}`], urls, (query) =>
      query.eq("status", "published"),
    );
    await addRows("guide_search_console_metrics", "page_url, created_at", (row) => [row.page_url], urls);
  }

  return Array.from(urls).slice(0, maxCandidates);
}

async function addRows(table, select, toPaths, urls, refine = (query) => query) {
  const { data, error } = await refine(
    supabase.from(table).select(select).order(select.includes("updated_at") ? "updated_at" : "created_at", { ascending: false }).limit(80),
  );
  if (error) {
    console.warn(`[audit-production-indexability] skipped ${table}: ${error.message}`);
    return;
  }
  for (const row of data ?? []) {
    for (const pathOrUrl of toPaths(row)) {
      if (!pathOrUrl) continue;
      urls.add(pathOrUrl.startsWith("http") ? pathOrUrl : `${siteUrl}${pathOrUrl}`);
    }
  }
}

async function auditUrls(urls) {
  let index = 0;
  const results = [];
  async function worker() {
    while (index < urls.length) {
      const url = urls[index++];
      results.push(await auditUrl(url));
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results.sort((a, b) => a.url.localeCompare(b.url));
}

async function auditUrl(url) {
  try {
    const response = await fetch(url, { redirect: "manual" });
    const text = await response.text();
    const robots = extractMeta(text, "robots").toLowerCase();
    const canonical = extractCanonical(text);
    return {
      url,
      status: response.status,
      robots,
      canonical,
      inSitemap: sitemapSet.has(url),
    };
  } catch (error) {
    return {
      url,
      status: 0,
      robots: "",
      canonical: "",
      inSitemap: sitemapSet.has(url),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function extractMeta(html, name) {
  return html.match(new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`, "i"))?.[1] ?? "";
}

function extractCanonical(html) {
  return html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1] ?? "";
}

function normalizeUrl(value) {
  return value.replace(/\/$/, "");
}

function printSection(title) {
  console.log(`\n== ${title} ==`);
}

function printExamples(label, items) {
  console.log(`\n${label}:`);
  if (items.length === 0) {
    console.log("  none");
    return;
  }
  for (const item of items.slice(0, 20)) {
    const details = [
      `status=${item.status}`,
      `robots=${item.robots || "none"}`,
      `canonical=${item.canonical || "none"}`,
      `in_sitemap=${item.inSitemap}`,
      item.error ? `error=${item.error}` : null,
    ].filter(Boolean).join(" ");
    console.log(`  ${item.url} :: ${details}`);
  }
}

function readPositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function loadEnvFile(fileName) {
  const path = resolve(process.cwd(), fileName);
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] != null) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}
