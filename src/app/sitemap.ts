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

export const revalidate = 3600; // regenerate every hour

const STATIC_PAGE_LAST_MODIFIED = new Date('2026-05-09T00:00:00.000Z');
const OFFER_PAGE_SIZE = 1000;
const MAX_SITEMAP_OFFERS = 20000;

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
        { data: games },
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
        supabase
            .from('games')
            .select('id, slug, updated_at, description')
            .order('updated_at', { ascending: false })
            .limit(500),
    ]);
    const offers = await fetchSitemapOffers(supabase);

    const offerStats = getEligibleOfferStats(offers ?? []);
    const publishedGuideGameIds = new Set(
        (guides ?? [])
            .map((guide) => guide.game_id)
            .filter((gameId): gameId is string => Boolean(gameId)),
    );
    const duplicateKeywordGuideIds = getDuplicateKeywordGuideIds(guides ?? []);
    const { data: taskRows } = offerStats.eligibleManualOfferIds.length
        ? await supabase
            .from('site_offer_tasks')
            .select('site_offer_id')
            .in('site_offer_id', offerStats.eligibleManualOfferIds)
        : { data: [] };
    const manualOfferIdsWithTasks = new Set(
        (taskRows ?? [])
            .map((task) => task.site_offer_id)
            .filter((siteOfferId): siteOfferId is string => Boolean(siteOfferId)),
    );
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
        staticPage(baseUrl, '/guides', 'weekly', 0.8),
        staticPage(baseUrl, '/guides/how-to-earn', 'weekly', 0.8),
        staticPage(baseUrl, '/blog', 'weekly', 0.7),
        staticPage(baseUrl, '/reviews', 'weekly', 0.7),
        staticPage(baseUrl, '/best-gpt-sites', 'daily', 0.85),
        staticPage(baseUrl, '/highest-paying-gpt-games', 'daily', 0.85),
        staticPage(baseUrl, '/best-freecash-games', 'daily', 0.8),
        staticPage(baseUrl, '/best-gain-gg-offers', 'daily', 0.8),
        staticPage(baseUrl, '/offers/gain/us', 'daily', 0.8),
        staticPage(baseUrl, '/offers/gain/us/native', 'daily', 0.72),
        staticPage(baseUrl, '/offers/gain/us/revu', 'daily', 0.72),
        staticPage(baseUrl, '/offers/gain/us/adtowall', 'daily', 0.72),
        staticPage(baseUrl, '/offers/gain/us/asmwall', 'daily', 0.72),
        staticPage(baseUrl, '/offers/gain/us/lootably', 'daily', 0.72),
        staticPage(baseUrl, '/offers/gain/us/cpx', 'daily', 0.68),
        staticPage(baseUrl, '/offers/gemsloot/us', 'daily', 0.8),
        staticPage(baseUrl, '/offers/gemsloot/us/gemsloot', 'daily', 0.72),
        staticPage(baseUrl, '/offers/gemsloot/us/torox', 'daily', 0.72),
        staticPage(baseUrl, '/offers/gemsloot/us/revu', 'daily', 0.72),
        staticPage(baseUrl, '/offers/gemsloot/us/bitlabs', 'daily', 0.72),
        staticPage(baseUrl, '/best-money-making-games', 'daily', 0.85),
        staticPage(baseUrl, '/about', 'monthly', 0.5),
        staticPage(baseUrl, '/how-it-works', 'monthly', 0.5),
    ];

    // Dynamic game offer pages
    const gameUrls: MetadataRoute.Sitemap = (games ?? [])
        .filter(g => shouldIncludeOfferPageInSitemap(g, offerStats.byGameId.get(g.id) ?? 0).include)
        .map(g => ({
            url:             `${baseUrl}/offers/${g.slug}`,
            lastModified:    new Date(g.updated_at),
            changeFrequency: 'daily' as const,
            priority:        0.85,
        }));

    const seoGameUrls: MetadataRoute.Sitemap = (games ?? [])
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

    const seoGuideUrls: MetadataRoute.Sitemap = (games ?? [])
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

        if (error) return rows;
        rows.push(...(data ?? []));
        if (!data || data.length < OFFER_PAGE_SIZE) break;
    }

    return rows;
}
