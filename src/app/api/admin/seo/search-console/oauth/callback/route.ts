import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
    exchangeGoogleCode,
    getStoredGoogleSearchConsoleToken,
    saveGoogleSearchConsoleToken,
} from "@/lib/google-search-console";

export const dynamic = "force-dynamic";

const REPORT_PATH = "/app/admin/seo/search-console";

function redirectToReport(request: NextRequest, params: Record<string, string>) {
    const url = new URL(REPORT_PATH, request.url);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    return NextResponse.redirect(url);
}

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return profile?.role === "admin" ? user : null;
}

export async function GET(request: NextRequest) {
    const supabase = createClient();
    const user = await requireAdmin(supabase);
    if (!user) return redirectToReport(request, { gsc_error: "Forbidden" });

    const searchParams = request.nextUrl.searchParams;
    const error = searchParams.get("error");
    if (error) return redirectToReport(request, { gsc_error: error });

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const expectedState = cookies().get("gsc_oauth_state")?.value;
    cookies().delete("gsc_oauth_state");

    if (!code) return redirectToReport(request, { gsc_error: "Missing Google OAuth code." });
    if (!state || !expectedState || state !== expectedState) {
        return redirectToReport(request, { gsc_error: "Invalid Google OAuth state. Start the connection again." });
    }

    try {
        const existing = await getStoredGoogleSearchConsoleToken(supabase);
        const token = await exchangeGoogleCode(code);
        await saveGoogleSearchConsoleToken(supabase, token, user.id, existing?.refresh_token);
    } catch (error) {
        return redirectToReport(request, {
            gsc_error: error instanceof Error ? error.message : "Unable to connect Google Search Console.",
        });
    }

    return redirectToReport(request, { gsc_connected: "1" });
}
