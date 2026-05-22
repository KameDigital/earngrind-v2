"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminOrEditor } from "@/lib/admin-auth";
import { createManualCpaleadCredit, ManualCreditError } from "@/lib/earn-manual-credit";
import { writeEarnAdminAuditEvent } from "@/lib/earn-admin-audit";
import { createAdminClient } from "@/lib/supabase/admin";

const TICKET_STATUSES = new Set(["open", "waiting_on_user", "under_review", "resolved", "rejected", "closed"]);
const ADMIN_STATUSES = new Set(["unreviewed", "reviewed", "escalated"]);

function isUuid(value: unknown): value is string {
    return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function parseAdminNote(value: FormDataEntryValue | null) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, 500) : null;
}

function parseRequiredText(value: FormDataEntryValue | null, maxLength: number) {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
}

function uniqueNotes(existing: string[] | null | undefined, next: string | null) {
    const notes = [...(existing ?? [])].map((note) => note.trim()).filter(Boolean).slice(0, 24);
    if (!next) return notes;
    if (!notes.includes(next)) notes.push(next);
    return notes.slice(-25);
}

export async function updateRewardSupportTicketAction(formData: FormData) {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) {
        redirect(auth.status === 401 ? "/login" : "/app/dashboard");
    }

    const ticketId = String(formData.get("ticket_id") ?? "");
    const status = String(formData.get("status") ?? "");
    const adminStatus = String(formData.get("admin_status") ?? "");
    const adminNote = parseAdminNote(formData.get("admin_note"));

    if (!isUuid(ticketId)) {
        redirect("/app/admin/reward-support?error=invalid_ticket");
    }
    if (!TICKET_STATUSES.has(status)) {
        redirect("/app/admin/reward-support?error=invalid_status");
    }
    if (!ADMIN_STATUSES.has(adminStatus)) {
        redirect("/app/admin/reward-support?error=invalid_admin_status");
    }

    const db = createAdminClient();
    const { data: before, error: beforeError } = await db
        .from("earn_reward_support_tickets")
        .select("id,user_id,status,admin_status,admin_notes")
        .eq("id", ticketId)
        .maybeSingle();

    if (beforeError || !before) {
        redirect("/app/admin/reward-support?error=not_found");
    }

    const { data: after, error: updateError } = await db
        .from("earn_reward_support_tickets")
        .update({
            status,
            admin_status: adminStatus,
            admin_notes: uniqueNotes(before.admin_notes, adminNote),
        })
        .eq("id", ticketId)
        .select("id,user_id,status,admin_status,admin_notes")
        .single();

    if (updateError || !after) {
        redirect("/app/admin/reward-support?error=update_failed");
    }

    await writeEarnAdminAuditEvent(db, {
        adminUserId: auth.userId,
        targetUserId: before.user_id,
        targetType: "earn_reward_support_ticket",
        targetId: ticketId,
        action: "earn_reward_support_ticket:update_review",
        before,
        after,
    });

    revalidatePath("/app/admin/reward-support");
    revalidatePath("/earn/support");
    redirect("/app/admin/reward-support?updated=ticket");
}

export async function createManualCpaleadCreditAction(formData: FormData) {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) {
        redirect(auth.status === 401 ? "/login" : "/app/dashboard");
    }

    const clickId = parseRequiredText(formData.get("click_id"), 80);
    const externalReference = parseRequiredText(formData.get("external_reference"), 200);
    const adminReason = parseRequiredText(formData.get("admin_reason"), 200);
    const supportTicketId = parseRequiredText(formData.get("support_ticket_id"), 80) || null;

    if (!clickId || !externalReference || !adminReason) {
        redirect("/app/admin/reward-support?error=manual_credit_missing");
    }

    const db = createAdminClient();

    try {
        await createManualCpaleadCredit({
            db,
            adminUserId: auth.userId,
            clickId,
            externalReference,
            adminReason,
            supportTicketId,
        });
    } catch (error) {
        if (error instanceof ManualCreditError) {
            redirect(`/app/admin/reward-support?error=${encodeURIComponent(error.code)}`);
        }

        console.error("[admin/reward-support] manual CPAlead credit failed", {
            message: error instanceof Error ? error.message : "unknown",
        });
        redirect("/app/admin/reward-support?error=manual_credit_failed");
    }

    revalidatePath("/app/admin/reward-support");
    revalidatePath("/app/admin/conversions");
    revalidatePath("/app/admin/rewards");
    revalidatePath("/earn/support");
    revalidatePath("/earn/wallet");
    redirect("/app/admin/reward-support?updated=manual_credit");
}
