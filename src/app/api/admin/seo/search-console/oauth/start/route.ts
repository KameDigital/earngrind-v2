import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildGoogleOAuthUrl } from "@/lib/google-search-console";

export const dynamic = "force-dynamic";

async function requireAdmin() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return profile?.role === "admin";
}

export async function GET() {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let url: string;
    try {
        const state = randomBytes(24).toString("hex");
        cookies().set("gsc_oauth_state", state, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 10 * 60,
            path: "/",
        });
        url = buildGoogleOAuthUrl(state);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Google Search Console OAuth is not configured.";
        return NextResponse.redirect(new URL(`/app/admin/seo/search-console?gsc_error=${encodeURIComponent(message)}`, process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000"));
    }

    return NextResponse.redirect(url);
}
