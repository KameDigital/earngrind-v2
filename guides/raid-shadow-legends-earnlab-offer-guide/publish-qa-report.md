# Publish QA Report

Result: PASS
Route: /guides/raid-shadow-legends-earnlab-offer-guide

Rendered publish QA passed against the local route at `http://127.0.0.1:3001/guides/raid-shadow-legends-earnlab-offer-guide`.

- route_200: PASS - local route returned HTTP 200
- no_noindex: PASS - rendered metadata uses index, follow and HTML contains no noindex
- canonical: PASS - canonical points to `https://earngrind.com/guides/raid-shadow-legends-earnlab-offer-guide`
- one_h1: PASS - exactly one H1 renders
- title_meta: PASS - title and meta description match the regenerated guide
- schema: PASS - JSON-LD renders for Article, BreadcrumbList, and FAQPage
- internal_links: PASS - guide navigation and breadcrumbs render
- cta_links: PASS - `/offers` resolves locally with HTTP 200
- images: PASS - no raster images are required; icons render as inline SVG
- mobile_overflow: PASS - mobile document scroll width equals viewport width
- sitemap: PASS - local `/sitemap/guides.xml` includes the guide URL
- empty_offer_state: PASS - full guide renders with no empty offer state
- content_parity: PASS - rendered total is 372,716 points and the task/model sections match the corrected canonical guide
- section_navigation: PASS - major section navigation is visible
- risk_bands_render: PASS - risk-band economics render
- evidence_support_render: PASS - evidence log and support-state model render
- conditional_models_render: PASS - purchase economics, milestone matrix, random reward model, and terminology map render
- readable_rendered_structure: PASS - desktop and mobile layouts are scannable
- game_detail_sections: PASS - game overview, systems, and mechanic dossiers render
