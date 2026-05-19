import { NextRequest, NextResponse } from "next/server";
import { isConversionStatus } from "@/lib/earn-rewards";
import { ConversionWriteError, writeConversionAndLedger } from "@/lib/postbacks/conversion-writer";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PostbackInput = {
    click_id?: unknown;
    amount?: unknown;
    status?: unknown;
    external_transaction_id?: unknown;
    secret?: unknown;
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

    let result;
    try {
        result = await writeConversionAndLedger({
            db: createAdminClient(),
            clickId,
            externalTransactionId,
            grossRevenueCents,
            currency: null,
            providerStatus: statusValue,
            internalStatus: statusValue,
            rawPayload,
        });
    } catch (error) {
        if (error instanceof ConversionWriteError) {
            return NextResponse.json({ error: error.code, ...error.details }, { status: error.status });
        }

        console.error("[postbacks/test] unexpected conversion write failure", error);
        return NextResponse.json({ error: "conversion_write_failed" }, { status: 500 });
    }

    return NextResponse.json({
        ok: true,
        conversion_event: {
            id: result.conversion.id,
            status: result.conversion.status,
            gross_revenue_cents: grossRevenueCents,
            user_reward_cents: result.conversion.user_reward_cents,
            external_transaction_id: externalTransactionId,
        },
        ledger: result.ledger,
        duplicate_safe_key: result.duplicateSafeKey,
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
