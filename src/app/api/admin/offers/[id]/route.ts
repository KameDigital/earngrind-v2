import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// PATCH /api/admin/offers/[id]
//
// Updates an existing offer. Restricted to admin and editor roles.
// If payout_usd changes, the previous payout is recorded in offer_history first.
//
// Accepted body fields:
//   payout_usd  — number
//   status      — "active" | "expired" | "boosted" | "paused"
//   is_featured — boolean
//   is_boosted  — boolean
// ---------------------------------------------------------------------------

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    const supabase = createClient();

    // ── Auth: require authenticated session ──────────────────────────────────
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Role: require admin or editor ────────────────────────────────────────
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || !["admin", "editor"].includes(profile.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Parse body ───────────────────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { payout_usd, status, is_featured, is_boosted } = body;

    // Validate allowed fields only
    const update: Record<string, unknown> = {};
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
    if (is_featured !== undefined) update.is_featured = Boolean(is_featured);
    if (is_boosted  !== undefined) update.is_boosted  = Boolean(is_boosted);

    if (Object.keys(update).length === 0) {
        return NextResponse.json({ error: "No updatable fields provided" }, { status: 422 });
    }

    // ── Load current offer ───────────────────────────────────────────────────
    const { data: existing, error: fetchErr } = await supabase
        .from("offers")
        .select("id, payout_usd, status, is_featured, is_boosted")
        .eq("id", params.id)
        .single();

    if (fetchErr || !existing) {
        return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    // ── Record payout change in offer_history ────────────────────────────────
    if (update.payout_usd !== undefined && Number(existing.payout_usd) !== update.payout_usd) {
        const { error: histErr } = await supabase.from("offer_history").insert({
            offer_id:    existing.id,
            payout_usd:  existing.payout_usd,
            recorded_at: new Date().toISOString(),
            source:      "manual_edit",
        });
        if (histErr) {
            console.error("[PATCH offers] offer_history insert failed:", histErr.message);
            return NextResponse.json({ error: "Failed to record payout history" }, { status: 500 });
        }
    }

    // ── Apply update ─────────────────────────────────────────────────────────
    update.updated_at = new Date().toISOString();

    const { data: updated, error: updateErr } = await supabase
        .from("offers")
        .update(update)
        .eq("id", params.id)
        .select("id, payout_usd, status, is_featured, is_boosted, updated_at")
        .single();

    if (updateErr) {
        console.error("[PATCH offers] update failed:", updateErr.message);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ offer: updated });
}
