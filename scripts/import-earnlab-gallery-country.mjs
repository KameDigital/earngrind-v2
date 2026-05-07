import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const EARNLAB_API_BASE = process.env.EARNLAB_API_BASE?.trim() || "https://api.earnlab.com";
const EARNLAB_TASKS_API_URL = process.env.EARNLAB_TASKS_API_URL?.trim() || `${EARNLAB_API_BASE}/tasks`;
const EARNLAB_PLATFORM_REDIRECT = "/go/platform/earnlab";
const MAX_LIMIT = 75;

loadEnvFile("workers/.env");
loadEnvFile(".env.local");

const country = normalizeCountry(process.argv[2] || "US");
const limit = Math.min(MAX_LIMIT, Math.max(1, Number(process.env.EARNLAB_IMPORT_LIMIT || process.argv[3] || 75) || 75));
const page = Math.max(0, Number(process.env.EARNLAB_IMPORT_PAGE || process.argv[4] || 0) || 0);
const sort = process.env.EARNLAB_IMPORT_SORT || "POPULARITY";

if (!country) {
    throw new Error("Usage: node scripts/import-earnlab-gallery-country.mjs US [limit] [page]");
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const db = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});

const stats = {
    fetched: 0,
    imported: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
};

const gallery = await fetchEarnLabGallery(country, { limit, page, sort });
stats.fetched = gallery.offers.length;

const platform = await ensureEarnLabPlatform();

for (const offer of gallery.offers) {
    try {
        const result = await upsertGalleryOffer(platform.id, offer);
        stats.imported += 1;
        stats[result] += 1;
    } catch (error) {
        stats.failed += 1;
        console.error("[earnlab-gallery-import] offer failed", {
            country,
            offerId: offer.id,
            title: offer.title,
            message: error instanceof Error ? error.message : String(error),
        });
    }
}

console.log(JSON.stringify({
    countryCode: country,
    page,
    limit,
    sort,
    totalItems: gallery.meta.totalItems,
    totalPages: gallery.meta.totalPages,
    stats,
}, null, 2));

function loadEnvFile(relativePath) {
    const file = resolve(process.cwd(), relativePath);
    if (!existsSync(file)) return;

    const text = readFileSync(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
        const index = trimmed.indexOf("=");
        const key = trimmed.slice(0, index).trim();
        if (process.env[key]) continue;
        let value = trimmed.slice(index + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        process.env[key] = value;
    }
}

async function fetchEarnLabGallery(countryCode, options) {
    const url = new URL(EARNLAB_TASKS_API_URL);
    url.searchParams.set("country", countryCode);
    url.searchParams.set("sort", options.sort);
    url.searchParams.set("page", String(options.page));
    url.searchParams.set("limit", String(options.limit));

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            accept: "application/json, text/plain, */*",
            referer: "https://earnlab.com/tasks",
            origin: "https://earnlab.com",
            "user-agent": "EarnGrind/1.0 EarnLab Gallery Import",
            "x-country-code": countryCode,
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`EarnLab gallery request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload.data?.items) ? payload.data.items : [];
    const offers = items
        .map((item) => normalizeEarnLabGalleryTask(item, countryCode))
        .filter(Boolean);

    return {
        offers,
        meta: {
            totalItems: Number(payload.data?.totalItems ?? offers.length),
            totalPages: Number(payload.data?.totalPages ?? (offers.length < options.limit ? options.page + 1 : options.page + 2)),
        },
    };
}

function normalizeEarnLabGalleryTask(task, countryCode) {
    const id = String(task.id || "").trim();
    const title = normalizeWhitespace(task.name || "");
    const payout = toEarnLabUsd(task.reward);

    if (!id || !title || payout <= 0) return null;

    const description = normalizeWhitespace(task.description || "") || null;
    const providerName = normalizeProviderName(task.provider);
    const platforms = normalizePlatforms(task);
    const category = normalizeCategory(task.category, task.customCategory);
    const startUrl = buildStartUrl({ title, countryCode, payout, providerName });

    return {
        id,
        title,
        slug: slugify(title),
        description,
        shortDescription: description ? truncate(description, 150) : null,
        countryCode,
        reward: Number(task.reward ?? 0),
        payout,
        imageUrl: isHttpUrl(task.thumbnail) ? String(task.thumbnail).trim() : null,
        trackingUrl: null,
        startUrl,
        advertiserName: title,
        providerName,
        platform: platforms,
        category,
        requirements: description ? [description] : [],
        tasks: description
            ? [{
                title,
                rewardAmount: payout,
                rewardDisplay: `$${payout.toFixed(2)}`,
                taskType: inferTaskType(description),
                timeLimitText: extractEstimatedTime(description),
                notes: description,
                sortOrder: 1,
            }]
            : [],
    };
}

async function ensureEarnLabPlatform() {
    const { data: existing, error: existingError } = await db
        .from("platforms")
        .select("id")
        .eq("slug", "earnlab")
        .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    if (existing?.id) return { id: String(existing.id) };

    const { data, error } = await db
        .from("platforms")
        .insert({
            name: "EarnLab",
            slug: "earnlab",
            platform_kind: "gpt_site",
            affiliate_template: "https://earnlab.com/r/mac",
            is_active: true,
        })
        .select("id")
        .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to create EarnLab platform");
    return { id: String(data.id) };
}

async function ensureProvider(name) {
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

async function ensureGame(offer) {
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

async function upsertGalleryOffer(siteId, offer) {
    const provider = await ensureProvider(offer.providerName);
    const game = await ensureGame(offer);
    const externalId = `${offer.id}-${offer.countryCode}`;
    const legacyExternalId = offer.id;
    const now = new Date().toISOString();
    const payload = {
        site_id: siteId,
        provider_id: provider.id,
        game_id: game.id,
        external_id: externalId,
        title: offer.advertiserName ?? offer.title,
        payout_usd: offer.payout,
        total_payout_usd: normalizeTotalPayout(offer.payout, offer.payout),
        goal_text: offer.requirements[0] ?? offer.shortDescription,
        image_url: offer.imageUrl,
        devices: toDeviceTypes(offer.platform),
        countries: [offer.countryCode],
        status: "active",
        ingested_at: now,
        updated_at: now,
    };

    // EarnLab does not currently return direct per-offer links; keep future/manual URLs intact.
    if (offer.trackingUrl) {
        payload.offer_url = offer.trackingUrl;
    }

    const { data: existingScoped, error: scopedError } = await db
        .from("site_offers")
        .select("id, provider_id, game_id, title, payout_usd, total_payout_usd, goal_text, offer_url, image_url, devices, countries, status")
        .eq("site_id", siteId)
        .eq("external_id", externalId)
        .maybeSingle();

    if (scopedError) throw new Error(scopedError.message);

    const { data: existingLegacy, error: legacyError } = existingScoped ? { data: null, error: null } : await db
        .from("site_offers")
        .select("id, provider_id, game_id, title, payout_usd, total_payout_usd, goal_text, offer_url, image_url, devices, countries, status")
        .eq("site_id", siteId)
        .eq("external_id", legacyExternalId)
        .maybeSingle();

    if (legacyError) throw new Error(legacyError.message);
    const existing = existingScoped ?? existingLegacy;

    if (!existing) {
        const { data, error } = await db
            .from("site_offers")
            .insert({ ...payload, created_at: now })
            .select("id")
            .single();
        if (error || !data) throw new Error(error?.message ?? `Failed to insert ${offer.title}`);
        await replaceTasks(String(data.id), offer);
        return "created";
    }

    const changed =
        existing.provider_id !== payload.provider_id ||
        existing.game_id !== payload.game_id ||
        existing.title !== payload.title ||
        Number(existing.payout_usd ?? 0) !== payload.payout_usd ||
        Number(existing.total_payout_usd ?? 0) !== payload.total_payout_usd ||
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
    }

    await replaceTasks(String(existing.id), offer);
    return changed ? "updated" : "skipped";
}

async function replaceTasks(siteOfferId, offer) {
    const { error: deleteError } = await db
        .from("site_offer_tasks")
        .delete()
        .eq("site_offer_id", siteOfferId);
    if (deleteError) throw new Error(deleteError.message);

    const tasks = offer.tasks.length > 0
        ? offer.tasks
        : [{
            title: offer.title,
            rewardAmount: offer.payout,
            rewardDisplay: `$${offer.payout.toFixed(2)}`,
            taskType: "other",
            timeLimitText: null,
            notes: offer.description,
            sortOrder: 1,
        }];

    const now = new Date().toISOString();
    const { error } = await db
        .from("site_offer_tasks")
        .insert(tasks.map((task) => ({
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

function toDeviceTypes(platforms) {
    const devices = new Set();
    for (const platform of platforms) {
        if (platform === "iOS") devices.add("ios");
        if (platform === "Android") devices.add("android");
        if (platform === "Desktop") devices.add("pc");
        if (platform === "Web") devices.add("web");
    }
    if (devices.size === 0) devices.add("web");
    return Array.from(devices);
}

function normalizeCountry(value) {
    const normalized = String(value || "").trim().toUpperCase();
    return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function toEarnLabUsd(reward) {
    const value = Number(reward ?? 0);
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Number((value / 1000).toFixed(2));
}

function normalizeTotalPayout(payout, totalPayout) {
    const payoutNumber = Number(payout);
    const totalNumber = Number(totalPayout);
    if (!Number.isFinite(payoutNumber) && !Number.isFinite(totalNumber)) return 0;
    if (!Number.isFinite(totalNumber)) return Number(payoutNumber.toFixed(2));
    if (!Number.isFinite(payoutNumber)) return Number(totalNumber.toFixed(2));
    return Number(Math.max(payoutNumber, totalNumber).toFixed(2));
}

function toDbTaskType(value) {
    return ["install", "milestone", "purchase", "signup", "other"].includes(value) ? value : "other";
}

function normalizeWhitespace(value) {
    return String(value).replace(/\s+/g, " ").trim();
}

function normalizeProviderName(provider) {
    const value = normalizeWhitespace(provider || "");
    if (!value) return "EarnLab";
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

function normalizeCategory(category, customCategory) {
    const value = normalizeWhitespace(customCategory || category || "Offer");
    return value
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

function normalizePlatforms(task) {
    const platforms = [];
    if (task.isIOS) platforms.push("iOS");
    if (task.isAndroid) platforms.push("Android");
    if (task.isDesktop) platforms.push("Desktop");
    if (platforms.length === 0) platforms.push("Web");
    return platforms;
}

function inferTaskType(description) {
    const text = description.toLowerCase();
    if (text.includes("install")) return "install";
    if (text.includes("purchase") || text.includes("deposit")) return "purchase";
    if (text.includes("sign up") || text.includes("register")) return "signup";
    if (text.includes("level") || text.includes("reach")) return "milestone";
    return "other";
}

function extractEstimatedTime(description) {
    const match = description.match(/\b\d+\s+(?:day|days|hour|hours|minute|minutes)\b/i);
    return match?.[0] ?? null;
}

function buildStartUrl({ title, countryCode, payout, providerName }) {
    const url = new URL(EARNLAB_PLATFORM_REDIRECT, "https://earngrind.com");
    url.searchParams.set("source", "earnlab-gallery");
    url.searchParams.set("country", countryCode);
    url.searchParams.set("offer", slugify(title));
    url.searchParams.set("provider", slugify(providerName));
    url.searchParams.set("payout", payout.toFixed(2));
    return `${url.pathname}${url.search}`;
}

function isHttpUrl(value) {
    if (!value) return false;
    try {
        const url = new URL(String(value));
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function truncate(value, maxLength) {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 1).trim()}...`;
}

function slugify(value) {
    return String(value)
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 90) || "earnlab-offer";
}
