# Provider Gallery Ingestion

Earngrind imports backend gallery data through a shared provider-gallery ingestion layer instead of route-specific upsert code.

## Shared Modules

- `src/lib/provider-gallery/types.ts`: normalized offer, task, registry, stats, and quality report types.
- `src/lib/provider-gallery/normalize.ts`: country, device, external ID, deeplink, task type, slug, and money normalization.
- `src/lib/provider-gallery/provider-registry.ts`: per-provider platform settings and external ID strategy.
- `src/lib/provider-gallery/upsert.ts`: shared Supabase service client, platform/provider/game creation, `site_offers` upsert, and `site_offer_tasks` replacement.
- `src/lib/provider-gallery/quality.ts`: reusable import quality summary for admin responses.
- `src/lib/provider-gallery/admin-route.ts`: editor auth helper and import runner for App Router admin routes.
- `src/app/app/admin/site-offers/ProviderGalleryImportPanel.tsx`: reusable client component for provider import panels.

Provider clients stay isolated in provider-specific files such as `src/lib/earnlab-gallery.ts`, `src/lib/gemsloot-gallery.ts`, and `src/lib/gain-gallery.ts`.

## Database Model

The importer uses existing tables only: `platforms`, `providers`, `games`, `site_offers`, `site_offer_tasks`, and the existing `/go/[offerId]` redirect path that records `site_offer_clicks`.

No migration is required. Dedupe is based on the existing `site_offers` unique key:

```txt
site_id + provider_id + external_id
```

## Normalized Offer Shape

Every provider route maps raw gallery rows into `NormalizedProviderGalleryOffer`:

```ts
{
  sourceProviderSlug: "torox",
  sourcePlatformSlug: "gain-gg",
  providerDisplayName: "Torox",
  sourceOfferId: "12345",
  countryCode: "US",
  title: "Game offer title",
  advertiserGameName: "Game Name",
  slug: "game-name",
  category: "Game",
  payoutUsd: 12.34,
  totalPayoutUsd: 50,
  imageUrl: "https://...",
  description: "...",
  shortDescription: "...",
  requirements: ["Reach level 20"],
  tasks: [{ title: "Reach level 20", rewardAmount: 12.34, taskType: "milestone" }],
  devices: ["Android", "iOS"],
  countries: ["US"],
  trackingUrl: "https://safe-direct-url.example",
  rawMetadata: { source: "gain", wall: "native" }
}
```

Raw metadata is for server-side debugging and external ID decisions. It must not include private cookies, authorization headers, or full private API payloads.

## Upsert Behavior

`importProviderGalleryOffers` ensures the platform, provider, and game exist, builds a stable `external_id`, upserts `site_offers`, replaces ordered `site_offer_tasks`, and returns `{ fetched, imported, created, updated, skipped, failed }`.

Task types are constrained to DB-supported values:

```txt
install, milestone, purchase, signup, other
```

Provider task values such as `survey` are normalized before insert.

## External ID Rules

External IDs must be deterministic and rerun-safe:

- EarnLab: `{sourceOfferId}-{countryCode}`.
- Gemsloot: `gemsloot-{providerSlug}-{sourceOfferId}-{countryCode}`.
- Gain.gg: `gain-{wall}-{sourceOfferId}-{countryCode}`.
- New providers: prefer `platform-provider-source-country` unless a stronger existing convention is already public.

Do not use offer title alone as the external ID. Titles drift and collide.

## Deeplink And Affiliate Safety

Imports only update `site_offers.offer_url` when a provider returns a real safe HTTP URL. The shared sanitizer rejects missing URLs, image URLs, non-HTTP protocols, `CLICKID` placeholders, `{clickid}` placeholders, `[clickid]` placeholders, and placeholder values like `offer_id`.

If no safe direct URL exists, the importer preserves the existing `offer_url`. This matters for manual links and future direct links.

Provider-specific behavior:

- EarnLab does not currently provide direct per-offer deeplinks. CTAs fall back through the EarnLab platform affiliate route and imports do not erase future/manual `offer_url` values.
- Gemsloot may return advertiser URL templates with `CLICKID` placeholders. Those are not stored. The importer can store the safe Gemsloot modal URL.
- Gain walls vary. Direct URLs are stored only when the wall returns a safe URL.
- CashInStyle/EarnInStyle authenticated gallery cookies, tokens, and session headers must stay server-only in env vars.

Existing `/go/[offerId]` behavior remains unchanged: it uses a stored direct `offer_url` when present and otherwise falls back to platform affiliate handling.

## Admin Route Pattern

Each provider route should only handle auth, request validation, provider fetch options, normalization, import, and response shape.

```ts
const config = getProviderGalleryConfig("cashinstyle");

export async function POST(req: NextRequest) {
  const auth = await requireProviderGalleryEditor();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const country = normalizeGalleryCountryCode(String(body.country ?? "US"));
  if (!country) return NextResponse.json({ error: "country must be a two-letter country code" }, { status: 400 });

  const gallery = await getCashInStyleGalleryOffers({ country, refresh: body.refresh !== false });
  const result = await runProviderGalleryAdminImport({
    config,
    offers: gallery.offers.map(toNormalizedCashInStyleOffer),
    loggerPrefix: "admin/cashinstyle/gallery-import",
  });

  return NextResponse.json({ countryCode: country, stats: result.stats });
}
```

If the provider blocks unauthenticated access or returns `401`, do not fake rows. Return a clear admin error that credentials or session env vars are missing or invalid.

## Admin UI Pattern

Use `ProviderGalleryImportPanel` for country, limit, provider/network filter, device filter, sort, refresh behavior, stats, errors, quality metrics, and optional batch rows.

Provider-specific panels should keep only provider controls and request body mapping.

## Adding A New Provider

1. Inspect `src/lib/provider-gallery/*`, the closest provider client, and the route/panel for EarnLab, Gemsloot, or Gain.
2. Add a provider config in `src/lib/provider-gallery/provider-registry.ts`.
3. Create a server-only provider client in `src/lib/{provider}-gallery.ts`.
4. Normalize raw rows to `NormalizedProviderGalleryOffer`.
5. Add `src/app/api/admin/{provider}/gallery-import/route.ts`.
6. Add or configure an admin panel using `ProviderGalleryImportPanel`.
7. Document env vars and known limitations.
8. Run `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

## Do Not Rules

- Do not expose private cookies, auth headers, or session values client-side or in public API responses.
- Do not store `CLICKID` placeholder advertiser URLs as direct tracking URLs.
- Do not overwrite `offer_url` with null or a placeholder.
- Do not create duplicate offers on rerun.
- Do not add unsupported `site_offer_tasks.task_type` values.
- Do not make SEO/public pages depend only on live provider APIs.
- Do not delete existing offers as part of gallery imports.
- Do not add migrations unless the existing table model cannot represent required data.

## Validation Checklist

- Re-running the same import creates zero duplicate `site_offers` rows.
- `site_offers.external_id` matches the registry strategy.
- `site_offers.offer_url` is updated only for safe direct URLs.
- Existing/manual `offer_url` survives missing deeplinks.
- `site_offer_tasks.task_type` contains only DB-supported values.
- Public pages use imported database rows first.
- Admin errors are clear for missing or invalid provider credentials.
- Lint, typecheck, and build results are recorded.
