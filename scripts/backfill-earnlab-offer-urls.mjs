import { createClient } from "@supabase/supabase-js";
import { fetchAll, loadEnvFiles, parseArgs } from "./_offer-quality-utils.mjs";

loadEnvFiles();
const args = parseArgs();
const apply = Boolean(args.apply);
const dryRun = !apply;

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

function buildEarnLabOfferBacklink(externalId) {
    if (!externalId) return null;
    const taskId = String(externalId).trim().match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-[A-Z]{2})?$/i)?.[1];
    if (!taskId) return null;

    const u = new URL("https://earnlab.com/tasks");
    u.searchParams.set("modal", "task");
    u.searchParams.set("task-id", taskId);
    u.searchParams.set("code", "mac");
    return u.toString();
}

function hasValidTaskId(offerUrl) {
    if (!offerUrl || typeof offerUrl !== "string") return false;
    return /task-id=[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(offerUrl) && offerUrl.includes("code=mac");
}

console.log(`[backfill-earnlab-offer-urls] Starting (mode: ${dryRun ? "DRY-RUN" : "APPLY"})`);

const allRows = await fetchAll(
    db,
    "site_offers",
    "id, external_id, offer_url, status, site:platforms(id, name, slug)",
);

const earnlabRows = allRows.filter((row) => {
    const platformSlug = (Array.isArray(row.site) ? row.site[0]?.slug : row.site?.slug) ?? "";
    return platformSlug.toLowerCase() === "earnlab";
});

const beforeTotal = earnlabRows.length;
const beforeValid = earnlabRows.filter((row) => hasValidTaskId(row.offer_url)).length;
const candidates = earnlabRows.filter((row) => !hasValidTaskId(row.offer_url));

console.log(`[backfill-earnlab-offer-urls] Before Count: Total EarnLab rows: ${beforeTotal}, Valid task-id URLs: ${beforeValid}, Needing backfill: ${candidates.length}`);

let updatedCount = 0;
let skippedCount = 0;
let failedCount = 0;

for (const row of candidates) {
    const newOfferUrl = buildEarnLabOfferBacklink(row.external_id) || buildEarnLabOfferBacklink(row.id);
    if (!newOfferUrl) {
        skippedCount++;
        console.warn(`[backfill-earnlab-offer-urls] Could not extract taskId for offer id=${row.id}, external_id=${row.external_id}`);
        continue;
    }

    if (dryRun) {
        updatedCount++;
        continue;
    }

    const { error } = await db
        .from("site_offers")
        .update({ offer_url: newOfferUrl, updated_at: new Date().toISOString() })
        .eq("id", row.id);

    if (error) {
        failedCount++;
        console.error(`[backfill-earnlab-offer-urls] Failed to update offer ${row.id}: ${error.message}`);
    } else {
        updatedCount++;
    }
}

const afterRows = await fetchAll(
    db,
    "site_offers",
    "id, offer_url, site:platforms(id, slug)",
);

const afterEarnlabRows = afterRows.filter((row) => {
    const platformSlug = (Array.isArray(row.site) ? row.site[0]?.slug : row.site?.slug) ?? "";
    return platformSlug.toLowerCase() === "earnlab";
});

const afterTotal = afterEarnlabRows.length;
const afterValid = afterEarnlabRows.filter((row) => hasValidTaskId(row.offer_url)).length;
const afterMissing = afterEarnlabRows.filter((row) => !hasValidTaskId(row.offer_url)).length;

console.log("\n--- BACKFILL SUMMARY ---");
console.log(`Mode: ${dryRun ? "DRY-RUN (pass --apply to execute)" : "APPLY"}`);
console.log(`Total EarnLab site_offers: ${afterTotal}`);
console.log(`Valid task-id URLs BEFORE: ${beforeValid}`);
console.log(`Proposed/Updated count: ${updatedCount}`);
console.log(`Skipped (no valid external_id): ${skippedCount}`);
console.log(`Failed updates: ${failedCount}`);
console.log(`Valid task-id URLs AFTER: ${dryRun ? beforeValid + updatedCount : afterValid}`);
console.log(`Missing task-id URLs AFTER: ${dryRun ? afterMissing - updatedCount : afterMissing}`);
