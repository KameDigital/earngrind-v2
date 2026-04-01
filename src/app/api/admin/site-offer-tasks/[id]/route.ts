import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getAuthProfile(supabase: ReturnType<typeof import("@/lib/supabase/server")["createClient"]>) {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) return null;
    return profile;
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/site-offer-tasks/[id]
// ---------------------------------------------------------------------------
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    const supabase = createClient();
    if (!await getAuthProfile(supabase)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (body.sort_order      !== undefined) update.sort_order      = Number(body.sort_order) || 0;
    if (body.title           !== undefined) update.title           = String(body.title);
    if (body.reward_amount   !== undefined) update.reward_amount   = Number(body.reward_amount) || 0;
    if (body.reward_display  !== undefined) update.reward_display  = body.reward_display  ? String(body.reward_display)  : null;
    if (body.task_type       !== undefined) {
        const validTypes = ["install","milestone","purchase","signup","other"];
        update.task_type = validTypes.includes(String(body.task_type)) ? body.task_type : "other";
    }
    if (body.time_limit_text !== undefined) update.time_limit_text = body.time_limit_text ? String(body.time_limit_text) : null;
    if (body.notes           !== undefined) update.notes           = body.notes           ? String(body.notes)           : null;

    if (Object.keys(update).length === 0) {
        return NextResponse.json({ error: "No updatable fields" }, { status: 422 });
    }
    update.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
        .from("site_offer_tasks")
        .update(update)
        .eq("id", params.id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });
    return NextResponse.json({ task: updated });
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/site-offer-tasks/[id]
// ---------------------------------------------------------------------------
export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    const supabase = createClient();
    if (!await getAuthProfile(supabase)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("site_offer_tasks").delete().eq("id", params.id);
    if (error) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    return NextResponse.json({ ok: true });
}
