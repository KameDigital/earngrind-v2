import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ConversionWriteError, writeConversionAndLedger } from "@/lib/postbacks/conversion-writer";
import { getRequestIp, isIpAllowed } from "@/lib/postbacks/ip";
import { loadProviderConfig, resolveProviderConfigSecret } from "@/lib/postbacks/provider-config";
import { buildReplayKey, buildRequestHash, createPostbackReceipt, linkReceiptToConversion } from "@/lib/postbacks/replay";
import { getParam, normalizePostback, parsePostbackRequest, validateTimestampSkew } from "@/lib/postbacks/request";
import { redactPostbackSources } from "@/lib/postbacks/redaction";
import { getProvidedSignature, validatePostbackSignature } from "@/lib/postbacks/signatures";
import type { NormalizedPostback, PostbackMethod, ProviderConfig, PostbackSources } from "@/lib/postbacks/types";

export const dynamic = "force-dynamic";

async function getProviderSlug(params: Promise<{ provider: string }> | { provider: string }): Promise<string> {
    const resolvedParams = await params;
    return resolvedParams.provider;
}

function methodNotAllowed(method: string, allowedMethods: PostbackMethod[]) {
    return NextResponse.json(
        {
            error: "method_not_allowed",
            message: `Use ${allowedMethods.join(" or ")} with provider-signed postback parameters.`,
        },
        {
            status: 405,
            headers: { Allow: allowedMethods.join(", ") },
        },
    );
}

async function writeFailedReceipt({
    db,
    config,
    req,
    sources,
    sourceIp,
    requestHash,
    signatureValid,
    failureCode,
    normalized,
}: {
    db: ReturnType<typeof createAdminClient>;
    config: ProviderConfig;
    req: NextRequest;
    sources: PostbackSources;
    sourceIp: string | null;
    requestHash: string;
    signatureValid: boolean;
    failureCode: string;
    normalized?: NormalizedPostback | null;
}) {
    const replayKey = buildReplayKey({
        config,
        normalized,
        requestHash,
        signature: getProvidedSignature(config, sources),
        timestamp: getParam(sources, config.timestamp_param),
        nonce: getParam(sources, config.nonce_param),
    });
    const receipt = await createPostbackReceipt({
        db,
        providerConfigId: config.id,
        method: req.method,
        sourceIp,
        signatureValid,
        replayKey,
        requestHash,
        redactedPayload: redactPostbackSources(sources, config.redacted_fields),
        failureCode,
    });

    if (receipt.error) {
        return NextResponse.json({ error: receipt.error }, { status: 500 });
    }

    const status = failureCode === "ip_not_allowed"
        ? 403
        : failureCode === "missing_required_fields" || failureCode === "invalid_provider_status"
            ? 422
            : failureCode === "duplicate_replay"
                ? 409
                : 401;

    return NextResponse.json(
        {
            error: failureCode,
            receipt_id: receipt.receipt?.id ?? null,
            replay_duplicate: receipt.replayDuplicate,
        },
        { status },
    );
}

async function handleProviderPostback(
    req: NextRequest,
    { params }: { params: Promise<{ provider: string }> | { provider: string } },
) {
    const providerSlug = await getProviderSlug(params);
    const db = createAdminClient();
    const configResult = await loadProviderConfig(db, providerSlug, { resolveSecret: false });
    if (!configResult.ok) {
        return NextResponse.json({ error: configResult.error }, { status: configResult.status });
    }

    const baseConfig = configResult.config;
    if (!baseConfig.allowed_methods.includes(req.method as PostbackMethod)) {
        return methodNotAllowed(req.method, baseConfig.allowed_methods);
    }

    const secretResult = resolveProviderConfigSecret(baseConfig);
    if (!secretResult.ok) {
        return NextResponse.json({ error: secretResult.error }, { status: secretResult.status });
    }

    const config = secretResult.config;
    const { rawBody, sources } = await parsePostbackRequest(req);
    const sourceIp = getRequestIp(req);
    const requestHash = buildRequestHash({ method: req.method, url: req.url, rawBody });

    if (!isIpAllowed(sourceIp, config.allowed_ip_ranges)) {
        return writeFailedReceipt({
            db,
            config,
            req,
            sources,
            sourceIp,
            requestHash,
            signatureValid: false,
            failureCode: "ip_not_allowed",
        });
    }

    const signatureResult = validatePostbackSignature({ config, sources, rawBody });
    if (!signatureResult.ok) {
        return writeFailedReceipt({
            db,
            config,
            req,
            sources,
            sourceIp,
            requestHash,
            signatureValid: false,
            failureCode: signatureResult.reason ?? "invalid_signature",
        });
    }

    const timestampResult = validateTimestampSkew(config, sources);
    if (!timestampResult.ok) {
        return writeFailedReceipt({
            db,
            config,
            req,
            sources,
            sourceIp,
            requestHash,
            signatureValid: true,
            failureCode: timestampResult.error,
        });
    }

    const normalizedResult = normalizePostback(config, sources);
    if (!normalizedResult.ok) {
        return writeFailedReceipt({
            db,
            config,
            req,
            sources,
            sourceIp,
            requestHash,
            signatureValid: true,
            failureCode: normalizedResult.error,
        });
    }

    const normalized = normalizedResult.normalized;
    const replayKey = buildReplayKey({
        config,
        normalized,
        requestHash,
        signature: getProvidedSignature(config, sources),
        timestamp: getParam(sources, config.timestamp_param),
        nonce: getParam(sources, config.nonce_param),
    });
    const redactedPayload = redactPostbackSources(sources, config.redacted_fields);
    const receiptResult = await createPostbackReceipt({
        db,
        providerConfigId: config.id,
        method: req.method,
        sourceIp,
        signatureValid: true,
        replayKey,
        requestHash,
        redactedPayload,
        failureCode: null,
    });

    if (receiptResult.error) {
        return NextResponse.json({ error: receiptResult.error }, { status: 500 });
    }

    if (receiptResult.replayDuplicate) {
        return NextResponse.json(
            {
                ok: true,
                duplicate: true,
                replay_duplicate: true,
                receipt_id: receiptResult.receipt?.id ?? null,
                conversion_event_id: receiptResult.receipt?.linked_conversion_event_id ?? null,
            },
            { status: 200 },
        );
    }

    try {
        const result = await writeConversionAndLedger({
            db,
            ...normalized,
            providerConfigId: config.id,
            postbackReceiptId: receiptResult.receipt?.id ?? null,
            rawPayload: redactedPayload,
            sourceIp,
        });

        await linkReceiptToConversion(db, receiptResult.receipt?.id, result.conversion.id);

        return NextResponse.json({
            ok: true,
            conversion_event: {
                id: result.conversion.id,
                status: result.conversion.status,
                gross_revenue_cents: normalized.grossRevenueCents,
                user_reward_cents: result.conversion.user_reward_cents,
                external_transaction_id: normalized.externalTransactionId,
                review_status: result.conversion.review_status,
                review_reasons: result.conversion.review_reasons,
            },
            ledger: result.ledger,
            receipt_id: receiptResult.receipt?.id ?? null,
            duplicate_safe_key: result.duplicateSafeKey,
        });
    } catch (error) {
        if (receiptResult.receipt?.id && error instanceof ConversionWriteError) {
            await db.from("postback_receipts").update({ failure_code: error.code }).eq("id", receiptResult.receipt.id);
        }

        if (error instanceof ConversionWriteError) {
            return NextResponse.json({ error: error.code, ...error.details }, { status: error.status });
        }

        console.error("[postbacks/provider] unexpected conversion write failure", error);
        return NextResponse.json({ error: "conversion_write_failed" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ provider: string }> | { provider: string } },
) {
    return handleProviderPostback(req, context);
}

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ provider: string }> | { provider: string } },
) {
    return handleProviderPostback(req, context);
}
