import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const FEATURED_GEMSLOOT_OFFER_IDS = [
  "TyrAds__5553",
  "HangMyAds__82544",
  "TyrAds__4884",
  "TyrAds__4922",
  "WaxRewards__10-4513",
];

const GEMSLOOT_DETAIL_URL =
  process.env.GEMSLOOT_DETAIL_URL?.trim() ||
  "https://gemsloot.com/_api/offer/get_offer";
const GEMSLOOT_MODAL_URL =
  process.env.GEMSLOOT_SITE_URL?.trim() ||
  "https://gemsloot.com/transactions";

loadEnvFile(".env.local");
loadEnvFile(".env.production");

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const site = await ensurePlatform();
const results = [];

for (const offerId of FEATURED_GEMSLOOT_OFFER_IDS) {
  try {
    const detail = await fetchGemslootDetail(offerId);
    const normalized = normalizeGemslootDetail(detail, offerId);
    const provider = await ensureProvider(
      normalized.providerDisplayName,
      normalized.sourceProviderSlug,
    );
    const game = await ensureGame(normalized);
    const externalId = buildGemslootExternalId(normalized);
    const result = await upsertSiteOffer({
      siteId: site.id,
      providerId: provider.id,
      gameId: game.id,
      externalId,
      offer: normalized,
    });
    results.push({
      sourceOfferId: offerId,
      externalId,
      title: normalized.title,
      provider: normalized.providerDisplayName,
      result,
    });
  } catch (error) {
    results.push({
      sourceOfferId: offerId,
      result: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const summary = results.reduce(
  (acc, row) => {
    acc[row.result] = (acc[row.result] ?? 0) + 1;
    return acc;
  },
  {},
);

console.log(JSON.stringify({ summary, results }, null, 2));

function loadEnvFile(path) {
  const fullPath = resolve(process.cwd(), path);
  if (!existsSync(fullPath)) return;

  const text = readFileSync(fullPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

async function fetchGemslootDetail(offerId) {
  const response = await fetch(
    `${GEMSLOOT_DETAIL_URL}/${encodeURIComponent(offerId)}`,
    {
      headers: {
        accept: "application/json, text/plain, */*",
        origin: "https://gemsloot.com",
        referer: "https://gemsloot.com/earn/all",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/147.0.0.0 Safari/537.36",
        "content-type": "application/json",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`GemsLoot detail ${offerId} returned ${response.status}`);
  }
  const payload = await response.json();
  if (!payload?.id) throw new Error(`GemsLoot detail ${offerId} was empty`);
  return payload;
}

function normalizeGemslootDetail(detail, offerId) {
  const sourceOfferId = cleanText(detail.id || offerId);
  const title = cleanText(detail.name || sourceOfferId);
  const provider = cleanText(detail.provider || "Gemsloot");
  const totalPayoutUsd = round(toPositiveNumber(detail.points));
  const tasks = normalizeTasks(detail.steps);
  const bestTaskPayout = tasks.reduce(
    (max, task) => Math.max(max, task.rewardAmount),
    0,
  );
  const payoutUsd = bestTaskPayout > 0 ? bestTaskPayout : totalPayoutUsd;
  const countries = normalizeCountries(detail.loc);
  const description = cleanText(detail.dsc || detail.to_know || "");

  if (!sourceOfferId || !title || totalPayoutUsd <= 0) {
    throw new Error(`GemsLoot detail ${offerId} is missing title or payout`);
  }

  return {
    sourceOfferId,
    sourceProviderSlug: provider,
    providerDisplayName: provider,
    title,
    advertiserGameName: title,
    slug: slugify(title),
    category: extractCategories(detail.my_category),
    payoutUsd,
    totalPayoutUsd,
    imageUrl: cleanText(detail.img || "") || null,
    description: description || null,
    shortDescription: description ? truncate(description, 150) : null,
    requirements: tasks.map((task) => task.title),
    tasks,
    devices: normalizePlatforms(detail.os),
    countries,
    countryCode: countries.includes("US") ? "US" : countries[0] || "US",
    trackingUrl: buildGemslootModalUrl(sourceOfferId),
  };
}

async function ensurePlatform() {
  const { data: existing, error: existingError } = await supabase
    .from("platforms")
    .select("id")
    .eq("slug", "gemsloot")
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing?.id) return existing;

  const { data, error } = await supabase
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
  if (error || !data) throw new Error(error?.message || "Failed to create Gemsloot platform");
  return data;
}

async function ensureProvider(name, slugSeed) {
  const slug = slugify(slugSeed || name, "provider");
  const { data: existing, error: existingError } = await supabase
    .from("providers")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing?.id) return existing;

  const { data, error } = await supabase
    .from("providers")
    .insert({ name, slug, is_active: true })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message || `Failed to create provider ${name}`);
  return data;
}

async function ensureGame(offer) {
  const title = cleanText(offer.advertiserGameName || offer.title);
  const slug = slugify(offer.slug || title, "game");
  const { data: existing, error: existingError } = await supabase
    .from("games")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing?.id) return existing;

  const { data, error } = await supabase
    .from("games")
    .insert({
      name: title,
      slug,
      aliases: [offer.title],
      category: slugify(offer.category || "Other", "other").replace(/-/g, "_"),
      devices: normalizeGalleryDevices(offer.devices),
      thumbnail_url: safeImageUrl(offer.imageUrl),
      description: offer.shortDescription || offer.description || null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message || `Failed to create game ${title}`);
  return data;
}

async function upsertSiteOffer({ siteId, providerId, gameId, externalId, offer }) {
  const now = new Date().toISOString();
  const payload = {
    site_id: siteId,
    provider_id: providerId,
    game_id: gameId,
    external_id: externalId,
    title: cleanText(offer.advertiserGameName || offer.title),
    payout_usd: normalizeMoney(offer.payoutUsd),
    total_payout_usd: normalizeTotalPayout(
      normalizeMoney(offer.payoutUsd),
      normalizeMoney(offer.totalPayoutUsd),
    ),
    goal_text: offer.requirements?.[0] || offer.shortDescription || null,
    image_url: safeImageUrl(offer.imageUrl),
    devices: normalizeGalleryDevices(offer.devices),
    countries: normalizeGalleryCountries(offer),
    status: "active",
    ingested_at: now,
    updated_at: now,
    offer_url: offer.trackingUrl,
  };

  const { data: existing, error: existingError } = await supabase
    .from("site_offers")
    .select("id, provider_id, game_id, external_id, title, payout_usd, total_payout_usd, goal_text, offer_url, image_url, devices, countries, status")
    .eq("site_id", siteId)
    .eq("provider_id", providerId)
    .eq("external_id", externalId)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  let siteOfferId;
  let result;

  if (existing?.id) {
    siteOfferId = existing.id;
    const changed =
      existing.provider_id !== payload.provider_id ||
      existing.game_id !== payload.game_id ||
      existing.external_id !== payload.external_id ||
      existing.title !== payload.title ||
      Number(existing.payout_usd || 0) !== payload.payout_usd ||
      Number(existing.total_payout_usd || 0) !== payload.total_payout_usd ||
      existing.goal_text !== payload.goal_text ||
      existing.offer_url !== payload.offer_url ||
      existing.image_url !== payload.image_url ||
      JSON.stringify(existing.devices || []) !== JSON.stringify(payload.devices) ||
      JSON.stringify(existing.countries || []) !== JSON.stringify(payload.countries) ||
      existing.status !== payload.status;

    if (changed) {
      const { error } = await supabase
        .from("site_offers")
        .update(payload)
        .eq("id", siteOfferId);
      if (error) throw new Error(error.message);
      result = "updated";
    } else {
      result = "skipped";
    }
  } else {
    const { data, error } = await supabase
      .from("site_offers")
      .insert({ ...payload, created_at: now })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message || `Failed to insert ${offer.title}`);
    siteOfferId = data.id;
    result = "created";
  }

  await replaceTasks(siteOfferId, offer, now);
  return result;
}

async function replaceTasks(siteOfferId, offer, now) {
  const tasks = normalizeGalleryTasks(offer);
  const { error } = await supabase.rpc("replace_site_offer_tasks_atomic", {
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

function buildGemslootExternalId(offer) {
  return `gemsloot-${slugify(offer.providerDisplayName)}-${offer.sourceOfferId}-${offer.countryCode}`;
}

function buildGemslootModalUrl(offerId) {
  const url = new URL(GEMSLOOT_MODAL_URL);
  url.searchParams.set("modal", "offer_3");
  url.searchParams.set("name", offerId);
  url.searchParams.set("aff", "kamedev");
  return url.toString();
}

function normalizeTasks(steps) {
  if (!Array.isArray(steps)) return [];
  return steps
    .map((step, index) => {
      const title = cleanText(step?.name || "");
      const rewardAmount = normalizeMoney(step?.points);
      if (!title || rewardAmount < 0) return null;
      return {
        title,
        rewardAmount,
        rewardDisplay: formatUsd(rewardAmount),
        taskType: inferTaskType(title),
        timeLimitText: formatExpireHours(step?.expire_hours),
        notes: null,
        sortOrder: index + 1,
      };
    })
    .filter(Boolean);
}

function normalizeGalleryTasks(offer) {
  const sourceTasks = offer.tasks?.length
    ? offer.tasks
    : [{
        title: offer.requirements?.[0] || offer.shortDescription || offer.title,
        rewardAmount: offer.payoutUsd,
        rewardDisplay: formatUsd(offer.payoutUsd),
        taskType: "other",
        timeLimitText: null,
        notes: offer.description || null,
        sortOrder: 1,
      }];
  return sourceTasks.map((task, index) => {
    const title = cleanText(task.title || offer.title) || "Complete offer";
    const rewardAmount = normalizeMoney(task.rewardAmount);
    return {
      title,
      rewardAmount,
      rewardDisplay: task.rewardDisplay || formatUsd(rewardAmount),
      taskType: toDbTaskType(task.taskType, title),
      timeLimitText: task.timeLimitText || null,
      notes: task.notes || null,
      sortOrder: Number.isFinite(task.sortOrder) ? Number(task.sortOrder) : index + 1,
    };
  });
}

function normalizeGalleryDevices(values) {
  const devices = new Set();
  for (const value of values || []) {
    const normalized = value.trim().toLowerCase();
    if (["ios", "iphone", "ipad"].includes(normalized)) devices.add("ios");
    if (normalized === "android") devices.add("android");
    if (["pc", "desktop", "windows", "mac"].includes(normalized)) devices.add("pc");
    if (["web", "browser"].includes(normalized)) devices.add("web");
  }
  if (devices.size === 0) devices.add("web");
  return Array.from(devices);
}

function normalizeGalleryCountries(offer) {
  const countries = (offer.countries?.length ? offer.countries : [offer.countryCode])
    .map((country) => cleanText(country).toUpperCase())
    .filter((country) => /^[A-Z]{2}$/.test(country));
  return Array.from(new Set(countries.length > 0 ? countries : [offer.countryCode]));
}

function normalizeCountries(value) {
  if (!Array.isArray(value)) return ["US"];
  const countries = value
    .map((item) => cleanText(String(item || "")).toUpperCase())
    .filter((item) => /^[A-Z]{2}$/.test(item));
  return countries.length > 0 ? Array.from(new Set(countries)) : ["US"];
}

function normalizePlatforms(value) {
  const keys = value && typeof value === "object"
    ? Object.keys(value).map((item) => item.toLowerCase())
    : [];
  const platforms = [];
  if (keys.includes("ios")) platforms.push("iOS");
  if (keys.includes("android")) platforms.push("Android");
  if (keys.some((item) => ["windows", "mac", "desktop", "pc"].includes(item))) {
    platforms.push("Desktop");
  }
  if (keys.includes("web")) platforms.push("Web");
  if (platforms.length === 0) platforms.push("Web");
  return Array.from(new Set(platforms));
}

function extractCategories(value) {
  if (!value || typeof value !== "object") return "Other";
  const keys = Object.keys(value).map((item) => cleanText(item)).filter(Boolean);
  return keys.length > 0 ? keys.join(", ") : "Other";
}

function inferTaskType(value) {
  const text = value.toLowerCase();
  if (/\binstall|download\b/.test(text)) return "install";
  if (/\bsign up|signup|register|account\b/.test(text)) return "signup";
  if (/\bpurchase|buy|deposit|spend|recharge|pack\b/.test(text)) return "purchase";
  if (/\breach|complete|level|chapter|stage|milestone|board|village|tutorial\b/.test(text)) return "milestone";
  return "other";
}

function toDbTaskType(value, title) {
  const normalized = String(value || "").toLowerCase();
  if (["install", "milestone", "purchase", "signup"].includes(normalized)) {
    return normalized;
  }
  return inferTaskType(`${value || ""} ${title}`);
}

function formatExpireHours(value) {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) return null;
  const hours = Number(value);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

function safeImageUrl(value) {
  const trimmed = value?.trim() || "";
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeTotalPayout(payout, totalPayout) {
  if (!Number.isFinite(totalPayout) || totalPayout <= 0) return payout;
  return Math.max(payout, totalPayout);
}

function toPositiveNumber(value) {
  const parsed = typeof value === "number"
    ? value
    : Number(String(value || "").replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function normalizeMoney(value) {
  return round(toPositiveNumber(value));
}

function formatUsd(value) {
  return `$${normalizeMoney(value).toFixed(2)}`;
}

function cleanText(value) {
  return String(value || "")
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

function slugify(value, fallback = "gallery-offer") {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || fallback;
}

function truncate(value, maxLength) {
  return value.length <= maxLength
    ? value
    : `${value.slice(0, maxLength - 1).trim()}...`;
}

function round(value) {
  return Number(Number(value || 0).toFixed(2));
}
