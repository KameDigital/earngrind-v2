import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { normalizeTotalPayout } from "@/lib/offer-quality";
import {
    buildLegacyExternalIds,
    buildProviderGalleryExternalId,
    cleanText,
    normalizeGalleryCountryCode,
    normalizeGalleryCountries,
    normalizeGalleryDevices,
    normalizeGalleryTasks,
    normalizeMoney,
    safeDirectOfferUrl,
    slugifyGalleryValue,
} from "./normalize";
import type {
    NormalizedProviderGalleryOffer,
    ProviderGalleryConfig,
    ProviderGalleryDbClient,
    ProviderGalleryImportResult,
    ProviderGalleryImportStats,
} from "./types";

type SiteOfferImportPayload = {
    site_id: string;
    provider_id: string;
    game_id: string;
    external_id: string;
    title: string;
    payout_usd: number;
    total_payout_usd: number;
    completion_count: number | null;
    goal_text: string | null;
    image_url: string | null;
    devices: string[];
    countries: string[];
    status: "active";
    ingested_at: string;
    updated_at: string;
    offer_url?: string;
};

let serviceClient: ProviderGalleryDbClient | null = null;

export function getProviderGalleryServiceClient(): ProviderGalleryDbClient {
    if (serviceClient) return serviceClient;

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for provider gallery imports.");
    }

    serviceClient = createSupabaseClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
    return serviceClient;
}

export async function importProviderGalleryOffers({
    db,
    config,
    offers,
    loggerPrefix = "provider-gallery",
}: {
    db: ProviderGalleryDbClient;
    config: ProviderGalleryConfig;
    offers: NormalizedProviderGalleryOffer[];
    loggerPrefix?: string;
}): Promise<ProviderGalleryImportResult> {
    const stats: ProviderGalleryImportStats = {
        fetched: offers.length,
        imported: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
    };
    const site = await ensurePlatform(db, config);
    const offerResults: ProviderGalleryImportResult["offerResults"] = [];

    for (const offer of offers) {
        const externalId = buildProviderGalleryExternalId(config, offer);
        try {
            const result = await upsertProviderGalleryOffer(db, config, site.id, offer, externalId);
            stats.imported += 1;
            stats[result] += 1;
            offerResults.push({ sourceOfferId: offer.sourceOfferId, externalId, result });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            stats.failed += 1;
            offerResults.push({ sourceOfferId: offer.sourceOfferId, externalId, result: "failed", error: message });
            console.error(`[${loggerPrefix}] offer failed`, {
                platform: config.platformSlug,
                sourceOfferId: offer.sourceOfferId,
                title: offer.title,
                message,
            });
        }
    }

    return { stats, offerResults };
}

async function ensurePlatform(db: ProviderGalleryDbClient, config: ProviderGalleryConfig): Promise<{ id: string }> {
    const { data: existing, error: existingError } = await db
        .from("platforms")
        .select("id")
        .eq("slug", config.platformSlug)
        .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    if (existing?.id) return { id: String(existing.id) };

    const { data, error } = await db
        .from("platforms")
        .insert({
            name: config.platformName,
            slug: config.platformSlug,
            platform_kind: config.platformKind,
            affiliate_template: config.affiliateTemplate,
            is_active: true,
        })
        .select("id")
        .single();

    if (error || !data) throw new Error(error?.message ?? `Failed to create ${config.platformName} platform`);
    return { id: String(data.id) };
}

async function ensureProvider(db: ProviderGalleryDbClient, name: string, slugSeed?: string): Promise<{ id: string }> {
    const slug = slugifyGalleryValue(slugSeed || name, "provider");
    const { data: existing, error: existingError } = await db
        .from("providers")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    if (existing?.id) return { id: String(existing.id) };

    const { data, error } = await db
        .from("providers")
        .insert({ name, slug, is_active: true })
        .select("id")
        .single();

    if (error || !data) throw new Error(error?.message ?? `Failed to create provider ${name}`);
    return { id: String(data.id) };
}

async function ensureGame(db: ProviderGalleryDbClient, offer: NormalizedProviderGalleryOffer): Promise<{ id: string }> {
    const title = cleanText(offer.advertiserGameName || offer.title);
    const slug = slugifyGalleryValue(offer.slug || title, "game");
    const { data: existing, error: existingError } = await db
        .from("games")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    if (existing?.id) return { id: String(existing.id) };

    const { data, error } = await db
        .from("games")
        .insert({
            name: title,
            slug,
            aliases: [offer.title],
            category: slugifyGalleryValue(offer.category || "Other", "other").replace(/-/g, "_"),
            devices: normalizeGalleryDevices(offer.devices),
            thumbnail_url: safeImageUrl(offer.imageUrl),
            description: offer.shortDescription ?? offer.description ?? null,
        })
        .select("id")
        .single();

    if (error || !data) throw new Error(error?.message ?? `Failed to create game ${title}`);
    return { id: String(data.id) };
}

async function upsertProviderGalleryOffer(
    db: ProviderGalleryDbClient,
    config: ProviderGalleryConfig,
    siteId: string,
    offer: NormalizedProviderGalleryOffer,
    externalId: string,
): Promise<"created" | "updated" | "skipped"> {
    const provider = await ensureProvider(db, offer.providerDisplayName, offer.sourceProviderSlug);
    const game = await ensureGame(db, offer);
    const now = new Date().toISOString();
    const directUrl = safeDirectOfferUrl(offer.trackingUrl) ?? safeDirectOfferUrl(offer.offerUrl);
    const payoutUsd = normalizeMoney(offer.payoutUsd);
    const totalPayoutUsd = normalizeTotalPayout(payoutUsd, normalizeMoney(offer.totalPayoutUsd));
    const completionCount = normalizeCompletionCount(offer.completionCount);
    const payload: SiteOfferImportPayload = {
        site_id: siteId,
        provider_id: provider.id,
        game_id: game.id,
        external_id: externalId,
        title: cleanText(offer.advertiserGameName || offer.title),
        payout_usd: payoutUsd,
        total_payout_usd: totalPayoutUsd,
        completion_count: completionCount,
        goal_text: offer.requirements?.[0] ?? offer.shortDescription ?? null,
        image_url: safeImageUrl(offer.imageUrl),
        devices: normalizeGalleryDevices(offer.devices),
        countries: normalizeGalleryCountries(offer),
        status: "active",
        ingested_at: now,
        updated_at: now,
    };

    if (directUrl) {
        payload.offer_url = directUrl;
    }

    const existing = await findExistingOffer(db, {
        siteId,
        providerId: provider.id,
        externalId,
        legacyExternalIds: buildLegacyExternalIds(config, offer),
        equivalentExternalIdLike: buildEquivalentExternalIdLike(config, offer),
    });

    if (!existing) {
        const { data, error } = await db
            .from("site_offers")
            .insert({ ...payload, created_at: now })
            .select("id")
            .single();
        if (error || !data) throw new Error(error?.message ?? `Failed to insert ${offer.title}`);
        await replaceTasks(db, String(data.id), offer, now);
        return "created";
    }

    const changed =
        existing.provider_id !== payload.provider_id ||
        existing.game_id !== payload.game_id ||
        existing.external_id !== payload.external_id ||
        existing.title !== payload.title ||
        Number(existing.payout_usd ?? 0) !== payload.payout_usd ||
        Number(existing.total_payout_usd ?? 0) !== payload.total_payout_usd ||
        normalizeCompletionCount(existing.completion_count) !== payload.completion_count ||
        existing.goal_text !== payload.goal_text ||
        (payload.offer_url !== undefined && existing.offer_url !== payload.offer_url) ||
        existing.image_url !== payload.image_url ||
        JSON.stringify(existing.devices ?? []) !== JSON.stringify(payload.devices) ||
        JSON.stringify(existing.countries ?? []) !== JSON.stringify(payload.countries) ||
        existing.status !== payload.status;

    if (changed) {
        const { error } = await db
            .from("site_offers")
            .update(payload)
            .eq("id", existing.id);
        if (error) throw new Error(error.message);
        await replaceTasks(db, String(existing.id), offer, now);
        return "updated";
    }

    return "skipped";
}

async function findExistingOffer(
    db: ProviderGalleryDbClient,
    options: {
        siteId: string;
        providerId: string;
        externalId: string;
        legacyExternalIds: string[];
        equivalentExternalIdLike?: string | null;
    },
): Promise<Record<string, any> | null> {
    const select = "id, provider_id, game_id, external_id, title, payout_usd, total_payout_usd, completion_count, goal_text, offer_url, image_url, devices, countries, status";
    const { data: current, error: currentError } = await db
        .from("site_offers")
        .select(select)
        .eq("site_id", options.siteId)
        .eq("provider_id", options.providerId)
        .eq("external_id", options.externalId)
        .maybeSingle();

    if (currentError) throw new Error(currentError.message);
    if (current) return current as Record<string, any>;

    const { data: siteScopedExternalId, error: siteScopedError } = await db
        .from("site_offers")
        .select(select)
        .eq("site_id", options.siteId)
        .eq("external_id", options.externalId)
        .maybeSingle();

    if (siteScopedError) throw new Error(siteScopedError.message);
    if (siteScopedExternalId) return siteScopedExternalId as Record<string, any>;

    for (const externalId of options.legacyExternalIds) {
        const { data, error } = await db
            .from("site_offers")
            .select(select)
            .eq("site_id", options.siteId)
            .eq("provider_id", options.providerId)
            .eq("external_id", externalId)
            .maybeSingle();
        if (error) throw new Error(error.message);
        if (data) return data as Record<string, any>;
    }

    if (options.equivalentExternalIdLike) {
        const { data, error } = await db
            .from("site_offers")
            .select(select)
            .eq("site_id", options.siteId)
            .eq("provider_id", options.providerId)
            .like("external_id", options.equivalentExternalIdLike)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw new Error(error.message);
        if (data) return data as Record<string, any>;
    }

    return null;
}

function buildEquivalentExternalIdLike(
    config: ProviderGalleryConfig,
    offer: NormalizedProviderGalleryOffer,
): string | null {
    if (config.key !== "gain-gg") return null;
    const wall = typeof offer.rawMetadata?.wall === "string" ? offer.rawMetadata.wall : "";
    if (wall !== "native") return null;
    const family = getGainNativeOfferFamily(offer.sourceOfferId);
    if (!family) return null;
    const country = normalizeGalleryCountries(offer)[0] ?? normalizeGalleryCountryCode(offer.countryCode) ?? "US";
    return `gain-native-${family}-%-${country}`;
}

function getGainNativeOfferFamily(sourceOfferId: string): string | null {
    const match = sourceOfferId.match(/^([A-Za-z0-9]+)-[A-Za-z0-9]+$/);
    return match?.[1] ?? null;
}

function normalizeCompletionCount(value: unknown): number | null {
    if (value === null || value === undefined || value === "") return null;
    const count = Number(value);
    if (!Number.isFinite(count) || count < 0) return null;
    return Math.trunc(count);
}

async function replaceTasks(
    db: ProviderGalleryDbClient,
    siteOfferId: string,
    offer: NormalizedProviderGalleryOffer,
    now: string,
): Promise<void> {
    const tasks = normalizeGalleryTasks(offer);
    const { error } = await db.rpc("replace_site_offer_tasks_atomic", {
        p_site_offer_id: siteOfferId,
        p_tasks: tasks.map((task) => ({
            sort_order: task.sortOrder,
            title: task.title,
            reward_amount: task.rewardAmount,
            reward_display: task.rewardDisplay,
            task_type: task.taskType,
            time_limit_text: task.timeLimitText,
            notes: task.notes,
            created_at: now,
            updated_at: now,
        })),
    });

    if (error) throw new Error(error.message);
}

function safeImageUrl(value: string | null | undefined): string | null {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) return null;
    try {
        const url = new URL(trimmed);
        return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
    } catch {
        return null;
    }
}
