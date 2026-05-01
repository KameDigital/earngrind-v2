# Offer Data Flow

## Public read model

`unified_offers_view` is the main public read model for offer discovery, homepage rails, offer search, game offer pages, guide related offers, and SEO game indexes.

It normalizes both offer sources into a shared row shape with title, game, platform/site, provider, payout, total payout, goal text, image, and redirectable offer id fields.

## Source tables

`offers` is the legacy ingestion table. It stores older platform-level offer rows and remains the canonical source for legacy imported offers and `/go/[offerId]` redirect resolution when the id belongs to `offers`.

`site_offers` stores the newer site/provider/game comparison model. It represents a GPT site plus offerwall provider plus game route, including `total_payout_usd`, `goal_text`, `image_url`, and direct provider/site destination data. It remains the canonical source for manual/new comparison offers and `/go/[offerId]` redirect resolution when the id belongs to `site_offers`.

`site_offer_tasks` stores milestone/task breakdowns for `site_offers`. Public pages may read this table only to enrich `unified_offers_view` rows with task lists.

## Shared shaping

Use `shapePublicOffer` from `src/lib/public-offers.ts` when converting `unified_offers_view` rows to API payloads. This keeps image fallback, total payout fallback, and `/go/:id` redirect URL behavior consistent.
