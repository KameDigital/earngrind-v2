import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostbackMethod, ProviderConfig } from "./types";

function getPartner(config: ProviderConfig): { id: string; status: string } | null {
    if (Array.isArray(config.partner)) return config.partner[0] ?? null;
    return config.partner ?? null;
}

function normalizeAllowedMethods(methods: unknown): PostbackMethod[] {
    if (!Array.isArray(methods)) return ["POST"];

    const allowed = methods
        .filter((method): method is PostbackMethod => method === "GET" || method === "POST");

    return allowed.length > 0 ? Array.from(new Set(allowed)) : ["POST"];
}

export function resolveProviderConfigSecret(
    config: ProviderConfig,
): { ok: true; config: ProviderConfig } | { ok: false; status: number; error: string } {
    const needsSecret = config.secret_type !== "none" || config.signature_algorithm !== "none";
    if (!needsSecret) return { ok: true, config: { ...config, secret: null } };

    if (!config.secret_env_var) {
        return { ok: false, status: 503, error: "provider_secret_not_configured" };
    }

    const secret = process.env[config.secret_env_var];
    if (!secret) {
        return { ok: false, status: 503, error: "provider_secret_not_configured" };
    }

    return { ok: true, config: { ...config, secret } };
}

export async function loadProviderConfig(
    db: SupabaseClient,
    providerSlug: string,
    options: { resolveSecret?: boolean } = {},
): Promise<{ ok: true; config: ProviderConfig } | { ok: false; status: number; error: string }> {
    const { data, error } = await db
        .from("offer_partner_postback_configs")
        .select(`
            id,
            offer_partner_id,
            provider_slug,
            status,
            secret_type,
            secret_env_var,
            signature_algorithm,
            signature_location,
            signature_param,
            allowed_methods,
            allowed_ip_ranges,
            click_id_param,
            transaction_id_param,
            payout_param,
            currency_param,
            status_param,
            status_map,
            redacted_fields,
            timestamp_param,
            nonce_param,
            max_clock_skew_seconds,
            replay_ttl_seconds,
            partner:offer_partners(id, status)
        `)
        .eq("provider_slug", providerSlug)
        .maybeSingle<ProviderConfig>();

    if (error) {
        console.error("[postbacks/provider-config] lookup failed", error);
        return { ok: false, status: 500, error: "provider_config_lookup_failed" };
    }

    const partner = data ? getPartner(data) : null;
    if (!data || data.status !== "active" || partner?.status !== "active") {
        return { ok: false, status: 404, error: "provider_not_found" };
    }

    const config = {
        ...data,
        allowed_methods: normalizeAllowedMethods(data.allowed_methods),
    };

    return options.resolveSecret === false
        ? { ok: true, config: { ...config, secret: null } }
        : resolveProviderConfigSecret(config);
}
