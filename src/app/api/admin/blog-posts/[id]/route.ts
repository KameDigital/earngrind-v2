import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function checkAdmin(supabase: ReturnType<typeof createClient>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) return null;
    return user;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createClient();
    const user = await checkAdmin(supabase);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { title, slug, excerpt, body_md, category, tags, featured_image, seo_title, seo_description, status } = body;

    // Only set published_at on first publish
    let publishedAt: string | undefined;
    if (status === "published") {
        const { data: existing } = await supabase.from("blog_posts").select("published_at, status").eq("id", params.id).single();
        if (existing && existing.status !== "published" && !existing.published_at) {
            publishedAt = new Date().toISOString();
        }
    }

    const { data, error } = await supabase.from("blog_posts").update({
        ...(title && { title }),
        ...(slug && { slug: slug.trim().toLowerCase().replace(/\s+/g, "-") }),
        excerpt: excerpt || null,
        body_md: body_md ?? "",
        category: category || null,
        tags: Array.isArray(tags) ? tags : (tags ? tags.split("\n").map((t: string) => t.trim()).filter(Boolean) : []),
        featured_image: featured_image || null,
        seo_title: seo_title || null,
        seo_description: seo_description || null,
        status: status || "draft",
        ...(publishedAt && { published_at: publishedAt }),
        updated_at: new Date().toISOString(),
    }).eq("id", params.id).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createClient();
    const user = await checkAdmin(supabase);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error } = await supabase.from("blog_posts").delete().eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
