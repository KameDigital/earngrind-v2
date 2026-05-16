import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = getSiteUrl();

    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/guides', '/games', '/review', '/reviews', '/platforms', '/offers', '/blog'],
                disallow: ['/app/admin', '/api/admin', '/go'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
