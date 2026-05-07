# Gemsloot Gallery Import

Gemsloot country/provider gallery pulls live in `src/lib/gemsloot-gallery.ts`.

## Backend Endpoints

The client uses the public Gemsloot gallery endpoints from the server only:

- `GET https://gemsloot.com/_api/offer/providers`
- `POST https://gemsloot.com/_api/offer/list`
- `GET https://gemsloot.com/_api/offer/get_offer/{offerId}`

The list endpoint supports provider, search, OS/device, and pagination. Its `completed_amount` array is aligned with the returned offer rows, so the importer can sort by payout or completion count. The detail endpoint provides country availability, richer task steps, image/video fields, and category/device data.

## Admin Import

The admin route is:

```txt
POST /api/admin/gemsloot/gallery-import
```

Request body:

```json
{
  "country": "US",
  "provider": "Gemsloot",
  "device": "android",
  "limit": 120,
  "sort": "completed",
  "refresh": true
}
```

`provider`, `device`, and `sort` are optional. If `provider` is omitted, the client imports across discovered Gemsloot providers.

The admin UI is on `/app/admin/site-offers` in the Gemsloot gallery import panel.

## Database Behavior

Imports upsert into `site_offers` under the `gemsloot` platform. Dedupe uses the Gemsloot platform, provider, source offer ID, and country:

```txt
gemsloot-{providerSlug}-{offerId}-{country}
```

Task steps are stored in `site_offer_tasks`. Existing rows are updated in place and re-running an import should not create duplicates.

## CTA Behavior

Gemsloot detail responses include advertiser URLs with `CLICKID` placeholders. Those are not used as direct tracking URLs.

Imported `offer_url` stores the safe Gemsloot modal URL when available:

```txt
https://gemsloot.com/earn?modal=offer_2&name={offerId}
```

Public CTAs use `/go/[offerId]`. If a stored `offer_url` exists, `/go/[offerId]` uses it. Otherwise, routing falls back to the Gemsloot platform affiliate redirect.

## Public Pages

Supported public pages:

- `/offers/gemsloot/us`
- `/offers/gemsloot/us/gemsloot`
- `/offers/gemsloot/us/torox`
- `/offers/gemsloot/us/revu`
- `/offers/gemsloot/us/bitlabs`

The pages are database-first and read active imported `site_offers` rows.

## Environment Variables

Optional overrides:

```txt
GEMSLOOT_LIST_URL=https://gemsloot.com/_api/offer/list
GEMSLOOT_PROVIDERS_URL=https://gemsloot.com/_api/offer/providers
GEMSLOOT_DETAIL_URL=https://gemsloot.com/_api/offer/get_offer
GEMSLOOT_SITE_URL=https://gemsloot.com/earn
SUPABASE_SERVICE_ROLE_KEY=...
```

## Caching

Live Gemsloot pulls use Next.js fetch caching with a 30 minute revalidate window unless `refresh` is true. Public pages are powered by imported database rows, so normal SEO rendering does not depend on a live Gemsloot request.

## CashInStyle / EarnInStyle Status

The repo has existing worker sources for CashInStyle, but live CashInStyle wall routes redirect to registration without an authenticated session. Torox API calls return `401` without valid wall/session headers. Build CashInStyle imports only after valid session environment variables are available.
