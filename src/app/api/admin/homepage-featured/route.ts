import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminOrEditor } from "@/lib/admin-auth";

const placements = ["weekly_top_games", "hero", "seasonal", "sponsored"] as const;

function asPriority(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 && number <= 100000 ? number : null;
}

export async function GET() {
  const auth = await requireAdminOrEditor();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { data: items, error } = await auth.supabase
    .from("homepage_featured_offers")
    .select("id, offer_id, offer_source, is_active, display_priority, badge, lock_summary, placement, starts_at, expires_at, created_at")
    .order("display_priority", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "Could not load featured games." }, { status: 500 });
  const { data: settings } = await auth.supabase.from("homepage_featured_settings").select("display_limit").eq("id", true).single();
  return NextResponse.json({ items: items ?? [], display_limit: settings?.display_limit ?? 8 });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminOrEditor();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });

  const action = body.action;
  let error: { message: string } | null = null;
  if (action === "add") {
    const source = body.offer_source === "manual" ? "manual" : body.offer_source === "ingested" ? "ingested" : null;
    const priority = asPriority(body.display_priority) ?? 100;
    if (!source || typeof body.offer_id !== "string") return NextResponse.json({ error: "offer_id and a valid offer_source are required." }, { status: 422 });
    ({ error } = await auth.supabase.from("homepage_featured_offers").insert({
      offer_id: body.offer_id, offer_source: source, display_priority: priority,
      badge: typeof body.badge === "string" ? body.badge.trim().slice(0, 80) || null : null,
    }));
  } else if (action === "update") {
    if (typeof body.id !== "string") return NextResponse.json({ error: "id is required." }, { status: 422 });
    const changes: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.is_active === "boolean") changes.is_active = body.is_active;
    if (typeof body.badge === "string") changes.badge = body.badge.trim().slice(0, 80) || null;
    if (typeof body.lock_summary === "string") changes.lock_summary = body.lock_summary.trim().slice(0, 240) || null;
    if (body.display_priority !== undefined) {
      const priority = asPriority(body.display_priority);
      if (priority === null) return NextResponse.json({ error: "display_priority must be a positive integer." }, { status: 422 });
      changes.display_priority = priority;
    }
    if (typeof body.placement === "string" && placements.includes(body.placement as typeof placements[number])) changes.placement = body.placement;
    ({ error } = await auth.supabase.from("homepage_featured_offers").update(changes).eq("id", body.id));
  } else if (action === "remove") {
    if (typeof body.id !== "string") return NextResponse.json({ error: "id is required." }, { status: 422 });
    ({ error } = await auth.supabase.from("homepage_featured_offers").delete().eq("id", body.id));
  } else if (action === "settings") {
    const limit = Number(body.display_limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 48) return NextResponse.json({ error: "display_limit must be between 1 and 48." }, { status: 422 });
    ({ error } = await auth.supabase.from("homepage_featured_settings").update({ display_limit: limit, updated_at: new Date().toISOString() }).eq("id", true));
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  if (error) return NextResponse.json({ error: error.message.includes("unique") ? "That offer is already featured." : "Could not save featured game." }, { status: 500 });
  revalidateTag("homepage-featured");
  return NextResponse.json({ ok: true });
}
