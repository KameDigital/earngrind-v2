import "server-only";

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase/public";
import { shapePublicOffer, type UnifiedOfferRow } from "@/lib/public-offers";

export type HomepageFeaturedOffer = ReturnType<typeof shapePublicOffer> & {
  featured: { id: string; badge: string | null; lock_summary: string | null; priority: number; placement: string };
};

type FeaturedRow = {
  id: string;
  offer_id: string;
  offer_source: "ingested" | "manual";
  badge: string | null;
  lock_summary: string | null;
  display_priority: number;
  placement: string;
};

export const getHomepageFeaturedOffers = unstable_cache(async () => {
  // Public RLS policies expose only active, in-window collection rows. Use the
  // stateless anon client so this ISR cache never reaches into request cookies.
  const now = new Date().toISOString();
  const [{ data: settings, error: settingsError }, { data: featuredRows, error: featuredError }] = await Promise.all([
    supabase.from("homepage_featured_settings").select("display_limit").eq("id", true).single(),
    supabase.from("homepage_featured_offers")
      .select("id, offer_id, offer_source, badge, lock_summary, display_priority, placement")
      .eq("is_active", true)
      .eq("placement", "weekly_top_games")
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("display_priority", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);
  // A deploy can briefly run application code before its migration reaches the
  // database. Keep the marketing page available, with no picks, during that
  // narrow window rather than failing the entire homepage render.
  if (settingsError?.code === "PGRST205" || featuredError?.code === "PGRST205") {
    return { data: [] as HomepageFeaturedOffer[], limit: 8 };
  }
  if (settingsError) throw settingsError;
  if (featuredError) throw featuredError;

  const limit = settings?.display_limit ?? 8;
  const rows = ((featuredRows ?? []) as FeaturedRow[]).slice(0, limit);
  if (!rows.length) return { data: [] as HomepageFeaturedOffer[], limit };

  // The collection controls the ids; this deliberately does not call the
  // full-text search RPC or any public offers endpoint.
  const idsBySource = {
    ingested: rows.filter((row) => row.offer_source === "ingested").map((row) => row.offer_id),
    manual: rows.filter((row) => row.offer_source === "manual").map((row) => row.offer_id),
  };
  const [ingested, manual] = await Promise.all([
    idsBySource.ingested.length
      ? supabase.from("unified_offers_view").select("*").eq("source", "ingested").in("id", idsBySource.ingested)
      : Promise.resolve({ data: [], error: null }),
    idsBySource.manual.length
      ? supabase.from("unified_offers_view").select("*").eq("source", "manual").in("id", idsBySource.manual)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (ingested.error) throw ingested.error;
  if (manual.error) throw manual.error;

  const offers = new Map<string, UnifiedOfferRow>();
  for (const row of [...(ingested.data ?? []), ...(manual.data ?? [])] as UnifiedOfferRow[]) {
    offers.set(`${row.source}:${row.id}`, row);
  }
  return {
    limit,
    data: rows.flatMap((row) => {
      const offer = offers.get(`${row.offer_source}:${row.offer_id}`);
      return offer ? [{ ...shapePublicOffer(offer), featured: { id: row.id, badge: row.badge, lock_summary: row.lock_summary, priority: row.display_priority, placement: row.placement } }] : [];
    }),
  };
}, ["homepage-weekly-top-games"], { revalidate: 60, tags: ["homepage-featured"] });
