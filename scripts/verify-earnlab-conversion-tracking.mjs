import { createClient } from "@supabase/supabase-js";
import { fetchAll, loadEnvFiles } from "./_offer-quality-utils.mjs";
import { isBotUserAgent } from "../src/lib/bot-detection.ts";

loadEnvFiles();

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

function hasValidTaskId(offerUrl) {
    if (!offerUrl || typeof offerUrl !== "string") return false;
    return /task-id=[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(offerUrl) && offerUrl.includes("code=mac");
}

console.log("=== EARNLAB CONVERSION TRACKING VERIFICATION ===");

const allRows = await fetchAll(
    db,
    "site_offers",
    "id, external_id, offer_url, site:platforms(id, name, slug)",
);

const earnlabRows = allRows.filter((row) => {
    const platformSlug = (Array.isArray(row.site) ? row.site[0]?.slug : row.site?.slug) ?? "";
    return platformSlug.toLowerCase() === "earnlab";
});

const totalRows = earnlabRows.length;
const validRows = earnlabRows.filter((row) => hasValidTaskId(row.offer_url)).length;
const missingRows = earnlabRows.filter((row) => !hasValidTaskId(row.offer_url)).length;

console.log(`Total EarnLab site_offers rows: ${totalRows}`);
console.log(`Rows with valid task-id deep link (code=mac): ${validRows}`);
console.log(`Rows missing valid task-id deep link: ${missingRows}`);

// Verify bot detection helper
const sampleBots = [
    "meta-externalagent/1.1",
    "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)",
    "PerplexityBot/1.0",
    "Bytespider",
    "curl/7.68.0",
    "python-requests/2.25.1",
];
const sampleHumans = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
];

const botTestFailures = sampleBots.filter((bot) => !isBotUserAgent(bot));
const humanTestFailures = sampleHumans.filter((human) => isBotUserAgent(human));

if (botTestFailures.length > 0 || humanTestFailures.length > 0) {
    console.error("Bot detection unit test failed!", { botTestFailures, humanTestFailures });
    process.exit(1);
} else {
    console.log("Bot detection verification: PASSED (all bots correctly identified, humans permitted)");
}

if (missingRows > 0) {
    console.error(`VERIFICATION FAILED: ${missingRows} EarnLab rows are still missing valid task-id deep links!`);
    process.exit(1);
} else {
    console.log("VERIFICATION PASSED: 100% of EarnLab site_offers have valid task-id deep links.");
}
