import "dotenv/config";
import { SupabaseClient } from "@supabase/supabase-js";
import { getDb, withRetry } from "../core/db";
import { logger } from "../core/logger";
import { GameRecord, OfferRecord, PlatformRecord, ProviderRecord, SiteOfferRecord } from "../models/offer";
import { SourceAdapter, SourceRecord } from "../models/source";
import { findMatchingGame } from "../services/matcher";
import { normalizeGainOffer, titleToAliases, toSlug } from "../services/normalize";
import { earnlabSource } from "../sources/earnlab";
import { gainSource } from "../sources/gain";
import { gainAdToWallSource } from "../sources/gain_adtowall";
import { gainMyChipsSource } from "../sources/gain_mychips";
import { gainRevuSource } from "../sources/gain_revu";
import { gemslootSource } from "../sources/gemsloot";
import { ImportStats, SourceOffer } from "../types/offer";

const SOURCES: Record<string, SourceAdapter> = {
    [gainSource.key]: gainSource,
    [gainAdToWallSource.key]: gainAdToWallSource,
    [gainMyChipsSource.key]: gainMyChipsSource,
    [gainRevuSource.key]: gainRevuSource,
    [earnlabSource.key]: earnlabSource,
    [gemslootSource.key]: gemslootSource,
};

export async function runImportJob(sourceKey = process.env.INGEST_SOURCE ?? gainSource.key): Promise<void> {
    const adapter = SOURCES[sourceKey];
    if (!adapter) {
        throw new Error(`Unknown source "${sourceKey}"`);
    }

    const db = getDb();
    const source = await upsertSource(db, adapter);
    const platform = await upsertPlatform(db, adapter);
    const runId = await startImportRun(db, source.id);
    const stats: ImportStats = {
        found: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
    };

    try {
        logger.info("Source fetch started", {
            source: adapter.key,
            name: adapter.name,
            mode: (process.env[adapter.mockEnvVar ?? "GAIN_USE_MOCK"] ?? "true").toLowerCase() === "true" ? "mock" : "live",
        });

        const fetchedOffers = await withRetry(() => adapter.fetchOffers(), `${adapter.key}-fetch-offers`);
        stats.found = fetchedOffers.length;
        logger.info("Source fetch succeeded", {
            source: adapter.key,
            found: stats.found,
        });

        await insertRawOffers(db, source.id, fetchedOffers);

        const games = await loadGames(db);
        logger.info("Source parse count", {
            source: adapter.key,
            parsedCount: fetchedOffers.length,
        });

        if (adapter.key === gainSource.key) {
            await retireLegacyGainOffers(db, platform.id);
        }

        for (const rawOffer of fetchedOffers) {
            try {
                const game = await resolveGame(db, games, rawOffer);

                if (adapter.storage === "site_offers") {
                    const provider = await upsertProvider(
                        db,
                        rawOffer.provider_name?.trim() || adapter.name,
                    );
                    const changed = await upsertSiteParentOffer(
                        db,
                        platform.id,
                        provider.id,
                        rawOffer,
                        game?.id ?? null,
                    );

                    if (changed === "created") stats.created += 1;
                    else if (changed === "updated") stats.updated += 1;
                    else stats.skipped += 1;
                } else {
                    const normalized = normalizeGainOffer(rawOffer, platform.id, game?.id ?? null);
                    const existing = await loadOfferByExternalId(db, platform.id, normalized.external_id);

                    if (existing) {
                        const changed = await updateExistingOffer(db, existing, normalized);
                        if (changed) stats.updated += 1;
                        else stats.skipped += 1;
                    } else {
                        await createOffer(db, normalized);
                        stats.created += 1;
                    }
                }
            } catch (error) {
                stats.failed += 1;
                logger.warn("Offer processing failed", {
                    source: adapter.key,
                    title: rawOffer.title,
                    externalId: rawOffer.external_id,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }

        await finishImportRun(db, runId, "completed", stats);
        await touchSource(db, source.id);

        logger.info("Source import summary", {
            source: adapter.key,
            insertedCount: stats.created,
            updatedCount: stats.updated,
            skippedCount: stats.skipped,
            failedRows: stats.failed,
        });

        printSummary(adapter.name, stats);
    } catch (error) {
        await finishImportRun(db, runId, "failed", stats);
        throw error;
    }
}

async function upsertPlatform(db: SupabaseClient, adapter: SourceAdapter): Promise<PlatformRecord> {
    const isGainPlatform = adapter.key === "gain-gg" || adapter.key.startsWith("gain-");
    const slug = isGainPlatform ? "gain-gg" : toSlug(adapter.name);
    const platformName = isGainPlatform ? "Gain.gg" : adapter.name;
    const { data: existing } = await db
        .from("platforms")
        .select("id, name, slug, platform_kind, logo_url, affiliate_template, description, countries, is_active")
        .eq("slug", slug)
        .maybeSingle();

    if (existing) {
        return existing as PlatformRecord;
    }

    const { data, error } = await db
        .from("platforms")
        .insert({
            name: platformName,
            slug,
            platform_kind: "gpt_site",
            description: `${platformName} ingestion source`,
            is_active: true,
        })
        .select("id, name, slug, platform_kind, logo_url, affiliate_template, description, countries, is_active")
        .single();

    if (error || !data) {
        throw new Error(`Failed to upsert platform: ${error?.message ?? "unknown error"}`);
    }

    return data as PlatformRecord;
}

async function upsertSource(db: SupabaseClient, adapter: SourceAdapter): Promise<SourceRecord> {
    const { data, error } = await db
        .from("sources")
        .upsert(
            {
                name: adapter.name,
                type: adapter.type,
                base_url: adapter.baseUrl,
                active: true,
            },
            { onConflict: "name" },
        )
        .select("*")
        .single();

    if (error || !data) {
        throw new Error(`Failed to upsert source: ${error?.message ?? "unknown error"}`);
    }

    return data as SourceRecord;
}

async function startImportRun(db: SupabaseClient, sourceId: string): Promise<string> {
    const { data, error } = await db
        .from("import_runs")
        .insert({
            source_id: sourceId,
            status: "running",
        })
        .select("id")
        .single();

    if (error || !data) {
        throw new Error(`Failed to create import run: ${error?.message ?? "unknown error"}`);
    }

    return data.id as string;
}

async function finishImportRun(
    db: SupabaseClient,
    runId: string,
    status: string,
    stats: ImportStats,
): Promise<void> {
    const { error } = await db
        .from("import_runs")
        .update({
            status,
            finished_at: new Date().toISOString(),
            total_found: stats.found,
            total_new: stats.created,
            total_updated: stats.updated,
        })
        .eq("id", runId);

    if (error) {
        logger.warn("Failed to finish import run", { runId, error: error.message });
    }
}

async function touchSource(db: SupabaseClient, sourceId: string): Promise<void> {
    const { error } = await db
        .from("sources")
        .update({ last_run_at: new Date().toISOString() })
        .eq("id", sourceId);

    if (error) {
        logger.warn("Failed to touch source", { sourceId, error: error.message });
    }
}

async function insertRawOffers(db: SupabaseClient, sourceId: string, rawOffers: SourceOffer[]): Promise<void> {
    if (rawOffers.length === 0) return;

    const rows = rawOffers.map((offer) => ({
        source_id: sourceId,
        raw_title: offer.title,
        raw_payload_json: offer,
        raw_payout: Number.parseFloat(offer.payout_raw.replace(/[^0-9.]/g, "")) || null,
        raw_currency: offer.currency,
        raw_image_url: offer.image_url ?? null,
    }));

    const { error } = await db.from("raw_offers").insert(rows);
    if (error) {
        throw new Error(`Failed to insert raw offers: ${error.message}`);
    }
}

async function loadGames(db: SupabaseClient): Promise<GameRecord[]> {
    const { data, error } = await db
        .from("games")
        .select("id, name, slug, aliases, category, devices, thumbnail_url, description");

    if (error) {
        throw new Error(`Failed to load games: ${error.message}`);
    }

    return (data ?? []) as GameRecord[];
}

async function resolveGame(db: SupabaseClient, games: GameRecord[], rawOffer: SourceOffer): Promise<GameRecord | null> {
    const directSlug = rawOffer.game_slug?.trim() ?? "";
    const directMatch = directSlug ? games.find((game) => game.slug === directSlug) ?? null : null;
    if (directMatch) {
        logger.info("Reusing existing game from in-memory cache", {
            slug: directMatch.slug,
            gameId: directMatch.id,
            sourceTitle: rawOffer.title,
        });
        return directMatch;
    }

    const gameTitle = rawOffer.game_title?.trim() || rawOffer.title;
    const matched = findMatchingGame(gameTitle, games);
    if (matched) {
        logger.info("Reusing matched existing game", {
            slug: matched.slug,
            gameId: matched.id,
            sourceTitle: rawOffer.title,
        });
        return matched;
    }

    const slug = directSlug || toSlug(gameTitle);
    if (!slug) return null;

    const { data: existingBySlug, error: existingBySlugError } = await db
        .from("games")
        .select("id, name, slug, aliases, category, devices, thumbnail_url, description")
        .eq("slug", slug)
        .maybeSingle();

    if (existingBySlugError) {
        throw new Error(`Failed to load game by slug: ${existingBySlugError.message}`);
    }

    if (existingBySlug) {
        const existing = existingBySlug as GameRecord;
        if (!games.some((game) => game.id === existing.id)) {
            games.push(existing);
        }
        logger.info("Reusing existing game by slug", {
            slug: existing.slug,
            gameId: existing.id,
            sourceTitle: rawOffer.title,
        });
        return existing;
    }

    const aliases = titleToAliases(gameTitle);
    const devices = normalizeDevicesForGame(rawOffer.device_raw);
    const category = /game|play|level|village/i.test(rawOffer.category_raw) ? "mobile_game" : "other";

    const { data, error } = await db
        .from("games")
        .insert({
            name: gameTitle,
            slug,
            aliases,
            category,
            devices,
            thumbnail_url: null,
            description: null,
        })
        .select("id, name, slug, aliases, category, devices, thumbnail_url, description")
        .single();

    if (error) {
        const isDuplicateSlug = error.message.includes("games_slug_key") || error.message.toLowerCase().includes("duplicate key");
        if (!isDuplicateSlug) {
            throw new Error(`Failed to create game: ${error.message}`);
        }

        const { data: concurrentExisting, error: concurrentExistingError } = await db
            .from("games")
            .select("id, name, slug, aliases, category, devices, thumbnail_url, description")
            .eq("slug", slug)
            .single();

        if (concurrentExistingError || !concurrentExisting) {
            throw new Error(`Failed to re-fetch concurrent game: ${concurrentExistingError?.message ?? "unknown error"}`);
        }

        const reused = concurrentExisting as GameRecord;
        if (!games.some((game) => game.id === reused.id)) {
            games.push(reused);
        }
        logger.info("Reusing concurrently created game", {
            slug: reused.slug,
            gameId: reused.id,
            sourceTitle: rawOffer.title,
        });
        return reused;
    }

    if (!data) {
        throw new Error("Failed to create game: no row returned");
    }

    const created = data as GameRecord;
    games.push(created);
    logger.info("Created new game", {
        slug: created.slug,
        gameId: created.id,
        sourceTitle: rawOffer.title,
    });
    return created;
}

async function upsertProvider(db: SupabaseClient, name: string): Promise<ProviderRecord> {
    const slug = toSlug(name);

    const { data: existing, error: selectError } = await db
        .from("providers")
        .select("id, name, slug, is_active")
        .eq("slug", slug)
        .maybeSingle();

    if (selectError) {
        throw new Error(`Failed to load provider: ${selectError.message}`);
    }

    if (existing) {
        return existing as ProviderRecord;
    }

    const { data, error } = await db
        .from("providers")
        .insert({
            name,
            slug,
            is_active: true,
        })
        .select("id, name, slug, is_active")
        .single();

    if (error || !data) {
        throw new Error(`Failed to create provider: ${error?.message ?? "unknown error"}`);
    }

    return data as ProviderRecord;
}

async function retireLegacyGainOffers(db: SupabaseClient, platformId: string): Promise<void> {
    const { error } = await db
        .from("offers")
        .update({
            status: "expired",
            updated_at: new Date().toISOString(),
        })
        .eq("platform_id", platformId)
        .in("status", ["active", "boosted", "paused"]);

    if (error) {
        throw new Error(`Failed to retire legacy Gain offers: ${error.message}`);
    }
}

async function upsertSiteParentOffer(
    db: SupabaseClient,
    siteId: string,
    providerId: string,
    rawOffer: SourceOffer,
    gameId: string | null,
): Promise<"created" | "updated" | "skipped"> {
    const taskList = rawOffer.task_list ?? [];
    const bestPayout = Number.isFinite(rawOffer.best_payout_usd ?? NaN)
        ? Number(rawOffer.best_payout_usd)
        : Number.parseFloat(rawOffer.payout_raw);
    const totalPayout = Number.parseFloat(rawOffer.total_payout_raw ?? rawOffer.payout_raw);
    logger.info("Site offer payout write debug", {
        external_id: rawOffer.external_id,
        title: rawOffer.title,
        payout_raw: rawOffer.payout_raw,
        best_payout_usd: rawOffer.best_payout_usd ?? null,
        total_payout_raw: rawOffer.total_payout_raw ?? null,
        resolved_payout_usd: Number.isFinite(bestPayout) ? bestPayout : 0,
    });
    const payload = {
        site_id: siteId,
        provider_id: providerId,
        game_id: gameId,
        external_id: rawOffer.external_id.trim(),
        title: (rawOffer.game_title?.trim() || rawOffer.title).trim(),
        payout_usd: Number.isFinite(bestPayout) ? bestPayout : 0,
        total_payout_usd: Number.isFinite(totalPayout) ? totalPayout : null,
        goal_text: buildParentGoalText(taskList),
        offer_url: rawOffer.url.trim(),
        image_url: rawOffer.image_url?.trim() || null,
        devices: normalizeDevicesForGame(rawOffer.device_raw),
        countries: normalizeCountriesForSiteOffer(rawOffer.countries_raw),
        status: "active",
        ingested_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const existing = await loadSiteOfferByExternalId(db, siteId, payload.external_id);

    if (!existing) {
        const { data, error } = await db
            .from("site_offers")
            .insert({
                ...payload,
                created_at: payload.ingested_at,
            })
            .select("id")
            .single();

        if (error || !data) {
            throw new Error(`Failed to create site offer: ${error?.message ?? "unknown error"}`);
        }

        await replaceSiteOfferTasks(db, data.id as string, taskList);
        return "created";
    }

    const changed =
        existing.provider_id !== payload.provider_id ||
        existing.game_id !== payload.game_id ||
        existing.title !== payload.title ||
        Number(existing.payout_usd) !== payload.payout_usd ||
        Number(existing.total_payout_usd ?? 0) !== Number(payload.total_payout_usd ?? 0) ||
        existing.goal_text !== payload.goal_text ||
        existing.offer_url !== payload.offer_url ||
        existing.image_url !== payload.image_url ||
        JSON.stringify(existing.devices ?? []) !== JSON.stringify(payload.devices) ||
        JSON.stringify(existing.countries ?? []) !== JSON.stringify(payload.countries) ||
        existing.status !== payload.status;

    if (changed) {
        const { error } = await db
            .from("site_offers")
            .update(payload)
            .eq("id", existing.id);

        if (error) {
            throw new Error(`Failed to update site offer: ${error.message}`);
        }
    }

    await replaceSiteOfferTasks(db, existing.id, taskList);
    return changed ? "updated" : "skipped";
}

async function loadSiteOfferByExternalId(
    db: SupabaseClient,
    siteId: string,
    externalId: string,
): Promise<SiteOfferRecord | null> {
    const { data, error } = await db
        .from("site_offers")
        .select("id, site_id, provider_id, game_id, external_id, title, payout_usd, total_payout_usd, goal_text, offer_url, image_url, devices, countries, status, updated_at")
        .eq("site_id", siteId)
        .eq("external_id", externalId)
        .maybeSingle();

    if (error) {
        throw new Error(`Failed to load site offer by external_id: ${error.message}`);
    }

    return (data as SiteOfferRecord | null) ?? null;
}

async function replaceSiteOfferTasks(
    db: SupabaseClient,
    siteOfferId: string,
    taskList: NonNullable<SourceOffer["task_list"]>,
): Promise<void> {
    const { error: deleteError } = await db
        .from("site_offer_tasks")
        .delete()
        .eq("site_offer_id", siteOfferId);

    if (deleteError) {
        throw new Error(`Failed to delete stale site offer tasks: ${deleteError.message}`);
    }

    if (taskList.length === 0) {
        return;
    }

    const now = new Date().toISOString();
    const { error: insertError } = await db
        .from("site_offer_tasks")
        .insert(
            taskList.map((task) => ({
                site_offer_id: siteOfferId,
                sort_order: task.sort_order,
                title: task.title,
                reward_amount: task.reward_amount_usd,
                reward_display: task.reward_display ?? `$${task.reward_amount_usd.toFixed(2)}`,
                task_type: task.task_type ?? "other",
                time_limit_text: task.time_limit_text ?? null,
                notes: task.notes ?? null,
                created_at: now,
                updated_at: now,
            })),
        );

    if (insertError) {
        throw new Error(`Failed to insert site offer tasks: ${insertError.message}`);
    }
}

async function loadOfferByExternalId(
    db: SupabaseClient,
    platformId: string,
    externalId: string,
): Promise<OfferRecord | null> {
    const { data, error } = await db
        .from("offers")
        .select("id, platform_id, game_id, external_id, title, payout_usd, payout_type, devices, countries, category, custom_param, offer_expires_at, status, is_featured, is_boosted, updated_at")
        .eq("platform_id", platformId)
        .eq("external_id", externalId)
        .maybeSingle();

    if (error) {
        throw new Error(`Failed to load offer by external_id: ${error.message}`);
    }

    return (data as OfferRecord | null) ?? null;
}

async function createOffer(
    db: SupabaseClient,
    normalized: import("../types").NormalizedOffer,
): Promise<void> {
    const now = new Date().toISOString();
    const { data, error } = await db
        .from("offers")
        .insert({
            platform_id: normalized.platform_id,
            game_id: normalized.game_id,
            external_id: normalized.external_id,
            title: normalized.title,
            payout_usd: normalized.payout_usd,
            payout_type: normalized.payout_type,
            devices: normalized.devices,
            countries: normalized.countries,
            category: normalized.category,
            custom_param: normalized.custom_param,
            offer_expires_at: normalized.offer_expires_at,
            status: "active",
            ingested_at: now,
            created_at: now,
            updated_at: now,
        })
        .select("id")
        .single();

    if (error || !data) {
        throw new Error(`Failed to create offer: ${error?.message ?? "unknown error"}`);
    }

    await insertOfferHistory(db, data.id as string, normalized.payout_usd, "ingest_gain");
}

async function updateExistingOffer(
    db: SupabaseClient,
    existing: OfferRecord,
    normalized: import("../types").NormalizedOffer,
): Promise<boolean> {
    const payload = {
        game_id: normalized.game_id,
        title: normalized.title,
        payout_usd: normalized.payout_usd,
        payout_type: normalized.payout_type,
        devices: normalized.devices,
        countries: normalized.countries,
        category: normalized.category,
        custom_param: normalized.custom_param,
        offer_expires_at: normalized.offer_expires_at,
        status: "active",
        updated_at: new Date().toISOString(),
    };

    const isChanged =
        existing.game_id !== payload.game_id ||
        existing.title !== payload.title ||
        Number(existing.payout_usd) !== payload.payout_usd ||
        existing.payout_type !== payload.payout_type ||
        JSON.stringify(existing.devices ?? []) !== JSON.stringify(payload.devices) ||
        JSON.stringify(existing.countries ?? []) !== JSON.stringify(payload.countries) ||
        existing.category !== payload.category ||
        existing.custom_param !== payload.custom_param ||
        existing.offer_expires_at !== payload.offer_expires_at ||
        (existing.status ?? "active") !== payload.status ||
        false;

    if (!isChanged) {
        return false;
    }

    if (Number(existing.payout_usd) !== Number(payload.payout_usd)) {
        await insertOfferHistory(db, existing.id, Number(existing.payout_usd), "ingest_gain");
    }

    const { error } = await db.from("offers").update(payload).eq("id", existing.id);
    if (error) {
        throw new Error(`Failed to update offer: ${error.message}`);
    }

    return true;
}

async function insertOfferHistory(db: SupabaseClient, offerId: string, payoutUsd: number, source: string): Promise<void> {
    const { error } = await db.from("offer_history").insert({
        offer_id: offerId,
        payout_usd: payoutUsd,
        recorded_at: new Date().toISOString(),
        source,
    });

    if (error) {
        throw new Error(`Failed to insert offer history: ${error.message}`);
    }
}

function printSummary(sourceName: string, stats: ImportStats): void {
    console.log(`[${sourceName.toUpperCase()} IMPORT]`);
    console.log(`Found: ${stats.found} offers`);
    console.log(`New: ${stats.created}`);
    console.log(`Updated: ${stats.updated}`);
    console.log(`Skipped: ${stats.skipped}`);
}

function normalizeDevicesForGame(rawDevice: string): string[] {
    const value = rawDevice.toLowerCase();
    const devices = new Set<string>();
    if (/ios|iphone|ipad|apple/.test(value)) devices.add("ios");
    if (/android|google play|play store/.test(value)) devices.add("android");
    if (/pc|desktop|windows|mac/.test(value)) devices.add("pc");
    if (devices.size === 0) devices.add("web");
    return Array.from(devices);
}

function normalizeCountriesForSiteOffer(countries?: string[] | null): string[] {
    if (!countries || countries.length === 0) {
        return ["US"];
    }

    return Array.from(new Set(countries.map((country) => country.toUpperCase()))).slice(0, 20);
}

function buildParentGoalText(taskList: NonNullable<SourceOffer["task_list"]>): string | null {
    if (taskList.length === 0) {
        return null;
    }

    if (taskList.length === 1) {
        return taskList[0].title;
    }

    return `${taskList.length} milestones available`;
}

if (require.main === module) {
    const cliSourceKey = process.argv[2];

    runImportJob(cliSourceKey).catch((error) => {
        logger.error("Import failed", {
            error: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
    });
}
