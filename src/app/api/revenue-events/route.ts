import { NextRequest, NextResponse } from "next/server";
import { normalizeRevenueEvent } from "@/lib/revenue-events";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function hasSupabasePublicEnv() {
    return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getUserAgentFamily(request: NextRequest) {
    const ua = request.headers.get("user-agent")?.toLowerCase() ?? "";
    if (!ua) return null;
    if (ua.includes("edg/")) return "edge";
    if (ua.includes("chrome/")) return "chrome";
    if (ua.includes("safari/")) return "safari";
    if (ua.includes("firefox/")) return "firefox";
    if (ua.includes("bot") || ua.includes("crawler") || ua.includes("spider")) return "bot";
    return "other";
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
        return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const normalized = normalizeRevenueEvent({
        ...(body as Record<string, unknown>),
        user_agent_family: (body as Record<string, unknown>).user_agent_family ?? getUserAgentFamily(request),
    });

    if (!normalized.ok) {
        return NextResponse.json({ error: normalized.error }, { status: 400 });
    }

    if (!hasSupabasePublicEnv()) {
        if (process.env.NODE_ENV !== "production") {
            console.info("[revenue-events] skipped insert; Supabase public env is missing", normalized.event);
        }
        return NextResponse.json({ ok: true, skipped: "missing_supabase_env" }, { status: 202 });
    }

    try {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        const { error } = await supabase.from("revenue_events").insert({
            ...normalized.event,
            user_id: user?.id ?? null,
        });

        if (error) {
            if (process.env.NODE_ENV !== "production") {
                console.warn("[revenue-events] insert failed", error.message);
            }
            return NextResponse.json({ error: "insert_failed" }, { status: 500 });
        }

        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
        if (process.env.NODE_ENV !== "production") {
            console.warn("[revenue-events] unexpected failure", error);
        }
        return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    }
}
