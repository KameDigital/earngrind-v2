import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { insertApprovedInternalLinks, type GuideLinkSuggestion } from "@/lib/guide-internal-linker";
import { renderMarkdown } from "@/app/guides/[slug]/markdownRenderer";

async function checkAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role)) return null;
  return user;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const user = await checkAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as { suggestions?: GuideLinkSuggestion[] };
  const suggestions = Array.isArray(body.suggestions) ? body.suggestions : [];
  if (suggestions.length === 0) return NextResponse.json({ error: "No suggestions selected." }, { status: 400 });

  const { data: guide, error: fetchError } = await supabase
    .from("guides")
    .select("id, body_md")
    .eq("id", params.id)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!guide) return NextResponse.json({ error: "Guide not found." }, { status: 404 });

  const nextBody = renderMarkdown(insertApprovedInternalLinks(guide.body_md ?? "", suggestions));
  const { data, error } = await supabase
    .from("guides")
    .update({ body_md: nextBody, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ guide: data });
}
