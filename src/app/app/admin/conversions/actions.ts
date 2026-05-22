"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { writeEarnAdminAuditEvent } from "@/lib/earn-admin-audit";
import { requireAdminOrEditor } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const CONVERSION_REVIEW_STATUSES = new Set(["clean", "flagged", "ignored", "reviewed"]);
const CONVERSION_MANUAL_STATUSES = new Set(["rejected", "reversed"]);

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

function isUuid(value: unknown): value is string {
    return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function parseAdminReason(value: FormDataEntryValue | null, fallback: string) {
    const reason = typeof value === "string" ? value.trim().slice(0, 200) : "";
    return reason || fallback;
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

export async function updateConversionReviewAction(formData: FormData) {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) {
        redirect("/app/dashboard");
    }

    const conversionId = String(formData.get("conversion_id") ?? "");
    const reviewStatus = String(formData.get("review_status") ?? "");
    const reviewReasons = parseReviewReasons(formData.get("review_reasons"));

    if (!isUuid(conversionId) || !CONVERSION_REVIEW_STATUSES.has(reviewStatus)) {
        redirect("/app/admin/conversions?error=invalid");
    }

    const db = createAdminClient();
    const { data: before, error: beforeError } = await db
        .from("conversion_events")
        .select("id,user_id,status,review_status,review_reasons")
        .eq("id", conversionId)
        .maybeSingle();

    if (beforeError || !before) {
        redirect("/app/admin/conversions?error=not_found");
    }

    const updatePayload = {
        review_status: reviewStatus,
        review_reasons: reviewReasons,
    };

    const { data: after, error: updateError } = await db
        .from("conversion_events")
        .update(updatePayload)
        .eq("id", conversionId)
        .select("id,user_id,status,review_status,review_reasons")
        .single();

    if (updateError || !after) {
        redirect("/app/admin/conversions?error=update_failed");
    }

    await writeEarnAdminAuditEvent(db, {
        adminUserId: auth.userId,
        targetUserId: before.user_id,
        targetType: "conversion_event",
        targetId: conversionId,
        action: "conversion_event:update_review_metadata",
        before,
        after,
    });

    revalidatePath("/app/admin/conversions");
    revalidatePath("/app/admin/rewards");
    redirect("/app/admin/conversions?updated=conversion");
}

export async function updateConversionLifecycleAction(formData: FormData) {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) {
        redirect("/app/dashboard");
    }

    const conversionId = String(formData.get("conversion_id") ?? "");
    const nextStatus = String(formData.get("next_status") ?? "");
    const adminReason = parseAdminReason(formData.get("admin_reason"), `admin_${nextStatus}`);

    if (!isUuid(conversionId) || !CONVERSION_MANUAL_STATUSES.has(nextStatus)) {
        redirect("/app/admin/conversions?error=invalid");
    }

    const db = createAdminClient();
    const { data: beforeConversion, error: beforeConversionError } = await db
        .from("conversion_events")
        .select("id,user_id,status,review_status,review_reasons")
        .eq("id", conversionId)
        .maybeSingle();

    if (beforeConversionError || !beforeConversion) {
        redirect("/app/admin/conversions?error=not_found");
    }

    const { data: beforeLedger, error: beforeLedgerError } = await db
        .from("user_reward_ledger")
        .select("id,user_id,status,review_status,review_reasons,paid_at")
        .eq("conversion_event_id", conversionId)
        .maybeSingle();

    if (beforeLedgerError) {
        redirect("/app/admin/conversions?error=ledger_lookup_failed");
    }

    if (beforeLedger?.status === "paid" || beforeLedger?.paid_at) {
        redirect("/app/admin/conversions?error=paid_reward");
    }

    const reviewReasons = uniqueReasons(beforeConversion.review_reasons, [adminReason]);
    const nowIso = new Date().toISOString();
    const conversionUpdate = {
        status: nextStatus,
        review_status: "reviewed",
        review_reasons: reviewReasons,
        updated_at: nowIso,
    };

    const { data: afterConversion, error: conversionUpdateError } = await db
        .from("conversion_events")
        .update(conversionUpdate)
        .eq("id", conversionId)
        .select("id,user_id,status,review_status,review_reasons")
        .single();

    if (conversionUpdateError || !afterConversion) {
        redirect("/app/admin/conversions?error=update_failed");
    }

    let afterLedger = null;
    if (beforeLedger) {
        const ledgerReasons = uniqueReasons(beforeLedger.review_reasons, [adminReason]);
        const ledgerUpdate = {
            status: nextStatus,
            review_status: "reviewed",
            review_reasons: ledgerReasons,
            available_at: null,
            reversed_at: nextStatus === "reversed" ? nowIso : null,
            updated_at: nowIso,
        };

        const { data: ledgerResult, error: ledgerUpdateError } = await db
            .from("user_reward_ledger")
            .update(ledgerUpdate)
            .eq("id", beforeLedger.id)
            .select("id,user_id,status,review_status,review_reasons,paid_at,reversed_at")
            .single();

        if (ledgerUpdateError || !ledgerResult) {
            redirect("/app/admin/conversions?error=ledger_update_failed");
        }

        afterLedger = ledgerResult;
    }

    await writeEarnAdminAuditEvent(db, {
        adminUserId: auth.userId,
        targetUserId: beforeConversion.user_id,
        targetType: "conversion_event",
        targetId: conversionId,
        action: `conversion_event:${nextStatus}`,
        before: {
            conversion: beforeConversion,
            ledger: beforeLedger ?? null,
        },
        after: {
            conversion: afterConversion,
            ledger: afterLedger,
        },
    });

    revalidatePath("/app/admin/conversions");
    revalidatePath("/app/admin/rewards");
    revalidatePath("/earn/wallet");
    redirect(`/app/admin/conversions?updated=${nextStatus}`);
}
