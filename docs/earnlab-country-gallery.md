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

Country codes are normalized to uppercase two-letter values such as `US`, `GB`, `CA`, and `AU`.

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

Current imports do not erase an existing `site_offers.offer_url` when EarnLab does not return a direct per-offer URL. This preserves future/manual direct URLs while still refreshing payout, image, country, device, and task metadata.

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
