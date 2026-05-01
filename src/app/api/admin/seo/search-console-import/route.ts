import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseSearchConsoleCsv } from "@/lib/search-console-import";

async function checkAdmin(supabase: ReturnType<typeof createClient>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || !["admin", "editor"].includes(profile.role)) return null;
    return user;
}

function parseDate(value: unknown) {
    const text = typeof value === "string" ? value.trim() : "";
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const user = await checkAdmin(supabase);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const csv = typeof (body as Record<string, unknown>).csv === "string" ? String((body as Record<string, unknown>).csv) : "";
    if (!csv.trim()) return NextResponse.json({ error: "CSV is required." }, { status: 400 });

    const dateStart = parseDate((body as Record<string, unknown>).dateStart);
    const dateEnd = parseDate((body as Record<string, unknown>).dateEnd);
    const { data: guides, error: guidesError } = await supabase.from("guides").select("id, slug").limit(5000);
    if (guidesError) return NextResponse.json({ error: guidesError.message }, { status: 500 });

    let parsed;
    try {
        parsed = parseSearchConsoleCsv(csv, guides ?? []);
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to parse CSV." }, { status: 400 });
    }

    if (parsed.length === 0) return NextResponse.json({ error: "No valid rows found." }, { status: 400 });

    const rows = parsed.slice(0, 5000).map((row) => ({
        guide_id: row.guideId,
        page_url: row.pageUrl.slice(0, 1000),
        query: row.query.slice(0, 500),
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        date_start: dateStart,
        date_end: dateEnd,
    }));

    const { error } = await supabase.from("guide_search_console_metrics").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
        inserted: rows.length,
        matched: rows.filter((row) => row.guide_id).length,
        unmatched: rows.filter((row) => !row.guide_id).length,
    }, { status: 201 });
}
