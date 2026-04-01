// ---------------------------------------------------------------------------
// Ingestion orchestrator
//
// Runs for every configured platform:
//   1. Fetch RawOffer[] from provider (mock or real)
//   2. Resolve game UUIDs from DB
//   3. Normalize each offer
//   4. POST NormalizedOffer[] to the Edge Function
//   5. Print summary
//
// Usage:
//   PROVIDER=mock npm run ingest              → mock data for freecash + swagbucks
//   PROVIDER=adgate-media npm run ingest      → Adgate fixture (or live if creds set)
// ---------------------------------------------------------------------------
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { fetchMockOffers } from "./providers/mock";
import { fetchAdgateOffers } from "./providers/adgate";
import { fetchOfferToroOffers } from "./providers/offertoro";
import { fetchOGAdsOffers } from "./providers/ogads";
import { normalizeOffers } from "./normalizer";
import { postToEdgeFunction } from "./client";
import { RawOffer, RejectedOffer } from "./types";

// ── Supabase client (for resolving game UUIDs only) ──────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// ---------------------------------------------------------------------------
// Platform routing
// Each entry: { platformSlug, fetchRaw }
// fetchRaw does NOT receive the slug — providers are responsible for their
// own source; the slug is only used for normalization and DB writes.
// ---------------------------------------------------------------------------
interface PlatformConfig {
    platformSlug: string;
    fetchRaw: () => Promise<RawOffer[]>;
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
    { platformSlug: "swagbucks", fetchRaw: () => fetchMockOffers("swagbucks") },
    { platformSlug: "freecash", fetchRaw: () => fetchMockOffers("freecash") },
    { platformSlug: "adgate-media", fetchRaw: fetchAdgateOffers },
    { platformSlug: "offertoro", fetchRaw: fetchOfferToroOffers },
    { platformSlug: "ogads",        fetchRaw: fetchOGAdsOffers },
    { platformSlug: "earnlab",      fetchRaw: () => fetchMockOffers("earnlab") },
];


// ---------------------------------------------------------------------------
// Resolve all game slugs → UUIDs from DB (done once, shared across platforms)
// ---------------------------------------------------------------------------
async function resolveGameIds(): Promise<Record<string, string>> {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.warn("[orchestrator] Missing Supabase creds — game_ids will be null");
        return {};
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase.from("games").select("id, slug");
    if (error) {
        console.error("[orchestrator] Failed to resolve game IDs:", error.message);
        return {};
    }
    return Object.fromEntries((data ?? []).map((g: { id: string; slug: string }) => [g.slug, g.id]));
}

// ---------------------------------------------------------------------------
// Filter to active platforms based on PROVIDER env var
// If PROVIDER is set, only run that platform. Otherwise run all.
// ---------------------------------------------------------------------------
function getActivePlatforms(): PlatformConfig[] {
    const providerFilter = process.env.PROVIDER;
    if (!providerFilter || providerFilter === "all") return PLATFORM_CONFIGS;
    const match = PLATFORM_CONFIGS.find(p => p.platformSlug === providerFilter);
    if (!match) {
        console.warn(`[orchestrator] Unknown provider "${providerFilter}". Running all platforms.`);
        return PLATFORM_CONFIGS;
    }
    return [match];
}


// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
    console.log("🚀 EarnGrind ingestion starting…");
    const t0 = Date.now();

    const gameIds = await resolveGameIds();
    const configs = getActivePlatforms();

    console.log(`📡 Provider filter: ${process.env.PROVIDER ?? "all"}`);
    console.log(`🎮 Game IDs resolved: ${Object.keys(gameIds).length}`);
    console.log(`📋 Platforms to run: ${configs.map(c => c.platformSlug).join(", ")}`);

    const platformResults = [];

    for (const { platformSlug, fetchRaw } of configs) {
        console.log(`\n── ${platformSlug} ──────────────────────────`);
        try {
            // 1. Fetch raw offers
            const rawOffers = await fetchRaw();
            console.log(`  📥 Fetched: ${rawOffers.length} raw offers`);

            // 2. Normalize (batch — returns accepted + rejected report)
            const report = normalizeOffers(rawOffers, platformSlug, gameIds);
            const { accepted, rejected, unmatched } = report;

            console.log(`  ✅ Accepted: ${accepted.length}  ❌ Rejected: ${rejected.length}  🔗 Unmatched game: ${unmatched}`);

            // Log rejection details so bad data is visible without crashing
            if (rejected.length > 0) {
                console.warn(`  ── Rejection details (first ${Math.min(rejected.length, 5)}) ──`);
                rejected.slice(0, 5).forEach((r: RejectedOffer) =>
                    console.warn(`    [${r.reason}] ${r.external_id} — "${r.title.slice(0, 60)}" ${r.detail ? `(${r.detail})` : ""}`)
                );
                if (rejected.length > 5) {
                    console.warn(`    … and ${rejected.length - 5} more.`);
                }
            }

            if (accepted.length === 0) {
                console.warn(`  ⚠️  No valid offers — skipping Edge Function call`);
                continue;
            }

            // 3. POST accepted offers + monitoring metadata to Edge Function
            const result = await postToEdgeFunction(
                platformSlug,
                accepted,
                rawOffers.length,
                rejected.length,
                unmatched
            );
            const runTag = result.run_id ? ` [run:${result.run_id.slice(0, 8)}]` : "";
            console.log(`  📊 DB: inserted=${result.inserted} updated=${result.updated} expired=${result.expired} errors=${result.errors} (${result.durationMs}ms)${runTag}`);
            platformResults.push(result);

        } catch (err) {
            console.error(`  ❌ Failed for ${platformSlug}:`, (err as Error).message);
        }
    }

    const totalMs = Date.now() - t0;
    console.log(`\n✨ Ingestion complete in ${totalMs}ms`);
    console.log(JSON.stringify(platformResults, null, 2));
}

main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
