import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { supabase, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) {
        return { supabase, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }

    return { supabase, error: null };
}

export async function GET(req: NextRequest) {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const slug = req.nextUrl.searchParams.get("slug")?.trim().toLowerCase();
    const excludeId = req.nextUrl.searchParams.get("excludeId");
    if (!slug) {
        return NextResponse.json({ duplicateSlug: false });
    }

    let query = auth.supabase.from("guides").select("id, slug").eq("slug", slug).limit(1);
    if (excludeId) query = query.neq("id", excludeId);

    const { data, error } = await query.maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
        duplicateSlug: Boolean(data),
        existingGuideId: data?.id ?? null,
    });
}
