import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const EVENT_TYPES = new Set([
    "view",
    "cta_click",
    "offer_click",
    "platform_click",
    "internal_link_click",
]);

function cleanString(value: unknown, maxLength: number) {
    const text = typeof value === "string" ? value.trim() : "";
    return text ? text.slice(0, maxLength) : null;
}

function cleanTargetUrl(value: unknown) {
    const url = cleanString(value, 1000);
    if (!url) return null;
    if (url.startsWith("/")) return url;

    try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString().slice(0, 1000) : null;
    } catch {
        return null;
    }
}

function cleanMetadata(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const source = value as Record<string, unknown>;
    const metadata: Record<string, string | number | boolean> = {};

    for (const [key, rawValue] of Object.entries(source).slice(0, 20)) {
        const safeKey = key.replace(/[^a-zA-Z0-9_:-]/g, "").slice(0, 40);
        if (!safeKey) continue;
        if (typeof rawValue === "string") metadata[safeKey] = rawValue.slice(0, 300);
        if (typeof rawValue === "number" && Number.isFinite(rawValue)) metadata[safeKey] = rawValue;
        if (typeof rawValue === "boolean") metadata[safeKey] = rawValue;
    }

    return metadata;
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const eventType = cleanString(payload.eventType, 80);
    const guideSlug = cleanString(payload.guideSlug, 220);

    if (!eventType || !EVENT_TYPES.has(eventType)) {
        return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }

    if (!guideSlug) {
        return NextResponse.json({ error: "Missing guide slug" }, { status: 400 });
    }

    const guideId = cleanString(payload.guideId, 80);
    const supabase = createClient();
    const { error } = await supabase.from("guide_events").insert({
        guide_id: guideId,
        guide_slug: guideSlug,
        event_type: eventType,
        target_url: cleanTargetUrl(payload.targetUrl),
        metadata: cleanMetadata(payload.metadata),
    });

    if (error) {
        return NextResponse.json({ error: "Unable to record event" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
}
