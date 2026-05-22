import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ConversionWriteError, writeConversionAndLedger } from "@/lib/postbacks/conversion-writer";
import { writeEarnAdminAuditEvent } from "@/lib/earn-admin-audit";

type ManualCreditInput = {
    db: SupabaseClient;
    adminUserId: string;
    clickId: string;
    externalReference: string;
    adminReason: string;
    supportTicketId?: string | null;
};

type ClickRow = {
    id: string;
    click_id: string;
    user_id: string | null;
    offer_partner_id: string | null;
    gross_payout_cents: number | null;
    user_reward_cents: number | null;
    currency: string | null;
    reward_allowed: boolean | null;
    partner: { slug: string | null } | { slug: string | null }[] | null;
};

type ExistingConversionRow = {
    id: string;
    status: string;
    click_id: string;
};

type SupportTicketRow = {
    id: string;
    user_id: string;
    status: string;
    admin_status: string;
    admin_notes: string[] | null;
    conversion_event_id: string | null;
};

type LedgerRow = {
    id: string;
    status: string;
    review_status: string;
    review_reasons: string[] | null;
};

export class ManualCreditError extends Error {
    code: string;

    constructor(code: string) {
        super(code);
        this.code = code;
    }
}

export async function createManualCpaleadCredit(input: ManualCreditInput) {
    const externalReference = normalizeReference(input.externalReference);
    const adminReason = normalizeReason(input.adminReason);
    if (!isClickId(input.clickId)) throw new ManualCreditError("invalid_click_id");
    if (!externalReference) throw new ManualCreditError("missing_external_reference");
    if (!adminReason) throw new ManualCreditError("missing_admin_reason");

    const { db } = input;
    const { data: click, error: clickError } = await db
        .from("offer_clicks")
        .select(`
            id,
            click_id,
            user_id,
            offer_partner_id,
            gross_payout_cents,
            user_reward_cents,
            currency,
            reward_allowed,
            partner:offer_partners(slug)
        `)
        .eq("click_id", input.clickId)
        .maybeSingle<ClickRow>();

    if (clickError) throw new ManualCreditError("click_lookup_failed");
    if (!click || !click.user_id || !click.offer_partner_id) throw new ManualCreditError("click_not_found");

    const partner = Array.isArray(click.partner) ? click.partner[0] : click.partner;
    if (partner?.slug !== "cpalead") throw new ManualCreditError("not_cpalead_click");
    if (!click.reward_allowed || Number(click.user_reward_cents ?? 0) <= 0) {
        throw new ManualCreditError("click_not_rewardable");
    }

    const { data: existingConversion, error: duplicateError } = await db
        .from("conversion_events")
        .select("id,status,click_id")
        .eq("offer_partner_id", click.offer_partner_id)
        .eq("external_transaction_id", externalReference)
        .maybeSingle<ExistingConversionRow>();

    if (duplicateError) throw new ManualCreditError("conversion_lookup_failed");
    if (existingConversion) throw new ManualCreditError("duplicate_external_reference");

    let beforeTicket: SupportTicketRow | null = null;
    if (input.supportTicketId) {
        const { data: ticket, error: ticketError } = await db
            .from("earn_reward_support_tickets")
            .select("id,user_id,status,admin_status,admin_notes,conversion_event_id")
            .eq("id", input.supportTicketId)
            .maybeSingle<SupportTicketRow>();

        if (ticketError) throw new ManualCreditError("support_ticket_lookup_failed");
        if (!ticket || ticket.user_id !== click.user_id) throw new ManualCreditError("support_ticket_mismatch");
        if (ticket.conversion_event_id) throw new ManualCreditError("support_ticket_already_credited");
        beforeTicket = ticket;
    }

    let result;
    try {
        result = await writeConversionAndLedger({
            db,
            clickId: click.click_id,
            externalTransactionId: externalReference,
            grossRevenueCents: Number(click.gross_payout_cents ?? 0),
            currency: click.currency || "USD",
            providerStatus: "manual_approved",
            internalStatus: "approved",
            providerConfigId: null,
            postbackReceiptId: null,
            sourceIp: null,
            rawPayload: {
                source: "manual_admin_credit",
                provider: "cpalead",
                external_reference: externalReference,
                support_ticket_id: input.supportTicketId ?? null,
                admin_reason: adminReason,
            },
            reviewReasons: ["manual_admin_credit", adminReason],
        });
    } catch (error) {
        if (error instanceof ConversionWriteError && error.code === "duplicate_external_transaction_id") {
            throw new ManualCreditError("duplicate_external_reference");
        }
        throw error;
    }

    const reviewReasons = ["manual_admin_credit", adminReason];
    const { data: afterConversion, error: conversionReviewUpdateError } = await db
        .from("conversion_events")
        .update({
            review_status: "reviewed",
            review_reasons: reviewReasons,
        })
        .eq("id", result.conversion.id)
        .select("id,status,user_reward_cents,review_status,review_reasons")
        .single();

    if (conversionReviewUpdateError || !afterConversion) {
        throw new ManualCreditError("conversion_review_update_failed");
    }

    let afterLedger: LedgerRow | null = null;
    const ledgerId = getLedgerId(result.ledger);
    if (ledgerId) {
        const { data: ledger, error: ledgerUpdateError } = await db
            .from("user_reward_ledger")
            .update({
                review_status: "reviewed",
                review_reasons: reviewReasons,
            })
            .eq("id", ledgerId)
            .select("id,status,review_status,review_reasons")
            .single<LedgerRow>();

        if (ledgerUpdateError || !ledger) throw new ManualCreditError("ledger_review_update_failed");
        afterLedger = ledger;
    }

    let afterTicket: SupportTicketRow | null = null;
    if (beforeTicket) {
        const notes = uniqueNotes(beforeTicket.admin_notes, `Manual credit: ${adminReason}`);
        const { data: ticket, error: ticketUpdateError } = await db
            .from("earn_reward_support_tickets")
            .update({
                conversion_event_id: result.conversion.id,
                status: "resolved",
                admin_status: "reviewed",
                admin_notes: notes,
            })
            .eq("id", beforeTicket.id)
            .select("id,user_id,status,admin_status,admin_notes,conversion_event_id")
            .single<SupportTicketRow>();

        if (ticketUpdateError || !ticket) throw new ManualCreditError("support_ticket_update_failed");
        afterTicket = ticket;
    }

    await writeEarnAdminAuditEvent(db, {
        adminUserId: input.adminUserId,
        targetUserId: click.user_id,
        targetType: "conversion_event",
        targetId: result.conversion.id,
        action: "conversion_event:manual_cpalead_credit",
        before: {
            click: {
                id: click.id,
                click_id: click.click_id,
                user_reward_cents: click.user_reward_cents,
                gross_payout_cents: click.gross_payout_cents,
            },
            support_ticket: beforeTicket,
        },
        after: {
            conversion: afterConversion,
            ledger: afterLedger ?? result.ledger,
            support_ticket: afterTicket,
            external_reference: externalReference,
        },
    });

    return {
        conversion: afterConversion,
        ledger: afterLedger ?? result.ledger,
        supportTicket: afterTicket,
    };
}

function normalizeReference(value: string) {
    return value.trim().slice(0, 200);
}

function normalizeReason(value: string) {
    return value.trim().slice(0, 200);
}

function isClickId(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
}

function uniqueNotes(existing: string[] | null | undefined, next: string) {
    const notes = [...(existing ?? [])].map((note) => note.trim()).filter(Boolean).slice(0, 24);
    if (next && !notes.includes(next)) notes.push(next);
    return notes.slice(-25);
}

function getLedgerId(ledger: unknown): string | null {
    if (!ledger || typeof ledger !== "object") return null;
    const value = (ledger as { id?: unknown }).id;
    return typeof value === "string" ? value : null;
}
