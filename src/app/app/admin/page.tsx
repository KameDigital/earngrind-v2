import { AdminButtonLink, AdminPageHeader, AdminPanel, AdminStatCard } from "@/components/admin/AdminUi";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Home | EarnGrind" };

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
        readyQueueRes,
        needsEditQueueRes,
        activeSiteOffersRes,
        recentGuidesRes,
        recentSiteOffersRes,
        recentBlogPostsRes,
    ] = await Promise.all([
        supabase.from("games").select("id", { count: "exact", head: true }),
        supabase.from("offers").select("id", { count: "exact", head: true }),
        supabase.from("site_offers").select("id", { count: "exact", head: true }),
        supabase.from("guides").select("id", { count: "exact", head: true }),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }),
        supabase.from("guides").select("id", { count: "exact", head: true }).eq("content_status", "ready_to_publish"),
        supabase.from("guides").select("id", { count: "exact", head: true }).eq("content_status", "needs_edit"),
        supabase.from("site_offers").select("id", { count: "exact", head: true }).in("status", ["active", "boosted"]),
        supabase.from("guides").select("id, title, slug, status, content_status, updated_at").order("updated_at", { ascending: false }).limit(6),
        supabase
            .from("site_offers")
            .select("id, title, status, updated_at, game:games(name), site:platforms(name)")
            .order("updated_at", { ascending: false })
            .limit(6),
        supabase.from("blog_posts").select("id, title, status, updated_at").order("updated_at", { ascending: false }).limit(6),
    ]);

    const recentGuides: RecentItem[] = (recentGuidesRes.data ?? []).map((guide) => ({
        id: guide.id,
        title: guide.title,
        meta: [guide.slug, guide.content_status ?? guide.status].filter(Boolean).join(" | "),
        href: `/app/admin/guides/${guide.id}/edit`,
        updatedAt: guide.updated_at,
    }));

    const recentSiteOffers: RecentItem[] = (recentSiteOffersRes.data ?? []).map((offer) => {
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

    const recentBlogPosts: RecentItem[] = (recentBlogPostsRes.data ?? []).map((post) => ({
        id: post.id,
        title: post.title,
        meta: post.status,
        href: `/app/admin/blog-posts/${post.id}/edit`,
        updatedAt: post.updated_at,
    }));

    return (
        <div className="space-y-6">
            <AdminPageHeader
                eyebrow="Command Center"
                title="Run content, offers, and SEO from one place"
                description="Start with the prioritized workflows, then drill into the specific CMS tools from the sidebar."
                actions={
                    <>
                        <AdminButtonLink href="/app/admin/seo/action-plan" variant="primary">Open SEO Action Plan</AdminButtonLink>
                        <AdminButtonLink href="/app/admin/content-queue">Open Content Queue</AdminButtonLink>
                    </>
                }
            />

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AdminStatCard
                    label="Ready to publish"
                    value={readyQueueRes.count ?? 0}
                    href="/app/admin/content-queue"
                    tone="good"
                    description="Guides that passed queue checks and need a final review."
                />
                <AdminStatCard
                    label="Needs edit"
                    value={needsEditQueueRes.count ?? 0}
                    href="/app/admin/content-queue"
                    tone={(needsEditQueueRes.count ?? 0) > 0 ? "warning" : "neutral"}
                    description="Refresh, decay, or editor tasks waiting for cleanup."
                />
                <AdminStatCard
                    label="Live offer routes"
                    value={activeSiteOffersRes.count ?? 0}
                    href="/app/admin/site-offers"
                    tone="good"
                    description="Active or boosted manual offers powering comparison routes."
                />
                <AdminStatCard
                    label="Total guides"
                    value={guidesCountRes.count ?? 0}
                    href="/app/admin/guides"
                    description="Published, queued, and draft guide records."
                />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
                <AdminPanel title="Primary Workflows" description="The paths admins should use most often.">
                    <div className="grid gap-3 md:grid-cols-2">
                        <WorkflowLink
                            href="/app/admin/seo/action-plan"
                            title="Decide what to do next"
                            description="One ranked list across SEO, queue, refresh, research, and conversion systems."
                        />
                        <WorkflowLink
                            href="/app/admin/content-queue"
                            title="Move content toward publish"
                            description="Assign, prioritize, schedule, and publish guide work."
                        />
                        <WorkflowLink
                            href="/app/admin/guides/batch-generate"
                            title="Generate guide batches"
                            description="Create drafts from games, offers, and keyword opportunities."
                        />
                        <WorkflowLink
                            href="/app/admin/homepage-featured"
                            title="Curate Weekly Top Games"
                            description="Choose the exact games and offers promoted on the homepage."
                        />
                        <WorkflowLink
                            href="/app/admin/research/opportunities"
                            title="Find research targets"
                            description="Prioritize high-payout games, platforms, and offer research."
                        />
                    </div>
                </AdminPanel>

                <AdminPanel title="Inventory" description="Current record counts by system.">
                    <div className="grid grid-cols-2 gap-3">
                        <MiniStat label="Games" value={gamesCountRes.count ?? 0} href="/app/admin/games" />
                        <MiniStat label="Guides" value={guidesCountRes.count ?? 0} href="/app/admin/guides" />
                        <MiniStat label="Manual offers" value={siteOffersCountRes.count ?? 0} href="/app/admin/site-offers" />
                        <MiniStat label="Ingested offers" value={offersCountRes.count ?? 0} href="/app/admin/offers" />
                        <MiniStat label="Blog posts" value={blogPostsCountRes.count ?? 0} href="/app/admin/blog-posts" />
                        <MiniStat label="SEO tools" value="5+" href="/app/admin/seo/action-plan" />
                    </div>
                </AdminPanel>
            </section>

            <section className="grid gap-4 xl:grid-cols-3">
                <RecentList title="Recent Guides" items={recentGuides} emptyLabel="Guides will show up here after they are created." viewAllHref="/app/admin/guides" />
                <RecentList title="Recent Offers" items={recentSiteOffers} emptyLabel="Manual offers will show up here after they are created." viewAllHref="/app/admin/site-offers" />
                <RecentList title="Recent Posts" items={recentBlogPosts} emptyLabel="Blog posts will show up here after they are created." viewAllHref="/app/admin/blog-posts" />
            </section>
        </div>
    );
}

function WorkflowLink({ href, title, description }: { href: string; title: string; description: string }) {
    return (
        <Link href={href} className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-gray-300 hover:bg-white">
            <div className="text-sm font-extrabold text-gray-950">{title}</div>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">{description}</p>
        </Link>
    );
}

function MiniStat({ label, value, href }: { label: string; value: number | string; href: string }) {
    return (
        <Link href={href} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:border-gray-200 hover:bg-white">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</div>
            <div className="mt-1 text-xl font-extrabold text-gray-950">{typeof value === "number" ? value.toLocaleString() : value}</div>
        </Link>
    );
}

function RecentList({
    title,
    items,
    emptyLabel,
    viewAllHref,
}: {
    title: string;
    items: RecentItem[];
    emptyLabel: string;
    viewAllHref: string;
}) {
    return (
        <AdminPanel
            title={title}
            action={<Link href={viewAllHref} className="text-sm font-bold text-gray-500 hover:text-gray-950">View all</Link>}
        >
            {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                    {emptyLabel}
                </p>
            ) : (
                <div className="space-y-2">
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 transition hover:border-gray-200 hover:bg-gray-50"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-gray-950">{item.title}</p>
                                <p className="mt-0.5 truncate text-xs text-gray-500">{item.meta}</p>
                            </div>
                            <span className="shrink-0 text-xs font-medium text-gray-400">{formatDate(item.updatedAt)}</span>
                        </Link>
                    ))}
                </div>
            )}
        </AdminPanel>
    );
}

function formatDate(value?: string | null) {
    if (!value) return "Open";
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}
