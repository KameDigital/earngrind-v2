import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrEditor } from "@/lib/admin-auth";

// ---------------------------------------------------------------------------
// POST /api/admin/site-offers
// Creates one OR multiple manual site-specific offer entries.
// Body can be a single offer object OR an array of offer objects.
// Restricted to admin and editor roles.
// ---------------------------------------------------------------------------

const VALID_STATUSES = ["active", "expired", "boosted", "paused"];

interface OfferInput {
    site_id:     unknown;
    provider_id: unknown;
    game_id:     unknown;
    title:       unknown;
    payout_usd:  unknown;
    goal_text?:  unknown;
    offer_url?:  unknown;
    status?:     unknown;
    devices?:    unknown;
    countries?:  unknown;
}

function buildRow(input: OfferInput) {
    const { site_id, provider_id, game_id, title, payout_usd,
            goal_text, offer_url, status, devices, countries } = input;

    if (!site_id || !provider_id || !game_id || !title || payout_usd === undefined) {
        throw new Error("site_id, provider_id, game_id, title, payout_usd are required");
    }

    const payoutNum = Number(payout_usd);
    if (isNaN(payoutNum) || payoutNum < 0) throw new Error("Invalid payout_usd");

    const now = new Date().toISOString();
    return {
        site_id,
        provider_id,
        game_id,
        external_id:  "manual-" + crypto.randomUUID().slice(0, 8),
        title:        String(title),
        payout_usd:   payoutNum,
        goal_text:    goal_text  ? String(goal_text)  : null,
        offer_url:    offer_url  ? String(offer_url)  : null,
        status:       VALID_STATUSES.includes(String(status)) ? status : "active",
        devices:      Array.isArray(devices)   ? devices   : [],
        countries:    Array.isArray(countries) ? countries : [],
        ingested_at:  now,
        created_at:   now,
        updated_at:   now,
    };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase } = auth;

    // ── Auth ─────────────────────────────────────────────────────────────────
    // ── Body ─────────────────────────────────────────────────────────────────
    let body: unknown;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Accept single object or array
    const inputs: OfferInput[] = Array.isArray(body) ? body : [body as OfferInput];

    let rows: ReturnType<typeof buildRow>[];
    try {
        rows = inputs.map(buildRow);
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Validation failed" },
            { status: 422 }
        );
    }

    // ── Insert ────────────────────────────────────────────────────────────────
    const { data: created, error: insertErr } = await supabase
        .from("site_offers")
        .insert(rows)
        .select("id, external_id, title, payout_usd, status, goal_text, offer_url");

    if (insertErr) {
        console.error("[POST site-offers] insert failed:", insertErr.message);
        return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    // Single-item response stays backwards-compatible
    if ((created ?? []).length === 1) {
        return NextResponse.json({ site_offer: created![0] }, { status: 201 });
    }

    return NextResponse.json({ created: created?.length ?? 0, site_offers: created }, { status: 201 });
}
