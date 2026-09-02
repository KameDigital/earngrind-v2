import { createClient } from "@supabase/supabase-js";
import { fetchAll, loadEnvFiles } from "./_offer-quality-utils.mjs";
import {
    attachAffiliateParams,
    buildEarnLabOfferBacklink,
    getPlatformAffiliateOverride,
    getPlatformFallbackUrl,
    isEarnLabTarget,
} from "../src/lib/outbound.ts";

loadEnvFiles();

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

console.log("=== CROSS-CHECKING DB QUERY & RESOLUTION LOGIC ===");

// 1. Direct Supabase Query using the user's exact SQL logic via RPC or Supabase JS client
const { data: platforms, error: pError } = await db.from("platforms").select("id, slug, name").eq("slug", "earnlab");
if (pError || !platforms.length) throw new Error("Could not find earnlab platform in DB");
const platform = platforms[0];

const offers = await fetchAll(
    db,
    "site_offers",
    "id, external_id, offer_url, status",
    (query) => query.eq("site_id", platform.id),
);

const totalCount = offers.length;
const properDeeplinkCount = offers.filter((o) => typeof o.offer_url === "string" && o.offer_url.includes("task-id=")).length;

console.log("\n1. Direct Database Query Result:");
console.log(`proper_deeplink: ${properDeeplinkCount}`);
console.log(`total:           ${totalCount}`);
console.log(`Percentage:      ${((properDeeplinkCount / totalCount) * 100).toFixed(2)}%`);

// 2. Test route.ts resolution logic on all EarnLab site_offers
let modalUrlCount = 0;
let fallbackUrlCount = 0;
let malformedUrlCount = 0;

for (const siteOffer of offers) {
    const earnLabOfferModalUrl = isEarnLabTarget(platform)
        ? buildEarnLabOfferBacklink(siteOffer.external_id)
        : null;

    const rawDirectUrl = siteOffer.offer_url;
    const directSiteOfferUrl = rawDirectUrl
        ? attachAffiliateParams(rawDirectUrl, platform)
        : null;

    const platformOverrideUrl = getPlatformAffiliateOverride(platform);

    const outboundUrl = earnLabOfferModalUrl
        ?? directSiteOfferUrl
        ?? platformOverrideUrl
        ?? getPlatformFallbackUrl(platform);

    if (outboundUrl && outboundUrl.includes("task-id=") && outboundUrl.includes("code=mac")) {
        modalUrlCount++;
    } else if (outboundUrl === "https://earnlab.com/r/mac") {
        fallbackUrlCount++;
    } else {
        malformedUrlCount++;
    }
}

console.log("\n2. Outbound Route Resolution Simulation:");
console.log(`Resolved to task-id deep link (code=mac): ${modalUrlCount}`);
console.log(`Resolved to platform fallback (/r/mac):  ${fallbackUrlCount}`);
console.log(`Resolved to malformed or other URL:      ${malformedUrlCount}`);

if (properDeeplinkCount === totalCount && modalUrlCount === totalCount) {
    console.log("\nRESULT: SUCCESS! Reality matches the script count 100%. Zero silent fallbacks to /r/mac.");
} else {
    console.error("\nRESULT: DISCREPANCY FOUND!", { totalCount, properDeeplinkCount, modalUrlCount });
    process.exit(1);
}
