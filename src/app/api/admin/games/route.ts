import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// POST /api/admin/games
// Creates a new game. Restricted to admin and editor roles.
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

    const { name, slug, aliases, category, devices, thumbnail_url, description } = body;
    if (!name || !slug) {
        return NextResponse.json({ error: "name and slug are required" }, { status: 422 });
    }

    const { data: created, error: insertErr } = await supabase
        .from("games")
        .insert({
            name:          String(name),
            slug:          String(slug).toLowerCase().replace(/\s+/g, "-"),
            aliases:       Array.isArray(aliases)  ? aliases  : [],
            category:      category       ? String(category)       : null,
            devices:       Array.isArray(devices)  ? devices  : [],
            thumbnail_url: thumbnail_url  ? String(thumbnail_url)  : null,
            description:   description    ? String(description)    : null,
        })
        .select("id, name, slug, category, devices")
        .single();

    if (insertErr) {
        console.error("[POST games] insert failed:", insertErr.message);
        const isDupe = insertErr.message.includes("unique");
        return NextResponse.json(
            { error: isDupe ? "A game with that slug already exists" : "Insert failed" },
            { status: isDupe ? 409 : 500 }
        );
    }

    return NextResponse.json({ game: created }, { status: 201 });
}
