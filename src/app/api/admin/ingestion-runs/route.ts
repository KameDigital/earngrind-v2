import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// GET /api/admin/ingestion-runs
//
// Returns recent ingestion run records from the ingestion_runs table.
// Protected by a static admin key header — for internal use only.
// Never exposes credentials or raw offer payloads.
//
// Query params:
//   ?limit=N        — max rows to return (default 20, max 50)
//   ?platform=slug  — filter by platform slug
// ---------------------------------------------------------------------------

// Server-only: uses service role key — this route is never client-side rendered
// Server-only: uses service role key — this route is never client-side rendered

/** Simple static secret — set ADMIN_API_KEY in Vercel env */
const ADMIN_KEY = process.env.ADMIN_API_KEY;

function unauthorized(): NextResponse {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
    // ── Auth: require X-Admin-Key header ─────────────────────────────────────
    if (!ADMIN_KEY) {
        // If key is not configured, deny all access
        return NextResponse.json(
            { error: "Admin API not configured" },
            { status: 503 }
        );
    }
    const providedKey = req.headers.get("x-admin-key") ?? "";
    if (providedKey !== ADMIN_KEY) return unauthorized();

    // ── Query params ──────────────────────────────────────────────────────────
    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get("limit") ?? "20", 10);
    const platformSlug = searchParams.get("platform") ?? null;

    const limit = Math.min(Math.max(1, limitParam), 50);

    // ── Query ─────────────────────────────────────────────────────────────────
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: "Supabase admin not configured" }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
        .from("ingestion_runs")
        .select(`
            id,
            platform_slug,
            started_at,
            completed_at,
            status,
            fetched,
            accepted,
            rejected,
            unmatched_game,
            inserted,
            updated,
            expired,
            errors,
            message
        `)
        .order("started_at", { ascending: false })
        .limit(limit);

    if (platformSlug) {
        query = query.eq("platform_slug", platformSlug);
    }

    const { data, error } = await query;

    if (error) {
        console.error("[api/admin/ingestion-runs] Query error:", error.message);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({
        runs: data ?? [],
        count: (data ?? []).length,
        limit,
        platform_filter: platformSlug,
    });
}
