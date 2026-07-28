# Offer Data Flow

## Public read model

`unified_offers_view` is the main public read model for offer discovery, homepage rails, offer search, game offer pages, guide related offers, and SEO game indexes.

It normalizes both offer sources into a shared row shape with title, game, platform/site, provider, payout, total payout, goal text, image, and redirectable offer id fields.

## Source tables

`offers` is the legacy ingestion table. It stores older platform-level offer rows and remains the canonical source for legacy imported offers and `/go/[offerId]` redirect resolution when the id belongs to `offers`.

`site_offers` stores the newer site/provider/game comparison model. It represents a GPT site plus offerwall provider plus game route, including `total_payout_usd`, `goal_text`, `image_url`, and direct provider/site destination data. It remains the canonical source for manual/new comparison offers and `/go/[offerId]` redirect resolution when the id belongs to `site_offers`.

`site_offer_tasks` stores milestone/task breakdowns for `site_offers`. Public pages may read this table only to enrich `unified_offers_view` rows with task lists.

## Shared shaping

Use `shapePublicOffer` from `src/lib/public-offers.ts` when converting `unified_offers_view` rows to API payloads. This keeps image fallback, total payout fallback, and `/go/:id` redirect URL behavior consistent.

## Country-aware public browsing

Public offer browsing resolves one effective country on the server before loading `/offers` data:

1. `eg_offer_country` cookie, set only by the country selector route.
2. Trusted Vercel request header `x-vercel-ip-country`.
3. The configured default market, currently `US`.

The `/api/offers` route has one additional, higher-priority input because API callers and client pagination can include a validated `country` query parameter:

1. Explicit supported `country` query parameter.
2. `eg_offer_country` cookie.
3. Trusted Vercel request header `x-vercel-ip-country`.
4. `US`.

Country values are normalized to uppercase two-letter codes and accepted only when they exist in the canonical public country registry from `src/lib/earnlab-countries.ts`. Malformed, unsupported, or unexpected cookie/header values are ignored and the default market is shown instead. Browser language is not used as the primary country signal.

The selector submits a same-origin `POST` to `/api/offers/country`, validates the country against the registry, sets an `eg_offer_country` cookie with `SameSite=Lax`, `HttpOnly`, `path=/`, a long max age, and `Secure` in production, then redirects to `/offers/{country-slug}`. The endpoint reads form data only, rejects unsupported country codes, does not accept client-provided redirect URLs, and does not set cookies through `GET`. Opening an explicit supported country URL takes precedence for that page and does not itself update the cookie.

Generic `/offers` is the personalized entry point and keeps generic metadata, Open Graph tags, structured data, and canonical URL `/offers`. Explicit `/offers/{country-slug}` pages carry country-specific metadata and self-referencing canonicals. Explicit country pages are linked from `/offers` and the sitemap.

Public offer search applies the country at the server/data layer. The RPC receives a sanitized `p_country`, and the compatibility query applies `.contains("countries", [country])` before pagination. Counts and pages are therefore country-scoped. Client filtering and pagination include the country in the request query string; explicit-country API responses are isolated by the `country` query key, while cookie/header-derived API responses are `Cache-Control: private, no-store` and vary by `Cookie, x-vercel-ip-country` to avoid shared cache mixing.

EarnLab country pages remain database-first. They query imported `site_offers` rows for the explicit country, then call the live EarnLab gallery fallback with that same validated country only when imported rows are unavailable. The fallback does not hard-code US and provider credentials remain server-side.

IP-based location is only a routing hint for public browsing convenience. It is not used for authorization, legal eligibility, payments, fraud prevention, or identity.

Local testing:

- Simulate a Vercel country hint with `curl -H "x-vercel-ip-country: GB" http://localhost:3000/api/offers`.
- Simulate a selected market with `curl -H "Cookie: eg_offer_country=CA" http://localhost:3000/api/offers`.
- Test an explicit country query with `curl "http://localhost:3000/api/offers?country=AU&page=1&per_page=4"`.
- Test cookie setting with `curl -i -X POST -H "Origin: http://localhost:3000" -H "Content-Type: application/x-www-form-urlencoded" --data "country=DE" "http://localhost:3000/api/offers/country"`.
