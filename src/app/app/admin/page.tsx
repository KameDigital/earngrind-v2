import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Home | Earngrind" };

type AdminSectionSummary = {
    label: string;
    value: number;
    href: string;
    description: string;
};

type RecentItem = {
    id: string;
    title: string;
    meta: string;
    href: string;
    updatedAt?: string | null;
};

export default async function AdminHomePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile || !["admin", "editor"].includes(profile.role)) {
        redirect("/app/dashboard");
    }

    const [
        gamesCountRes,
        offersCountRes,
        siteOffersCountRes,
        guidesCountRes,
        blogPostsCountRes,
        gamesRes,
        guidesRes,
        blogPostsRes,
        siteOffersRes,
    ] = await Promise.all([
        supabase.from("games").select("id", { count: "exact", head: true }),
        supabase.from("offers").select("id", { count: "exact", head: true }),
        supabase.from("site_offers").select("id", { count: "exact", head: true }),
        supabase.from("guides").select("id", { count: "exact", head: true }),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }),
        supabase.from("games").select("id, name, slug").order("updated_at", { ascending: false }).limit(4),
        supabase.from("guides").select("id, title, slug, status, updated_at").order("updated_at", { ascending: false }).limit(4),
        supabase.from("blog_posts").select("id, title, status, updated_at").order("updated_at", { ascending: false }).limit(4),
        supabase
            .from("site_offers")
            .select("id, title, status, updated_at, game:games(name), site:platforms(name)")
            .order("updated_at", { ascending: false })
            .limit(4),
    ]);

    const summaries: AdminSectionSummary[] = [
        {
            label: "Games",
            value: gamesCountRes.count ?? 0,
            href: "/app/admin/games",
            description: "Base records used by offers and guides.",
        },
        {
            label: "Legacy Offers",
            value: offersCountRes.count ?? 0,
            href: "/app/admin/offers",
            description: "offers rows that feed redirects and unified_offers_view.",
        },
        {
            label: "Site Offers",
            value: siteOffersCountRes.count ?? 0,
            href: "/app/admin/site-offers",
            description: "site_offers rows for curated comparison routes.",
        },
        {
            label: "Guides",
            value: guidesCountRes.count ?? 0,
            href: "/app/admin/guides",
            description: "Step-by-step content linked to games.",
        },
        {
            label: "Blog Posts",
            value: blogPostsCountRes.count ?? 0,
            href: "/app/admin/blog-posts",
            description: "Editorial content for the homepage and blog.",
        },
    ];

    const recentGames: RecentItem[] = (gamesRes.data ?? []).map((game) => ({
        id: game.id,
        title: game.name,
        meta: game.slug,
        href: `/app/admin/games/${game.id}/edit`,
    }));

    const recentGuides: RecentItem[] = (guidesRes.data ?? []).map((guide) => ({
        id: guide.id,
        title: guide.title,
        meta: `${guide.slug} | ${guide.status}`,
        href: `/app/admin/guides/${guide.id}/edit`,
        updatedAt: guide.updated_at,
    }));

    const recentBlogPosts: RecentItem[] = (blogPostsRes.data ?? []).map((post) => ({
        id: post.id,
        title: post.title,
        meta: post.status,
        href: `/app/admin/blog-posts/${post.id}/edit`,
        updatedAt: post.updated_at,
    }));

    const recentSiteOffers: RecentItem[] = (siteOffersRes.data ?? []).map((offer) => {
        const game = Array.isArray(offer.game) ? offer.game[0] : offer.game;
        const site = Array.isArray(offer.site) ? offer.site[0] : offer.site;

        return {
            id: offer.id,
            title: offer.title || `${game?.name ?? "Game"} on ${site?.name ?? "site"}`,
            meta: [game?.name, site?.name, offer.status].filter(Boolean).join(" | "),
            href: `/app/admin/site-offers/${offer.id}/edit`,
            updatedAt: offer.updated_at,
        };
    });

    return (
        <div className="space-y-8">
            <section className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-lime-50 p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">Admin Hub</p>
                        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">A cleaner place to run the CMS</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Jump straight into common tasks, keep an eye on content volume, and reopen recent records without bouncing through multiple list pages.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <QuickLink href="/app/admin/site-offers/new" label="New site offer" emphasis />
                        <QuickLink href="/app/admin/games/new" label="New game" />
                        <QuickLink href="/app/admin/guides/batch-generate" label="Generate guides" />
                        <QuickLink href="/app/admin/blog-posts/new" label="New post" />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {summaries.map((summary) => (
                    <Link
                        key={summary.href}
                        href={summary.href}
                        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
                    >
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">{summary.label}</p>
                        <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">{summary.value.toLocaleString()}</p>
                        <p className="mt-2 text-sm text-gray-500">{summary.description}</p>
                    </Link>
                ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
                <RecentList
                    title="Recent Site Offers"
                    description="Resume the records you were likely just touching."
                    items={recentSiteOffers}
                    emptyLabel="Site offers will show up here after they are created."
                    viewAllHref="/app/admin/site-offers"
                />
                <RecentList
                    title="Recent Games"
                    description="Quick access to the latest catalog changes."
                    items={recentGames}
                    emptyLabel="Games will show up here after the first record is added."
                    viewAllHref="/app/admin/games"
                />
                <RecentList
                    title="Recent Guides"
                    description="Pick up drafts and published guides faster."
                    items={recentGuides}
                    emptyLabel="Guides will show up here after the first record is added."
                    viewAllHref="/app/admin/guides"
                />
                <RecentList
                    title="Recent Blog Posts"
                    description="Jump back into editorial work from one place."
                    items={recentBlogPosts}
                    emptyLabel="Blog posts will show up here after the first record is added."
                    viewAllHref="/app/admin/blog-posts"
                />
            </section>
        </div>
    );
}

function QuickLink({ href, label, emphasis }: { href: string; label: string; emphasis?: boolean }) {
    return (
        <Link
            href={href}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                emphasis
                    ? "border-gray-900 bg-gray-900 text-white hover:bg-gray-800"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:text-gray-900"
            }`}
        >
            {label}
        </Link>
    );
}

function RecentList({
    title,
    description,
    items,
    emptyLabel,
    viewAllHref,
}: {
    title: string;
    description: string;
    items: RecentItem[];
    emptyLabel: string;
    viewAllHref: string;
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{description}</p>
                </div>
                <Link href={viewAllHref} className="text-sm font-semibold text-gray-600 transition hover:text-gray-900">
                    View all
                </Link>
            </div>

            {items.length === 0 ? (
                <p className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                    {emptyLabel}
                </p>
            ) : (
                <div className="mt-5 space-y-3">
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 px-4 py-3 transition hover:border-gray-200 hover:bg-gray-50"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">{item.title}</p>
                                <p className="mt-1 truncate text-xs text-gray-500">{item.meta}</p>
                            </div>
                            <p className="shrink-0 text-xs font-medium text-gray-400">
                                {formatDate(item.updatedAt)}
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function formatDate(value?: string | null) {
    if (!value) {
        return "Open";
    }

    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}
