import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function firstNonEmpty(...values: Array<unknown>): string | null {
    for (const value of values) {
        if (typeof value !== "string") continue;
        const trimmed = value.trim();
        if (trimmed) return trimmed;
    }
    return null;
}

const isImageUrl = (url?: string | null) =>
    typeof url === "string" &&
    /\.(jpg|jpeg|png|webp)$/i.test(url);

function getOfferImageUrl(row: Record<string, unknown>): string | null {
    return firstNonEmpty(
        row.image_url,
        row.offer_image_url,
        row.raw_image_url,
    ) ?? (isImageUrl(firstNonEmpty(row.offer_url)) ? firstNonEmpty(row.offer_url) : null);
}

export async function GET(
    req: NextRequest,
    { params }: { params: { slug: string } }
) {
    console.log("API FIX ACTIVE /api/offers/game/[slug]");

    const supabase = createClient();
    const { slug } = params;
    const comparisonSort = req.nextUrl.searchParams.get("comparison_sort") ?? "payout_desc";

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

    const { data: offers } = await supabase
        .from("active_offers_view")
        .select("*")
        .eq("game_slug", slug)
        .order("payout_usd", { ascending: false });

    const { data: summary } = await supabase
        .from("payout_max_by_game")
        .select("offer_count, max_payout_usd, avg_payout_usd, min_payout_usd")
        .eq("game_id", game.id)
        .single();

    const { data: guides } = await supabase
        .from("guides")
        .select("id, title, slug, estimated_time, max_payout_usd, difficulty, tips, body_md")
        .eq("game_id", game.id)
        .eq("status", "published")
        .order("updated_at", { ascending: false });

    const { data: comparisonRows } = await supabase
        .from("site_offers")
        .select(`
            id,
            payout_usd,
            total_payout_usd,
            goal_text,
            offer_url,
            image_url,
            status,
            site:platforms(name, slug),
            provider:providers(name, slug),
            tasks:site_offer_tasks(
                id, sort_order, title, reward_amount, reward_display, task_type, time_limit_text
            )
        `)
        .eq("game_id", game.id)
        .eq("status", "active");

    const shapedOffers = (offers ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        image_url: getOfferImageUrl(row),
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

    const shapedComparisonOffers = (comparisonRows ?? [])
        .map((row) => {
            const tasks = Array.isArray(row.tasks)
                ? [...row.tasks].sort((a, b) => a.sort_order - b.sort_order)
                : [];
            const site = Array.isArray(row.site) ? row.site[0] ?? null : row.site;
            const provider = Array.isArray(row.provider) ? row.provider[0] ?? null : row.provider;
            const bestSinglePayout = Number(row.payout_usd ?? 0);
            const totalPayout = Number(row.total_payout_usd ?? row.payout_usd ?? 0);

            return {
                id: row.id,
                provider_name: provider?.name ?? null,
                platform_name: site?.name ?? null,
                payout_usd: bestSinglePayout,
                total_payout_usd: totalPayout,
                task_count: tasks.length,
                image_url: firstNonEmpty(row.image_url),
                redirect_url: `/go/${row.id}`,
                offer_url: firstNonEmpty(row.offer_url),
                status: row.status,
                goal_text: row.goal_text,
                tasks,
            };
        })
        .sort((a, b) => {
            if (comparisonSort === "total_payout_desc") {
                return b.total_payout_usd - a.total_payout_usd || b.payout_usd - a.payout_usd;
            }
            return b.payout_usd - a.payout_usd || b.total_payout_usd - a.total_payout_usd;
        });

    const comparisonSummary = {
        provider_count: new Set(
            shapedComparisonOffers
                .map((row) => row.provider_name)
                .filter((value): value is string => Boolean(value)),
        ).size,
        best_single_payout_usd: shapedComparisonOffers[0]?.payout_usd ?? 0,
        best_total_payout_usd: shapedComparisonOffers.reduce(
            (max, row) => Math.max(max, row.total_payout_usd),
            0,
        ),
    };

    if (offers?.[0]) {
        console.log("[/api/offers/game/[slug]] debug row", {
            id: offers[0].id,
            offer_url: typeof offers[0].offer_url === "string" ? offers[0].offer_url : null,
            image_url: shapedOffers[0]?.image_url ?? null,
            redirect_url: shapedOffers[0]?.redirect_url ?? null,
        });
    }

    const responseHeaders: Record<string, string> = {
        "Cache-Control": "no-store, max-age=0",
    };

    if (process.env.NODE_ENV !== "production" && shapedOffers[0]) {
        responseHeaders["x-api-offers-game-route"] = "route.ts";
        responseHeaders["x-api-offers-game-image-url"] = shapedOffers[0].image_url ?? "null";
        responseHeaders["x-api-offers-game-redirect-url"] = shapedOffers[0].redirect_url ?? "null";
    }

    return NextResponse.json({
        game,
        summary: summary ?? {
            offer_count: shapedOffers.length,
            max_payout_usd: shapedOffers[0]?.payout_usd ?? 0,
            avg_payout_usd: 0,
            min_payout_usd: 0,
        },
        offers: shapedOffers,
        comparison: {
            sort: comparisonSort,
            offers: shapedComparisonOffers,
            summary: comparisonSummary,
        },
        guides: guides ?? [],
        guide: guides?.[0] ?? null,
    }, {
        headers: responseHeaders,
    });
}
