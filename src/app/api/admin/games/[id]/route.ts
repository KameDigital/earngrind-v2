import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// PATCH /api/admin/games/[id]
// Updates a game. Restricted to admin and editor roles.
// ---------------------------------------------------------------------------

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
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

    const update: Record<string, unknown> = {};
    if (body.name          !== undefined) update.name          = String(body.name);
    if (body.slug          !== undefined) update.slug          = String(body.slug).toLowerCase().replace(/\s+/g, "-");
    if (body.aliases       !== undefined) update.aliases       = Array.isArray(body.aliases)  ? body.aliases  : [];
    if (body.category      !== undefined) update.category      = body.category      ? String(body.category)      : null;
    if (body.devices       !== undefined) update.devices       = Array.isArray(body.devices)  ? body.devices  : [];
    if (body.thumbnail_url !== undefined) update.thumbnail_url = body.thumbnail_url ? String(body.thumbnail_url) : null;
    if (body.description   !== undefined) update.description   = body.description   ? String(body.description)   : null;

    if (Object.keys(update).length === 0) {
        return NextResponse.json({ error: "No updatable fields provided" }, { status: 422 });
    }
    update.updated_at = new Date().toISOString();

    const { data: updated, error: updateErr } = await supabase
        .from("games")
        .update(update)
        .eq("id", params.id)
        .select("id, name, slug, category, devices, thumbnail_url, description")
        .single();

    if (updateErr) {
        console.error("[PATCH games] update failed:", updateErr.message);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ game: updated });
}
