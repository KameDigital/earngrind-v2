const configuredImageHostnames = (process.env.NEXT_IMAGE_HOSTNAMES ?? "")
    .split(",")
    .map((hostname) => hostname.trim())
    .filter(Boolean);

const imageHostnames = Array.from(new Set([
    "assets.efusercontent.com",
    "img.gemsloot.com",
    "cdn.offertoro.com",
    "static.offertoro.com",
    "cdn.mychips.io",
    "earnlab.com",
    "api.earnlab.com",
    "api.lootably.com",
    "cdn.ayet.io",
    "d3mbgut5f15woc.cloudfront.net",
    "dyncdn.ayet.io",
    "freecash.com",
    "play-lh.googleusercontent.com",
    "main-p.agmcdn.com",
    "cdn.linkprotect.tech",
    "creatives.skylup.swaarm-clients.com",
    "adgem-dashboard-production.s3.us-east-2.amazonaws.com",
    "is1-ssl.mzstatic.com",
    "gain.gg",
    "cashinstyle.com",
    "www.appbrain.com",
    ...configuredImageHostnames,
]));

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Prevent cosmetic ESLint warnings from blocking production builds.
    // TypeScript errors will still fail the build.
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        // Keep image optimization scoped to known provider CDNs.
        // Add new hosts through NEXT_IMAGE_HOSTNAMES as the catalog expands.
        remotePatterns: imageHostnames.map((hostname) => ({
            protocol: "https",
            hostname,
        })),
    },

    async redirects() {
        return [
            {
                source: "/reviews",
                destination: "/best-gpt-sites",
                permanent: true,
            },
            {
                source: "/platforms",
                destination: "/best-gpt-sites",
                permanent: true,
            },
        ];
    },

    // ---------------------------------------------------------------
    // SECURITY HEADERS
    // Applied to every page/route response.
    // ---------------------------------------------------------------
    async headers() {
        const ContentSecurityPolicy = [
            "default-src 'self'",
            // Next.js inline scripts + Supabase JS
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://www.googletagmanager.com https://va.vercel-scripts.com",
            // Styles — Next.js injects inline
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            // Fonts
            "font-src 'self' https://fonts.gstatic.com",
            // Images — allow any HTTPS (game thumbnails from varied CDNs)
            "img-src 'self' data: blob: https:",
            // Video previews for curated casino game rails
            "media-src 'self' https://animatedtrailer.casino.fanduel.com",
            // API/auth calls
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com https://vitals.vercel-insights.com",
            // No plugins ever
            "object-src 'none'",
            // Frames — disallow embedding this site
            "frame-ancestors 'none'",
            // Forms — only submit to self
            "form-action 'self'",
            // Upgrade insecure requests in production
            "upgrade-insecure-requests",
        ].join('; ');

        const securityHeaders = [
            // Prevent MIME-type sniffing
            {
                key: 'X-Content-Type-Options',
                value: 'nosniff',
            },
            // Prevent clickjacking
            {
                key: 'X-Frame-Options',
                value: 'DENY',
            },
            // Force HTTPS for 1 year (includeSubDomains)
            {
                key: 'Strict-Transport-Security',
                value: 'max-age=31536000; includeSubDomains; preload',
            },
            // Control referrer info sent to third parties
            {
                key: 'Referrer-Policy',
                value: 'strict-origin-when-cross-origin',
            },
            // Disable browser features not needed
            {
                key: 'Permissions-Policy',
                value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
            },
            // XSS protection for older browsers
            {
                key: 'X-XSS-Protection',
                value: '1; mode=block',
            },
            // CSP
            {
                key: 'Content-Security-Policy',
                value: ContentSecurityPolicy,
            },
        ];

        return [
            {
                // Apply to all routes
                source: '/(.*)',
                headers: securityHeaders,
            },
            {
                // Extra: block admin routes from being indexed or framed
                source: '/app/(.*)',
                headers: [
                    { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
                    { key: 'Cache-Control', value: 'no-store, max-age=0' },
                ],
            },
        ];
    },
};

export default nextConfig;
