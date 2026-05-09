# Homepage Performance Plan

Phase 6A is an audit and planning pass only. It does not change homepage rendering, database queries, sitemap rules, canonical/noindex metadata, guide templates, or provider import behavior.

## Current Data Flow

`src/app/page.tsx` is an App Router server component with `export const revalidate = 300`. It imports the anonymous Supabase client from `src/lib/supabase/public.ts`, then assembles all homepage data inside `getHomepageData()`.

The homepage currently reads:

- `unified_offers_view`: top offer rows ordered by `total_payout_usd`, `limit(24)`.
- `guides`: published guide rows with joined `games`, ordered by `max_payout_usd`, `limit(6)`.
- `games`: featured game rows by exact `name` match from `FEATURED_GAME_NAMES`.
- `unified_offers_view`: featured game offer candidates using a broad `.or(...ilike...)` filter over `game_name` and `title`, ordered by payout, `limit(200)`.
- `unified_offers_view`: EarnLab candidates using `platform_name = "EarnLab"` plus broad `.or(...ilike...)` filters over `game_name` and `title`, ordered by payout, `limit(120)`.
- `getGainGalleryOffers("native", { country: "US", limit: 24 })`: server-side provider/gallery call during homepage render.
- `site_offer_tasks`: all task rows for every deduped offer ID assembled from the three Supabase offer result sets.
- `guides`: published guide slugs for every deduped game ID assembled from the offer result sets.
- `/api/earnlab/activities`: loaded client-side by `EarnLabActivityRail`, cached in browser localStorage for one hour and via response `s-maxage=3600`.

Client-side homepage components:

- `FeaturedOfferRail` receives fully assembled rail cards and full modal preview payloads.
- `GamePreviewModal` receives all available route/task data for a card up front.
- `EarnLabActivityRail` fetches recent EarnLab activity after hydration and stores it in localStorage.
- `HomepageSectionHeader` and `HomepageLinkCard` are lightweight display components.

Existing cache/revalidate behavior:

- Homepage route revalidates every 300 seconds.
- Gain native fetch uses `next: { revalidate: 1800, tags: ["gain-gallery-native"] }`, but it still runs in the homepage data assembly path when the route is regenerated.
- Gain country lookup uses a cached site settings request.
- EarnLab activity API uses upstream `next.revalidate = 3600` and response `s-maxage=3600, stale-while-revalidate=3600`.
- Supabase reads in `getHomepageData()` are not wrapped in `unstable_cache`; they rely on the page-level ISR revalidate.

## Likely Bottlenecks

1. Broad `.or(...ilike...)` filters for featured games and EarnLab candidates can be expensive on `unified_offers_view`, especially with many aliases and no direct indexed lookup path.
2. The homepage fetches three overlapping offer sets, then dedupes in memory. Duplicate rows still cost query time and payload bytes.
3. Modal route/task data is loaded for every homepage visitor, even if most visitors never open a preview modal.
4. `site_offer_tasks` can become a large follow-up query because it fetches all tasks for every deduped offer ID.
5. Related guide lookup fetches guide mappings for every deduped game ID rather than only visible cards.
6. Gain native gallery is a provider call in the homepage render path. Next fetch caching helps, but route regeneration can still wait on an external service.
7. `getHomepageData()` mixes data access, normalization, rail selection, modal construction, and stats in one server component file, which makes it hard to test and optimize safely.
8. `src/lib/supabase/public.ts` initializes the Supabase client at module scope. It works today, but a lazy getter would be more build-safe and consistent with App Router server patterns.

## Low-Risk Quick Wins

- Move homepage data assembly into `src/lib/homepage-data.ts` without changing behavior. Keep `src/app/page.tsx` focused on rendering.
- Add a small read-only audit script to track homepage row counts, duplicate offer IDs, manual task volume, related guide volume, and Gain native call status.
- Limit modal preview payloads to offers shown in the rails, not every deduped offer candidate used for matching.
- Only show alternative route/task detail in a modal after a user opens it, using a read-only API endpoint keyed by `game_slug` or offer ID.
- Keep EarnLab activity client-side; it is already not blocking the homepage HTML.
- Preserve the route-level `revalidate = 300` until behavior is extracted and tested.

## Medium-Risk Refactors

- Replace broad homepage `.or(...ilike...)` queries with a curated list of featured game IDs/slugs or a read-only DB view that maps homepage slots to offers.
- Wrap stable homepage data assembly in `unstable_cache` with a dedicated cache key and revalidation window, after moving it out of `page.tsx`.
- Create `src/app/api/homepage/offer-preview/[slug]/route.ts` or reuse `/api/offers/game/[slug]` for modal route/task details so the initial HTML only contains visible rail cards.
- Add a minimal homepage data model that separates above-the-fold stats from below-the-fold rails.
- Normalize featured rail data to one query against `unified_offers_view` using known game slugs/IDs rather than alias matching against titles.

## High-Risk Refactors To Avoid For Now

- Do not introduce database migrations or precomputed homepage tables in Phase 6B.
- Do not change offer eligibility, payout normalization, redirect, or `/go` behavior while optimizing the homepage.
- Do not replace the current guide/metadata/indexability logic as part of homepage performance work.
- Do not remove provider/gallery content until there is a tested fallback path.
- Do not rely on provider calls as the only source for homepage content.

## Recommended Phase 6B Implementation Plan

1. Extract `getHomepageData()` and the supporting pure helpers/types from `src/app/page.tsx` into `src/lib/homepage-data.ts`.
2. Preserve current output shape and route rendering. Add no behavior changes in the first refactor commit.
3. Add focused unit-style checks or a read-only script assertion around homepage data counts and modal payload size.
4. Reduce initial modal payload:
   - keep visible rail cards and top route summaries in the homepage HTML;
   - fetch full route/task details lazily when a preview modal opens.
5. Reduce duplicated offer fetches:
   - keep the top offers query;
   - replace broad alias `.or()` queries with either known slugs/IDs or a smaller candidate list.
6. Move Gain featured content behind cached server helper boundaries and keep a fast empty fallback when upstream is unavailable.
7. After those are stable, consider a later DB-backed homepage rail view/table as a separate phase.

## Audit Script

`scripts/audit-homepage-data.mjs` is read-only. It mirrors the current homepage query shape and reports:

- top homepage offer rows fetched;
- featured game offer candidates fetched;
- EarnLab candidate rows fetched;
- deduped offer IDs;
- duplicate offer ID estimate;
- manual task rows fetched;
- related guide rows fetched;
- Gain native provider call status;
- warnings for large payloads.
