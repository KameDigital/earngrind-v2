import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchSearchConsoleRows, getGoogleSearchConsoleEnvStatus, getValidGoogleAccessToken } from "@/lib/google-search-console";

export const dynamic = "force-dynamic";

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return profile?.role === "admin" ? user : null;
}

function parseDate(value: unknown) {
    const text = typeof value === "string" ? value.trim() : "";
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function defaultDateRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 27);
    return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
    };
}

export async function POST(request: NextRequest) {
    const supabase = createClient();
    if (!await requireAdmin(supabase)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const env = getGoogleSearchConsoleEnvStatus();
    if (!env.ready) {
        return NextResponse.json({ error: `Google Search Console is not configured. Missing: ${env.missing.join(", ")}` }, { status: 500 });
    }

    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const defaults = defaultDateRange();
    const startDate = parseDate(body.startDate) ?? defaults.startDate;
    const endDate = parseDate(body.endDate) ?? defaults.endDate;
    if (startDate > endDate) {
        return NextResponse.json({ error: "Start date must be before or equal to end date." }, { status: 400 });
    }

    const { data: guides, error: guidesError } = await supabase.from("guides").select("id, slug").limit(5000);
    if (guidesError) return NextResponse.json({ error: guidesError.message }, { status: 500 });

    let apiRows;
    try {
        const accessToken = await getValidGoogleAccessToken(supabase);
        apiRows = await fetchSearchConsoleRows(accessToken, startDate, endDate, guides ?? []);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to sync Google Search Console.";
        const status = message.includes("No Google Search Console token") ? 409 : message.includes("OAuth expired") ? 401 : 400;
        return NextResponse.json({ error: message }, { status });
    }

    if (apiRows.length === 0) {
        return NextResponse.json({ error: "No rows returned from Google Search Console for this date range." }, { status: 404 });
    }

    const rows = apiRows.slice(0, 25000).map((row) => ({
        guide_id: row.guideId,
        page_url: row.pageUrl.slice(0, 1000),
        query: row.query.slice(0, 500),
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        date_start: startDate,
        date_end: endDate,
    }));

    const { error: deleteError } = await supabase
        .from("guide_search_console_metrics")
        .delete()
        .eq("date_start", startDate)
        .eq("date_end", endDate);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    const { error: insertError } = await supabase.from("guide_search_console_metrics").insert(rows);
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    return NextResponse.json({
        inserted: rows.length,
        matched: rows.filter((row) => row.guide_id).length,
        unmatched: rows.filter((row) => !row.guide_id).length,
        dateStart: startDate,
        dateEnd: endDate,
    });
}
