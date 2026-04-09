import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// POST /api/admin/providers
// Quick-creates a new offerwall provider. Admin / editor only.
// ---------------------------------------------------------------------------

function toSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

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

    const { name } = body;
    if (!name || typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ error: "name is required" }, { status: 422 });
    }

    const slug = toSlug(name.trim());

    const { data: created, error: insertErr } = await supabase
        .from("providers")
        .insert({
            name:      name.trim(),
            slug,
            is_active: true,
        })
        .select("id, name, slug")
        .single();

    if (insertErr) {
        const isDupe = insertErr.message.includes("unique");
        return NextResponse.json(
            { error: isDupe ? "A provider with that name already exists" : "Insert failed" },
            { status: isDupe ? 409 : 500 }
        );
    }

    return NextResponse.json({ provider: created }, { status: 201 });
}
