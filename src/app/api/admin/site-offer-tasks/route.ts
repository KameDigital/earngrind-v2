import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// POST  /api/admin/site-offer-tasks   — create task
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
    const supabase = createClient();

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { site_offer_id, sort_order, title, reward_amount,
            reward_display, task_type, time_limit_text, notes } = body;

    if (!site_offer_id || !title) {
        return NextResponse.json({ error: "site_offer_id and title are required" }, { status: 422 });
    }

    const validTypes = ["install", "milestone", "purchase", "signup", "other"];
    const safeType   = validTypes.includes(String(task_type)) ? String(task_type) : "other";
    const now        = new Date().toISOString();

    const { data: created, error: insertErr } = await supabase
        .from("site_offer_tasks")
        .insert({
            site_offer_id,
            sort_order:      Number(sort_order)     || 0,
            title:           String(title),
            reward_amount:   Number(reward_amount)  || 0,
            reward_display:  reward_display  ? String(reward_display)  : null,
            task_type:       safeType,
            time_limit_text: time_limit_text ? String(time_limit_text) : null,
            notes:           notes           ? String(notes)           : null,
            created_at:      now,
            updated_at:      now,
        })
        .select()
        .single();

    if (insertErr) {
        console.error("[POST site-offer-tasks] insert failed:", insertErr.message);
        return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ task: created }, { status: 201 });
}
