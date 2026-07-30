import type { SupabaseClient } from "@supabase/supabase-js";

export type ProviderGalleryDbClient = SupabaseClient<any, "public", any>;

export type ProviderGalleryPlatformKind = "gpt_site" | "offerwall" | "app" | "other";

export type ProviderGalleryTaskType = "install" | "milestone" | "purchase" | "signup" | "survey" | "other";

export type ProviderGalleryDbTaskType = "install" | "milestone" | "purchase" | "signup" | "other";

export type ProviderGalleryImportStats = {
    fetched: number;
    imported: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
};

export type ProviderGalleryTask = {
    title: string;
    rewardAmount: number;
    rewardDisplay?: string | null;
    taskType?: ProviderGalleryTaskType | string | null;
    timeLimitText?: string | null;
    notes?: string | null;
    sortOrder?: number | null;
};

export type NormalizedProviderGalleryOffer = {
    sourceProviderSlug: string;
    sourcePlatformSlug: string;
    providerDisplayName: string;
    sourceOfferId: string;
    countryCode: string;
    title: string;
    advertiserGameName?: string | null;
    slug?: string | null;
    category?: string | null;
    payoutUsd: number;
    totalPayoutUsd?: number | null;
    completionCount?: number | null;
    imageUrl?: string | null;
    description?: string | null;
    shortDescription?: string | null;
    requirements?: string[];
    tasks?: ProviderGalleryTask[];
    devices?: string[];
    countries?: string[];
    trackingUrl?: string | null;
    offerUrl?: string | null;
    isHistorical?: boolean;
    rawMetadata?: Record<string, unknown>;
};

export type ProviderGalleryExternalIdStrategy = "source-country" | "provider-source-country" | "platform-provider-source-country";

export type ProviderGalleryConfig = {
    key: string;
    platformSlug: string;
    platformName: string;
    platformKind: ProviderGalleryPlatformKind;
    affiliateTemplate: string;
    supportedCountries?: string[];
    maxImportLimit: number;
    defaultSort?: string;
    hasDirectOfferDeeplinks: boolean;
    preserveExistingOfferUrlOnMissingDeeplink: boolean;
    externalIdStrategy: ProviderGalleryExternalIdStrategy | ((offer: NormalizedProviderGalleryOffer) => string);
    genericFallbackUrl?: string;
};

export type ProviderGalleryImportResult = {
    stats: ProviderGalleryImportStats;
    offerResults: Array<{
        sourceOfferId: string;
        externalId: string;
        result: "created" | "updated" | "skipped" | "failed";
        error?: string;
    }>;
};

export type ProviderGalleryQualityReport = {
    label: string;
    totalRows: number;
    byProvider: Record<string, number>;
    byCountry: Record<string, number>;
    byStatus: Record<string, number>;
    missingImages: number;
    zeroOrLowPayouts: number;
    missingTasks: number;
    duplicateExternalIds: number;
    brokenGameSlugs: number;
};
