import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ROOT_ENV_FILES = ["workers/.env", ".env.local"];
const GEMSLOOT_LIST_URL = "https://gemsloot.com/_api/offer/list";
const GEMSLOOT_PROVIDERS_URL = "https://gemsloot.com/_api/offer/providers";
const GEMSLOOT_DETAIL_URL = "https://gemsloot.com/_api/offer/get_offer";
const GEMSLOOT_SITE_URL = "https://gemsloot.com/earn";
const PAGE_SIZE = 30;
const DETAIL_CONCURRENCY = 8;

loadEnvFiles(ROOT_ENV_FILES);

const country = normalizeCountry(process.argv[2]) ?? "US";
const providerArg = process.argv[3] && process.argv[3] !== "all" ? process.argv[3] : null;
const limit = Math.min(300, Math.max(1, Number(process.argv[4] ?? 120) || 120));

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

const stats = {
    fetched: 0,
    imported: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
};

const site = await ensurePlatform();
const providers = await fetchProviders();
const providerNames = providerArg ? [providerArg] : providers.map((provider) => provider.name);
const listRows = await fetchListRows(providerNames, limit);
const offers = await mapWithConcurrency(listRows, DETAIL_CONCURRENCY, async (entry) => {
    const detail = await fetchDetail(entry.offer.id).catch(() => null);
    return normalizeOffer(entry.offer, detail, entry.completedCount, country);
});

for (const offer of offers.filter(Boolean).slice(0, limit)) {
    stats.fetched += 1;
    try {
        const result = await upsertOffer(site.id, offer);
        stats.imported += 1;
        stats[result] += 1;
    } catch (error) {
        stats.failed += 1;
        console.error("[gemsloot-import] offer failed", {
            id: offer.id,
            title: offer.title,
            message: error instanceof Error ? error.message : String(error),
        });
    }
}

const quality = await buildQuality();
console.log(JSON.stringify({ country, provider: providerArg, limit, stats, quality }, null, 2));

async function fetchProviders() {
    const response = await fetch(GEMSLOOT_PROVIDERS_URL, { headers: headers() });
    if (!response.ok) throw new Error(`Provider request failed: ${response.status}`);
    const payload = await response.json();
    return (Array.isArray(payload) ? payload : [])
        .map((item) => ({ name: clean(item.name), count: Number(item.count) || 0 }))
        .filter((item) => item.name);
}

async function fetchListRows(providerNames, maxRows) {
    const rows = [];
    const maxPages = Math.ceil(maxRows / PAGE_SIZE) + 2;
    for (let page = 0; page < maxPages && rows.length < maxRows; page += 1) {
        const response = await fetch(GEMSLOOT_LIST_URL, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({
                search: [""],
                filter: "epc",
                categorie: "all",
                page,
                provider: providerNames,
            }),
        });
        if (!response.ok) throw new Error(`List request failed: ${response.status}`);
        const payload = await response.json();
        const offers = Array.isArray(payload.offers) ? payload.offers : [];
        const completed = Array.isArray(payload.completed_amount) ? payload.completed_amount : [];
        offers.forEach((offer, index) => rows.push({ offer, completedCount: Number(completed[index]) || null }));
        if (offers.length < PAGE_SIZE) break;
    }
    return rows;
}

async function fetchDetail(id) {
    if (!id) return null;
    const response = await fetch(`${GEMSLOOT_DETAIL_URL}/${encodeURIComponent(id)}`, { headers: headers() });
    if (!response.ok) throw new Error(`Detail request failed: ${response.status}`);
    const payload = await response.json();
    return payload?.id ? payload : null;
}

function normalizeOffer(list, detail, completedCount, fallbackCountry) {
    const id = clean(detail?.id ?? list?.id);
    const title = clean(detail?.name ?? list?.name);
    const provider = clean(detail?.provider ?? list?.provider) || "Gemsloot";
    const totalPayout = round(toNumber(detail?.points ?? list?.points));
    const tasks = normalizeTasks(detail?.steps);
    const bestTask = tasks.reduce((max, task) => Math.max(max, task.rewardAmount), 0);
    const countries = normalizeCountries(detail?.loc, fallbackCountry);
    if (!id || !title || totalPayout <= 0 || !countries.includes(fallbackCountry)) return null;

    return {
        id,
        provider,
        title,
        slug: slugify(title),
        payout: bestTask > 0 ? bestTask : totalPayout,
        totalPayout,
        imageUrl: clean(detail?.img ?? list?.img) || null,
        startUrl: `${GEMSLOOT_SITE_URL}?modal=offer_2&name=${encodeURIComponent(id)}`,
        category: extractCategory(detail?.my_category ?? list?.category),
        devices: normalizeDevices(detail?.os ?? list?.os),
        countries,
        countryCode: fallbackCountry,
        goalText: (tasks[0]?.title ?? clean(detail?.dsc ?? detail?.to_know)) || null,
        tasks,
        completedCount,
    };
}

async function ensurePlatform() {
    const { data: existing, error: selectError } = await db.from("platforms").select("id").eq("slug", "gemsloot").maybeSingle();
    if (selectError) throw new Error(selectError.message);
    if (existing?.id) return existing;

    const { data, error } = await db.from("platforms").insert({
        name: "Gemsloot",
        slug: "gemsloot",
        platform_kind: "gpt_site",
        affiliate_template: "https://gemsloot.com/?aff=kamedev",
        is_active: true,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return data;
}

async function ensureProvider(name) {
    const slug = slugify(name);
    const { data: existing, error: selectError } = await db.from("providers").select("id").eq("slug", slug).maybeSingle();
    if (selectError) throw new Error(selectError.message);
    if (existing?.id) return existing;

    const { data, error } = await db.from("providers").insert({ name, slug, is_active: true }).select("id").single();
    if (error) throw new Error(error.message);
    return data;
}

async function ensureGame(offer) {
    const { data: existing, error: selectError } = await db.from("games").select("id").eq("slug", offer.slug).maybeSingle();
    if (selectError) throw new Error(selectError.message);
    if (existing?.id) return existing;

    const { data, error } = await db.from("games").insert({
        name: offer.title,
        slug: offer.slug,
        aliases: [offer.title],
        category: offer.category.toLowerCase().replace(/\s+/g, "_"),
        devices: offer.devices,
        thumbnail_url: offer.imageUrl,
        description: offer.goalText,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return data;
}

async function upsertOffer(siteId, offer) {
    const provider = await ensureProvider(offer.provider);
    const game = await ensureGame(offer);
    const externalId = `gemsloot-${slugify(offer.provider)}-${offer.id}-${offer.countryCode}`;
    const now = new Date().toISOString();
    const payload = {
        site_id: siteId,
        provider_id: provider.id,
        game_id: game.id,
        external_id: externalId,
        title: offer.title,
        payout_usd: offer.payout,
        total_payout_usd: normalizeTotalPayout(offer.payout, offer.totalPayout),
        goal_text: offer.goalText,
        offer_url: offer.startUrl,
        image_url: offer.imageUrl,
        devices: offer.devices,
        countries: [offer.countryCode],
        status: "active",
        ingested_at: now,
        updated_at: now,
    };

    const { data: existing, error: selectError } = await db
        .from("site_offers")
        .select("id, provider_id, game_id, title, payout_usd, total_payout_usd, goal_text, offer_url, image_url, devices, countries, status")
        .eq("site_id", siteId)
        .eq("provider_id", provider.id)
        .eq("external_id", externalId)
        .maybeSingle();
    if (selectError) throw new Error(selectError.message);

    if (!existing) {
        const { data, error } = await db.from("site_offers").insert({ ...payload, created_at: now }).select("id").single();
        if (error) throw new Error(error.message);
        await replaceTasks(data.id, offer.tasks, offer);
        return "created";
    }

    const changed =
        existing.provider_id !== payload.provider_id ||
        existing.game_id !== payload.game_id ||
        existing.title !== payload.title ||
        Number(existing.payout_usd ?? 0) !== payload.payout_usd ||
        Number(existing.total_payout_usd ?? 0) !== payload.total_payout_usd ||
        existing.goal_text !== payload.goal_text ||
        existing.offer_url !== payload.offer_url ||
        existing.image_url !== payload.image_url ||
        JSON.stringify(existing.devices ?? []) !== JSON.stringify(payload.devices) ||
        JSON.stringify(existing.countries ?? []) !== JSON.stringify(payload.countries) ||
        existing.status !== payload.status;

    if (changed) {
        const { error } = await db.from("site_offers").update(payload).eq("id", existing.id);
        if (error) throw new Error(error.message);
    }
    await replaceTasks(existing.id, offer.tasks, offer);
    return changed ? "updated" : "skipped";
}

async function replaceTasks(siteOfferId, tasks, offer) {
    const { error: deleteError } = await db.from("site_offer_tasks").delete().eq("site_offer_id", siteOfferId);
    if (deleteError) throw new Error(deleteError.message);

    const rows = tasks.length > 0 ? tasks : [{
        title: offer.title,
        rewardAmount: offer.payout,
        rewardDisplay: `$${offer.payout.toFixed(2)}`,
        taskType: "other",
        timeLimitText: null,
        notes: offer.goalText,
        sortOrder: 1,
    }];
    const now = new Date().toISOString();
    const { error } = await db.from("site_offer_tasks").insert(rows.map((task) => ({
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

async function buildQuality() {
    const { data, error } = await db
        .from("site_offers")
        .select("id, external_id, payout_usd, image_url, countries, status, tasks:site_offer_tasks(id)")
        .like("external_id", "gemsloot-%")
        .limit(5000);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    return {
        totalGemslootRows: rows.length,
        active: rows.filter((row) => row.status === "active").length,
        missingImages: rows.filter((row) => !row.image_url).length,
        lowPayouts: rows.filter((row) => Number(row.payout_usd ?? 0) <= 0.01).length,
        missingTasks: rows.filter((row) => !Array.isArray(row.tasks) || row.tasks.length === 0).length,
    };
}

function normalizeTasks(steps) {
    if (!Array.isArray(steps)) return [];
    return steps.map((step, index) => {
        const title = clean(step?.name);
        const rewardAmount = round(toNumber(step?.points));
        if (!title || rewardAmount < 0) return null;
        return {
            title,
            rewardAmount,
            rewardDisplay: `$${rewardAmount.toFixed(2)}`,
            taskType: inferTaskType(title),
            timeLimitText: formatExpireHours(step?.expire_hours),
            notes: null,
            sortOrder: index + 1,
        };
    }).filter(Boolean);
}

function normalizeCountries(value, fallbackCountry) {
    if (!Array.isArray(value)) return [fallbackCountry];
    const countries = value.map((item) => clean(item).toUpperCase()).filter((item) => /^[A-Z]{2}$/.test(item));
    return countries.length ? Array.from(new Set(countries)) : [fallbackCountry];
}

function normalizeDevices(value) {
    const keys = value && typeof value === "object" ? Object.keys(value).map((item) => item.toLowerCase()) : [];
    const devices = new Set();
    if (keys.includes("ios")) devices.add("ios");
    if (keys.includes("android")) devices.add("android");
    if (keys.some((item) => ["windows", "mac", "desktop", "pc"].includes(item))) devices.add("pc");
    if (keys.includes("web")) devices.add("web");
    if (devices.size === 0) devices.add("web");
    return Array.from(devices);
}

function extractCategory(value) {
    if (!value || typeof value !== "object") return "Other";
    const keys = Object.keys(value).map(clean).filter(Boolean);
    return keys.length ? keys.join(", ") : "Other";
}

function inferTaskType(value) {
    const text = value.toLowerCase();
    if (/\bsurvey|research\b/.test(text)) return "other";
    if (/\binstall|download\b/.test(text)) return "install";
    if (/\bsign up|signup|register|account\b/.test(text)) return "signup";
    if (/\bpurchase|buy|deposit|spend|recharge|pack\b/.test(text)) return "purchase";
    if (/\breach|complete|level|chapter|stage|milestone|board|village|tutorial\b/.test(text)) return "milestone";
    return "other";
}

function formatExpireHours(value) {
    if (!Number.isFinite(Number(value)) || Number(value) <= 0) return null;
    const hours = Number(value);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"}`;
}

function headers() {
    return {
        accept: "application/json, text/plain, */*",
        origin: "https://gemsloot.com",
        referer: "https://gemsloot.com/earn/all",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/147.0.0.0 Safari/537.36",
        "content-type": "application/json",
    };
}

function loadEnvFiles(paths) {
    for (const path of paths) {
        try {
            const body = readFileSync(path, "utf8");
            for (const rawLine of body.split(/\r?\n/)) {
                const line = rawLine.trim();
                if (!line || line.startsWith("#") || !line.includes("=")) continue;
                const index = line.indexOf("=");
                const key = line.slice(0, index).trim();
                const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
                if (key && process.env[key] === undefined) process.env[key] = value;
            }
        } catch {
            // Optional env file.
        }
    }
}

function normalizeCountry(value) {
    const normalized = String(value ?? "").trim().toUpperCase();
    return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

async function mapWithConcurrency(items, concurrency, mapper) {
    const results = [];
    let index = 0;
    const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
        for (;;) {
            const current = index;
            index += 1;
            if (current >= items.length) return;
            results[current] = await mapper(items[current]);
        }
    });
    await Promise.all(workers);
    return results;
}

function clean(value) {
    return String(value ?? "")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function toNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
    const parsed = Number(String(value ?? "").replace(/[$,\s]/g, ""));
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function slugify(value) {
    return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "gemsloot-offer";
}

function round(value) {
    return Number(Number(value).toFixed(2));
}

function normalizeTotalPayout(payout, totalPayout) {
    const payoutNumber = toNumber(payout);
    const totalNumber = toNumber(totalPayout);
    return round(Math.max(payoutNumber, totalNumber));
}

function toDbTaskType(value) {
    return ["install", "milestone", "purchase", "signup", "other"].includes(value) ? value : "other";
}
