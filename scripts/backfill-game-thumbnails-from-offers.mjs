import { createClient } from "@supabase/supabase-js";
import {
    cleanImageUrl,
    fetchAll,
    firstRelated,
    loadEnvFiles,
    normalizeProviderDisplayName,
    normalizeTotalPayout,
    parseArgs,
    writeCsvReport,
    writeJsonReport,
} from "./_offer-quality-utils.mjs";

loadEnvFiles();
const args = parseArgs();
if (args.help) {
    printHelp();
    process.exit(0);
}
const apply = Boolean(args.apply);
const dryRun = !apply;
const overwrite = Boolean(args.overwrite);
const onlyMissing = args["only-missing"] !== false;
const limit = Number.isFinite(Number(args.limit)) ? Math.max(1, Number(args.limit)) : null;
const platformFilter = typeof args.platform === "string" ? args.platform.toLowerCase() : null;
const writeReport = typeof args["write-report"] === "string" ? args["write-report"] : null;
const writeReportCsv = typeof args["write-report-csv"] === "string" ? args["write-report-csv"] : null;

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase URL or service role key.");

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const games = await fetchAll(db, "games", "id, name, slug, thumbnail_url");
const offers = await fetchAll(
    db,
    "site_offers",
    `id, title, game_id, payout_usd, total_payout_usd, image_url, status,
     site:platforms(id, name, slug), provider:providers(id, name, slug)`,
    (query) => query.eq("status", "active").not("image_url", "is", null),
);

const bestOfferByGame = new Map();
const skippedImages = [];
for (const offer of offers) {
    const platform = String(firstRelated(offer.site)?.slug ?? firstRelated(offer.site)?.name ?? "").toLowerCase();
    if (platformFilter && !platform.includes(platformFilter)) continue;
    const imageReview = reviewImageUrl(offer.image_url, {
        title: offer.title,
        platform,
        provider: firstRelated(offer.provider)?.name,
    });
    if (!offer.game_id || !imageReview.ok) {
        skippedImages.push({
            offer_id: offer.id,
            offer_title: offer.title,
            image_url: offer.image_url,
            platform: firstRelated(offer.site)?.slug ?? firstRelated(offer.site)?.name ?? null,
            provider: normalizeProviderDisplayName(firstRelated(offer.provider)?.name),
            skipped_reason: imageReview.reason,
        });
        continue;
    }
    const imageUrl = imageReview.url;
    const payout = normalizeTotalPayout(offer.payout_usd, offer.total_payout_usd);
    const current = bestOfferByGame.get(offer.game_id);
    const candidate = {
        offer_id: offer.id,
        offer_title: offer.title,
        image_url: imageUrl,
        payout_usd: payout,
        platform: firstRelated(offer.site)?.slug ?? firstRelated(offer.site)?.name ?? null,
        provider: normalizeProviderDisplayName(firstRelated(offer.provider)?.name),
        reason_selected: `Highest normalized payout active offer with a usable ${imageReview.domain_type} image URL.`,
        expected_offer_cdn: imageReview.expected,
        image_domain: imageReview.domain,
        image_domain_type: imageReview.domain_type,
    };
    if (!current || rankImageCandidate(candidate) > rankImageCandidate(current)) {
        bestOfferByGame.set(offer.game_id, {
            ...candidate,
        });
    }
}

const candidates = games
    .filter((game) => overwrite || !onlyMissing || !cleanImageUrl(game.thumbnail_url))
    .map((game) => ({ game, offer: bestOfferByGame.get(game.id) }))
    .filter((item) => item.offer)
    .slice(0, limit ?? Number.MAX_SAFE_INTEGER);

const totals = {
    dryRun,
    proposed: candidates.length,
    updated: 0,
    skipped: 0,
    failed: 0,
};
const proposed = [];

for (const { game, offer } of candidates) {
    const row = {
        game_id: game.id,
        game_slug: game.slug,
        game_name: game.name,
        existing_thumbnail_url: game.thumbnail_url,
        selected_image_url: offer.image_url,
        source_offer_id: offer.offer_id,
        source_offer_title: offer.offer_title,
        source_platform: offer.platform,
        source_provider: offer.provider,
        source_payout_usd: offer.payout_usd,
        reason_selected: offer.reason_selected,
        expected_offer_cdn: offer.expected_offer_cdn,
        image_domain: offer.image_domain,
        image_domain_type: offer.image_domain_type,
    };
    proposed.push(row);
    console.log(JSON.stringify({ action: dryRun ? "propose_update" : "update", ...row }));

    if (dryRun) continue;
    if (cleanImageUrl(game.thumbnail_url) && !overwrite) {
        totals.skipped += 1;
        continue;
    }

    try {
        const { error } = await db
            .from("games")
            .update({ thumbnail_url: offer.image_url, updated_at: new Date().toISOString() })
            .eq("id", game.id);
        if (error) throw new Error(error.message);
        totals.updated += 1;
    } catch (error) {
        totals.failed += 1;
        console.error("[backfill-game-thumbnails-from-offers] failed", {
            game_id: game.id,
            message: error instanceof Error ? error.message : String(error),
        });
    }
}

const report = {
    generated_at: new Date().toISOString(),
    dry_run: dryRun,
    options: {
        limit,
        platform: platformFilter,
        only_missing: onlyMissing,
        overwrite,
        apply,
    },
    totals: {
        ...totals,
        skipped_image_candidates: skippedImages.length,
    },
    proposed,
    skipped_images: skippedImages.slice(0, 500),
    workflow: recommendedWorkflow(),
};

if (writeReport) {
    writeJsonReport(writeReport, report);
    console.error(`[backfill-game-thumbnails-from-offers] wrote JSON report to ${writeReport}`);
}
if (writeReportCsv) {
    writeCsvReport(writeReportCsv, proposed);
    console.error(`[backfill-game-thumbnails-from-offers] wrote CSV report to ${writeReportCsv}`);
}

console.log(JSON.stringify({ totals: report.totals, sample: proposed.slice(0, 25), skippedImageSamples: skippedImages.slice(0, 10) }, null, 2));

function reviewImageUrl(value, context = {}) {
    const url = cleanImageUrl(value);
    if (!url) return { ok: false, reason: "empty_or_invalid_url" };
    if (/^data:/i.test(String(value ?? ""))) return { ok: false, reason: "data_uri" };
    if (/\.svg(?:$|[?#])/i.test(url)) return { ok: false, reason: "svg_not_used_for_backfill" };
    if (/(?:pixel|tracking|impression|beacon|1x1|spacer|transparent)\b/i.test(url)) {
        return { ok: false, reason: "tracking_or_placeholder_pattern" };
    }
    if (/(?:logo|brand|provider)[-_/.]/i.test(url) && !/(?:icon|thumb|offer|creative|campaign|package|image)/i.test(url)) {
        return { ok: false, reason: "provider_logo_pattern" };
    }
    if (/(?:placeholder|no[-_]?image|missing[-_]?image)/i.test(url)) {
        return { ok: false, reason: "generic_placeholder_pattern" };
    }

    const domain = getDomain(url);
    const expected = isExpectedOfferImageDomain(domain);
    return {
        ok: true,
        url,
        domain,
        expected,
        domain_type: expected ? "expected_offer_cdn" : "external_offer_image",
        reason: "usable_image_url",
        context,
    };
}

function rankImageCandidate(candidate) {
    const domainScore = candidate.expected_offer_cdn ? 1_000_000 : 0;
    return domainScore + Number(candidate.payout_usd ?? 0);
}

function getDomain(url) {
    try {
        return new URL(url).hostname.toLowerCase();
    } catch {
        return "";
    }
}

function isExpectedOfferImageDomain(domain) {
    return [
        "img.gemsloot.com",
        "api.lootably.com",
        "assets.efusercontent.com",
        "static.offertoro.com",
        "dyncdn.ayet.io",
        "play-lh.googleusercontent.com",
        "main-p.agmcdn.com",
        "cdn.linkprotect.tech",
        "creatives.skylup.swaarm-clients.com",
        "adgem-dashboard-production.s3.us-east-2.amazonaws.com",
    ].some((expected) => domain === expected || domain.endsWith(`.${expected}`));
}

function recommendedWorkflow() {
    return [
        "node scripts/backfill-game-thumbnails-from-offers.mjs --dry-run --limit 250 --write-report reports/game-thumbnail-backfill-preview.json --write-report-csv reports/game-thumbnail-backfill-preview.csv",
        "Inspect the JSON/CSV report before applying.",
        "node scripts/backfill-game-thumbnails-from-offers.mjs --apply --limit 100",
        "node scripts/audit-offer-data-quality.mjs --json --min-payout 0.05",
        "Start with small batches and inspect /games after each apply.",
    ];
}

function printHelp() {
    console.log(`
Backfill missing game thumbnails from the best active offer image.

Dry-run by default. Writes only with --apply.

Options:
  --dry-run                         Review only; default behavior
  --apply                           Update games.thumbnail_url
  --limit 100                       Limit reviewed/applied games
  --platform Gemsloot               Only use offer images from one platform
  --only-missing                    Only update games missing thumbnails; default
  --overwrite                       Allow overwriting existing thumbnails
  --write-report PATH               Write full JSON review report
  --write-report-csv PATH           Write CSV review report

Recommended:
  node scripts/backfill-game-thumbnails-from-offers.mjs --dry-run --limit 250 --write-report reports/game-thumbnail-backfill-preview.json
  node scripts/backfill-game-thumbnails-from-offers.mjs --apply --limit 100
  node scripts/audit-offer-data-quality.mjs --json --min-payout 0.05

Warning:
  Start with small batches and inspect /games after each apply.
`);
}
