import { NextResponse } from "next/server";
import { getHomepageFeaturedOffers } from "@/lib/homepage-featured";

export const revalidate = 60;

export async function GET() {
  try {
    const result = await getHomepageFeaturedOffers();
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("[GET /api/homepage/featured]", error);
    return NextResponse.json({ error: "Unable to load weekly featured games." }, { status: 500 });
  }
}
