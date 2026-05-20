import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type EarnRewardStatus = "active" | "limited" | "suspended" | "banned";
export type EarnReviewStatus = "clean" | "flagged" | "under_review" | "cleared";

export type EarnUserProfile = {
    user_id: string;
    display_name: string | null;
    country: string | null;
    timezone: string | null;
    reward_currency: string;
    reward_status: EarnRewardStatus;
    review_status: EarnReviewStatus;
    review_reasons: string[];
    accepted_rewards_terms_at: string | null;
    last_reward_activity_at: string | null;
    created_at: string;
    updated_at: string;
};

export class EarnUserProfileAccessError extends Error {
    code: "limited" | "suspended" | "banned";
    profile: EarnUserProfile;

    constructor(profile: EarnUserProfile) {
        super(`earn_profile_${profile.reward_status}`);
        this.code = profile.reward_status as "limited" | "suspended" | "banned";
        this.profile = profile;
    }
}

const PROFILE_COLUMNS = `
    user_id,
    display_name,
    country,
    timezone,
    reward_currency,
    reward_status,
    review_status,
    review_reasons,
    accepted_rewards_terms_at,
    last_reward_activity_at,
    created_at,
    updated_at
`;

export async function getEarnUserProfile(userId: string): Promise<EarnUserProfile | null> {
    const db = createAdminClient();
    const { data, error } = await db
        .from("earn_user_profiles")
        .select(PROFILE_COLUMNS)
        .eq("user_id", userId)
        .maybeSingle<EarnUserProfile>();

    if (error) {
        console.error("[earn-user-profile] profile lookup failed", {
            userId,
            message: error.message,
        });
        throw new Error("earn_user_profile_lookup_failed");
    }

    return data ?? null;
}

export async function getOrCreateEarnUserProfile(userId: string): Promise<EarnUserProfile> {
    const db = createAdminClient();
    const { data, error } = await db
        .from("earn_user_profiles")
        .upsert(
            {
                user_id: userId,
            },
            { onConflict: "user_id" },
        )
        .select(PROFILE_COLUMNS)
        .single<EarnUserProfile>();

    if (error) {
        console.error("[earn-user-profile] profile upsert failed", {
            userId,
            message: error.message,
        });
        throw new Error("earn_user_profile_upsert_failed");
    }

    return data;
}

export async function requireActiveEarnUserProfile(userId: string): Promise<EarnUserProfile> {
    const profile = await getOrCreateEarnUserProfile(userId);
    if (profile.reward_status !== "active") {
        throw new EarnUserProfileAccessError(profile);
    }

    return profile;
}

export async function acceptRewardsTerms(userId: string): Promise<EarnUserProfile> {
    const existingProfile = await getOrCreateEarnUserProfile(userId);
    if (existingProfile.accepted_rewards_terms_at) return existingProfile;

    const db = createAdminClient();
    const { data, error } = await db
        .from("earn_user_profiles")
        .update({
            accepted_rewards_terms_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select(PROFILE_COLUMNS)
        .single<EarnUserProfile>();

    if (error) {
        console.error("[earn-user-profile] terms acceptance failed", {
            userId,
            message: error.message,
        });
        throw new Error("earn_user_profile_terms_acceptance_failed");
    }

    return data;
}

export async function markRewardActivity(userId: string): Promise<void> {
    const db = createAdminClient();
    const { error } = await db
        .from("earn_user_profiles")
        .upsert(
            {
                user_id: userId,
                last_reward_activity_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
        );

    if (error) {
        console.error("[earn-user-profile] activity update failed", {
            userId,
            message: error.message,
        });
        throw new Error("earn_user_profile_activity_update_failed");
    }
}
