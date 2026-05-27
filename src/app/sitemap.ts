import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getGuideSitemapPriority } from '@/lib/indexing-readiness';
import {
    getDuplicateKeywordGuideIds,
    getEligibleOfferStats,
    shouldIncludeGameInSitemap,
    shouldIncludeGeneratedHowToEarnInSitemap,
    shouldIncludeGuideInSitemap,
    shouldIncludeOfferPageInSitemap,
} from '@/lib/sitemap-quality';
import { getSiteUrl } from '@/lib/site-url';
import { STATIC_GUIDES } from '@/lib/static-guides';
import { getPublishedGptSiteGuides } from '@/lib/gpt-site-guides';
import { PUBLIC_GAIN_WALLS } from '@/lib/gain-gallery';

export const revalidate = 3600; // regenerate every hour

const STATIC_PAGE_LAST_MODIFIED = new Date('2026-05-09T00:00:00.000Z');
const GAME_PAGE_SIZE = 1000;
const MAX_SITEMAP_GAMES = 20000;
const OFFER_PAGE_SIZE = 1000;
const MAX_SITEMAP_OFFERS = 20000;
const TASK_PAGE_SIZE = 200;

function staticPage(
    baseUrl: string,
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: number,
): MetadataRoute.Sitemap[number] {
    return {
        url: path === '/' ? baseUrl : `${baseUrl}${path}`,
        lastModified: STATIC_PAGE_LAST_MODIFIED,
        changeFrequency,
        priority,
    };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = getSiteUrl();
    const supabase = createClient();

    // Fetch all published content in parallel
    const [
        { data: guides },
        { data: posts },
        { data: reviews },
    ] = await Promise.all([
        supabase
            .from('guides')
            .select('id, status, slug, updated_at, body_md, seo_title, seo_description, keyword_target, keyword_cluster_id, keyword_intent, needs_variation, game_id')
            .eq('status', 'published')
            .order('updated_at', { ascending: false }),
        supabase
            .from('blog_posts')
            .select('slug, updated_at')
            .eq('status', 'published')
            .order('updated_at', { ascending: false }),
        supabase
            .from('reviews')
            .select('slug, updated_at')
            .eq('status', 'published'),
    ]);
    const [games, offers] = await Promise.all([
        fetchSitemapGames(supabase),
        fetchSitemapOffers(supabase),
    ]);

    const offerStats = getEligibleOfferStats(offers ?? []);
    const publishedGuideGameIds = new Set(
        (guides ?? [])
            .map((guide) => guide.game_id)
            .filter((gameId): gameId is string => Boolean(gameId)),
    );
    const duplicateKeywordGuideIds = getDuplicateKeywordGuideIds(guides ?? []);
    const taskRows = await fetchSitemapTaskRows(supabase, offerStats.eligibleManualOfferIds);
    const manualOfferIdsWithTasks = new Set(
        (taskRows ?? [])
            .map((task) => task.site_offer_id)
            .filter((siteOfferId): siteOfferId is string => Boolean(siteOfferId)),
    );
    const sitemapGames = games.filter(hasSitemapGameFields);
    const gameIdsWithTaskData = new Set(
        (offers ?? [])
            .filter((offer) => offer.source === 'manual' && offer.id && manualOfferIdsWithTasks.has(offer.id))
            .map((offer) => offer.game_id)
            .filter((gameId): gameId is string => Boolean(gameId)),
    );

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        staticPage(baseUrl, '/', 'daily', 1.0),
        staticPage(baseUrl, '/offers', 'daily', 0.9),
        staticPage(baseUrl, '/games', 'weekly', 0.8),
        staticPage(baseUrl, '/guides', 'weekly', 0.8),
        staticPage(baseUrl, '/guides/how-to-earn', 'weekly', 0.8),
        staticPage(baseUrl, '/blog', 'weekly', 0.7),
        staticPage(baseUrl, '/platforms', 'weekly', 0.72),
        staticPage(baseUrl, '/best-gpt-sites', 'daily', 0.85),
        staticPage(baseUrl, '/highest-paying-gpt-games', 'daily', 0.85),
        staticPage(baseUrl, '/best-freecash-games', 'daily', 0.8),
        staticPage(baseUrl, '/best-gain-gg-offers', 'daily', 0.8),
        staticPage(baseUrl, '/offers/gain/us', 'daily', 0.8),
        ...PUBLIC_GAIN_WALLS.map((wall) => staticPage(baseUrl, `/offers/gain/us/${wall}`, 'daily', wall === 'cpx' ? 0.68 : 0.72)),
        staticPage(baseUrl, '/offers/gemsloot/us', 'daily', 0.8),
        staticPage(baseUrl, '/offers/gemsloot/us/gemsloot', 'daily', 0.72),
        staticPage(baseUrl, '/offers/gemsloot/us/torox', 'daily', 0.72),
        staticPage(baseUrl, '/offers/gemsloot/us/revu', 'daily', 0.72),
        staticPage(baseUrl, '/offers/gemsloot/us/bitlabs', 'daily', 0.72),
        staticPage(baseUrl, '/best-money-making-games', 'daily', 0.85),
        staticPage(baseUrl, '/about', 'monthly', 0.5),
        staticPage(baseUrl, '/how-it-works', 'monthly', 0.5),
        staticPage(baseUrl, '/legal/privacy', 'yearly', 0.3),
        staticPage(baseUrl, '/legal/terms', 'yearly', 0.3),
        staticPage(baseUrl, '/legal/disclosure', 'yearly', 0.3),
    ];

    // Dynamic game offer pages
    const gameUrls: MetadataRoute.Sitemap = sitemapGames
        .filter(g => shouldIncludeOfferPageInSitemap(g, offerStats.byGameId.get(g.id) ?? 0).include)
        .map(g => ({
            url:             `${baseUrl}/offers/${g.slug}`,
            lastModified:    new Date(g.updated_at),
            changeFrequency: 'daily' as const,
            priority:        0.85,
        }));

    const seoGameUrls: MetadataRoute.Sitemap = sitemapGames
        .filter(g => shouldIncludeGameInSitemap(g, {
            eligibleOfferCount: offerStats.byGameId.get(g.id) ?? 0,
            hasPublishedGuide: publishedGuideGameIds.has(g.id),
        }).include)
        .map(g => ({
            url:             `${baseUrl}/games/${g.slug}`,
            lastModified:    new Date(g.updated_at),
            changeFrequency: 'daily' as const,
            priority:        0.75,
        }));

    const seoGuideUrls: MetadataRoute.Sitemap = sitemapGames
        .filter(g => shouldIncludeGeneratedHowToEarnInSitemap(g, {
            eligibleOfferCount: offerStats.byGameId.get(g.id) ?? 0,
            hasCuratedGuide: publishedGuideGameIds.has(g.id),
            hasTaskData: gameIdsWithTaskData.has(g.id),
        }).include)
        .map(g => ({
            url:             `${baseUrl}/guides/how-to-earn/${g.slug}`,
            lastModified:    new Date(g.updated_at),
            changeFrequency: 'weekly' as const,
            priority:        0.62,
        }));

    const staticGuideUrls: MetadataRoute.Sitemap = STATIC_GUIDES.map(guide => ({
        url:             `${baseUrl}${guide.href}`,
        lastModified:    new Date(guide.lastModified),
        changeFrequency: 'weekly' as const,
        priority:        guide.sitemapPriority,
    }));

    const publishedGptSiteGuides = getPublishedGptSiteGuides();
    const gptSiteGuideUrls: MetadataRoute.Sitemap = [
        {
            url:             `${baseUrl}/guides/best-gpt-sites`,
            lastModified:    new Date(STATIC_PAGE_LAST_MODIFIED),
            changeFrequency: 'weekly' as const,
            priority:        0.84,
        },
        ...publishedGptSiteGuides.map(guide => ({
            url:             `${baseUrl}/guides/best-gpt-sites/${guide.slug}`,
            lastModified:    new Date(guide.updatedAt),
            changeFrequency: 'weekly' as const,
            priority:        0.78,
        })),
    ];

    // Guide pages — highest priority after homepage/offers (they target keywords)
    const guideUrls: MetadataRoute.Sitemap = (guides ?? [])
        .map(g => ({
            guide: g,
            decision: shouldIncludeGuideInSitemap(g, duplicateKeywordGuideIds),
        }))
        .filter(({ decision }) => decision.include)
        .map(({ guide, decision }) => ({
            url:             `${baseUrl}/guides/${guide.slug}`,
            lastModified:    new Date(guide.updated_at),
            changeFrequency: 'weekly' as const,
            priority:        getGuideSitemapPriority(decision.score),
        }));

    // Blog posts
    const postUrls: MetadataRoute.Sitemap = (posts ?? []).map(p => ({
        url:             `${baseUrl}/blog/${p.slug}`,
        lastModified:    new Date(p.updated_at),
        changeFrequency: 'monthly' as const,
        priority:        0.65,
    }));

    // Reviews
    const reviewUrls: MetadataRoute.Sitemap = (reviews ?? []).map(r => ({
        url:             `${baseUrl}/review/${r.slug}`,
        lastModified:    new Date(r.updated_at),
        changeFrequency: 'monthly' as const,
        priority:        0.7,
    }));

    return [
        ...staticPages,
        ...gameUrls,
        ...seoGameUrls,
        ...seoGuideUrls,
        ...staticGuideUrls,
        ...gptSiteGuideUrls,
        ...guideUrls,
        ...postUrls,
        ...reviewUrls,
    ];
}

type SitemapGameRow = {
    id: string;
    slug: string;
    updated_at: string;
    description: string | null;
};

function hasSitemapGameFields(game: {
    id: string | null;
    slug: string | null;
    updated_at: string | null;
    description: string | null;
}): game is SitemapGameRow {
    return Boolean(game.id?.trim() && game.slug?.trim() && game.updated_at);
}

async function fetchSitemapGames(supabase: ReturnType<typeof createClient>) {
    const rows: Array<{
        id: string | null;
        slug: string | null;
        updated_at: string | null;
        description: string | null;
    }> = [];

    for (let from = 0; from < MAX_SITEMAP_GAMES; from += GAME_PAGE_SIZE) {
        const to = Math.min(from + GAME_PAGE_SIZE - 1, MAX_SITEMAP_GAMES - 1);
        const { data, error } = await supabase
            .from('games')
            .select('id, slug, updated_at, description')
            .order('updated_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('[sitemap] failed to fetch games', { from, to, message: error.message });
            throw new Error(`Failed to fetch sitemap games: ${error.message}`);
        }
        rows.push(...(data ?? []));
        if (!data || data.length < GAME_PAGE_SIZE) break;
    }

    return rows;
}

async function fetchSitemapOffers(supabase: ReturnType<typeof createClient>) {
    const rows: Array<{
        id: string | null;
        source: string | null;
        game_id: string | null;
        game_slug: string | null;
        payout_usd: number | string | null;
        total_payout_usd: number | string | null;
        updated_at: string | null;
    }> = [];

    for (let from = 0; from < MAX_SITEMAP_OFFERS; from += OFFER_PAGE_SIZE) {
        const to = Math.min(from + OFFER_PAGE_SIZE - 1, MAX_SITEMAP_OFFERS - 1);
        const { data, error } = await supabase
            .from('unified_offers_view')
            .select('id, source, game_id, game_slug, payout_usd, total_payout_usd, updated_at')
            .order('updated_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('[sitemap] failed to fetch offers', { from, to, message: error.message });
            throw new Error(`Failed to fetch sitemap offers: ${error.message}`);
        }
        rows.push(...(data ?? []));
        if (!data || data.length < OFFER_PAGE_SIZE) break;
    }

    return rows;
}

async function fetchSitemapTaskRows(
    supabase: ReturnType<typeof createClient>,
    siteOfferIds: string[],
) {
    const rows: Array<{ site_offer_id: string | null }> = [];

    for (let i = 0; i < siteOfferIds.length; i += TASK_PAGE_SIZE) {
        const chunk = siteOfferIds.slice(i, i + TASK_PAGE_SIZE);
        const { data, error } = await supabase
            .from('site_offer_tasks')
            .select('site_offer_id')
            .in('site_offer_id', chunk);

        if (error) {
            console.error('[sitemap] failed to fetch site offer tasks', { from: i, to: i + chunk.length - 1, message: error.message });
            throw new Error(`Failed to fetch sitemap site offer tasks: ${error.message}`);
        }
        rows.push(...(data ?? []));
    }

    return rows;
}
