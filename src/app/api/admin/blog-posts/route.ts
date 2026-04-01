import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role))
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { title, slug, excerpt, body_md, category, tags, featured_image, seo_title, seo_description, status } = body;

    if (!title || !slug) {
        return NextResponse.json({ error: "title and slug are required." }, { status: 400 });
    }

    const isPublishing = status === "published";

    const { data, error } = await supabase.from("blog_posts").insert({
        title,
        slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        excerpt: excerpt || null,
        body_md: body_md || "",
        category: category || null,
        tags: Array.isArray(tags) ? tags : (tags ? tags.split("\n").map((t: string) => t.trim()).filter(Boolean) : []),
        featured_image: featured_image || null,
        seo_title: seo_title || null,
        seo_description: seo_description || null,
        status: status || "draft",
        author_id: user.id,
        ...(isPublishing && { published_at: new Date().toISOString() }),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}
