import { createClient } from "@supabase/supabase-js";
import {
    fetchAll,
    firstRelated,
    loadEnvFiles,
    parseArgs,
} from "./_offer-quality-utils.mjs";

const DEFAULT_GAIN_GG_REF = "macko";
const GAIN_OFFER_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/;
const NATIVE_GAIN_EXTERNAL_ID_PATTERN = /^gain-native-(.+)-([A-Z]{2})$/i;

loadEnvFiles();

const args = parseArgs();
const apply = args.apply === true;
const dryRun = !apply;
const limit = Number.isFinite(Number(args.limit)) && Number(args.limit) > 0 ? Number(args.limit) : null;
const json = args.json === true;

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase URL or service role key.");

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const rows = await fetchAll(
    db,
    "site_offers",
    `id, external_id, offer_url, status, title,
     site:platforms(id, name, slug),
     provider:providers(id, name, slug),
     game:games(id, name, slug)`,
    (query) => query.order("updated_at", { ascending: false }),
);

const gainRows = rows
    .filter(isGainSiteOffer)
    .slice(0, limit ?? undefined);

const summary = {
    dry_run: dryRun,
    total_gain_offers_scanned: gainRows.length,
    offers_with_generated_links: 0,
    skipped_missing_or_uncertain_id: 0,
    already_correct: 0,
    would_update: 0,
    updated: 0,
    failed: 0,
};

const samples = {
    already_correct: [],
    skipped_missing_or_uncertain_id: [],
    would_update: [],
    failed: [],
};

for (const row of gainRows) {
    const gainOfferId = extractNativeGainOfferIdFromExternalId(row.external_id);
    const deepLink = gainOfferId ? buildGainOfferDeepLink(gainOfferId) : null;

    if (!deepLink) {
        summary.skipped_missing_or_uncertain_id += 1;
        pushSample(samples.skipped_missing_or_uncertain_id, sampleRow(row, { reason: "native Gain offer id not recoverable" }));
        continue;
    }

    summary.offers_with_generated_links += 1;

    if (row.offer_url === deepLink) {
        summary.already_correct += 1;
        pushSample(samples.already_correct, sampleRow(row, { gain_offer_id: gainOfferId, offer_url: deepLink }));
        continue;
    }

    if (dryRun) {
        summary.would_update += 1;
        pushSample(samples.would_update, sampleRow(row, {
            gain_offer_id: gainOfferId,
            current_offer_url: row.offer_url ?? null,
            next_offer_url: deepLink,
        }));
        continue;
    }

    const { error } = await db
        .from("site_offers")
        .update({
            offer_url: deepLink,
            updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

    if (error) {
        summary.failed += 1;
        pushSample(samples.failed, sampleRow(row, { gain_offer_id: gainOfferId, error: error.message }));
        continue;
    }

    summary.updated += 1;
}

if (json) {
    console.log(JSON.stringify({ summary, samples }, null, 2));
} else {
    console.log("Gain.gg deeplink backfill summary");
    console.log(`Mode: ${dryRun ? "dry-run" : "apply"}`);
    console.log(`Total Gain.gg offers scanned: ${summary.total_gain_offers_scanned}`);
    console.log(`Offers with generated links: ${summary.offers_with_generated_links}`);
    console.log(`Skipped missing/uncertain ID: ${summary.skipped_missing_or_uncertain_id}`);
    console.log(`Already correct: ${summary.already_correct}`);
    console.log(`${dryRun ? "Would update" : "Updated"}: ${dryRun ? summary.would_update : summary.updated}`);
    if (summary.failed) console.log(`Failed: ${summary.failed}`);
    if (dryRun) console.log("Apply with: node scripts/backfill-gain-deeplinks.mjs --apply");
}

function getGainOfferRef() {
    const ref = process.env.GAIN_GG_REF?.trim() || DEFAULT_GAIN_GG_REF;
    return /^[A-Za-z0-9_-]{1,64}$/.test(ref) ? ref : DEFAULT_GAIN_GG_REF;
}

function normalizeGainOfferId(value) {
    const id = String(value ?? "").trim();
    if (!id) return null;
    if (id.includes("/") || id.includes("?") || id.includes("#")) return null;
    if (/^(offer_id|undefined|null|unknown)$/i.test(id)) return null;
    return GAIN_OFFER_ID_PATTERN.test(id) ? id : null;
}

function buildGainOfferDeepLink(gainOfferId) {
    const id = normalizeGainOfferId(gainOfferId);
    if (!id) return null;
    const deepLink = new URL(`https://gain.gg/offer/${encodeURIComponent(id)}`);
    deepLink.searchParams.set("ref", getGainOfferRef());
    return deepLink.toString();
}

function extractNativeGainOfferIdFromExternalId(externalId) {
    const match = String(externalId ?? "").trim().match(NATIVE_GAIN_EXTERNAL_ID_PATTERN);
    return match ? normalizeGainOfferId(match[1]) : null;
}

function isGainSiteOffer(row) {
    const site = firstRelated(row.site);
    const keys = [site?.slug, site?.name, row.external_id]
        .map((value) => String(value ?? "").trim().toLowerCase())
        .filter(Boolean);

    return keys.some((value) => value === "gain-gg" || value === "gain.gg" || value.startsWith("gain-"));
}

function sampleRow(row, extra = {}) {
    return {
        id: row.id,
        external_id: row.external_id,
        status: row.status,
        title: row.title,
        site: firstRelated(row.site)?.slug ?? firstRelated(row.site)?.name ?? null,
        provider: firstRelated(row.provider)?.name ?? null,
        game: firstRelated(row.game)?.slug ?? firstRelated(row.game)?.name ?? null,
        ...extra,
    };
}

function pushSample(list, value) {
    if (list.length < 10) list.push(value);
}
