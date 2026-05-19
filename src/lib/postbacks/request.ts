import type { NextRequest } from "next/server";
import type { NormalizedPostback, PostbackSources, ProviderConfig } from "./types";
import { mapProviderStatus } from "./status";

export type ParsedPostbackRequest = {
    rawBody: string;
    sources: PostbackSources;
};

function headersToObject(req: NextRequest): Record<string, unknown> {
    return Object.fromEntries(Array.from(req.headers.entries()).map(([key, value]) => [key.toLowerCase(), value]));
}

function queryToObject(req: NextRequest): Record<string, unknown> {
    return Object.fromEntries(req.nextUrl.searchParams.entries());
}

function bodyToRecord(body: unknown): Record<string, unknown> {
    return body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
}

export async function parsePostbackRequest(req: NextRequest): Promise<ParsedPostbackRequest> {
    const rawBody = await req.text();
    const contentType = req.headers.get("content-type") ?? "";
    let body: Record<string, unknown> = {};

    if (rawBody && contentType.includes("application/json")) {
        try {
            body = bodyToRecord(JSON.parse(rawBody));
        } catch {
            body = {};
        }
    } else if (rawBody && contentType.includes("application/x-www-form-urlencoded")) {
        body = Object.fromEntries(new URLSearchParams(rawBody).entries());
    }

    return {
        rawBody,
        sources: {
            query: queryToObject(req),
            body,
            headers: headersToObject(req),
        },
    };
}

export function getParam(sources: PostbackSources, param: string | null | undefined): string | null {
    if (!param) return null;
    const value = sources.query[param] ?? sources.body[param];
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function parseAmountCents(value: string | null): number | null {
    if (!value || !/^\d+$/.test(value)) return null;
    return Number(value);
}

function parseCurrencyAmountCents(value: string | null): number | null {
    const normalized = value?.trim();
    if (!normalized || !/^\d+(?:\.\d{1,4})?$/.test(normalized)) return null;
    return Math.round(Number(normalized) * 100);
}

function parseProviderPayoutCents(config: ProviderConfig, value: string | null): number | null {
    if (config.provider_slug === "cpalead") {
        return parseCurrencyAmountCents(value);
    }

    return parseAmountCents(value);
}

export function normalizePostback(
    config: ProviderConfig,
    sources: PostbackSources,
): { ok: true; normalized: NormalizedPostback } | { ok: false; error: string } {
    const clickId = getParam(sources, config.click_id_param);
    const externalTransactionId = getParam(sources, config.transaction_id_param);
    const payoutValue = getParam(sources, config.payout_param);
    const statusValue = getParam(sources, config.status_param);
    const grossRevenueCents = parseProviderPayoutCents(config, payoutValue);

    if (!clickId || !externalTransactionId || !statusValue || grossRevenueCents === null) {
        return { ok: false, error: "missing_required_fields" };
    }

    const internalStatus = mapProviderStatus(statusValue, config.status_map);
    if (!internalStatus) return { ok: false, error: "invalid_provider_status" };

    return {
        ok: true,
        normalized: {
            clickId,
            externalTransactionId,
            grossRevenueCents,
            currency: getParam(sources, config.currency_param) ?? null,
            providerStatus: statusValue,
            internalStatus,
        },
    };
}

export function parseTimestamp(value: string | null): Date | null {
    if (!value) return null;
    if (/^\d{13}$/.test(value)) return new Date(Number(value));
    if (/^\d{10}$/.test(value)) return new Date(Number(value) * 1000);

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function validateTimestampSkew(config: ProviderConfig, sources: PostbackSources): { ok: true } | { ok: false; error: string } {
    if (!config.timestamp_param || Number(config.max_clock_skew_seconds ?? 0) <= 0) return { ok: true };

    const timestamp = parseTimestamp(getParam(sources, config.timestamp_param));
    if (!timestamp) return { ok: false, error: "invalid_timestamp" };

    const skewMs = Math.abs(Date.now() - timestamp.getTime());
    return skewMs <= Number(config.max_clock_skew_seconds) * 1000
        ? { ok: true }
        : { ok: false, error: "timestamp_skew" };
}
