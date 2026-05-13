import "server-only";

import { NextResponse } from "next/server";
import { requireAdminOrEditor } from "@/lib/admin-auth";
import {
    getProviderGalleryServiceClient,
    importProviderGalleryOffers,
} from "./upsert";
import type {
    NormalizedProviderGalleryOffer,
    ProviderGalleryConfig,
    ProviderGalleryImportResult,
    ProviderGalleryQualityReport,
} from "./types";

export async function requireProviderGalleryEditor() {
    return requireAdminOrEditor();
}

export async function runProviderGalleryAdminImport({
    config,
    offers,
    loggerPrefix,
    buildQuality,
}: {
    config: ProviderGalleryConfig;
    offers: NormalizedProviderGalleryOffer[];
    loggerPrefix: string;
    buildQuality?: () => Promise<ProviderGalleryQualityReport | Record<string, unknown>>;
}): Promise<ProviderGalleryImportResult & { quality?: ProviderGalleryQualityReport | Record<string, unknown> }> {
    const db = getProviderGalleryServiceClient();
    const result = await importProviderGalleryOffers({ db, config, offers, loggerPrefix });
    const quality = buildQuality ? await buildQuality() : undefined;
    return quality ? { ...result, quality } : result;
}

export function providerGalleryErrorResponse(error: unknown, fallback = "Import failed") {
    const message = error instanceof Error ? error.message : String(error);
    const status = /missing|required|invalid|unauthorized|401/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: status === 400 ? message : fallback }, { status });
}
