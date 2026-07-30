import { NextResponse } from "next/server";
import { GEMSLOOT_HISTORICAL_OFFERS } from "@/lib/gemsloot-historical-offers";
import {
    providerGalleryErrorResponse,
    requireProviderGalleryEditor,
    runProviderGalleryAdminImport,
} from "@/lib/provider-gallery/admin-route";
import { getProviderGalleryConfig } from "@/lib/provider-gallery/provider-registry";
import { buildProviderGalleryQualityReport } from "@/lib/provider-gallery/quality";
import { getProviderGalleryServiceClient } from "@/lib/provider-gallery/upsert";

const GEMSLOOT_CONFIG = getProviderGalleryConfig("gemsloot");

export async function POST() {
    const auth = await requireProviderGalleryEditor();
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const result = await runProviderGalleryAdminImport({
            config: GEMSLOOT_CONFIG,
            offers: GEMSLOOT_HISTORICAL_OFFERS,
            loggerPrefix: "admin/gemsloot/historical-import",
            buildQuality: async () => buildProviderGalleryQualityReport(getProviderGalleryServiceClient(), {
                label: "Gemsloot",
                externalIdLike: "gemsloot-%",
            }),
        });

        return NextResponse.json({
            evidence: "historical-completion-export",
            liveVerified: false,
            stats: result.stats,
            quality: result.quality,
        });
    } catch (error) {
        console.error("[admin/gemsloot/historical-import] failed", {
            message: error instanceof Error ? error.message : String(error),
        });
        return providerGalleryErrorResponse(error);
    }
}
