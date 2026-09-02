import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/public";
import { shapePublicOffer } from "@/lib/public-offers";
import { generateStructuredTiers } from "@/lib/offer-tiers";

export const revalidate = 60;

export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    if (!id) {
        return NextResponse.json({ error: "missing_id", message: "Offer ID is required" }, { status: 400 });
    }

    try {
        // 1. Fetch offer from unified_offers_view
        const { data: offerRowInitial, error: offerError } = await supabase
            .from("unified_offers_view")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        let offerRow = offerRowInitial;

        if (!offerRow) {
            const { data: directSiteOffer } = await supabase
                .from("site_offers")
                .select("*, platforms:site_id(id, name, slug, logo_url, platform_kind), games:game_id(id, name, slug, thumbnail_url, devices), providers:provider_id(id, name)")
                .eq("id", id)
                .maybeSingle();

            if (directSiteOffer) {
                const platform = Array.isArray(directSiteOffer.platforms) ? directSiteOffer.platforms[0] : directSiteOffer.platforms;
                const game = Array.isArray(directSiteOffer.games) ? directSiteOffer.games[0] : directSiteOffer.games;
                const provider = Array.isArray(directSiteOffer.providers) ? directSiteOffer.providers[0] : directSiteOffer.providers;

                offerRow = {
                    ...directSiteOffer,
                    platform_id: platform?.id,
                    platform_name: platform?.name,
                    platform_slug: platform?.slug,
                    platform_logo: platform?.logo_url,
                    platform_kind: platform?.platform_kind,
                    game_id: game?.id,
                    game_name: game?.name,
                    game_slug: game?.slug,
                    game_thumbnail: game?.thumbnail_url,
                    game_devices: game?.devices,
                    provider_id: provider?.id,
                    provider_name: provider?.name,
                };
            }
        }

        if (!offerRow) {
            return NextResponse.json({ error: "not_found", message: "Offer not found" }, { status: 404 });
        }

        const shapedOffer = shapePublicOffer(offerRow);

        // 2. Fetch tasks for this offer from site_offer_tasks
        const { data: tasksData, error: tasksError } = await supabase
            .from("site_offer_tasks")
            .select("id, sort_order, title, reward_amount, reward_display, task_type, time_limit_text, notes")
            .eq("site_offer_id", id)
            .order("sort_order", { ascending: true });

        if (tasksError) {
            console.warn("[GET /api/offers/[id]] failed to fetch tasks", tasksError);
        }

        let tasks = Array.isArray(tasksData) && tasksData.length > 0
            ? tasksData.map((t) => ({
                id: t.id,
                sortOrder: t.sort_order ?? 1,
                title: t.title || "Complete Offer Goal",
                rewardAmount: Number(t.reward_amount ?? 0),
                rewardDisplay: t.reward_display || `$${Number(t.reward_amount ?? 0).toFixed(2)}`,
                taskType: t.task_type || "milestone",
                timeLimitText: t.time_limit_text || null,
                notes: t.notes || null,
            }))
            : [];

        const extractCleanSingleGoal = (
            title: string,
            goalText?: string | null,
            rawTasks?: Array<{ notes?: string | null; title?: string | null; reward_amount?: number | null }>,
            _payout = 0
        ): string => {
            for (const t of rawTasks || []) {
                const note = (t.notes || "").trim();
                if (/To complete this offer/i.test(note)) {
                    const match = note.match(/To complete this offer,?\s*(?:simply\s+)?(.*?)(?:\s+and receive a|\s*\.\s*|$)/i);
                    if (match && match[1]) {
                        const res = match[1].trim();
                        return res.charAt(0).toUpperCase() + res.slice(1);
                    }
                }
            }

            for (const t of rawTasks || []) {
                const note = (t.notes || "").trim();
                const m = note.match(/(?:earn|reach|deposit|wager|register|open an? account|make your first)\s+[^.]+?(?:reward|\$|\.|$)/i);
                if (m) {
                    let clean = m[0].replace(/\s+and receive a\s+\$?\d+.*$/i, "").trim();
                    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
                    if (clean.length > 10 && clean.length < 90 && !/€\/\$/i.test(clean)) return clean;
                }
            }

            if (goalText && goalText.length < 120 && !/^(?:combines a|the platform features)/i.test(goalText)) {
                return goalText;
            }

            return `Complete verified requirements on ${title || "partner site"}`;
        }

        const isDummyTaskSet = (taskList: Array<{ title?: string; rewardAmount?: number; notes?: string }>) => {
            if (!taskList || taskList.length === 0) return true;
            const payingTasks = taskList.filter((t) => Number(t.rewardAmount ?? 0) > 0);
            if (payingTasks.length <= 1) return true;

            const zeroCount = taskList.filter((t) => Number(t.rewardAmount ?? 0) === 0).length;
            if (zeroCount >= taskList.length / 2) return true;

            const dummyCount = taskList.filter((t) =>
                /Complete the (?:listed|required)|Earn (?:additional )?rewards along the way|Grab your free|Complete all steps|Important:|The platform features|combines a|wagered on|^s_\d+|^Default$/i.test(t.title || "")
            ).length;
            if (dummyCount > 0) return true;

            return false;
        };

        // 1. If tasks are unpopulated/dummy, try live partner task endpoints (EarnLab, Gemsloot)
        if (isDummyTaskSet(tasks)) {
            const externalId = String(offerRow.external_id || "").trim();
            const platformSlug = String(offerRow.platform_slug || "").toLowerCase();

            // EarnLab direct task events resolution
            const earnLabUuidMatch = externalId.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
            const earnLabIdOrSlug = earnLabUuidMatch ? earnLabUuidMatch[0] : (platformSlug === "earnlab" ? externalId : null);

            if (earnLabIdOrSlug) {
                try {
                    const elRes = await fetch(`https://api.earnlab.com/tasks/${encodeURIComponent(earnLabIdOrSlug)}/info`, {
                        headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0" },
                        signal: AbortSignal.timeout(3500),
                    });
                    if (elRes.ok) {
                        const elJson = await elRes.json();
                        const elTask = elJson.data?.task;
                        if (Array.isArray(elTask?.events) && elTask.events.length > 0) {
                            tasks = elTask.events.map((e: { name?: string; index?: number; reward?: number }, idx: number) => {
                                const rewardUsd = Number(((Number(e.reward) || 0) / 1000).toFixed(2));
                                return {
                                    id: `earnlab-event-${idx}`,
                                    sortOrder: (e.index ?? idx) + 1,
                                    title: e.name || `Milestone ${idx + 1}`,
                                    rewardAmount: rewardUsd,
                                    rewardDisplay: `$${rewardUsd.toFixed(2)}`,
                                    taskType: "milestone",
                                    timeLimitText: null,
                                    notes: null,
                                };
                            });
                        }
                    }
                } catch (e) {
                    console.warn("[GET /api/offers/[id]] failed to fetch EarnLab live info", e);
                }
            }

            // Gemsloot direct task steps resolution
            if (isDummyTaskSet(tasks) && (platformSlug === "gemsloot" || platformSlug === "gemloot")) {
                try {
                    const gemslootId = externalId.replace(/^[^-]+-/, "").replace(/-[A-Z]{2}$/, "") || id;
                    const glRes = await fetch(`https://api.gemsloot.com/api/offer/${encodeURIComponent(gemslootId)}`, {
                        headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0" },
                        signal: AbortSignal.timeout(3500),
                    });
                    if (glRes.ok) {
                        const glJson = await glRes.json();
                        const glSteps = glJson.steps || glJson.data?.steps || glJson.offer?.steps;
                        if (Array.isArray(glSteps) && glSteps.length > 0) {
                            tasks = glSteps.map((s: { name?: string; points?: number; reward?: number }, idx: number) => {
                                const pts = Number(s.points ?? s.reward ?? 0);
                                const rewardUsd = Number((pts / 1000).toFixed(2));
                                return {
                                    id: `gemsloot-step-${idx}`,
                                    sortOrder: idx + 1,
                                    title: s.name || `Step ${idx + 1}`,
                                    rewardAmount: rewardUsd,
                                    rewardDisplay: `$${rewardUsd.toFixed(2)}`,
                                    taskType: "milestone",
                                    timeLimitText: null,
                                    notes: null,
                                };
                            });
                        }
                    }
                } catch (e) {
                    console.warn("[GET /api/offers/[id]] failed to fetch Gemsloot live steps", e);
                }
            }
        }

        // If tasks are missing or contain dummy split text, search sibling offers for real verified tiers
        if (isDummyTaskSet(tasks)) {
            const gameId = shapedOffer.game?.id;
            const searchTitle = (shapedOffer.game?.name || shapedOffer.title || "").trim();

            if (gameId) {
                const { data: sibs } = await supabase
                    .from("site_offers")
                    .select("id, payout_usd, site_offer_tasks(id, sort_order, title, reward_amount, reward_display, task_type, time_limit_text, notes)")
                    .eq("game_id", gameId)
                    .not("site_offer_tasks", "is", null)
                    .limit(12);

                const sortedSibs = (sibs ?? []).sort((a, b) => {
                    const aTasks = (a as Record<string, unknown>).site_offer_tasks;
                    const bTasks = (b as Record<string, unknown>).site_offer_tasks;
                    const aLen = Array.isArray(aTasks) ? aTasks.length : 0;
                    const bLen = Array.isArray(bTasks) ? bTasks.length : 0;
                    return bLen - aLen;
                });

                for (const sib of sortedSibs) {
                    const sibTasks = (sib as Record<string, unknown>).site_offer_tasks;
                    if (Array.isArray(sibTasks) && sibTasks.length > 2 && !isDummyTaskSet(sibTasks as Array<{ title?: string; rewardAmount?: number }>)) {
                        const offerPayout = shapedOffer.total_payout_usd > 0 ? shapedOffer.total_payout_usd : shapedOffer.payout_usd;
                        const sibTotal = Number(sib.payout_usd) || 1;
                        const ratio = offerPayout / sibTotal;
                        tasks = sibTasks.map((t, idx) => ({
                            id: `${t.id || idx}`,
                            sortOrder: t.sort_order ?? idx + 1,
                            title: t.title,
                            rewardAmount: Number((Number(t.reward_amount) * ratio).toFixed(2)),
                            rewardDisplay: `$${(Number(t.reward_amount) * ratio).toFixed(2)}`,
                            taskType: t.task_type || "milestone",
                            timeLimitText: t.time_limit_text,
                            notes: t.notes,
                        }));
                        break;
                    }
                }
            }

            if (isDummyTaskSet(tasks) && searchTitle) {
                const cleanGameName = searchTitle.split(/\s+[-–:]\s+|\s+iOS|\s+Android/i)[0].trim();
                const { data: sibsByTitle } = await supabase
                    .from("site_offers")
                    .select("id, payout_usd, site_offer_tasks(id, sort_order, title, reward_amount, reward_display, task_type, time_limit_text, notes)")
                    .ilike("title", `%${cleanGameName}%`)
                    .not("site_offer_tasks", "is", null)
                    .limit(15);

                const sortedSibs = (sibsByTitle ?? []).sort((a, b) => {
                    const aTasks = (a as Record<string, unknown>).site_offer_tasks;
                    const bTasks = (b as Record<string, unknown>).site_offer_tasks;
                    const aLen = Array.isArray(aTasks) ? aTasks.length : 0;
                    const bLen = Array.isArray(bTasks) ? bTasks.length : 0;
                    return bLen - aLen;
                });

                for (const sib of sortedSibs) {
                    const sibTasks = (sib as Record<string, unknown>).site_offer_tasks;
                    if (Array.isArray(sibTasks) && sibTasks.length > 2 && !isDummyTaskSet(sibTasks as Array<{ title?: string; rewardAmount?: number }>)) {
                        const offerPayout = shapedOffer.total_payout_usd > 0 ? shapedOffer.total_payout_usd : shapedOffer.payout_usd;
                        const sibTotal = Number(sib.payout_usd) || 1;
                        const ratio = offerPayout / sibTotal;
                        tasks = sibTasks.map((t, idx) => ({
                            id: `${t.id || idx}`,
                            sortOrder: t.sort_order ?? idx + 1,
                            title: t.title,
                            rewardAmount: Number((Number(t.reward_amount) * ratio).toFixed(2)),
                            rewardDisplay: `$${(Number(t.reward_amount) * ratio).toFixed(2)}`,
                            taskType: t.task_type || "milestone",
                            timeLimitText: t.time_limit_text,
                            notes: t.notes,
                        }));
                        break;
                    }
                }
            }
        }

        // If still no multi-tier breakdown exists, generate realistic structured progression tiers or single goal
        if (isDummyTaskSet(tasks)) {
            const totalPayout = shapedOffer.total_payout_usd > 0 ? shapedOffer.total_payout_usd : shapedOffer.payout_usd;
            const text = `${shapedOffer.title} ${shapedOffer.goal_text || ""} ${shapedOffer.category || ""}`.toLowerCase();
            const isNonGame = /\b(casino|sportsbook|betting|bet|crypto|bank|finance|broker|invest|deposit|survey|poll|opinion|sign up|signup|trial|subscription)\b/i.test(text);

            if (isNonGame) {
                const cleanGoal = extractCleanSingleGoal(
                    shapedOffer.title,
                    shapedOffer.goal_text,
                    tasksData as Array<{ notes?: string | null; title?: string | null; reward_amount?: number | null }>,
                    totalPayout
                );
                tasks = [
                    {
                        id: "target-goal",
                        sortOrder: 1,
                        title: cleanGoal,
                        rewardAmount: totalPayout,
                        rewardDisplay: `$${totalPayout.toFixed(2)}`,
                        taskType: "milestone",
                        timeLimitText: null,
                        notes: "Complete all listed requirements through the tracked partner route.",
                    },
                ];
            } else {
                tasks = generateStructuredTiers(
                    shapedOffer.title || shapedOffer.game.name || "Game",
                    totalPayout,
                    shapedOffer.goal_text
                );
            }
        }

        return NextResponse.json(
            {
                offer: shapedOffer,
                tasks,
            },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
                },
            }
        );
    } catch (err) {
        console.error("[GET /api/offers/[id]] error", err);
        return NextResponse.json(
            { error: "internal_error", message: err instanceof Error ? err.message : "Failed to load offer details" },
            { status: 500 }
        );
    }
}
