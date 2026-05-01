import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { suggestedHeadingFromQuery } from "@/lib/search-console-opportunities";

async function checkAdmin(supabase: ReturnType<typeof createClient>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || !["admin", "editor"].includes(profile.role)) return null;
    return user;
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function insertBeforeFaqOrFinalVerdict(html: string, section: string) {
    const match = html.match(/<h2\b[^>]*>\s*(FAQ|Final Verdict)\s*<\/h2>/i);
    if (match?.index !== undefined) return `${html.slice(0, match.index)}${section}${html.slice(match.index)}`;
    return `${html}${section}`;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createClient();
    const user = await checkAdmin(supabase);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => null);
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const suggestedHeading = typeof body?.suggestedHeading === "string" && body.suggestedHeading.trim()
        ? body.suggestedHeading.trim()
        : suggestedHeadingFromQuery(query);

    if (!query) return NextResponse.json({ error: "Query is required." }, { status: 400 });

    const { data: guide, error: guideError } = await supabase
        .from("guides")
        .select("body_md")
        .eq("id", params.id)
        .maybeSingle();

    if (guideError) return NextResponse.json({ error: guideError.message }, { status: 500 });
    if (!guide) return NextResponse.json({ error: "Guide not found." }, { status: 404 });

    const html = guide.body_md ?? "";
    if (new RegExp(`<h2\\b[^>]*>\\s*${suggestedHeading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*<\\/h2>`, "i").test(html)) {
        return NextResponse.json({ ok: true, changed: false, message: "Section already exists." });
    }

    const section = [
        `<h2>${escapeHtml(suggestedHeading)}</h2>`,
        `<p><strong>Editor note:</strong> Expand this section using current research and verified offer data. This section was suggested from Search Console query: “${escapeHtml(query)}”.</p>`,
    ].join("");

    const { error } = await supabase.from("guides").update({
        body_md: insertBeforeFaqOrFinalVerdict(html, section),
        updated_at: new Date().toISOString(),
    }).eq("id", params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, changed: true });
}
