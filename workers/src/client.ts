// ---------------------------------------------------------------------------
// HTTP client — POSTs normalized offers + monitoring metadata to the Edge Fn
// ---------------------------------------------------------------------------
import { NormalizedOffer, IngestPayload, IngestionResult } from "./types";

// Env vars are read inside postToEdgeFunction (at call time), not at module
// scope, so dotenv is guaranteed to have populated process.env before they
// are accessed — regardless of import resolution order.

/**
 * POST accepted offers + normalization metadata to the ingest-offers Edge Fn.
 * The Edge Function writes to ingestion_runs using the metadata fields.
 */
export async function postToEdgeFunction(
    platformSlug: string,
    offers: NormalizedOffer[],
    fetched: number,
    rejected: number,
    unmatchedGame: number
): Promise<IngestionResult> {
    const t0 = Date.now();

    // Read env at call time — safe after dotenv/config has run in index.ts.
    const functionUrl = process.env.SUPABASE_FUNCTION_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!functionUrl) throw new Error("Missing env: SUPABASE_FUNCTION_URL");
    if (!serviceKey)  throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

    const body: IngestPayload = {
        platform_slug: platformSlug,
        offers,
        fetched,
        rejected,
        unmatched_game: unmatchedGame,
    };

    console.log("[client] Sending Auth Header:", `Bearer ${serviceKey ? serviceKey.slice(0, 10) + "..." : "UNDEFINED"}`);
    console.log("[client] Sending apikey Header:", serviceKey ? serviceKey.slice(0, 10) + "..." : "UNDEFINED");

    const res = await fetch(`${functionUrl}/ingest-offers`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
            "apikey": serviceKey,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Edge Function error ${res.status}: ${text}`);
    }

    const result = (await res.json()) as Omit<IngestionResult, "platform_slug" | "durationMs">;
    return { ...result, platform_slug: platformSlug, durationMs: Date.now() - t0 };
}
