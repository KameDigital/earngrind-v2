import { existsSync, readFileSync } from "node:fs";
import Module from "node:module";
import { resolve } from "node:path";
import { EARNLAB_GALLERY_COUNTRIES } from "@/lib/earnlab-countries";

type ImportStats = {
    fetched: number;
    imported: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
};

type ProviderRunResult = {
    provider: string;
    scope: string;
    stats: ImportStats;
};

const NOOP_MODULE_ID = "server-only";
const moduleInternals = Module as unknown as {
    _resolveFilename: (request: string, parent: unknown, isMain: boolean, options?: unknown) => string;
    _load: (request: string, parent: unknown, isMain: boolean) => unknown;
};
const originalResolveFilename = moduleInternals._resolveFilename;
const originalLoad = moduleInternals._load;

moduleInternals._resolveFilename = function resolveFilename(request, parent, isMain, options) {
    if (request === NOOP_MODULE_ID) return NOOP_MODULE_ID;
    return originalResolveFilename.call(this, request, parent, isMain, options);
};

moduleInternals._load = function load(request, parent, isMain) {
    if (request === NOOP_MODULE_ID) return {};
    return originalLoad.call(this, request, parent, isMain);
};

loadEnvFile("workers/.env");
loadEnvFile(".env.local");
loadEnvFile(".env.production");

const TIER1_COUNTRIES = ["US", "GB", "CA", "AU", "DE", "FR", "NL", "SE", "NO", "ES", "IT"] as const;
const ALL_16_COUNTRIES = [...EARNLAB_GALLERY_COUNTRIES];

const args = parseArgs(process.argv.slice(2));
const refresh = args.refresh !== "false";

// Country resolution
let resolvedCountries: string[] = ["US", "GB"];
if (args["all-countries"] === "true") {
    resolvedCountries = [...ALL_16_COUNTRIES];
} else if (args["tier1-only"] === "true") {
    resolvedCountries = [...TIER1_COUNTRIES];
} else if (args.countries) {
    resolvedCountries = parseCsv(args.countries);
}

// Platform selection
const platformFilter = args.platforms ? parseCsv(args.platforms.toLowerCase()) : null;
const shouldRunPlatform = (name: string) => !platformFilter || platformFilter.includes(name.toLowerCase());

const gemslootAllCountries = args["gemsloot-all-countries"] === "true";
const gemslootCountries = gemslootAllCountries ? [null] : (args["gemsloot-countries"] ? parseCsv(args["gemsloot-countries"]) : resolvedCountries);
const gainCountries = args["gain-countries"] ? parseCsv(args["gain-countries"]) : resolvedCountries;
const earnlabCountries = args["earnlab-countries"] ? parseCsv(args["earnlab-countries"]) : resolvedCountries;

const gemslootLimit = parseLimit(args["gemsloot-limit"] ?? args.limit, 300, 1000);
const gainLimit = parseLimit(args["gain-limit"] ?? args.limit, 300, 1000);
const earnlabLimit = parseLimit(args["earnlab-limit"] ?? args.limit, 75, 75);
const earnlabAllPages = args["all-pages"] !== "false";
const gainWalls = parseCsv(args["gain-walls"] ?? "native,revu,adtowall,asmwall,lootably,cpx");
const delayMs = Number(args.delay ?? 250);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});

async function main() {
    console.log(`[multi-country-sync] Starting ingestion pipeline...`);
    console.log(`[multi-country-sync] Target Countries: ${resolvedCountries.join(", ")}`);
    console.log(`[multi-country-sync] Platforms: ${platformFilter ? platformFilter.join(", ") : "All (EarnLab, Gemsloot, Gain.gg)"}\n`);

    const [
        { getEarnLabGalleryTasksByCountry },
        { getGemslootGalleryOffers },
        { getGainGalleryOffers },
        { getProviderGalleryConfig },
        { importProviderGalleryOffers, getProviderGalleryServiceClient },
        { buildGainOfferDeepLink },
        { buildEarnLabOfferBacklink },
        { buildProviderGalleryQualityReport },
    ] = await Promise.all([
        import("@/lib/earnlab-gallery"),
        import("@/lib/gemsloot-gallery"),
        import("@/lib/gain-gallery"),
        import("@/lib/provider-gallery/provider-registry"),
        import("@/lib/provider-gallery/upsert"),
        import("@/lib/gain-deeplinks"),
        import("@/lib/outbound"),
        import("@/lib/provider-gallery/quality"),
    ]);

    const db = getProviderGalleryServiceClient();
    const results: ProviderRunResult[] = [];

    // ── 1. EarnLab Ingestion ──────────────────────────────────────────────
    if (shouldRunPlatform("earnlab")) {
        console.log(`▶ [EarnLab] Syncing across ${earnlabCountries.length} countries...`);
        for (const country of earnlabCountries) {
            try {
                const config = getProviderGalleryConfig("earnlab");
                const gallery = await getEarnLabGalleryTasksByCountry(country, {
                    limit: earnlabLimit,
                    allPages: earnlabAllPages,
                    refresh,
                    sort: config.defaultSort,
                });
                const result = await importProviderGalleryOffers({
                    db,
                    config,
                    offers: gallery.offers.map((offer: any) => ({
                        sourceProviderSlug: "earnlab",
                        sourcePlatformSlug: "earnlab",
                        providerDisplayName: offer.providerName,
                        sourceOfferId: offer.id,
                        countryCode: offer.countryCode,
                        title: offer.title,
                        advertiserGameName: offer.advertiserName ?? offer.title,
                        slug: offer.slug,
                        category: offer.category,
                        payoutUsd: offer.payout,
                        totalPayoutUsd: offer.payout,
                        imageUrl: offer.imageUrl,
                        description: offer.description,
                        shortDescription: offer.shortDescription,
                        requirements: offer.requirements,
                        tasks: offer.tasks,
                        devices: offer.platform,
                        countries: [offer.countryCode],
                        trackingUrl: offer.trackingUrl,
                        offerUrl: buildEarnLabOfferBacklink(offer.id),
                        rawMetadata: offer.rawSourceMetadata,
                    })),
                    loggerPrefix: `earnlab/${country}`,
                });
                results.push({ provider: "EarnLab", scope: country, stats: result.stats });
                console.log(`  ✓ EarnLab (${country}): ${result.stats.fetched} fetched, ${result.stats.created} new, ${result.stats.updated} updated, ${result.stats.skipped} unchanged`);
                if (delayMs > 0) await sleep(delayMs);
            } catch (err) {
                console.error(`  ✕ EarnLab (${country}) failed:`, err instanceof Error ? err.message : String(err));
            }
        }
    }

    // ── 2. Gemsloot Ingestion ─────────────────────────────────────────────
    if (shouldRunPlatform("gemsloot")) {
        console.log(`\n▶ [Gemsloot] Syncing across ${gemslootCountries.length} scopes...`);
        for (const country of gemslootCountries) {
            const scopeLabel = country ?? "all-countries";
            try {
                const config = getProviderGalleryConfig("gemsloot");
                const gallery = await getGemslootGalleryOffers({
                    country,
                    allCountries: gemslootAllCountries,
                    limit: gemslootAllCountries ? 5000 : gemslootLimit,
                    refresh,
                    sort: "epc",
                });
                const result = await importProviderGalleryOffers({
                    db,
                    config,
                    offers: gallery.offers.map((offer: any) => ({
                        sourceProviderSlug: offer.providerName,
                        sourcePlatformSlug: "gemsloot",
                        providerDisplayName: offer.providerName,
                        sourceOfferId: offer.id,
                        countryCode: offer.countryCode,
                        title: offer.title,
                        advertiserGameName: offer.advertiserName ?? offer.title,
                        slug: offer.slug,
                        category: offer.category,
                        payoutUsd: offer.payout,
                        totalPayoutUsd: offer.totalPayout,
                        completionCount: offer.completionCount,
                        imageUrl: offer.imageUrl,
                        description: offer.description,
                        shortDescription: offer.shortDescription,
                        requirements: offer.requirements,
                        tasks: offer.tasks,
                        devices: offer.platform,
                        countries: offer.countries?.length ? offer.countries : [offer.countryCode],
                        trackingUrl: offer.trackingUrl,
                        offerUrl: null,
                        rawMetadata: offer.rawSourceMetadata,
                    })),
                    loggerPrefix: `gemsloot/${scopeLabel}`,
                });
                results.push({ provider: "Gemsloot", scope: scopeLabel, stats: result.stats });
                console.log(`  ✓ Gemsloot (${scopeLabel}): ${result.stats.fetched} fetched, ${result.stats.created} new, ${result.stats.updated} updated, ${result.stats.skipped} unchanged`);
                if (delayMs > 0) await sleep(delayMs);
            } catch (err) {
                console.error(`  ✕ Gemsloot (${scopeLabel}) failed:`, err instanceof Error ? err.message : String(err));
            }
        }
    }

    // ── 3. Gain.gg Ingestion ──────────────────────────────────────────────
    if (shouldRunPlatform("gain-gg")) {
        console.log(`\n▶ [Gain.gg] Syncing across ${gainCountries.length} countries and ${gainWalls.length} offerwalls...`);
        for (const country of gainCountries) {
            const config = getProviderGalleryConfig("gain-gg");
            for (const wall of gainWalls) {
                const wallLimit = wall === "cpx" ? Math.min(50, gainLimit) : gainLimit;
                try {
                    const gallery = await getGainGalleryOffers(wall as any, {
                        country,
                        limit: wallLimit,
                        refresh,
                    });
                    const result = await importProviderGalleryOffers({
                        db,
                        config,
                        offers: gallery.offers.map((offer: any) => {
                            const directOfferUrl = offer.wall === "native" ? offer.trackingUrl ?? buildGainOfferDeepLink(offer.id) : null;
                            return {
                                sourceProviderSlug: offer.providerName,
                                sourcePlatformSlug: "gain-gg",
                                providerDisplayName: offer.providerName,
                                sourceOfferId: offer.id,
                                countryCode: offer.countryCode,
                                title: offer.title,
                                advertiserGameName: offer.advertiserName ?? offer.title,
                                slug: offer.slug,
                                category: offer.category,
                                payoutUsd: offer.payout,
                                totalPayoutUsd: offer.totalPayout,
                                imageUrl: offer.imageUrl,
                                description: offer.description,
                                shortDescription: offer.shortDescription,
                                requirements: offer.requirements,
                                tasks: offer.tasks,
                                devices: offer.platform,
                                countries: [offer.countryCode],
                                trackingUrl: directOfferUrl ? null : offer.trackingUrl,
                                offerUrl: directOfferUrl,
                                rawMetadata: offer.rawSourceMetadata,
                            };
                        }),
                        loggerPrefix: `gain/${country}/${wall}`,
                    });
                    results.push({ provider: "Gain.gg", scope: `${country}/${wall}`, stats: result.stats });
                } catch (err) {
                    console.error(`  ✕ Gain.gg (${country}/${wall}) failed:`, err instanceof Error ? err.message : String(err));
                }
            }
            console.log(`  ✓ Gain.gg (${country}): completed ${gainWalls.length} walls`);
            if (delayMs > 0) await sleep(delayMs);
        }
    }

    const quality = {
        earnlab: await buildProviderGalleryQualityReport(db, { label: "EarnLab", externalIdLike: "%-%" }),
        gemsloot: await buildProviderGalleryQualityReport(db, { label: "Gemsloot", externalIdLike: "gemsloot-%" }),
        gain: await buildProviderGalleryQualityReport(db, { label: "Gain.gg", externalIdLike: "gain-%" }),
    };

    const totals = results.reduce<ImportStats>((acc, row) => ({
        fetched: acc.fetched + row.stats.fetched,
        imported: acc.imported + row.stats.imported,
        created: acc.created + row.stats.created,
        updated: acc.updated + row.stats.updated,
        skipped: acc.skipped + row.stats.skipped,
        failed: acc.failed + row.stats.failed,
    }), {
        fetched: 0,
        imported: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
    });

    console.log(`\n======================================================`);
    console.log(`✅ SYNC COMPLETE`);
    console.log(`Total Fetched:  ${totals.fetched}`);
    console.log(`Total Imported: ${totals.imported}`);
    console.log(`New Offers:     ${totals.created}`);
    console.log(`Updated Offers: ${totals.updated}`);
    console.log(`Unchanged:      ${totals.skipped}`);
    console.log(`Failed:         ${totals.failed}`);
    console.log(`======================================================\n`);
}

function loadEnvFile(path: string) {
    const fullPath = resolve(process.cwd(), path);
    if (!existsSync(fullPath)) return;

    const body = readFileSync(fullPath, "utf8");
    for (const rawLine of body.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#") || !line.includes("=")) continue;
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        let value = line.slice(index + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (key && process.env[key] === undefined) process.env[key] = value;
    }
}

function parseArgs(values: string[]) {
    const parsed: Record<string, string> = {};
    for (const value of values) {
        if (!value.startsWith("--")) continue;
        const [key, rawValue = "true"] = value.slice(2).split("=", 2);
        parsed[key] = rawValue;
    }
    return parsed;
}

function parseCsv(value: string) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function parseLimit(value: string | undefined, fallback: number, max: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.min(max, Math.floor(parsed)) : fallback;
}
