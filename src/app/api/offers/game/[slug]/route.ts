import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
    _req: NextRequest,
    { params }: { params: { slug: string } }
) {
    const supabase = createClient();
    const { slug } = params;

    // Fetch game
    const { data: game, error: gameError } = await supabase
        .from("games")
        .select("id, name, slug, thumbnail_url, devices, category, description")
        .eq("slug", slug)
        .single();

    if (gameError || !game) {
        return NextResponse.json(
            { error: "not_found", message: `Game not found: ${slug}` },
            { status: 404 }
        );
    }

    // Fetch all active offers for this game (denormalized view)
    const { data: offers } = await supabase
        .from("active_offers_view")
        .select("*")
        .eq("game_slug", slug)
        .order("payout_usd", { ascending: false });

    // Fetch payout summary from materialized view
    const { data: summary } = await supabase
        .from("payout_max_by_game")
        .select("offer_count, max_payout_usd, avg_payout_usd, min_payout_usd")
        .eq("game_id", game.id)
        .single();

    // Fetch ALL associated published guides (array, not single)
    const { data: guides } = await supabase
        .from("guides")
        .select("id, title, slug, estimated_time, max_payout_usd, difficulty, tips, body_md")
        .eq("game_id", game.id)
        .eq("status", "published")
        .order("updated_at", { ascending: false });

    const shapedOffers = (offers ?? []).map(row => ({
        id: row.id,
        title: row.title,
        payout_usd: row.payout_usd,
        payout_type: row.payout_type,
        devices: row.devices,
        countries: row.countries,
        is_featured: row.is_featured,
        is_ath: row.is_ath,
        is_new: row.is_new,
        is_hot: row.is_hot,
        is_boosted: row.is_boosted,
        heat_score: row.heat_score,
        offer_expires_at: row.offer_expires_at,
        updated_at: row.updated_at,
        redirect_url: `/go/${row.id}`,
        game: {
            id: row.game_id,
            name: row.game_name,
            slug: row.game_slug,
            thumbnail_url: row.game_thumbnail,
        },
        platform: {
            id: row.platform_id,
            name: row.platform_name,
            slug: row.platform_slug,
            logo_url: row.platform_logo,
            platform_kind: row.platform_kind,
        },
    }));

    return NextResponse.json({
        game,
        summary: summary ?? {
            offer_count: shapedOffers.length,
            max_payout_usd: shapedOffers[0]?.payout_usd ?? 0,
            avg_payout_usd: 0,
            min_payout_usd: 0,
        },
        offers: shapedOffers,
        guides: guides ?? [],
        // Keep legacy 'guide' field for backwards compat
        guide: guides?.[0] ?? null,
    }, {
        headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=600" },
    });
}
