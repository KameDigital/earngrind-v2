import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import {
    GainGalleryOffer,
    GainGalleryWall,
    GainGalleryTaskStep,
    getGainGalleryOffers,
    normalizeGainCountryCode,
    normalizeGainWall,
    slugify,
} from "@/lib/gain-gallery";
import { normalizeTotalPayout } from "@/lib/offer-quality";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type ImportStats = {
    fetched: number;
    imported: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
};

type WallImportResult = {
    wall: GainGalleryWall;
    countryCode: string;
    stats: ImportStats;
};

type QualityReport = {
    totalGainRows: number;
    byWall: Record<string, number>;
    byProvider: Record<string, number>;
    byCountry: Record<string, number>;
    byStatus: Record<string, number>;
    missingImages: number;
    zeroOrLowPayouts: number;
    missingTasks: number;
    duplicateExternalIds: number;
    brokenGameSlugs: number;
};

type DbClient = SupabaseClient<any, "public", any>;
type SiteOfferImportPayload = {
    site_id: string;
    provider_id: string;
    game_id: string;
    external_id: string;
    title: string;
    payout_usd: number;
    total_payout_usd: number;
    goal_text: string | null;
    image_url: string | null;
    devices: string[];
    countries: string[];
    status: "active";
    ingested_at: string;
    updated_at: string;
    offer_url?: string;
};

const PROVEN_BATCH_WALLS: Array<{ wall: GainGalleryWall; limit: number }> = [
    { wall: "native", limit: 300 },
    { wall: "revu", limit: 300 },
    { wall: "adtowall", limit: 300 },
    { wall: "asmwall", limit: 300 },
    { wall: "lootably", limit: 300 },
    { wall: "cpx", limit: 50 },
];

let serviceClient: DbClient | null = null;

function getServiceClient(): DbClient {
    if (serviceClient) return serviceClient;

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for Gain gallery imports.");
    }

    serviceClient = createSupabaseClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
    return serviceClient;
}

async function requireEditor() {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { ok: false as const, status: 401, error: "Unauthorized" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || !["admin", "editor"].includes(String(profile.role))) {
        return { ok: false as const, status: 403, error: "Forbidden" };
    }

    return { ok: true as const };
}

export async function POST(req: NextRequest) {
    const auth = await requireEditor();
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const isBatch = body.batch === true;
    const wall = normalizeGainWall(typeof body.wall === "string" ? body.wall : "native");
    if (!wall) {
        return NextResponse.json({ error: "wall must be a supported Gain wall source" }, { status: 400 });
    }

    const country = normalizeGainCountryCode(typeof body.country === "string" ? body.country : "US");
    if (!country) {
        return NextResponse.json({ error: "country must be a two-letter country code such as US or GB" }, { status: 400 });
    }

    const limit = Math.min(300, Math.max(1, Number(body.limit ?? 100) || 100));
    const refresh = body.refresh !== false;

    try {
        const db = getServiceClient();
        const site = await ensureGainPlatform(db);

        if (isBatch) {
            const results: WallImportResult[] = [];
            for (const item of PROVEN_BATCH_WALLS) {
                results.push(await importGainWall(db, site.id, item.wall, country, item.limit, refresh));
            }

            return NextResponse.json({
                countryCode: country,
                batch: true,
                results,
                totals: sumStats(results.map((result) => result.stats)),
                quality: await buildGainQualityReport(db),
            });
        }

        const result = await importGainWall(db, site.id, wall, country, limit, refresh);
        return NextResponse.json({
            ...result,
            quality: await buildGainQualityReport(db),
        });
    } catch (error) {
        console.error("[admin/gain/gallery-import] failed", {
            wall,
            country,
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: "Import failed" }, { status: 500 });
    }
}

async function importGainWall(
    db: DbClient,
    siteId: string,
    wall: GainGalleryWall,
    country: string,
    limit: number,
    refresh: boolean,
): Promise<WallImportResult> {
    const stats: ImportStats = {
        fetched: 0,
        imported: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
    };
    const gallery = await getGainGalleryOffers(wall, { country, limit, refresh });
    stats.fetched = gallery.offers.length;

    for (const offer of gallery.offers) {
        try {
            const result = await upsertGainOffer(db, siteId, offer);
            stats.imported += 1;
            stats[result] += 1;
        } catch (error) {
            stats.failed += 1;
            console.error("[admin/gain/gallery-import] offer failed", {
                wall,
                country,
                offerId: offer.id,
                title: offer.title,
                message: error instanceof Error ? error.message : String(error),
            });
        }
    }

    return {
        wall: gallery.wall,
        countryCode: gallery.countryCode,
        stats,
    };
}

async function ensureGainPlatform(db: DbClient): Promise<{ id: string }> {
    const { data: existing, error: existingError } = await db
        .from("platforms")
        .select("id")
        .eq("slug", "gain-gg")
        .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    if (existing?.id) return { id: String(existing.id) };

    const { data, error } = await db
        .from("platforms")
        .insert({
            name: "Gain.gg",
            slug: "gain-gg",
            platform_kind: "gpt_site",
            affiliate_template: "https://gain.gg/r/macko",
            is_active: true,
        })
        .select("id")
        .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to create Gain.gg platform");
    return { id: String(data.id) };
}

async function ensureProvider(db: DbClient, name: string): Promise<{ id: string }> {
    const slug = slugify(name);
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

async function ensureGame(db: DbClient, offer: GainGalleryOffer): Promise<{ id: string }> {
    const slug = offer.slug || slugify(offer.title);
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
            name: offer.advertiserName ?? offer.title,
            slug,
            aliases: [offer.title],
            category: offer.category.toLowerCase().replace(/\s+/g, "_"),
            devices: toDeviceTypes(offer.platform),
            thumbnail_url: offer.imageUrl,
            description: offer.shortDescription,
        })
        .select("id")
        .single();

    if (error || !data) throw new Error(error?.message ?? `Failed to create game ${offer.title}`);
    return { id: String(data.id) };
}

async function upsertGainOffer(
    db: DbClient,
    siteId: string,
    offer: GainGalleryOffer,
): Promise<"created" | "updated" | "skipped"> {
    const provider = await ensureProvider(db, offer.providerName);
    const game = await ensureGame(db, offer);
    const externalId = `gain-${offer.wall}-${offer.id}-${offer.countryCode}`;
    const now = new Date().toISOString();
    const payload: SiteOfferImportPayload = {
        site_id: siteId,
        provider_id: provider.id,
        game_id: game.id,
        external_id: externalId,
        title: offer.advertiserName ?? offer.title,
        payout_usd: offer.payout,
        total_payout_usd: normalizeTotalPayout(offer.payout, offer.totalPayout),
        goal_text: offer.requirements[0] ?? offer.shortDescription,
        image_url: offer.imageUrl,
        devices: toDeviceTypes(offer.platform),
        countries: [offer.countryCode],
        status: "active",
        ingested_at: now,
        updated_at: now,
    };
    // Native Gain and AdToWall usually do not expose direct per-offer links.
    // Only update offer_url when a wall returns a direct tracking URL, preserving manual/future URLs.
    if (offer.trackingUrl) {
        payload.offer_url = offer.trackingUrl;
    }

    const { data: existing, error: existingError } = await db
        .from("site_offers")
        .select("id, provider_id, game_id, title, payout_usd, total_payout_usd, goal_text, offer_url, image_url, devices, countries, status")
        .eq("site_id", siteId)
        .eq("external_id", externalId)
        .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    const row = existing as Record<string, unknown> | null;

    if (!row) {
        const { data, error } = await db
            .from("site_offers")
            .insert({ ...payload, created_at: now })
            .select("id")
            .single();
        if (error || !data) throw new Error(error?.message ?? `Failed to insert ${offer.title}`);
        await replaceTasks(db, String(data.id), offer.tasks, offer);
        return "created";
    }

    const changed =
        row.provider_id !== payload.provider_id ||
        row.game_id !== payload.game_id ||
        row.title !== payload.title ||
        Number(row.payout_usd ?? 0) !== payload.payout_usd ||
        Number(row.total_payout_usd ?? 0) !== payload.total_payout_usd ||
        row.goal_text !== payload.goal_text ||
        (payload.offer_url !== undefined && row.offer_url !== payload.offer_url) ||
        row.image_url !== payload.image_url ||
        JSON.stringify(row.devices ?? []) !== JSON.stringify(payload.devices) ||
        JSON.stringify(row.countries ?? []) !== JSON.stringify(payload.countries) ||
        row.status !== payload.status;

    if (changed) {
        const { error } = await db
            .from("site_offers")
            .update(payload)
            .eq("id", row.id);
        if (error) throw new Error(error.message);
    }

    await replaceTasks(db, String(row.id), offer.tasks, offer);
    return changed ? "updated" : "skipped";
}

function sumStats(items: ImportStats[]): ImportStats {
    return items.reduce<ImportStats>((total, item) => ({
        fetched: total.fetched + item.fetched,
        imported: total.imported + item.imported,
        created: total.created + item.created,
        updated: total.updated + item.updated,
        skipped: total.skipped + item.skipped,
        failed: total.failed + item.failed,
    }), {
        fetched: 0,
        imported: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
    });
}

async function buildGainQualityReport(db: DbClient): Promise<QualityReport> {
    const { data, error } = await db
        .from("site_offers")
        .select(`
            id, external_id, payout_usd, image_url, countries, status,
            provider:providers(name),
            game:games(slug),
            tasks:site_offer_tasks(id)
        `)
        .like("external_id", "gain-%")
        .limit(5000);

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<Record<string, any>>;
    const externalCounts = new Map<string, number>();
    const byWall: Record<string, number> = {};
    const byProvider: Record<string, number> = {};
    const byCountry: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let missingImages = 0;
    let zeroOrLowPayouts = 0;
    let missingTasks = 0;
    let brokenGameSlugs = 0;

    for (const row of rows) {
        const externalId = String(row.external_id ?? "");
        externalCounts.set(externalId, (externalCounts.get(externalId) ?? 0) + 1);
        increment(byWall, extractGainWallFromExternalId(externalId));
        increment(byProvider, firstRelated(row.provider)?.name ?? "Unknown");
        increment(byStatus, String(row.status ?? "unknown"));

        const countries = Array.isArray(row.countries) ? row.countries : [];
        if (countries.length === 0) increment(byCountry, "Unknown");
        for (const country of countries) increment(byCountry, String(country).toUpperCase());

        if (!row.image_url) missingImages += 1;
        if (Number(row.payout_usd ?? 0) <= 0.01) zeroOrLowPayouts += 1;
        if (!Array.isArray(row.tasks) || row.tasks.length === 0) missingTasks += 1;

        const game = firstRelated(row.game);
        const slug = String(game?.slug ?? "");
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) brokenGameSlugs += 1;
    }

    return {
        totalGainRows: rows.length,
        byWall,
        byProvider,
        byCountry,
        byStatus,
        missingImages,
        zeroOrLowPayouts,
        missingTasks,
        duplicateExternalIds: Array.from(externalCounts.values()).filter((count) => count > 1).length,
        brokenGameSlugs,
    };
}

function extractGainWallFromExternalId(externalId: string): string {
    const match = externalId.match(/^gain-([a-z]+)-/);
    return match?.[1] ?? "unknown";
}

function increment(record: Record<string, number>, key: string): void {
    record[key] = (record[key] ?? 0) + 1;
}

function firstRelated(value: unknown): any {
    return Array.isArray(value) ? value[0] ?? null : value;
}

async function replaceTasks(
    db: DbClient,
    siteOfferId: string,
    tasks: GainGalleryTaskStep[],
    offer: GainGalleryOffer,
): Promise<void> {
    const { error: deleteError } = await db
        .from("site_offer_tasks")
        .delete()
        .eq("site_offer_id", siteOfferId);
    if (deleteError) throw new Error(deleteError.message);

    const rows = tasks.length > 0
        ? tasks
        : [{
            title: offer.title,
            rewardAmount: offer.payout,
            rewardDisplay: `$${offer.payout.toFixed(2)}`,
            taskType: "other" as const,
            timeLimitText: null,
            notes: offer.description,
            sortOrder: 1,
        }];

    const now = new Date().toISOString();
    const { error } = await db
        .from("site_offer_tasks")
        .insert(rows.map((task) => ({
            site_offer_id: siteOfferId,
            sort_order: task.sortOrder,
            title: task.title,
            reward_amount: task.rewardAmount,
            reward_display: task.rewardDisplay,
            task_type: toDbTaskType(task.taskType),
            time_limit_text: task.timeLimitText,
            notes: task.notes,
            created_at: now,
            updated_at: now,
        })));

    if (error) throw new Error(error.message);
}

function toDeviceTypes(platforms: GainGalleryOffer["platform"]): string[] {
    const devices = new Set<string>();
    for (const platform of platforms) {
        if (platform === "iOS") devices.add("ios");
        if (platform === "Android") devices.add("android");
        if (platform === "Desktop") devices.add("pc");
        if (platform === "Web") devices.add("web");
    }
    if (devices.size === 0) devices.add("web");
    return Array.from(devices);
}

function toDbTaskType(value: string): "install" | "milestone" | "purchase" | "signup" | "other" {
    return value === "install" || value === "milestone" || value === "purchase" || value === "signup"
        ? value
        : "other";
}
