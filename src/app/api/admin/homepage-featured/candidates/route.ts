import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrEditor } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdminOrEditor();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ data: [] });
  const { data, error } = await auth.supabase.from("unified_offers_view")
    .select("id, source, title, payout_usd, game_name, platform_name, provider_name, image_url")
    .or(`title.ilike.%${q}%,game_name.ilike.%${q}%`)
    .order("payout_usd", { ascending: false })
    .limit(12);
  if (error) return NextResponse.json({ error: "Could not search offers." }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
