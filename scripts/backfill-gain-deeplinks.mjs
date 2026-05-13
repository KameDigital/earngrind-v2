import { createClient } from "@supabase/supabase-js";
import {
    fetchAll,
    firstRelated,
    loadEnvFiles,
    parseArgs,
} from "./_offer-quality-utils.mjs";

const DEFAULT_GAIN_GG_REF = "macko";
const GAIN_OFFER_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/;
const ORIGINAL_GAIN_OFFER_ID_PATTERN = /^\d{1,12}-[a-f0-9]{4}$/i;
const NATIVE_GAIN_EXTERNAL_ID_PATTERN = /^gain-native-(.+)-([A-Z]{2})$/i;
const NON_NATIVE_GAIN_EXTERNAL_ID_PATTERN = /^(?:gain-)?(?:adtowall|asmwall|cpx|lootably|mychips|revu)-/i;

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
    native_recoverable_by_original_gain_id: 0,
    skipped_wall_provider_campaign_id: 0,
    skipped_metadata_missing: 0,
    skipped_ambiguous_id: 0,
    already_correct: 0,
    would_update: 0,
    updated: 0,
    failed: 0,
};

const samples = {
    already_correct: [],
    would_update: [],
    skipped_wall_provider_campaign_id: {},
    skipped_metadata_missing: {},
    skipped_ambiguous_id: {},
    failed: [],
};

for (const row of gainRows) {
    const decision = resolveGainDeepLinkDecision(row);
    const gainOfferId = decision.gainOfferId;
    const deepLink = gainOfferId ? buildGainOfferDeepLink(gainOfferId) : null;

    if (!deepLink) {
        if (decision.reason === "wall_provider_campaign_id") {
            summary.skipped_wall_provider_campaign_id += 1;
            pushProviderSample(samples.skipped_wall_provider_campaign_id, row, decision.message);
        } else if (decision.reason === "metadata_missing") {
            summary.skipped_metadata_missing += 1;
            pushProviderSample(samples.skipped_metadata_missing, row, decision.message);
        } else {
            summary.skipped_ambiguous_id += 1;
            pushProviderSample(samples.skipped_ambiguous_id, row, decision.message);
        }
        continue;
    }

    summary.native_recoverable_by_original_gain_id += 1;

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
    console.log(`Native Gain offers recoverable by original Gain ID: ${summary.native_recoverable_by_original_gain_id}`);
    console.log(`Already correct: ${summary.already_correct}`);
    console.log(`${dryRun ? "Would update" : "Updated"}: ${dryRun ? summary.would_update : summary.updated}`);
    console.log(`Skipped wall/provider campaign IDs: ${summary.skipped_wall_provider_campaign_id}`);
    console.log(`Skipped missing metadata: ${summary.skipped_metadata_missing}`);
    console.log(`Skipped ambiguous IDs: ${summary.skipped_ambiguous_id}`);
    if (summary.failed) console.log(`Failed: ${summary.failed}`);
    if (summary.skipped_wall_provider_campaign_id || summary.skipped_metadata_missing || summary.skipped_ambiguous_id) {
        console.log("Sample skipped rows by provider:");
        console.log(JSON.stringify({
            wall_provider_campaign_id: samples.skipped_wall_provider_campaign_id,
            metadata_missing: samples.skipped_metadata_missing,
            ambiguous_id: samples.skipped_ambiguous_id,
        }, null, 2));
    }
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

function normalizeOriginalGainOfferId(value) {
    const id = normalizeGainOfferId(value);
    return id && ORIGINAL_GAIN_OFFER_ID_PATTERN.test(id) ? id : null;
}

function buildGainOfferDeepLink(gainOfferId) {
    const id = normalizeOriginalGainOfferId(gainOfferId);
    if (!id) return null;
    const deepLink = new URL(`https://gain.gg/offer/${encodeURIComponent(id)}`);
    deepLink.searchParams.set("ref", getGainOfferRef());
    return deepLink.toString();
}

function extractNativeGainOfferIdFromExternalId(externalId) {
    const match = String(externalId ?? "").trim().match(NATIVE_GAIN_EXTERNAL_ID_PATTERN);
    return match ? normalizeOriginalGainOfferId(match[1]) : null;
}

function extractNativeGainOfferId(row) {
    return resolveGainDeepLinkDecision(row).gainOfferId;
}

function resolveGainDeepLinkDecision(row) {
    const externalId = String(row.external_id ?? "").trim();
    if (!externalId) {
        return {
            gainOfferId: null,
            reason: "metadata_missing",
            message: "external_id is missing and site_offers has no raw metadata column to recover an original Gain offer id",
        };
    }

    if (NON_NATIVE_GAIN_EXTERNAL_ID_PATTERN.test(externalId) || isNonNativeGainProvider(row)) {
        return {
            gainOfferId: null,
            reason: "wall_provider_campaign_id",
            message: "stored id belongs to a downstream wall/provider campaign, not a confirmed Gain /offer id",
        };
    }

    const wrappedId = extractNativeGainOfferIdFromExternalId(externalId);
    if (wrappedId) {
        return {
            gainOfferId: wrappedId,
            reason: "native_wrapped_gain_id",
            message: "recovered original Gain offer id from gain-native-{id}-{country}",
        };
    }

    if (isGainSite(row) && isNativeGainProvider(row)) {
        const directId = normalizeOriginalGainOfferId(externalId);
        if (directId) {
            return {
                gainOfferId: directId,
                reason: "native_direct_gain_id",
                message: "recovered original Gain offer id from direct external_id",
            };
        }

        return {
            gainOfferId: null,
            reason: "ambiguous_id",
            message: "native Gain/Torox row, but external_id does not match the original Gain offer id shape",
        };
    }

    return {
        gainOfferId: null,
        reason: "metadata_missing",
        message: "site/provider context is not native Gain and site_offers has no raw metadata column with an original Gain offer id",
    };
}

function isGainSiteOffer(row) {
    const site = firstRelated(row.site);
    const keys = [site?.slug, site?.name, row.external_id]
        .map((value) => String(value ?? "").trim().toLowerCase())
        .filter(Boolean);

    return keys.some((value) => value === "gain-gg" || value === "gain.gg" || value.startsWith("gain-"));
}

function isGainSite(row) {
    const site = firstRelated(row.site);
    return targetKeys(site).some((key) => key === "gain" || key === "gaingg" || key === "gain-gg");
}

function isNativeGainProvider(row) {
    const provider = firstRelated(row.provider);
    return targetKeys(provider).some((key) => key === "torox" || key === "gain" || key === "gaingg" || key === "gain-gg");
}

function isNonNativeGainProvider(row) {
    const provider = firstRelated(row.provider);
    return targetKeys(provider).some((key) => [
        "adtowall",
        "asmwall",
        "cpxresearch",
        "lootably",
        "mychips",
        "revenueuniverse",
        "revu",
    ].includes(key));
}

function targetKeys(target) {
    return [target?.slug, target?.name]
        .map((value) => String(value ?? "").trim().toLowerCase())
        .filter(Boolean)
        .flatMap((value) => {
            const compact = value.replace(/[^a-z0-9]+/g, "");
            return compact && compact !== value ? [value, compact] : [value];
        });
}

function sampleRow(row, extra = {}) {
    return {
        id: row.id,
        title: row.title,
        provider: firstRelated(row.provider)?.name ?? null,
        external_id: row.external_id,
        current_offer_url: row.offer_url ?? null,
        status: row.status,
        site: firstRelated(row.site)?.slug ?? firstRelated(row.site)?.name ?? null,
        game: firstRelated(row.game)?.slug ?? firstRelated(row.game)?.name ?? null,
        ...extra,
    };
}

function pushSample(list, value) {
    if (list.length < 10) list.push(value);
}

function pushProviderSample(record, row, reason) {
    const provider = firstRelated(row.provider)?.name ?? "Unknown";
    const list = record[provider] ?? [];
    if (list.length < 5) {
        list.push(sampleRow(row, { skip_reason: reason }));
        record[provider] = list;
    }
}
