"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateSavedOffer, type SavedOfferInput } from "@/lib/account-offers";

export type OfferActionResult = { ok: true } | { ok: false; error: string };
type DashboardTable = "user_offer_favorites" | "user_offer_tracking" | "user_offer_views";

async function currentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : user };
}

function values(userId: string, offer: SavedOfferInput) {
  return { user_id: userId, offer_source: offer.source, offer_id: offer.offerId, title: offer.title, image_url: offer.imageUrl, payout_usd: offer.payoutUsd, platform_name: offer.platformName, country_code: offer.countryCode, devices: offer.devices ?? [], offer_path: offer.offerPath, updated_at: new Date().toISOString() };
}

async function change(table: Exclude<DashboardTable, "user_offer_views">, input: unknown, enabled: boolean): Promise<OfferActionResult> {
  const parsed = validateSavedOffer(input); if (!parsed.ok) return parsed;
  const { supabase, user } = await currentUser(); if (!user) return { ok: false, error: "Please sign in to save offers." };
  const match = { user_id: user.id, offer_source: parsed.value.source, offer_id: parsed.value.offerId };
  const result = enabled
    ? await supabase.from(table).upsert(values(user.id, parsed.value), { onConflict: "user_id,offer_source,offer_id" })
    : await supabase.from(table).delete().match(match);
  if (result.error) return { ok: false, error: "We could not update this offer. Please try again." };
  revalidatePath("/account"); return { ok: true };
}

export const addFavorite = (input: unknown) => change("user_offer_favorites", input, true);
export const removeFavorite = (input: unknown) => change("user_offer_favorites", input, false);
export const addTracking = (input: unknown) => change("user_offer_tracking", input, true);
export const removeTracking = (input: unknown) => change("user_offer_tracking", input, false);

export async function recordOfferView(input: unknown): Promise<OfferActionResult> {
  const parsed = validateSavedOffer(input); if (!parsed.ok) return parsed;
  const { supabase, user } = await currentUser(); if (!user) return { ok: true };
  const { error } = await supabase.from("user_offer_views").upsert({ ...values(user.id, parsed.value), last_viewed_at: new Date().toISOString() }, { onConflict: "user_id,offer_source,offer_id" });
  if (error) return { ok: false, error: "We could not record that view." };
  await supabase.rpc("trim_my_offer_view_history");
  revalidatePath("/account"); return { ok: true };
}
