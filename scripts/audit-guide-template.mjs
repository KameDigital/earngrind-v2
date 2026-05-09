import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnvFile(".env.local");
loadEnvFile(".env.production");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const { data: guides, error } = await supabase
  .from("guides")
  .select(`
    id, title, slug, excerpt, body_md, updated_at, max_payout_usd,
    difficulty, estimated_time, payout_verified_at,
    game:games(id, name, slug, thumbnail_url)
  `)
  .eq("status", "published")
  .order("updated_at", { ascending: false });

if (error) {
  console.error(`Failed to fetch published guides: ${error.message}`);
  process.exit(1);
}

const rows = (guides ?? []).map((guide) => {
  const game = Array.isArray(guide.game) ? guide.game[0] : guide.game;
  const hasTitle = Boolean(guide.title?.trim());
  const hasExcerpt = Boolean(guide.excerpt?.trim());
  const hasUpdatedDate = Boolean(guide.updated_at);
  const hasRelatedGame = Boolean(game?.slug);
  const hasHeroImageOrGameThumbnail = Boolean(game?.thumbnail_url);
  const ctaTarget = game?.slug ? `/games/${game.slug}` : "/offers";
  const hasFaqLikeContent = /(^|\n)#{2,4}\s+.*faq|frequently asked|<h[2-4][^>]*>.*faq/i.test(guide.body_md ?? "");
  const warnings = [
    !hasTitle ? "missing title" : null,
    !hasExcerpt ? "missing excerpt" : null,
    !hasHeroImageOrGameThumbnail ? "missing hero image/game thumbnail" : null,
    !hasRelatedGame ? "missing related game" : null,
    !hasUpdatedDate ? "missing updated date" : null,
  ].filter(Boolean);

  return {
    slug: guide.slug ?? "(missing slug)",
    hasTitle,
    hasExcerpt,
    hasHeroImageOrGameThumbnail,
    hasRelatedGame,
    ctaTarget,
    hasFaqLikeContent,
    hasUpdatedDate,
    warnings,
  };
});

console.log("Guide Template Audit");
console.log(`Published curated guides checked: ${rows.length}`);
console.log(`Guides with title: ${count(rows, "hasTitle")}`);
console.log(`Guides with excerpt: ${count(rows, "hasExcerpt")}`);
console.log(`Guides with hero image or game thumbnail: ${count(rows, "hasHeroImageOrGameThumbnail")}`);
console.log(`Guides with related game: ${count(rows, "hasRelatedGame")}`);
console.log(`Guides with FAQ-like content: ${count(rows, "hasFaqLikeContent")}`);
console.log(`Guides with updated date: ${count(rows, "hasUpdatedDate")}`);
console.log("");

for (const row of rows) {
  console.log(`${row.slug}`);
  console.log(`  title: ${yesNo(row.hasTitle)}`);
  console.log(`  excerpt: ${yesNo(row.hasExcerpt)}`);
  console.log(`  hero image/game thumbnail: ${yesNo(row.hasHeroImageOrGameThumbnail)}`);
  console.log(`  related game: ${yesNo(row.hasRelatedGame)}`);
  console.log(`  CTA target: ${row.ctaTarget}`);
  console.log(`  FAQ-like content: ${yesNo(row.hasFaqLikeContent)}`);
  console.log(`  updated date: ${yesNo(row.hasUpdatedDate)}`);
  if (row.warnings.length > 0) console.log(`  warnings: ${row.warnings.join(", ")}`);
}

function count(rowsToCount, field) {
  return rowsToCount.filter((row) => row[field]).length;
}

function yesNo(value) {
  return value ? "yes" : "no";
}

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}
