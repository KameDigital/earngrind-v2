# Phase 7A Monetization and Traffic Growth Audit

Date: 2026-05-09

Scope: audit only. No production behavior, database writes, indexability rules, canonical rules, sitemap rules, homepage performance, or page designs were changed.

## Current Monetization Map

### `/best-gpt-sites`

- Primary money path: `/best-gpt-sites` -> `buildTrackedPlatformHref(platform, "best_gpt_sites_primary_card")` -> `/go/platform/[slug]?click_location=best_gpt_sites_primary_card&source_context=best_gpt_sites_monetization&platform_name=...`.
- Secondary money path: `/best-gpt-sites` -> `buildTrackedPlatformHref(platform, "best_gpt_sites_secondary_card")` -> `/go/platform/[slug]?click_location=best_gpt_sites_secondary_card&source_context=best_gpt_sites_monetization&platform_name=...`.
- Supporting conversion paths: hero links to `#best-site-offers`, `/guides/best-gpt-sites-to-make-money`, `/reviews`, `/offers`, `/guides`, and `/highest-paying-gpt-games`.
- Offer-table path: `OfferTable` uses `TrackedOutboundLink` for `row.redirectUrl`, which currently comes from `shapePublicOffer()` as `/go/[offerId]`.
- Assessment: this is the cleanest direct platform monetization page. It has tracked platform CTAs and tracked offer CTAs, but the hero top action is mostly comparison-first rather than direct platform-click-first.

### Shared best-offer SEO pages

Routes:

- `/highest-paying-gpt-games`
- `/best-money-making-games`
- `/best-freecash-games`
- `/best-gain-gg-offers`

Money path:

- Page -> `BestOffersPageTemplate` -> `OfferTable` -> `TrackedOutboundLink` -> `/go/[offerId]`.
- Top best-offer block: `location=seo-best-offer`, `sourceContext=seo-page`, text `Start Best Offer`.
- Offer cards: `location=seo-offer-table`, `sourceContext=seo-page`, text `Start Best Offer` or `Start Offer`.
- Internal support links: related SEO page block links to `/best-gpt-sites`, `/highest-paying-gpt-games`, `/best-money-making-games`, and `/guides/how-to-earn`.
- Assessment: these pages are monetized through offer clicks, not platform joins. CTA coverage is solid at top/table level, but the bottom of the shared template is internal-link only, so users who reach the bottom do not get a final payout-led outbound CTA.

### `/games/[slug]`

Money path:

- `/games/[slug]` -> sticky recommended action -> `TrackedOutboundLink` -> `bestOffer.redirectUrl` -> `/go/[offerId]`.
- `/games/[slug]` -> `OfferTable` -> `TrackedOutboundLink` -> `/go/[offerId]`.
- Internal route support: `/games/[slug]` links to `/guides/[slug]`, `/offers`, `/best-gpt-sites?provider=...`, related games, and related guides.
- Assessment: strong top-right sticky CTA and repeated offer-table CTAs. It has good internal routing to guides and platform trust. It lacks a direct bottom CTA after the keep-exploring section.

### `/offers/[slug]`

Money paths:

- Hero best route: `/offers/[slug]` -> `TrackedOutboundLink` with `location=offer-detail-hero`, `sourceContext=offer-detail` -> `/go/[offerId]`.
- Site-offer comparison: `/offers/[slug]` -> `SiteOffersComparison` -> `TrackedOutboundLink` -> `/go/[siteOfferId]`.
- Legacy platform comparison rows: `/offers/[slug]` -> `ComparisonRow` -> `TrackedOutboundLink` -> `offer.redirect_url`.
- Internal support paths: `/offers/[slug]` -> `/guides/[slug]`, `/games/[slug]`, `/review/[slug]`, `/offers`.
- Assessment: this is currently the strongest game-specific money page because it can show both legacy offers and manual `site_offers` with milestone context.

### `/guides/[slug]`

Money-adjacent paths:

- Guide top CTA: `GuideOfferCtaBlock` top placement -> `/games/[slug]` when matched, or `/games/[slug]`/`/offers` fallback.
- Guide mid CTA: same component -> `/games/[slug]` when matched.
- Guide bottom CTA: same component -> `/games/[slug]` when matched.
- Alternative route links in top CTA: `/offers/[slug]`.
- Sidebar CTA: `Compare live offers` -> `/games/[slug]`.
- Internal links block: `/games/[slug]`, `/offers/[slug]`, `/guides`, related guides.
- Important gap: `matchOffersToGuide()` builds `targetUrl: /go/[id]?...`, but `GuideOfferCtaBlock` does not use `best.targetUrl` for the primary button. It sends users to `/games/[slug]` first. That is conservative and useful for education, but it adds another step before revenue.
- Tracking path: `GuidePerformanceTracker` records guide `view`, `cta_click`, `offer_click`, `platform_click`, and `internal_link_click` to `guide_events`.
- Assessment: guides are well instrumented for CTA behavior, but direct revenue capture is intentionally indirect. Good for trust and SEO, weaker for immediate revenue.

### Generated guides

- Generated/published guides use the same `/guides/[slug]` rendering path when they have rows in `guides`.
- The guide offer matcher queries `unified_offers_view` and can find up to five matched offers by game, platform, keyword, and payout.
- Current generated guide CTA buttons route to game/offer comparison pages, not directly to `/go`, even though matched offers include a tracked `targetUrl`.
- Assessment: generated guides can route money through game and offer pages, but they need manual QA for `game_id`, `primary_offer_id`, `disable_auto_offer_matching`, and matched-offer quality.

### Homepage

Money paths:

- Hero CTA: `/offers`.
- Secondary hero CTA: `/guides`.
- "Best first click" internal text: `/best-gpt-sites` and `/guides/best-gpt-sites-to-make-money`; offers/guides are mentioned but not linked in the final sentence.
- EarnLab rail: card href goes to `/games/[slug]`; modal routes use `buildGoHref(offer, "homepage_modal_platform_choice")` or `homepage_modal_single_route`, producing `/go/[offerId]?source_context=homepage_rail_modal`.
- Gain rail: card/modal routes use `/go/platform/gain-gg` with `source_context=homepage_rail_modal`, Gain offer metadata, and a constrained `destination_url` for exact Gain offer starts when the destination host belongs to Gain.
- Bottom CTA: `/offers`.
- Assessment: homepage intentionally routes most visible traffic to offer/game/guide pages. EarnLab modal paths are tracked through `/go/[offerId]`; Gain featured modal starts are tracked through `/go/platform/gain-gg` with useful route attribution.

## Current Tracking Map

### `/go/[offerId]`

Handles both legacy `offers` and manual `site_offers`.

Tracked tables:

- `offer_clicks` for legacy `offers`.
- `site_offer_clicks` for `site_offers`.

Tracked fields:

- `offer_id` or `site_offer_id`
- `platform_id`
- `offer_title`
- `game_title`
- `platform_name`
- `provider_name`
- `payout_usd`
- `total_payout_usd`
- `click_location`
- `source_context`
- `destination_url`
- `affiliate_mode`
- `ip_hash`
- `referrer`
- `country`
- `user_agent`
- `client_hints`
- `user_id`
- `clicked_at`

### `/go/platform/[platformId]`

Handles platform-level affiliate redirects by UUID or slug.

Tracked table:

- `platform_clicks`

Tracked fields:

- `platform_id`
- `platform_name`
- `offer_title`
- `game_title`
- `provider_name`
- `payout_usd`
- `total_payout_usd`
- `click_location`
- `source_context`
- `destination_url`
- `affiliate_mode`
- `ip_hash`
- `referrer`
- `country`
- `user_agent`
- `client_hints`
- `user_id`
- `clicked_at`

### Client-side GA tracking

- `GoogleAnalytics` renders raw `gtag.js` when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is present.
- `@vercel/analytics/react` is mounted in the root layout.
- `TrackedOutboundLink` sends GA events `offer_click` and `outbound_redirect` with offer, game, platform, provider, payout, destination, `click_location`, and `source_context`.
- `/best-gpt-sites` platform CTAs use `TrackedOutboundLink` around `/go/platform/...` hrefs, so they get database tracking through `/go/platform` plus client-side GA `offer_click`/`outbound_redirect` events.

### Guide event tracking

Tracked table:

- `guide_events`

Tracked events:

- `view`
- `cta_click`
- `offer_click`
- `platform_click`
- `internal_link_click`

Tracked fields:

- `guide_id`
- `guide_slug`
- `event_type`
- `target_url`
- `metadata`
- `created_at`

Useful metadata:

- `link_text`
- `cta_variant_id`
- `cta_variant_label`
- `cta_variant`
- `offer_id`
- `platform_id`
- `match_reason`
- `placement`
- `source=guide_page`

## Missing Tracking Events

- Page-level view tracking for `/best-gpt-sites`, `/highest-paying-gpt-games`, `/best-money-making-games`, `/best-freecash-games`, `/best-gain-gg-offers`, `/games/[slug]`, `/offers/[slug]`, `/offers`, and homepage in first-party tables. Vercel/GA may have page views, but no Supabase table joins page views to outbound clicks outside guide pages.
- CTA impression tracking. Current DB tracking records clicks, not whether a CTA was rendered or seen.
- Non-guide internal-link click tracking. Guide pages track internal clicks, but SEO pages, homepage rails, game pages, offer pages, reviews, and nav/footer do not.
- Revenue/conversion postback events. Clicks are tracked, but there is no confirmed signup, conversion, chargeback, EPC, RPM, or provider revenue table in this audit.
- Session-level anonymous visitor ID. `ip_hash`, `user_agent`, and `user_id` exist, but there is no first-party anonymous session ID that connects page view -> CTA click -> outbound click across pages.
- Experiment exposure events for CTA variants outside guides.

## Revenue Intelligence First Slice

New event stream:

- `public.revenue_events` stores forward-looking first-party events for `page_view`, `cta_impression`, `cta_click`, `outbound_click`, and `conversion_postback`.
- The table is intentionally append-only for this slice. Backfill is out of scope.
- Existing `guide_events`, `offer_clicks`, `site_offer_clicks`, `platform_clicks`, and `conversion_events` remain the source-specific tables.

Wired surfaces:

- Homepage page views.
- `/best-gpt-sites` page views and tracked platform CTAs.
- Shared SEO best-offer pages rendered through `BestOffersPageTemplate`.
- `/games/[slug]` page views and existing tracked outbound CTAs.
- `/offers/[slug]` page views and existing tracked outbound CTAs.
- Guide CTA blocks through `GuidePerformanceTracker`.
- `/go/[offerId]`, `/go/platform/[platformId]`, and `/go/earn/[offerId]` record best-effort `outbound_click` events after existing click-table inserts.
- Successful provider postback conversion writes record best-effort `conversion_postback` diagnostics.

Captured fields:

- `route_path`, `route_group`, `entity_type`, entity ids/slugs when known.
- Guide/game/offer/platform/provider identifiers where already available.
- `cta_location`, `source_context`, `target_url`, referrer path, anonymous session key, anonymous visitor key, coarse user agent family, outbound click table/id, and conversion event id.

Privacy boundaries:

- Do not store raw IP addresses in `revenue_events`.
- Do not store full user agents in `revenue_events`.
- Browser events use anonymous `eg_session_id` in `sessionStorage` and `eg_visitor_id` in `localStorage`.
- Retention cleanup is not automated yet; the table is indexed by `occurred_at` so a future cleanup job can delete old rows by date.

Resilience:

- Public tracking uses `/api/revenue-events`; malformed payloads return `400`.
- Browser tracking catches failures and never blocks page render or CTA navigation.
- `/go` revenue events are best-effort after existing click inserts; redirect behavior remains unchanged if revenue event recording fails.
- Production tracking failures are silent. Development logs diagnostics.
- CTA impressions dedupe in `sessionStorage` by event, route, CTA location, target, and entity.

Environment/config:

- Browser/API tracking uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` through the existing server Supabase client.
- Server-side `/go` hooks reuse the current request Supabase client.
- Postback conversion hooks use the existing admin Supabase client already used by postback conversion writes.
- If Supabase public env is missing locally, `/api/revenue-events` returns an accepted skipped response and logs in development.

Admin QA:

- `/app/admin/revenue-intelligence` shows page views, CTA impressions/clicks, outbound clicks, conversion postbacks, CTR by route group and CTA location, provider/platform breakdowns, and a recent event table.
- `node scripts/audit-revenue-intelligence-tracking.mjs` checks route/source_context/click_location wiring.
- `node scripts/test-revenue-event-normalization.mjs` checks event payload normalization and invalid payload rejection.

Rollback:

- Drop-only rollback for this slice: `drop table public.revenue_events;`.
- No existing sitemap, canonical, robots, indexability, click, or conversion table is changed by the new migration.
- If data preservation is required before rollback, export `public.revenue_events` first.

Known gaps:

- No historical page-view or CTA-impression backfill.
- Anonymous session keys are client-generated and are not yet joined to existing click tables unless a `/go` event carries enough source context.
- Postback joins are limited to existing `offer_clicks.click_id` conversion flows.
- Revenue calculations still depend on provider postbacks being configured and firing reliably.
- Funnel-stage tracking for homepage modal opens, offer preview opens, compare-selection actions, filter changes, and "show more" expansions.
- Destination health tracking. Missing destination, direct fallback, platform override, and external URL quality are only observable through redirect logs/click rows after click.

## CTA Coverage Audit

| Route group | Top CTA | Mid CTA | Bottom CTA | Main target | Current balance |
| --- | --- | --- | --- | --- | --- |
| Homepage | Yes: `Compare Offers`, `Browse Guides` | Yes: rail cards and modal routes | Yes: `Browse Offers - It's Free` | `/offers`, `/guides`, rail `/go` in modal | Well balanced, but mostly routes to internal pages first |
| `/best-gpt-sites` | Yes: compare/live guide/review links | Yes: recommended GPT site cards to `/go/platform/[slug]` | Yes: internal "Keep exploring" links | `/go/platform/[slug]`, `/offers`, `/guides`, `/reviews` | Strong and balanced; direct platform CTAs live mid-page |
| Shared best-offer SEO pages | Yes: best-offer summary CTA from `OfferTable` | Yes: offer-card CTAs in grouped table | Weak: related SEO links only | `/go/[offerId]` | Strong top/mid revenue, weak bottom close |
| `/games/[slug]` | Yes: sticky `Start Highest Payout` | Yes: `OfferTable` CTAs | Weak: keep-exploring is internal only | `/go/[offerId]`, `/guides/[slug]`, `/best-gpt-sites` | Good monetization; add bottom revenue recap later |
| `/offers/[slug]` | Yes: `Start Best Payout` in hero | Yes: comparison rows and `SiteOffersComparison` | Weak: back to all offers only | `/go/[offerId]`, `/go/[siteOfferId]` | Strongest conversion page; bottom close can improve |
| `/guides/[slug]` | Yes: guide CTA block | Yes: guide CTA block + sidebar | Yes: guide CTA block | `/games/[slug]` or `/offers/[slug]`, not direct `/go` | Trust-first, not spammy; revenue is one step removed |
| `/offers` | Header explains value; offer cards contain CTAs | Offer cards and search results | Empty state links | `/go/[offerId]`, `/games/[slug]` | Functional, driven by search UI |
| Admin pages | Not public monetization | N/A | N/A | Internal workflows | Useful tracking/admin surfaces exist |

## Money Page Internal Link Audit

### Stronger internal link coverage

- `/best-gpt-sites`: linked from homepage "Best first click", shared best-offer pages, game pages, reviews, guide how-to-earn pages, sitemap, and header/search-adjacent surfaces.
- `/offers`: linked from homepage hero and bottom CTA, `/best-gpt-sites`, reviews, guides sidebars, offer pages, about, and header.
- `/guides`: linked from homepage, `/best-gpt-sites`, guide internal links, review pages, and header.

### Moderate coverage

- `/highest-paying-gpt-games`: linked from `/best-gpt-sites`, shared template related SEO pages, reviews, guide how-to-earn pages, sitemap.
- `/best-money-making-games`: linked from `/best-gpt-sites`, shared template related SEO pages, sitemap.

### Weak coverage

- `/best-freecash-games`: exists in sitemap and page source, but it is not part of the shared related SEO page block and does not appear in the main homepage path.
- `/best-gain-gg-offers`: same issue as `/best-freecash-games`.

## Best Pages To Monetize First

1. `/best-gpt-sites`
   - Reason: platform-level affiliate intent is explicit and the page already has tracked `/go/platform` paths.
   - Phase 7B focus: add a top direct platform CTA module, preserve comparison trust copy, and add GA tracking parity for platform CTAs.

2. `/offers/[slug]`
   - Reason: highest user intent and strongest payout comparison context.
   - Phase 7B focus: add a bottom "best route recap" CTA and ensure all comparison rows use complete attribution.

3. `/games/[slug]`
   - Reason: search-intent bridge between guide research and offer action.
   - Phase 7B focus: add a bottom payout recap CTA and improve links to `/offers/[slug]` when users want route comparison.

4. `/guides/[slug]`
   - Reason: guides already have view and CTA analytics and are likely long-tail traffic assets.
   - Phase 7B focus: test one direct `/go` variant only for high-confidence matched offers while keeping the default trust-first route to `/games/[slug]`.

5. Shared best-offer SEO pages
   - Reason: they already surface high-payout inventory.
   - Phase 7B focus: add bottom CTA recap and add page-specific `source_context` values instead of generic `seo-page` where useful.

## Highest-Priority Internal Links To Add

- Add `/best-freecash-games` and `/best-gain-gg-offers` to the shared `BestOffersPageTemplate` related SEO links.
- Add `/best-freecash-games` and `/best-gain-gg-offers` to `/best-gpt-sites` "Keep exploring".
- Add a homepage internal link cluster under "Start Smart" that includes `/highest-paying-gpt-games`, `/best-money-making-games`, `/best-freecash-games`, and `/best-gain-gg-offers` without changing hero performance.
- Add route-specific links from `/offers/gain/us` and Gain country/provider pages to `/best-gain-gg-offers`.
- Add route-specific links from Freecash review or platform-filtered offer surfaces to `/best-freecash-games`.
- Add `/offers/[slug]` links from `/games/[slug]` above the fold when comparison data exists, because `/offers/[slug]` has the richer conversion UI.

## Recommended CTA Placements

- `/best-gpt-sites`: add one top "Start top recommended GPT site" CTA when a primary platform is available, using `/go/platform/[slug]` and `click_location=best_gpt_sites_hero_primary`. Keep the current recommendation cards.
- Shared best-offer SEO pages: add a bottom recap after provider comparison: "Start the current best payout" -> best row `/go/[offerId]`, with page-specific `source_context` like `highest_paying_gpt_games`.
- `/games/[slug]`: add bottom recap after keep-exploring: "Start highest payout for [game]" -> best row `/go/[offerId]`.
- `/offers/[slug]`: add bottom recap before back link: "Start best route" -> best available route. This catches users who read comparison details first.
- `/guides/[slug]`: keep top/mid/bottom CTA blocks, but in Phase 7B test direct `/go` only when `matchReason` is `Manual primary offer` or `Best payout match` and payout freshness is acceptable.
- Homepage: keep internal routing but ensure EarnLab and Gain modal route CTAs use `/go` where possible. Do not change homepage performance in Phase 7A.

## Recommended Admin Dashboard Metrics

### Outbound metrics

- Clicks by `source_table`, `outbound_type`, `source_context`, `click_location`, `platform_name`, `provider_name`.
- Clicks by route group: homepage, guide, game, offer detail, best GPT sites, shared SEO pages, review pages.
- Top clicked platform CTAs and offer CTAs by 7d/30d.
- Missing attribution rows: clicks where `click_location`, `source_context`, `platform_name`, `offer_title`, `game_title`, or `provider_name` is null.
- Destination mode split: `affiliate_mode=platform-override`, `destination-placeholder`, `base-template`, `direct`.
- Failed redirect count by error code: `missing_destination`, `not_found`, `invalid_offer_id`, `invalid_platform_id`.

### Guide metrics

- Views, CTA clicks, outbound clicks, internal-link clicks by guide.
- CTA CTR and action CTR by placement: top, mid, bottom, fallback.
- Fallback CTA usage rate.
- Matched-offer quality: `matchReason`, payout, platform, provider, and clicked offer id.
- "CTA clicks but no `/go` clicks" guide list.

### SEO and revenue bridge metrics

- Page views from GA/Vercel joined manually by path to outbound click counts.
- Search Console impressions/clicks/CTR by page cluster.
- Clicks per 100 page views by path.
- Estimated EPC/RPM once affiliate postbacks or manual revenue imports exist.

## Content Clusters For Traffic Growth

- Platform comparison cluster: `best GPT sites`, `best GPT sites that pay instantly`, `best GPT sites for PayPal`, `best GPT sites for games`, `Freecash alternatives`, `Gain.gg alternatives`.
- Site-specific game clusters: `best Freecash games`, `best Gain.gg offers`, `best EarnLab offers`, `best Gemsloot offers`, then pages by country/device where inventory supports it.
- Game-specific payout clusters: `[game] offer`, `[game] GPT payout`, `[game] Freecash`, `[game] Gain.gg`, `[game] offerwall`, `[game] guide`.
- Milestone/how-to clusters: `[game] level 30 guide`, `[game] city hall guide`, `[game] fastest payout`, `[game] offer worth it`.
- Trust/comparison clusters: `[platform] review`, `[platform] legit`, `[platform] payout proof`, `[platform] vs [platform]`.
- Troubleshooting clusters: offer not tracking, pending payout, chargeback risk, task deadlines, device/country eligibility.

## Phase 7B Implementation Plan

1. Add tracking parity and attribution cleanup.
   - Convert `/best-gpt-sites` platform CTAs to a platform-aware tracked link or add GA event tracking without changing the `/go/platform` target.
   - Add source contexts per SEO page instead of only generic `seo-page`.
   - Add warnings/admin view for click rows missing attribution fields.

2. Add bottom revenue recap CTAs.
   - Add one conservative bottom CTA to shared best-offer SEO pages.
   - Add one bottom CTA to `/games/[slug]`.
   - Add one bottom CTA to `/offers/[slug]`.
   - Preserve existing page layouts; no redesign.

3. Strengthen internal links.
   - Add `/best-freecash-games` and `/best-gain-gg-offers` links in related SEO clusters.
   - Add contextual Gain/Freecash links from provider-specific offer pages.
   - Add `/offers/[slug]` links from game pages when comparison data exists.

4. Improve guide monetization carefully.
   - Add a feature-gated direct `/go` CTA variant only for high-confidence matched offers.
   - Keep `/games/[slug]` as default for fallback/low-confidence matches.
   - Track guide CTA target type in `guide_events.metadata`.

5. Add first-party page analytics.
   - Add a read-only-compatible design for `page_events` or `page_views` in a later migration, not Phase 7A.
   - Capture anonymous session id, path, referrer, UTM, country, device class, and timestamp.
   - Join page views to outbound click rows by anonymous session id.

6. Add revenue reporting.
   - Define a manual `affiliate_revenue_events` import table or provider postback endpoint.
   - Report EPC, RPM, revenue by platform/provider/page, and revenue per guide cluster.

7. QA and rollout.
   - Ship one route group at a time.
   - Validate with `npm run typecheck`, `npm run build`, `npm run lint`, and the monetization audit script.
   - Check admin outbound rows after a staging click-through pass.
