import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeRevenueEvent, type RevenueEventInput } from "@/lib/revenue-events";

function hasSupabasePublicEnv() {
    return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function recordRevenueEvent(
    db: SupabaseClient,
    input: RevenueEventInput & { user_id?: string | null },
) {
    if (!hasSupabasePublicEnv()) {
        if (process.env.NODE_ENV !== "production") {
            console.info("[revenue-events] skipped server insert; Supabase public env is missing", input);
        }
        return;
    }

    const normalized = normalizeRevenueEvent(input);
    if (!normalized.ok) {
        if (process.env.NODE_ENV !== "production") {
            console.warn("[revenue-events] invalid server event", normalized.error, input);
        }
        return;
    }

    const { error } = await db.from("revenue_events").insert({
        ...normalized.event,
        user_id: input.user_id ?? null,
    });

    if (error && process.env.NODE_ENV !== "production") {
        console.warn("[revenue-events] server insert failed", error.message);
    }
}
