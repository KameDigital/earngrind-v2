import "server-only";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { ok: false as const, status: 401, error: "Unauthorized" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || !["admin", "editor"].includes(String(profile.role))) {
        return { ok: false as const, status: 403, error: "Forbidden" };
    }

    return { ok: true as const };
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
