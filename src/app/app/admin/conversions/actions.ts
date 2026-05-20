"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { writeEarnAdminAuditEvent } from "@/lib/earn-admin-audit";
import { requireAdminOrEditor } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const CONVERSION_REVIEW_STATUSES = new Set(["clean", "flagged", "ignored", "reviewed"]);

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

export async function updateConversionReviewAction(formData: FormData) {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) {
        redirect("/app/dashboard");
    }

    const conversionId = formData.get("conversion_id");
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
