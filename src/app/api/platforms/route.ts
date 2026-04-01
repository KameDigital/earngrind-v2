import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const supabase = createClient();
    const { searchParams } = req.nextUrl;

    const kind = searchParams.get("kind");
    const country = searchParams.get("country");

    let query = supabase
        .from("platforms")
        .select("id, name, slug, platform_kind, logo_url, countries, trust_score")
        .eq("is_active", true);

    if (kind) {
        query = query.eq("platform_kind", kind);
    }
    if (country) {
        query = query.contains("countries", [country]);
    }

    const { data, error } = await query.order("trust_score", { ascending: false });

    if (error) {
        console.error("[GET /api/platforms]", error);
        return NextResponse.json({ error: "internal", message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] }, {
        headers: { "Cache-Control": "public, max-age=3600" } // Cache aggressively
    });
}
