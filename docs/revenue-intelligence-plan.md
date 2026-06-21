# Revenue Intelligence Loop: First Slice Plan

## Scope

Build one normalized first-party event stream that sits beside existing guide events, outbound click tables, and conversion postbacks. This first slice captures new forward-looking data only; no historical backfill.

## Event Taxonomy

`event_name` values:
- `page_view`: a public page rendered in the browser.
- `cta_impression`: a CTA entered the viewport or was rendered in a tracked CTA block.
- `cta_click`: a tracked CTA was clicked before navigation.
- `outbound_click`: a `/go` route completed enough attribution to redirect.
- `conversion_postback`: an existing provider postback produced or linked to a conversion event.

`route_group` values:
- `homepage`
- `best_gpt_sites`
- `seo_best_offers`
- `game`
- `offer`
- `guide`
- `platform_go`
- `offer_go`
- `earn_go`
- `postback`
- `admin`
- `unknown`

Entity types:
- `guide`
- `game`
- `offer`
- `platform`
- `provider`

CTA location naming:
- Lowercase snake_case.
- Use page or module first, then placement, then intent when needed.
- Examples: `homepage_hero_primary`, `best_gpt_sites_primary_card`, `game_bottom_recap`, `offer_detail_hero_panel`.

Required fields:
- `event_name`
- `route_path`
- `route_group`
- `session_key` when recorded from the browser

Optional attribution fields:
- `entity_type`, `entity_id`, `entity_slug`
- `guide_id`, `guide_slug`
- `game_id`, `game_slug`
- `offer_id`, `platform_id`, `platform_slug`
- `provider_id`, `provider_name`
- `cta_location`
- `source_context`
- `target_url`
- `referrer_path`
- `outbound_click_table`, `outbound_click_id`
- `conversion_event_id`
- `metadata`

## Privacy And Resilience

- Do not store raw IP addresses.
- Do not store full user agents. The first slice stores only a coarse user agent family when useful.
- Browser tracking uses anonymous `eg_session_id` and `eg_visitor_id` keys generated client-side.
- Tracking failures must not block rendering, CTA clicks, or `/go` redirects.
- Public tracking should fail silently in production. Development and admin QA surfaces may log diagnostics.
- CTA impressions dedupe in `sessionStorage` by event, route, CTA location, and target.
- Retention is assumed to be handled by scheduled cleanup later; first slice adds indexed timestamps so cleanup can delete old rows by `occurred_at`.

## Implementation Steps

1. Add `revenue_events` migration and indexes with public insert plus admin/editor read policies.
2. Add normalization helpers and `/api/revenue-events` for safe event ingestion when Supabase env exists.
3. Add client helpers for page views, CTA impressions, and CTA clicks.
4. Wire page views and CTA tracking into homepage, `/best-gpt-sites`, shared best-offer pages, `/games/[slug]`, `/offers/[slug]`, and guide CTA blocks via existing tracked outbound components where possible.
5. Record `/go` outbound events after existing click inserts, without changing redirect behavior.
6. Record conversion-postback diagnostic events after existing conversion writes.
7. Add `/app/admin/revenue-intelligence` with summary metrics, CTR breakdowns, provider/platform breakdowns, and recent events.
8. Add scripts for taxonomy/source-context audit and payload normalization checks.
9. Update monetization docs with QA, rollback, env/config, and remaining gaps.

## Acceptance Criteria

- Clicking one CTA from each wired surface produces `cta_click`; where it routes through `/go`, it can also produce `outbound_click`.
- `/go` redirects still complete normally if event recording fails.
- Admin Revenue Intelligence loads with empty states.
- Tracking APIs reject malformed payloads without throwing page-level errors.
- `npm run typecheck` and `npm run build` pass, or unrelated failures are isolated.

## Rollback Notes

- Migration rollback is drop-only for the new table and indexes: `drop table public.revenue_events;`.
- No existing click, guide, sitemap, canonical, robots, or indexability tables are changed by the first slice.
