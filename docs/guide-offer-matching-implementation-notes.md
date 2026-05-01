# Guide Offer Matching + CTA Optimization Notes

## Existing CTA and offer logic

- Public guide pages already rendered static layout CTAs that linked to `/offers/{gameSlug}`.
- Guide sidebars already displayed related game offers from `unified_offers_view`, filtered by exact `game_id`, but those sidebar links opened comparison pages instead of tracked `/go/...` offer starts.
- Generated guide bodies could already contain CTA sections, and those generated sections were left untouched.
- Admin guide editing already exposed related offer seed data for draft generation, plus guide analytics and optimization recommendation panels.

## Existing event tracking

- `GuidePerformanceTracker` already logged `view`, `cta_click`, `offer_click`, `platform_click`, and `internal_link_click` to `/api/guide-events`.
- `/api/guide-events` already stored privacy-safe metadata in `guide_events.metadata`.
- `/go/[offerId]` and `/go/platform/[platformId]` already handled outbound redirects and click attribution without requiring new redirect routes.

## Gaps found

- Offer matching was page-local and game-only; there was no centralized matcher that could consider game, title/keyword, platform, payout, recency, or guide click performance.
- Public guide CTAs did not automatically surface the best matched live offer.
- CTA event metadata did not include CTA variant, offer id, platform id, match reason, or placement.
- Admins had no guide-level override to force a primary offer or disable auto matching.
- Guide optimization recommendations did not flag CTA clicks without offer clicks, missing relevant matched offers, or lower-payout routes winning clicks.

## Added

- `src/lib/guide-offer-matcher.ts` centralizes matching, ranking, safe filtering, and `/go/...` target generation.
- `src/app/guides/[slug]/GuideOfferCtaBlock.tsx` renders reusable dynamic CTA blocks with fallback to `/offers`.
- Public guide pages now render dynamic top and bottom CTA blocks and suppress old static layout CTAs to avoid duplicate layout CTAs.
- `GuidePerformanceTracker` now forwards CTA metadata from rendered CTA data attributes.
- Guide admin edit pages now show matched offer performance, current matches, manual primary offer selection, and disable-auto-matching control.
- Guide optimization recommendations now include CTA-click/no-offer-click, no relevant offer match, and lower-payout-winning signals.
- Migration `20260501000400_guide_offer_matching_overrides.sql` adds optional `primary_offer_id` and `disable_auto_offer_matching` guide controls.
