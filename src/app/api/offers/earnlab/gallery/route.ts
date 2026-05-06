import {
    EarnLabGalleryFetchError,
    EarnLabGalleryValidationError,
    getEarnLabGalleryTasksByCountry,
    normalizeEarnLabCountryCode,
} from "@/lib/earnlab-gallery";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function parsePositiveInt(value: string | null, fallback: number): number {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseEarnLabSort(value: string | null): string {
    const normalized = (value ?? "POPULARITY").trim().toUpperCase().replace(/-/g, "_");
    return ["POPULARITY", "REWARD_DESC", "REWARD_ASC"].includes(normalized) ? normalized : "POPULARITY";
}

export async function GET(req: NextRequest) {
    const country = normalizeEarnLabCountryCode(req.nextUrl.searchParams.get("country"));
    if (!country) {
        return NextResponse.json({
            error: "invalid_country",
            message: "country must be a two-letter ISO-style country code such as US, GB, CA, or AU.",
        }, { status: 400 });
    }

    const page = Math.max(0, parsePositiveInt(req.nextUrl.searchParams.get("page"), 0));
    const limit = parsePositiveInt(req.nextUrl.searchParams.get("limit"), 50);
    const sort = parseEarnLabSort(req.nextUrl.searchParams.get("sort"));
    const refresh = req.nextUrl.searchParams.get("refresh") === "1" || req.nextUrl.searchParams.get("refresh") === "true";

    try {
        const result = await getEarnLabGalleryTasksByCountry(country, {
            page,
            limit,
            sort,
            refresh,
        });

        return NextResponse.json(result, {
            headers: {
                "Cache-Control": refresh
                    ? "no-store, max-age=0"
                    : "s-maxage=1800, stale-while-revalidate=1800",
            },
        });
    } catch (error) {
        if (error instanceof EarnLabGalleryValidationError) {
            return NextResponse.json({ error: "invalid_country", message: error.message }, { status: 400 });
        }

        if (error instanceof EarnLabGalleryFetchError) {
            console.error("[api/offers/earnlab/gallery] upstream failed", {
                country,
                upstreamStatus: error.status,
                message: error.message,
            });
            return NextResponse.json({ error: "earnlab_unavailable" }, { status: 502 });
        }

        console.error("[api/offers/earnlab/gallery] failed", {
            country,
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: "internal" }, { status: 500 });
    }
}
