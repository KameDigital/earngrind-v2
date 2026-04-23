import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger";

let cachedClient: SupabaseClient | null = null;

export function getDb(): SupabaseClient {
    if (cachedClient) return cachedClient;

    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) {
        throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
    }

    if (!serviceRoleKey) {
        throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    }

    cachedClient = createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    return cachedClient;
}

export async function withRetry<T>(
    operation: () => Promise<T>,
    label: string,
    attempts = 3,
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            logger.warn(`${label} failed`, {
                attempt,
                attempts,
                error: error instanceof Error ? error.message : String(error),
            });

            if (attempt < attempts) {
                await delay(attempt * 500);
            }
        }
    }

    throw lastError instanceof Error ? lastError : new Error(`${label} failed`);
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
