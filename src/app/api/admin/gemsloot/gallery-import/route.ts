import {
    GemslootGalleryOffer,
    getGemslootGalleryOffers,
    normalizeGemslootCountryCode,
    normalizeGemslootProvider,
} from "@/lib/gemsloot-gallery";
import {
    providerGalleryErrorResponse,
    requireProviderGalleryEditor,
    runProviderGalleryAdminImport,
} from "@/lib/provider-gallery/admin-route";
import { getProviderGalleryConfig } from "@/lib/provider-gallery/provider-registry";
import { buildProviderGalleryQualityReport } from "@/lib/provider-gallery/quality";
import { getProviderGalleryServiceClient } from "@/lib/provider-gallery/upsert";
import type { NormalizedProviderGalleryOffer } from "@/lib/provider-gallery/types";
import { NextRequest, NextResponse } from "next/server";

const GEMSLOOT_CONFIG = getProviderGalleryConfig("gemsloot");

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

    const country = normalizeGemslootCountryCode(typeof body.country === "string" ? body.country : "US");
    if (!country) {
        return NextResponse.json({ error: "country must be a two-letter country code such as US or GB" }, { status: 400 });
    }

    const provider = normalizeGemslootProvider(typeof body.provider === "string" ? body.provider : null);
    const device = typeof body.device === "string" ? body.device : null;
    const search = typeof body.search === "string" ? body.search : null;
    const sort = body.sort === "completed" ? "completed" : "epc";
    const limit = Math.min(GEMSLOOT_CONFIG.maxImportLimit, Math.max(1, Number(body.limit ?? 120) || 120));
    const refresh = body.refresh !== false;

    try {
        const gallery = await getGemslootGalleryOffers({
            country,
            provider,
            device,
            search,
            sort,
            limit,
            refresh,
        });
        const result = await runProviderGalleryAdminImport({
            config: GEMSLOOT_CONFIG,
            offers: gallery.offers.map(toNormalizedGemslootOffer),
            loggerPrefix: "admin/gemsloot/gallery-import",
            buildQuality: async () => buildProviderGalleryQualityReport(getProviderGalleryServiceClient(), {
                label: "Gemsloot",
                externalIdLike: "gemsloot-%",
            }),
        });

        return NextResponse.json({
            countryCode: gallery.countryCode,
            provider: gallery.provider,
            providers: gallery.providers,
            stats: result.stats,
            quality: result.quality,
        });
    } catch (error) {
        console.error("[admin/gemsloot/gallery-import] failed", {
            country,
            provider,
            message: error instanceof Error ? error.message : String(error),
        });
        return providerGalleryErrorResponse(error);
    }
}

function toNormalizedGemslootOffer(offer: GemslootGalleryOffer): NormalizedProviderGalleryOffer {
    return {
        sourceProviderSlug: offer.providerName,
        sourcePlatformSlug: "gemsloot",
        providerDisplayName: offer.providerName,
        sourceOfferId: offer.id,
        countryCode: offer.countryCode,
        title: offer.title,
        advertiserGameName: offer.advertiserName ?? offer.title,
        slug: offer.slug,
        category: offer.category,
        payoutUsd: offer.payout,
        totalPayoutUsd: offer.totalPayout,
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
