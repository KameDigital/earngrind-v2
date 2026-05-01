import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractResearchData } from "@/lib/research-extractor";
import {
  detectSourceType,
  extractReadableText,
  fetchResearchHtml,
  validateResearchUrl,
} from "@/lib/research-url-ingest";

export const runtime = "nodejs";

const ENTRY_TYPES = new Set(["platform", "game", "offer", "general"]);
const SOURCE_TYPES = new Set(["auto", "url", "reddit", "trustpilot"]);

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

function confidenceScore(extractedData: ReturnType<typeof extractResearchData>, sourceCount = 1) {
  return [
    sourceCount >= 2,
    extractedData.complaints.length > 0,
    extractedData.payoutMentions.length > 0,
    extractedData.requirements.length > 0,
    extractedData.trustSignals.length > 0,
  ].reduce((score, value) => score + (value ? 20 : 0), 0);
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const targetName = String(body.targetName ?? body.target_name ?? "").trim().slice(0, 160);
  const type = String(body.type ?? "general");
  const requestedSourceType = String(body.sourceType ?? body.source_type ?? "auto");
  const updateExisting = Boolean(body.updateExisting);

  if (!targetName) return NextResponse.json({ error: "Target name is required." }, { status: 422 });
  if (!ENTRY_TYPES.has(type)) return NextResponse.json({ error: "Invalid research type." }, { status: 422 });
  if (!SOURCE_TYPES.has(requestedSourceType)) return NextResponse.json({ error: "Invalid source type." }, { status: 422 });

  let sourceUrl: string;
  try {
    sourceUrl = await validateResearchUrl(String(body.sourceUrl ?? body.source_url ?? ""));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid URL." }, { status: 422 });
  }

  const { data: existing } = await supabase
    .from("research_entries")
    .select("id, type, target_name, source_type, source_url, image_url, raw_text, extracted_data, tags, created_at, updated_at")
    .eq("source_url", sourceUrl)
    .maybeSingle();

  if (existing && !updateExisting) {
    return NextResponse.json({
      error: "This source already exists.",
      duplicate: true,
      entry: existing,
    }, { status: 409 });
  }

  let html: string;
  try {
    html = await fetchResearchHtml(sourceUrl);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Could not fetch this URL. Paste the source text manually.",
    }, { status: 422 });
  }

  const rawText = extractReadableText(html);
  const detectedSourceType = detectSourceType(sourceUrl);
  const sourceType = requestedSourceType === "auto" ? detectedSourceType : requestedSourceType;
  const warnings = [];

  if (sourceType === "reddit" && rawText.length < 500) {
    warnings.push("Reddit may block server extraction. Paste the thread text manually.");
  }

  if (sourceType === "trustpilot" && rawText.length < 500) {
    warnings.push("Trustpilot may block server extraction. Paste review snippets manually.");
  }

  if (rawText.length < 200) {
    return NextResponse.json({
      error: "Could not extract enough readable text. Paste the source text manually.",
      warnings,
    }, { status: 422 });
  }

  const extractedData = extractResearchData(rawText);
  const payload = {
    type,
    target_name: targetName,
    source_type: sourceType,
    source_url: sourceUrl,
    raw_text: rawText,
    extracted_data: extractedData,
    tags: parseTags(body.tags),
  };

  const query = existing && updateExisting
    ? supabase
      .from("research_entries")
      .update(payload)
      .eq("id", existing.id)
      .select("id, type, target_name, source_type, source_url, image_url, raw_text, extracted_data, tags, created_at, updated_at")
      .single()
    : supabase
      .from("research_entries")
      .insert(payload)
      .select("id, type, target_name, source_type, source_url, image_url, raw_text, extracted_data, tags, created_at, updated_at")
      .single();

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    entry: data,
    extractedTextPreview: rawText.slice(0, 1200),
    extractedData,
    confidenceScore: confidenceScore(extractedData),
    warnings,
    updatedExisting: Boolean(existing && updateExisting),
  }, { status: existing && updateExisting ? 200 : 201 });
}
