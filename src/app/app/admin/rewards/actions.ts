"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminOrEditor } from "@/lib/admin-auth";
import { writeEarnAdminAuditEvent } from "@/lib/earn-admin-audit";
import { createAdminClient } from "@/lib/supabase/admin";

const LEDGER_REVIEW_STATUSES = new Set(["clean", "flagged", "ignored", "reviewed"]);

function parseReviewReasons(value: FormDataEntryValue | null) {
    if (typeof value !== "string") {
        return [];
    }

    return value
        .split(/[\n,]/)
        .map((reason) => reason.trim())
        .filter(Boolean)
        .slice(0, 20)
        .map((reason) => reason.slice(0, 200));
}

function parseAdminReason(value: FormDataEntryValue | null, fallback: string) {
    const reason = typeof value === "string" ? value.trim().slice(0, 200) : "";
    return reason || fallback;
}

function isUuid(value: unknown): value is string {
    return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function uniqueReasons(...groups: Array<string[] | null | undefined>) {
    const seen = new Set<string>();
    const reasons: string[] = [];
    for (const group of groups) {
        for (const reason of group ?? []) {
            const normalized = reason.trim().slice(0, 200);
            if (!normalized || seen.has(normalized)) continue;
            seen.add(normalized);
            reasons.push(normalized);
            if (reasons.length >= 20) return reasons;
        }
    }

    return reasons;
}

export async function updateLedgerReviewAction(formData: FormData) {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) {
        redirect("/app/dashboard");
    }

    const ledgerId = String(formData.get("ledger_id") ?? "");
    const reviewStatus = String(formData.get("review_status") ?? "");
    const reviewReasons = parseReviewReasons(formData.get("review_reasons"));

    if (!isUuid(ledgerId)) {
        redirect("/app/admin/rewards?error=invalid_ledger");
    }
    if (!LEDGER_REVIEW_STATUSES.has(reviewStatus)) {
        redirect("/app/admin/rewards?error=invalid_review_status");
    }

    const db = createAdminClient();
    const { data: before, error: beforeError } = await db
        .from("user_reward_ledger")
        .select("id,user_id,status,review_status,review_reasons")
        .eq("id", ledgerId)
        .maybeSingle();

    if (beforeError || !before) {
        redirect("/app/admin/rewards?error=not_found");
    }

    const { data: after, error: updateError } = await db
        .from("user_reward_ledger")
        .update({
            review_status: reviewStatus,
            review_reasons: reviewReasons,
        })
        .eq("id", ledgerId)
        .select("id,user_id,status,review_status,review_reasons")
        .single();

    if (updateError || !after) {
        redirect("/app/admin/rewards?error=update_failed");
    }

    await writeEarnAdminAuditEvent(db, {
        adminUserId: auth.userId,
        targetUserId: before.user_id,
        targetType: "user_reward_ledger",
        targetId: ledgerId,
        action: "user_reward_ledger:update_review_metadata",
        before,
        after,
    });

    revalidatePath("/app/admin/rewards");
    revalidatePath("/earn/wallet");
    redirect("/app/admin/rewards?updated=ledger");
}

export async function reverseLedgerRewardAction(formData: FormData) {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) {
        redirect("/app/dashboard");
    }

    const ledgerId = String(formData.get("ledger_id") ?? "");
    const adminReason = parseAdminReason(formData.get("admin_reason"), "admin_reversed_unpaid_reward");

    if (!isUuid(ledgerId)) {
        redirect("/app/admin/rewards?error=invalid_ledger");
    }

    const db = createAdminClient();
    const { data: beforeLedger, error: beforeError } = await db
        .from("user_reward_ledger")
        .select("id,user_id,status,review_status,review_reasons,conversion_event_id,paid_at")
        .eq("id", ledgerId)
        .maybeSingle();

    if (beforeError || !beforeLedger) {
        redirect("/app/admin/rewards?error=not_found");
    }

    if (beforeLedger.status === "paid" || beforeLedger.paid_at) {
        redirect("/app/admin/rewards?error=paid_reward");
    }

    const { data: beforeConversion, error: conversionLookupError } = await db
        .from("conversion_events")
        .select("id,user_id,status,review_status,review_reasons")
        .eq("id", beforeLedger.conversion_event_id)
        .maybeSingle();

    if (conversionLookupError) {
        redirect("/app/admin/rewards?error=conversion_lookup_failed");
    }

    const nowIso = new Date().toISOString();
    const ledgerReasons = uniqueReasons(beforeLedger.review_reasons, [adminReason]);
    const { data: afterLedger, error: ledgerUpdateError } = await db
        .from("user_reward_ledger")
        .update({
            status: "reversed",
            review_status: "reviewed",
            review_reasons: ledgerReasons,
            available_at: null,
            reversed_at: nowIso,
            updated_at: nowIso,
        })
        .eq("id", ledgerId)
        .select("id,user_id,status,review_status,review_reasons,conversion_event_id,paid_at,reversed_at")
        .single();

    if (ledgerUpdateError || !afterLedger) {
        redirect("/app/admin/rewards?error=reverse_failed");
    }

    let afterConversion = null;
    if (beforeConversion) {
        const conversionReasons = uniqueReasons(beforeConversion.review_reasons, [adminReason]);
        const { data: conversionResult, error: conversionUpdateError } = await db
            .from("conversion_events")
            .update({
                status: "reversed",
                review_status: "reviewed",
                review_reasons: conversionReasons,
                updated_at: nowIso,
            })
            .eq("id", beforeConversion.id)
            .select("id,user_id,status,review_status,review_reasons")
            .single();

        if (conversionUpdateError || !conversionResult) {
            redirect("/app/admin/rewards?error=conversion_update_failed");
        }

        afterConversion = conversionResult;
    }

    await writeEarnAdminAuditEvent(db, {
        adminUserId: auth.userId,
        targetUserId: beforeLedger.user_id,
        targetType: "user_reward_ledger",
        targetId: ledgerId,
        action: "user_reward_ledger:reverse_unpaid_reward",
        before: {
            ledger: beforeLedger,
            conversion: beforeConversion ?? null,
        },
        after: {
            ledger: afterLedger,
            conversion: afterConversion,
        },
    });

    revalidatePath("/app/admin/rewards");
    revalidatePath("/app/admin/conversions");
    revalidatePath("/earn/wallet");
    redirect("/app/admin/rewards?updated=reversed");
}
