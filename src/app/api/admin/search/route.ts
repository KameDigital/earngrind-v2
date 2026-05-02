import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchResult = {
    id: string;
    type: "Guide" | "Game" | "Offer" | "Research" | "Blog";
    title: string;
    subtitle: string;
    href: string;
};

function cleanQuery(value: string | null) {
    return (value ?? "").trim().slice(0, 80);
}

export async function GET(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile || !["admin", "editor"].includes(profile.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const q = cleanQuery(url.searchParams.get("q"));
    if (q.length < 2) return NextResponse.json({ results: [] });

    const pattern = `%${q}%`;
    const [guidesRes, gamesRes, siteOffersRes, researchRes, blogRes] = await Promise.all([
        supabase
            .from("guides")
            .select("id, title, slug, status, keyword_target")
            .or(`title.ilike.${pattern},slug.ilike.${pattern},keyword_target.ilike.${pattern}`)
            .order("updated_at", { ascending: false })
            .limit(6),
        supabase
            .from("games")
            .select("id, name, slug")
            .or(`name.ilike.${pattern},slug.ilike.${pattern}`)
            .order("updated_at", { ascending: false })
            .limit(5),
        supabase
            .from("site_offers")
            .select("id, title, status, goal_text, game:games(name), site:platforms(name)")
            .or(`title.ilike.${pattern},goal_text.ilike.${pattern}`)
            .order("updated_at", { ascending: false })
            .limit(5),
        supabase
            .from("research_entries")
            .select("id, target_name, type, source_type")
            .ilike("target_name", pattern)
            .order("updated_at", { ascending: false })
            .limit(5),
        supabase
            .from("blog_posts")
            .select("id, title, status")
            .ilike("title", pattern)
            .order("updated_at", { ascending: false })
            .limit(5),
    ]);

    const results: SearchResult[] = [
        ...(guidesRes.data ?? []).map((guide) => ({
            id: guide.id,
            type: "Guide" as const,
            title: guide.title,
            subtitle: [guide.slug, guide.status, guide.keyword_target].filter(Boolean).join(" | "),
            href: `/app/admin/guides/${guide.id}/edit`,
        })),
        ...(gamesRes.data ?? []).map((game) => ({
            id: game.id,
            type: "Game" as const,
            title: game.name,
            subtitle: game.slug,
            href: `/app/admin/games/${game.id}/edit`,
        })),
        ...(siteOffersRes.data ?? []).map((offer) => {
            const game = Array.isArray(offer.game) ? offer.game[0] : offer.game;
            const site = Array.isArray(offer.site) ? offer.site[0] : offer.site;
            return {
                id: offer.id,
                type: "Offer" as const,
                title: offer.title || `${game?.name ?? "Game"} offer`,
                subtitle: [game?.name, site?.name, offer.status].filter(Boolean).join(" | "),
                href: `/app/admin/site-offers/${offer.id}/edit`,
            };
        }),
        ...(researchRes.data ?? []).map((entry) => ({
            id: entry.id,
            type: "Research" as const,
            title: entry.target_name,
            subtitle: [entry.type, entry.source_type].filter(Boolean).join(" | "),
            href: `/app/admin/research/${entry.id}`,
        })),
        ...(blogRes.data ?? []).map((post) => ({
            id: post.id,
            type: "Blog" as const,
            title: post.title,
            subtitle: post.status,
            href: `/app/admin/blog-posts/${post.id}/edit`,
        })),
    ].slice(0, 18);

    return NextResponse.json({ results });
}
