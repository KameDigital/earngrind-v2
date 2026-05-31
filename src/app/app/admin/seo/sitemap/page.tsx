import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuideSitemapPriority } from "@/lib/indexing-readiness";
import { getSiteUrl } from "@/lib/site-url";
import { PUBLIC_GAIN_WALLS } from "@/lib/gain-gallery";
import { GEMSLOOT_PUBLIC_PROVIDERS } from "@/lib/gemsloot-providers";
import {
  getDuplicateKeywordGuideIds,
  getEligibleOfferStats,
  shouldIncludeGameInSitemap,
  shouldIncludeGeneratedHowToEarnInSitemap,
  shouldIncludeGuideInSitemap,
  shouldIncludeOfferPageInSitemap,
} from "@/lib/sitemap-filters";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sitemap Preview | Admin" };

const GAME_PAGE_SIZE = 1000;
const MAX_PREVIEW_GAMES = 20000;
const OFFER_PAGE_SIZE = 1000;
const MAX_PREVIEW_OFFERS = 20000;
const TASK_PAGE_SIZE = 200;

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSitemapPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

  const type = queryValue(searchParams?.type) ?? "guides";
  const baseUrl = getSiteUrl();

  const [{ data: guides }, { count: draftCount }, games, offers, { data: reviews }, { data: posts }] = await Promise.all([
    supabase
      .from("guides")
      .select("id, title, slug, status, updated_at, body_md, seo_title, seo_description, keyword_target, needs_variation, game_id, batch_name")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(5000),
    supabase
      .from("guides")
      .select("id", { count: "exact", head: true })
      .in("status", ["draft", "needs_review"]),
    fetchGameRows(supabase),
    fetchOfferRows(supabase),
    supabase
      .from("reviews")
      .select("id, title, slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(300),
    supabase
      .from("blog_posts")
      .select("id, title, slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(300),
  ]);

  const guideRows = guides ?? [];
  const offerStats = getEligibleOfferStats(offers);
  const publishedGuideGameIds = new Set(
    guideRows
      .map((guide) => guide.game_id)
      .filter((gameId): gameId is string => Boolean(gameId)),
  );
  const duplicateKeywordGuideIds = getDuplicateKeywordGuideIds(guideRows);
  const taskRows = await fetchTaskRows(supabase, offerStats.eligibleManualOfferIds);
  const manualOfferIdsWithTasks = new Set(
    taskRows
      .map((task) => task.site_offer_id)
      .filter((siteOfferId): siteOfferId is string => Boolean(siteOfferId)),
  );
  const gameIdsWithTaskData = new Set(
    offers
      .filter((offer) => offer.source === "manual" && offer.id && manualOfferIdsWithTasks.has(offer.id))
      .map((offer) => offer.game_id)
      .filter((gameId): gameId is string => Boolean(gameId)),
  );
  const sitemapGames = games.filter(hasSitemapGameFields);
  const guidePreviewRows = guideRows
    .map((guide) => ({
      guide,
      decision: shouldIncludeGuideInSitemap(guide, duplicateKeywordGuideIds),
    }))
    .filter(({ decision }) => decision.include);
  const offerPreviewGames = sitemapGames.filter((game) => (
    shouldIncludeOfferPageInSitemap(game, offerStats.byGameId.get(game.id) ?? 0).include
  ));
  const gamePreviewGames = sitemapGames.filter((game) => (
    shouldIncludeGameInSitemap(game, {
      eligibleOfferCount: offerStats.byGameId.get(game.id) ?? 0,
      hasPublishedGuide: publishedGuideGameIds.has(game.id),
    }).include
  ));
  const howToEarnPreviewGames = sitemapGames.filter((game) => (
    shouldIncludeGeneratedHowToEarnInSitemap(game, {
      eligibleOfferCount: offerStats.byGameId.get(game.id) ?? 0,
      hasCuratedGuide: publishedGuideGameIds.has(game.id),
      hasTaskData: gameIdsWithTaskData.has(game.id),
    }).include
  ));

  const tabs = [
    { value: "static", label: "Static" },
    { value: "offers", label: "Offer pages" },
    { value: "games", label: "Game pages" },
    { value: "how-to-earn", label: "How-to-earn" },
    { value: "guides", label: "Guides" },
    { value: "blog", label: "Blog" },
    { value: "reviews", label: "Reviews" },
  ];
  const staticRows = [
    { url: baseUrl, label: "Home", priority: "1.0", frequency: "daily" },
    { url: `${baseUrl}/offers`, label: "Offers", priority: "0.9", frequency: "daily" },
    { url: `${baseUrl}/games`, label: "Games", priority: "0.8", frequency: "weekly" },
    { url: `${baseUrl}/guides`, label: "Guides", priority: "0.8", frequency: "weekly" },
    { url: `${baseUrl}/guides/how-to-earn`, label: "How to earn", priority: "0.8", frequency: "weekly" },
    { url: `${baseUrl}/blog`, label: "Blog", priority: "0.7", frequency: "weekly" },
    { url: `${baseUrl}/platforms`, label: "Platforms", priority: "0.72", frequency: "weekly" },
    { url: `${baseUrl}/best-gpt-sites`, label: "Best GPT sites", priority: "0.85", frequency: "daily" },
    { url: `${baseUrl}/highest-paying-gpt-games`, label: "Highest paying GPT games", priority: "0.85", frequency: "daily" },
    { url: `${baseUrl}/best-freecash-games`, label: "Best Freecash games", priority: "0.8", frequency: "daily" },
    { url: `${baseUrl}/best-gain-gg-offers`, label: "Best Gain.gg offers", priority: "0.8", frequency: "daily" },
    { url: `${baseUrl}/offers/gain/us`, label: "Gain.gg US offers", priority: "0.8", frequency: "daily" },
    ...PUBLIC_GAIN_WALLS.map((wall) => ({
      url: `${baseUrl}/offers/gain/us/${wall}`,
      label: `Gain.gg ${wall} offers`,
      priority: wall === "cpx" ? "0.68" : "0.72",
      frequency: "daily",
    })),
    { url: `${baseUrl}/offers/gemsloot/us`, label: "Gemsloot US offers", priority: "0.8", frequency: "daily" },
    ...GEMSLOOT_PUBLIC_PROVIDERS.map((provider) => ({
      url: `${baseUrl}/offers/gemsloot/us/${provider.slug}`,
      label: `${provider.label} Gemsloot offers`,
      priority: "0.72",
      frequency: "daily",
    })),
    { url: `${baseUrl}/best-money-making-games`, label: "Best money making games", priority: "0.85", frequency: "daily" },
    { url: `${baseUrl}/about`, label: "About", priority: "0.5", frequency: "monthly" },
    { url: `${baseUrl}/how-it-works`, label: "How it works", priority: "0.5", frequency: "monthly" },
    { url: `${baseUrl}/legal/privacy`, label: "Privacy policy", priority: "0.3", frequency: "yearly" },
    { url: `${baseUrl}/legal/terms`, label: "Terms of service", priority: "0.3", frequency: "yearly" },
    { url: `${baseUrl}/legal/disclosure`, label: "Affiliate disclosure", priority: "0.3", frequency: "yearly" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">SEO</p>
          <h1 className="mt-1 text-2xl font-extrabold text-gray-900">Sitemap Preview</h1>
          <p className="mt-2 text-sm text-gray-500">Preview the same public URL groups emitted by sitemap.xml.</p>
        </div>
        <Link href="/sitemap.xml" target="_blank" className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white">Open sitemap.xml</Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Sitemap Guides</div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900">{guidePreviewRows.length}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Draft / Needs Review</div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900">{draftCount ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Sitemap URL</div>
          <div className="mt-2 truncate text-sm font-bold text-lime-700">{baseUrl}/sitemap.xml</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/app/admin/seo/sitemap?type=${tab.value}`}
            className={`rounded-full px-4 py-2 text-sm font-bold ${type === tab.value ? "bg-lime-100 text-lime-900" : "border border-gray-200 bg-white text-gray-600"}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
              <tr>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Last Modified</th>
                <th className="px-4 py-3 text-center">SEO Score</th>
                <th className="px-4 py-3 text-center">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {type === "static" ? staticRows.map((row) => (
                <tr key={row.url}>
                  <td className="px-4 py-3">
                    <Link href={row.url} target="_blank" className="font-bold text-gray-900 hover:text-lime-700">{row.url}</Link>
                    <div className="text-xs text-gray-400">{row.label} - {row.frequency}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">Generated at request time</td>
                  <td className="px-4 py-3 text-center">n/a</td>
                  <td className="px-4 py-3 text-center font-bold text-lime-700">{row.priority}</td>
                </tr>
              )) : null}
              {type === "guides" ? guidePreviewRows.map(({ guide, decision }) => {
                const priority = getGuideSitemapPriority(decision.score);
                return (
                  <tr key={guide.id}>
                    <td className="px-4 py-3">
                      <Link href={`/guides/${guide.slug}`} target="_blank" className="font-bold text-gray-900 hover:text-lime-700">{baseUrl}/guides/{guide.slug}</Link>
                      <div className="text-xs text-gray-400">{guide.title}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{guide.updated_at ? new Date(guide.updated_at).toLocaleString() : "n/a"}</td>
                    <td className="px-4 py-3 text-center font-bold">{decision.score}</td>
                    <td className="px-4 py-3 text-center font-bold text-lime-700">{priority}</td>
                  </tr>
                );
              }) : null}
              {type === "offers" ? offerPreviewGames.map((game) => (
                <tr key={game.id}>
                  <td className="px-4 py-3 font-bold text-gray-900">{baseUrl}/offers/{game.slug}</td>
                  <td className="px-4 py-3 text-gray-600">{game.updated_at ? new Date(game.updated_at).toLocaleString() : "n/a"}</td>
                  <td className="px-4 py-3 text-center">n/a</td>
                  <td className="px-4 py-3 text-center font-bold text-lime-700">0.85</td>
                </tr>
              )) : null}
              {type === "games" ? gamePreviewGames.map((game) => (
                <tr key={game.id}>
                  <td className="px-4 py-3 font-bold text-gray-900">{baseUrl}/games/{game.slug}</td>
                  <td className="px-4 py-3 text-gray-600">{game.updated_at ? new Date(game.updated_at).toLocaleString() : "n/a"}</td>
                  <td className="px-4 py-3 text-center">n/a</td>
                  <td className="px-4 py-3 text-center font-bold text-lime-700">0.75</td>
                </tr>
              )) : null}
              {type === "how-to-earn" ? howToEarnPreviewGames.map((game) => (
                <tr key={game.id}>
                  <td className="px-4 py-3 font-bold text-gray-900">{baseUrl}/guides/how-to-earn/{game.slug}</td>
                  <td className="px-4 py-3 text-gray-600">{game.updated_at ? new Date(game.updated_at).toLocaleString() : "n/a"}</td>
                  <td className="px-4 py-3 text-center">n/a</td>
                  <td className="px-4 py-3 text-center font-bold text-lime-700">0.62</td>
                </tr>
              )) : null}
              {type === "blog" ? (posts ?? []).map((post) => (
                <tr key={post.id}>
                  <td className="px-4 py-3 font-bold text-gray-900">{baseUrl}/blog/{post.slug}</td>
                  <td className="px-4 py-3 text-gray-600">{post.updated_at ? new Date(post.updated_at).toLocaleString() : "n/a"}</td>
                  <td className="px-4 py-3 text-center">n/a</td>
                  <td className="px-4 py-3 text-center font-bold text-lime-700">0.65</td>
                </tr>
              )) : null}
              {type === "reviews" ? (reviews ?? []).map((review) => (
                <tr key={review.id}>
                  <td className="px-4 py-3 font-bold text-gray-900">{baseUrl}/review/{review.slug}</td>
                  <td className="px-4 py-3 text-gray-600">{review.updated_at ? new Date(review.updated_at).toLocaleString() : "n/a"}</td>
                  <td className="px-4 py-3 text-center">n/a</td>
                  <td className="px-4 py-3 text-center font-bold text-lime-700">0.7</td>
                </tr>
              )) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type PreviewGameRow = {
  id: string;
  name: string | null;
  slug: string;
  updated_at: string;
  description: string | null;
};

function hasSitemapGameFields(game: {
  id: string | null;
  name: string | null;
  slug: string | null;
  updated_at: string | null;
  description: string | null;
}): game is PreviewGameRow {
  return Boolean(game.id?.trim() && game.slug?.trim() && game.updated_at);
}

async function fetchGameRows(supabase: ReturnType<typeof createClient>) {
  const rows: Array<{
    id: string | null;
    name: string | null;
    slug: string | null;
    updated_at: string | null;
    description: string | null;
  }> = [];

  for (let from = 0; from < MAX_PREVIEW_GAMES; from += GAME_PAGE_SIZE) {
    const to = Math.min(from + GAME_PAGE_SIZE - 1, MAX_PREVIEW_GAMES - 1);
    const { data, error } = await supabase
      .from("games")
      .select("id, name, slug, updated_at, description")
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[admin/sitemap] failed to fetch games", { from, to, message: error.message });
      return rows;
    }
    rows.push(...(data ?? []));
    if (!data || data.length < GAME_PAGE_SIZE) break;
  }

  return rows;
}

async function fetchOfferRows(supabase: ReturnType<typeof createClient>) {
  const rows: Array<{
    id: string | null;
    source: string | null;
    game_id: string | null;
    game_slug: string | null;
    payout_usd: number | string | null;
    total_payout_usd: number | string | null;
    updated_at: string | null;
  }> = [];

  for (let from = 0; from < MAX_PREVIEW_OFFERS; from += OFFER_PAGE_SIZE) {
    const to = Math.min(from + OFFER_PAGE_SIZE - 1, MAX_PREVIEW_OFFERS - 1);
    const { data, error } = await supabase
      .from("unified_offers_view")
      .select("id, source, game_id, game_slug, payout_usd, total_payout_usd, updated_at")
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[admin/sitemap] failed to fetch offers", { from, to, message: error.message });
      return rows;
    }
    rows.push(...(data ?? []));
    if (!data || data.length < OFFER_PAGE_SIZE) break;
  }

  return rows;
}

async function fetchTaskRows(
  supabase: ReturnType<typeof createClient>,
  siteOfferIds: string[],
) {
  const rows: Array<{ site_offer_id: string | null }> = [];

  for (let i = 0; i < siteOfferIds.length; i += TASK_PAGE_SIZE) {
    const chunk = siteOfferIds.slice(i, i + TASK_PAGE_SIZE);
    const { data, error } = await supabase
      .from("site_offer_tasks")
      .select("site_offer_id")
      .in("site_offer_id", chunk);

    if (error) {
      console.error("[admin/sitemap] failed to fetch site offer tasks", { from: i, to: i + chunk.length - 1, message: error.message });
      return rows;
    }
    rows.push(...(data ?? []));
  }

  return rows;
}
