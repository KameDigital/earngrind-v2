import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function normalizeSearchTerm(value: string): string {
    return value.trim().toLowerCase();
}

export async function GET(req: NextRequest) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const qRaw = req.nextUrl.searchParams.get("q") ?? "";
    const q = normalizeSearchTerm(qRaw);
    const limit = Math.min(30, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "15", 10)));

    if (q.length < 2) {
        return NextResponse.json({ data: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const escaped = q.replace(/[%_]/g, "\\$&");

    const { data: nameSlugRows, error: searchError } = await supabase
        .from("games")
        .select("id, name, slug, aliases")
        .or(`name.ilike.%${escaped}%,slug.ilike.%${escaped}%`)
        .order("name", { ascending: true })
        .limit(120);

    if (searchError) {
        return NextResponse.json({ error: searchError.message }, { status: 500 });
    }

    const { data: aliasCandidates, error: aliasError } = await supabase
        .from("games")
        .select("id, name, slug, aliases")
        .order("name", { ascending: true })
        .limit(250);

    if (aliasError) {
        return NextResponse.json({ error: aliasError.message }, { status: 500 });
    }

    const aliasRows = (aliasCandidates ?? []).filter((row) => {
        const aliases = Array.isArray(row.aliases) ? row.aliases : [];
        return aliases.some((alias) => String(alias).toLowerCase().includes(q));
    });

    const unique = new Map<string, { id: string; name: string; slug: string }>();
    for (const row of [...(nameSlugRows ?? []), ...aliasRows]) {
        if (!unique.has(row.id)) {
            unique.set(row.id, { id: row.id, name: row.name, slug: row.slug });
        }
    }

    const data = Array.from(unique.values()).slice(0, limit);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
}
