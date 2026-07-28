# EarnLab Country Gallery Pulls

EarnLab country-specific gallery pulls live in `src/lib/earnlab-gallery.ts`.

## Backend Client

Use:

```ts
getEarnLabGalleryTasksByCountry("US")
```

The client calls:

- `GET https://api.earnlab.com/tasks`
- Query params: `country`, `sort`, `page`, `limit`
- Default sort: `POPULARITY`
- Default cache: 30 minutes through Next.js fetch revalidation

Country codes are normalized to uppercase two-letter values by `normalizeEarnLabCountryCode`.

The canonical configured country registry is `EARNLAB_GALLERY_COUNTRIES` in `src/lib/earnlab-countries.ts`. The provider-gallery registry reuses that constant instead of maintaining a second EarnLab list. The configured list is:

```text
US, GB, CA, AU, DE, FR, NL, SE, NO, DK, FI, ES, IT, BR, MX, IN
```

This list is verified as the current repository registry, and every entry is an uppercase two-letter ISO-style code. It should not be read as an independently published EarnLab API country list. The live `GET https://api.earnlab.com/tasks` endpoint requires a `country` parameter and does not expose a supported-country list in its task response. Earlier safe discovery probes such as `/countries`, `/country`, `/tasks/countries`, and `/tasks/country` returned 404 responses, so the all-countries importer uses the local registry above.

## API Route

Public normalized pull:

```text
/api/offers/earnlab/gallery?country=US
```

Optional params:

- `page`
- `limit` up to 75
- `refresh=1` to bypass the fetch cache

The route returns normalized offer/task data and does not expose private headers, cookies, authorization values, or raw backend response payloads.

## Country Pages

Two-letter offer slugs render country pages:

```text
/offers/us
/offers/gb
/offers/ca
/offers/au
```

The page component is `src/components/offers/EarnLabCountryOffersPage.tsx`; routing is handled inside `src/app/offers/[slug]/page.tsx` before falling back to game offer pages.

Public country pages are database-first. They query active imported `site_offers` rows for the selected country and the EarnLab platform. If no imported rows exist, the page falls back to the live EarnLab gallery pull so the page can still render while an import is missing.

Country pages use the explicit `/offers/{country-slug}` value for that request. Unsupported slugs keep the existing invalid-route behavior instead of silently showing US offers. The compact country selector validates same-origin POST selections through `/api/offers/country`, stores `eg_offer_country`, and navigates to the selected country page; crawler navigation to a country URL does not update the cookie by itself.

The page shows `Offers last updated` from the newest imported `ingested_at` or `updated_at` value when imported rows are available.

## Admin Import

Admin import UI:

```text
/app/admin/site-offers
```

The panel calls:

```text
POST /api/admin/earnlab/gallery-import
```

Body:

```json
{
  "country": "US",
  "limit": 50,
  "refresh": true
}
```

Imports use the shared provider-gallery ingestion modules in `src/lib/provider-gallery/*`. They upsert into existing `site_offers` and `site_offer_tasks`. Dedupe uses `sourceId-countryCode` as `external_id`, so the same EarnLab task can exist separately for `US`, `GB`, and other countries.

Single-country and all-countries admin imports are both restricted to the canonical `EARNLAB_GALLERY_COUNTRIES` registry.

The same admin panel also has a `Pull all countries` action. It calls the same endpoint with:

```json
{
  "allCountries": true,
  "limit": 50,
  "refresh": true
}
```

All-countries mode loops the configured registry sequentially with a short delay between countries, currently 750 ms by default. It does not use `Promise.all` or unbounded concurrency, and it does not wait after the final country. It reuses the same per-country fetch and the same `runProviderGalleryAdminImport` / `importProviderGalleryOffers` shared upsert path as single-country imports.

Batch responses use:

```json
{
  "mode": "all-countries",
  "countriesRequested": 16,
  "countriesSucceeded": 16,
  "countriesFailed": 0,
  "delayMs": 750,
  "totals": {
    "fetched": 0,
    "imported": 0,
    "created": 0,
    "updated": 0,
    "skipped": 0,
    "failed": 0
  },
  "results": [
    {
      "country": "US",
      "success": true,
      "fetched": 0,
      "imported": 0,
      "created": 0,
      "updated": 0,
      "skipped": 0,
      "failed": 0
    }
  ]
}
```

The numeric `failed` field remains the shared importer's failed-offer count. Country-level failures are represented separately with `success: false`, `error`, and the top-level `countriesFailed` count. If one country fails, the importer records a sanitized error message, continues to the next country, returns successful country results, and uses HTTP `207` for partial batch failures.

Reruns are idempotent through the existing shared upsert behavior and EarnLab external ID convention:

```text
{sourceOfferId}-{countryCode}
```

Current imports do not erase an existing `site_offers.offer_url` when EarnLab does not return a direct per-offer URL. This preserves future/manual direct URLs while still refreshing payout, image, country, device, and task metadata.

Imports do not delete, deactivate, or broadly clean up existing offers. Optional EarnLab cookies and authorization headers remain server-side environment variables and are not returned by public or admin responses.

For the reusable provider-agnostic architecture, see `docs/provider-gallery-ingestion.md`.

## Environment Variables

Required for admin import:

- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`

Optional EarnLab request settings:

- `EARNLAB_API_BASE`
- `EARNLAB_TASKS_API_URL`
- `EARNLAB_API_USER_AGENT`
- `EARNLAB_API_COOKIE`
- `EARNLAB_API_AUTHORIZATION`

Keep optional cookie/auth values server-side only.

## CTA And Deeplink Status

EarnLab does not currently provide direct per-offer deeplinks in the gallery response. CTAs currently route through the EarnLab platform affiliate redirect/homepage flow.

The data model remains future-ready:

- normalized gallery offers keep `trackingUrl`
- imported `site_offers` keep `offer_url`
- `/go/[offerId]` uses a direct `offer_url` first when one exists
- imports only update `offer_url` when EarnLab returns a non-null direct URL

When EarnLab exposes direct per-offer links later, the importer can store them and the existing redirect route will send users to the direct offer destination.

## Caching

Live EarnLab gallery pulls use Next.js fetch caching with a 30 minute revalidate window unless `refresh` is requested. Public country pages prefer imported database rows, so normal SEO page rendering does not depend only on the live EarnLab API.

Country-specific live fetch cache tags include the country code, for example `earnlab-gallery-US`. Public offer search requests include country as an explicit parameter when fetched from the browser so country results do not share a cache key. The generic `/offers` route keeps generic metadata/canonical tags; country-specific SEO lives on explicit `/offers/{country-slug}` pages, which are linked internally and included in the sitemap.
