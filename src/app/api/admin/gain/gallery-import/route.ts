import {
    GainGalleryOffer,
    GainGalleryWall,
    getGainGalleryOffers,
    normalizeGainCountryCode,
    normalizeGainWall,
} from "@/lib/gain-gallery";
import {
    providerGalleryErrorResponse,
    requireProviderGalleryEditor,
    runProviderGalleryAdminImport,
} from "@/lib/provider-gallery/admin-route";
import { buildGainOfferDeepLink } from "@/lib/gain-deeplinks";
import { getProviderGalleryConfig } from "@/lib/provider-gallery/provider-registry";
import { buildProviderGalleryQualityReport } from "@/lib/provider-gallery/quality";
import { getProviderGalleryServiceClient } from "@/lib/provider-gallery/upsert";
import type { NormalizedProviderGalleryOffer, ProviderGalleryImportStats } from "@/lib/provider-gallery/types";
import { NextRequest, NextResponse } from "next/server";

type WallImportResult = {
    wall: GainGalleryWall;
    countryCode: string;
    stats: ProviderGalleryImportStats;
};

const PROVEN_BATCH_WALLS: Array<{ wall: GainGalleryWall; limit: number }> = [
    { wall: "native", limit: 300 },
    { wall: "revu", limit: 300 },
    { wall: "adtowall", limit: 300 },
    { wall: "asmwall", limit: 300 },
    { wall: "lootably", limit: 300 },
    { wall: "cpx", limit: 50 },
];

const GAIN_CONFIG = getProviderGalleryConfig("gain-gg");

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

    const isBatch = body.batch === true;
    const wall = normalizeGainWall(typeof body.wall === "string" ? body.wall : "native");
    if (!wall) {
        return NextResponse.json({ error: "wall must be a supported Gain wall source" }, { status: 400 });
    }

    const country = normalizeGainCountryCode(typeof body.country === "string" ? body.country : "US");
    if (!country) {
        return NextResponse.json({ error: "country must be a two-letter country code such as US or GB" }, { status: 400 });
    }

    const limit = Math.min(GAIN_CONFIG.maxImportLimit, Math.max(1, Number(body.limit ?? 100) || 100));
    const refresh = body.refresh !== false;

    try {
        if (isBatch) {
            const results: WallImportResult[] = [];
            for (const item of PROVEN_BATCH_WALLS) {
                results.push(await importGainWall(item.wall, country, item.limit, refresh));
            }

            return NextResponse.json({
                countryCode: country,
                batch: true,
                results,
                totals: sumStats(results.map((result) => result.stats)),
                quality: await buildGainQualityReport(),
            });
        }

        const result = await importGainWall(wall, country, limit, refresh);
        return NextResponse.json({
            ...result,
            quality: await buildGainQualityReport(),
        });
    } catch (error) {
        console.error("[admin/gain/gallery-import] failed", {
            wall,
            country,
            message: error instanceof Error ? error.message : String(error),
        });
        return providerGalleryErrorResponse(error);
    }
}

async function importGainWall(
    wall: GainGalleryWall,
    country: string,
    limit: number,
    refresh: boolean,
): Promise<WallImportResult> {
    const gallery = await getGainGalleryOffers(wall, { country, limit, refresh });
    const result = await runProviderGalleryAdminImport({
        config: GAIN_CONFIG,
        offers: gallery.offers.map(toNormalizedGainOffer),
        loggerPrefix: "admin/gain/gallery-import",
    });

    return {
        wall: gallery.wall,
        countryCode: gallery.countryCode,
        stats: result.stats,
    };
}

function toNormalizedGainOffer(offer: GainGalleryOffer): NormalizedProviderGalleryOffer {
    const directOfferUrl = offer.wall === "native" ? buildGainOfferDeepLink(offer.id) : null;

    return {
        sourceProviderSlug: offer.providerName,
        sourcePlatformSlug: "gain-gg",
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
        trackingUrl: directOfferUrl ? null : offer.trackingUrl,
        offerUrl: directOfferUrl,
        rawMetadata: offer.rawSourceMetadata,
    };
}

function sumStats(items: ProviderGalleryImportStats[]): ProviderGalleryImportStats {
    return items.reduce<ProviderGalleryImportStats>((total, item) => ({
        fetched: total.fetched + item.fetched,
        imported: total.imported + item.imported,
        created: total.created + item.created,
        updated: total.updated + item.updated,
        skipped: total.skipped + item.skipped,
        failed: total.failed + item.failed,
    }), {
        fetched: 0,
        imported: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
    });
}

async function buildGainQualityReport() {
    const base = await buildProviderGalleryQualityReport(getProviderGalleryServiceClient(), {
        label: "Gain.gg",
        externalIdLike: "gain-%",
    });

    const byWall: Record<string, number> = {};
    const { data, error } = await getProviderGalleryServiceClient()
        .from("site_offers")
        .select("external_id")
        .like("external_id", "gain-%")
        .limit(5000);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
        const wall = String(row.external_id ?? "").match(/^gain-([a-z0-9-]+)-/)?.[1] ?? "unknown";
        byWall[wall] = (byWall[wall] ?? 0) + 1;
    }

    return {
        ...base,
        totalGainRows: base.totalRows,
        byWall,
    };
}
