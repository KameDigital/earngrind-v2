# Gain Gallery Import

Gain gallery pulls live in `src/lib/gain-gallery.ts`.

Supported Gain wall sources:

- `native`: Gain's public `https://gain.gg/api/v2/offers` endpoint. Current public data is Torox-backed and includes featured offers, normal offers, images, platforms, rewards, and task lists when available.
- `revu`: Gain's Revenue Universe wall using the RevU profile response and returned `offers_url`.
- `adtowall`: Gain's AdToWall wall HTML at `https://adtowall.com/5753/gainid-sync-sync`.
- `mychips`: bootstraps the Gain MyChips wall URL, then calls the MyChips campaigns API when a valid `click_id` is returned.
- `cpx`: CPX Research survey API.
- `asmwall`: ASMWall direct offers JSON.
- `lootably`: embedded Lootably offer data from the wall page.
- `timewall`, `grabcherries`, `adgate`, `ayet`, `polltastic`, `theoremreach`, `primeearn`, and `bitlabs`: registered as selectable shell sources. They are fetched for availability checks but currently return zero imported rows until a safe provider-specific parser is added.

Admin imports are handled by:

```txt
POST /api/admin/gain/gallery-import
```

Example body:

```json
{
  "wall": "native",
  "country": "US",
  "limit": 100,
  "refresh": true
}
```

Batch import for the proven live row sources:

```json
{
  "batch": true,
  "country": "US",
  "refresh": true
}
```

Batch mode imports, in order:

```txt
native, revu, adtowall, asmwall, lootably, cpx
```

It uses a default limit of 300 for offer/game walls and 50 for CPX surveys. The response includes per-wall stats, aggregate totals, and a quality report covering row counts by wall/provider/country/status, missing images, low payouts, missing tasks, duplicate external IDs, and broken game slugs.

The admin UI is on `/app/admin/site-offers` in the Gain.gg gallery import panel. The site offers table also supports Gain-specific filtering by wall/provider/country/category/device, image/direct URL availability, minimum payout, and sorting.

Imports upsert into `site_offers` and `site_offer_tasks`. Dedupe uses:

```txt
gain-{wall}-{sourceId}-{countryCode}
```

This lets each Gain wall keep separate rows even when titles overlap.

Gain's native public API does not appear to honor a simple country query parameter. The importer stores the selected country code for organization and SEO/database filtering, but native availability is based on Gain's request/session geography. RevU returns a profile country. AdToWall exposes `geo` in its wall state.

CTA behavior:

- RevU, ASMWall, and some Lootably offers can return direct tracking URLs, so `offer_url` is updated when present.
- Native Gain and AdToWall usually do not expose direct per-offer tracking links in the public gallery response.
- Imports only update `site_offers.offer_url` when a non-null direct URL is returned. Existing/manual direct URLs are preserved.
- `/go/[offerId]` will use `offer_url` first when present, otherwise it falls back to the Gain.gg platform affiliate redirect.

Public pages:

- `/offers/gain/us` shows active imported Gain rows for the United States.
- `/offers/gain/us/[wall]` filters to a specific Gain wall.
- Pages are database-first and do not call live wall APIs during public rendering.
- CTAs use `/go/[offerId]`, preserving direct `offer_url` where available and falling back to the Gain.gg affiliate redirect.

Caching:

- Gallery client requests use Next.js `fetch` cache with 30 minute revalidation by default.
- Admin imports send `refresh: true`, which uses `no-store`.

Environment variables:

- `GAIN_API_URL` optional override for the native Gain offer API.
- `GAIN_API_USER_AGENT` optional request user agent override.
- `GAIN_REVU_PROFILE_URL` optional RevU profile endpoint override.
- `GAIN_REVU_WALL_ID` optional RevU wall id, defaults to `307`.
- `GAIN_REVU_UID` optional RevU uid, defaults to `gainid-sync-sync`.
- `GAIN_REVU_TYPE`, `GAIN_REVU_OS`, `GAIN_REVU_VERSION` optional RevU profile params.
- `GAIN_ADTOWALL_URL` optional AdToWall source URL override.
- `GAIN_MYCHIPS_WALL_URL` optional MyChips bootstrap URL override.
- `GAIN_MYCHIPS_API_URL` optional MyChips campaigns API override.
- `GAIN_CPX_SURVEYS_URL` optional CPX survey API override.
- `GAIN_ASMWALL_OFFERS_URL` optional ASMWall offers API override.
- `GAIN_LOOTABLY_URL` optional Lootably wall URL override.
- `SUPABASE_SERVICE_ROLE_KEY` is required for admin imports.
