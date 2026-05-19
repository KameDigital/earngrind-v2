import { NextRequest, NextResponse } from "next/server";
import { isConversionStatus, type ConversionStatus } from "@/lib/earn-rewards";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PostbackInput = {
    click_id?: unknown;
    amount?: unknown;
    status?: unknown;
    external_transaction_id?: unknown;
    secret?: unknown;
};

type OfferClickRow = {
    id: string;
    click_id: string;
    user_id: string | null;
    earn_offer_id: string | null;
    offer_partner_id: string | null;
};

type EarnOfferRow = {
    id: string;
    partner_id: string;
    title: string;
    user_reward_cents: number;
    currency: string;
    pending_days: number;
};

type ConversionEventRow = {
    id: string;
    click_id?: string;
    status: ConversionStatus;
    user_reward_cents: number;
};

function readQueryInput(req: NextRequest): PostbackInput {
    const params = req.nextUrl.searchParams;
    return {
        click_id: params.get("click_id") ?? undefined,
        amount: params.get("amount") ?? undefined,
        status: params.get("status") ?? undefined,
        external_transaction_id: params.get("external_transaction_id") ?? undefined,
        secret: params.get("secret") ?? undefined,
    };
}

async function readPostbackInput(req: NextRequest): Promise<{ input: PostbackInput; rawPayload: Record<string, unknown> }> {
    const queryInput = readQueryInput(req);
    if (req.method !== "POST") {
        return { input: queryInput, rawPayload: { query: redactSecret(queryInput) } };
    }

    let body: unknown = {};
    try {
        const text = await req.text();
        body = text ? JSON.parse(text) : {};
    } catch {
        return { input: queryInput, rawPayload: { query: redactSecret(queryInput), body_error: "invalid_json" } };
    }

    const bodyInput = body && typeof body === "object" ? body as PostbackInput : {};
    return {
        input: { ...queryInput, ...bodyInput },
        rawPayload: { query: redactSecret(queryInput), body: redactSecret(bodyInput) },
    };
}

function requiredString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseAmountCents(value: unknown): number | null {
    if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
    if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value);
    return null;
}

function redactSecret(input: PostbackInput): PostbackInput {
    return {
        ...input,
        secret: input.secret ? "[redacted]" : input.secret,
    };
}

function ledgerDates(status: ConversionStatus, pendingDays: number) {
    const now = new Date();
    if (status === "approved") {
        return {
            available_at: now.toISOString(),
            reversed_at: null,
        };
    }
    if (status === "pending") {
        const availableAt = new Date(now);
        availableAt.setDate(availableAt.getDate() + Math.max(0, pendingDays));
        return {
            available_at: availableAt.toISOString(),
            reversed_at: null,
        };
    }
    if (status === "reversed") {
        return {
            available_at: null,
            reversed_at: now.toISOString(),
        };
    }
    return {
        available_at: null,
        reversed_at: null,
    };
}

export async function POST(req: NextRequest) {
    const configuredSecret = process.env.POSTBACK_TEST_SECRET;
    if (!configuredSecret) {
        return NextResponse.json({ error: "postback_secret_not_configured" }, { status: 503 });
    }

    const { input, rawPayload } = await readPostbackInput(req);
    const secret = requiredString(input.secret);
    if (secret !== configuredSecret) {
        return NextResponse.json({ error: "invalid_secret" }, { status: 401 });
    }

    const clickId = requiredString(input.click_id);
    const externalTransactionId = requiredString(input.external_transaction_id);
    const statusValue = requiredString(input.status);
    const grossRevenueCents = parseAmountCents(input.amount);

    if (!clickId || !externalTransactionId || !statusValue || grossRevenueCents === null) {
        return NextResponse.json(
            { error: "click_id, amount, status, external_transaction_id, and secret are required" },
            { status: 422 },
        );
    }

    if (!isConversionStatus(statusValue)) {
        return NextResponse.json({ error: "invalid_status" }, { status: 422 });
    }

    const db = createAdminClient();

    const { data: click, error: clickError } = await db
        .from("offer_clicks")
        .select("id, click_id, user_id, earn_offer_id, offer_partner_id")
        .eq("click_id", clickId)
        .maybeSingle<OfferClickRow>();

    if (clickError) {
        console.error("[postbacks/test] click lookup failed", clickError);
        return NextResponse.json({ error: "click_lookup_failed" }, { status: 500 });
    }

    if (!click || !click.earn_offer_id || !click.offer_partner_id) {
        return NextResponse.json({ error: "click_not_found" }, { status: 404 });
    }

    const { data: offer, error: offerError } = await db
        .from("earn_offers")
        .select("id, partner_id, title, user_reward_cents, currency, pending_days")
        .eq("id", click.earn_offer_id)
        .maybeSingle<EarnOfferRow>();

    if (offerError) {
        console.error("[postbacks/test] offer lookup failed", offerError);
        return NextResponse.json({ error: "offer_lookup_failed" }, { status: 500 });
    }

    if (!offer) {
        return NextResponse.json({ error: "offer_not_found" }, { status: 404 });
    }

    const { data: existingConversion, error: existingConversionError } = await db
        .from("conversion_events")
        .select("id, click_id, status, user_reward_cents")
        .eq("offer_partner_id", click.offer_partner_id)
        .eq("external_transaction_id", externalTransactionId)
        .maybeSingle<ConversionEventRow>();

    if (existingConversionError) {
        console.error("[postbacks/test] existing conversion lookup failed", existingConversionError);
        return NextResponse.json({ error: "conversion_lookup_failed" }, { status: 500 });
    }

    if (existingConversion && existingConversion.click_id !== click.click_id) {
        return NextResponse.json(
            {
                error: "duplicate_external_transaction_id",
                conversion_event_id: existingConversion.id,
                existing_click_id: existingConversion.click_id,
            },
            { status: 409 },
        );
    }

    const userRewardCents = Number(offer.user_reward_cents ?? 0);
    const nowIso = new Date().toISOString();
    const { data: conversion, error: conversionError } = await db
        .from("conversion_events")
        .upsert(
            {
                offer_click_id: click.id,
                click_id: click.click_id,
                offer_partner_id: click.offer_partner_id,
                earn_offer_id: offer.id,
                user_id: click.user_id,
                external_transaction_id: externalTransactionId,
                status: statusValue,
                gross_revenue_cents: grossRevenueCents,
                user_reward_cents: userRewardCents,
                currency: offer.currency,
                raw_payload: rawPayload,
                updated_at: nowIso,
            },
            { onConflict: "offer_partner_id,external_transaction_id" },
        )
        .select("id, status, user_reward_cents")
        .single<ConversionEventRow>();

    if (conversionError) {
        console.error("[postbacks/test] conversion upsert failed", conversionError);
        return NextResponse.json({ error: "conversion_upsert_failed" }, { status: 500 });
    }

    let ledger = null;
    if (click.user_id && userRewardCents > 0) {
        const dates = ledgerDates(statusValue, Number(offer.pending_days ?? 0));
        const { data: ledgerRow, error: ledgerError } = await db
            .from("user_reward_ledger")
            .upsert(
                {
                    user_id: click.user_id,
                    conversion_event_id: conversion.id,
                    offer_click_id: click.id,
                    earn_offer_id: offer.id,
                    offer_partner_id: click.offer_partner_id,
                    status: statusValue,
                    amount_cents: userRewardCents,
                    currency: offer.currency,
                    paid_at: null,
                    updated_at: nowIso,
                    ...dates,
                },
                { onConflict: "conversion_event_id" },
            )
            .select("id, status, amount_cents, currency, available_at, reversed_at")
            .single();

        if (ledgerError) {
            console.error("[postbacks/test] ledger upsert failed", ledgerError);
            return NextResponse.json({ error: "ledger_upsert_failed" }, { status: 500 });
        }

        ledger = ledgerRow;
    }

    return NextResponse.json({
        ok: true,
        conversion_event: {
            id: conversion.id,
            status: conversion.status,
            gross_revenue_cents: grossRevenueCents,
            user_reward_cents: conversion.user_reward_cents,
            external_transaction_id: externalTransactionId,
        },
        ledger,
        duplicate_safe_key: {
            offer_partner_id: click.offer_partner_id,
            external_transaction_id: externalTransactionId,
        },
    });
}

export async function GET(req: NextRequest) {
    return NextResponse.json(
        {
            error: "method_not_allowed",
            message: "Use POST with JSON body or query params.",
        },
        {
            status: 405,
            headers: { Allow: "POST" },
        },
    );
}
