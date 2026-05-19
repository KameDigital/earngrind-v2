import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConversionStatus } from "@/lib/earn-rewards";

export type SecretType = "none" | "static_token" | "hmac";
export type SignatureAlgorithm = "none" | "hmac-sha1" | "hmac-sha256" | "hmac-sha512";
export type SignatureLocation = "header" | "query" | "body";
export type ReviewStatus = "clean" | "flagged" | "ignored" | "reviewed";

export type ProviderConfig = {
    id: string;
    offer_partner_id: string;
    provider_slug: string;
    status: string;
    secret_type: SecretType;
    secret_env_var: string | null;
    signature_algorithm: SignatureAlgorithm;
    signature_location: SignatureLocation;
    signature_param: string | null;
    allowed_ip_ranges: string[] | null;
    click_id_param: string;
    transaction_id_param: string;
    payout_param: string;
    currency_param: string | null;
    status_param: string;
    status_map: Record<string, string>;
    redacted_fields: string[] | null;
    timestamp_param: string | null;
    nonce_param: string | null;
    max_clock_skew_seconds: number;
    replay_ttl_seconds: number;
    partner?: { id: string; status: string } | { id: string; status: string }[] | null;
    secret?: string | null;
};

export type PostbackSources = {
    query: Record<string, unknown>;
    body: Record<string, unknown>;
    headers: Record<string, unknown>;
};

export type NormalizedPostback = {
    clickId: string;
    externalTransactionId: string;
    grossRevenueCents: number;
    currency: string | null;
    providerStatus: string;
    internalStatus: ConversionStatus;
};

export type ConversionWriteInput = NormalizedPostback & {
    db: SupabaseClient;
    providerConfigId?: string | null;
    postbackReceiptId?: string | null;
    rawPayload: Record<string, unknown>;
    sourceIp?: string | null;
    reviewReasons?: string[];
};

export type ConversionWriteResult = {
    conversion: {
        id: string;
        status: ConversionStatus;
        user_reward_cents: number;
        review_status: ReviewStatus;
        review_reasons: string[];
    };
    ledger: unknown;
    duplicateSafeKey: {
        offer_partner_id: string;
        external_transaction_id: string;
    };
    reviewStatus: ReviewStatus;
    reviewReasons: string[];
};
