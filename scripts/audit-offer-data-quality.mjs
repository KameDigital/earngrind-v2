import { createClient } from "@supabase/supabase-js";
import {
    cleanImageUrl,
    fetchAll,
    firstRelated,
    groupProviderVariants,
    increment,
    isLowPayout,
    loadEnvFiles,
    normalizeProviderDisplayName,
    normalizeTotalPayout,
    parseArgs,
    toNumber,
    writeJsonReport,
} from "./_offer-quality-utils.mjs";

loadEnvFiles();
const args = parseArgs();
const minPayout = Number(args["min-payout"] ?? 0.05);
const platformFilter = typeof args.platform === "string" ? args.platform.toLowerCase() : null;
const json = Boolean(args.json);
const reportPath = typeof args["write-report"] === "string" ? args["write-report"] : null;

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase URL or service role key.");

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const siteOffers = await fetchAll(
    db,
    "site_offers",
    `id, external_id, title, payout_usd, total_payout_usd, goal_text, image_url, offer_url, countries, devices, status, game_id,
     site:platforms(id, name, slug), provider:providers(id, name, slug), game:games(id, name, slug, thumbnail_url),
     tasks:site_offer_tasks(id)`,
);
const games = await fetchAll(db, "games", "id, name, slug, thumbnail_url");
const providers = await fetchAll(db, "providers", "id, name, slug, is_active");
const activeOffers = siteOffers
    .filter((row) => row.status === "active")
    .filter((row) => {
        if (!platformFilter) return true;
        const site = firstRelated(row.site);
        return String(site?.slug ?? site?.name ?? "").toLowerCase().includes(platformFilter);
    });

const missingTasks = {};
const missingImages = {};
const missingUrls = {};
const ultraLow = {};
const totalBelowPayout = [];
const lowPayoutSamples = [];
const missingTaskSamples = [];
const missingImageSamples = [];
const missingUrlSamples = [];
const providerNames = [];

for (const row of activeOffers) {
    const site = firstRelated(row.site);
    const provider = normalizeProviderDisplayName(firstRelated(row.provider)?.name);
    const platform = site?.slug ?? site?.name ?? "unknown";
    const groupKey = `${platform} / ${provider}`;
    providerNames.push(firstRelated(row.provider)?.name);

    if (!Array.isArray(row.tasks) || row.tasks.length === 0) {
        increment(missingTasks, groupKey);
        if (missingTaskSamples.length < 25) missingTaskSamples.push(sampleOffer(row));
    }
    if (!cleanImageUrl(row.image_url)) {
        increment(missingImages, groupKey);
        if (missingImageSamples.length < 25) missingImageSamples.push(sampleOffer(row));
    }
    if (!row.offer_url) {
        increment(missingUrls, platform);
        if (missingUrlSamples.length < 25) missingUrlSamples.push(sampleOffer(row));
    }
    if (isLowPayout(row, minPayout)) {
        increment(ultraLow, groupKey);
        if (lowPayoutSamples.length < 25) lowPayoutSamples.push({ ...sampleOffer(row), payout_usd: row.payout_usd, total_payout_usd: row.total_payout_usd });
    }

    const payout = toNumber(row.payout_usd);
    const total = toNumber(row.total_payout_usd, payout);
    if (total < payout) {
        totalBelowPayout.push({ ...sampleOffer(row), payout_usd: payout, total_payout_usd: total, suggested_total_payout_usd: normalizeTotalPayout(payout, total) });
    }
}

const offerImagesByGame = new Map();
for (const row of activeOffers) {
    const image = cleanImageUrl(row.image_url);
    if (!row.game_id || !image) continue;
    const payout = normalizeTotalPayout(row.payout_usd, row.total_payout_usd);
    const current = offerImagesByGame.get(row.game_id);
    if (!current || payout > current.payout_usd) {
        offerImagesByGame.set(row.game_id, {
            game_id: row.game_id,
            game_slug: firstRelated(row.game)?.slug,
            game_name: firstRelated(row.game)?.name,
            image_url: image,
            source_offer_id: row.id,
            platform: firstRelated(row.site)?.slug,
            provider: normalizeProviderDisplayName(firstRelated(row.provider)?.name),
            payout_usd: payout,
        });
    }
}

const gamesMissingThumbnail = games.filter((game) => !cleanImageUrl(game.thumbnail_url));
const thumbnailCandidates = gamesMissingThumbnail
    .map((game) => offerImagesByGame.get(game.id))
    .filter(Boolean)
    .slice(0, 100);

const payload = {
    generatedAt: new Date().toISOString(),
    filters: { platform: platformFilter, minPayout },
    totals: {
        activeOffers: activeOffers.length,
        games: games.length,
        providers: providers.length,
        gamesMissingThumbnail: gamesMissingThumbnail.length,
        gamesWithOfferThumbnailCandidate: gamesMissingThumbnail.filter((game) => offerImagesByGame.has(game.id)).length,
    },
    issues: {
        missingTasks,
        missingImages,
        missingOfferUrls: missingUrls,
        ultraLowPayouts: ultraLow,
        totalPayoutBelowPayout: totalBelowPayout.length,
        providerVariants: groupProviderVariants(providerNames),
    },
    samples: {
        missingTasks: missingTaskSamples,
        missingImages: missingImageSamples,
        missingOfferUrls: missingUrlSamples,
        ultraLowPayouts: lowPayoutSamples,
        totalPayoutBelowPayout: totalBelowPayout.slice(0, 25),
        thumbnailCandidates,
    },
};

if (reportPath) writeJsonReport(reportPath, payload);
if (json) {
    console.log(JSON.stringify(payload, null, 2));
} else {
    console.log(`Offer data quality audit (${payload.generatedAt})`);
    console.log(`Active offers: ${payload.totals.activeOffers}`);
    console.log(`Games missing thumbnails: ${payload.totals.gamesMissingThumbnail}`);
    console.log(`Games with thumbnail candidates: ${payload.totals.gamesWithOfferThumbnailCandidate}`);
    console.log("\nMissing tasks by platform/provider:");
    console.table(missingTasks);
    console.log("\nMissing offer_url by platform:");
    console.table(missingUrls);
    console.log("\nUltra-low payouts by platform/provider:");
    console.table(ultraLow);
    console.log(`\ntotal_payout_usd < payout_usd rows: ${totalBelowPayout.length}`);
    console.log("\nProvider display-name variants:");
    console.log(JSON.stringify(payload.issues.providerVariants, null, 2));
    if (reportPath) console.log(`\nWrote report: ${reportPath}`);
}

function sampleOffer(row) {
    return {
        id: row.id,
        external_id: row.external_id,
        title: row.title,
        platform: firstRelated(row.site)?.slug ?? null,
        provider: normalizeProviderDisplayName(firstRelated(row.provider)?.name),
        game_slug: firstRelated(row.game)?.slug ?? null,
        status: row.status,
    };
}
