# Codex Skill: Provider Gallery Ingestion

Use this when adding, reviewing, or refactoring an Earngrind provider gallery importer.

## Inspect First

Read these files before changing code:

- `src/lib/provider-gallery/types.ts`
- `src/lib/provider-gallery/provider-registry.ts`
- `src/lib/provider-gallery/upsert.ts`
- `src/lib/provider-gallery/normalize.ts`
- closest provider client: `src/lib/earnlab-gallery.ts`, `src/lib/gemsloot-gallery.ts`, or `src/lib/gain-gallery.ts`
- closest admin route under `src/app/api/admin/*/gallery-import/route.ts`
- closest admin panel under `src/app/app/admin/site-offers/*GalleryImportPanel.tsx`
- `src/app/go/[offerId]/route.ts`
- `src/lib/outbound.ts`
- `src/lib/offer-quality.ts`
- `src/lib/provider-normalization.ts`

## Required Normalized Fields

Map every provider row into `NormalizedProviderGalleryOffer` with source provider/platform slug, provider display name, source offer ID, country, title, advertiser/game name, slug, category, payout, total payout, image, description, requirements, tasks, devices, countries, and a safe `trackingUrl` or `offerUrl` only when one exists.

Do not include private cookies, bearer tokens, session IDs, or full private API payloads in `rawMetadata`.

## External ID Rules

Use the provider registry for external ID strategy. Keep IDs stable and scoped enough for `site_id + provider_id + external_id`.

Known conventions:

- EarnLab: `{sourceOfferId}-{countryCode}`
- Gemsloot: `gemsloot-{providerSlug}-{sourceOfferId}-{countryCode}`
- Gain: `gain-{wall}-{sourceOfferId}-{countryCode}`

For a new provider, use `platform-provider-source-country` unless preserving an existing production convention.

## Deeplink Rules

Only store real direct offer URLs. The shared sanitizer rejects invalid URLs, image URLs, non-HTTP URLs, and click placeholders.

Provider-specific rules:

- EarnLab has no direct per-offer deeplinks. Preserve existing/manual `offer_url` and let CTAs fall back to the platform affiliate flow.
- Gemsloot advertiser URLs can contain `CLICKID` placeholders. Do not store those. Store only the safe modal URL or leave `offer_url` untouched.
- CashInStyle/EarnInStyle session headers and cookies are server-only env vars. If missing or rejected with `401`, return a clear admin error and do not fake offers.

Never overwrite `offer_url` with null.

## Task Rules

The database allows only:

```txt
install, milestone, purchase, signup, other
```

Normalize everything else through `normalizeGalleryTaskType`. Do not insert `survey`, `registration`, `deposit`, or provider-specific task names directly into `site_offer_tasks.task_type`.

## Admin Route Pattern

Routes should call `requireProviderGalleryEditor`, parse and validate JSON, build provider-specific fetch options, fetch with the provider client, map rows to `NormalizedProviderGalleryOffer`, call `runProviderGalleryAdminImport`, and return provider context, stats, and optional quality report.

Keep provider cookies, auth headers, and session values inside server-only provider client files.

## Admin UI Pattern

Use `ProviderGalleryImportPanel` for new admin import panels. Provider-specific panels should only define controls, request body construction, and quality metric mapping.

## Example Provider Skeleton

```ts
import "server-only";

export async function getExampleGalleryOffers(options: { country: string; limit: number; refresh: boolean }) {
  const session = process.env.EXAMPLE_GALLERY_COOKIE?.trim();
  if (!session) throw new Error("EXAMPLE_GALLERY_COOKIE is required for Example gallery imports.");

  const response = await fetch("https://example.com/backend/gallery", {
    headers: { cookie: session, accept: "application/json" },
    cache: options.refresh ? "no-store" : "force-cache",
  });
  if (response.status === 401) throw new Error("Example gallery credentials are missing or invalid.");
  if (!response.ok) throw new Error(`Example gallery request failed with status ${response.status}`);

  return { offers: [] };
}
```

## Validation

Run:

```txt
npm run lint
npx tsc --noEmit
npm run build
```

If a command fails, record exact output and decide whether the failure is from the new provider-gallery changes or existing unrelated repo state.
