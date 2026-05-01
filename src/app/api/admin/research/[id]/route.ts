import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractResearchData, sanitizeResearchText } from "@/lib/research-extractor";

const ENTRY_TYPES = new Set(["platform", "game", "offer", "general"]);
const SOURCE_TYPES = new Set(["url", "reddit", "trustpilot", "note", "screenshot"]);

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role)) return { supabase, user: null };
  return { supabase, user };
}

function parseTags(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean).slice(0, 20);
  return String(value ?? "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20);
}

function cleanUrl(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user } = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const type = String(body.type ?? "general");
  const sourceType = String(body.sourceType ?? body.source_type ?? "note");
  const targetName = sanitizeResearchText(String(body.targetName ?? body.target_name ?? ""), 160);
  const rawText = sanitizeResearchText(String(body.rawText ?? body.raw_text ?? ""));
  const sourceUrl = cleanUrl(body.sourceUrl ?? body.source_url);
  const imageUrl = cleanUrl(body.imageUrl ?? body.image_url);

  if (!targetName) return NextResponse.json({ error: "Target name is required." }, { status: 422 });
  if (!ENTRY_TYPES.has(type)) return NextResponse.json({ error: "Invalid research type." }, { status: 422 });
  if (!SOURCE_TYPES.has(sourceType)) return NextResponse.json({ error: "Invalid source type." }, { status: 422 });

  const { data, error } = await supabase
    .from("research_entries")
    .update({
      type,
      target_name: targetName,
      source_type: sourceType,
      source_url: sourceUrl,
      image_url: imageUrl,
      raw_text: rawText,
      extracted_data: extractResearchData(rawText),
      tags: parseTags(body.tags),
    })
    .eq("id", params.id)
    .select("id, type, target_name, source_type, source_url, image_url, raw_text, extracted_data, tags, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user } = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from("research_entries").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
