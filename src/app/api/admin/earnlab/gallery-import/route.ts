import {
    EarnLabGalleryTask,
    EARNLAB_GALLERY_COUNTRIES,
    getEarnLabCountryName,
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
const DEFAULT_ALL_COUNTRIES_DELAY_MS = 750;
const DEFAULT_SORT = "POPULARITY";

type ImportStats = {
    fetched: number;
    imported: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
};

type CountryImportResult = {
    country: string;
    stats: ImportStats;
    success: boolean;
    error?: string;
};

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

    const limit = Math.min(EARNLAB_CONFIG.maxImportLimit, Math.max(1, Number(body.limit ?? 50) || 50));
    const refresh = body.refresh !== false;
    const sort = typeof body.sort === "string" ? body.sort : EARNLAB_CONFIG.defaultSort ?? DEFAULT_SORT;
    if (body.allCountries !== undefined && typeof body.allCountries !== "boolean") {
        return NextResponse.json({ error: "allCountries must be a boolean when provided" }, { status: 400 });
    }

    const allCountries = body.allCountries === true;
    if (allCountries && body.country !== undefined) {
        return NextResponse.json({ error: "country must not be provided when allCountries is true" }, { status: 400 });
    }

    if (allCountries) {
        const delayMs = normalizeDelayMs(body.delayMs);
        const countries = [...EARNLAB_GALLERY_COUNTRIES];
        const results: CountryImportResult[] = [];
        const stats = emptyStats();

        for (let index = 0; index < countries.length; index += 1) {
            const country = countries[index]!;
            const result = await importEarnLabCountry(country, { limit, refresh, sort });
            results.push(result);
            addStats(stats, result.stats);

            console.info("[admin/earnlab/gallery-import] country complete", {
                country,
                success: result.success,
                stats: result.stats,
            });

            if (index < countries.length - 1 && delayMs > 0) {
                await sleep(delayMs);
            }
        }

        const countriesFailed = results.filter((result) => !result.success).length;
        const response = {
            mode: "all-countries",
            countriesRequested: countries.length,
            countriesSucceeded: results.length - countriesFailed,
            countriesFailed,
            delayMs,
            totals: stats,
            results: results.map(formatCountryImportResult),
        };

        return NextResponse.json(response, { status: countriesFailed > 0 ? 207 : 200 });
    }

    const countryInput = typeof body.country === "string" ? body.country : null;
    const country = normalizeSupportedEarnLabImportCountry(countryInput);
    if (!country) {
        const unsupported = normalizeEarnLabCountryCode(countryInput);
        if (unsupported) {
            return NextResponse.json({ error: `Unsupported EarnLab gallery country: ${unsupported}` }, { status: 400 });
        }
        return NextResponse.json({ error: "country must be a two-letter country code such as US, GB, CA, or AU" }, { status: 400 });
    }

    try {
        const result = await importEarnLabCountry(country, { limit, refresh, sort });
        if (result.error) {
            throw new Error(result.error);
        }

        return NextResponse.json({
            countryCode: result.country,
            countryName: getEarnLabCountryName(result.country),
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

function normalizeSupportedEarnLabImportCountry(value: string | null | undefined): string | null {
    const normalized = normalizeEarnLabCountryCode(value);
    if (!normalized) return null;
    return EARNLAB_GALLERY_COUNTRIES.includes(normalized as typeof EARNLAB_GALLERY_COUNTRIES[number])
        ? normalized
        : null;
}

async function importEarnLabCountry(
    country: string,
    options: { limit: number; refresh: boolean; sort: string },
): Promise<CountryImportResult> {
    try {
        const gallery = await getEarnLabGalleryTasksByCountry(country, options);
        const result = await runProviderGalleryAdminImport({
            config: EARNLAB_CONFIG,
            offers: gallery.offers.map(toNormalizedEarnLabOffer),
            loggerPrefix: `admin/earnlab/gallery-import/${country}`,
        });

        return {
            country: gallery.countryCode,
            stats: result.stats,
            success: true,
        };
    } catch (error) {
        const message = sanitizeImportError(error);
        console.error("[admin/earnlab/gallery-import] country failed", { country, message });
        return {
            country,
            stats: emptyStats(),
            success: false,
            error: message,
        };
    }
}

function formatCountryImportResult(result: CountryImportResult) {
    return {
        country: result.country,
        success: result.success,
        fetched: safeStat(result.stats.fetched),
        imported: safeStat(result.stats.imported),
        created: safeStat(result.stats.created),
        updated: safeStat(result.stats.updated),
        skipped: safeStat(result.stats.skipped),
        failed: safeStat(result.stats.failed),
        ...(result.error ? { error: result.error } : {}),
    };
}

function emptyStats(): ImportStats {
    return {
        fetched: 0,
        imported: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
    };
}

function addStats(target: ImportStats, source: ImportStats) {
    target.fetched += safeStat(source.fetched);
    target.imported += safeStat(source.imported);
    target.created += safeStat(source.created);
    target.updated += safeStat(source.updated);
    target.skipped += safeStat(source.skipped);
    target.failed += safeStat(source.failed);
}

function safeStat(value: unknown): number {
    const stat = Number(value);
    return Number.isFinite(stat) && stat > 0 ? Math.floor(stat) : 0;
}

function normalizeDelayMs(value: unknown): number {
    const delay = Number(value);
    if (!Number.isFinite(delay)) return DEFAULT_ALL_COUNTRIES_DELAY_MS;
    return Math.min(5000, Math.max(250, Math.floor(delay)));
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeImportError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    const sanitized = message
        .replace(/(authorization|cookie|token|key|secret|password)=([^&\s]+)/gi, "$1=[redacted]")
        .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[redacted]");
    return sanitized.slice(0, 240) || "Country import failed";
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
