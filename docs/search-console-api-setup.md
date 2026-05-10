# Google Search Console API Setup

Use this setup for the admin SEO Search Console API sync.

1. Enable the Google Search Console API in Google Cloud.
2. Create OAuth Web Application credentials.
3. Add authorized redirect URIs:
   - Local: `http://localhost:3000/api/admin/seo/search-console/oauth/callback`
   - Production: `https://earngrind.com/api/admin/seo/search-console/oauth/callback`
4. Add these env vars to `.env.local` and Vercel:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/admin/seo/search-console/oauth/callback
GOOGLE_SEARCH_CONSOLE_SITE_URL=sc-domain:earngrind.com
```

Use `GOOGLE_SEARCH_CONSOLE_SITE_URL=sc-domain:earngrind.com` for a domain property, or `GOOGLE_SEARCH_CONSOLE_SITE_URL=https://earngrind.com/` for a URL-prefix property.

Restart local dev servers and redeploy after the env vars are added.
