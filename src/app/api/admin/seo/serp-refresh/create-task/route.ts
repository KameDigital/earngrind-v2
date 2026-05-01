import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function checkAdmin(supabase: ReturnType<typeof createClient>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || !["admin", "editor"].includes(profile.role)) return null;
    return user;
}

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const user = await checkAdmin(supabase);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => null);
    const guideId = typeof body?.guideId === "string" ? body.guideId.trim() : "";
    const editorNotes = typeof body?.editorNotes === "string" ? body.editorNotes.trim() : "";

    if (!guideId) return NextResponse.json({ error: "Guide id is required." }, { status: 400 });
    if (!editorNotes) return NextResponse.json({ error: "Refresh plan notes are required." }, { status: 400 });

    const { data: guide, error: guideError } = await supabase
        .from("guides")
        .select("editor_notes")
        .eq("id", guideId)
        .maybeSingle();

    if (guideError) return NextResponse.json({ error: guideError.message }, { status: 500 });
    if (!guide) return NextResponse.json({ error: "Guide not found." }, { status: 404 });

    const existingNotes = String(guide.editor_notes ?? "").trim();
    const nextNotes = existingNotes ? `${existingNotes}\n\n---\n\n${editorNotes}` : editorNotes;

    const { error } = await supabase
        .from("guides")
        .update({
            content_status: "needs_edit",
            editor_notes: nextNotes,
            updated_at: new Date().toISOString(),
        })
        .eq("id", guideId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
