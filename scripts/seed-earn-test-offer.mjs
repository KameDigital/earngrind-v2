import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function parseEnvValue(rawValue) {
  const trimmed = rawValue.trim();
  const first = trimmed.at(0);
  const last = trimmed.at(-1);

  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function loadLocalEnv() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(scriptDir, "..", ".env.local");

  let envFile;
  try {
    envFile = readFileSync(envPath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }

  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const normalized = trimmed.startsWith("export ") ? trimmed.slice("export ".length).trimStart() : trimmed;
    const separatorIndex = normalized.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = normalized.slice(0, separatorIndex).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) continue;

    process.env[key] = parseEnvValue(normalized.slice(separatorIndex + 1));
  }
}

loadLocalEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const now = new Date().toISOString();

const { data: partner, error: partnerError } = await db
  .from("offer_partners")
  .upsert(
    {
      slug: "earngrind-test",
      name: "EarnGrind Test",
      status: "active",
      updated_at: now,
    },
    { onConflict: "slug" },
  )
  .select("id, slug, name")
  .single();

if (partnerError) {
  throw new Error(`Failed to upsert test partner: ${partnerError.message}`);
}

const { data: postbackConfig, error: postbackConfigError } = await db
  .from("offer_partner_postback_configs")
  .upsert(
    {
      offer_partner_id: partner.id,
      provider_slug: "earngrind-test",
      status: "active",
      secret_type: "static_token",
      secret_env_var: "POSTBACK_PROVIDER_EARNGRIND_TEST_SECRET",
      signature_algorithm: "none",
      signature_location: "body",
      signature_param: "token",
      allowed_ip_ranges: [],
      click_id_param: "click_id",
      transaction_id_param: "external_transaction_id",
      payout_param: "amount",
      currency_param: "currency",
      status_param: "status",
      status_map: {
        pending: "pending",
        approved: "approved",
        rejected: "rejected",
        reversed: "reversed",
        chargeback: "reversed",
      },
      redacted_fields: ["token"],
      timestamp_param: "timestamp",
      nonce_param: "nonce",
      max_clock_skew_seconds: 300,
      replay_ttl_seconds: 86400,
      updated_at: now,
    },
    { onConflict: "provider_slug" },
  )
  .select("id, provider_slug, secret_type, secret_env_var")
  .single();

if (postbackConfigError) {
  throw new Error(`Failed to upsert test postback config: ${postbackConfigError.message}`);
}

const { data: offer, error: offerError } = await db
  .from("earn_offers")
  .upsert(
    {
      partner_id: partner.id,
      title: "EarnGrind Test Offer",
      slug: "earngrind-test-offer",
      description: "Fake tracked offer for testing the EarnGrind rewards beta flow.",
      offer_url_template: "https://example.com/earngrind-test?click_id={click_id}&user_id={user_id}",
      countries: ["US"],
      devices: ["web", "android", "ios"],
      vertical: "test",
      payout_cents: 500,
      user_reward_cents: 100,
      currency: "USD",
      incentive_allowed: true,
      reward_allowed: true,
      pending_days: 0,
      requirements: "Use this seeded offer only for local click and postback testing.",
      status: "active",
      updated_at: now,
    },
    { onConflict: "slug" },
  )
  .select("id, slug, title, user_reward_cents")
  .single();

if (offerError) {
  throw new Error(`Failed to upsert test offer: ${offerError.message}`);
}

console.log("Seeded EarnGrind test offer");
console.log({
  partner,
  postbackConfig,
  offer,
  testPath: `/go/earn/${offer.id}`,
});
