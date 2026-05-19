import "server-only";

import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedPostback, ProviderConfig } from "./types";

type ReceiptRow = {
    id: string;
    failure_code: string | null;
    linked_conversion_event_id: string | null;
};

export function buildRequestHash({ method, url, rawBody }: { method: string; url: string; rawBody: string }): string {
    return createHash("sha256").update(`${method}\n${url}\n${rawBody}`).digest("hex");
}

export function buildReplayKey({
    config,
    normalized,
    requestHash,
    signature,
    timestamp,
    nonce,
}: {
    config: ProviderConfig;
    normalized?: Pick<NormalizedPostback, "externalTransactionId"> | null;
    requestHash: string;
    signature?: string | null;
    timestamp?: string | null;
    nonce?: string | null;
}): string {
    if (config.nonce_param && nonce) return `nonce:${nonce}`;
    if (config.timestamp_param && timestamp && signature) return `timestamp-signature:${timestamp}:${signature}`;
    if (normalized?.externalTransactionId) return `transaction:${normalized.externalTransactionId}`;
    return `request:${requestHash}`;
}

export async function createPostbackReceipt({
    db,
    providerConfigId,
    method,
    sourceIp,
    signatureValid,
    replayKey,
    requestHash,
    redactedPayload,
    failureCode,
}: {
    db: SupabaseClient;
    providerConfigId: string;
    method: string;
    sourceIp: string | null;
    signatureValid: boolean;
    replayKey: string;
    requestHash: string;
    redactedPayload: Record<string, unknown>;
    failureCode: string | null;
}): Promise<{ receipt: ReceiptRow | null; replayDuplicate: boolean; error: string | null }> {
    const { data, error } = await db
        .from("postback_receipts")
        .insert({
            provider_config_id: providerConfigId,
            method,
            source_ip: sourceIp,
            signature_valid: signatureValid,
            replay_key: replayKey,
            request_hash: requestHash,
            redacted_payload: redactedPayload,
            failure_code: failureCode,
        })
        .select("id, failure_code, linked_conversion_event_id")
        .single<ReceiptRow>();

    if (!error) return { receipt: data, replayDuplicate: false, error: null };

    if (error.code === "23505") {
        const { data: existing } = await db
            .from("postback_receipts")
            .select("id, failure_code, linked_conversion_event_id")
            .eq("provider_config_id", providerConfigId)
            .eq("replay_key", replayKey)
            .maybeSingle<ReceiptRow>();

        return { receipt: existing ?? null, replayDuplicate: true, error: null };
    }

    console.error("[postbacks/replay] receipt insert failed", error);
    return { receipt: null, replayDuplicate: false, error: "receipt_insert_failed" };
}

export async function linkReceiptToConversion(
    db: SupabaseClient,
    receiptId: string | null | undefined,
    conversionEventId: string,
): Promise<void> {
    if (!receiptId) return;

    const { error } = await db
        .from("postback_receipts")
        .update({ linked_conversion_event_id: conversionEventId })
        .eq("id", receiptId);

    if (error) {
        console.error("[postbacks/replay] receipt link failed", error);
    }
}
