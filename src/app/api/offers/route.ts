import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const supabase = createClient();
    const { searchParams } = req.nextUrl;

    const q            = searchParams.get("q")            ?? "";
    const gameSlug     = searchParams.get("game_slug")    ?? "";
    const platformId   = searchParams.get("platform_id")  ?? "";
    const platformKind = searchParams.get("platform_kind") ?? "";
    const device       = searchParams.get("device")       ?? "";
    const country      = searchParams.get("country")      ?? "";
    const payoutType   = searchParams.get("payout_type")  ?? "";
    const source       = searchParams.get("source")       ?? ""; // "ingested" | "manual" | ""
    const isNew        = searchParams.get("is_new")    === "true";
    const isHot        = searchParams.get("is_hot")    === "true";
    const isAth        = searchParams.get("is_ath")    === "true";
    const isBoosted    = searchParams.get("is_boosted") === "true";
    const minPayout    = parseFloat(searchParams.get("min_payout") ?? "0") || 0;
    const sort         = searchParams.get("sort")      ?? "payout_desc";
    const page         = Math.max(1, parseInt(searchParams.get("page")     ?? "1"));
    const perPage      = Math.min(100, parseInt(searchParams.get("per_page") ?? "20"));

    const from = (page - 1) * perPage;
    const to   = from + perPage - 1;

    let query = supabase
        .from("unified_offers_view")
        .select("*", { count: "exact" });

    // Full-text search (computed tsvector in view)
    if (q) {
        query = query.textSearch("fts", q, { type: "websearch" });
    }

    // Source filter
    if (source === "ingested" || source === "manual") {
        query = query.eq("source", source);
    }

    // Game slug filter
    if (gameSlug) query = query.eq("game_slug", gameSlug);

    // Platform filters
    if (platformId)   query = query.eq("platform_id",   platformId);
    if (platformKind) query = query.eq("platform_kind", platformKind);

    // Device filter (array contains)
    if (device) query = query.contains("devices", [device]);

    // Country filter
    if (country) query = query.contains("countries", [country]);

    // Payout type (ingested only — manual offers have null payout_type)
    if (payoutType) query = query.eq("payout_type", payoutType);

    // Badge filters (manual offers always false for these, so filter naturally excludes them)
    if (isNew)    query = query.eq("is_new",    true);
    if (isHot)    query = query.eq("is_hot",    true);
    if (isAth)    query = query.eq("is_ath",    true);
    if (isBoosted) query = query.eq("is_boosted", true);

    // Min payout
    if (minPayout > 0) query = query.gte("payout_usd", minPayout);

    // Sorting
    switch (sort) {
        case "payout_asc":  query = query.order("payout_usd",  { ascending: true  }); break;
        case "heat_desc":   query = query.order("heat_score",  { ascending: false }); break;
        case "newest":      query = query.order("updated_at",  { ascending: false }); break;
        default:            query = query.order("payout_usd",  { ascending: false });
    }

    // Pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
        console.error("[GET /api/offers]", error);
        return NextResponse.json({ error: "internal", message: error.message }, { status: 500 });
    }

    // Shape response — same contract as before + new optional fields for manual offers
    const shaped = (data ?? []).map(row => ({
        id:              row.id,
        source:          row.source,          // "ingested" | "manual"  ← NEW
        title:           row.title,
        payout_usd:      row.payout_usd,
        payout_type:     row.payout_type,
        devices:         row.devices,
        countries:       row.countries,
        category:        row.category,
        status:          row.status,
        is_featured:     row.is_featured,
        is_ath:          row.is_ath,
        is_new:          row.is_new,
        is_hot:          row.is_hot,
        is_boosted:      row.is_boosted,
        heat_score:      row.heat_score,
        offer_expires_at: row.offer_expires_at,
        updated_at:      row.updated_at,
        goal_text:       row.goal_text,       // manual offers only    ← NEW
        provider_name:   row.provider_name,   // manual offers only    ← NEW
        // For ingested: offer_url = /go/:id (click tracking); for manual: direct link
        redirect_url:    row.offer_url,       // unified field         ← CHANGED
        game: {
            id:            row.game_id,
            name:          row.game_name,
            slug:          row.game_slug,
            thumbnail_url: row.game_thumbnail,
            devices:       row.game_devices,
        },
        platform: {
            id:            row.platform_id,
            name:          row.platform_name,
            slug:          row.platform_slug,
            logo_url:      row.platform_logo,
            platform_kind: row.platform_kind,
        },
    }));

    const total = count ?? 0;

    return NextResponse.json({
        data: shaped,
        meta: {
            total,
            page,
            per_page:    perPage,
            total_pages: Math.ceil(total / perPage),
        },
    }, {
        headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
}
