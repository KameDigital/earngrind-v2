"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { writeEarnAdminAuditEvent } from "@/lib/earn-admin-audit";
import { requireAdminOrEditor } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const REWARD_STATUSES = new Set(["active", "limited", "suspended", "banned"]);
const REVIEW_STATUSES = new Set(["clean", "flagged", "under_review", "cleared"]);

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

export async function updateEarnUserProfileAdminAction(formData: FormData) {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) {
        redirect("/app/dashboard");
    }

    const userId = formData.get("user_id");
    const rewardStatus = String(formData.get("reward_status") ?? "");
    const reviewStatus = String(formData.get("review_status") ?? "");
    const reviewReasons = parseReviewReasons(formData.get("review_reasons"));

    if (!isUuid(userId) || !REWARD_STATUSES.has(rewardStatus) || !REVIEW_STATUSES.has(reviewStatus)) {
        redirect("/app/admin/earn-users?error=invalid");
    }

    const db = createAdminClient();
    const { data: before, error: beforeError } = await db
        .from("earn_user_profiles")
        .select("user_id,reward_status,review_status,review_reasons")
        .eq("user_id", userId)
        .maybeSingle();

    if (beforeError || !before) {
        redirect("/app/admin/earn-users?error=not_found");
    }

    const updatePayload = {
        reward_status: rewardStatus,
        review_status: reviewStatus,
        review_reasons: reviewReasons,
    };

    const { data: after, error: updateError } = await db
        .from("earn_user_profiles")
        .update(updatePayload)
        .eq("user_id", userId)
        .select("user_id,reward_status,review_status,review_reasons")
        .single();

    if (updateError || !after) {
        redirect("/app/admin/earn-users?error=update_failed");
    }

    await writeEarnAdminAuditEvent(db, {
        adminUserId: auth.userId,
        targetUserId: userId,
        targetType: "earn_user_profile",
        targetId: userId,
        action: "earn_user_profile:update_review_controls",
        before,
        after,
    });

    revalidatePath("/app/admin/earn-users");
    revalidatePath("/earn/wallet");
    revalidatePath("/earn/walls/cpalead");
    redirect("/app/admin/earn-users?updated=profile");
}
