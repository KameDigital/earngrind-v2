import { getEarnLabActivities } from "@/lib/earnlab-activities";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CACHE_CONTROL = "s-maxage=60, stale-while-revalidate=300";

export async function GET() {
    try {
        const activities = await getEarnLabActivities();

        return NextResponse.json(activities, {
            headers: {
                "Cache-Control": CACHE_CONTROL,
            },
        });
    } catch (error) {
        console.error("[api/earnlab/activities] failed", {
            message: error instanceof Error ? error.message : String(error),
        });

        return NextResponse.json([], {
            headers: {
                "Cache-Control": CACHE_CONTROL,
            },
        });
    }
}

