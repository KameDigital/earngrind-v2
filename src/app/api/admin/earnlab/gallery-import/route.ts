import {
    EarnLabGalleryTask,
    getEarnLabGalleryTasksByCountry,
    normalizeEarnLabCountryCode,
} from "@/lib/earnlab-gallery";
import {
    providerGalleryErrorResponse,
    requireProviderGalleryEditor,
    runProviderGalleryAdminImport,
} from "@/lib/provider-gallery/admin-route";
import { getProviderGalleryConfig } from "@/lib/provider-gallery/provider-registry";
import type { NormalizedProviderGalleryOffer } from "@/lib/provider-gallery/types";
import { NextRequest, NextResponse } from "next/server";

const EARNLAB_CONFIG = getProviderGalleryConfig("earnlab");

export async function POST(req: NextRequest) {
    const auth = await requireProviderGalleryEditor();
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const country = normalizeEarnLabCountryCode(typeof body.country === "string" ? body.country : null);
    if (!country) {
        return NextResponse.json({ error: "country must be a two-letter country code such as US, GB, CA, or AU" }, { status: 400 });
    }

    const limit = Math.min(EARNLAB_CONFIG.maxImportLimit, Math.max(1, Number(body.limit ?? 50) || 50));
    const refresh = body.refresh !== false;

    try {
        const gallery = await getEarnLabGalleryTasksByCountry(country, {
            limit,
            refresh,
            sort: typeof body.sort === "string" ? body.sort : EARNLAB_CONFIG.defaultSort,
        });
        const result = await runProviderGalleryAdminImport({
            config: EARNLAB_CONFIG,
            offers: gallery.offers.map(toNormalizedEarnLabOffer),
            loggerPrefix: "admin/earnlab/gallery-import",
        });

        return NextResponse.json({
            countryCode: gallery.countryCode,
            countryName: gallery.countryName,
            stats: result.stats,
        });
    } catch (error) {
        console.error("[admin/earnlab/gallery-import] failed", {
            country,
            message: error instanceof Error ? error.message : String(error),
        });
        return providerGalleryErrorResponse(error);
    }
}

function toNormalizedEarnLabOffer(offer: EarnLabGalleryTask): NormalizedProviderGalleryOffer {
    return {
        sourceProviderSlug: "earnlab",
        sourcePlatformSlug: "earnlab",
        providerDisplayName: offer.providerName,
        sourceOfferId: offer.id,
        countryCode: offer.countryCode,
        title: offer.title,
        advertiserGameName: offer.advertiserName ?? offer.title,
        slug: offer.slug,
        category: offer.category,
        payoutUsd: offer.payout,
        totalPayoutUsd: offer.payout,
        imageUrl: offer.imageUrl,
        description: offer.description,
        shortDescription: offer.shortDescription,
        requirements: offer.requirements,
        tasks: offer.tasks,
        devices: offer.platform,
        countries: [offer.countryCode],
        trackingUrl: offer.trackingUrl,
        offerUrl: null,
        rawMetadata: offer.rawSourceMetadata,
    };
}
