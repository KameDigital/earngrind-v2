# SEO Page Roles and Indexing Plan

Phase: 2 audit and documentation only.

This document maps current route behavior and recommends later-phase SEO roles. It does not implement canonical, noindex, sitemap, query, or route behavior changes.

## Preflight

Phase 1 markers were present before this document was added:

- `package.json` includes `"typecheck": "tsc --noEmit"`.
- `src/components/layout/Header.tsx` includes `/best-gpt-sites` in `NAV_LINKS`.
- `.github/workflows/ci.yml` exists.
- `src/app/sitemap.ts` uses `STATIC_PAGE_LAST_MODIFIED` and `staticPage(...)` for static sitemap entries.

## Current Global SEO Controls

- `src/app/layout.tsx` sets global `metadataBase`, default title template, default Open Graph and Twitter images, and global `robots: { index: true, follow: true }`.
- `src/app/robots.ts` allows `/`, `/guides`, `/games`, `/review`, `/reviews`, `/offers`, and `/blog`; it disallows `/app/admin`, `/api/admin`, and `/go`.
- `src/app/sitemap.ts` currently includes the homepage, selected static SEO pages, `/offers`, `/guides`, `/guides/how-to-earn`, `/blog`, `/reviews`, provider landing pages, `/offers/[game-slug]`, `/games/[game-slug]`, `/guides/how-to-earn/[game-slug]`, static guides, curated `/guides/[slug]`, `/blog/[slug]`, and `/review/[slug]`.
- `src/lib/guide-quality.ts`, `src/lib/indexing-readiness.ts`, `src/lib/keyword-cannibalization.ts`, `src/lib/structured-data-check.ts`, and `src/lib/seo-metadata-tools.ts` already provide guide scoring, duplicate keyword checks, structured-data checks, and metadata analysis helpers.
- `src/lib/seo-schema.tsx` provides `JsonLd`, `BreadcrumbList`, `ItemList`, `FAQPage`, `Organization`, and `Review` schema helpers.

## Current Route Inventory

| Route group | Route pattern | Page purpose | Likely keyword/search intent | Source type | Current sitemap | Metadata | Canonical | Robots metadata | Structured data | Main conversion path |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | `/` | Broad discovery hub for GPT offers, games, guides, and GPT sites | "highest paying GPT offers", "best GPT sites", "game guides" | Database-backed ISR, `revalidate = 300` | Included as static page | Static `metadata` | Yes, `/` | Inherits global index/follow | No route-level JSON-LD found | Links to `/best-gpt-sites`, `/offers`, `/guides`, game/offer rails |
| Offers hub | `/offers` | Live offer search and filtering UI | "high paying offers", "compare GPT offers", "offerwall offers" | Client search shell backed by offer APIs | Included as static page | Static `metadata` | No route-level canonical | Inherits global index/follow | No route-level JSON-LD found | Offer cards and outbound offer routes |
| Game offer conversion | `/offers/[slug]` | Live comparison/conversion page for one game or EarnLab country slug | "[game] offers", "[game] payout", "EarnLab offers [country]" | API-backed, fetches `/api/offers/game/[slug]`, `revalidate = 120`; special EarnLab country branch | Included for all `games.slug` as `/offers/[slug]` | `generateMetadata` | Yes, absolute `/offers/[slug]` or `/offers/[country]` | Inherits global index/follow | BreadcrumbList and ItemList | `TrackedOutboundLink`, provider comparison, related reviews, `/go` clickouts |
| Gain country offers | `/offers/gain/us` | Provider/platform country landing page | "Gain.gg offers United States" | Dynamic provider gallery, `force-dynamic` | Included as static page | Static `metadata` | Yes, `/offers/gain/us` | Inherits global index/follow | No route-level JSON-LD found | Gain offer cards/clickouts |
| Gain wall offers | `/offers/gain/us/[wall]` | Wall-specific Gain offer listing | "Gain.gg [wall] offers" | Dynamic provider gallery, `force-dynamic`, generated params from known walls | Selected wall URLs manually included in sitemap | `generateMetadata` | Yes, `/offers/gain/us/[wall]` | Inherits global index/follow | No route-level JSON-LD found | Gain wall offer cards/clickouts |
| Gemsloot country offers | `/offers/gemsloot/us` | Provider/platform country landing page | "Gemsloot offers United States" | Dynamic provider gallery, `force-dynamic` | Included as static page | Static `metadata` | Yes, `/offers/gemsloot/us` | Inherits global index/follow | No route-level JSON-LD found | Gemsloot offer cards/clickouts |
| Gemsloot provider offers | `/offers/gemsloot/us/[provider]` | Provider-specific Gemsloot offer listing | "Gemsloot [provider] offers" | Dynamic provider gallery, `force-dynamic`, generated params from known providers | Selected provider URLs manually included in sitemap | `generateMetadata` | Yes, `/offers/gemsloot/us/[provider]` | Inherits global index/follow | No route-level JSON-LD found | Gemsloot provider offer cards/clickouts |
| Games hub | `/games` | Index of tracked games and payout opportunities | "GPT games", "offerwall games", "money making games" | Database-backed server page plus client UI | Not currently included in sitemap | Static `metadata` | Yes, `/games` | Inherits global index/follow | No route-level JSON-LD found | Links to `/games/[slug]`, `/offers/[slug]`, and guides |
| Game SEO landing | `/games/[slug]` | SEO landing page for one game's best offers and provider routes | "best [game] offers", "[game] GPT offer", "[game] offerwall payout" | Generated ISR from offer APIs, `revalidate = 1800`, `generateStaticParams` top slugs | Included for all `games.slug` | `generateMetadata` via `buildSeoMetadata` | Yes, via `buildSeoMetadata` path | Inherits global index/follow | BreadcrumbList and ItemList | Recommended action links to `/offers/[slug]`, provider rows, guide links |
| Guides hub | `/guides` | Index page for curated strategy guides | "game guides", "offerwall game guide", "GPT game strategy" | Database-backed guide listing plus `STATIC_GUIDES` | Included as static page | Static `metadata` | No route-level canonical | Inherits global index/follow | No route-level JSON-LD found | Links to curated `/guides/[slug]` and guide clusters |
| Curated guide detail | `/guides/[slug]` | Hand-written strategy/completion guide detail | "[game] guide", "[game] completion guide", "[game] offerwall guide" | Database-backed published guide page; redirects selected old slugs | Included for published guides | `generateMetadata` | Yes, absolute `/guides/[slug]` after redirect mapping | Inherits global index/follow | `GuideJsonLd` | Offer CTA block, related offers, related guides |
| Static curated guide | `/guides/fanduel-casino-review-bonus` | Hand-authored editorial guide/review page | "FanDuel Casino review", "FanDuel Casino bonus" | Static route | Included through `STATIC_GUIDES` | Static `metadata` | Yes, absolute `PAGE_URL` | Inherits global index/follow | Inline Article JSON-LD | Affiliate/offer CTA sections |
| Generated guide hub | `/guides/how-to-earn` | Hub for generated game-specific earning guides | "how to earn with game offers" | Generated from top offers, `revalidate = 3600` | Included as static page | Static `metadata` via `buildSeoMetadata` | Yes, via `buildSeoMetadata` path | Inherits global index/follow | No route-level JSON-LD found | Links to `/guides/how-to-earn/[slug]` |
| Generated guide detail | `/guides/how-to-earn/[slug]` | Generated support guide from offer and milestone data | "how to earn with [game]", "[game] payout guide" | Generated ISR from offer APIs, `revalidate = 3600`, `generateStaticParams` top slugs | Included for all `games.slug` | `generateMetadata` via `buildSeoMetadata` | Yes, via `buildSeoMetadata` path | Inherits global index/follow | BreadcrumbList and ItemList | Links to `/games/[slug]`, `/offers/[slug]`, offer table, GPT hubs |
| Blog hub | `/blog` | Editorial article index | "offerwall strategies", "GPT earning tips" | Database-backed ISR, `revalidate = 120` | Included as static page | Static `metadata` | No route-level canonical | Inherits global index/follow | No route-level JSON-LD found | Links to `/blog/[slug]` and internal offers/guides |
| Blog detail | `/blog/[slug]` | Editorial article detail | Article-specific informational intent | Database-backed ISR, `revalidate = 120` | Included for published blog posts | `generateMetadata` | Current scan indicates generated metadata; confirm canonical during Phase 3 cleanup | Inherits global index/follow | `BlogJsonLd` | Internal links, contextual offer/guide links |
| Reviews hub | `/reviews` | Index of GPT site reviews | "GPT site reviews", "compare GPT sites", "trustworthy GPT sites" | API-backed ISR, `revalidate = 120` | Included as static page | Static `metadata` | No route-level canonical | Inherits global index/follow | No route-level JSON-LD found | Links to `/review/[slug]` and filtered `/offers` |
| Review detail | `/review/[slug]` | Platform review detail | "[platform] review", "is [platform] legit", "[platform] payout review" | API-backed ISR, `revalidate = 120` | Included for published reviews | `generateMetadata` | Yes, absolute `/review/[slug]` | Inherits global index/follow | Organization, Review, BreadcrumbList | Platform affiliate `/go/platform/[id]`, filtered `/offers` |
| Best GPT sites | `/best-gpt-sites` | Curated comparison landing page for GPT platforms | "best GPT sites", "best paid survey apps", "GPT sites that pay" | Hybrid: offer API plus reviews query, `revalidate = 3600` | Included as static page | Static `metadata` via `getBestPageMetadata` | Yes, via `buildSeoMetadata` path | Inherits global index/follow | BreadcrumbList and ItemList | Platform affiliate links, review links, offer links |
| Highest paying GPT games | `/highest-paying-gpt-games` | Curated offer list for high-payout games | "highest paying GPT games", "best paying game offers" | Generated from offer API, `revalidate = 3600` | Included as static page | Static `metadata` via `getBestPageMetadata` | Yes, via `buildSeoMetadata` path | Inherits global index/follow | Likely shared best-page components; confirm per route before schema changes | Links to game/offer comparison pages |
| Best Freecash games | `/best-freecash-games` | Platform-filtered curated offer page | "best Freecash games", "Freecash game offers" | Generated from offer API filtered by platform/provider config, `revalidate = 3600` | Included as static page | Static `metadata` via `getBestPageMetadata` | Yes, via `buildSeoMetadata` path | Inherits global index/follow | Likely shared best-page components; confirm per route before schema changes | Links to game/offer comparison pages |
| Best Gain.gg offers | `/best-gain-gg-offers` | Platform-filtered curated offer page | "best Gain.gg offers", "Gain.gg game offers" | Generated from offer API filtered by platform/provider config, `revalidate = 3600` | Included as static page | Static `metadata` via `getBestPageMetadata` | Yes, via `buildSeoMetadata` path | Inherits global index/follow | Likely shared best-page components; confirm per route before schema changes | Links to game/offer comparison pages |
| Best money making games | `/best-money-making-games` | Curated broad list for money-making game intent | "best money making games", "games that pay money" | Generated from offer API, `revalidate = 3600` | Included as static page | Static `metadata` via `getBestPageMetadata` | Yes, via `buildSeoMetadata` path | Inherits global index/follow | Likely shared best-page components; confirm per route before schema changes | Links to game/offer comparison pages |
| Redirect/tracking utility | `/go/[offerId]`, `/go/platform/[platformId]` | Outbound redirect and click tracking | No search intent; should not rank | Route handlers, `force-dynamic`, 302 redirect | Not included | No page metadata | Not applicable | Disallowed in `robots.ts` | None | Redirects to outbound offer/platform URL |
| Admin/private app | `/app/**`, `/admin/guides/batch-generate`, `/api/admin/**` | Authenticated internal tools, admin SEO tools, ingestion/admin APIs | No public search intent | Auth/database-backed, mostly dynamic or protected | Not included | Mixed admin titles | No public canonical strategy | `/app/admin` and `/api/admin` disallowed; `/app/account` and `/app/dashboard` are protected by app layout but not explicitly disallowed | None intended | Internal authenticated workflows |
| API support routes | `/api/offers`, `/api/offers/game/[slug]`, `/api/guides`, `/api/reviews`, etc. | JSON data sources for public pages | No direct search intent | Route handlers | Not included | Not applicable | Not applicable | Public API routes not disallowed except `/api/admin` | None | Feed public route rendering |
| Legal/about/support | `/about`, `/how-it-works`, `/legal/privacy`, `/legal/terms`, `/legal/disclosure`, `/privacy`, `/terms` | Trust, legal, and support pages | Brand/trust/legal queries | Mostly static | `/about` and `/how-it-works` included; legal/privacy/terms/disclosure mostly not included; `/terms` redirects | Static metadata on most pages | Mixed; `/terms` redirects to `/legal/terms` | Some explicit index/follow | None found | Trust building, legal compliance |

## Recommended SEO Roles

| Route pattern | Recommended role | Why |
| --- | --- | --- |
| `/` | Index page/hub | Broad entry point that should distribute authority to offers, games, guides, and GPT site comparison pages. |
| `/offers` | Conversion/comparison page | Best for users ready to filter live offers and click into routes. It is more transactional than editorial. |
| `/offers/[slug]` | Conversion/comparison page | Should convert users with live provider routes and payout data. It can rank for some long-tail terms but should not be the main ranking page for broad game-offer intent when `/games/[slug]` exists. |
| `/offers/gain/us`, `/offers/gain/us/[wall]`, `/offers/gemsloot/us`, `/offers/gemsloot/us/[provider]` | Conversion/comparison page | Provider/platform slices are useful for users already choosing Gain or Gemsloot, but they are not the canonical game-intent pages. |
| `/games` | Index page/hub | Hub for game-level SEO pages and game discovery. |
| `/games/[slug]` | Primary SEO landing page | Main target for "best [game] offers", "[game] GPT offer", "[game] offerwall payout", and provider route comparison intent. |
| `/guides` | Index page/hub | Guide directory that should surface curated editorial strategy guides. |
| `/guides/[slug]` | Curated editorial guide | Main target for hand-written strategy, completion, ROI, no-spend, not-crediting, or milestone-guide intent. |
| `/guides/fanduel-casino-review-bonus` | Curated editorial guide | Hand-authored editorial page with its own topic and affiliate conversion path. |
| `/guides/how-to-earn` | Index page/hub | Generated guide hub. Keep useful as discovery, but avoid letting it compete with `/guides`. |
| `/guides/how-to-earn/[slug]` | Generated support page | Useful if unique and complete; otherwise should support `/games/[slug]` or the best curated `/guides/[slug]` page. |
| `/blog`, `/blog/[slug]` | Curated editorial guide | Informational content that should support internal linking into offers, games, guides, and reviews. |
| `/reviews` | Index page/hub | Review directory and trust hub for platform research. |
| `/review/[slug]` | Curated editorial guide | Main target for platform-specific review, legitimacy, trust, payout quality, and UX intent. |
| `/best-gpt-sites` | Primary SEO landing page | Main page for "best GPT sites" and platform comparison intent. |
| `/highest-paying-gpt-games`, `/best-freecash-games`, `/best-gain-gg-offers`, `/best-money-making-games` | Primary SEO landing page | Curated list pages for category/platform modifiers. These should rank for list/comparison terms and pass users into game/offers pages. |
| `/go/**` | Utility/redirect page | Tracking and redirect only. No ranking role. |
| `/app/**`, `/admin/**`, `/api/admin/**` | Admin/private page | Internal tools only. No ranking role. |
| Public `/api/**` | Utility/redirect page | JSON backing services, not HTML SEO pages. |

## Recommended Indexability Rules For Later Phases

Do not implement these in Phase 2. Use this as a later-phase plan.

| Route pattern | Recommendation | Canonical target | Sitemap recommendation | Notes |
| --- | --- | --- | --- | --- |
| `/` | `index/follow` | `/` | Include | Keep as site hub. |
| `/offers` | `index/follow` | `/offers` | Include | Consider adding explicit canonical in Phase 3. |
| `/offers/[slug]` | Usually `index/follow` for live comparison; consider `noindex/follow` for thin or duplicate pages | Self unless a page is thin and better represented by `/games/[slug]` | Include only if game has active public offers and meaningful comparison content | Do not make this the primary canonical for broad game SEO unless it has unique conversion-only intent. |
| `/offers/gain/us`, `/offers/gain/us/[wall]`, `/offers/gemsloot/us`, `/offers/gemsloot/us/[provider]` | `index/follow` only when the slice has enough live offers; otherwise `noindex/follow` | Self for substantial slices; parent platform page for thin slices | Include only substantial slices | Add quality gates later. |
| `/games` | `index/follow` | `/games` | Include | Currently not in sitemap; add later if no issue is found. |
| `/games/[slug]` | `index/follow` | Self | Include when game has public offers, good metadata, and enough content | Main ranking route for game-offer intent. |
| `/guides` | `index/follow` | `/guides` | Include | Consider explicit canonical. |
| `/guides/[slug]` | `index/follow` for published, quality guides | Self after redirect mapping | Include only published guides that pass readiness gates | Main ranking route for curated guide intent. |
| `/guides/how-to-earn` | `index/follow` if kept as a useful generated hub | `/guides/how-to-earn` | Include only if hub stays useful | Avoid competing with `/guides`. |
| `/guides/how-to-earn/[slug]` | Conditional: `index/follow` only with unique content and no stronger curated guide; otherwise `noindex/follow` or canonicalize | Prefer curated `/guides/[slug]` for guide intent, or `/games/[slug]` for offer-comparison intent | Exclude thin/duplicative generated pages | Biggest later-phase cleanup target. |
| `/blog` and `/blog/[slug]` | `index/follow` for published editorial content | Self | Include published posts | Add/confirm explicit canonicals. |
| `/reviews` and `/review/[slug]` | `index/follow` | Self | Include review hub and published reviews | Keep `/review/[slug]` singular as canonical detail route unless URL strategy changes. |
| `/best-gpt-sites` | `index/follow` | Self | Include | Main platform-comparison landing page. |
| `/highest-paying-gpt-games`, `/best-freecash-games`, `/best-gain-gg-offers`, `/best-money-making-games` | `index/follow` when curated copy and tables are substantial | Self | Include | Add thin-page guard if the filtered offer table is empty. |
| `/go/**` | `noindex/follow` or blocked utility behavior | None | Exclude | Keep disallowed in robots and avoid adding HTML route behavior. |
| `/app/**`, `/admin/**`, `/api/admin/**` | `noindex/follow` or private/auth-only | None | Exclude | Keep private. Consider explicit metadata on any HTML admin shell if needed. |
| Public `/api/**` | Not indexable HTML | None | Exclude | Keep as JSON support routes. |

## Cannibalization Map

| Conflict | Current risk | Recommended main ranking page | Supporting role |
| --- | --- | --- | --- |
| `/games/[slug]` vs `/offers/[slug]` | Both target game plus offer/payout terms. `/games/[slug]` is SEO copy plus provider comparison; `/offers/[slug]` is a live conversion table. | `/games/[slug]` for "best [game] offers", "[game] GPT offer", "[game] offerwall payout". | `/offers/[slug]` should remain the live comparison/conversion page linked from `/games/[slug]`. |
| `/games/[slug]` vs `/guides/how-to-earn/[slug]` | Both are generated from the same game offer data and include payout/provider tables. | `/games/[slug]` for offer comparison and payout-route intent. | `/guides/how-to-earn/[slug]` should be indexable only if it adds unique step-by-step guidance. Otherwise use `noindex/follow` or canonical to `/games/[slug]`. |
| `/guides/[slug]` vs `/guides/how-to-earn/[slug]` | Generated guide pages can overlap curated strategy/completion guides for the same game. | `/guides/[slug]` for hand-written strategy, completion, milestone, no-spend, not-crediting, and ROI intent. | `/guides/how-to-earn/[slug]` should support via links, `noindex/follow`, or canonical to the curated guide when one exists and covers the same intent. |
| `/offers/[slug]` vs `/guides/[slug]` | Dynamic offer pages mention guides and payout tasks; curated guides may include offer CTAs. | `/guides/[slug]` for strategy/completion intent; `/offers/[slug]` for live route comparison and conversion intent. | Cross-link both directions with clear anchor text. |
| `/best-gpt-sites` vs `/reviews` | Both cover GPT platform selection. `/best-gpt-sites` is a comparison/list page; `/reviews` is a review index. | `/best-gpt-sites` for "best GPT sites" list/comparison intent. | `/reviews` should rank for "GPT site reviews" and feed platform detail pages. |
| `/best-freecash-games` and `/best-gain-gg-offers` vs provider-specific `/offers/...` pages | Platform best pages and provider/gallery pages can overlap for platform-specific offer terms. | The curated `/best-*` page for list intent; provider `/offers/...` pages for live inventory by provider/wall. | Use explicit metadata and internal links to separate curated recommendations from raw inventory. |
| `/highest-paying-gpt-games` vs `/best-money-making-games` | Both are broad game list pages with similar offer tables. | Keep `/highest-paying-gpt-games` for GPT/offerwall payout intent; keep `/best-money-making-games` for broader money-making games intent only if copy and examples differ. | If content stays too similar, consolidate or differentiate headings, metadata, intro copy, and internal links. |

## Recommended Primary Ranking Routes

- Game offer intent: `/games/[slug]`.
- Live game conversion intent: `/offers/[slug]`.
- Curated game strategy/completion intent: `/guides/[slug]`.
- Generated game support intent: `/guides/how-to-earn/[slug]`, only when unique enough.
- Platform comparison intent: `/best-gpt-sites`.
- Platform review/trust intent: `/review/[slug]`.
- Broad offer search intent: `/offers`.
- Best/list modifier intent: `/highest-paying-gpt-games`, `/best-freecash-games`, `/best-gain-gg-offers`, `/best-money-making-games`.
- Utility redirects: `/go/**`, never a ranking route.
- Admin/private: `/app/**`, `/admin/**`, `/api/admin/**`, never ranking routes.

## Phase 3 Checklist

Canonical and noindex metadata cleanup:

- Add explicit canonical metadata to hub pages that currently rely on defaults, especially `/offers`, `/guides`, `/blog`, and `/reviews`.
- Add route-level robots metadata for pages that should be protected from accidental indexing.
- Add conditional `noindex/follow` for thin generated pages only after defining measurable criteria.
- Keep `/go/**` excluded and do not add public HTML metadata to redirect handlers.
- Confirm `/app/**` private pages cannot surface indexable HTML when unauthenticated redirects happen.

Sitemap quality gates:

- Add gates before including `/offers/[slug]`, `/games/[slug]`, and `/guides/how-to-earn/[slug]`.
- Candidate gates: active public offer count, eligible payout, non-empty provider comparison, valid game slug, non-empty title/description, and freshness thresholds.
- Apply `evaluateIndexingReadiness` or a sibling helper before including curated `/guides/[slug]`.
- Add `/games` to sitemap only after deciding it is a durable index hub.
- Exclude generated guide pages when a stronger curated guide exists for the same game and intent.

Route-level metadata cleanup:

- Standardize canonical construction with `absoluteUrl()` or `buildSeoMetadata`.
- Remove dynamic `new Date().getFullYear()` from metadata if it causes unnecessary metadata churn without content updates.
- Ensure Open Graph `url` matches canonical.
- Ensure not-found metadata does not accidentally create attractive indexable titles for missing content.

## Phase 4 Checklist

Thin-page prevention:

- Define a minimum content bar for generated support pages: unique intro, payout summary, provider comparison, task/milestone content, FAQ, and internal links.
- Prevent empty or near-empty `/best-*` pages from indexing when filters return too few rows.
- Prefer `noindex/follow` over hard 404 for temporarily thin but useful internal support pages.
- Track generated pages that duplicate curated guides by game ID and keyword intent.

Structured data consistency:

- Use BreadcrumbList consistently on indexable detail pages.
- Use ItemList on comparison/list pages with stable item URLs.
- Use Review schema only on platform review pages, not generic offer comparison pages.
- Use FAQPage only when visible FAQ content has real question/answer pairs.
- Add structured-data validation to admin SEO checks before sitemap inclusion.

Internal linking and intent separation:

- Link `/games/[slug]` to `/offers/[slug]` with conversion-oriented anchor text.
- Link `/guides/[slug]` to `/games/[slug]` with comparison-oriented anchor text.
- Link `/guides/how-to-earn/[slug]` to the best curated guide when one exists.
- Keep `/best-gpt-sites` linking to `/reviews` and `/review/[slug]` for trust validation.
- Keep `/reviews` and `/review/[slug]` linking back to `/offers` only when the next step is comparing live offer inventory.
