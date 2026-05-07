import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import {
    GemslootGalleryOffer,
    GemslootGalleryTaskStep,
    getGemslootGalleryOffers,
    normalizeGemslootCountryCode,
    normalizeGemslootProvider,
    slugify,
} from "@/lib/gemsloot-gallery";
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

type QualityReport = {
    totalGemslootRows: number;
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

let serviceClient: DbClient | null = null;

function getServiceClient(): DbClient {
    if (serviceClient) return serviceClient;

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for Gemsloot gallery imports.");
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

    const country = normalizeGemslootCountryCode(typeof body.country === "string" ? body.country : "US");
    if (!country) {
        return NextResponse.json({ error: "country must be a two-letter country code such as US or GB" }, { status: 400 });
    }

    const provider = normalizeGemslootProvider(typeof body.provider === "string" ? body.provider : null);
    const device = typeof body.device === "string" ? body.device : null;
    const search = typeof body.search === "string" ? body.search : null;
    const sort = body.sort === "completed" ? "completed" : "epc";
    const limit = Math.min(300, Math.max(1, Number(body.limit ?? 120) || 120));
    const refresh = body.refresh !== false;
    const stats: ImportStats = {
        fetched: 0,
        imported: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
    };

    try {
        const gallery = await getGemslootGalleryOffers({
            country,
            provider,
            device,
            search,
            sort,
            limit,
            refresh,
        });
        const db = getServiceClient();
        const site = await ensureGemslootPlatform(db);
        stats.fetched = gallery.offers.length;

        for (const offer of gallery.offers) {
            try {
                const result = await upsertGemslootOffer(db, site.id, offer);
                stats.imported += 1;
                stats[result] += 1;
            } catch (error) {
                stats.failed += 1;
                console.error("[admin/gemsloot/gallery-import] offer failed", {
                    country,
                    provider,
                    offerId: offer.id,
                    title: offer.title,
                    message: error instanceof Error ? error.message : String(error),
                });
            }
        }

        return NextResponse.json({
            countryCode: gallery.countryCode,
            provider: gallery.provider,
            providers: gallery.providers,
            stats,
            quality: await buildGemslootQualityReport(db),
        });
    } catch (error) {
        console.error("[admin/gemsloot/gallery-import] failed", {
            country,
            provider,
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: "Import failed" }, { status: 500 });
    }
}

async function ensureGemslootPlatform(db: DbClient): Promise<{ id: string }> {
    const { data: existing, error: existingError } = await db
        .from("platforms")
        .select("id")
        .eq("slug", "gemsloot")
        .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    if (existing?.id) return { id: String(existing.id) };

    const { data, error } = await db
        .from("platforms")
        .insert({
            name: "Gemsloot",
            slug: "gemsloot",
            platform_kind: "gpt_site",
            affiliate_template: "https://gemsloot.com/?aff=kamedev",
            is_active: true,
        })
        .select("id")
        .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to create Gemsloot platform");
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

async function ensureGame(db: DbClient, offer: GemslootGalleryOffer): Promise<{ id: string }> {
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

async function upsertGemslootOffer(
    db: DbClient,
    siteId: string,
    offer: GemslootGalleryOffer,
): Promise<"created" | "updated" | "skipped"> {
    const provider = await ensureProvider(db, offer.providerName);
    const game = await ensureGame(db, offer);
    const externalId = `gemsloot-${slugify(offer.providerName)}-${offer.id}-${offer.countryCode}`;
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
    // Gemsloot detail responses include advertiser URLs with CLICKID placeholders.
    // Do not use those as direct tracking links; only store the safe Gemsloot modal URL.
    if (offer.trackingUrl) {
        payload.offer_url = offer.trackingUrl;
    }

    const { data: existing, error: existingError } = await db
        .from("site_offers")
        .select("id, provider_id, game_id, title, payout_usd, total_payout_usd, goal_text, offer_url, image_url, devices, countries, status")
        .eq("site_id", siteId)
        .eq("provider_id", provider.id)
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

async function buildGemslootQualityReport(db: DbClient): Promise<QualityReport> {
    const { data, error } = await db
        .from("site_offers")
        .select(`
            id, external_id, payout_usd, image_url, countries, status,
            provider:providers(name),
            game:games(slug),
            tasks:site_offer_tasks(id)
        `)
        .like("external_id", "gemsloot-%")
        .limit(5000);

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<Record<string, any>>;
    const externalCounts = new Map<string, number>();
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
        totalGemslootRows: rows.length,
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

function increment(record: Record<string, number>, key: string): void {
    record[key] = (record[key] ?? 0) + 1;
}

function firstRelated(value: unknown): any {
    return Array.isArray(value) ? value[0] ?? null : value;
}

async function replaceTasks(
    db: DbClient,
    siteOfferId: string,
    tasks: GemslootGalleryTaskStep[],
    offer: GemslootGalleryOffer,
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

function toDeviceTypes(platforms: GemslootGalleryOffer["platform"]): string[] {
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
