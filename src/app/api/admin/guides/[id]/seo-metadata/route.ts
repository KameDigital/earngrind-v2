import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function checkAdmin(supabase: ReturnType<typeof createClient>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) return null;
    return user;
}

function cleanString(value: unknown, maxLength: number) {
    const text = typeof value === "string" ? value.trim() : "";
    return text ? text.slice(0, maxLength) : null;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createClient();
    const user = await checkAdmin(supabase);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const hasSeoTitle = Object.prototype.hasOwnProperty.call(payload, "seoTitle");
    const hasSeoDescription = Object.prototype.hasOwnProperty.call(payload, "seoDescription");

    if (!hasSeoTitle && !hasSeoDescription) {
        return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const updates: Record<string, string | null> = { updated_at: new Date().toISOString() };
    if (hasSeoTitle) updates.seo_title = cleanString(payload.seoTitle, 180);
    if (hasSeoDescription) updates.seo_description = cleanString(payload.seoDescription, 320);

    const { error } = await supabase.from("guides").update(updates).eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
}
