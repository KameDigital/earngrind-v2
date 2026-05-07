import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { analyzeGuideQuality } from '@/lib/guide-quality';
import { getGuideSitemapPriority } from '@/lib/indexing-readiness';
import { getSiteUrl } from '@/lib/site-url';
import { STATIC_GUIDES } from '@/lib/static-guides';

export const revalidate = 3600; // regenerate every hour

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
            .select('slug, updated_at, body_md, seo_title, seo_description, keyword_target')
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
            .select('slug, updated_at')
            .order('updated_at', { ascending: false })
            .limit(500),
    ]);

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        { url: baseUrl,                        lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
        { url: `${baseUrl}/offers`,            lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
        { url: `${baseUrl}/guides`,            lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
        { url: `${baseUrl}/guides/how-to-earn`,lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
        { url: `${baseUrl}/blog`,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
        { url: `${baseUrl}/reviews`,           lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
        { url: `${baseUrl}/best-gpt-sites`,            lastModified: new Date(), changeFrequency: 'daily',   priority: 0.85 },
        { url: `${baseUrl}/highest-paying-gpt-games`,  lastModified: new Date(), changeFrequency: 'daily',   priority: 0.85 },
        { url: `${baseUrl}/best-freecash-games`,       lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
        { url: `${baseUrl}/best-gain-gg-offers`,       lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
        { url: `${baseUrl}/offers/gain/us`,            lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
        { url: `${baseUrl}/offers/gain/us/native`,     lastModified: new Date(), changeFrequency: 'daily',   priority: 0.72 },
        { url: `${baseUrl}/offers/gain/us/revu`,       lastModified: new Date(), changeFrequency: 'daily',   priority: 0.72 },
        { url: `${baseUrl}/offers/gain/us/adtowall`,   lastModified: new Date(), changeFrequency: 'daily',   priority: 0.72 },
        { url: `${baseUrl}/offers/gain/us/asmwall`,    lastModified: new Date(), changeFrequency: 'daily',   priority: 0.72 },
        { url: `${baseUrl}/offers/gain/us/lootably`,   lastModified: new Date(), changeFrequency: 'daily',   priority: 0.72 },
        { url: `${baseUrl}/offers/gain/us/cpx`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.68 },
        { url: `${baseUrl}/offers/gemsloot/us`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
        { url: `${baseUrl}/offers/gemsloot/us/gemsloot`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.72 },
        { url: `${baseUrl}/offers/gemsloot/us/torox`,  lastModified: new Date(), changeFrequency: 'daily',   priority: 0.72 },
        { url: `${baseUrl}/offers/gemsloot/us/revu`,   lastModified: new Date(), changeFrequency: 'daily',   priority: 0.72 },
        { url: `${baseUrl}/offers/gemsloot/us/bitlabs`, lastModified: new Date(), changeFrequency: 'daily',  priority: 0.72 },
        { url: `${baseUrl}/best-money-making-games`,   lastModified: new Date(), changeFrequency: 'daily',   priority: 0.85 },
        { url: `${baseUrl}/about`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
        { url: `${baseUrl}/how-it-works`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ];

    // Dynamic game offer pages
    const gameUrls: MetadataRoute.Sitemap = (games ?? []).map(g => ({
        url:             `${baseUrl}/offers/${g.slug}`,
        lastModified:    new Date(g.updated_at),
        changeFrequency: 'daily' as const,
        priority:        0.85,
    }));

    const seoGameUrls: MetadataRoute.Sitemap = (games ?? []).map(g => ({
        url:             `${baseUrl}/games/${g.slug}`,
        lastModified:    new Date(g.updated_at),
        changeFrequency: 'daily' as const,
        priority:        0.75,
    }));

    const seoGuideUrls: MetadataRoute.Sitemap = (games ?? []).map(g => ({
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

    // Guide pages — highest priority after homepage/offers (they target keywords)
    const guideUrls: MetadataRoute.Sitemap = (guides ?? []).map(g => {
        const quality = analyzeGuideQuality({
            bodyHtml: g.body_md,
            seoTitle: g.seo_title,
            seoDescription: g.seo_description,
            keywordTarget: g.keyword_target,
        });

        return {
            url:             `${baseUrl}/guides/${g.slug}`,
            lastModified:    new Date(g.updated_at),
            changeFrequency: 'weekly' as const,
            priority:        getGuideSitemapPriority(quality.score),
        };
    });

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
        ...guideUrls,
        ...postUrls,
        ...reviewUrls,
    ];
}
