import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const guidePage = read("src/app/guides/[slug]/page.tsx");
const guideHeader = read("src/app/guides/[slug]/GuideHeader.tsx");
const guideOfferCtaBlock = read("src/app/guides/[slug]/GuideOfferCtaBlock.tsx");
const proConversionLayout = read("src/app/guides/[slug]/layouts/ProConversionLayout.tsx");
const guideEditor = read("src/app/app/admin/guides/GuideEditorForm.tsx");
const migration = read("supabase/migrations/20260523000100_add_pro_conversion_guide_layout.sql");
const gitignore = read(".gitignore");

assert(guidePage.includes('layoutStyle === "pro_conversion"'), "guide page should render pro_conversion layout");
assert(guidePage.includes("showPageOfferCtaBlocks"), "guide page should avoid duplicate offer CTA blocks for layout-owned CTAs");
assert(guideHeader.includes('pro_conversion: "Pro Conversion Guide"'), "guide header should label pro_conversion guides");
assert(guideEditor.includes('option value="pro_conversion"'), "admin guide editor should expose pro_conversion layout");
assert(migration.includes("'pro_conversion'"), "migration should allow pro_conversion layout_style");
assert(
  proConversionLayout.includes("href={offerTarget(offer, gameSlug)}"),
  "alternate route links should use each matched offer target URL",
);
assert(
  guideOfferCtaBlock.includes("best.targetUrl") && guideOfferCtaBlock.includes("href={offer.targetUrl}"),
  "GuideOfferCtaBlock should use matched offer target URLs when matches exist",
);
assert(!proConversionLayout.includes("This layout combines"), "pro conversion page copy should not describe the layout implementation");
assert(gitignore.includes("error.log"), "local error.log should be ignored");

console.log("guide layout wiring checks passed");
