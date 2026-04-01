import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// POST /api/admin/site-offers
// Creates a new manual site-specific offer entry.
// Restricted to admin and editor roles.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
    const supabase = createClient();

    // ── Auth ─────────────────────────────────────────────────────────────────
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || !["admin", "editor"].includes(profile.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Body ─────────────────────────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { site_id, provider_id, game_id, title, payout_usd,
            goal_text, offer_url, status, devices, countries } = body;

    if (!site_id || !provider_id || !game_id || !title || payout_usd === undefined) {
        return NextResponse.json(
            { error: "site_id, provider_id, game_id, title, payout_usd are required" },
            { status: 422 }
        );
    }

    const payoutNum = Number(payout_usd);
    if (isNaN(payoutNum) || payoutNum < 0) {
        return NextResponse.json({ error: "Invalid payout_usd" }, { status: 422 });
    }

    const validStatuses = ["active", "expired", "boosted", "paused"];
    const safeStatus = validStatuses.includes(String(status)) ? status : "active";

    // Generate a stable manual external_id — unique enough for the constraint
    const externalId = "manual-" + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    // ── Insert ────────────────────────────────────────────────────────────────
    const { data: created, error: insertErr } = await supabase
        .from("site_offers")
        .insert({
            site_id,
            provider_id,
            game_id,
            external_id:  externalId,
            title:        String(title),
            payout_usd:   payoutNum,
            goal_text:    goal_text   ? String(goal_text)   : null,
            offer_url:    offer_url   ? String(offer_url)   : null,
            status:       safeStatus,
            devices:      Array.isArray(devices)   ? devices   : [],
            countries:    Array.isArray(countries) ? countries : [],
            ingested_at:  now,
            created_at:   now,
            updated_at:   now,
        })
        .select("id, external_id, title, payout_usd, status, goal_text, offer_url")
        .single();

    if (insertErr) {
        console.error("[POST site-offers] insert failed:", insertErr.message);
        return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ site_offer: created }, { status: 201 });
}
