import { createClient } from "@supabase/supabase-js";

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
  offer,
  testPath: `/go/earn/${offer.id}`,
});
