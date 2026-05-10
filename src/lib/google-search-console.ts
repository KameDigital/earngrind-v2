import { createClient } from "@/lib/supabase/server";
import { matchGuideIdFromPageUrl, type SearchConsoleGuide } from "@/lib/search-console-import";

export const GOOGLE_SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
export const GOOGLE_SEARCH_CONSOLE_PROVIDER = "google_search_console";
export const GOOGLE_SEARCH_CONSOLE_ENV_VARS = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
    "GOOGLE_SEARCH_CONSOLE_SITE_URL",
] as const;

export type SearchConsoleApiRow = {
    pageUrl: string;
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    guideId: string | null;
};

type GoogleTokenResponse = {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
    error?: string;
    error_description?: string;
};

type StoredToken = {
    id: string;
    access_token: string | null;
    refresh_token: string | null;
    expires_at: string | null;
};

function requiredEnv(name: string) {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`Missing env: ${name}`);
    return value;
}

export function getGoogleSearchConsoleConfig() {
    return {
        clientId: requiredEnv("GOOGLE_CLIENT_ID"),
        clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
        redirectUri: requiredEnv("GOOGLE_REDIRECT_URI"),
        siteUrl: requiredEnv("GOOGLE_SEARCH_CONSOLE_SITE_URL"),
    };
}

export function getGoogleSearchConsoleEnvStatus() {
    const missing = GOOGLE_SEARCH_CONSOLE_ENV_VARS.filter((name) => !process.env[name]?.trim());
    return { ready: missing.length === 0, missing };
}

export function formatMissingGoogleSearchConsoleEnvMessage(missing: readonly string[]) {
    return `Missing Google env vars: ${missing.join(", ")}`;
}

export function buildGoogleOAuthUrl(state: string) {
    const config = getGoogleSearchConsoleConfig();
    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: "code",
        scope: GOOGLE_SEARCH_CONSOLE_SCOPE,
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
        state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function postGoogleToken(body: URLSearchParams) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
    });
    const payload = await response.json().catch(() => ({})) as GoogleTokenResponse;
    if (!response.ok || payload.error) {
        throw new Error(payload.error_description || payload.error || "Google OAuth token request failed.");
    }
    return payload;
}

export async function exchangeGoogleCode(code: string) {
    const config = getGoogleSearchConsoleConfig();
    return postGoogleToken(new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
    }));
}

async function refreshGoogleAccessToken(refreshToken: string) {
    const config = getGoogleSearchConsoleConfig();
    return postGoogleToken(new URLSearchParams({
        refresh_token: refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "refresh_token",
    }));
}

function expiresAt(expiresIn?: number) {
    const seconds = Number.isFinite(expiresIn) ? Number(expiresIn) : 3600;
    return new Date(Date.now() + Math.max(60, seconds - 60) * 1000).toISOString();
}

export async function getStoredGoogleSearchConsoleToken(supabase: ReturnType<typeof createClient>) {
    const { data, error } = await supabase
        .from("admin_integration_tokens")
        .select("id, access_token, refresh_token, expires_at")
        .eq("provider", GOOGLE_SEARCH_CONSOLE_PROVIDER)
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data as StoredToken | null;
}

export async function saveGoogleSearchConsoleToken(
    supabase: ReturnType<typeof createClient>,
    token: GoogleTokenResponse,
    connectedBy: string,
    previousRefreshToken?: string | null,
) {
    const config = getGoogleSearchConsoleConfig();
    const refreshToken = token.refresh_token ?? previousRefreshToken ?? null;
    if (!token.access_token || !refreshToken) {
        throw new Error("Google did not return a refresh token. Reconnect with consent to enable scheduled sync.");
    }

    const payload: Record<string, unknown> = {
        provider: GOOGLE_SEARCH_CONSOLE_PROVIDER,
        access_token: token.access_token,
        refresh_token: refreshToken,
        expires_at: expiresAt(token.expires_in),
        scopes: token.scope ?? GOOGLE_SEARCH_CONSOLE_SCOPE,
        site_url: config.siteUrl,
        updated_at: new Date().toISOString(),
    };
    if (connectedBy) payload.connected_by = connectedBy;

    const { error } = await supabase.from("admin_integration_tokens").upsert(payload, { onConflict: "provider" });

    if (error) throw new Error(error.message);
}

export async function getValidGoogleAccessToken(supabase: ReturnType<typeof createClient>) {
    const stored = await getStoredGoogleSearchConsoleToken(supabase);
    if (!stored?.refresh_token) {
        throw new Error("No Google Search Console token is connected.");
    }

    const expiresAtTime = stored.expires_at ? new Date(stored.expires_at).getTime() : 0;
    if (stored.access_token && expiresAtTime > Date.now() + 60_000) {
        return stored.access_token;
    }

    let refreshed: GoogleTokenResponse;
    try {
        refreshed = await refreshGoogleAccessToken(stored.refresh_token);
    } catch {
        throw new Error("Google OAuth expired. Reconnect Google Search Console.");
    }

    await saveGoogleSearchConsoleToken(supabase, refreshed, "", stored.refresh_token);
    return refreshed.access_token!;
}

function parseGoogleSearchConsoleError(status: number, payload: unknown) {
    const message = typeof payload === "object" && payload && "error" in payload
        ? JSON.stringify((payload as { error?: unknown }).error)
        : "";
    if (status === 403 || status === 404) {
        return "Invalid Search Console property URL or the connected Google account does not have access.";
    }
    if (status === 401) {
        return "Google OAuth expired. Reconnect Google Search Console.";
    }
    return message || "Search Console API request failed.";
}

export async function fetchSearchConsoleRows(accessToken: string, startDate: string, endDate: string, guides: SearchConsoleGuide[]) {
    const { siteUrl } = getGoogleSearchConsoleConfig();
    const response = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
        method: "POST",
        headers: {
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            startDate,
            endDate,
            dimensions: ["page", "query"],
            rowLimit: 25000,
        }),
        cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(parseGoogleSearchConsoleError(response.status, payload));
    }

    const rows = Array.isArray((payload as { rows?: unknown[] }).rows) ? (payload as { rows: unknown[] }).rows : [];
    return rows.map((row): SearchConsoleApiRow | null => {
        if (!row || typeof row !== "object") return null;
        const typed = row as { keys?: unknown[]; clicks?: unknown; impressions?: unknown; ctr?: unknown; position?: unknown };
        const pageUrl = typeof typed.keys?.[0] === "string" ? typed.keys[0] : "";
        const query = typeof typed.keys?.[1] === "string" ? typed.keys[1] : "";
        if (!pageUrl || !query) return null;
        return {
            pageUrl,
            query,
            clicks: Math.max(0, Math.round(Number(typed.clicks ?? 0))),
            impressions: Math.max(0, Math.round(Number(typed.impressions ?? 0))),
            ctr: Math.max(0, Number(typed.ctr ?? 0)),
            position: Math.max(0, Number(typed.position ?? 0)),
            guideId: matchGuideIdFromPageUrl(pageUrl, guides),
        };
    }).filter((row): row is SearchConsoleApiRow => Boolean(row));
}
