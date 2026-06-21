import "server-only";

import type { ConversionStatus } from "@/lib/earn-rewards";
import { recordRevenueEvent } from "@/lib/revenue-events-server";
import { evaluateLifecycleTransition, mergeReviewState } from "./status";
import type { ConversionWriteInput, ConversionWriteResult, ReviewStatus } from "./types";

type OfferClickRow = {
    id: string;
    click_id: string;
    user_id: string | null;
    earn_offer_id: string | null;
    offer_partner_id: string | null;
    gross_payout_cents: number | null;
    user_reward_cents: number | null;
    currency: string | null;
};

type EarnOfferRow = {
    id: string;
    partner_id: string;
    title: string;
    user_reward_cents: number;
    currency: string;
    pending_days: number;
};

type ExistingConversionRow = {
    id: string;
    click_id: string;
    status: ConversionStatus;
    review_status: ReviewStatus;
    review_reasons: string[] | null;
};

type ConversionEventRow = {
    id: string;
    status: ConversionStatus;
    user_reward_cents: number;
    review_status: ReviewStatus;
    review_reasons: string[] | null;
};

export class ConversionWriteError extends Error {
    status: number;
    code: string;
    details: Record<string, unknown>;

    constructor(status: number, code: string, details: Record<string, unknown> = {}) {
        super(code);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

function ledgerDates(status: ConversionStatus, pendingDays: number) {
    const now = new Date();
    if (status === "approved") {
        return { available_at: now.toISOString(), reversed_at: null };
    }
    if (status === "pending") {
        const availableAt = new Date(now);
        availableAt.setDate(availableAt.getDate() + Math.max(0, pendingDays));
        return { available_at: availableAt.toISOString(), reversed_at: null };
    }
    if (status === "reversed") {
        return { available_at: null, reversed_at: now.toISOString() };
    }
    return { available_at: null, reversed_at: null };
}

export async function writeConversionAndLedger(input: ConversionWriteInput): Promise<ConversionWriteResult> {
    const { db } = input;
    const { data: click, error: clickError } = await db
        .from("offer_clicks")
        .select("id, click_id, user_id, earn_offer_id, offer_partner_id, gross_payout_cents, user_reward_cents, currency")
        .eq("click_id", input.clickId)
        .maybeSingle<OfferClickRow>();

    if (clickError) {
        console.error("[postbacks/conversion-writer] click lookup failed", clickError);
        throw new ConversionWriteError(500, "click_lookup_failed");
    }

    if (!click || !click.earn_offer_id || !click.offer_partner_id) {
        throw new ConversionWriteError(404, "click_not_found");
    }

    const { data: offer, error: offerError } = await db
        .from("earn_offers")
        .select("id, partner_id, title, user_reward_cents, currency, pending_days")
        .eq("id", click.earn_offer_id)
        .maybeSingle<EarnOfferRow>();

    if (offerError) {
        console.error("[postbacks/conversion-writer] offer lookup failed", offerError);
        throw new ConversionWriteError(500, "offer_lookup_failed");
    }

    if (!offer) throw new ConversionWriteError(404, "offer_not_found");

    const { data: existingConversion, error: existingConversionError } = await db
        .from("conversion_events")
        .select("id, click_id, status, review_status, review_reasons")
        .eq("offer_partner_id", click.offer_partner_id)
        .eq("external_transaction_id", input.externalTransactionId)
        .maybeSingle<ExistingConversionRow>();

    if (existingConversionError) {
        console.error("[postbacks/conversion-writer] existing conversion lookup failed", existingConversionError);
        throw new ConversionWriteError(500, "conversion_lookup_failed");
    }

    if (existingConversion && existingConversion.click_id !== click.click_id) {
        throw new ConversionWriteError(409, "duplicate_external_transaction_id", {
            conversion_event_id: existingConversion.id,
            existing_click_id: existingConversion.click_id,
        });
    }

    const lifecycle = evaluateLifecycleTransition(existingConversion?.status, input.internalStatus);
    const providerReasons = input.providerStatus.toLowerCase() === "chargeback" ? ["provider_chargeback"] : [];
    const review = mergeReviewState(
        existingConversion?.review_status,
        existingConversion?.review_reasons,
        lifecycle,
        [...providerReasons, ...(input.reviewReasons ?? [])],
    );
    const effectiveStatus = lifecycle.reviewStatus === "flagged" && existingConversion?.status
        ? existingConversion.status
        : input.internalStatus;
    const userRewardCents = Number(click.user_reward_cents ?? offer.user_reward_cents ?? 0);
    const currency = input.currency || click.currency || offer.currency;
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
                external_transaction_id: input.externalTransactionId,
                status: effectiveStatus,
                gross_revenue_cents: input.grossRevenueCents,
                user_reward_cents: userRewardCents,
                currency,
                raw_payload: input.rawPayload,
                provider_config_id: input.providerConfigId ?? null,
                postback_receipt_id: input.postbackReceiptId ?? null,
                provider_status: input.providerStatus,
                review_status: review.reviewStatus,
                review_reasons: review.reviewReasons,
                source_ip: input.sourceIp ?? null,
                updated_at: nowIso,
            },
            { onConflict: "offer_partner_id,external_transaction_id" },
        )
        .select("id, status, user_reward_cents, review_status, review_reasons")
        .single<ConversionEventRow>();

    if (conversionError) {
        console.error("[postbacks/conversion-writer] conversion upsert failed", conversionError);
        throw new ConversionWriteError(500, "conversion_upsert_failed");
    }

    await recordRevenueEvent(db, {
        event_name: "conversion_postback",
        route_path: "/api/postbacks/provider",
        route_group: "postback",
        entity_type: "offer",
        entity_id: offer.id,
        offer_id: offer.id,
        source_context: "provider_postback",
        conversion_event_id: conversion.id,
        user_id: click.user_id,
        metadata: {
            click_id: click.click_id,
            offer_title: offer.title,
            offer_partner_id: click.offer_partner_id,
            provider_config_id: input.providerConfigId ?? "",
            external_transaction_id: input.externalTransactionId,
            status: effectiveStatus,
            gross_revenue_cents: input.grossRevenueCents,
            user_reward_cents: userRewardCents,
            currency,
        },
    });

    let ledger = null;
    if (click.user_id && userRewardCents > 0) {
        const dates = ledgerDates(effectiveStatus, Number(offer.pending_days ?? 0));
        const { data: ledgerRow, error: ledgerError } = await db
            .from("user_reward_ledger")
            .upsert(
                {
                    user_id: click.user_id,
                    conversion_event_id: conversion.id,
                    offer_click_id: click.id,
                    earn_offer_id: offer.id,
                    offer_partner_id: click.offer_partner_id,
                    status: effectiveStatus,
                    amount_cents: userRewardCents,
                    currency,
                    paid_at: null,
                    updated_at: nowIso,
                    ...dates,
                },
                { onConflict: "conversion_event_id" },
            )
            .select("id, status, amount_cents, currency, available_at, reversed_at")
            .single();

        if (ledgerError) {
            console.error("[postbacks/conversion-writer] ledger upsert failed", ledgerError);
            throw new ConversionWriteError(500, "ledger_upsert_failed");
        }

        ledger = ledgerRow;
    }

    return {
        conversion: {
            id: conversion.id,
            status: conversion.status,
            user_reward_cents: conversion.user_reward_cents,
            review_status: conversion.review_status,
            review_reasons: conversion.review_reasons ?? [],
        },
        ledger,
        duplicateSafeKey: {
            offer_partner_id: click.offer_partner_id,
            external_transaction_id: input.externalTransactionId,
        },
        reviewStatus: review.reviewStatus,
        reviewReasons: review.reviewReasons,
    };
}
