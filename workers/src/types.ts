// ---------------------------------------------------------------------------
// Shared types for the EarnGrind ingestion pipeline
// ---------------------------------------------------------------------------

/**
 * Raw offer as returned by a provider adapter (mock or real scraper).
 * Shape is provider-agnostic — normalization is handled separately.
 */
export interface RawOffer {
    /** Provider's own stable identifier for this offer */
    external_id: string;
    title: string;
    /** Raw payout string e.g. "$22.00", "£180", "4461 SB", "1650" (cents) */
    payout_raw: string;
    /** ISO currency code or platform-specific token: "USD","GBP","SB","FC" */
    currency: string;
    /** Platform-provided device string e.g. "Android", "iOS & Android", "PC" */
    device_raw: string;
    /** Platform-provided category string e.g. "Mobile Games", "Surveys" */
    category_raw: string;
    /** Direct offer URL or deep link — used as custom_param */
    url: string;
    /** ISO-8601 expiry date, or null if not provided */
    expires_raw: string | null;
    /**
     * Slug of the game this offer belongs to — set by adapter.
     * May be null; the normalizer will attempt fuzzy matching if absent.
     */
    game_slug: string | null;
    /**
     * ISO 3166-1 alpha-2 country codes this offer is available in.
     * Falls back to currency-based inference if absent.
     */
    countries_raw?: string[] | null;
    /**
     * Optional normalized game title when the provider title contains
     * milestone text and should not be used as the parent offer title.
     */
    game_title?: string | null;
    /** Optional provider / offerwall name attached to this offer. */
    provider_name?: string | null;
    /** Optional image URL for the parent offer. */
    image_url?: string | null;
    /** Optional aggregate payout across all tasks, if the provider exposes it. */
    total_payout_raw?: string | null;
    /** Optional computed best single milestone payout in USD. */
    best_payout_usd?: number | null;
    /** Child tasks or milestones tied to this parent offer. */
    task_list?: RawOfferTask[] | null;
}

export interface RawOfferTask {
    title: string;
    reward_amount_usd: number;
    reward_display?: string | null;
    task_type?: "install" | "milestone" | "purchase" | "signup" | "other";
    time_limit_text?: string | null;
    notes?: string | null;
    sort_order: number;
}

/**
 * Normalized offer ready for the Edge Function / DB upsert.
 * Matches the `offers` table schema exactly.
 */
export interface NormalizedOffer {
    platform_id: string;
    game_id: string | null;
    external_id: string;
    title: string;
    payout_usd: number;
    payout_type: "online_cashback" | "gift_card" | "points" | "crypto";
    devices: Array<"ios" | "android" | "pc" | "web">;
    countries: string[];
    category: string;
    /** Value for the /go redirect template */
    custom_param: string;
    offer_expires_at: string | null;
}

// ---------------------------------------------------------------------------
// Rejection / QA types
// ---------------------------------------------------------------------------

/** Reason codes — add new codes as new edge cases are discovered */
export type RejectionReason =
    | "UNKNOWN_PLATFORM"
    | "MISSING_EXTERNAL_ID"
    | "TITLE_TOO_SHORT"
    | "TITLE_TOO_LONG"
    | "URL_MISSING"
    | "PAYOUT_ZERO"
    | "PAYOUT_NEGATIVE"
    | "PAYOUT_EXCEEDS_CEILING"
    | "PAYOUT_PARSE_FAILED"
    | "DUPLICATE_IN_BATCH";

export interface RejectedOffer {
    external_id: string;
    title: string;
    reason: RejectionReason;
    detail?: string;
}

/**
 * Returned by normalizeOffers() — includes both successful and rejected offers
 * so the orchestrator can log and audit without losing context.
 */
export interface NormalizationReport {
    accepted: NormalizedOffer[];
    rejected: RejectedOffer[];
    /** Number of accepted offers without a resolved game_id */
    unmatched: number;
}

// ---------------------------------------------------------------------------
// Ingestion summary
// ---------------------------------------------------------------------------

/** Body sent to the Edge Function for one platform run */
export interface IngestPayload {
    platform_slug: string;
    offers: NormalizedOffer[];
    /** Total raw offers fetched from provider (before normalization) */
    fetched: number;
    /** Count of offers rejected during normalization */
    rejected: number;
    /** Count of accepted offers with no matched game_id */
    unmatched_game: number;
}

/** Summary returned by the Edge Function after an ingestion run */
export interface IngestionResult {
    platform_slug: string;
    inserted: number;
    updated: number;
    expired: number;
    errors: number;
    durationMs: number;
    /** DB UUID of the ingestion_runs row, if tracking is enabled */
    run_id?: string;
}
