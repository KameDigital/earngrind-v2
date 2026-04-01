import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// PATCH /api/admin/site-offers/[id]
// Updates an existing site offer. Restricted to admin and editor roles.
//
// Accepted body fields:
//   title, payout_usd, goal_text, offer_url, status, devices, countries
// ---------------------------------------------------------------------------

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
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

    const { title, payout_usd, goal_text, offer_url, status, devices, countries } = body;

    const update: Record<string, unknown> = {};
    if (title       !== undefined) update.title       = String(title);
    if (goal_text   !== undefined) update.goal_text   = goal_text   ? String(goal_text)   : null;
    if (offer_url   !== undefined) update.offer_url   = offer_url   ? String(offer_url)   : null;
    if (devices     !== undefined) update.devices     = Array.isArray(devices)   ? devices   : [];
    if (countries   !== undefined) update.countries   = Array.isArray(countries) ? countries : [];

    if (payout_usd !== undefined) {
        const n = Number(payout_usd);
        if (isNaN(n) || n < 0) {
            return NextResponse.json({ error: "Invalid payout_usd" }, { status: 422 });
        }
        update.payout_usd = n;
    }

    const validStatuses = ["active", "expired", "boosted", "paused"];
    if (status !== undefined) {
        if (!validStatuses.includes(String(status))) {
            return NextResponse.json({ error: "Invalid status" }, { status: 422 });
        }
        update.status = status;
    }

    if (Object.keys(update).length === 0) {
        return NextResponse.json({ error: "No updatable fields provided" }, { status: 422 });
    }

    update.updated_at = new Date().toISOString();

    // ── Apply update ──────────────────────────────────────────────────────────
    const { data: updated, error: updateErr } = await supabase
        .from("site_offers")
        .update(update)
        .eq("id", params.id)
        .select("id, title, payout_usd, goal_text, offer_url, status, updated_at")
        .single();

    if (updateErr) {
        console.error("[PATCH site-offers] update failed:", updateErr.message);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ site_offer: updated });
}
