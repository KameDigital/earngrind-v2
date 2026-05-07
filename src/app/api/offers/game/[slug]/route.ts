import { createClient } from "@/lib/supabase/server";
import { firstNonEmpty, isPublicOfferRowEligible, shapePublicOffer } from "@/lib/public-offers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const { data: offerRows, error: offersError } = await supabase
        .from("unified_offers_view")
        .select("*")
        .eq("game_slug", slug)
        .order("total_payout_usd", { ascending: false });

    if (offersError) {
        console.error("[GET /api/offers/game/[slug]] offers failed", offersError);
        return NextResponse.json({ error: "internal", message: offersError.message }, { status: 500 });
    }

    const { data: guides } = await supabase
        .from("guides")
        .select("id, title, slug, estimated_time, max_payout_usd, difficulty, tips, body_md")
        .eq("game_id", game.id)
        .eq("status", "published")
        .order("updated_at", { ascending: false });

    const shapedOffers = (offerRows ?? [])
        .filter((row) => isPublicOfferRowEligible(row))
        .map((row) => shapePublicOffer(row));
    const manualOfferIds = shapedOffers
        .filter((row) => row.source === "manual")
        .map((row) => row.id);

    const { data: taskRows } = manualOfferIds.length
        ? await supabase
            .from("site_offer_tasks")
            .select("site_offer_id, id, sort_order, title, reward_amount, reward_display, task_type, time_limit_text")
            .in("site_offer_id", manualOfferIds)
            .order("sort_order", { ascending: true })
        : { data: [] };

    const taskMap = new Map<string, Array<{
        id: string;
        sort_order: number;
        title: string;
        reward_amount: number;
        reward_display: string | null;
        task_type: string;
        time_limit_text: string | null;
    }>>();

    (taskRows ?? []).forEach((task) => {
        const siteOfferId = String(task.site_offer_id);
        const existing = taskMap.get(siteOfferId) ?? [];
        existing.push({
            id: String(task.id),
            sort_order: Number(task.sort_order ?? 0),
            title: String(task.title ?? "Offer milestone"),
            reward_amount: Number(task.reward_amount ?? 0),
            reward_display: firstNonEmpty(task.reward_display),
            task_type: String(task.task_type ?? "other"),
            time_limit_text: firstNonEmpty(task.time_limit_text),
        });
        taskMap.set(siteOfferId, existing);
    });

    const shapedComparisonOffers = shapedOffers
        .filter((row) => row.source === "manual")
        .map((row) => {
            const tasks = taskMap.get(row.id) ?? [];

            return {
                id: row.id,
                provider_name: row.provider_name,
                platform_name: row.platform.name,
                payout_usd: row.payout_usd,
                total_payout_usd: row.total_payout_usd,
                task_count: tasks.length,
                image_url: row.image_url,
                redirect_url: `/go/${row.id}`,
                offer_url: row.offer_url,
                status: row.status,
                goal_text: row.goal_text,
                updated_at: row.updated_at,
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

    const payoutValues = shapedOffers.map((row) => row.total_payout_usd).filter((value) => Number.isFinite(value));
    const summary = {
        offer_count: shapedOffers.length,
        max_payout_usd: payoutValues.length ? Math.max(...payoutValues) : 0,
        avg_payout_usd: payoutValues.length
            ? payoutValues.reduce((sum, value) => sum + value, 0) / payoutValues.length
            : 0,
        min_payout_usd: payoutValues.length ? Math.min(...payoutValues) : 0,
    };

    if (offerRows?.[0]) {
        console.log("[/api/offers/game/[slug]] debug row", {
            id: offerRows[0].id,
            offer_url: typeof offerRows[0].offer_url === "string" ? offerRows[0].offer_url : null,
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
        summary,
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
