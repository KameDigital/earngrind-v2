/** @type {import('next').NextConfig} */
const nextConfig = {
    // Prevent cosmetic ESLint warnings from blocking production builds.
    // TypeScript errors will still fail the build.
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        // Allow external images from any HTTPS source.
        // Game thumbnails and platform logos come from a variety of CDNs.
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },

    // ---------------------------------------------------------------
    // SECURITY HEADERS
    // Applied to every page/route response.
    // ---------------------------------------------------------------
    async headers() {
        const ContentSecurityPolicy = [
            "default-src 'self'",
            // Next.js inline scripts + Supabase JS
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
            // Styles — Next.js injects inline
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            // Fonts
            "font-src 'self' https://fonts.gstatic.com",
            // Images — allow any HTTPS (game thumbnails from varied CDNs)
            "img-src 'self' data: blob: https:",
            // API/auth calls
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
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
